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
 const backup=await A.backups.decrypt(await A.backups.encrypt(A.backups.capture(),'Synthetic-return-backup'),'Synthetic-return-backup'),restored=await create();await restored.A.restoreBackup(backup);assert.equal(restored.A.customer(c.id).balance,0);assert.equal(restored.A.customer(c.id).points,50);assert.equal(restored.A.stats.cashExpected().net,84);
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
test('VERIFY-07: cumulative paise and quantity limits hold across tiny sequential returns',async()=>{
 const {A}=await create(),i=item(A,{price:0.01,cost:0.01});await A.save();const b=await A.actions.checkout(cart(i,{lines:[{itemId:i.id,qty:3,price:0.01}],discount:0.01}));
 const amounts=[];for(let n=0;n<3;n++){const r=await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],reason:'Tiny return',operationId:'tiny_'+n});amounts.push(r.amount);}
 assert.deepEqual(amounts,[0.01,0,0.01]);assert.equal(A.itemStock(i),10);assert.equal(A.stats.today().sales,0);assert.equal(A.returns().reduce((n,r)=>n+Math.round(r.amount*100),0),2);
});
test('VERIFY-07: return-date reports are negative while original sale day and prior counts stay intact',async()=>{
 const {A}=await create(),i=item(A);A.DB().settings.gstEnabled=true;await A.save();const b=await A.actions.checkout(cart(i));const yesterday=Date.now()-86400000;b.at=yesterday;await A.save();
 const r=await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],reason:'Next day return'});
 assert.equal(A.stats.today().sales,-105);assert.equal(A.stats.cashExpected(yesterday).net,105);assert.equal(A.stats.cashExpected().net,0);assert.equal(A.gstBreakdown([],A.returns())[5].tax,-5);
 await A.actions.settleReturn(r.id,105,'cash','Today cash refund');assert.equal(A.stats.cashExpected().net,-105);assert.equal(A.stats.cashExpected(yesterday).net,105);
 const html=A.chart.bars([{label:'Return day',value:-105}]);assert.doesNotMatch(html,/height="-/);assert.match(html,/-105/);
});
test('VERIFY-07: spent customer credit caps refunds and failed refund commits preserve credit/liability',async()=>{
 const {A}=await create(),i=item(A),c=customer(A);await A.save();const b=await A.actions.checkout(cart(i,{customerId:c.id}));
 const r=await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],destination:'customer',reason:'Customer credit return'});
 i.price=80;await A.save();await A.actions.checkout(cart(i,{customerId:c.id,mode:'credit'}));assert.equal(c.balance,-20);assert.equal(A.returnRefundDue(r),20);
 await assert.rejects(()=>A.actions.settleReturn(r.id,21,'cash','Excess payment'),/exceeds/);
 const before=JSON.stringify(A.DB()),commit=A.storage.commit;A.storage.commit=async()=>{throw new Error('Refund quota failure');};await assert.rejects(()=>A.actions.settleReturn(r.id,20,'cash','Cash handover','retry_refund'),/quota/);assert.equal(JSON.stringify(A.DB()),before);
 A.storage.commit=commit;await A.actions.settleReturn(r.id,20,'cash','Cash handover','retry_refund');assert.equal(c.balance,0);
});
test('VERIFY-07: imported duplicate compensation and inflated cash liability reject',async()=>{
 const {A}=await create(),i=item(A),c=customer(A);await A.save();const b=await A.actions.checkout(cart(i,{customerId:c.id,mode:'credit'}));
 await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],destination:'customer',reason:'Cancel unpaid goods'});
 let bad=JSON.parse(JSON.stringify(A.DB()));bad.customers[0].ledger.push({...bad.customers[0].ledger.at(-1),id:'duplicate_return_entry'});bad.customers[0].balance=-100;
 assert.throws(()=>A.validateData(bad),/duplicate linked/);
 bad=JSON.parse(JSON.stringify(A.DB()));bad.returns[0].refundable=100;assert.throws(()=>A.validateData(bad),/refundable amount differs/);
});
test('VERIFY-07: ten four-decimal returns conserve original money, cost and stock',async()=>{
 const {A}=await create(),i=item(A,{price:10000,cost:6000});await A.save();const b=await A.actions.checkout(cart(i,{lines:[{itemId:i.id,qty:0.001,price:10000}]}));assert.equal(b.total,10);
 for(let n=0;n<10;n++){const r=await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:0.0001}],reason:'Fractional return',operationId:'fraction_'+n});assert.equal(r.amount,1);}
 assert.equal(A.itemStock(i),10);assert.equal(A.stats.today().sales,0);assert.equal(A.stats.today().cost,0);assert.equal(A.returnableLines(b)[0].qty,0);
});
