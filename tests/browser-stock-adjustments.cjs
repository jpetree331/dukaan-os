const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),{chromium}=require('playwright');
async function ready(p){await p.waitForFunction(()=>window.App&&!document.querySelector('#shell').hidden&&!App.isSaving());}
async function count(p,batch,qty,reason,note){
 await p.getByRole('button',{name:'Count / dispose',exact:true}).click();await p.locator('#adjustBatch').selectOption(batch);await p.locator('#adjustCount').fill(String(qty));await p.locator('#adjustReason').selectOption(reason);await p.locator('#adjustNote').fill(note);await p.getByRole('button',{name:'Record stock adjustment',exact:true}).click();await p.locator('#adjustCount').waitFor({state:'detached'});await ready(p);
}
async function main(){
 const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const url=await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',b=>resolve(String(b).match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const results=[];
  for(const repository of ['legacy','indexeddb']){
   const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await ready(p);
   await p.evaluate(async repository=>{App.DB().settings.seenSummaryOn=App.dayKey(Date.now());App.DB().items.push({id:'count_item',name:'Synthetic counted item',storeId:App.S(),price:100,cost:20,stock:5,batches:[],gst:5});await App.save();if(repository==='indexeddb')await App.migrations.run({allowPrototype:true});await App.actions.restock('count_item',2,'2000-01-01',30);App.go('inventory');},repository);
   await count(p,await p.evaluate(()=>App.item('count_item').batches.find(b=>b.expiry).id),0,'expired','Expired goods disposed');
   await count(p,await p.evaluate(()=>App.item('count_item').batches[0].id),4,'count','Shelf count checked');
   await p.evaluate(async()=>{const b=await App.actions.checkout({lines:[{itemId:'count_item',qty:1,price:100}],mode:'cash'});await App.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],reason:'Damaged package returned',disposition:'quarantine'});App.go('inventory');});
   await count(p,await p.evaluate(()=>App.item('count_item').batches.find(b=>b.quarantined).id),0,'damaged','Broken package disposed');
   await p.getByRole('button',{name:'Stock adjustments',exact:true}).click();await p.getByRole('button',{name:'Reverse adjustment',exact:true}).first().click();const prompt=p.locator('.modal:not(.out)').last();await prompt.locator('input').fill('Disposal recorded by mistake');await prompt.getByRole('button',{name:'Save',exact:true}).click();await p.waitForFunction(()=>App.stockAdjustments().length===4&&!App.isSaving());
   const download=p.waitForEvent('download');await p.locator('.modal:not(.out)').getByRole('button',{name:'Export adjustments CSV',exact:true}).click();const stream=await(await download).createReadStream();let csv='';for await(const b of stream)csv+=b;assert.match(csv,/Expired goods disposed/);assert.match(csv,/Disposal recorded by mistake/);
   if(process.env.AUDIT_SCREENSHOT&&repository==='legacy')await p.screenshot({path:process.env.AUDIT_SCREENSHOT,animations:'disabled'});
   await p.reload();await ready(p);assert.deepEqual(await p.evaluate(()=>[App.itemStock(App.item('count_item')),App.sellableStock(App.item('count_item')),App.stockSummary(App.item('count_item')).quarantine,App.stats.cashExpected().net,App.stats.today().cost]),[4,3,1,100,0]);results.push(repository+': UI expiry disposal, count, quarantine disposal/reversal, full CSV and restart reconcile');
   await p.evaluate(async()=>{await App.migrations.run({allowPrototype:true});const m=App.migrations.info(App.accountId),repo=await App.repositories.openIndexedDB({name:m.database,allowPrototype:true}),key='dukaanos.v2.'+App.accountId;try{if(JSON.stringify(JSON.parse(await repo.rebuild(key)))!==JSON.stringify(JSON.parse(await repo.read(key))))throw new Error('Stock adjustment replay differs');}finally{repo.close();}});await p.reload();await ready(p);assert.equal(await p.evaluate(()=>App.stockAdjustments().length),4);results.push(repository+': adjustment movements and linked reversals survive migration/replay');
   const encrypted=await p.evaluate(()=>App.backups.encrypt(App.backups.capture(),'Synthetic-count-backup')),fresh=await browser.newContext(),q=await fresh.newPage();await q.goto(url);await ready(q);await q.evaluate(async backup=>{await App.restoreBackup(await App.backups.decrypt(backup,'Synthetic-count-backup'));},encrypted);await q.reload();await ready(q);assert.deepEqual(await q.evaluate(()=>[App.stockAdjustments().length,App.itemStock(App.item('count_item')),App.sellableStock(App.item('count_item')),App.stats.cashExpected().net]),[4,4,3,100]);await fresh.close();results.push(repository+': encrypted restore preserves stock classes, values and reversal history');assert.deepEqual(errors,[]);await context.close();
  }
  console.log(JSON.stringify({browser:browser.version(),checks:results.length,results},null,2));
 }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
