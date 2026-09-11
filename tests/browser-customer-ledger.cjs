const assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OLD='1e43d8fa2f850e97547c92a4dc05cff31243aae5';
async function ready(p){await p.waitForFunction(()=>window.App&&!document.querySelector('#shell').hidden&&!App.isSaving()&&!document.querySelector(".modal.out"));}
async function main(){
 const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const url=await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',b=>resolve(String(b).match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const results=[];
  for(const repository of ['legacy','indexeddb']){
   const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await ready(p);
   await p.evaluate(async repository=>{App.DB().settings.seenSummaryOn=App.dayKey(Date.now());App.DB().customers.push({id:'ledger_customer',name:'Synthetic ledger customer',storeId:App.S(),balance:0,points:0});App.DB().items.push({id:'ledger_item',name:'Synthetic item',storeId:App.S(),price:100,cost:60,stock:10,batches:[],gst:5});await App.save();if(repository==='indexeddb')await App.migrations.run({allowPrototype:true});App.customerDetail('ledger_customer');},repository);
   await p.locator('#dOpening').click();await p.locator('#entryAmount').fill('50');await p.locator('#entryNote').fill('Opening debt');await p.locator('.modal').filter({has:p.locator('#entryAmount')}).getByRole('button',{name:'Save',exact:true}).click();
   await p.waitForFunction(()=>App.customer('ledger_customer').balance===50&&!App.isSaving()&&!document.querySelector(".modal.out"));
   await p.evaluate(async()=>{await App.actions.checkout({lines:[{itemId:'ledger_item',qty:1,price:100}],customerId:'ledger_customer',mode:'credit'});App.settleCustomer('ledger_customer');});
   await p.locator('#collectionMode').selectOption('upi');const billId=await p.evaluate(()=>App.DB().bills[0].id);await p.locator('#collectionBill').selectOption(billId);await p.locator('[data-q="100"]').click();await p.locator('.modal').filter({has:p.locator('#collectionMode')}).locator('.modal-foot .ok').click();
   await p.waitForFunction(()=>App.customer('ledger_customer').balance===50&&!App.isSaving()&&!document.querySelector(".modal.out"));
   await p.evaluate(()=>App.customerEntryDialog('ledger_customer','advance'));await p.locator('#entryAmount').fill('100');await p.locator('#entryNote').fill('Cash advance');await p.locator('.modal').filter({has:p.locator('#entryAmount')}).getByRole('button',{name:'Save',exact:true}).click();
   await p.waitForFunction(()=>App.customer('ledger_customer').balance===-50&&!App.isSaving()&&!document.querySelector(".modal.out"));
   await p.evaluate(()=>App.customerEntryDialog('ledger_customer','correction'));await p.locator('#entryAmount').fill('5');await p.locator('#entryNote').fill('Documented correction');await p.locator('.modal').filter({has:p.locator('#entryAmount')}).getByRole('button',{name:'Save',exact:true}).click();
   await p.waitForFunction(()=>App.customer('ledger_customer').balance===-45&&!App.isSaving()&&!document.querySelector(".modal.out"));await p.reload();await ready(p);
   assert.deepEqual(await p.evaluate(()=>[App.customerStatement('ledger_customer').balance,App.customer('ledger_customer').balance,App.stats.cashExpected().payCash,App.DB().payments.find(p=>p.kind==='collection').mode]),[-45,-45,100,'upi']);
   results.push(repository+': UI opening + credit sale - linked UPI collection - cash advance + correction = -45; cash = 100 after reload');
   await p.evaluate(()=>App.customerDetail('ledger_customer'));const download=p.waitForEvent('download');await p.locator('#dStatementCsv').click();const dl=await download;const stream=await dl.createReadStream();let csv='';for await(const part of stream)csv+=part;
   assert.equal(csv.trim().split(/\r?\n/).length,6);assert.match(csv,/opening/);assert.match(csv,/-45/);assert.match(csv,/Documented correction/);
   results.push(repository+': balance CSV includes opening, sale, collection, advance, correction and reconciled balance');
   if(repository==='indexeddb'){
     assert.equal(await p.evaluate(async()=>{const m=App.migrations.info(App.accountId),repo=await App.repositories.openIndexedDB({name:m.database,allowPrototype:true}),key='dukaanos.v2.'+App.accountId;try{return JSON.stringify(JSON.parse(await repo.rebuild(key)))===JSON.stringify(JSON.parse(await repo.read(key)));}finally{repo.close();}}),true);
     results.push('indexeddb: customer ledger projection equals replay after the whole UI journey');
   }else{
     const before=await p.evaluate(()=>localStorage.getItem('dukaanos.v2.local'));await p.close();const old=await context.newPage();
     const read=file=>execFileSync('git',['-c','safe.directory='+ROOT.replace(/\\/g,'/'),'show',OLD+':'+file],{cwd:ROOT,encoding:'utf8'}),index=read('index.html'),assets=new Map([['index.html',index],['css/app.css',read('css/app.css')]]);
     for(const match of index.matchAll(/<script src="([^"]+)"/g))assets.set(match[1],read(match[1]));
     await old.route('**/*',route=>{const f=new URL(route.request().url()).pathname.slice(1)||'index.html';return assets.has(f)?route.fulfill({status:200,contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html',body:assets.get(f)}):route.continue();});
     await old.goto(url);await old.getByRole('heading',{name:'Counter could not open'}).waitFor();assert.equal(await old.evaluate(()=>localStorage.getItem('dukaanos.v2.local')),before);
     results.push('legacy: actual BUILD-05 client rejects the ledger version marker without changing the book');
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(JSON.stringify({browser:browser.version(),checks:results.length,results},null,2));
 }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
