(function (root) {
  const STORAGE_KEY = 'reisflow_dashboard_preferences';
  const GROUPS = [
    {
      key: 'financeiro',
      label: 'Financeiro',
      icon: 'ti-cash',
      items: [
        { key: 'faturamento-mensal', label: 'Recebido no mês', module: 'financeiro' },
        { key: 'contas-vencendo', label: 'Contas vencendo', module: 'financeiro' },
        { key: 'a-receber', label: 'A receber', module: 'financeiro' },
        { key: 'grafico-faturamento', label: 'Gráfico de faturamento mensal', module: 'financeiro' }
      ]
    },
    {
      key: 'operacao',
      label: 'Obras e operação',
      icon: 'ti-building-factory-2',
      items: [
        { key: 'obras-ativas', label: 'Obras ativas', module: 'obras' },
        { key: 'obras-atrasadas', label: 'Obras atrasadas e alerta de prazo', module: 'obras' },
        { key: 'status-obras', label: 'Status das obras', module: 'obras' },
        { key: 'ultimas-obras', label: 'Últimas obras', module: 'obras' },
        { key: 'acoes-prioritarias', label: 'Próximas ações', module: 'dashboard' }
      ]
    },
    {
      key: 'gestao',
      label: 'Gestão',
      icon: 'ti-users',
      items: [
        { key: 'orcamentos-pendentes', label: 'Orçamentos pendentes', module: 'orcamentos' },
        { key: 'equipes-em-campo', label: 'Equipes em campo', module: 'equipes' },
        { key: 'estoque-critico', label: 'Estoque crítico', module: 'estoque' },
        { key: 'clientes-recentes', label: 'Clientes', module: 'clientes' }
      ]
    }
  ];
  const WIDGETS = GROUPS.flatMap((group) => group.items);
  const DEFAULTS = Object.freeze(Object.fromEntries(WIDGETS.map((widget) => [widget.key, true])));

  let currentIdentity = null;
  let currentPreferences = { ...DEFAULTS };
  let draftPreferences = { ...DEFAULTS };
  let updatedAt = null;
  let preferencesLoaded = false;
  let preferencesLoading = false;
  let preferencesLoadError = null;
  let loadGeneration = 0;
  let saving = false;
  let focusBeforeOpen = null;

  function normalizePreferences(value) {
    const result = { ...DEFAULTS };
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    WIDGETS.forEach(({ key }) => {
      if (typeof value[key] === 'boolean') result[key] = value[key];
    });
    return result;
  }

  function canViewModule(moduleName) {
    if (root._reisActiveAuthScope === 'local-demo') return true;
    return typeof root.hasModulePermission === 'function'
      && root.hasModulePermission(moduleName, 'view') === true;
  }

  function getAvailableWidgets() {
    return WIDGETS.filter((widget) => canViewModule(widget.module));
  }

  function getCurrentIdentity() {
    if (root._reisActiveAuthScope === 'local-demo') return 'local-demo';
    const permissions = root._currentPermissions;
    if (root._currentPermissionsLoaded !== true || !permissions?.user_id || !permissions?.empresa_id) return null;
    return `user:${permissions.user_id}:empresa:${permissions.empresa_id}`;
  }

  function setStatus(message = '', kind = '', retry = false) {
    const status = document.getElementById('dashboard-preferences-status');
    if (!status) return;
    status.replaceChildren();
    status.className = `dashboard-preferences-status${message ? ' is-visible' : ''}${kind ? ` is-${kind}` : ''}`;
    if (message) {
      const text = document.createElement('span');
      text.textContent = message;
      status.appendChild(text);
    }
    if (retry) {
      const button = document.createElement('button');
      button.className = 'btn btn-ghost btn-xs';
      button.type = 'button';
      button.textContent = 'Tentar novamente';
      button.addEventListener('click', () => loadPreferencesForCurrentUser(true));
      status.appendChild(button);
    }
  }

  function applyPreferences(preferences) {
    const applied = normalizePreferences(preferences);
    document.querySelectorAll('#view-dashboard [data-dashboard-widget]').forEach((element) => {
      element.hidden = applied[element.getAttribute('data-dashboard-widget')] !== true;
    });

    updateDashboardContainers();
  }

  function updateDashboardContainers() {
    document.querySelectorAll('#view-dashboard [data-dashboard-container]').forEach((container) => {
      const items = Array.from(container.children).filter((child) => child.hasAttribute('data-dashboard-widget'));
      const hasVisibleItem = items.some((item) => {
        if (item.hidden) return false;
        return typeof root.getComputedStyle !== 'function' || root.getComputedStyle(item).display !== 'none';
      });
      container.hidden = !hasVisibleItem;
    });
  }

  function updateSelectionCount() {
    const count = document.getElementById('dashboard-preferences-count');
    if (!count) return;
    const available = getAvailableWidgets();
    const selected = available.filter(({ key }) => draftPreferences[key]).length;
    count.textContent = `${selected} de ${available.length} selecionados`;
  }

  function renderOptions() {
    const target = document.getElementById('dashboard-preferences-options');
    if (!target) return;
    target.replaceChildren();
    const availableKeys = new Set(getAvailableWidgets().map(({ key }) => key));
    if (!availableKeys.size) {
      const empty = document.createElement('p');
      empty.className = 'dashboard-preferences-empty';
      empty.textContent = 'Não há indicadores disponíveis para as permissões atuais.';
      target.appendChild(empty);
      updateSelectionCount();
      return;
    }

    GROUPS.forEach((group) => {
      const items = group.items.filter(({ key }) => availableKeys.has(key));
      if (!items.length) return;
      const section = document.createElement('section');
      section.className = 'dashboard-preferences-group';
      const heading = document.createElement('h3');
      const icon = document.createElement('i');
      icon.className = `ti ${group.icon}`;
      icon.setAttribute('aria-hidden', 'true');
      heading.append(icon, document.createTextNode(group.label));
      section.appendChild(heading);

      items.forEach((item) => {
        const label = document.createElement('label');
        label.className = 'dashboard-preferences-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = draftPreferences[item.key] === true;
        input.dataset.dashboardPreferenceKey = item.key;
        input.addEventListener('change', () => {
          draftPreferences[item.key] = input.checked;
          setStatus('Alterações pendentes. Salve para aplicá-las ao Dashboard.');
          updateSelectionCount();
        });
        const text = document.createElement('span');
        text.textContent = item.label;
        label.append(input, text);
        section.appendChild(label);
      });
      target.appendChild(section);
    });
    updateSelectionCount();
  }

  async function loadPreferencesForCurrentUser(force = false) {
    const identity = getCurrentIdentity();
    if (!identity) {
      preferencesLoadError = new Error('As preferências estarão disponíveis após a validação do acesso.');
      preferencesLoaded = false;
      setStatus(preferencesLoadError.message, 'warning', true);
      return false;
    }
    if (!force && identity === currentIdentity && preferencesLoaded) return true;
    if (preferencesLoading && identity === currentIdentity) return false;

    const identityChanged = identity !== currentIdentity;
    const generation = ++loadGeneration;
    const keepDraft = force && !identityChanged
      && JSON.stringify(draftPreferences) !== JSON.stringify(currentPreferences);
    const draftBeforeRetry = { ...draftPreferences };
    currentIdentity = identity;
    preferencesLoading = true;
    preferencesLoaded = false;
    preferencesLoadError = null;
    if (identityChanged) {
      currentPreferences = { ...DEFAULTS };
      draftPreferences = { ...DEFAULTS };
      updatedAt = null;
    }
    setStatus('Carregando suas preferências…');

    try {
      let storedPreferences = null;
      let storedUpdatedAt = null;
      if (identity === 'local-demo') {
        const raw = root.ReisFlowTenantStorage?.getItem(STORAGE_KEY) || null;
        if (raw) {
          const parsed = JSON.parse(raw);
          storedPreferences = parsed?.preferences;
          storedUpdatedAt = parsed?.updatedAt || null;
        }
      } else {
        const client = typeof db !== 'undefined' ? db : null;
        if (!client?.rpc) throw new Error('O serviço de preferências não está disponível.');
        const { data, error } = await client.rpc('app_my_dashboard_preferences');
        if (error) throw error;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('O servidor retornou preferências inválidas.');
        }
        storedPreferences = data.preferences;
        storedUpdatedAt = data.updated_at;
        if (storedPreferences !== null && (typeof storedPreferences !== 'object' || Array.isArray(storedPreferences))) {
          throw new Error('O formato das preferências recebidas é inválido.');
        }
        if (storedUpdatedAt !== null && typeof storedUpdatedAt !== 'string') {
          throw new Error('A versão das preferências recebida é inválida.');
        }
      }
      if (generation !== loadGeneration || identity !== getCurrentIdentity()) return false;
      currentPreferences = normalizePreferences(storedPreferences);
      draftPreferences = keepDraft ? draftBeforeRetry : { ...currentPreferences };
      updatedAt = storedUpdatedAt;
      preferencesLoaded = true;
      preferencesLoadError = null;
      applyPreferences(currentPreferences);
      setStatus(keepDraft ? 'Preferências carregadas. Suas alterações pendentes foram mantidas.' : '');
      renderOptions();
      updateSaveButton();
      return true;
    } catch (error) {
      if (generation !== loadGeneration || identity !== getCurrentIdentity()) return false;
      preferencesLoadError = error;
      preferencesLoaded = false;
      console.error('Não foi possível carregar as preferências do Dashboard.', error);
      applyPreferences(DEFAULTS);
      setStatus('Não foi possível carregar suas preferências. O Dashboard mantém a visualização padrão; tente novamente antes de salvar.', 'error', true);
      renderOptions();
      updateSaveButton();
      return false;
    } finally {
      if (generation === loadGeneration) preferencesLoading = false;
    }
  }

  function updateSaveButton() {
    const button = document.getElementById('dashboard-preferences-save');
    if (button) button.disabled = saving || !preferencesLoaded || !getCurrentIdentity();
    document.querySelectorAll('#dashboard-preferences-options input, #dashboard-preferences-restore, #dashboard-preferences-cancel, #dashboard-preferences-close')
      .forEach((control) => { control.disabled = saving; });
  }

  async function openDashboardPreferences() {
    if (typeof root.hasModulePermission === 'function'
      && !root.hasModulePermission('dashboard', 'view')) {
      if (typeof root.showToast === 'function') root.showToast('Você não tem permissão para visualizar o Dashboard.', 'warning');
      return;
    }
    focusBeforeOpen = document.activeElement;
    const modal = document.getElementById('modal-dashboard-preferences');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    if (currentIdentity !== getCurrentIdentity() || !preferencesLoaded) {
      await loadPreferencesForCurrentUser();
    } else {
      draftPreferences = { ...currentPreferences };
      renderOptions();
      setStatus('');
    }
    document.querySelector('#modal-dashboard-preferences .modal-close')?.focus();
    updateSaveButton();
  }

  function closeDashboardPreferences() {
    const modal = document.getElementById('modal-dashboard-preferences');
    if (!modal || saving) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    draftPreferences = { ...currentPreferences };
    focusBeforeOpen?.focus?.();
  }

  function handleDashboardPreferencesBackdrop(event) {
    if (event.target?.id === 'modal-dashboard-preferences') closeDashboardPreferences();
  }

  function restoreDashboardPreferencesDefaults() {
    if (!preferencesLoaded) {
      setStatus('Carregue as preferências antes de restaurar e salvar o padrão.', 'warning', true);
      return;
    }
    draftPreferences = { ...DEFAULTS };
    renderOptions();
    setStatus('Padrão restaurado no rascunho. Salve para aplicar esta visualização.');
  }

  async function saveDashboardPreferences() {
    const identity = getCurrentIdentity();
    if (!preferencesLoaded || !identity || identity !== currentIdentity || saving) {
      setStatus('As preferências ainda não estão prontas para salvar.', 'warning', true);
      return;
    }
    saving = true;
    updateSaveButton();
    setStatus('Salvando sua visualização…');
    try {
      if (identity === 'local-demo') {
        const value = JSON.stringify({ preferences: draftPreferences, updatedAt: new Date().toISOString() });
        if (root.ReisFlowTenantStorage?.setItem(STORAGE_KEY, value) !== true) {
          throw new Error('O armazenamento local da demonstração não confirmou a gravação.');
        }
        currentPreferences = { ...draftPreferences };
        updatedAt = new Date().toISOString();
      } else {
        const client = typeof db !== 'undefined' ? db : null;
        if (!client?.rpc) throw new Error('O serviço de preferências não está disponível.');
        const { data, error } = await client.rpc('app_save_dashboard_preferences', {
          requested_preferences: draftPreferences,
          expected_updated_at: updatedAt
        });
        if (error) throw error;
        if (!data || typeof data !== 'object' || !data.preferences || typeof data.preferences !== 'object'
          || Array.isArray(data.preferences) || typeof data.updated_at !== 'string') {
          throw new Error('O servidor não confirmou a persistência das preferências.');
        }
        currentPreferences = normalizePreferences(data.preferences);
        updatedAt = data.updated_at;
      }
      preferencesLoaded = true;
      applyPreferences(currentPreferences);
      saving = false;
      closeDashboardPreferences();
      if (typeof root.showToast === 'function') root.showToast('Visualização do Dashboard salva.', 'success');
    } catch (error) {
      console.error('Não foi possível salvar as preferências do Dashboard.', error);
      setStatus(`Não foi possível salvar. Suas escolhas continuam neste painel. ${error?.message || ''}`.trim(), 'error');
      if (typeof root.showToast === 'function') root.showToast('Não foi possível salvar a visualização do Dashboard.', 'error');
    } finally {
      saving = false;
      updateSaveButton();
    }
  }

  function resetForLogout() {
    currentIdentity = null;
    currentPreferences = { ...DEFAULTS };
    draftPreferences = { ...DEFAULTS };
    updatedAt = null;
    preferencesLoaded = false;
    preferencesLoading = false;
    preferencesLoadError = null;
    loadGeneration += 1;
    applyPreferences(DEFAULTS);
    const modal = document.getElementById('modal-dashboard-preferences');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
  }

  function syncPreferencesToActiveUser() {
    const appPage = document.getElementById('page-app');
    if (appPage && !appPage.classList.contains('active')) {
      resetForLogout();
      return;
    }
    const identity = getCurrentIdentity();
    if (identity && identity !== currentIdentity) void loadPreferencesForCurrentUser();
  }

  function initialize() {
    const appPage = document.getElementById('page-app');
    if (appPage && typeof root.MutationObserver === 'function') {
      const observer = new root.MutationObserver(syncPreferencesToActiveUser);
      observer.observe(appPage, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    const dashboard = document.getElementById('view-dashboard');
    if (dashboard && typeof root.MutationObserver === 'function') {
      const observer = new root.MutationObserver(updateDashboardContainers);
      observer.observe(dashboard, { attributes: true, subtree: true, attributeFilter: ['style'] });
    }
    syncPreferencesToActiveUser();
    updateDashboardContainers();
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDashboardPreferences();
    });
  }

  root.openDashboardPreferences = openDashboardPreferences;
  root.closeDashboardPreferences = closeDashboardPreferences;
  root.handleDashboardPreferencesBackdrop = handleDashboardPreferencesBackdrop;
  root.restoreDashboardPreferencesDefaults = restoreDashboardPreferencesDefaults;
  root.saveDashboardPreferences = saveDashboardPreferences;
  root.ReisFlowDashboardPreferences = Object.freeze({
    groups: GROUPS,
    widgets: WIDGETS,
    defaults: DEFAULTS,
    normalizePreferences,
    getAvailableWidgets,
    applyPreferences,
    loadPreferencesForCurrentUser
  });
  initialize();
})(typeof window !== 'undefined' ? window : globalThis);
