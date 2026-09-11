const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');

// Executes inspected application modules, with disposable in-memory browser state.
// This is a test adapter, not a browser substitute or a security sandbox.
async function create(shared, options = {}) {
  const storage = shared || new Map(), events = {}, timers = new Map(), nodes = new Map();
  let serial = 0;
  const node = (key) => {
    if (!nodes.has(key)) nodes.set(key, {innerHTML:'', textContent:'', value:'', children:[], style:{}, dataset:{},
      classList:{add(){},remove(){},toggle(){}}, addEventListener(ev,fn){this[ev]=fn;},
      querySelector(sel){return node(key+sel);}, querySelectorAll(){return [];},
      getContext(){return new Proxy({}, {get:(o,k)=>o[k]||(()=>{})});},
      appendChild(n){this.children.push(n);}, focus(){}, getBoundingClientRect(){return {left:0,top:0,width:100,height:30};}
    });
    return nodes.get(key);
  };
  const ctx = { console:{log(){},warn(){},error(){}}, TextEncoder, TextDecoder, btoa, atob, Uint8Array, crypto:crypto.webcrypto,
    navigator:{onLine:false, locks: options.locks || {request: async (name, opts, fn) => fn({name})}}, location:{hash:'',hostname:'localhost',protocol:'http:',reload(){}},
    innerWidth:1280, innerHeight:900, devicePixelRatio:1,
    localStorage:{getItem:k=>storage.get(k)??null,setItem(k,v){storage.set(k,String(v));},removeItem:k=>storage.delete(k)},
    setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener(ev,fn){(events[ev] ||= []).push(fn);}, requestAnimationFrame(){},
    document:{querySelector:node,querySelectorAll(){return [];},addEventListener(){},removeEventListener(){},createElement:node,body:node('body')},
    matchMedia:()=>({matches:true})
  };
  ctx.window=ctx; vm.createContext(ctx);
  const load=(f)=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
  ['js/domain.js','js/core.js','js/safety.js','js/i18n.js','js/auth.js','js/backup.js','js/voice.js','js/qr.js','js/ui.js','js/pos.js','js/insights.js','js/ledger.js','js/inventory.js','js/settings.js'].forEach(load);
  const A=ctx.App; if (await A.acquireWriter()) { if (!options.noBoot) A.boot('audit'); }
  A.toast=()=>{}; A.buzz=()=>{}; A.bump=()=>{}; A.confetti=()=>{};
  A.$=node; A.$$=()=>[]; A.render=()=>{};
  return {A,ctx,storage,events,nodes,node,load,timers,flush(ms){for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}}};
}
function item(A,overrides={}) {const i={id:A.uid('it'),storeId:A.S(),name:'Audit item',price:100,cost:60,stock:10,batches:[],gst:5,...overrides};A.DB().items.push(i);return i;}
function customer(A,overrides={}) {const c={id:A.uid('cu'),storeId:A.S(),name:'Audit customer',balance:0,points:0,spend:0,visits:0,...overrides};A.DB().customers.push(c);return c;}
function supplier(A,overrides={}) {const s={id:A.uid('sp'),storeId:A.S(),name:'Audit supplier',balance:0,...overrides};A.DB().suppliers.push(s);return s;}
function cart(i,extra={}) {return {lines:[{itemId:i.id,name:i.name,qty:1,price:i.price}],mode:'cash',...extra};}
module.exports={create,item,customer,supplier,cart,ROOT};
