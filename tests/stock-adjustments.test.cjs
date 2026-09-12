const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item,supplier,cart}=require('./harness.cjs');
test('BUILD-09: expire, count undated stock, dispose quarantine and reverse with preserved cost',async()=>{
 const {A}=await create(),i=item(A,{stock:5,cost:20});await A.save();
 const counted=await A.actions.adjustStock({itemId:i.id,batchId:'undated',count:4,reasonCode:'count',note:'Shelf count',operationId:'count_one'});assert.equal(counted.delta,-1);assert.equal(counted.value,-20);assert.equal(A.itemStock(i),4);
 await A.actions.restock(i.id,2,'2000-01-01',30);const expired=i.batches.find(b=>b.expiry);const disposed=await A.actions.adjustStock({itemId:i.id,batchId:expired.id,count:0,reasonCode:'expired',note:'Expired goods disposed'});assert.equal(disposed.delta,-2);assert.equal(disposed.value,-60);assert.equal(A.itemStock(i),4);
 const bill=await A.actions.checkout(cart(i));await A.actions.returnSale({billId:bill.id,lines:[{lineId:bill.lines[0].lineId,qty:1}],disposition:'quarantine',reason:'Damaged customer return'});assert.equal(A.itemStock(i),4);assert.equal(A.sellableStock(i),3);
 const damaged=i.batches.find(b=>b.quarantined);const writeoff=await A.actions.adjustStock({itemId:i.id,batchId:damaged.id,count:0,reasonCode:'damaged',note:'Broken package disposed'});assert.equal(writeoff.value,-20);assert.equal(A.itemStock(i),3);
 await A.actions.reverseStockAdjustment(writeoff.id,'Disposal entry mistaken','undo_damage');assert.equal(A.itemStock(i),4);assert.equal(A.sellableStock(i),3);assert.equal(A.stockSummary(i).quarantine,1);
 await A.actions.reverseStockAdjustment(writeoff.id,'Disposal entry mistaken','undo_damage');assert.equal(A.stockAdjustments().length,4);await assert.rejects(()=>A.actions.reverseStockAdjustment(writeoff.id,'Second reversal'),/already reversed/);
 assert.equal(A.stats.today().sales,0);assert.equal(A.stats.cashExpected().net,100);assert.equal(A.stats.today().cost,0);
});
test('VERIFY-09: malformed disposal and forged reversal links reject import',async()=>{
 const {A}=await create(),i=item(A);await A.save();const r=await A.actions.adjustStock({itemId:i.id,batchId:'undated',count:9,note:'Verified count'});
 let bad=JSON.parse(JSON.stringify(A.DB()));bad.stockAdjustments[0].after.physical+=1;assert.throws(()=>A.validateData(bad),/summary differs|movement differs/);
 await A.actions.reverseStockAdjustment(r.id,'Mistaken count');bad=JSON.parse(JSON.stringify(A.DB()));bad.stockAdjustments[1].reverses='invented';assert.throws(()=>A.validateData(bad),/reversal/);
 const b=await A.actions.checkout(cart(i));await A.actions.returnSale({billId:b.id,lines:[{lineId:b.lines[0].lineId,qty:1}],reason:'Damaged item',disposition:'quarantine'});const lot=i.batches.find(b=>b.quarantined);await A.actions.adjustStock({itemId:i.id,batchId:lot.id,count:0,reasonCode:'damaged',note:'Damaged disposal'});
 bad=JSON.parse(JSON.stringify(A.DB()));bad.stockAdjustments.at(-1).reasonCode='expired';assert.throws(()=>A.validateData(bad),/expiry/);
});
test('VERIFY-09: CSV stock counts preserve original costs and all-or-nothing history',async()=>{
 const {A}=await create(),i=item(A,{stock:1.0001});await A.save();let before=JSON.stringify(A.DB());await assert.rejects(()=>A.importItemRows([{name:i.name,stock:1},{name:'Bad row',price:-1}]),/price/);assert.equal(JSON.stringify(A.DB()),before);
 const commit=A.storage.commit;A.storage.commit=async()=>{throw new Error('CSV count disk failure');};await assert.rejects(()=>A.importItemRows([{name:i.name,stock:1}]),/disk/);assert.equal(JSON.stringify(A.DB()),before);A.storage.commit=commit;
 await A.importItemRows([{name:i.name,stock:1,cost:100}]);const r=A.stockAdjustments()[0];assert.equal(r.delta,-0.0001);assert.equal(r.batch.cost,60);assert.equal(A.item(i.id).cost,100);assert.equal(A.item(i.id).batches[0].cost,60);
 await A.actions.reverseStockAdjustment(r.id,'Fractional count corrected');assert.equal(A.itemStock(A.item(i.id)),1.0001);
});
test('VERIFY-09: adjustment permissions and operation reuse do not leak across stores',async()=>{
 const {A}=await create(),i=item(A);await A.save();const request={itemId:i.id,batchId:'undated',count:9,note:'Store count',operationId:'store_count'};await A.actions.adjustStock(request);
 const before=JSON.stringify(A.DB());await assert.rejects(()=>A.actions.adjustStock({...request,count:8}),/different contents/);assert.equal(JSON.stringify(A.DB()),before);
 A.DB().staff.push({id:'count_cashier',name:'Cashier',role:'cashier',active:true});A.DB().session.staffId='count_cashier';await A.save();await assert.rejects(()=>A.actions.adjustStock({...request,operationId:'cashier_count'}),/permission|allowed|access/i);
 A.DB().session.staffId='sf_owner';A.DB().stores.push({id:'other_count_store',name:'Other count store'});A.DB().settings.activeStore='other_count_store';await A.save();await assert.rejects(()=>A.actions.adjustStock(request),/not found/);
});
test('BUILD-09: found goods are distinct; stale counts, negative stock and consumed reversal reject atomically',async()=>{
 const {A}=await create(),i=item(A,{stock:0});await A.save();const version=A.stockFingerprint(i);
 const r=await A.actions.adjustStock({itemId:i.id,count:2,reasonCode:'found',note:'Found sealed carton',cost:40,expectedStock:version});assert.equal(i.batches[0].cost,40);assert.equal(r.value,80);
 await assert.rejects(()=>A.actions.adjustStock({itemId:i.id,count:2,note:'Stale count',expectedStock:version}),/Stock changed/);
 await A.actions.checkout(cart(i));const before=JSON.stringify(A.DB());await assert.rejects(()=>A.actions.reverseStockAdjustment(r.id,'Reverse found stock'),/exceeds stock/);assert.equal(JSON.stringify(A.DB()),before);
 await assert.rejects(()=>A.actions.adjustStock({itemId:i.id,batchId:i.batches[0].id,delta:-2,note:'Impossible count'}),/exceeds stock/);
 await assert.rejects(()=>A.actions.adjustStock({itemId:i.id,batchId:i.batches[0].id,count:0,reasonCode:'expired',note:'No dated expiry'}),/expiry date/);
});
test('BUILD-09: failure/retry and encrypted recovery preserve linked purchase and count provenance',async()=>{
 const {A}=await create(),i=item(A,{stock:0}),s=supplier(A);await A.save();const po=await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:2,cost:60}],0,'');const request={itemId:i.id,batchId:i.batches[0].id,count:1,note:'Physical count short',operationId:'count_retry'};
 const before=JSON.stringify(A.DB()),commit=A.storage.commit;A.storage.commit=async()=>{throw new Error('Count disk failure');};await assert.rejects(()=>A.actions.adjustStock(request),/disk/);assert.equal(JSON.stringify(A.DB()),before);A.storage.commit=commit;
 const r=await A.actions.adjustStock(request);await A.actions.adjustStock(request);assert.equal(A.itemStock(i),1);assert.equal(r.batch.purchaseId,po.id);assert.equal(s.balance,120);assert.equal(A.stats.cashExpected().net,0);
 await A.actions.reverseStockAdjustment(r.id,'Count corrected');assert.equal(A.purchaseReturnable(po)[0].qty,2);
 const encrypted=await A.backups.encrypt(A.backups.capture(),'Synthetic-count-backup'),fresh=await create();await fresh.A.restoreBackup(await fresh.A.backups.decrypt(encrypted,'Synthetic-count-backup'));assert.equal(fresh.A.itemStock(fresh.A.item(i.id)),2);assert.equal(fresh.A.stockAdjustments().length,2);
});
