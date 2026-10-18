const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'dashboard-preferences.js'), 'utf8');

function createHarness({ allowedModules = ['dashboard', 'obras', 'financeiro', 'orcamentos', 'equipes', 'estoque', 'clientes'] } = {}) {
  const widgets = [
    { key: 'obras-ativas', hidden: false, getAttribute: () => 'obras-ativas', hasAttribute: () => true },
    { key: 'faturamento-mensal', hidden: false, getAttribute: () => 'faturamento-mensal', hasAttribute: () => true }
  ];
  const containers = [{
    hidden: false,
    children: widgets,
    hasAttribute: () => true
  }];
  const document = {
    addEventListener() {},
    getElementById() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('data-dashboard-widget')) return widgets;
      if (selector.includes('data-dashboard-container')) return containers;
      return [];
    }
  };
  const window = {
    _reisActiveAuthScope: 'authenticated',
    _currentPermissionsLoaded: false,
    _currentPermissions: { user_id: 'user-1', empresa_id: 'company-1' },
    hasModulePermission(moduleName, action) {
      return action === 'view' && allowedModules.includes(moduleName);
    },
    getComputedStyle() {
      return { display: 'grid' };
    }
  };
  const context = vm.createContext({ window, document, console, Date });
  vm.runInContext(script, context, { filename: 'dashboard-preferences.js' });
  return { api: window.ReisFlowDashboardPreferences, widgets, containers, window };
}

test('dashboard preference defaults preserve the existing dashboard and ignore unknown stored widgets', () => {
  const { api } = createHarness();
  const normalized = api.normalizePreferences({
    'obras-ativas': false,
    'widget-descontinuado': false,
    'faturamento-mensal': 'false'
  });

  assert.equal(normalized['obras-ativas'], false);
  assert.equal(normalized['faturamento-mensal'], true);
  assert.equal(normalized['grafico-faturamento'], true);
  assert.equal(Object.hasOwn(normalized, 'widget-descontinuado'), false);
});

test('available customization options follow module grants without changing those grants', () => {
  const { api, window } = createHarness({ allowedModules: ['obras'] });
  const before = window.hasModulePermission('financeiro', 'view');
  const available = api.getAvailableWidgets();

  assert.ok(available.some(({ key }) => key === 'obras-ativas'));
  assert.ok(!available.some(({ key }) => key === 'faturamento-mensal'));
  assert.equal(window.hasModulePermission('financeiro', 'view'), before);
});

test('dashboard exposes actionable priorities without listing unavailable profit or task data', () => {
  const { api } = createHarness();
  const availableKeys = api.getAvailableWidgets().map(({ key }) => key);

  assert.ok(availableKeys.includes('acoes-prioritarias'));
  assert.ok(!availableKeys.includes('lucro-previsto'));
  assert.ok(!availableKeys.includes('tarefas-pendentes'));
});

test('hiding dashboard widgets collapses their rows and does not change component data', () => {
  const { api, widgets, containers } = createHarness();
  const data = { revenue: 1250 };
  api.applyPreferences({ 'obras-ativas': false, 'faturamento-mensal': true });

  assert.equal(widgets[0].hidden, true);
  assert.equal(widgets[1].hidden, false);
  assert.equal(containers[0].hidden, false);
  assert.equal(data.revenue, 1250);

  api.applyPreferences({ 'obras-ativas': false, 'faturamento-mensal': false });
  assert.equal(containers[0].hidden, true);
});
