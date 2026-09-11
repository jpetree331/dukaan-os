/* VERIFY-04 probes use actual pre-migration source from the retained Git checkpoint. */
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OLD='f292518b89ca6f78f8b1b8fcce040cb5f635ccd0';
const oldFile=file=>execFileSync('git',['-c','safe.directory='+ROOT.replace(/\\/g,'/'),'show',OLD+':'+file],{cwd:ROOT,encoding:'utf8'});
async function ready(p){await p.waitForFunction(()=>window.App&&!document.querySelector('#shell').hidden);}
async function main(){
 const server=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const url=await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',b=>resolve(String(b).match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const oldIndex=oldFile('index.html'),oldAssets=new Map([['index.html',oldIndex],['css/app.css',oldFile('css/app.css')]]);
  for(const m of oldIndex.matchAll(/<script src="([^"]+)"/g))oldAssets.set(m[1],oldFile(m[1]));
  let backup;const results=[];
  for(const stage of ['archive','marker','copy','verified','fence','active']){
   const context=await browser.newContext(),p=await context.newPage();await p.goto(url);await ready(p);
   const opening=await p.evaluate(async stage=>{
    App.DB().settings.seenSummaryOn=App.dayKey(Date.now());
    App.DB().settings.gstEnabled=true;
    App.DB().customers.push({id:'test_customer',storeId:App.S(),name:'Synthetic customer',balance:50,points:10});
    App.DB().items.push({id:'test_item',storeId:App.S(),name:'Synthetic migration item',price:100,cost:60,stock:10,batches:[],gst:5});await App.save();
    await App.actions.checkout({lines:[{itemId:'test_item',price:100,qty:1}],mode:'credit',customerId:'test_customer'});
    const raw=localStorage.getItem('dukaanos.v2.local');
    localStorage.setItem('dukaanos.syncq.local',JSON.stringify([{id:'synthetic_legacy_queue',op:'legacy_unuploaded'}]));
    try{await App.migrations.run({allowPrototype:true,afterStage:async current=>{if(current===stage)throw new Error('Injected interruption');}});throw new Error('Interruption did not run');}
    catch(e){if(e.message!=='Injected interruption')throw e;}
    return raw;
   },stage);
   await p.reload();await ready(p);
   await p.evaluate(async()=>{await App.migrations.run({allowPrototype:true});await App.migrations.run({allowPrototype:true});});
   assert.equal(await p.evaluate(()=>localStorage.getItem('dukaanos.migration-source.local')),opening);
   assert.deepEqual(await p.evaluate(()=>[App.DB().items[0].stock,App.DB().bills.length]),[9,1]);
   assert.deepEqual(await p.evaluate(()=>[App.DB().customers[0].balance,App.DB().customers[0].points,App.DB().bills[0].total]),[155,11,105]);
   await p.evaluate(async()=>{await App.actions.checkout({lines:[{itemId:'test_item',price:100,qty:1}],mode:'cash'});await App.migrations.run({allowPrototype:true});});
   assert.deepEqual(await p.evaluate(()=>[App.DB().items[0].stock,App.DB().bills.length]),[8,2]);
   assert.equal(await p.evaluate(()=>App.sync.pending()),1);
   await p.reload();await ready(p);
   assert.deepEqual(await p.evaluate(()=>[App.DB().items[0].stock,App.DB().bills.length]),[8,2]);
   results.push(stage+': interruption/reload/two resumes preserve opening and later sales');
   if(stage==='active'){
    backup=await p.evaluate(async()=>App.backups.encrypt(App.backups.capture(),'Synthetic-migration-backup'));
    const fence=await p.evaluate(()=>localStorage.getItem('dukaanos.v2.local'));
    await p.close();const old=await context.newPage();
    await old.route('**/*',route=>{
     const file=new URL(route.request().url()).pathname.slice(1)||'index.html';
     if(oldAssets.has(file))return route.fulfill({status:200,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:oldAssets.get(file)});
     return route.continue();
    });
    await old.goto(url);await old.getByRole('heading',{name:'Counter could not open'}).waitFor();
    assert.equal(await old.evaluate(()=>localStorage.getItem('dukaanos.v2.local')),fence);
    await old.close();const current=await context.newPage();await current.goto(url);await ready(current);
    assert.deepEqual(await current.evaluate(()=>[App.DB().items[0].stock,App.DB().bills.length]),[8,2]);
    results.push('actual VERIFY-03 client rejects fence without changing the migrated book');
    await current.evaluate(async()=>{
      const credentials={username:'synthetic_migration',password:'Synthetic-migration-owner',confirm:'Synthetic-migration-owner',shopName:'Synthetic'};
      const account=await App.auth.signUp(credentials);await App.auth.enableGate(account.id);
      if(!App.migrations.info(account.id)||App.DB().bills.length!==2)throw new Error('Login migration downgraded/lost the book');
      await App.auth.disableGate();
      if(!App.migrations.info('local')||App.DB().bills.length!==2)throw new Error('Disabling login downgraded/lost the book');
      await App.auth.deleteAccount(account.id,credentials.password);
    });
    assert.equal(await current.evaluate(()=>localStorage.getItem('dukaanos.migration-source.local')),null);
    assert.equal(await current.evaluate(()=>localStorage.getItem('dukaanos.repository.local')),null);
    assert.equal(await current.evaluate(async()=>(await indexedDB.databases()).some(d=>d.name==='dukaanos-prototype-migration-local')),false);
    results.push('account deletion removes archive, marker, source and journal database');
    results.push('enable/disable login keeps journal storage and current records before owned-copy deletion');
   }
   await context.close();
  }
  const fresh=await browser.newContext(),r=await fresh.newPage();await r.goto(url);await ready(r);
  await r.evaluate(()=>{App.DB().settings.seenSummaryOn=App.dayKey(Date.now());App.go('settings');});
  await r.locator('#impFile').setInputFiles({name:'synthetic-migrated.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  const modal=r.locator('.modal').filter({has:r.getByText('Open encrypted backup',{exact:true})});
  await modal.locator('input').fill('Synthetic-migration-backup');await modal.getByRole('button',{name:'Save',exact:true}).click();
  await r.locator('.modal-foot').getByRole('button',{name:'Restore',exact:true}).click();
  await r.waitForEvent('load');await ready(r);
  assert.deepEqual(await r.evaluate(()=>[App.DB().items[0].stock,App.DB().bills.length,App.DB().settings.restoredCheckpoint.kind]),[8,2,'snapshot-checkpoint']);
  results.push('encrypted storage-v3 checkpoint restores via file UI to a fresh profile with provenance');
  await r.evaluate(async()=>{
    try{await App.migrations.run({allowPrototype:true,afterStage:async stage=>{if(stage==='copy')throw new Error('Injected pause');}});}catch(e){if(e.message!=='Injected pause')throw e;}
    await App.actions.checkout({lines:[{itemId:'test_item',qty:1,price:100}],mode:'cash'});
    try{await App.migrations.run({allowPrototype:true});throw new Error('Changed source was silently accepted');}catch(e){if(!/Source changed/.test(e.message))throw e;}
    await App.migrations.cancelBeforeCutover();
    if(App.DB().bills.length!==3)throw new Error('Cancellation lost a new sale');
    await App.migrations.run({allowPrototype:true});
    try{await App.migrations.cancelBeforeCutover();throw new Error('Active cutover was cancelled');}catch(e){if(!/Cutover already/.test(e.message))throw e;}
  });
  results.push('changed source requires safe pre-cutover cancellation; active rollback is refused');
  await fresh.close();
  for(const fault of ['foreign-account','archive-quota','bad-marker','changed-fence','missing-destination']){
    const c=await browser.newContext(),p=await c.newPage();await p.goto(url);await ready(p);
    const evidence=await p.evaluate(async fault=>{
      await App.save();const original=localStorage.getItem('dukaanos.v2.local');
      if(fault==='foreign-account'){
        let error;try{await App.migrations.run({allowPrototype:true,accountId:'someone_else'});}catch(e){error=e.message;}
        return {error,preserved:original===localStorage.getItem('dukaanos.v2.local'),foreign:localStorage.getItem('dukaanos.repository.someone_else')};
      }
      if(fault==='archive-quota'){
        const set=Storage.prototype.setItem;let error;
        Storage.prototype.setItem=function(k,v){if(k==='dukaanos.migration-source.local')throw new DOMException('Injected quota','QuotaExceededError');return set.call(this,k,v);};
        try{await App.migrations.run({allowPrototype:true});}catch(e){error=e.name;}finally{Storage.prototype.setItem=set;}
        return {error,preserved:original===localStorage.getItem('dukaanos.v2.local'),marker:localStorage.getItem('dukaanos.repository.local'),busy:App.isSaving()};
      }
      await App.migrations.run({allowPrototype:true});
      const archive=localStorage.getItem('dukaanos.migration-source.local');
      if(fault==='bad-marker')localStorage.setItem('dukaanos.repository.local','{"version":999}');
      if(fault==='changed-fence')localStorage.setItem('dukaanos.v2.local',original);
      if(fault==='missing-destination')await App.storage.remove('dukaanos.v2.local');
      let error;try{await App.storage.read('dukaanos.v2.local');}catch(e){error=e.message;}
      return {error,preserved:archive===localStorage.getItem('dukaanos.migration-source.local')};
    },fault);
    assert.equal(evidence.preserved,true);
    assert.match(evidence.error,{'foreign-account':/not this account/,'archive-quota':/QuotaExceededError/,'bad-marker':/marker is invalid/,'changed-fence':/fence is missing or changed/,'missing-destination':/Migrated book is missing/}[fault]);
    if(fault==='foreign-account')assert.equal(evidence.foreign,null);
    if(fault==='archive-quota'){assert.equal(evidence.marker,null);assert.equal(evidence.busy,false);}
    if(['bad-marker','changed-fence','missing-destination'].includes(fault)){
      await p.reload();await p.getByRole('heading',{name:'Counter could not open'}).waitFor();
      assert.notEqual(await p.evaluate(()=>localStorage.getItem('dukaanos.migration-source.local')),null);
    }
    results.push(fault+': rejects without losing the preserved source');await c.close();
  }
  console.log(JSON.stringify({browser:browser.version(),oldClient:OLD,checks:results.length,results},null,2));
 }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
