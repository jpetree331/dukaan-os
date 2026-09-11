/* An allowlisted static release, with a content-derived service-worker version. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'dist');
const assets = require('../public-assets.cjs'), headers = require('../security-headers.cjs');
// Only this generated directory may be removed; never accept a caller-provided path.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw Error('Unsafe output directory');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw Error('Refusing a linked output directory');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const hash = crypto.createHash('sha256');
for (const file of assets) hash.update(file).update(fs.readFileSync(path.join(root, file)));
hash.update(JSON.stringify(headers));
const version = hash.digest('hex').slice(0, 20);
for (const file of assets) {
  const target = path.join(output, file); fs.mkdirSync(path.dirname(target), { recursive: true });
  const data = fs.readFileSync(path.join(root, file));
  fs.writeFileSync(target, file === 'sw.js' ? data.toString().replace('security-v1', version) : data);
}
const productionHeaders = { ...headers, 'Strict-Transport-Security': 'max-age=31536000' };
fs.writeFileSync(path.join(output, '_headers'), '/*\n' + Object.entries(productionHeaders).map(([k,v]) => '  ' + k + ': ' + v).join('\n') + '\n');
console.log('Public release written to dist; version ' + version);
