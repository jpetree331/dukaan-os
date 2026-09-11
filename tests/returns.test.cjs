const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item,customer,cart}=require('./harness.cjs');
test('BUILD-07: partial returns reverse original tax/loyalty, quarantine stock and settle separate liability once',async()=>{
 const {A}=await create(),i=item(A),c=customer(A,{points:50});A.DB().settings.gstEnabled=true;await A.save();
 const b=await A.actions.checkout(cart(i,{lines:[{itemId:i.id,qty:2,price:100}],customerId:c.id,mode:'credit',discount:20,redeem:20}));
 assert.equal(b.total,168);assert.equal(c.points,31);await A.actions.takePayment(c.id,100,'cash');assert.equal(c.balance,68);
 i.price=300;await A.save();const request={billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],disposition:'quarantine',destination:'customer',reason:'Damaged item',operationId:'return_first'};
 const r=await A.actions.returnSale(request);assert.equal(r.amount,84);assert.equal(r.tax,4);assert.equal(r.refundable,16);assert.equal(c.balance,-16);assert.equal(c.points,40.5);assert.equal(A.itemStock(i),9);assert.equal(A.sellableStock(i),8);
 const before=JSON.stringify(A.DB());await A.actions.returnSale(request);assert.equal(JSON.stringify(A.DB()),before);
 await assert.rejects(()=>A.actions.voidBill(b.id,'Void instead'),/already has returns/);
 const r2=await A.actions.returnSale({...request,disposition:'restock',operationId:'return_second'});assert.equal(r2.amount,84);assert.equal(c.points,50);assert.equal(c.balance,-100);assert.equal(A.itemStock(i),10);assert.equal(A.sellableStock(i),9);assert.equal(A.stats.today().sales,0);assert.equal(A.stats.today().profit,0);
 await assert.rejects(()=>A.actions.returnSale({...request,operationId:'return_third'}),/exceeds/);
 await A.actions.settleReturn(r.id,16,'cash','Cash receipt','refund_first');await A.actions.settleReturn(r.id,16,'cash','Cash receipt','refund_first');assert.equal(c.balance,-84);assert.equal(A.stats.cashExpected().net,84);
 await A.actions.settleReturn(r2.id,84,'upi','Synthetic UPI reference','refund_second');assert.equal(c.balance,0);assert.equal(A.refunds().length,2);assert.equal(A.stats.cashExpected().refundCash,16);
 assert.equal(A.returnableLines(b)[0].qty,0);assert.equal(A.returnRefundDue(r),0);assert.equal(A.returnRefundDue(r2),0);
});
test('BUILD-07: paid walk-in return creates liability; settlement changes cash and preserves prior counts',async()=>{
 const {A}=await create(),i=item(A);await A.save();const b=await A.actions.checkout(cart(i));
 A.DB().shifts.push({id:'old_count',storeId:A.S(),counted:100,at:Date.now()});await A.save();
 const r=await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],reason:'Customer return',operationId:'walkin_return'});
 assert.equal(r.refundable,100);assert.equal(A.stats.cashExpected().net,100);assert.equal(A.stats.today().sales,0);
 await A.actions.settleReturn(r.id,100,'cash','Recorded cash handover','walkin_refund');assert.equal(A.stats.cashExpected().net,0);assert.equal(A.DB().shifts[0].counted,100);
 await assert.rejects(()=>A.actions.settleReturn(r.id,1,'cash','Extra refund'),/exceeds/);
});
test('BUILD-07: return failures preserve bill, batches and credit; unavailable legacy allocation fails explicitly',async()=>{
 const {A}=await create(),i=item(A),c=customer(A);await A.save();const b=await A.actions.checkout(cart(i,{mode:'credit',customerId:c.id}));const request={billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],reason:'Return reason'};
 const before=JSON.stringify(A.DB()),base=A.storage.commit;A.storage.commit=async()=>{throw new Error('Injected return failure');};
 await assert.rejects(()=>A.actions.returnSale(request),/Injected/);assert.equal(JSON.stringify(A.DB()),before);A.storage.commit=base;
 const legacy=JSON.parse(JSON.stringify(b));delete legacy.calculationVersion;assert.throws(()=>A.returnMath.quote(legacy,[],request.lines),/Legacy sale/);
 await assert.rejects(()=>A.actions.returnSale({...request,lines:[...request.lines,...request.lines]}),/Duplicate/);
 assert.equal(JSON.stringify(A.DB()),before);
 const inconsistent=JSON.parse(JSON.stringify(b));inconsistent.lines[0].taxable+=1;assert.throws(()=>A.returnMath.quote(inconsistent,[],request.lines),/do not reconcile/);
});
