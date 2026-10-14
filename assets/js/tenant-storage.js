(function (root) {
  const PREFIX = 'reisflow_scoped_v2:';
  const LEGACY_DATA_KEYS = [
    'reisflow_obra_etapas',
    'reisflow_obra_history',
    'reisflow_equipes_data',
    'reisflow_estoque_data',
    'reisflow_fornecedores_data',
    'reisflow_usuarios_sistema_data',
    'reisflow_system_config',
    'reisflow_demo_clientes',
    'reisflow_cliente_emails'
  ];
  const SESSION_FILTER_KEYS = [
    'reisflow_fin_filters',
    'reisflow_usuarios_sistema_filters',
    'reisflow_equipes_filters',
    'reisflow_fornecedores_filters',
    'reisflow_estoque_filters'
  ];

  function createTenantStorage(storage, sessionStorage) {
    let scope = null;

    function scopePrefix() {
      if (!scope) return null;
      return `${PREFIX}${scope}:`;
    }

    function clearScope() {
      const prefix = scopePrefix();
      if (!prefix) return;

      try {
        for (let index = storage.length - 1; index >= 0; index -= 1) {
          const key = storage.key(index);
          if (key?.startsWith(prefix)) storage.removeItem(key);
        }
      } catch (error) {
        console.warn('Nao foi possivel limpar o cache local da sessao.', error);
      }
    }

    function clearFilters() {
      try {
        SESSION_FILTER_KEYS.forEach((key) => sessionStorage?.removeItem(key));
      } catch (error) {
        console.warn('Nao foi possivel limpar os filtros locais da sessao.', error);
      }
    }

    function setAuthenticatedScope(userId, empresaId) {
      if (!userId || !empresaId) {
        throw new Error('Identidade autenticada e empresa sao obrigatorias para habilitar o cache.');
      }
      setScope(`user:${encodeURIComponent(userId)}:empresa:${encodeURIComponent(empresaId)}`);
    }

    function setLocalDemoScope() {
      setScope('local-demo');
    }

    function setScope(nextScope) {
      if (scope && scope !== nextScope) clearScope();
      if (scope !== nextScope) clearFilters();
      scope = nextScope;
    }

    function keyFor(logicalKey) {
      const prefix = scopePrefix();
      if (!prefix || !logicalKey) return null;
      return `${prefix}${logicalKey}`;
    }

    function getItem(logicalKey) {
      const key = keyFor(logicalKey);
      if (!key) return null;
      try {
        return storage.getItem(key);
      } catch (error) {
        console.warn('Nao foi possivel ler o cache local da sessao.', error);
        return null;
      }
    }

    function setItem(logicalKey, value) {
      const key = keyFor(logicalKey);
      if (!key) return false;
      try {
        storage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn('Nao foi possivel gravar o cache local da sessao.', error);
        return false;
      }
    }

    function removeItem(logicalKey) {
      const key = keyFor(logicalKey);
      if (!key) return false;
      try {
        storage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Nao foi possivel remover o cache local da sessao.', error);
        return false;
      }
    }

    function removeLegacyData() {
      try {
        LEGACY_DATA_KEYS.forEach((key) => storage.removeItem(key));
      } catch (error) {
        console.warn('Nao foi possivel remover caches antigos sem escopo.', error);
      }
      clearFilters();
    }

    function clearActiveScope() {
      clearScope();
      clearFilters();
      scope = null;
    }

    return {
      setAuthenticatedScope,
      setLocalDemoScope,
      getItem,
      setItem,
      removeItem,
      removeLegacyData,
      clearActiveScope
    };
  }

  const api = createTenantStorage(root.localStorage, root.sessionStorage);
  root.ReisFlowTenantStorage = api;
  if (root.localStorage) api.removeLegacyData();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createTenantStorage };
  }
})(typeof window !== 'undefined' ? window : globalThis);
