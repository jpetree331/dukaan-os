const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item,cart}=require('./harness.cjs');

test('BUILD-05: draft resumes; checkout consumes it once and retains receipt identity',async()=>{
 const h=await create(),A=h.A,i=item(A,{unit:'kg'});A.DB().settings.shopName='Original Shop';await A.save();
 await A.posAdd(i.id,1.25);const first=A.drafts.current();assert.equal(first.cart.lines[0].qty,1.25);assert.equal(i.stock,10);
 const reopened=await create(h.storage),B=reopened.A;B.views.billing(reopened.node('main'));
 const d=B.drafts.current(),request={...JSON.parse(JSON.stringify(d.cart)),draftId:d.id};
 const bill=await B.actions.checkout(request);assert.equal(bill.total,125);assert.equal(B.item(i.id).stock,8.75);assert.equal(B.drafts.current(),undefined);
 const retry=await B.actions.checkout(request);assert.equal(retry.id,bill.id);assert.equal(B.DB().bills.length,1);
 B.DB().settings.shopName='Changed Shop';B.DB().settings.currency='$';B.item(i.id).unit='piece';B.item(i.id).price=999;await B.save();
 assert.match(B.billText(bill),/Original Shop/);assert.doesNotMatch(B.billText(bill),/Changed Shop|\$/);assert.equal(bill.lines[0].unit,'kg');
 assert.equal(B.returnableLines(bill)[0].qty,1.25);await B.actions.voidBill(bill.id);assert.equal(B.returnableLines(B.DB().bills[0])[0].qty,0);
 await assert.rejects(()=>B.actions.checkout({...request,mode:'card'}),/differs/);
});

test('BUILD-05: draft scope isolates staff/store and stale selections cannot charge',async()=>{
 const {A}=await create(),i=item(A);await A.save();await A.posAdd(i.id,1);const saved=A.drafts.current();
 A.DB().staff.push({id:'cashier',role:'cashier',name:'Cashier',active:true});A.DB().session.staffId='cashier';await A.save();
 assert.equal(A.drafts.current(),undefined);await assert.rejects(()=>A.actions.checkout({...saved.cart,draftId:saved.id}),/Draft changed/);
 A.DB().session.staffId='sf_owner';A.DB().settings.gstEnabled=true;await A.save();
 await assert.rejects(()=>A.actions.checkout({...saved.cart,draftId:saved.id}),/changed price, tax or units/);
 assert.equal(A.DB().bills.length,0);assert.equal(A.item(i.id).stock,10);assert.equal(A.drafts.current().id,saved.id);
});

test('BUILD-05: failed sale retains draft and failed draft edit retains previous version',async()=>{
 const {A}=await create(),i=item(A);await A.save();await A.posAdd(i.id,1);const d=JSON.parse(JSON.stringify(A.drafts.current())),commit=A.storage.commit;
 A.storage.commit=async()=>{throw new Error('Injected persistence failure');};
 await assert.rejects(()=>A.actions.checkout({...d.cart,draftId:d.id}),/Injected/);
 assert.equal(A.DB().bills.length,0);assert.equal(A.drafts.current().id,d.id);assert.equal(A.item(i.id).stock,10);
 await assert.rejects(()=>A.drafts.save({...d.cart,discount:5}),/Injected/);assert.equal(A.drafts.current().revision,d.revision);
 A.storage.commit=commit;await A.actions.checkout({...d.cart,draftId:d.id});assert.equal(A.DB().bills.length,1);
});
