const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),http=require('node:http'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {ROOT}=require('./harness.cjs');
test('B26–B27: server allowlist and malformed requests; process remains healthy',async()=>{
  const child=spawn(process.execPath,[path.join(ROOT,'server.js')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  // Server logs the actual bound address, including an OS-assigned free port.
  try{
    const output=await new Promise((resolve,reject)=>{child.stdout.once('data',x=>resolve(String(x)));child.once('error',reject);child.once('exit',c=>reject(Error('Server exited '+c)));});
    const port=Number(output.match(/:(\d+)/)[1]);
    const get=(p)=>new Promise((resolve,reject)=>http.get({host:'127.0.0.1',port,path:p},r=>{let body='';r.on('data',x=>body+=x);r.on('end',()=>resolve({status:r.statusCode,body}));}).on('error',reject));
    for(const p of ['/.git/config','/.env','/server.js','/package.json','/tests/harness.cjs','/../README.md','/%2e%2e/README.md'])assert.equal((await get(p)).status,404,p);
    assert.equal((await get('/%ZZ')).status,400);assert.equal((await get('/%E0%A4%A')).status,400);
    assert.equal((await get('/')).status,200);assert.equal((await get('/js/safety.js')).status,200);
    assert.match(output,/127\.0\.0\.1/);
  }finally{child.kill();await new Promise(r=>child.once('exit',r));}
});
test('B28: service worker preserves unrelated caches and includes the complete shell',async()=>{
  const handlers={},deleted=[];let task,shell;
  const ctx={URL,self:{addEventListener:(e,f)=>handlers[e]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}},location:{origin:'https://example.test'}},
    caches:{keys:async()=>['dukaan-os-v3','dukaan-os-v4','other-app'],delete:async k=>deleted.push(k),open:async()=>({addAll:async paths=>shell=paths})}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),ctx);
  handlers.activate({waitUntil(p){task=p;}});await task;assert.deepEqual(deleted,['dukaan-os-v3']);
  handlers.install({waitUntil(p){task=p;}});await task;assert.ok(shell.includes('./js/safety.js'));
  for(const file of shell) if(file!=='./')assert.ok(fs.existsSync(path.join(ROOT,file)),file);
});
