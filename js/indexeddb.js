/* Disabled repository prototype. No normal startup opens or migrates this database. */
(function (w) {
  'use strict';
  const App=w.App=w.App||{};
  App.features=Object.freeze({indexedDB:false});
  const clone=x=>JSON.parse(JSON.stringify(x));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function patches(before,after,path=[]) {
    if(same(before,after))return [];
    if(Array.isArray(before)&&Array.isArray(after)) {
      if(before.length===after.length)return before.flatMap((x,i)=>patches(x,after[i],[...path,i]));
      let first=0,last=0;
      while(first<before.length&&first<after.length&&same(before[first],after[first]))first++;
      while(last<before.length-first&&last<after.length-first&&same(before[before.length-1-last],after[after.length-1-last]))last++;
      return [{path,splice:[first,before.length-first-last,clone(after.slice(first,after.length-last))]}];
    }
    if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after)) {
      const out=[];
      for(const k of Object.keys(before))if(!(k in after))out.push({path:[...path,k],remove:true});
      for(const k of Object.keys(after))out.push(...patches(before[k],after[k],[...path,k]));
      return out;
    }
    return [{path,value:clone(after)}];
  }
  function apply(before,changes) {
    let out=before==null?null:clone(before);
    for(const p of changes){
      if(!Array.isArray(p.path)||p.path.some(k=>(typeof k!=='string'&&!Number.isSafeInteger(k))||['__proto__','prototype','constructor'].includes(k)))throw new Error('Invalid journal path.');
      if(!p.path.length && !p.splice){out=clone(p.value);continue;}
      let parent=out;
      const steps=p.splice?p.path:p.path.slice(0,-1);
      for(const k of steps)parent=parent[k];
      if(p.splice)parent.splice(p.splice[0],p.splice[1],...clone(p.splice[2]));
      else if(p.remove)delete parent[p.path[p.path.length-1]];
      else parent[p.path[p.path.length-1]]=clone(p.value);
    }
    return out;
  }
  async function hash(value) {
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  }
  const validKey=key=>{if(typeof key!=='string'||!/^dukaanos\.(v2|syncq)\.[A-Za-z0-9_.-]{1,150}$/.test(key))throw new Error('Invalid repository key.');};
  const isBook=key=>/^dukaanos\.v2\.[A-Za-z0-9_-]+$/.test(key);
  App.repositories=App.repositories||{};
  App.repositories.openIndexedDB=async function ({name,allowPrototype=false}={}) {
    if(!allowPrototype || !/^dukaanos-prototype-[A-Za-z0-9_-]+$/.test(name||''))throw new Error('IndexedDB activation requires the later migration gate.');
    const db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open(name,1);let rejected=false;
      request.onupgradeneeded=()=>{
        const d=request.result;
        d.createObjectStore('records',{keyPath:'key'});
        d.createObjectStore('commands',{keyPath:['key','id']});
        d.createObjectStore('journal',{keyPath:['key','revision']});
      };
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>{rejected=true;reject(new Error('Close other connections before opening the repository.'));};
      request.onsuccess=()=>{if(rejected)request.result.close();else resolve(request.result);};
    });
    let closed=false;db.onversionchange=()=>{closed=true;db.close();};
    const tx=(stores,mode)=>{
      if(closed)throw new Error('Repository connection was closed. Reopen it before saving.');
      return db.transaction(stores,mode,mode==='readwrite'?{durability:'strict'}:{});
    };
    async function read(key) {
      validKey(key);
      return new Promise((resolve,reject)=>{
        const t=tx(['records'],'readonly'),request=t.objectStore('records').get(key);let value=null;
        request.onsuccess=()=>{value=request.result?.value??null;};
        t.oncomplete=()=>resolve(value);t.onabort=()=>reject(t.error||new Error('Read aborted.'));
      });
    }
    async function commit({key,expected,value,guard,operationId}) {
      validKey(key);if(typeof guard!=='function')throw new Error('A commit guard is required.');
      if(value!==null&&typeof value!=='string')throw new Error('Repository values must be serialized records.');
      if(isBook(key)&&value!==null)App.validateData(JSON.parse(value));
      const id=operationId||'cmd_'+crypto.randomUUID().replace(/-/g,'');
      if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('Invalid operation ID.');
      const digest=await hash(JSON.stringify({key,value}));
      // Journal only validated books; auxiliary queue/checkpoint strings use a root replacement.
      const changes=isBook(key)&&value!==null?patches(expected===null?null:JSON.parse(expected),JSON.parse(value)):[{path:[],value}];
      return new Promise((resolve,reject)=>{
        const t=tx(['records','commands','journal'],'readwrite');
        const records=t.objectStore('records'),commands=t.objectStore('commands'),journal=t.objectStore('journal');
        let failure,result,record,prior,reads=0;
        const abort=e=>{failure=e;try{t.abort();}catch(_){};};
        t.onabort=()=>reject(failure||t.error||new Error('Transaction aborted.'));
        t.oncomplete=()=>resolve(result);
        const finish=()=>{
          if(++reads!==2)return;
          try{
            guard();
            const current=record?.value??null;
            if(prior){
              if(prior.digest!==digest)throw new Error('Operation ID was reused for different contents.');
              if(current!==value)throw new Error('Operation already committed; reload the current book before retrying.');
              result={duplicate:true,revision:prior.revision};return;
            }
            if(current!==expected)throw new Error('Shop data changed. Reload before saving.');
            const revision=(record?.revision||0)+1;
            commands.add({key,id,digest,revision});
            journal.add({version:1,key,revision,operationId:id,changes,deleted:value===null});
            records.put({key,value,revision});
            result={duplicate:false,revision};
          }catch(e){abort(e);}
        };
        const r=records.get(key);r.onsuccess=()=>{record=r.result;finish();};
        const c=commands.get([key,id]);c.onsuccess=()=>{prior=c.result;finish();};
      });
    }
    async function rebuild(key) {
      validKey(key);
      return new Promise((resolve,reject)=>{
        const t=tx(['journal'],'readonly');let book=null,next=1,failure;
        const req=t.objectStore('journal').openCursor(IDBKeyRange.bound([key,0],[key,Number.MAX_SAFE_INTEGER]));
        req.onsuccess=()=>{
          const cursor=req.result;if(!cursor)return;
          try{
            const entry=cursor.value;
            if(entry.version!==1)throw new Error('Unsupported journal version.');
            if(entry.revision!==next++)throw new Error('Journal revision gap.');
            book=entry.deleted?null:apply(book,entry.changes);cursor.continue();
          }catch(e){failure=e;t.abort();}
        };
        t.oncomplete=()=>{
          try { if(book!==null&&isBook(key))App.validateData(book);resolve(book===null?null:isBook(key)?JSON.stringify(book):book); }
          catch(e){reject(e);}
        };
        t.onabort=()=>reject(failure||t.error||new Error('Journal rebuild aborted.'));
      });
    }
    return Object.freeze({read,commit,rebuild,
      async write(key,value){return commit({key,expected:await read(key),value,guard:()=>App.assertWriter()});},
      async remove(key){return commit({key,expected:await read(key),value:null,guard:()=>App.assertWriter()});},
      close(){closed=true;db.close();}
    });
  };
})(window);
