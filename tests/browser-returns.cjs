const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),{chromium}=require('playwright');
async function ready(p){await p.waitForFunction(()=>window.App&&!document.querySelector('#shell').hidden&&!App.isSaving());}
async function main(){
 const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const url=await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',b=>resolve(String(b).match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const results=[];
  for(const repository of ['legacy','indexeddb']){
   const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await ready(p);
   await p.evaluate(async repository=>{App.DB().settings.seenSummaryOn=App.dayKey(Date.now());App.DB().settings.gstEnabled=true;App.DB().items.push({id:'return_item',name:'Synthetic return item',storeId:App.S(),price:100,cost:60,stock:10,batches:[],gst:5});await App.save();if(repository==='indexeddb')await App.migrations.run({allowPrototype:true});const b=await App.actions.checkout({lines:[{itemId:'return_item',qty:2,price:100}],discount:20,mode:'cash'});App.showReceipt(b);},repository);
   await p.getByRole('button',{name:'Return / refunds',exact:true}).click();await p.locator('#returnQty0').fill('1');await p.locator('#returnDisposition').selectOption('quarantine');await p.locator('#returnReason').fill('Damaged product received');await p.getByRole('button',{name:'Record return',exact:true}).click();
   await p.waitForFunction(()=>App.returns().length===1&&!App.isSaving()&&!document.querySelector('.modal.out'));
   assert.deepEqual(await p.evaluate(()=>[App.returns()[0].amount,App.returns()[0].tax,App.itemStock(App.item('return_item')),App.sellableStock(App.item('return_item')),App.stats.cashExpected().net]),[94.5,4.5,9,8,189]);
   if(process.env.AUDIT_SCREENSHOT&&repository==='legacy')await p.screenshot({path:process.env.AUDIT_SCREENSHOT,animations:'disabled'});
   const download=p.waitForEvent('download');await p.getByRole('button',{name:'Download return note',exact:true}).click();const stream=await(await download).createReadStream();let note='';for await(const b of stream)note+=b;assert.match(note,/94\.50/);assert.match(note,/quarantine/);
   await p.getByRole('button',{name:'Record refund paid',exact:true}).click();await p.locator('#refundReference').fill('Cash handover receipt');await p.getByRole('button',{name:'Save refund',exact:true}).click();
   await p.waitForFunction(()=>App.refunds().length===1&&!App.isSaving());await p.reload();await ready(p);
   assert.deepEqual(await p.evaluate(()=>[App.stats.cashExpected().net,App.stats.today().sales,App.gstBreakdown(App.liveBills(),App.returns())[5].tax,App.returnRefundDue(App.returns()[0])]),[94.5,94.5,4.5,0]);
   results.push(repository+': partial-return and cash-refund UI preserve original tax, quarantine stock, note download and remaining cash after restart');
   await p.evaluate(()=>App.go('reports'));await p.getByText('Cash refunds paid',{exact:true}).waitFor();
   assert.equal(await p.evaluate(()=>Array.from(document.querySelectorAll('rect.c-bar')).every(r=>Number(r.getAttribute('height'))>=0)),true);assert.deepEqual(errors,[]);await context.close();
  }
  console.log(JSON.stringify({browser:browser.version(),checks:results.length,results},null,2));
 }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
