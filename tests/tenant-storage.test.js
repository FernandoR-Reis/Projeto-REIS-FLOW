const test = require('node:test');
const assert = require('node:assert/strict');
const { createTenantStorage } = require('../assets/js/tenant-storage.js');

class StorageMock {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return Array.from(this.values.keys())[index] || null;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test('refuses to read or write data before an authenticated tenant scope exists', () => {
  const cache = createTenantStorage(new StorageMock(), new StorageMock());

  assert.equal(cache.getItem('customers'), null);
  assert.equal(cache.setItem('customers', 'synthetic'), false);
});

test('scopes cached data to both the user and organization and clears on account switch', () => {
  const storage = new StorageMock();
  const cache = createTenantStorage(storage, new StorageMock());

  cache.setAuthenticatedScope('user-a', 'company-a');
  assert.equal(cache.setItem('customers', 'A synthetic fixture'), true);
  assert.equal(cache.getItem('customers'), 'A synthetic fixture');

  cache.setAuthenticatedScope('user-b', 'company-b');
  assert.equal(cache.getItem('customers'), null);
  assert.equal(Array.from(storage.values.keys()).some((key) => key.startsWith('reisflow_scoped_v2:user:user-a:')), false);
});

test('separates local demo cache from authenticated account data', () => {
  const storage = new StorageMock();
  const cache = createTenantStorage(storage, new StorageMock());

  cache.setLocalDemoScope();
  cache.setItem('customers', 'local-only synthetic fixture');
  cache.setAuthenticatedScope('user-a', 'company-a');

  assert.equal(cache.getItem('customers'), null);
  assert.equal(Array.from(storage.values.keys()).some((key) => key.startsWith('reisflow_scoped_v2:local-demo:')), false);
});

test('clears only the active account cache and session filters on logout', () => {
  const storage = new StorageMock();
  const session = new StorageMock({ reisflow_fin_filters: '{"search":"synthetic"}' });
  const cache = createTenantStorage(storage, session);

  cache.setAuthenticatedScope('user-a', 'company-a');
  cache.setItem('customers', 'synthetic');
  cache.clearActiveScope();

  assert.equal(cache.getItem('customers'), null);
  assert.equal(storage.length, 0);
  assert.equal(session.getItem('reisflow_fin_filters'), null);
});

test('removes old unscoped data caches without touching unrelated preferences', () => {
  const storage = new StorageMock({
    reisflow_equipes_data: 'legacy synthetic data',
    reisflow_cliente_emails: 'legacy synthetic data',
    theme: 'dark'
  });
  const cache = createTenantStorage(storage, new StorageMock());

  cache.removeLegacyData();

  assert.equal(storage.getItem('reisflow_equipes_data'), null);
  assert.equal(storage.getItem('reisflow_cliente_emails'), null);
  assert.equal(storage.getItem('theme'), 'dark');
});
