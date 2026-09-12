const {test} = require('node:test');
const assert = require('node:assert/strict');
const {create,item,customer,supplier,cart} = require('./harness.cjs');

test('B01–B03: mixed stock, last batch depletion, and exact void allocations', async () => {
  const {A}=await create(); const i=item(A);
  (await A.actions.restock(i.id,5,'2027-01-01',70));
  assert.equal(A.itemStock(i),15);
  const before=JSON.stringify(i.batches.slice().sort((a,b)=>a.id.localeCompare(b.id)));
  const b=(await A.actions.checkout(cart(i,{lines:[{itemId:i.id,qty:15,price:100}]})));
  assert.equal(A.itemStock(i),0); assert.equal(i.stock,0);
  assert.equal(b.lines[0].cost*15,950);
  (await A.actions.voidBill(b.id));
  assert.equal(A.itemStock(i),15);
  assert.deepEqual(JSON.parse(JSON.stringify(i.batches.slice().sort((a,b)=>a.id.localeCompare(b.id)))),JSON.parse(before));
});

test('B04, B21: foreign, deleted, stale price, duplicate and over-stock lines cannot charge', async () => {
  const {A}=await create(); const i=item(A,{stock:1}), c=customer(A);
  await A.posAdd(i.id,1); A.cart.customerId=c.id;
  A.DB().stores.push({id:'branch',name:'Branch'}); A.DB().settings.activeStore='branch';
  (await assert.rejects(async ()=>(await A.actions.checkout({...A.cart,mode:'credit'})),/different store/));
  assert.equal(A.item(i.id),undefined); assert.equal(c.balance,0); assert.equal(i.stock,1);
  A.DB().settings.activeStore='st_main';
  (await assert.rejects(async ()=>(await A.actions.checkout(cart(i,{lines:[...cart(i).lines,...cart(i).lines]}))),/Insufficient/));
  (await assert.rejects(async ()=>(await A.actions.checkout(cart(i,{lines:[{itemId:i.id,qty:1,price:101}]}))),/new price/));
  i.deleted=true; (await assert.rejects(async ()=>(await A.actions.checkout(cart(i))),/removed/));
  assert.equal(A.DB().bills.length,0);
});

test('B05–B07: displayed redemption equals persisted total; customer changes clear it; void returns points', async () => {
  const {A,node}=await create(); const i=item(A),c=customer(A,{points:20});
  await A.posAdd(i.id,1); A.cart.customerId=c.id; A.cart.redeem=20;
  const shown=A.posTotals(); assert.equal(shown.total,80);
  A.views.billing(node('main')); await A.drafts.save(A.cart); assert.match(node('#cartFoot').innerHTML,/₹80\.00/);
  const b=(await A.actions.checkout(A.cart)); assert.equal(b.total,shown.total); assert.equal(c.points,0);
  A.DB().settings.loyaltyValue=2;
  (await A.actions.voidBill(b.id)); assert.equal(c.points,20);
  A.cart.customerId=''; assert.equal(A.posTotals().redeem,0); assert.equal(A.cart.redeem,0);
  (await assert.rejects(async ()=>(await A.actions.checkout(cart(i,{redeem:20}))),/customer/));
});

test('B08: purchase cash, UPI, partial payable, and later payments reconcile once', async () => {
  const {A}=await create();const i=item(A),s=supplier(A);
  (await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:2,cost:60}],100,'','cash'));
  assert.equal(A.stats.cashExpected().out,100);assert.equal(s.balance,20);
  (await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:1,cost:60}],60,'','upi'));
  assert.equal(A.stats.cashExpected().out,100);
  (await A.actions.paySupplier(s.id,20,'cash'));assert.equal(A.stats.cashExpected().out,120);assert.equal(s.balance,0);
});

test('B09, B22: reject excess/nonfinite/negative payments and costs without partial mutations', async () => {
  const {A}=await create(); const i=item(A),c=customer(A,{balance:100}),s=supplier(A,{balance:100});
  (await A.save());const before=JSON.stringify(A.DB());
  (await assert.rejects(async ()=>(await A.actions.takePayment(c.id,150,'cash')),/exceeds/));
  (await assert.rejects(async ()=>(await A.actions.paySupplier(s.id,150,'cash')),/exceeds/));
  for(const cost of [-50,NaN,Infinity]) (await assert.rejects(async ()=>(await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:1,cost}],0))));
  (await assert.rejects(async ()=>(await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:1,cost:60}],61)),/exceeds/));
  assert.equal(JSON.stringify(A.DB()),before);
  (await A.actions.takePayment(c.id,100,'cash')); assert.equal(c.balance,0);
});

test('B10–B11: mixed GST, legacy bills, discounted paise and profit excluding tax', async () => {
  const {A}=await create();A.DB().settings.gstEnabled=true;
  const a=item(A,{gst:5}),b=item(A,{gst:18});
  const bill=(await A.actions.checkout({lines:cart(a).lines.concat(cart(b).lines),mode:'cash'}));
  assert.equal(bill.tax,23);assert.equal(A.stats.today().profit,80);
  let rows=A.gstBreakdown([bill]);assert.equal(rows[5].tax,5);assert.equal(rows[18].tax,18);
  bill.lines.forEach(l=>{delete l.tax;delete l.taxable;});
  rows=A.gstBreakdown([bill]);assert.equal(rows[5].tax,5);assert.equal(rows[18].tax,18);
  const discounted=(await A.actions.checkout({lines:cart(a).lines.concat(cart(b).lines),mode:'cash',discount:0.01}));
  assert.equal(A.round2(discounted.lines.reduce((n,l)=>n+l.taxable,0)),199.99);
  assert.equal(A.round2(discounted.lines.reduce((n,l)=>n+l.tax,0)),discounted.tax);
});

test('B30: a repaid credit sale becomes visible customer credit when voided', async () => {
  const {A,node}=await create();const i=item(A),c=customer(A);
  const b=(await A.actions.checkout(cart(i,{customerId:c.id,mode:'credit'})));
  (await A.actions.takePayment(c.id,100,'cash'));(await A.actions.voidBill(b.id));
  assert.equal(c.balance,-100);assert.equal(A.stats.totalDue(),0);
  assert.equal(A.stats.cashExpected().net,100);assert.equal(A.stats.today().sales,0);
  (await A.actions.checkout(cart(i,{customerId:c.id,mode:'credit'})));assert.equal(c.balance,0);
});

test('B25: cashier action and editor boundaries', async () => {
  const {A}=await create(); const i=item(A),s=supplier(A);
  A.DB().staff.push({id:'cashier',name:'Cashier',role:'cashier',pin:''});A.DB().session.staffId='cashier';
  assert.throws(()=>A.editItem(i.id),/Owner/);
  (await assert.rejects(async ()=>(await A.actions.recordPurchase(s.id,[{itemId:i.id,qty:1,cost:1}],0)),/Owner/));
  (await assert.rejects(async ()=>(await A.actions.voidBill('any')),/Owner/));
  (await assert.rejects(async ()=>(await A.importItemRows([{name:'new',price:1}])),/Owner/));
  assert.throws(()=>A.views.settings({}),/Owner/);
  (await A.actions.restock(i.id,1));(await A.actions.checkout(cart(i)));assert.equal(i.stock,10);
});
