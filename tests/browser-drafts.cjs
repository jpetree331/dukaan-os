const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),{chromium}=require('playwright');
async function ready(p){await p.waitForFunction(()=>window.App&&!document.querySelector('#shell').hidden&&!App.isSaving());}
async function main(){
 const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const url=await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',b=>resolve(String(b).match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const results=[];
  for(const repository of ['legacy','indexeddb']){
   const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await ready(p);
   await p.evaluate(async repository=>{App.DB().settings.seenSummaryOn=App.dayKey(Date.now());App.DB().settings.shopName='Original Shop';App.DB().items.push({id:'draft_item',name:'Synthetic rice',storeId:App.S(),price:80,cost:60,stock:10,batches:[],gst:5,unit:'kg'});await App.save();if(repository==='indexeddb')await App.migrations.run({allowPrototype:true});App.go('billing');},repository);
   await p.locator('[data-add="draft_item"]').first().click();await p.evaluate(()=>App.posFlush());
   const request=await p.evaluate(()=>{const d=App.drafts.current();return {...d.cart,draftId:d.id};});
   await p.reload();await ready(p);assert.equal(await p.evaluate(()=>App.cart.lines[0].qty),1);assert.equal(await p.evaluate(()=>App.DB().bills.length),0);
   results.push(repository+': saved cart resumes through normal UI without a bill');
   await p.evaluate(async()=>{App.DB().items[0].price=90;await App.save();});
   await p.locator('#charge').click();await p.getByText(/has a new price/).waitFor();assert.equal(await p.evaluate(()=>App.DB().bills.length),0);
   await p.locator('[data-dec="draft_item"]').click();await p.evaluate(()=>App.posFlush());await p.locator('[data-add="draft_item"]').first().click();await p.evaluate(()=>App.posFlush());
   const freshRequest=await p.evaluate(()=>{const d=App.drafts.current();return {...d.cart,draftId:d.id};});
   await p.locator('#charge').click();await p.locator('.receipt-prev').waitFor();
   const original=await p.evaluate(()=>({text:App.billText(App.DB().bills[0]),image:App.receiptCanvas(App.DB().bills[0]).toDataURL()}));
   await p.reload();await ready(p);assert.deepEqual(await p.evaluate(()=>[App.cart.lines.length,App.DB().bills.length,App.DB().items[0].stock]),[0,1,9]);
   await p.evaluate(async request=>{await App.actions.checkout(request);},freshRequest);assert.equal(await p.evaluate(()=>App.DB().bills.length),1);
   results.push(repository+': stale price rejects; reviewed sale survives restart and retry exactly once');
   await p.evaluate(async()=>{Object.assign(App.DB().settings,{shopName:'Later Shop',shopPhone:'1234567890',address:'Changed address',currency:'$',receiptTheme:'ink'});await App.save();});
   const reprint=await p.evaluate(()=>({text:App.billText(App.DB().bills[0]),image:App.receiptCanvas(App.DB().bills[0]).toDataURL()}));assert.deepEqual(reprint,original);
   results.push(repository+': reprinted receipt pixels and text remain identical after shop changes');
   await p.locator('[data-add="draft_item"]').first().click();await p.evaluate(()=>App.posFlush());
   const retained=await p.evaluate(async()=>{
     const id=App.drafts.current().id;
     App.DB().staff.push({id:'draft_cashier',name:'Draft cashier',role:'cashier',active:true,pin:''});
     App.DB().stores.push({id:'draft_branch',name:'Draft branch'});await App.save();
     App.invalidateContext();App.DB().session.staffId='draft_cashier';await App.save();App.go('billing');
     if(App.cart.lines.length||App.drafts.current())throw new Error('Another staff inherited a draft');
     App.invalidateContext();App.DB().session.staffId='sf_owner';App.DB().settings.activeStore='draft_branch';await App.save();App.go('billing');
     if(App.cart.lines.length||App.drafts.current())throw new Error('Another store inherited a draft');
     App.invalidateContext();App.DB().settings.activeStore='st_main';await App.save();App.go('billing');
     if(App.cart.draftId!==id)throw new Error('Returning to owner/store lost the draft');
     await App.migrations.run({allowPrototype:true});
     const account=await App.auth.signUp({username:'draft_owner',password:'Synthetic-draft-owner',confirm:'Synthetic-draft-owner',shopName:'Draft shop'});
     await App.auth.enableGate(account.id);if(App.drafts.current()?.id!==id)throw new Error('Login transfer lost draft ownership');
     await App.auth.disableGate();if(App.drafts.current()?.id!==id)throw new Error('Login disable lost draft ownership');return id;
   });
   await p.reload();await ready(p);assert.equal(await p.evaluate(()=>App.cart.draftId),retained);
   results.push(repository+': staff/store isolation, migration and login transitions retain the correct draft');
   assert.notEqual(request.draftId,freshRequest.draftId);assert.deepEqual(errors,[]);await context.close();
  }
  console.log(JSON.stringify({browser:browser.version(),checks:results.length,results},null,2));
 }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
