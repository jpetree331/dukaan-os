const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item,supplier,cart}=require('./harness.cjs');
async function setup(){const h=await create(),A=h.A;A.DB().stores.push({id:'branch',name:'Branch'});const i=item(A,{stock:0}),s=supplier(A);await A.save();const po=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:10,cost:60}],0,'');return {...h,i,s,po};}
test('BUILD-10: dispatch, partial receipt, retry and recall conserve stock and source cost',async()=>{
 const {A,i,po}=await setup(),from=A.S();const request={toStoreId:'branch',lines:[{itemId:i.id,qty:6}],note:'Move sealed cartons',operationId:'dispatch_once'};
 const t=await A.actions.sendTransfer(request);await A.actions.sendTransfer(request);assert.equal(A.itemStock(A.item(i.id)),4);assert.equal(A.transferRemaining(t,t.lines[0]),6);assert.equal(A.DB().items.find(x=>x.id===t.lines[0].targetItemId).stock,0);
 await A.actions.switchStore('branch');const receive={transferId:t.id,lines:[{lineId:t.lines[0].lineId,qty:2}],note:'Two units received',operationId:'receive_once'};await A.actions.receiveTransfer(receive);await A.actions.receiveTransfer(receive);
 assert.equal(A.itemStock(A.item(t.lines[0].targetItemId)),2);assert.equal(A.transferRemaining(t,t.lines[0]),4);assert.equal(A.item(t.lines[0].targetItemId).batches[0].purchaseId,po.id);
 const bill=await A.actions.checkout(cart(A.item(t.lines[0].targetItemId)));assert.equal(bill.lines[0].cost,60);assert.equal(A.stats.today().profit,40);
 await A.actions.switchStore(from);await A.actions.receiveTransfer({transferId:t.id,lines:[{lineId:t.lines[0].lineId,qty:4}],note:'Remaining units physically returned',recall:true});assert.equal(A.itemStock(A.item(i.id)),8);assert.equal(A.transferRemaining(t,t.lines[0]),0);
 assert.equal(A.DB().items.reduce((n,x)=>n+A.itemStock(x),0)+bill.lines[0].qty,10);assert.equal(A.purchaseReturnable(po)[0].qty,8);assert.equal(A.supplier(po.supplierId).balance,600);
});
test('BUILD-10: failed dispatch/receipt, destination unit mismatch and over-receipt leave books intact',async()=>{
 const {A,i}=await setup();const request={toStoreId:'branch',lines:[{itemId:i.id,qty:3}],note:'Interrupted dispatch',operationId:'send_retry'},commit=A.storage.commit,before=JSON.stringify(A.DB());A.storage.commit=async()=>{throw new Error('Transfer disk failure');};await assert.rejects(()=>A.actions.sendTransfer(request),/disk/);assert.equal(JSON.stringify(A.DB()),before);A.storage.commit=commit;
 const t=await A.actions.sendTransfer(request);await A.actions.switchStore('branch');const receive={transferId:t.id,lines:[{lineId:t.lines[0].lineId,qty:2}],note:'Receipt interrupted',operationId:'receipt_retry'},prior=JSON.stringify(A.DB());A.storage.commit=async()=>{throw new Error('Receipt disk failure');};await assert.rejects(()=>A.actions.receiveTransfer(receive),/disk/);assert.equal(JSON.stringify(A.DB()),prior);A.storage.commit=commit;
 await A.actions.receiveTransfer(receive);await assert.rejects(()=>A.actions.receiveTransfer({...receive,operationId:'over_receipt'}),/exceeds/);assert.equal(A.transferRemaining(t,t.lines[0]),1);
 A.item(t.lines[0].targetItemId).unit='kg';await A.save();await assert.rejects(()=>A.actions.receiveTransfer({...receive,lines:[{lineId:t.lines[0].lineId,qty:1}],operationId:'unit_mismatch'}),/unit/);
});
test('BUILD-10: reviewed assignments default new staff closed and deny wrong-store actions',async()=>{
 const {A,i}=await setup();A.DB().staff.push({id:'branch_cashier',name:'Branch cashier',role:'cashier',active:true});await A.save();const assignments=A.assignmentPreview().map(s=>({staffId:s.staffId,storeIds:s.role==='owner'?s.storeIds:['branch']}));await A.actions.setStoreAssignments(assignments);
 const staff=A.staff('branch_cashier');assert.equal(A.canStore('branch',staff),true);assert.equal(A.canStore(A.S(),staff),false);await A.actions.switchStore('branch');A.DB().session.staffId=staff.id;await A.save();
 await assert.rejects(()=>A.actions.switchStore('st_main'),/not assigned/);await assert.rejects(()=>A.actions.sendTransfer({toStoreId:'st_main',lines:[{itemId:i.id,qty:1}],note:'Not permitted'}),/Owner access/);
 const bad=JSON.parse(JSON.stringify(A.DB()));bad.settings.activeStore='st_main';assert.throws(()=>A.validateData(bad),/not assigned/);
 assert.equal(A.canStore('branch',{id:'new_staff',role:'cashier',active:true}),false);
});
test('BUILD-10: store receipts and targets snapshot identity; restore keeps local payment and access settings',async()=>{
 const {A,i}=await setup();await A.actions.setStoreProfile('st_main',{shopName:'Original Main Receipt',address:'Main address',shopPhone:'123',gstin:'',upiId:'',receiptTheme:'ink'},1234);
 const bill=await A.actions.checkout(cart(A.item(i.id)));assert.equal(bill.receiptSettings.shopName,'Original Main Receipt');assert.equal(A.storeTarget(),1234);
 await A.actions.setStoreProfile('st_main',{shopName:'Renamed Main Receipt',upiId:'',receiptTheme:'tulsi'},999);assert.equal(bill.receiptSettings.shopName,'Original Main Receipt');
 await A.actions.switchStore('branch');await A.actions.setStoreProfile('branch',{shopName:'Branch Receipt',upiId:'',receiptTheme:'ink'},567);assert.equal(A.storeTarget(),567);
 const t=await (async()=>{await A.actions.switchStore('st_main');return A.actions.sendTransfer({toStoreId:'branch',lines:[{itemId:i.id,qty:2}],note:'Restore fixture dispatch'});})();
 const encrypted=await A.backups.encrypt(A.backups.capture(),'Synthetic-transfer-backup'),fresh=await create();fresh.A.DB().settings.upiId='local@upi';await fresh.A.save();await fresh.A.restoreBackup(await fresh.A.backups.decrypt(encrypted,'Synthetic-transfer-backup'));
 assert.equal(fresh.A.DB().stores.find(s=>s.id==='branch').receiptProfile.upiId,'local@upi');assert.equal(fresh.A.DB().staff.length,1);assert.equal(fresh.A.transferRemaining(fresh.A.transfers()[0],fresh.A.transfers()[0].lines[0]),2);assert.equal(fresh.A.bills()[0].receiptSettings.shopName,'Original Main Receipt');
});
