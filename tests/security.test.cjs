const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {create,item,customer,cart,ROOT}=require('./harness.cjs');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const credentials={username:'securitytest',password:'synthetic-password-only',confirm:'synthetic-password-only',shopName:'Synthetic'};
const clone=d=>JSON.parse(JSON.stringify(d));

test('S01: a blocked tab has no recovery export and preserves protected data',async()=>{
  const storage=new Map(),first=await create(storage);first.A.boot('local');customer(first.A,{name:'Synthetic private customer'});
  first.A.DB().settings.pinOn=true;first.A.DB().settings.pin='2468';first.A.save();
  const before=storage.get('dukaanos.v2.local');
  const second=await create(storage,{locks:{request:async(n,o,fn)=>fn(null)}});
  let exported=false;second.A.download=()=>{exported=true;};second.load('js/app.js');
  await new Promise(r=>setImmediate(r));
  const html=second.node('body').children.map(n=>n.innerHTML).join('');
  assert.match(html,/already open in another tab/);assert.doesNotMatch(html,/recoverRaw|Save recovery file/);
  assert.equal(exported,false);assert.equal(storage.get('dukaanos.v2.local'),before);assert.equal(second.A.isLocked(),true);
});

test('S02/S07: stored IDs cannot authenticate a fresh page; verified sessions expire',async()=>{
  const {A,storage,ctx}=await create();const acc=await A.auth.signUp(credentials);assert.equal(A.auth.currentAccount().id,acc.id);
  const reloaded=await create(storage,{noBoot:true});assert.equal(reloaded.A.auth.currentAccount(),null);
  storage.set('dukaanos.session',JSON.stringify({accountId:acc.id,at:1}));assert.equal(A.auth.currentAccount(),null);
  await A.auth.logIn(credentials);ctx.Date=class extends Date {static now(){return Date.now()+9*60*60*1000;}};
  assert.equal(A.auth.currentAccount(),null);
});

test('S03: migrate and delete all owned copies, preserving another account',async()=>{
  const {A,storage}=await create();A.boot('local');item(A);A.save();
  storage.set('dukaanos.v2.local.before-restore',storage.get('dukaanos.v2.local'));
  const acc=await A.auth.signUp(credentials);A.auth.enableGate(acc.id);
  assert.equal(storage.has('dukaanos.v2.local'),false);assert.equal(storage.has('dukaanos.v2.local.before-restore'),false);
  assert.ok(storage.has('dukaanos.v2.'+acc.id+'.before-restore'));
  storage.set('dukaanos.v2.other','unrelated');
  A.auth.disableGate();await A.auth.deleteAccount(acc.id,credentials.password);
  assert.equal(storage.has('dukaanos.v2.local'),false);assert.equal(storage.has('dukaanos.v2.'+acc.id),false);
  assert.equal(storage.has('dukaanos.v2.'+acc.id+'.before-restore'),false);assert.equal(storage.get('dukaanos.v2.other'),'unrelated');
});

test('S03: a failed migration preserves the source; failed deletion preserves the login for retry',async()=>{
  const {A,storage,ctx}=await create();A.boot('local');item(A);A.save();const raw=storage.get('dukaanos.v2.local');
  const acc=await A.auth.signUp(credentials),write=ctx.localStorage.setItem;
  ctx.localStorage.setItem=(k,v)=>{if(k==='dukaanos.v2.'+acc.id)throw Error('quota');write(k,v);};
  assert.throws(()=>A.auth.enableGate(acc.id),/quota/);assert.equal(storage.get('dukaanos.v2.local'),raw);
  ctx.localStorage.setItem=write;A.auth.enableGate(acc.id);
  const remove=ctx.localStorage.removeItem;ctx.localStorage.removeItem=k=>{if(k.endsWith('.before-restore'))throw Error('denied');return remove(k);};
  await assert.rejects(A.auth.deleteAccount(acc.id,credentials.password),/denied/);
  assert.ok(A.auth.accounts().some(a=>a.id===acc.id));assert.ok(storage.has('dukaanos.v2.'+acc.id));
});

