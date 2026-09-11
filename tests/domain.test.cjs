'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../js/domain.js');
const {create,item,customer,cart}=require('./harness.cjs');

test('BUILD-01 M01: independently calculated mixed-tax discount and redemption',async()=>{
  const {A}=await create();A.DB().settings.gstEnabled=true;
  const rice=item(A,{price:80,gst:5}),soap=item(A,{price:50,gst:18});
  const c=customer(A,{points:20});
  const input={lines:[{itemId:rice.id,price:80,qty:1.25},{itemId:soap.id,price:50,qty:2}],discount:10,redeem:10,customerId:c.id,mode:'credit'};
  const b=(await A.actions.checkout(input));
  assert.deepEqual([b.sub,b.discount,b.tax,b.total,c.balance,c.points],[200,20,20.7,200.7,200.7,12]);
  assert.deepEqual(Array.from(b.lines,l=>[l.taxable,l.tax]),[[90,4.5],[90,16.2]]);
  assert.equal(b.calculationVersion,D.CALCULATION_VERSION);
  assert.equal(b.command.storeId,'st_main');assert.equal(b.command.actorId,'sf_owner');
  const snapshot=D.snapshot(b);
  rice.price=99;rice.gst=0;A.DB().settings.loyaltyValue=3;
  (await A.actions.voidBill(b.id));
  assert.deepEqual([rice.stock,soap.stock,c.balance,c.points],[10,10,0,20]);
  assert.equal(b.voidCommand.corrects,b.command.id);
  assert.equal(snapshot.void,false);assert.equal(snapshot.lines[0].price,80);
  assert.throws(()=>{snapshot.lines[0].price=2;},TypeError);
});

test('BUILD-01 M02: paise rounding and tiny-line nonnegative allocations',()=>{
  const t=D.sale({lines:[{price:100,qty:1,gst:5},{price:100,qty:1,gst:18}],discount:0.01});
  assert.deepEqual(t,{sub:200,disc:0.01,redeem:0,tax:23,taxes:[{gst:5,taxable:100,tax:5},{gst:18,taxable:99.99,tax:18}],total:222.99});
  // Four one-paise lines, two paise net: rounding each base up must not
  // create a negative last line. Allocation remains within each gross.
  const tiny=D.sale({lines:Array.from({length:4},()=>({price:0.01,qty:1,gst:0})),discount:0.02});
  assert.equal(tiny.total,0.02);assert.deepEqual(tiny.taxes.map(x=>x.taxable),[0.01,0.01,0,0]);
});

test('BUILD-01 Q01: four-decimal quantity sale, batched sale, restock and void',async()=>{
  const {A}=await create();const i=item(A,{stock:1,price:10000});
  const b=(await A.actions.checkout(cart(i,{lines:[{itemId:i.id,price:10000,qty:0.0001}]})));
  assert.equal(i.stock,0.9999);assert.equal(b.total,1);
  (await A.actions.voidBill(b.id));assert.equal(i.stock,1);
  const batched=(await A.actions.checkout(cart(i,{lines:[{itemId:i.id,price:10000,qty:0.0001}]})));
  assert.equal(A.itemStock(i),0.9999);(await A.actions.voidBill(batched.id));assert.equal(A.itemStock(i),1);
  (await A.actions.restock(i.id,0.0001));assert.equal(i.stock,1.0001);
  A.posAdd(i.id,0.0001);A.posAdd(i.id,0.0001);assert.equal(A.cart.lines[0].qty,0.0002);
  (await assert.rejects(async ()=>(await A.actions.checkout(cart(i,{lines:[{itemId:i.id,price:10000,qty:0.00011}]}))),/four decimal/));
});

test('BUILD-01: pure calculations reject nonfinite, overprecision and unsafe totals',()=>{
  const input={lines:[{price:1,qty:1,gst:5}]};
  for(const discount of [NaN,Infinity,-1])assert.throws(()=>D.sale({...input,discount}));
  assert.throws(()=>D.sale({lines:[{price:1e9,qty:1e9,gst:5}]}),/precision|range/);
  assert.equal(D.quantityUnits(0.0001),1);
  assert.throws(()=>D.quantityUnits(0.00001),/four decimal/);
  assert.throws(()=>D.command({id:'bad id'}),/identity/);
});

test('BUILD-01: quota failure restores a book containing prior command metadata',async()=>{
  const {A,ctx}=await create();const i=item(A);
  (await A.actions.checkout(cart(i)));const before=JSON.stringify(A.DB());
  ctx.localStorage.setItem=()=>{throw new Error('Synthetic quota');};
  (await assert.rejects(async ()=>(await A.actions.checkout(cart(i))),/Synthetic quota/));
  assert.equal(JSON.stringify(A.DB()),before);
});
