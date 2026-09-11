const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item,customer,cart}=require('./harness.cjs');
test('BUILD-06: opening, linked collections, advance and correction reconcile to cash and statement',async()=>{
 const {A,storage}=await create(),c=customer(A),i=item(A);await A.save();
 await A.actions.openingBalance(c.id,50,Date.now()-86400000,'Opening debt',{operationId:'opening_example'});
 const b=await A.actions.checkout(cart(i,{customerId:c.id,mode:'credit'}));assert.equal(c.balance,150);
 await A.actions.takePayment(c.id,40,'cash','Part payment',{operationId:'cash_example',billId:b.id});
 await A.actions.takePayment(c.id,30,'upi','Part payment',{operationId:'upi_example',billId:b.id});
 await A.actions.customerCredit(c.id,100,'cash','Advance',{operationId:'advance_example'});
 await A.actions.correctCustomerBalance(c.id,5,'Documented correction',{operationId:'correction_example'});
 assert.equal(c.balance,-15);assert.equal(A.customerStatement(c.id).balance,-15);assert.equal(A.stats.cashExpected().payCash,140);
 const before=JSON.stringify(A.DB());await A.actions.takePayment(c.id,40,'cash','Part payment',{operationId:'cash_example',billId:b.id});
 assert.equal(JSON.stringify(A.DB()),before);await assert.rejects(()=>A.actions.takePayment(c.id,41,'cash','Part payment',{operationId:'cash_example',billId:b.id}),/already used/);
 const {A:B}=await create(storage);assert.equal(B.customerStatement(c.id).balance,-15);assert.equal(B.customer(c.id).ledger.length,6);
});
test('BUILD-06: checkpoint preserves legacy debt; void is an explicit entry; invalid links and scalar edits reject',async()=>{
 const {A}=await create(),c=customer(A,{balance:25}),other=customer(A),i=item(A);await A.save();
 const bill=await A.actions.checkout(cart(i,{customerId:c.id,mode:'credit'}));assert.equal(c.ledger[0].delta,25);assert.equal(c.ledger[0].source,'legacy-checkpoint');
 await assert.rejects(()=>A.actions.takePayment(other.id,10,'cash','',{billId:bill.id}),/exceeds|link/);
 await A.actions.takePayment(c.id,20,'cash','',{billId:bill.id});await A.actions.voidBill(bill.id,'Wrong sale');
 assert.equal(c.balance,5);assert.deepEqual(Array.from(c.ledger,e=>e.delta),[25,100,-20,-100]);
 const before=JSON.stringify(A.DB());c.balance=999;await assert.rejects(()=>A.save(),/differs from ledger/);assert.equal(JSON.stringify(A.DB()),before);
 await assert.rejects(()=>A.actions.openingBalance(c.id,50,Date.now(),'Overwrite'),/already has history/);
});
test('BUILD-06: failed customer entries are atomic; cashier correction and cross-store collection denied',async()=>{
 const {A}=await create(),c=customer(A,{balance:100});await A.save();const before=JSON.stringify(A.DB()),base=A.storage.commit;
 A.storage.commit=async()=>{throw new Error('Injected ledger failure');};
 await assert.rejects(()=>A.actions.customerCredit(c.id,20,'upi','Advance',{operationId:'failed_advance'}),/Injected/);assert.equal(JSON.stringify(A.DB()),before);
 A.storage.commit=base;A.DB().staff.push({id:'cashier',name:'Cashier',role:'cashier',active:true});A.DB().session.staffId='cashier';await A.save();
 await assert.rejects(()=>A.actions.correctCustomerBalance(c.id,1,'Not permitted'),/permission|allowed|access/i);
 A.DB().session.staffId='sf_owner';A.DB().stores.push({id:'branch',name:'Branch'});A.DB().settings.activeStore='branch';await A.save();
 await assert.rejects(()=>A.actions.takePayment(c.id,10,'cash'),/not found/);
});
