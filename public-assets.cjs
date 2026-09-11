module.exports = ['index.html', 'manifest.json', 'sw.js', 'css/app.css',
  ...['core', 'safety', 'i18n', 'qr', 'ui', 'auth', 'backup', 'voice', 'pos', 'inventory', 'ledger', 'insights', 'settings', 'app'].map(s => 'js/' + s + '.js')];