test('S04: inactive/missing staff and locked contexts cannot transact; cashier cost/analytics denied',async()=>{
  const {A,node}=await create();const i=item(A);A.save();
  A.DB().staff.push({id:'cashier',name:'Cashier',role:'cashier',active:true,pin:''});A.DB().session.staffId='cashier';A.save();
  assert.throws(()=>A.actions.restock(i.id,1,'',0),/owner/);assert.equal(i.cost,60);assert.equal(i.stock,10);
  A.actions.restock(i.id,1,'',60);assert.equal(i.stock,11);
  assert.throws(()=>A.views.dashboard(node('main')),/Owner/);
  A.DB().staff[1].active=false;assert.equal(A.can('bill'),false);assert.throws(()=>A.actions.checkout(cart(i)),/not active/);
  A.DB().staff[1].active=true;const context=A.context();A.setLocked(true);
  assert.throws(()=>A.actions.checkout(cart(i)),/Unlock/);assert.throws(()=>A.assertContext(context),/changed or locked/);
  A.setLocked(false);assert.throws(()=>A.assertContext(context),/changed or locked/);
  A.DB().session.staffId='missing';assert.equal(A.isOwner(),false);assert.equal(A.can('bill'),false);
});

test('S05/S06: ambiguous store ownership and excessive input rejected; single-store legacy migrates',async()=>{
  const {A}=await create();item(A);A.save();const good=clone(A.DB());
  const legacy=clone(good);delete legacy.items[0].storeId;assert.equal(A.validateData(legacy).items[0].storeId,good.stores[0].id);
  legacy.stores.push({id:'branch',name:'Branch'});assert.throws(()=>A.validateData(legacy),/missing store/);
  const huge=clone(good);huge.items[0].name='x'.repeat(250000);assert.throws(()=>A.validateData(huge),/too much text/);
  const deep=clone(good);deep.unexpected={};let p=deep.unexpected;for(let i=0;i<25;i++)p=p.next={};
  assert.throws(()=>A.validateData(deep),/deeply nested/);
  const unknown=clone(good);unknown.unexpected={nested:true};assert.throws(()=>A.validateData(unknown),/unknown field/);
  assert.throws(()=>A.checkFile({size:17*1024*1024}),/too large/);assert.deepEqual(clone(A.DB()),good);
});

test('S07: legacy hashes still work and migrate; guesses and short new passwords rejected',async()=>{
  const salt='1a'.repeat(16),hash=crypto.pbkdf2Sync('legacy-password',Buffer.from(salt,'hex'),150000,32,'sha256').toString('hex');
  const storage=new Map([['dukaanos.accounts',JSON.stringify([{id:'legacy',username:'legacy',shopName:'Legacy',salt,hash}])]]);
  const {A,ctx}=await create(storage);await A.auth.logIn({username:'legacy',password:'legacy-password'});
  assert.equal(A.auth.accounts()[0].iterations,600000);assert.notEqual(A.auth.accounts()[0].hash,hash);
  await assert.rejects(A.auth.signUp({...credentials,password:'abc123',confirm:'abc123'}),/12 to 256/);
  for(let i=0;i<3;i++)await assert.rejects(A.auth.logIn({username:'legacy',password:'wrong'}),/Incorrect/);
  await assert.rejects(A.auth.logIn({username:'legacy',password:'legacy-password'}),/Too many/);
  ctx.Date=class extends Date {static now(){return Date.now()+2000;}};
  await A.auth.logIn({username:'legacy',password:'legacy-password'});
  for(let i=0;i<3;i++)assert.throws(()=>A.auth.checkPin('0000','2468'),/Incorrect PIN/);
  assert.throws(()=>A.auth.checkPin('2468','2468'),/Too many/);
});

test('S09: encrypted backup round-trip, wrong-password and tamper rejection; PINs excluded',async()=>{
  const {A}=await create();item(A);A.DB().settings.pin='2468';A.DB().staff[0].pin='1357';
  const envelope=await A.backups.encrypt(A.DB(),'separate-backup-password');
  assert.doesNotMatch(JSON.stringify(envelope),/Audit item|2468|1357/);
  const decoded=await A.backups.decrypt(envelope,'separate-backup-password');assert.equal(decoded.items.length,1);
  assert.equal(decoded.settings.pin,'');assert.equal(decoded.staff[0].pin,'');assert.equal(A.DB().settings.pin,'2468');
  await assert.rejects(A.backups.decrypt(envelope,'wrong-password-here'),/Wrong backup/);
  const bytes=Buffer.from(envelope.ciphertext,'base64');bytes[0]^=1;
  await assert.rejects(A.backups.decrypt({...envelope,ciphertext:bytes.toString('base64')},'separate-backup-password'),/damaged/);
  await assert.rejects(A.backups.decrypt({...envelope,iterations:999999999},'separate-backup-password'),/Unsupported/);
});

