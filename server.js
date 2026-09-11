/* Local development server: only the public app files are served. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const PORT = process.env.PORT || 4173;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC = new Set(['index.html', 'manifest.json', 'sw.js', 'css/app.css',
  ...['core', 'safety', 'i18n', 'qr', 'ui', 'auth', 'voice', 'pos', 'inventory', 'ledger', 'insights', 'settings', 'app'].map((s) => 'js/' + s + '.js')]);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) return res.writeHead(405, { Allow: 'GET, HEAD' }).end();
  let pathname;
  try { pathname = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { return res.writeHead(400).end('Malformed URL'); }
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!PUBLIC.has(name)) return res.writeHead(404).end('Not found');
  fs.readFile(path.join(__dirname, name), (err, body) => {
    if (err) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)], 'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}).listen(PORT, HOST, () => console.log('Dukaan OS running at http://' + HOST + ':' + server.address().port));
