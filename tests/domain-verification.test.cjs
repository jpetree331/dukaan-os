/* VERIFY-01 adversarial checks, added after the build checkpoint. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../js/domain.js');
const {create,item,supplier,cart}=require('./harness.cjs');

test('VERIFY-01: 2000 deterministic baskets conserve money and bounded line bases',()=>{
  let seed=91126;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let run=0;run<2000;run++){
    const lines=Array.from({length:1+Math.floor(random()*20)},()=>({price:(1+Math.floor(random()*10000))/100,qty:(1+Math.floor(random()*20))/4,gst:[0,5,12,18,28][Math.floor(random()*5)]}));
    const discount=Math.floor(random()*10000)/100,redeem=Math.floor(random()*1000)/100;
    const frozen=D.snapshot({lines,discount,redeem,points:100,loyaltyValue:1});
    const result=D.sale(frozen);
    const cents=n=>Math.round(n*100);
    assert.equal(cents(result.sub)-cents(result.disc)-cents(result.redeem)+cents(result.tax),cents(result.total));
    assert.equal(result.taxes.reduce((n,l)=>n+cents(l.taxable),0),cents(result.sub)-cents(result.disc)-cents(result.redeem));
    result.taxes.forEach((l,i)=>{assert.ok(l.taxable>=0);assert.ok(cents(l.taxable)<=cents(lines[i].price*lines[i].qty));});
    assert.equal(result.taxes.reduce((n,l)=>n+cents(l.tax),0),cents(result.tax));
  }
});

test('VERIFY-01: fractional stock survives CSV update and failed multi-line purchase',async()=>{
  const {A}=await create();const i=item(A,{stock:1.0001}),s=supplier(A);
  A.importItemRows([{name:i.name,stock:1.0001}]);
  assert.equal(A.item(i.id).stock,1.0001);
  const before=JSON.stringify(A.DB());
  assert.throws(()=>A.actions.recordPurchase(s.id,[{itemId:i.id,qty:1,cost:60},{itemId:i.id,qty:0.00011,cost:60}],0),/four decimal/);
  assert.equal(JSON.stringify(A.DB()),before);
  assert.throws(()=>A.importItemRows([{name:i.name,stock:2},{name:'bad',price:1,stock:0.00001}]),/four decimal/);
  assert.equal(JSON.stringify(A.DB()),before);
});

test('VERIFY-01: persisted snapshots, command links and duplicate void survive reload',async()=>{
  const first=await create(),A=first.A,i=item(A);
  const b=A.actions.checkout(cart(i));
  // Explicitly emulate an old bill lacking the new extension metadata.
  delete b.command;delete b.calculationVersion;A.save();
  const legacy=JSON.stringify(b);
  const second=await create(first.storage),B=second.A;
  assert.equal(JSON.stringify(B.DB().bills[0]),legacy);
  B.actions.voidBill(b.id);assert.equal(B.DB().bills[0].voidCommand.corrects,b.id);
  const state=JSON.stringify(B.DB());
  assert.equal(B.actions.voidBill(b.id),null);assert.equal(JSON.stringify(B.DB()),state);
  const newer=B.actions.checkout(cart(B.item(i.id)));
  const third=await create(first.storage);
  assert.equal(third.A.DB().bills[0].command.id,newer.command.id);
  assert.equal(third.A.DB().bills[0].lines[0].price,100);
});