test('S09: restore preserves current security/payment settings and demands fresh credentials',async()=>{
  const {A}=await create();item(A);A.DB().settings.pin='2468';A.DB().settings.pinOn=true;A.DB().settings.upiId='owner@upi';A.DB().staff[0].pin='1357';A.save();
  const original=clone(A.DB());const incoming=clone(original);incoming.items[0].name='Restored';incoming.settings.upiId='different@upi';incoming.staff[0].pin='0000';
  assert.throws(()=>A.restoreBackup(incoming),/Verify/);assert.deepEqual(clone(A.DB()),original);
  A.prompt=async()=>'1357';assert.equal(await A.auth.verifyOwner(),true);A.restoreBackup(incoming);
  assert.equal(A.items()[0].name,'Restored');assert.equal(A.DB().settings.upiId,'owner@upi');assert.equal(A.me().pin,'1357');assert.equal(A.DB().settings.pin,'2468');
});

test('S10: recognition cancels and late callbacks are inert after lock',async()=>{
  const {A,ctx,load}=await create();let recognizer,aborted=false,finals=0;
  ctx.SpeechRecognition=class{constructor(){recognizer=this;}start(){}abort(){aborted=true;}};
  load('js/voice.js');A.confirm=async()=>true;
  await A.voice.start({onFinal:()=>finals++});const late=recognizer.onend;
  A.setLocked(true);late();assert.equal(aborted,true);assert.equal(finals,0);assert.equal(recognizer.onend,null);
});

test('S04: PIN UI locks permissions and unlocks only after the correct PIN',async()=>{
  const {A,ctx,load,node,flush}=await create();A.DB().settings.pinOn=true;A.DB().settings.pin='2468';A.save();
  ctx.document.readyState='loading';load('js/app.js');
  let unlocked=0;A.lock(()=>unlocked++);assert.equal(A.can('bill'),false);assert.equal(node('#shell').inert,true);
  const press=k=>node('#pinPad').click({target:{closest:()=>({dataset:{k}})}});
  for(const k of '0000')press(k);flush(130);assert.equal(A.isLocked(),true);assert.equal(unlocked,0);
  for(const k of '2468')press(k);flush(130);assert.equal(A.isLocked(),false);assert.equal(unlocked,1);assert.equal(node('#shell').inert,false);
});

test('S07: password changes invalidate access without erasing shop records',async()=>{
  const {A,storage}=await create();const acc=await A.auth.signUp(credentials);A.auth.enableGate(acc.id);item(A);A.save();
  const before=storage.get('dukaanos.v2.'+acc.id);
  await A.auth.changePassword(acc.id,credentials.password,'replacement-synthetic-password');
  assert.equal(A.auth.currentAccount(),null);assert.equal(A.isLocked(),true);assert.equal(storage.get('dukaanos.v2.'+acc.id),before);
});

test('S11: release contains only public files and security policies; version derives from content',()=>{
  execFileSync(process.execPath,[path.join(ROOT,'scripts/build-public.cjs')]);
  const output=path.join(ROOT,'dist');assert.equal(fs.existsSync(path.join(output,'server.js')),false);
  assert.equal(fs.existsSync(path.join(output,'tests')),false);assert.equal(fs.existsSync(path.join(output,'js/backup.js')),true);
  const headers=fs.readFileSync(path.join(output,'_headers'),'utf8');assert.match(headers,/frame-ancestors 'none'/);assert.match(headers,/Strict-Transport-Security/);
  const worker=fs.readFileSync(path.join(output,'sw.js'),'utf8');assert.doesNotMatch(worker,/security-v1|skipWaiting/);
  const vercel=JSON.parse(fs.readFileSync(path.join(ROOT,'vercel.json'),'utf8'));
  for(const [key,value] of Object.entries(require('../security-headers.cjs')))assert.equal(vercel.headers[0].headers.find(x=>x.key===key).value,value);
});
