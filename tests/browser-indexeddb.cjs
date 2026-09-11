/* BUILD/VERIFY-03: native IndexedDB transactions in a disposable browser profile. */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {chromium}=require('playwright');
async function main(){
  const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
  try{
    const url=await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',b=>resolve(String(b).match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
    const context=await browser.newContext(),p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(url);await p.waitForFunction(()=>window.App&&!document.querySelector('#shell').hidden);
    const results=await p.evaluate(async()=>{
      const A=App,results=[],check=(condition,message)=>{if(!condition)throw new Error(message);};
      const fails=async(fn,pattern)=>{try{await fn();}catch(e){check(pattern.test(e.message),'Unexpected error '+e.message);return;}throw new Error('Expected operation to fail');};
      const original=A.storage,key='dukaanos.v2.local',name='dukaanos-prototype-verification';
      check(A.features.indexedDB===false,'Prototype unexpectedly enabled');
      await fails(()=>A.repositories.openIndexedDB({name}),/migration gate/);
      let repo=await A.repositories.openIndexedDB({name,allowPrototype:true});
      check(A.storage===original,'Opening prototype changed live adapter');
      const d=A.DB();d.settings.seenSummaryOn=A.dayKey(Date.now());
      d.items.push({id:'rice',storeId:A.S(),name:'Synthetic rice',price:80,cost:40,stock:10,gst:5,batches:[]},{id:'soap',storeId:A.S(),name:'Synthetic soap',price:50,cost:20,stock:10,gst:18,batches:[]});
      d.customers.push({id:'customer',storeId:A.S(),name:'Synthetic customer',points:20,balance:0,spend:0,visits:0});
      d.settings.gstEnabled=true;await A.save();const opening=localStorage.getItem(key);
      await repo.write(key,opening);check(await repo.read(key)===opening,'Parity copy changed data');
      results.push('disabled activation and unchanged normal adapter; v2 parity copy');
      const amended=JSON.parse(opening);amended.settings.shopName='Synthetic amended';const next=JSON.stringify(amended);
      const op={key,expected:opening,value:next,operationId:'test_once',guard:()=>A.assertWriter()};
      const first=await repo.commit(op),second=await repo.commit(op);
      check(first.revision===second.revision&&second.duplicate,'Retry did not deduplicate');
      await fails(()=>repo.commit({...op,value:opening}),/reused/);
      await fails(()=>repo.commit({...op,operationId:'stale',expected:null}),/changed/);
      check(await repo.read(key)===next,'Rejected retry altered projection');
      check(JSON.stringify(JSON.parse(await repo.rebuild(key)))===JSON.stringify(JSON.parse(next)),'Rebuild differs');
      results.push('unique operation retry, mismatched reuse and stale snapshot; projection rebuild');
      const beforeFailure=await repo.read(key);
      const nativePut=IDBObjectStore.prototype.put;
      for(const type of ['quota','abort']){
        IDBObjectStore.prototype.put=function(...args){
          const request=nativePut.apply(this,args);
          if(this.name==='records'){
            if(type==='quota')throw new DOMException('Injected quota failure','QuotaExceededError');
            this.transaction.abort();
          }
          return request;
        };
        try{await fails(()=>repo.commit({key,expected:beforeFailure,value:opening,operationId:'failure_'+type,guard:()=>A.assertWriter()}),/quota|abort/i);}
        finally{IDBObjectStore.prototype.put=nativePut;}
        check(await repo.read(key)===beforeFailure,'Partial projection survived '+type);
        check(await repo.rebuild(key)===beforeFailure,'Partial journal survived '+type);
        // Reuse the failed ID with different contents: a leaked command row would reject this.
        await repo.commit({key,expected:beforeFailure,value:beforeFailure,operationId:'failure_'+type,guard:()=>A.assertWriter()});
      }
      results.push('native transaction abort and injected quota error roll back command, journal and projection together');
      repo.close();repo=await A.repositories.openIndexedDB({name,allowPrototype:true});
      check(await repo.read(key)===beforeFailure,'Reopen lost data');
      check(await repo.rebuild(key)===beforeFailure,'Reopen journal differs');
      results.push('connection close/reopen preserves records and rebuild');

      A.storage=repo;await A.boot('local');
      const sale=await A.actions.checkout({lines:[{itemId:'rice',qty:1.25,price:80},{itemId:'soap',qty:2,price:50}],discount:10,redeem:10,customerId:'customer',mode:'credit'});
      check(sale.total===200.7&&A.customer('customer').points===12,'Domain/persistence seam changed money');
      check(A.item('rice').stock===8.75&&A.item('soap').stock===8,'Stock deduction differs');
      await A.actions.voidBill(sale.id);
      check(A.item('rice').stock===10&&A.item('soap').stock===10&&A.customer('customer').points===20,'Void failed to reverse');
      const actual=await repo.read(key),rebuilt=await repo.rebuild(key);
      check(JSON.stringify(JSON.parse(actual))===JSON.stringify(JSON.parse(rebuilt)),'Business projection does not rebuild');
      check(localStorage.getItem(key)===opening,'Prototype changed the local source');
      results.push('BUILD-01 money/quantity and BUILD-02 awaited sale/void integrate with native repository');
      await repo.remove(key);check(await repo.read(key)===null&&await repo.rebuild(key)===null,'Tombstone parity failed');
      await repo.write(key,actual);check(await repo.rebuild(key)===actual,'Recreate after tombstone failed');
      results.push('tombstone and explicit recreation keep journal continuity');
      repo.close();A.storage=original;await A.boot('local');
      return results;
    });
    assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:browser.version(),checks:results.length,results,quota:'Injected QuotaExceededError inside a native transaction; no physical disk exhaustion attempted.'},null,2));
  }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
