/* Recoverable prototype cutover. No UI or automatic migration is enabled. */
(function(w){
  'use strict';
  const A=w.App,legacy=A.storage,connections=new Map();let busy=false;
  const account=id=>{if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('Invalid migration account.');return id;};
  const keys=id=>({book:'dukaanos.v2.'+account(id),marker:'dukaanos.repository.'+id,source:'dukaanos.migration-source.'+id,db:'dukaanos-prototype-migration-'+id});
  const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
  function marker(id){
    const k=keys(id),raw=localStorage.getItem(k.marker);if(raw===null)return null;
    let m;try{m=JSON.parse(raw);}catch(_){throw new Error('Migration marker is unreadable. Preserve both copies.');}
    if(!m||m.version!==1||m.accountId!==id||m.database!==k.db||!['copying','verified','active'].includes(m.stage)||!/^[a-f0-9]{64}$/.test(m.sourceHash)||!Number.isSafeInteger(m.at))throw new Error('Migration marker is invalid. Preserve both copies.');
    return m;
  }
  const fence=m=>JSON.stringify({v:3,migration:'indexeddb',sourceHash:m.sourceHash,database:m.database});
  async function repository(id){
    const k=keys(id);
    if(!connections.has(id))connections.set(id,A.repositories.openIndexedDB({name:k.db,allowPrototype:true}).catch(e=>{connections.delete(id);throw e;}));
    return connections.get(id);
  }
  async function dropDatabase(id){
    const k=keys(id);
    if(connections.has(id)){(await connections.get(id)).close();connections.delete(id);}
    await new Promise((resolve,reject)=>{
      const request=indexedDB.deleteDatabase(k.db);
      request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);
      request.onblocked=()=>reject(new Error('Close other repository connections before deleting this account.'));
    });
  }
  async function route(key){
    const match=/^dukaanos\.(?:v2|syncq)\.([A-Za-z0-9_-]+)(?:\.before-restore)?$/.exec(key);
    if(!match)return legacy;
    const id=match[1],m=marker(id);if(!m)return legacy;
    const isFenced=localStorage.getItem(keys(id).book)===fence(m);
    if(m.stage==='active'&&!isFenced)throw new Error('Migration fence is missing or changed. Preserve both copies; do not reopen the old book.');
    if(isFenced){
      if(m.stage==='copying')throw new Error('Migration was fenced before verification. Preserve both copies.');
      const repo=await repository(id);
      // Never turn a lost destination into an empty shop behind an active marker.
      if(await repo.read(keys(id).book)===null)throw new Error('Migrated book is missing. Restore an encrypted backup; do not fall back to the old source.');
      return repo;
    }
    return legacy;
  }
  A.storage={
    async read(key){return (await route(key)).read(key);},
    async commit(args){return (await route(args.key)).commit(args);},
    async write(key,value){return (await route(key)).write(key,value);},
    async remove(key){return (await route(key)).remove(key);}
  };
  A.migrations={
    busy:()=>busy,
    info(id){const m=marker(id);return m&&localStorage.getItem(keys(id).book)===fence(m)?{...m}:null;},
    async run({allowPrototype=false,accountId=A.accountId,afterStage=async()=>{}}={}){
      if(!allowPrototype)throw new Error('Migration activation awaits independent recovery review.');
      A.requirePermission('settings');A.auth.requireFresh();
      const id=account(accountId),k=keys(id),context=A.context();
      if(id!==A.accountId&&!(id==='local'&&A.auth.currentAccount()?.id===A.accountId&&localStorage.getItem('dukaanos.localOwner')===A.accountId))throw new Error('Migration target is not this account.');
      const guard=()=>{A.assertWriter();if(!A.contextValid(context)||(A.auth.gateOn()&&!A.auth.currentAccount()))throw new Error('Counter changed during migration. Resume after signing in.');};
      busy=true;A.emit('saving',true);
      try{
        let m=marker(id),raw=localStorage.getItem(k.book);
        if(m&&raw===fence(m)){
          const repo=await repository(id),current=await repo.read(k.book);
          if(current===null)throw new Error('Destination is missing; preserve the archive and restore a backup.');
          A.validateData(JSON.parse(current));guard();
          if(m.stage==='copying')throw new Error('Unverified migration fence.');
          m.stage='active';localStorage.setItem(k.marker,JSON.stringify(m));
          for(const extra of [k.book+'.before-restore','dukaanos.syncq.'+id])localStorage.removeItem(extra);
          return {stage:'active',resumed:true,sourceHash:m.sourceHash};
        }
        if(m?.stage==='active')throw new Error('Active migration fence changed. Do not overwrite the destination.');
        if(raw===null)throw new Error('There is no source book to migrate.');
        A.validateData(JSON.parse(raw));const sourceHash=await digest(raw);guard();
        if(m&&m.sourceHash!==sourceHash)throw new Error('Source changed after migration began. Preserve both copies for reconciliation.');
        localStorage.setItem(k.source,raw);
        if(localStorage.getItem(k.source)!==raw)throw new Error('Source archive verification failed.');
        await afterStage('archive');guard();
        m=m||{version:1,accountId:id,database:k.db,sourceHash,at:Date.now(),stage:'copying'};
        localStorage.setItem(k.marker,JSON.stringify(m));await afterStage('marker');guard();
        const repo=await repository(id),current=await repo.read(k.book);
        if(current!==null&&current!==raw)throw new Error('Destination differs from the source. Preserve both copies for reconciliation.');
        await repo.commit({key:k.book,expected:current,value:raw,operationId:'opening_'+sourceHash.slice(0,40),guard});
        for(const extra of [k.book+'.before-restore','dukaanos.syncq.'+id]){
          const value=localStorage.getItem(extra);if(value!==null){await repo.write(extra,value);if(await repo.read(extra)!==value)throw new Error('Auxiliary copy verification failed.');}
        }
        await afterStage('copy');guard();
        if(await repo.read(k.book)!==raw||JSON.stringify(JSON.parse(await repo.rebuild(k.book)))!==JSON.stringify(JSON.parse(raw)))throw new Error('Destination/replay verification failed.');
        m.stage='verified';localStorage.setItem(k.marker,JSON.stringify(m));await afterStage('verified');guard();
        if(localStorage.getItem(k.book)!==raw)throw new Error('Source changed before cutover.');
        localStorage.setItem(k.book,fence(m));await afterStage('fence');guard();
        m.stage='active';localStorage.setItem(k.marker,JSON.stringify(m));
        for(const extra of [k.book+'.before-restore','dukaanos.syncq.'+id])localStorage.removeItem(extra);
        await afterStage('active');
        return {stage:'active',resumed:false,sourceHash};
      }finally{busy=false;A.emit('saving',false);}
    },
    async destroyAccount(id){
      const k=keys(id),m=marker(id);if(!m&&!localStorage.getItem(k.source))return;
      A.assertWriter();
      await dropDatabase(id);
      localStorage.removeItem(k.source);localStorage.removeItem(k.book);localStorage.removeItem(k.marker);
    },
    async cancelBeforeCutover(){
      A.requirePermission('settings');A.auth.requireFresh();
      const id=account(A.accountId),k=keys(id),m=marker(id),raw=localStorage.getItem(k.book);
      if(m&&(m.stage==='active'||raw===fence(m)))throw new Error('Cutover already occurred. Preserve the current book and restore forwards, never swap to the old source.');
      if(raw===null)throw new Error('Source is missing. Preserve both copies.');
      A.validateData(JSON.parse(raw));const context=A.context();busy=true;A.emit('saving',true);
      try{
        await dropDatabase(id);A.assertWriter();
        if(!A.contextValid(context)||localStorage.getItem(k.book)!==raw)throw new Error('Source changed during cancellation. Preserve both copies.');
        localStorage.removeItem(k.marker);localStorage.removeItem(k.source);
      }finally{busy=false;A.emit('saving',false);}
    }
  };
})(window);
