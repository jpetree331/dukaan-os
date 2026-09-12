/* Awaitable book repository. Account credentials remain in their separate local registry. */
(function (w) {
  'use strict';
  const App = w.App = w.App || {};
  App.storage = {
    async read(key) { return localStorage.getItem(key); },
    async write(key, value) { App.assertWriter(); localStorage.setItem(key, value); },
    async commit({key, expected, value, guard}) {
      guard();
      if (localStorage.getItem(key) !== expected) throw new Error('Shop data changed in another tab. Reload before saving; your cart has been kept.');
      localStorage.setItem(key, value);
    },
    async remove(key) { App.assertWriter(); localStorage.removeItem(key); }
  };
})(window);
