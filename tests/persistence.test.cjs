const {test}=require('node:test');const assert=require('node:assert/strict');
const {create,item,customer,cart}=require('./harness.cjs');

test('B12: corrupt stored JSON survives failed startup byte-for-byte', async()=>{
  const raw='{"items":[',storage=new Map([['dukaanos.v2.audit',raw]]);
  await assert.rejects(create(storage));assert.equal(storage.get('dukaanos.v2.audit'),raw);
});

test('B13: schema/reference/version/counter validation and quota-safe restore',async()=>{
  const {A,storage,ctx}=await create();item(A);A.save();
  const before=storage.get('dukaanos.v2.audit'), valid=JSON.parse(before);
  for(const mutate of [d=>d.stores=[],d=>d.v=99,d=>d.items[0].price=-1,d=>d.items[0].id='" onclick="x',
    d=>d.items[0].storeId='missing',d=>d.staff=[],d=>d.counter.bill=0,d=>d.bills=[{id:'b',total:1,at:1,lines:[{itemId:'missing',qty:1,cost:1}]}]]) {
    const d=JSON.parse(before);mutate(d);assert.throws(()=>A.restoreBackup(d));
    assert.equal(storage.get('dukaanos.v2.audit'),before);
  }
  const next=JSON.parse(before);next.items[0].name='Restored item';
  const write=ctx.localStorage.setItem;
  ctx.localStorage.setItem=(k,v)=>{if(k==='dukaanos.v2.audit')throw Error('quota');write(k,v);};
  assert.throws(()=>A.restoreBackup(next),/quota/);assert.equal(A.items()[0].name,valid.items[0].name);
  assert.equal(storage.get('dukaanos.v2.audit'),before);
  ctx.localStorage.setItem=write;A.restoreBackup(next);assert.equal(A.items()[0].name,'Restored item');
  assert.equal(storage.get('dukaanos.v2.audit.before-restore'),before);
});

test('B14: exclusive writer lock and stale-snapshot guard prevent lost bills',async()=>{
  let held=false;const locks={async request(name,opts,fn){if(held)return fn(null);held=true;try{return await fn({name});}finally{held=false;}}};
  const storage=new Map(),a=await create(storage,{locks});const i=item(a.A);a.A.save();
  const b=await create(storage,{locks});assert.throws(()=>b.A.boot('audit'),/not writable/);
  a.A.actions.checkout(cart(i));assert.equal(JSON.parse(storage.get('dukaanos.v2.audit')).bills.length,1);
  // Even an older client that ignores the lock cannot be overwritten silently.
  const raw=JSON.parse(storage.get('dukaanos.v2.audit'));raw.settings.shopName='External edit';
  storage.set('dukaanos.v2.audit',JSON.stringify(raw));
  assert.throws(()=>a.A.actions.checkout(cart(i)),/another tab/);
  assert.equal(a.A.DB().bills.length,1);assert.equal(i.stock,9);
});

test('B15: checkout is durable before returning; failed write rolls back stock, bill, points and counter',async()=>{
  const {A,ctx,storage}=await create();const i=item(A),c=customer(A,{points:20});A.save();
  const before=storage.get('dukaanos.v2.audit'), write=ctx.localStorage.setItem;
  ctx.localStorage.setItem=()=>{throw Error('quota');};
  assert.throws(()=>A.actions.checkout(cart(i,{customerId:c.id,redeem:20})),/quota/);
  assert.equal(i.stock,10);assert.equal(c.points,20);assert.equal(A.DB().bills.length,0);assert.equal(A.DB().counter.bill,1);
  assert.equal(storage.get('dukaanos.v2.audit'),before);
  ctx.localStorage.setItem=write;const b=A.actions.checkout(cart(i));
  assert.equal(JSON.parse(storage.get('dukaanos.v2.audit')).bills[0].id,b.id);
});

test('B17: legacy queue is preserved and never reports a fake upload',async()=>{
  const storage=new Map([['dukaanos.syncq.audit','[{"id":"old"}]']]);const {A,ctx,flush}=await create(storage);
  ctx.navigator.onLine=true;A.save({op:'test'});A.sync.drain();flush(700);
  assert.equal(A.sync.pending(),1);assert.equal(storage.get('dukaanos.syncq.audit'),'[{"id":"old"}]');assert.equal(A.sync.push,null);
});

test('B23: login migration updates memory immediately; later save cannot erase migrated shop',async()=>{
  const {A,storage}=await create();A.boot('local');item(A);A.save();
  const acc=await A.auth.signUp({username:'audituser',password:'audit-only-password',confirm:'audit-only-password',shopName:'Audit'});
  A.auth.enableGate(acc.id);assert.equal(A.items().length,1);A.save({sync:false});
  assert.equal(JSON.parse(storage.get('dukaanos.v2.'+acc.id)).items.length,1);
  A.auth.disableGate();A.save();assert.equal(A.accountId,'local');assert.equal(JSON.parse(storage.get('dukaanos.v2.local')).items.length,1);
  await assert.rejects(A.auth.logIn({username:'audituser',password:'wrong'}));
});
