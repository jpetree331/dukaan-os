module.exports = ['index.html', 'manifest.json', 'sw.js', 'css/app.css',
  ...['domain', 'storage', 'indexeddb', 'core', 'safety', 'migrations', 'i18n', 'qr', 'ui', 'auth', 'backup', 'returns', 'supplier-corrections', 'voice', 'pos', 'inventory', 'ledger', 'insights', 'settings', 'app'].map(s => 'js/' + s + '.js')];
