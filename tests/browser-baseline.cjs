/* Run with Playwright installed in the development environment (not shipped).
 * Each run uses disposable Chromium contexts and its own local server.
 * Fixtures use App APIs; sale, void, backup and login use actual DOM controls.
 */
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const {chromium} = require('playwright');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const checks = [];
const passed = name => { checks.push(name); console.log('PASS ' + name); };
async function ready(p) { await p.waitForFunction(() => window.App && !document.querySelector('#shell').hidden); }
async function dismiss(p) {
  const done = p.getByRole('button', {name:'Done', exact:true});
  if (await done.isVisible()) await done.click();
  await p.locator('#modalRoot > *').waitFor({state:'detached'});
}
async function prompt(p, title, value) {
  const modal = p.locator('.modal').filter({has:p.getByText(title, {exact:true})});
  await modal.locator('input').fill(value);
  await modal.getByRole('button', {name:'Save',exact:true}).click();
  await modal.waitFor({state:'detached'});
}
async function main() {
  const server = spawn(process.execPath, ['server.js'], {cwd:ROOT, env:{...process.env, PORT:'0'}, stdio:['ignore','pipe','pipe']});
  let browser;
  try {
    const url = await new Promise((resolve,reject) => {
      const timer=setTimeout(()=>reject(new Error('Server startup timeout')),10000);
      server.once('error',reject);
      server.stdout.on('data',chunk=>{const m=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});
    });
    browser = await chromium.launch({headless:true, ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
    const context = await browser.newContext({reducedMotion:'reduce'});
    const p = await context.newPage();
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(url);await ready(p);await dismiss(p);
    await p.evaluate(async () => {
      const A=App,d=A.DB();
      d.items.push({id:'test_rice',storeId:A.S(),name:'Synthetic rice',price:100,cost:60,stock:10,batches:[],gst:5});
      d.settings.seenSummaryOn=A.dayKey(Date.now());(await A.save());
    });
    await p.locator('#sidenav [data-view="billing"]').click();
    await p.locator('[data-add="test_rice"]').first().click();
    await p.locator('#charge').click();
    await p.waitForFunction(()=>App.DB().bills.length===1);
    assert.deepEqual(await p.evaluate(()=>[App.DB().bills[0].total,App.DB().items[0].stock]),[100,9]);
    await p.reload();await ready(p);await dismiss(p);
    assert.deepEqual(await p.evaluate(()=>[App.DB().bills.length,App.DB().items[0].stock]),[1,9]);
    await p.locator('#sidenav [data-view="dashboard"]').click();
    await p.locator('[data-void]').click();
    await p.locator('.modal-foot').getByRole('button',{name:/Confirm|Cancel bill/}).last().click();
    await p.waitForFunction(()=>App.DB().bills[0].void);
    assert.equal(await p.evaluate(()=>App.DB().items[0].stock),10);
    passed('sale through UI, reload, owner void and exact stock restoration');

    const second=await context.newPage();await second.goto(url);
    await second.getByText('Dukaan OS is already open in another tab. Close that tab, then reload this one.', {exact:true}).waitFor();
    assert.equal(await second.locator('a[download]').count(),0);await second.close();
    passed('second tab denied writer access without recovery download');

    await p.evaluate(async ()=>{App.DB().staff.push({id:'test_cashier',name:'Synthetic cashier',role:'cashier',active:true,pin:''});App.DB().session.staffId='test_cashier';(await App.save());App.go('settings');});
    assert.equal(await p.locator('#sidenav [data-view="settings"]').isVisible(),false);
    assert.match(await p.evaluate(async ()=>{try{(await App.actions.voidBill(App.DB().bills[0].id));return '';}catch(e){return e.message;}}),/Owner/);
    await p.evaluate(async ()=>{App.DB().session.staffId='sf_owner';(await App.save());App.go('settings');});
    passed('cashier navigation and direct void action denied');

    await p.locator('#expAll').click();
    await prompt(p,'Encrypt backup','Synthetic-backup-2026');
    const downloading=p.waitForEvent('download');
    await prompt(p,'Confirm backup password','Synthetic-backup-2026');
    const download=await downloading;
    const encrypted=await fs.readFile(await download.path());
    assert.equal(JSON.parse(encrypted).format,'encrypted');
    assert.equal(encrypted.includes(Buffer.from('Synthetic rice')),false);
    passed('encrypted backup exported through real download flow');

    const fresh=await browser.newContext({reducedMotion:'reduce'}),r=await fresh.newPage();
    r.on('pageerror',e=>errors.push(e.message));await r.goto(url);await ready(r);await dismiss(r);
    await r.locator('#sidenav [data-view="settings"]').click();
    const upload={name:'synthetic-backup.json',mimeType:'application/json',buffer:encrypted};
    await r.locator('#impFile').setInputFiles(upload);
    await prompt(r,'Open encrypted backup','Wrong-backup-password');
    await r.getByText('Wrong backup password or damaged backup. Nothing was restored.', {exact:true}).waitFor();
    assert.equal(await r.evaluate(()=>App.DB().items.length),0);
    await r.locator('#impFile').setInputFiles([]);
    await r.locator('#impFile').setInputFiles(upload);
    await prompt(r,'Open encrypted backup','Synthetic-backup-2026');
    await r.locator('.modal-foot').getByRole('button',{name:'Restore',exact:true}).click();
    await r.waitForFunction(()=>App.DB().items.length===1);
    await r.waitForEvent('load');await ready(r);
    assert.deepEqual(await r.evaluate(()=>[App.DB().items[0].stock,App.DB().bills[0].void]),[10,true]);
    passed('wrong password preserves empty shop; fresh-profile file restore survives restart');
    await r.locator('#sidenav [data-view="settings"]').click();
    const before=await r.evaluate(()=>JSON.stringify(App.DB()));
    await r.locator('#impFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
    await r.getByText('Not a valid backup file.',{exact:true}).waitFor();
    assert.equal(await r.evaluate(()=>JSON.stringify(App.DB())),before);
    passed('malformed imported file leaves records unchanged');

    await p.evaluate(async ()=>{App.DB().settings.pin='1234';App.DB().settings.pinOn=true;(await App.save());(await App.lock(()=>App.render()));});
    for(const n of '1111') await p.locator('#pinPad [data-k="'+n+'"]').click();
    await p.locator('#pinErr').getByText('Incorrect PIN',{exact:true}).waitFor();
    assert.equal(await p.locator('#shell').isVisible(),false);
    for(const n of '1234') await p.locator('#pinPad [data-k="'+n+'"]').click();
    await ready(p);passed('wrong and correct PIN through real lock screen');

    await p.evaluate(async()=>{const a=await App.auth.signUp({username:'synthetic_owner',password:'Synthetic-owner-2026',confirm:'Synthetic-owner-2026',shopName:'Synthetic shop'});(await App.auth.enableGate(a.id));});
    await p.reload();await p.locator('#authScreen').waitFor({state:'visible'});
    await p.locator('#a_user').fill('synthetic_owner');await p.locator('#a_pass').fill('Wrong-owner-password');await p.locator('#authSubmit').click();
    await p.locator('#authErr').getByText('Incorrect username or password',{exact:true}).waitFor();
    await p.locator('#a_pass').fill('Synthetic-owner-2026');await p.locator('#authSubmit').click();
    await p.locator('#lockScreen').waitFor({state:'visible'});
    for(const n of '1234') await p.locator('#pinPad [data-k="'+n+'"]').click();
    await ready(p);assert.equal(await p.evaluate(()=>App.DB().items[0].stock),10);
    passed('account migration retains shop; reload requires password and PIN');

    await p.locator('#sidenav [data-view="billing"]').click();
    await p.locator('[data-add="test_rice"]').first().click();
    await p.evaluate(()=>{
      const base=App.storage.commit.bind(App.storage);
      let release;const gate=new Promise(r=>{release=r;});window.releaseSyntheticSave=release;
      App.storage.commit=async args=>{await gate;return base(args);};
    });
    await p.locator('#charge').click();
    await p.waitForFunction(()=>App.isSaving());
    assert.deepEqual(await p.evaluate(()=>[App.DB().bills.length,App.DB().items[0].stock]),[1,10]);
    assert.equal(await p.locator('.receipt-prev').count(),0);
    assert.equal(await p.locator('#shell').getAttribute('aria-busy'),'true');
    await p.evaluate(()=>{document.querySelector('#charge').click();App.go('inventory');});
    assert.equal(await p.evaluate(()=>location.hash),'#billing');
    await p.evaluate(()=>window.releaseSyntheticSave());
    await p.waitForFunction(()=>App.DB().bills.length===2 && !App.isSaving());
    await p.locator('.receipt-prev').waitFor();
    assert.equal(await p.evaluate(()=>App.DB().items[0].stock),9);
    passed('delayed UI sale shows no receipt/draft, ignores duplicate click and defers navigation until durable');

    const faults=await browser.newContext(),f=await faults.newPage();await f.goto(url);await ready(f);
    await f.evaluate(()=>localStorage.setItem('dukaanos.v2.local','{broken-synthetic'));
    await f.reload();await f.getByText(/could not open|could not start|cannot open/i).first().waitFor();
    assert.equal(await f.evaluate(()=>localStorage.getItem('dukaanos.v2.local')),'{broken-synthetic');
    passed('corrupt startup storage retained byte-for-byte');
    assert.deepEqual(errors,[]);passed('no uncaught page errors in primary and restored profiles');
    console.log(JSON.stringify({browser:browser.version(),checks:checks.length,results:checks},null,2));
  } finally { if(browser)await browser.close();server.kill(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
