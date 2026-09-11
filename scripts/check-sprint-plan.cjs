/* Structural planning checks only. Passing this does not verify future application behavior. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), directory = path.join(root, 'docs/sprints');
const plan = JSON.parse(fs.readFileSync(path.join(directory, 'plan.json'), 'utf8'));
const pairs = JSON.parse(fs.readFileSync(path.join(directory, 'seams.json'), 'utf8')).pairs;
const builds = new Map(plan.sprints.map(s => [s.id, s]));
const gates = new Map(plan.sprints.map(s => [s.verify, s]));
const recipes = { money:'MONEY', inventory:'STOCK', identity:'AUTH', persistence:'STORE', schema:'SCHEMA', recovery:'RECOVER', ui:'UI', locale:'LOCALE', receipts:'RECEIPT', reports:'REPORT', release:'RELEASE' };
const statuses = new Set(['planned','in-progress','built-unverified','passed','failed','blocked','stale','not-applicable']);
assert.equal(builds.size, plan.sprints.length, 'Duplicate build ID');
assert.equal(gates.size, plan.sprints.length, 'Duplicate verify ID');
assert.ok(fs.existsSync(path.join(directory, 'cards/VERIFY-00.md')), 'Missing baseline gate');
for (const s of plan.sprints) {
  assert.ok(s.id.startsWith('BUILD-') && s.verify.startsWith('VERIFY-'), 'Ambiguous sprint IDs');
  assert.ok(statuses.has(s.status) && s.status !== 'not-applicable', 'Invalid build status');
  assert.ok(s.why && s.scope && s.acceptance && s.exclusions && s.recovery, 'Incomplete card contract');
  for (const d of s.domains) assert.ok(recipes[d], 'Unknown domain '+d);
  for (const dependency of s.dependencies) assert.ok(gates.has(dependency), 'Missing dependency '+dependency);
  for (const id of [s.id,s.verify]) assert.ok(fs.existsSync(path.join(directory,'cards',id+'.md')), 'Missing card '+id);
  if (s.status === 'passed') assert.ok(/^[a-f0-9]{40}$/.test(s.codeCommit || '') && s.evidence.length, 'A passing build needs evidence');
}
const visited = new Set(), stack = new Set();
function visit(s) {
  assert.ok(!stack.has(s.id), 'Dependency cycle at '+s.id);
  if (visited.has(s.id)) return;
  stack.add(s.id); for (const d of s.dependencies) visit(gates.get(d)); stack.delete(s.id); visited.add(s.id);
}
plan.sprints.forEach(visit);
const expected = new Set();
for (let j=1;j<plan.sprints.length;j++) for(let i=0;i<j;i++) expected.add(plan.sprints[i].id+'|'+plan.sprints[j].id);
assert.equal(pairs.length,expected.size,'Missing/extra seam pairs');
const seen = new Set(), seenIds = new Set();
for (const p of pairs) {
  const key=p.earlier+'|'+p.later;
  assert.ok(expected.has(key) && !seen.has(key), 'Duplicate or unexpected pair '+key); seen.add(key);
  assert.ok(!seenIds.has(p.id),'Duplicate seam ID');seenIds.add(p.id);
  assert.ok(gates.has(p.gate) && gates.has(p.defaultGate),'Missing seam owner gate');
  assert.equal(p.defaultGate,builds.get(p.later).verify,'Incorrect default seam gate');
  const a=builds.get(p.earlier),b=builds.get(p.later),shared=a.domains.filter(d=>b.domains.includes(d));
  assert.deepEqual(p.sharedDomains,shared,'Seam domains drifted');
  assert.deepEqual(p.recipes,['BASE',...shared.map(d=>recipes[d])],'Seam recipes drifted');
  assert.equal(p.conditional,a.optional||b.optional,'Conditional scope mismatch');
  assert.ok(statuses.has(p.status),'Invalid seam status');
  if (p.status==='passed' || p.status==='not-applicable') {
    assert.ok(/^[a-f0-9]{40}$/.test(p.testedCodeCommit||'') && p.reviewer && p.evidence.length,'A closed seam needs commit/reviewer/evidence');
    if(p.status==='not-applicable') assert.ok(p.rationale && p.rationale.length>=30,'N/A needs a specific rationale');
  }
}
// Check every relative Markdown destination in this package; external sources remain citations.
let markdownFiles=0;
function walk(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(file);
    else if(entry.name.endsWith('.md')) {
      markdownFiles++;
      const text=fs.readFileSync(file,'utf8');
      for(const match of text.matchAll(/\]\(([^)]+)\)/g)) {
        const href=match[1].replace(/^<|>$/g,'').split('#')[0];
        if(!href || /^(?:[a-z]+:|\/)/i.test(href)) continue;
        assert.ok(fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(href))), 'Broken link '+href+' in '+path.relative(root,file));
      }
    }
  }
}
walk(directory);
const matrix=fs.readFileSync(path.join(directory,'SEAM-MATRIX.md'),'utf8');
assert.equal((matrix.match(/^\| SEAM-/gm)||[]).length,pairs.length,'Readable matrix row count drifted');
for(const p of pairs) {
  const row=matrix.split('\n').find(line=>line.startsWith('| '+p.id+' '));
  assert.ok(row && row.includes('['+p.gate+']') && row.endsWith('| '+p.status+' |'),'Readable matrix status/gate drifted for '+p.id);
}
console.log(`Plan structure OK: ${builds.size} build cards, ${gates.size+1} verify cards, ${pairs.length} unique pairs, ${markdownFiles} Markdown files checked. Future execution is not certified.`);
