const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item,supplier,cart}=require('./harness.cjs');
test('BUILD-08: receive, partially pay, sell, return remainder and settle supplier credit reconcile',async()=>{
 const {A}=await create(),i=item(A,{stock:0}),s=supplier(A);await A.save();
 const lines=[{itemId:i.id,qty:10,cost:60}],po=await A.actions.recordPurchase(s.id,lines,200,'','cash',{operationId:'receive_one'});
 await A.actions.recordPurchase(s.id,lines,200,'','cash',{operationId:'receive_one'});assert.equal(A.itemStock(i),10);assert.equal(s.balance,400);
 await A.actions.checkout(cart(i,{lines:[{itemId:i.id,qty:4,price:100}]}));await A.actions.paySupplier(s.id,100,'upi',{purchaseId:po.id,operationId:'pay_one'});assert.equal(s.balance,300);assert.equal(A.purchasePaid(po),300);
 const request={purchaseId:po.id,lines:[{lineId:po.lines[0].lineId,qty:6}],reason:'Return remaining goods',operationId:'return_one'};
 const r=await A.actions.returnPurchase(request);assert.equal(r.amount,360);assert.equal(r.refundable,60);assert.equal(s.balance,-60);assert.equal(A.itemStock(i),0);
 await A.actions.returnPurchase(request);assert.equal(A.supplierReturns().length,1);await assert.rejects(()=>A.actions.returnPurchase({...request,operationId:'excess_return'}),/exceeds/);
 await A.actions.settleSupplierCredit(r.id,60,'cash','Cash received','supplier_refund_one');await A.actions.settleSupplierCredit(r.id,60,'cash','Cash received','supplier_refund_one');
 assert.equal(s.balance,0);assert.equal(A.stats.cashExpected().net,260);assert.equal(A.stats.today().cost,240);assert.equal(A.stats.today().profit,160);assert.equal(po.paid,200);assert.equal(po.total,600);
 const fresh=await create();await fresh.A.restoreBackup(await A.backups.decrypt(await A.backups.encrypt(A.backups.capture(),'Synthetic-supplier-backup'),'Synthetic-supplier-backup'));assert.equal(fresh.A.stats.cashExpected().net,260);assert.equal(fresh.A.supplier(s.id).balance,0);
});
test('BUILD-08: duplicate cancellation preserves original cash and cannot rewrite consumed stock',async()=>{
 for(const paid of [0,120]){const {A}=await create(),i=item(A,{stock:0}),s=supplier(A);await A.save();const po=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:2,cost:60}],paid,'','cash');
 const r=await A.actions.returnPurchase({purchaseId:po.id,lines:[{lineId:po.lines[0].lineId,qty:2}],reason:'Duplicate receipt',cancel:true});assert.equal(po.cancelled,true);assert.equal(A.itemStock(i),0);assert.equal(s.balance,-paid||0);assert.equal(A.stats.cashExpected().net,-paid||0);
 if(paid){await A.actions.settleSupplierCredit(r.id,paid,'cash','Refund received');assert.equal(A.stats.cashExpected().net,0);}
 }
 const {A}=await create(),i=item(A,{stock:0}),s=supplier(A);await A.save();const po=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:2,cost:60}],0,'');await A.actions.checkout(cart(i));const before=JSON.stringify(A.DB());await assert.rejects(()=>A.actions.returnPurchase({purchaseId:po.id,lines:[{lineId:po.lines[0].lineId,qty:2}],reason:'Duplicate receipt',cancel:true}),/sold or moved/);assert.equal(JSON.stringify(A.DB()),before);
});
test('BUILD-08: purchase paise allocation and customer quarantine returns preserve attribution',async()=>{
 const {A}=await create(),i=item(A,{stock:0}),s=supplier(A);await A.save();const po=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:0.3333,cost:0.01},{itemId:i.id,qty:0.3333,cost:0.01}],0,'');assert.equal(po.total,0.01);assert.deepEqual(Array.from(po.lines,l=>l.value),[0,0.01]);
 const r=await A.actions.returnPurchase({purchaseId:po.id,lines:po.lines.map(l=>({lineId:l.lineId,qty:l.qty})),reason:'All goods returned'});assert.equal(r.amount,0.01);assert.equal(s.balance,0);assert.equal(A.itemStock(i),0);
 const po2=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:2,cost:60}],0,'');const bill=await A.actions.checkout(cart(i));await A.actions.returnSale({billId:bill.id,lines:[{lineId:bill.lines[0].lineId,qty:1}],reason:'Damaged product',disposition:'quarantine'});
 const r2=await A.actions.returnPurchase({purchaseId:po2.id,lines:[{lineId:po2.lines[0].lineId,qty:1}],reason:'Damaged batch'});assert.equal(r2.lines[0].allocations[0].quarantined,true);assert.equal(A.sellableStock(i),1);assert.equal(A.itemStock(i),1);
});
test('BUILD-08: failed commits, legacy exceptions and correction idempotency preserve supplier history',async()=>{
 const {A}=await create(),i=item(A,{stock:0}),s=supplier(A);await A.save();const po=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:2,cost:60}],0,'');const before=JSON.stringify(A.DB()),commit=A.storage.commit;
 A.storage.commit=async()=>{throw new Error('Injected supplier failure');};await assert.rejects(()=>A.actions.returnPurchase({purchaseId:po.id,lines:[{lineId:po.lines[0].lineId,qty:1}],reason:'Faulted return'}),/Injected/);assert.equal(JSON.stringify(A.DB()),before);A.storage.commit=commit;
 await A.actions.correctSupplierBalance(s.id,-20,'Invoice correction','correction_one');await A.actions.correctSupplierBalance(s.id,-20,'Invoice correction','correction_one');assert.equal(s.balance,100);assert.equal(A.stats.cashExpected().net,0);
 const bad=JSON.parse(JSON.stringify(A.DB()));bad.suppliers[0].balance=0;assert.throws(()=>A.validateData(bad),/balance differs/);
 delete po.calculationVersion;await assert.rejects(()=>A.actions.returnPurchase({purchaseId:po.id,lines:[{lineId:po.lines[0].lineId,qty:1}],reason:'Legacy return'}),/Legacy purchase/);
});
