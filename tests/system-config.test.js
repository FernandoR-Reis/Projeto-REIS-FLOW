const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appScript = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app-part2.js'), 'utf8');

function createConfigHarness(options = {}) {
  const values = new Map();
  const messages = [];
  const storage = {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      if (options.failWrites) return false;
      values.set(key, String(value));
      return true;
    }
  };
  const window = {
    _systemConfig: null,
    ReisFlowTenantStorage: storage,
    addEventListener() {},
    confirm: () => true
  };
  const toast = { className: '', classList: { add() {} } };
  const toastIcon = { className: '' };
  const toastMessage = { textContent: '' };
  const document = {
    addEventListener() {},
    getElementById(id) {
      if (id === 'toast') return toast;
      if (id === 'toast-icon-i') return toastIcon;
      if (id === 'toast-msg') return toastMessage;
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
  const context = vm.createContext({
    window,
    document,
    console,
    hasModulePermission: () => true,
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    get messages() {
      return messages;
    }
  });
  vm.runInContext(appScript, context, { filename: 'app-part2.js' });
  return { context, values, messages, toastMessage };
}

test('loads existing auxiliary values and stores new roles against the selected area key', () => {
  const { context, values } = createConfigHarness();
  const area = context.addConfigItem('teamAreas', 'Qualidade');
  const role = context.addConfigItem('teamRoles', 'Inspetor', area);
  const saved = JSON.parse(values.get('reisflow_system_config'));

  assert.equal(area, 'qualidade');
  assert.equal(role, 'Inspetor');
  assert.equal(saved.teamAreaLabels.qualidade, 'Qualidade');
  assert.deepEqual(Array.from(saved.teamRolesByArea.qualidade), ['Inspetor']);
  assert.deepEqual(Array.from(context.getSystemConfig().supplierCategories).slice(0, 2), ['Elétrica', 'Hidráulica']);
});

test('rejects case- and accent-insensitive duplicates without overwriting the saved list', () => {
  const { context, values } = createConfigHarness();
  assert.equal(context.addConfigItem('stockCategories', 'Frete'), 'Frete');
  const before = values.get('reisflow_system_config');

  assert.equal(context.addConfigItem('stockCategories', 'FRETE'), null);
  assert.equal(values.get('reisflow_system_config'), before);
});

test('allows an explicitly empty list to remain empty after the stored config is reloaded', () => {
  const { context, values } = createConfigHarness();
  const config = context.cloneSystemConfig();
  config.stockCategories = [];
  context.saveSystemConfig(config);
  context.window._systemConfig = null;

  assert.equal(context.getSystemConfig().stockCategories.length, 0);
  assert.deepEqual(JSON.parse(values.get('reisflow_system_config')).stockCategories, []);
});

test('rejects supplier labels that collide after the persisted category-key normalization', () => {
  const { context, values } = createConfigHarness();
  assert.equal(context.addConfigItem('supplierCategories', 'Pós-venda'), 'Pós-venda');
  const before = values.get('reisflow_system_config');

  assert.equal(context.addConfigItem('supplierCategories', 'Pos venda'), null);
  assert.equal(values.get('reisflow_system_config'), before);
});

test('does not expose a new option in memory when persistence fails', () => {
  const { context, values, toastMessage } = createConfigHarness({ failWrites: true });
  const existing = Array.from(context.getSystemConfig().launchCategories);

  assert.equal(context.addConfigItem('launchCategories', 'Frete'), null);
  assert.deepEqual(Array.from(context.getSystemConfig().launchCategories), existing);
  assert.equal(values.has('reisflow_system_config'), false);
  assert.match(toastMessage.textContent, /Não foi possível salvar/);
});

test('blocks removing a category or team role that is already referenced', () => {
  const { context, values, toastMessage } = createConfigHarness();
  context.addConfigItem('teamAreas', 'Qualidade');
  context.addConfigItem('teamRoles', 'Inspetor', 'qualidade');
  vm.runInContext("estoqueData.push({ cat: 'Elétrica' }); equipeData.push({ area: 'qualidade', role: 'Inspetor' });", context);
  const before = values.get('reisflow_system_config');

  context.deleteConfigItem('stockCategories', 'Elétrica');
  context.deleteConfigItem('teamRoles', 'Inspetor', 'qualidade');

  assert.equal(values.get('reisflow_system_config'), before);
  assert.match(toastMessage.textContent, /não pode ser excluído/);
});

test('detects configuration changes from another session and refuses to overwrite them', () => {
  const { context, values, toastMessage } = createConfigHarness();
  context.getSystemConfig();
  values.set('reisflow_system_config', '{"supplierCategories":["Externamente alterada"]}');

  assert.equal(context.addConfigItem('launchCategories', 'Frete'), null);
  assert.match(toastMessage.textContent, /outra sessão/);
  assert.match(values.get('reisflow_system_config'), /Externamente alterada/);
});
