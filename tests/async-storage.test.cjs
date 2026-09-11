'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create,item,customer,supplier,cart}=require('./harness.cjs');

function deferredRepository(A) {
  const base=A.storage;let release,reject;
  const gate=new Promise((yes,no)=>{release=yes;reject=no;});
  A.storage={...base,async commit(args){await gate;return base.commit(args);}};
  return {release,reject};
}

test('BUILD-02: delayed sale hides draft, blocks duplicate writes, and resolves only after commit',async()=>{
  const {A,storage}=await create();const i=item(A);await A.save();
  const before=storage.get('dukaanos.v2.audit'),gate=deferredRepository(A);
  const pending=A.actions.checkout(cart(i));let resolved=false;pending.then(()=>{resolved=true;});
  assert.equal(A.isSaving(),true);assert.equal(A.DB().bills.length,0);assert.equal(A.item(i.id).stock,10);
  assert.equal(storage.get('dukaanos.v2.audit'),before);assert.equal(resolved,false);
  await assert.rejects(A.actions.checkout(cart(i)),/save is already/);
  gate.release();const bill=await pending;
  assert.equal(bill.total,100);assert.equal(A.item(i.id).stock,9);assert.equal(A.DB().bills.length,1);
  assert.equal(JSON.parse(storage.get('dukaanos.v2.audit')).bills.length,1);assert.equal(A.isSaving(),false);
});

test('BUILD-02: every money/stock command and settings save rolls back on delayed rejection',async()=>{
  for(const kind of ['sale','void','collect','purchase','supplier','restock','settings']){
    const {A,storage}=await create();const i=item(A),c=customer(A,{balance:100}),s=supplier(A,{balance:100});
    let bill;if(kind==='void')bill=await A.actions.checkout(cart(i));
    await A.save();const before=JSON.stringify(A.DB()),raw=storage.get('dukaanos.v2.audit');
    const gate=deferredRepository(A);
    const run={sale:()=>A.actions.checkout(cart(i)),void:()=>A.actions.voidBill(bill.id),collect:()=>A.actions.takePayment(c.id,20,'cash'),purchase:()=>A.actions.recordPurchase(s.id,[{itemId:i.id,qty:1,cost:60}],20),supplier:()=>A.actions.paySupplier(s.id,20,'cash'),restock:()=>A.actions.restock(i.id,1),settings:()=>{A.DB().settings.shopName='Uncommitted';return A.save();}}[kind];
    const pending=run();assert.equal(JSON.stringify(A.DB()),before,kind+' exposes uncommitted draft');
    const rejected=assert.rejects(pending,/Synthetic delayed rejection/);gate.reject(new Error('Synthetic delayed rejection'));await rejected;
    assert.equal(JSON.stringify(A.DB()),before,kind);assert.equal(storage.get('dukaanos.v2.audit'),raw,kind);assert.equal(A.isSaving(),false);
  }
});

test('BUILD-02: lock while storage is waiting prevents the eventual write',async()=>{
  const {A,storage}=await create();const i=item(A);await A.save();
  const before=storage.get('dukaanos.v2.audit'),gate=deferredRepository(A);
  const pending=A.actions.checkout(cart(i));A.setLocked(true);
  const rejected=assert.rejects(pending,/counter changed/);gate.release();await rejected;
  assert.equal(storage.get('dukaanos.v2.audit'),before);assert.equal(A.DB().bills.length,0);
});

test('BUILD-02: account switches cannot redirect a pending sale',async()=>{
  const {A,storage}=await create();const i=item(A);await A.save();const gate=deferredRepository(A);
  const pending=A.actions.checkout(cart(i));await assert.rejects(A.boot('other'),/current save/);
  gate.release();await pending;assert.equal(storage.has('dukaanos.v2.other'),false);assert.equal(A.accountId,'audit');
});

test('BUILD-02: failed awaited login migration retains its local source and leaves gate off',async()=>{
  const {A,storage}=await create();await A.boot('local');item(A);await A.save();
  const source=storage.get('dukaanos.v2.local');
  const acc=await A.auth.signUp({username:'synthetic',password:'Synthetic-password',confirm:'Synthetic-password',shopName:'Synthetic'});
  const base=A.storage;A.storage={...base,async write(key,value){await Promise.resolve();if(key==='dukaanos.v2.'+acc.id)throw new Error('Synthetic copy rejection');return base.write(key,value);}};
  await assert.rejects(A.auth.enableGate(acc.id),/Synthetic copy rejection/);
  assert.equal(storage.get('dukaanos.v2.local'),source);assert.equal(A.auth.gateOn(),false);
});
