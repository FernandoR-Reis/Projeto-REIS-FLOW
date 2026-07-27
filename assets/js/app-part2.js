const financRec = [];

const financPag = [];

window._finFilters = window._finFilters || {
  search: '',
  status: 'todos',
  period: 'todos'
};

const FIN_FILTERS_SESSION_KEY = 'reisflow_fin_filters';

function saveFinFiltersToSession() {
  try {
    sessionStorage.setItem(FIN_FILTERS_SESSION_KEY, JSON.stringify(window._finFilters || {}));
  } catch {
    // Falha silenciosa: filtros continuam em memoria.
  }
}

function loadFinFiltersFromSession() {
  try {
    const raw = sessionStorage.getItem(FIN_FILTERS_SESSION_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    window._finFilters = {
      search: String(parsed.search || ''),
      status: String(parsed.status || 'todos'),
      period: String(parsed.period || 'todos')
    };
  } catch {
    window._finFilters = window._finFilters || { search: '', status: 'todos', period: 'todos' };
  }
}

function syncFinFiltersUI() {
  const filters = window._finFilters || { search: '', status: 'todos', period: 'todos' };
  const searchEl = document.getElementById('fin-filter-search');
  const statusEl = document.getElementById('fin-filter-status');
  const periodEl = document.getElementById('fin-filter-period');

  if (searchEl) searchEl.value = filters.search || '';
  if (statusEl) statusEl.value = filters.status || 'todos';
  if (periodEl) periodEl.value = filters.period || 'todos';
}

function clearFinFilters() {
  window._finFilters = { search: '', status: 'todos', period: 'todos' };
  saveFinFiltersToSession();
  syncFinFiltersUI();
  populateFin();
}

function formatCurrencyValue(value) {
  return (typeof formatCurrencyBRL === 'function')
    ? formatCurrencyBRL(value)
    : Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window._equipesFilters = window._equipesFilters || {
  search: '',
  area: 'todos',
  role: 'todos',
  status: 'todos'
};

const EQUIPE_DATA_STORAGE_KEY = 'reisflow_equipes_data';
const EQUIPE_FILTERS_SESSION_KEY = 'reisflow_equipes_filters';
const ESTOQUE_DATA_STORAGE_KEY = 'reisflow_estoque_data';
const ESTOQUE_FILTERS_SESSION_KEY = 'reisflow_estoque_filters';
const FORNECEDORES_DATA_STORAGE_KEY = 'reisflow_fornecedores_data';
const FORNECEDORES_FILTERS_SESSION_KEY = 'reisflow_fornecedores_filters';
const USUARIOS_SISTEMA_STORAGE_KEY = 'reisflow_usuarios_sistema_data';
const USUARIOS_SISTEMA_FILTERS_SESSION_KEY = 'reisflow_usuarios_sistema_filters';

window._estoqueFilters = window._estoqueFilters || {
  search: '',
  categoria: 'todos'
};

window._fornecedoresFilters = window._fornecedoresFilters || {
  search: '',
  categoria: 'todos',
  status: 'todos'
};

window._usuariosSistemaFilters = window._usuariosSistemaFilters || {
  search: '',
  perfil: 'todos',
  status: 'todos'
};

window._permissoesEquipeFilters = window._permissoesEquipeFilters || {
  search: ''
};

const PERFIS_PADRAO_USUARIO = [
  'Administrador',
  'Financeiro',
  'Auxiliar Financeiro',
  'Comercial',
  'Compras',
  'Estoque',
  'Obras',
  'RH',
  'Gerente',
  'Visualizador'
];

const usuariosSistemaData = [];

const SYSTEM_CONFIG_STORAGE_KEY = 'reisflow_system_config';

const DEFAULT_SYSTEM_CONFIG = {
  supplierCategories: ['Elétrica', 'Hidráulica', 'Civil', 'Ferramentas', 'EPI', 'Geral'],
  stockCategories: ['Elétrica', 'Hidráulica', 'Civil', 'Ferramentas', 'EPI', 'Outros'],
  launchCategories: ['Serviços', 'Material', 'Mão de obra', 'Administrativo'],
  teamRolesByArea: {
    obras: ['Mestre de Obras', 'Pedreiro', 'Ajudante'],
    eletrica: ['Eletricista', 'Eletricista Senior', 'Técnico'],
    hidraulica: ['Encanador', 'Técnico Hidráulico', 'Ajudante'],
    civil: ['Pedreiro', 'Servente', 'Mestre de Obras'],
    administrativo: ['Comprador', 'Assistente Administrativo', 'Financeiro']
  }
};

window._systemConfig = window._systemConfig || null;

function normalizeSystemConfigList(values, fallback) {
  const list = Array.isArray(values) ? values : String(values || '')
    .split(/[\n,;]+/)
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const normalized = list.length > 0 ? list : Array.isArray(fallback) ? fallback : [];
  return Array.from(new Set(normalized));
}

function cloneDefaultSystemConfig() {
  return {
    supplierCategories: [...DEFAULT_SYSTEM_CONFIG.supplierCategories],
    stockCategories: [...DEFAULT_SYSTEM_CONFIG.stockCategories],
    launchCategories: [...DEFAULT_SYSTEM_CONFIG.launchCategories],
    teamRolesByArea: Object.fromEntries(
      Object.entries(DEFAULT_SYSTEM_CONFIG.teamRolesByArea).map(([area, roles]) => [area, [...roles]])
    )
  };
}

function normalizeUsuarioSistemaText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeUsuarioSistema(item, index = 0) {
  const perfil = PERFIS_PADRAO_USUARIO.includes(String(item?.perfil || '').trim())
    ? String(item?.perfil || '').trim()
    : 'Visualizador';
  const status = ['ativo', 'bloqueado', 'convite_pendente'].includes(String(item?.status || '').toLowerCase())
    ? String(item?.status || '').toLowerCase()
    : 'convite_pendente';

  return {
    id: String(item?.id || `usr-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`),
    equipeId: item?.equipeId || item?.equipe_id || '',
    authUserId: item?.authUserId || item?.auth_user_id || '',
    nome: String(item?.nome || item?.name || '').trim() || 'Usuário sem nome',
    email: String(item?.email || '').trim(),
    perfil,
    status,
    senhaTemporaria: String(item?.senhaTemporaria || item?.senha_temporaria || '').trim(),
    ultimoAcesso: item?.ultimoAcesso || item?.ultimo_acesso || null,
    empresa: String(item?.empresa || 'REIS FLOW').trim(),
    convitesEnviados: Number(item?.convitesEnviados || item?.convites_enviados || 0) || 0
  };
}

function saveUsuariosSistemaToStorage() {
  try {
    localStorage.setItem(USUARIOS_SISTEMA_STORAGE_KEY, JSON.stringify(usuariosSistemaData || []));
  } catch {
    // fallback in memory
  }
}

function replaceUsuariosSistemaData(items) {
  usuariosSistemaData.length = 0;
  (Array.isArray(items) ? items : []).forEach((item, index) => usuariosSistemaData.push(normalizeUsuarioSistema(item, index)));
}

async function getCurrentSupabaseUserId() {
  try {
    const { data } = await db.auth.getSession();
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}

async function syncUsuarioSistemaIdentityFromAuth() {
  const authUserId = await getCurrentSupabaseUserId();
  if (!authUserId || !window.db?.from) return false;

  try {
    const { data: perfil } = await db
      .from('profiles')
      .select('id, nome, cargo')
      .eq('id', authUserId)
      .maybeSingle();

    const { data: sessionData } = await db.auth.getSession();
    const email = String(sessionData?.session?.user?.email || '').trim();
    const nome = String(perfil?.nome || email || 'Usuário').trim();
    const cargo = normalizeRole(perfil?.cargo || 'operador');
    const equipe = (Array.isArray(equipeData) ? equipeData : []).find((member) => {
      const memberEmail = String(member?.email || '').trim().toLowerCase();
      const memberName = String(member?.name || member?.nome || '').trim().toLowerCase();
      const normalizedEmail = email.toLowerCase();
      return (normalizedEmail && memberEmail === normalizedEmail) || (nome && memberName === nome.toLowerCase());
    });

    const payload = {
      auth_user_id: authUserId,
      equipe_id: equipe?.id || null,
      nome,
      email: email || null,
      perfil: cargo === 'admin' ? 'Administrador' : cargo === 'gestor' ? 'Gerente' : cargo === 'financeiro' ? 'Financeiro' : 'Visualizador',
      status: 'ativo',
      empresa: 'REIS FLOW',
      ultimo_acesso: new Date().toISOString(),
      convites_enviados: 0
    };

    const { error } = await db
      .from('usuarios_sistema')
      .upsert(payload, { onConflict: 'auth_user_id' });

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

function seedUsuariosSistemaFromEquipes() {
  const existingByEquipeId = new Set((Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).map((item) => String(item.equipeId || '')));
  (Array.isArray(equipeData) ? equipeData : []).forEach((member, index) => {
    const teamId = String(member?.id || '').trim();
    if (!teamId || existingByEquipeId.has(teamId)) return;
    if (normalizeEquipeText(member?.status || '') === 'inativo') return;

    usuariosSistemaData.push(normalizeUsuarioSistema({
      equipeId: teamId,
      nome: member?.name || member?.nome || 'Colaborador',
      email: '',
      perfil: 'Visualizador',
      status: 'convite_pendente',
      empresa: 'REIS FLOW',
      convitesEnviados: 0
    }, index));
    existingByEquipeId.add(teamId);
  });
}

async function syncUsuariosSistemaFromSupabase(options = {}) {
  const { silent = true } = options;
  if (!window.db?.from) return false;

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return false;

  try {
    const { data, error } = await db
      .from('usuarios_sistema')
      .select('id, equipe_id, auth_user_id, nome, email, perfil, status, senha_temporaria, ultimo_acesso, empresa, convites_enviados')
      .order('created_at', { ascending: false });

    if (error) throw error;

    replaceUsuariosSistemaData(data || []);
    seedUsuariosSistemaFromEquipes();
    saveUsuariosSistemaToStorage();
    return true;
  } catch (error) {
    if (!silent) {
      showToast(`Falha ao carregar usuários no banco: ${error?.message || 'erro desconhecido'}`, 'warning');
    }
    return false;
  }
}

async function upsertUsuarioSistemaSupabase(item, editId = '') {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const payload = {
      equipe_id: item?.equipeId || null,
      nome: String(item?.nome || '').trim(),
      email: String(item?.email || '').trim(),
      perfil: String(item?.perfil || 'Visualizador').trim(),
      status: String(item?.status || 'convite_pendente').trim(),
      senha_temporaria: String(item?.senhaTemporaria || '').trim() || null,
      ultimo_acesso: item?.ultimoAcesso || null,
      empresa: String(item?.empresa || 'REIS FLOW').trim(),
      convites_enviados: Number(item?.convitesEnviados || 0) || 0,
      auth_user_id: item?.authUserId || null
    };

    if (editId) {
      const { data, error } = await db
        .from('usuarios_sistema')
        .update(payload)
        .eq('id', editId)
        .select('id, equipe_id, auth_user_id, nome, email, perfil, status, senha_temporaria, ultimo_acesso, empresa, convites_enviados')
        .single();

      if (error) throw error;
      return { ok: true, row: data };
    }

    const { data, error } = await db
      .from('usuarios_sistema')
      .insert(payload)
      .select('id, equipe_id, auth_user_id, nome, email, perfil, status, senha_temporaria, ultimo_acesso, empresa, convites_enviados')
      .single();

    if (error) throw error;
    return { ok: true, row: data };
  } catch (error) {
    return { ok: false, fallback: false, error };
  }
}

async function updateUsuarioSistemaStatusSupabase(id, nextStatus) {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const { data, error } = await db
      .from('usuarios_sistema')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('id, equipe_id, auth_user_id, nome, email, perfil, status, senha_temporaria, ultimo_acesso, empresa, convites_enviados')
      .single();

    if (error) throw error;
    return { ok: true, row: data };
  } catch (error) {
    return { ok: false, fallback: false, error };
  }
}

function loadUsuariosSistemaFromStorage() {
  try {
    const raw = localStorage.getItem(USUARIOS_SISTEMA_STORAGE_KEY);
    if (!raw) {
      seedUsuariosSistemaFromEquipes();
      saveUsuariosSistemaToStorage();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    replaceUsuariosSistemaData(parsed);
    seedUsuariosSistemaFromEquipes();
    saveUsuariosSistemaToStorage();
  } catch {
    seedUsuariosSistemaFromEquipes();
    saveUsuariosSistemaToStorage();
  }
}

function saveUsuariosSistemaFiltersToSession() {
  try {
    sessionStorage.setItem(USUARIOS_SISTEMA_FILTERS_SESSION_KEY, JSON.stringify(window._usuariosSistemaFilters || {}));
  } catch {
    // falha silenciosa
  }
}

function loadUsuariosSistemaFiltersFromSession() {
  try {
    const raw = sessionStorage.getItem(USUARIOS_SISTEMA_FILTERS_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    window._usuariosSistemaFilters = {
      search: String(parsed.search || ''),
      perfil: String(parsed.perfil || 'todos'),
      status: String(parsed.status || 'todos')
    };
  } catch {
    window._usuariosSistemaFilters = window._usuariosSistemaFilters || { search: '', perfil: 'todos', status: 'todos' };
  }
}

function syncUsuariosSistemaFiltersUI() {
  const filters = window._usuariosSistemaFilters || { search: '', perfil: 'todos', status: 'todos' };
  const searchEl = document.getElementById('usr-filter-search');
  const perfilEl = document.getElementById('usr-filter-perfil');
  const statusEl = document.getElementById('usr-filter-status');
  if (searchEl) searchEl.value = filters.search || '';
  if (perfilEl) perfilEl.value = filters.perfil || 'todos';
  if (statusEl) statusEl.value = filters.status || 'todos';
}

function getFilteredUsuariosSistema() {
  const filters = window._usuariosSistemaFilters || { search: '', perfil: 'todos', status: 'todos' };
  const search = normalizeUsuarioSistemaText(filters.search || '');
  const perfil = normalizeUsuarioSistemaText(filters.perfil || 'todos');
  const status = normalizeUsuarioSistemaText(filters.status || 'todos');

  return (Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).filter((item) => {
    if (perfil !== 'todos' && normalizeUsuarioSistemaText(item.perfil) !== perfil) return false;
    if (status !== 'todos' && normalizeUsuarioSistemaText(item.status) !== status) return false;
    if (!search) return true;
    const searchable = `${item.nome} ${item.email} ${item.perfil} ${item.empresa}`;
    return normalizeUsuarioSistemaText(searchable).includes(search);
  });
}

function getUsuarioSistemaStatusLabel(status) {
  const value = normalizeUsuarioSistemaText(status);
  if (value === 'ativo') return '<span class="badge badge-success">Ativo</span>';
  if (value === 'bloqueado') return '<span class="badge badge-danger">Bloqueado</span>';
  return '<span class="badge badge-neutral">Sem acesso</span>';
}

function populateUsuariosSistema() {
  const tbody = document.getElementById('usr-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = getFilteredUsuariosSistema();
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center">Nenhum usuário encontrado com os filtros atuais.</td></tr>';
    updateUsuariosSistemaSummary();
    return;
  }

  list.forEach((item) => {
    const idSafe = String(item.id || '').replace(/'/g, '&#39;');
    const equipe = (Array.isArray(equipeData) ? equipeData : []).find((member) => String(member.id || '') === String(item.equipeId || ''));
    const nomeEquipe = equipe?.name || equipe?.nome || item.nome;
    tbody.innerHTML += `<tr>
      <td>
        <div class="bold">${item.nome}</div>
        <div style="font-size:11px;color:var(--text-muted)">${nomeEquipe}</div>
      </td>
      <td class="muted">${item.email || '—'}</td>
      <td><span class="badge badge-neutral">${item.perfil}</span></td>
      <td>${getUsuarioSistemaStatusLabel(item.status)}</td>
      <td class="muted">${item.ultimoAcesso ? new Date(item.ultimoAcesso).toLocaleString('pt-BR') : 'Sem acesso ainda'}</td>
      <td class="muted">${item.empresa || 'REIS FLOW'}</td>
      <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="openEditarUsuarioSistema('${idSafe}')"><i class="ti ti-edit"></i></button><button class="btn btn-ghost btn-xs" onclick="toggleUsuarioSistemaStatus('${idSafe}')"><i class="ti ti-lock"></i></button></div></td>
    </tr>`;
  });

  updateUsuariosSistemaSummary();
}

function updateUsuariosSistemaSummary() {
  const summary = document.getElementById('usuarios-summary');
  if (!summary) return;
  const total = (Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).length;
  const ativos = (Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).filter((item) => item.status === 'ativo').length;
  summary.textContent = `${total} usuários cadastrados · ${ativos} ativos`;
}

function onUsuariosSistemaFiltersChange() {
  window._usuariosSistemaFilters = {
    search: document.getElementById('usr-filter-search')?.value || '',
    perfil: document.getElementById('usr-filter-perfil')?.value || 'todos',
    status: document.getElementById('usr-filter-status')?.value || 'todos'
  };
  saveUsuariosSistemaFiltersToSession();
  populateUsuariosSistema();
}

function clearUsuariosSistemaFilters() {
  window._usuariosSistemaFilters = { search: '', perfil: 'todos', status: 'todos' };
  saveUsuariosSistemaFiltersToSession();
  syncUsuariosSistemaFiltersUI();
  populateUsuariosSistema();
}

function resetUsuarioSistemaModal() {
  // Fluxo legado substituido pelo cadastro de acesso em Equipes.
}

function renderUsuariosSistemaColaboradorOptions() {
  // Fluxo legado substituido pelo cadastro direto em Equipes.
}

function openNovoUsuarioSistema() {
  openPermissoesEquipeModal();
}

function openEditarUsuarioSistema(id) {
  const item = (Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).find((row) => String(row.id || '') === String(id || ''));
  if (!item) {
    showToast('Usuário não encontrado.', 'warning');
    return;
  }
  if (item.equipeId) {
    openEditarMembroEquipe(item.equipeId);
    return;
  }
  showToast('Edite este acesso pelo cadastro do colaborador em Equipes.', 'info');
}

function toggleUsuarioSistemaStatus(id) {
  const idx = (Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).findIndex((row) => String(row.id || '') === String(id || ''));
  if (idx < 0) return;
  usuariosSistemaData[idx].status = usuariosSistemaData[idx].status === 'bloqueado' ? 'ativo' : 'bloqueado';
  saveUsuariosSistemaToStorage();
  populateUsuariosSistema();
  showToast(usuariosSistemaData[idx].status === 'bloqueado' ? 'Usuário bloqueado.' : 'Usuário ativado.', 'success');
}

function getPermissaoAcessoByEquipeId(equipeId) {
  const id = String(equipeId || '').trim();
  if (!id) return null;
  return (Array.isArray(usuariosSistemaData) ? usuariosSistemaData : []).find((row) => String(row.equipeId || '') === id) || null;
}

function getPermissaoStatusBadgeByEquipeId(equipeId) {
  const acesso = getPermissaoAcessoByEquipeId(equipeId);
  if (!acesso) return '<span class="badge badge-neutral">Sem acesso</span>';
  return getUsuarioSistemaStatusLabel(acesso.status);
}

function getPermissaoPerfilByEquipeId(equipeId) {
  const acesso = getPermissaoAcessoByEquipeId(equipeId);
  if (!acesso) return 'Sem acesso';
  return acesso.perfil || 'Visualizador';
}

function getPermissoesEquipeFilteredList() {
  const search = normalizeUsuarioSistemaText(window._permissoesEquipeFilters?.search || '');
  return (Array.isArray(equipeData) ? equipeData : []).filter((member) => {
    if (!search) return true;
    const acesso = getPermissaoAcessoByEquipeId(member.id);
    const status = String(acesso?.status || 'sem acesso');
    const perfil = String(acesso?.perfil || 'sem acesso');
    const corpus = `${member.name} ${member.role} ${member.area} ${status} ${perfil}`;
    return normalizeUsuarioSistemaText(corpus).includes(search);
  });
}

function updatePermissoesEquipeSummary() {
  const el = document.getElementById('eq-permissoes-summary');
  if (!el) return;
  const total = (Array.isArray(equipeData) ? equipeData : []).length;
  const ativos = (Array.isArray(equipeData) ? equipeData : []).filter((member) => {
    const acesso = getPermissaoAcessoByEquipeId(member.id);
    return String(acesso?.status || '').toLowerCase() === 'ativo';
  }).length;
  el.textContent = `${total} colaboradores · ${ativos} com acesso ativo`;
}

function populatePermissoesEquipeModal() {
  const tbody = document.getElementById('eq-permissoes-tbody');
  if (!tbody) return;

  const list = getPermissoesEquipeFilteredList();
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center">Nenhum colaborador encontrado.</td></tr>';
    updatePermissoesEquipeSummary();
    return;
  }

  tbody.innerHTML = list.map((member) => {
    const idSafe = String(member.id || '').replace(/'/g, '&#39;');
    const acesso = getPermissaoAcessoByEquipeId(member.id);
    const perfil = acesso?.perfil || '—';
    return `<tr>
      <td><div class="bold">${member.name}</div></td>
      <td class="muted">${member.role || '—'}</td>
      <td class="muted">${getEquipeAreaLabel(member.area)}</td>
      <td><span class="badge badge-neutral">${perfil}</span></td>
      <td>${getPermissaoStatusBadgeByEquipeId(member.id)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-xs" onclick="openEditarPermissaoEquipe('${idSafe}')"><i class="ti ti-edit"></i></button>
          <button class="btn btn-ghost btn-xs" onclick="togglePermissaoEquipeStatus('${idSafe}')"><i class="ti ti-lock"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  updatePermissoesEquipeSummary();
}

function onPermissoesEquipeFiltersChange() {
  window._permissoesEquipeFilters = {
    search: document.getElementById('eq-permissoes-search')?.value || ''
  };
  populatePermissoesEquipeModal();
}

function openPermissoesEquipeModal() {
  openModal('modal-permissoes-equipe');
  populatePermissoesEquipeModal();
}

function openNovoMembroFromPermissoes() {
  openModal('modal-novo-membro');
  resetNovoMembroModal();
}

function openEditarPermissaoEquipe(memberId) {
  openEditarMembroEquipe(memberId);
}

async function togglePermissaoEquipeStatus(memberId) {
  const member = (Array.isArray(equipeData) ? equipeData : []).find((item) => String(item.id || '') === String(memberId || ''));
  if (!member) return;

  const acesso = getPermissaoAcessoByEquipeId(member.id);
  if (!acesso) {
    showToast('Colaborador sem acesso cadastrado.', 'info');
    return;
  }

  const currentStatus = String(acesso.status || '').toLowerCase();
  if (currentStatus !== 'ativo' && currentStatus !== 'bloqueado') {
    showToast('Defina o acesso pelo cadastro do colaborador.', 'warning');
    return;
  }

  const nextStatus = currentStatus === 'bloqueado' ? 'ativo' : 'bloqueado';
  const result = await updateUsuarioSistemaStatusSupabase(acesso.id, nextStatus);

  if (result.ok && result.row) {
    const idx = usuariosSistemaData.findIndex((row) => String(row.id || '') === String(acesso.id || ''));
    if (idx >= 0) usuariosSistemaData[idx] = normalizeUsuarioSistema(result.row, idx);
    saveUsuariosSistemaToStorage();
    populatePermissoesEquipeModal();
    showToast(nextStatus === 'bloqueado' ? 'Acesso bloqueado.' : 'Acesso liberado.', 'success');
    return;
  }

  if (result.fallback) {
    const idx = usuariosSistemaData.findIndex((row) => String(row.id || '') === String(acesso.id || ''));
    if (idx >= 0) {
      usuariosSistemaData[idx].status = nextStatus;
      saveUsuariosSistemaToStorage();
      populatePermissoesEquipeModal();
      showToast('Acesso atualizado localmente.', 'warning');
      return;
    }
  }

  showToast(`Não foi possível alterar acesso: ${result?.error?.message || 'erro desconhecido'}`, 'error');
}

function onEquipeAcessoChange(value) {
  const perfil = document.getElementById('eq-perfil-acesso');
  if (!perfil) return;
  const hasAccess = String(value || 'nao') === 'sim';
  perfil.disabled = !hasAccess;
  if (!hasAccess) perfil.value = 'Visualizador';
}

function buildUsuarioSistemaPayload() {
  return {
    equipeId: '',
    email: '',
    perfil: 'Visualizador',
    status: 'bloqueado',
    nome: ''
  };
}

async function salvarUsuarioSistema() {
  showToast('Cadastro de acesso agora é feito no modal de Equipes.', 'info');
}

function loadUsuariosSistemaIntoUI() {
  loadUsuariosSistemaFromStorage();
}

async function refreshUsuariosSistemaData() {
  const hasSession = await hasSupabaseSession();
  if (hasSession) {
    const synced = await syncUsuariosSistemaFromSupabase({ silent: true });
    if (!synced) loadUsuariosSistemaFromStorage();
  } else {
    loadUsuariosSistemaFromStorage();
  }
}

function loadSystemConfig() {
  if (window._systemConfig) return window._systemConfig;

  let parsed = null;
  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_STORAGE_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  const config = cloneDefaultSystemConfig();
  if (parsed && typeof parsed === 'object') {
    config.supplierCategories = normalizeSystemConfigList(parsed.supplierCategories, config.supplierCategories);
    config.stockCategories = normalizeSystemConfigList(parsed.stockCategories, config.stockCategories);
    config.launchCategories = normalizeSystemConfigList(parsed.launchCategories, config.launchCategories);
    const teamRoles = parsed.teamRolesByArea && typeof parsed.teamRolesByArea === 'object' ? parsed.teamRolesByArea : {};
    Object.keys(config.teamRolesByArea).forEach((area) => {
      config.teamRolesByArea[area] = normalizeSystemConfigList(teamRoles[area], config.teamRolesByArea[area]);
    });
  }

  window._systemConfig = config;
  return config;
}

function getSystemConfig() {
  return loadSystemConfig();
}

function saveSystemConfig(config) {
  const next = {
    supplierCategories: normalizeSystemConfigList(config?.supplierCategories, DEFAULT_SYSTEM_CONFIG.supplierCategories),
    stockCategories: normalizeSystemConfigList(config?.stockCategories, DEFAULT_SYSTEM_CONFIG.stockCategories),
    launchCategories: normalizeSystemConfigList(config?.launchCategories, DEFAULT_SYSTEM_CONFIG.launchCategories),
    teamRolesByArea: {}
  };

  Object.keys(DEFAULT_SYSTEM_CONFIG.teamRolesByArea).forEach((area) => {
    next.teamRolesByArea[area] = normalizeSystemConfigList(
      config?.teamRolesByArea?.[area],
      DEFAULT_SYSTEM_CONFIG.teamRolesByArea[area]
    );
  });

  window._systemConfig = next;
  try {
    localStorage.setItem(SYSTEM_CONFIG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Falha silenciosa: a UI continua usando a versão em memória.
  }

  return next;
}

function slugifyCategoryLabel(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getConfiguredSupplierCategoryOptions() {
  return getSystemConfig().supplierCategories.map((label) => ({ value: slugifyCategoryLabel(label), label }));
}

function getConfiguredStockCategoryOptions() {
  return getSystemConfig().stockCategories.map((label) => ({ value: label, label }));
}

function getConfiguredLaunchCategoryOptions() {
  return getSystemConfig().launchCategories.map((label) => ({ value: label, label }));
}

function getConfiguredTeamRolesByArea() {
  return getSystemConfig().teamRolesByArea;
}

function renderConfigTextareaValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = Array.isArray(value) ? value.join('\n') : String(value || '');
}

function renderSystemConfigEditor() {
  const config = getSystemConfig();
  renderConfigTextareaValue('cfg-supplier-categories', config.supplierCategories);
  renderConfigTextareaValue('cfg-stock-categories', config.stockCategories);
  renderConfigTextareaValue('cfg-launch-categories', config.launchCategories);
  renderConfigTextareaValue('cfg-team-roles-obras', config.teamRolesByArea.obras);
  renderConfigTextareaValue('cfg-team-roles-eletrica', config.teamRolesByArea.eletrica);
  renderConfigTextareaValue('cfg-team-roles-hidraulica', config.teamRolesByArea.hidraulica);
  renderConfigTextareaValue('cfg-team-roles-civil', config.teamRolesByArea.civil);
  renderConfigTextareaValue('cfg-team-roles-administrativo', config.teamRolesByArea.administrativo);
}

function saveSystemConfigFromEditor() {
  const next = {
    supplierCategories: normalizeSystemConfigList(document.getElementById('cfg-supplier-categories')?.value, DEFAULT_SYSTEM_CONFIG.supplierCategories),
    stockCategories: normalizeSystemConfigList(document.getElementById('cfg-stock-categories')?.value, DEFAULT_SYSTEM_CONFIG.stockCategories),
    launchCategories: normalizeSystemConfigList(document.getElementById('cfg-launch-categories')?.value, DEFAULT_SYSTEM_CONFIG.launchCategories),
    teamRolesByArea: {
      obras: normalizeSystemConfigList(document.getElementById('cfg-team-roles-obras')?.value, DEFAULT_SYSTEM_CONFIG.teamRolesByArea.obras),
      eletrica: normalizeSystemConfigList(document.getElementById('cfg-team-roles-eletrica')?.value, DEFAULT_SYSTEM_CONFIG.teamRolesByArea.eletrica),
      hidraulica: normalizeSystemConfigList(document.getElementById('cfg-team-roles-hidraulica')?.value, DEFAULT_SYSTEM_CONFIG.teamRolesByArea.hidraulica),
      civil: normalizeSystemConfigList(document.getElementById('cfg-team-roles-civil')?.value, DEFAULT_SYSTEM_CONFIG.teamRolesByArea.civil),
      administrativo: normalizeSystemConfigList(document.getElementById('cfg-team-roles-administrativo')?.value, DEFAULT_SYSTEM_CONFIG.teamRolesByArea.administrativo)
    }
  };

  saveSystemConfig(next);
  refreshConfigDrivenSelects();
  renderSystemConfigEditor();
  showToast('Cadastros auxiliares atualizados com sucesso!', 'success');
}

function resetSystemConfigToDefaults() {
  saveSystemConfig(cloneDefaultSystemConfig());
  refreshConfigDrivenSelects();
  renderSystemConfigEditor();
  showToast('Cadastros auxiliares restaurados ao padrão.', 'info');
}

function renderSelectOptions(select, options, placeholder) {
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';
  if (placeholder) {
    select.innerHTML += `<option value="">${placeholder}</option>`;
  }
  options.forEach((item) => {
    const value = String(item?.value || item?.label || '').trim();
    const label = String(item?.label || item?.value || '').trim();
    if (!value && !label) return;
    select.innerHTML += `<option value="${String(value).replace(/"/g, '&quot;')}">${label}</option>`;
  });
  if (currentValue && Array.from(select.options).some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function refreshConfigDrivenSelects() {
  const supplierOptions = getConfiguredSupplierCategoryOptions();
  const stockOptions = getConfiguredStockCategoryOptions();
  const launchOptions = getConfiguredLaunchCategoryOptions();

  renderSelectOptions(document.getElementById('forn-categoria'), supplierOptions, 'Selecione');
  renderSelectOptions(document.getElementById('forn-filter-categoria'), [{ value: 'todos', label: 'Todas as categorias' }, ...supplierOptions], null);
  renderSelectOptions(document.getElementById('estoque-filter-categoria'), [{ value: 'todos', label: 'Todas as categorias' }, ...stockOptions], null);
  renderSelectOptions(document.getElementById('est-item-categoria'), [{ value: '', label: 'Selecione' }, ...stockOptions], null);
  renderSelectOptions(document.getElementById('est-edit-categoria'), stockOptions, null);
  renderSelectOptions(document.getElementById('fin-categoria'), launchOptions, null);

  const configRoles = getConfiguredTeamRolesByArea();
  const currentArea = document.getElementById('eq-area')?.value || 'obras';
  const roles = configRoles[currentArea] || configRoles.obras || [];
  const roleSelect = document.getElementById('eq-funcao');
  const selectedRole = roleSelect?.value || '';
  if (roleSelect) {
    renderSelectOptions(roleSelect, roles.map((role) => ({ value: role, label: role })), null);
    if (selectedRole && roles.includes(selectedRole)) roleSelect.value = selectedRole;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof refreshConfigDrivenSelects === 'function') {
    refreshConfigDrivenSelects();
  }
});

const EQUIPE_ROLES_BY_AREA = {
  obras: ['Mestre de Obras', 'Pedreiro', 'Ajudante'],
  eletrica: ['Eletricista', 'Eletricista Senior', 'Técnico'],
  hidraulica: ['Encanador', 'Técnico Hidráulico', 'Ajudante'],
  civil: ['Pedreiro', 'Servente', 'Mestre de Obras'],
  administrativo: ['Comprador', 'Assistente Administrativo', 'Financeiro']
};

function normalizeEquipeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getEquipeRolesByArea(area) {
  const key = String(area || 'obras').toLowerCase();
  const configRoles = getConfiguredTeamRolesByArea ? getConfiguredTeamRolesByArea() : null;
  return configRoles?.[key] || DEFAULT_SYSTEM_CONFIG.teamRolesByArea[key] || EQUIPE_ROLES_BY_AREA[key] || EQUIPE_ROLES_BY_AREA.obras;
}

function getEquipeAreaLabel(area) {
  const key = String(area || '').toLowerCase();
  const map = {
    obras: 'Obras',
    eletrica: 'Elétrica',
    hidraulica: 'Hidráulica',
    civil: 'Civil',
    administrativo: 'Administrativo'
  };
  return map[key] || 'Obras';
}

function buildEquipeInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'EQ';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function createEquipeFieldFormatter(kind) {
  const type = String(kind || '').toLowerCase();
  if (type === 'telefone') {
    return (value) => {
      if (typeof formatarTelefoneBr === 'function') return formatarTelefoneBr(value || '');
      const d = String(value || '').replace(/\D/g, '').slice(0, 11);
      if (!d) return '';
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
  }

  if (type === 'diaria') {
    return (value) => {
      const digits = String(value || '').replace(/\D/g, '');
      if (!digits) return '';
      const amount = Number(digits) / 100;
      return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
  }

  if (type === 'comissao') {
    return (value) => {
      let text = String(value || '').replace('%', '').replace(/\./g, ',').replace(/[^\d,]/g, '');
      if (!text) return '';

      const commaIndex = text.indexOf(',');
      if (commaIndex >= 0) {
        const intPart = text.slice(0, commaIndex);
        const decPart = text.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2);
        text = `${intPart || '0'},${decPart}`;
      }

      return text;
    };
  }

  return (value) => String(value || '');
}

const _equipePhoneFormatter = createEquipeFieldFormatter('telefone');
const _equipeDiariaFormatter = createEquipeFieldFormatter('diaria');
const _equipeComissaoFormatter = createEquipeFieldFormatter('comissao');

function onEquipePhoneInput(input) {
  if (!input) return;
  input.value = _equipePhoneFormatter(input.value);
}

function onEquipeDiariaInput(input) {
  if (!input) return;
  input.value = _equipeDiariaFormatter(input.value);
}

function onEquipeComissaoInput(input) {
  if (!input) return;
  input.value = _equipeComissaoFormatter(input.value);
}

function formatEquipeComissaoValue(value) {
  const raw = _equipeComissaoFormatter(value || '');
  if (!raw) return '0%';

  const clean = String(raw).endsWith(',') ? String(raw).slice(0, -1) : String(raw);
  if (!clean) return '0%';
  return `${clean}%`;
}

function onEquipeComissaoBlur(input) {
  if (!input) return;
  const raw = _equipeComissaoFormatter(input.value);
  input.value = raw ? formatEquipeComissaoValue(raw) : '';
}

function setEquipeRoleOptions(area, selectedRole = '') {
  const select = document.getElementById('eq-funcao');
  if (!select) return;

  const roles = getEquipeRolesByArea(area);
  select.innerHTML = roles.map((role) => `<option value="${role}">${role}</option>`).join('');

  const hasSelected = roles.some((role) => normalizeEquipeText(role) === normalizeEquipeText(selectedRole));
  select.value = hasSelected ? selectedRole : roles[0];
}

function onEquipeAreaChange(area) {
  setEquipeRoleOptions(area);
}

function saveEquipesFiltersToSession() {
  try {
    sessionStorage.setItem(EQUIPE_FILTERS_SESSION_KEY, JSON.stringify(window._equipesFilters || {}));
  } catch {
    // Falha silenciosa: filtros seguem em memoria.
  }
}

function loadEquipesFiltersFromSession() {
  try {
    const raw = sessionStorage.getItem(EQUIPE_FILTERS_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    window._equipesFilters = {
      search: String(parsed.search || ''),
      area: String(parsed.area || 'todos'),
      role: String(parsed.role || 'todos'),
      status: String(parsed.status || 'todos')
    };
  } catch {
    window._equipesFilters = window._equipesFilters || { search: '', area: 'todos', role: 'todos', status: 'todos' };
  }
}

function syncEquipesFiltersUI() {
  const filters = window._equipesFilters || { search: '', area: 'todos', role: 'todos', status: 'todos' };
  const searchEl = document.getElementById('equipes-filter-search');
  const areaEl = document.getElementById('equipes-filter-area');
  const roleEl = document.getElementById('equipes-filter-role');
  const statusEl = document.getElementById('equipes-filter-status');

  if (searchEl) searchEl.value = filters.search || '';
  if (areaEl) areaEl.value = filters.area || 'todos';
  if (roleEl) roleEl.value = filters.role || 'todos';
  if (statusEl) statusEl.value = filters.status || 'todos';
}

function onEquipesFiltersChange() {
  window._equipesFilters = {
    search: document.getElementById('equipes-filter-search')?.value || '',
    area: document.getElementById('equipes-filter-area')?.value || 'todos',
    role: document.getElementById('equipes-filter-role')?.value || 'todos',
    status: document.getElementById('equipes-filter-status')?.value || 'todos'
  };
  saveEquipesFiltersToSession();
  populateEquipes();
}

function clearEquipesFilters() {
  window._equipesFilters = { search: '', area: 'todos', role: 'todos', status: 'todos' };
  saveEquipesFiltersToSession();
  syncEquipesFiltersUI();
  populateEquipes();
}

function normalizeEquipeMember(member, index = 0) {
  const fallbackGradients = [
    'linear-gradient(135deg,#1B4F6B,#2176A3)',
    'linear-gradient(135deg,#4A1B8F,#7B3FC4)',
    'linear-gradient(135deg,#0F6E56,#1D9E75)',
    'linear-gradient(135deg,#6B3A1F,#A3612A)',
    'linear-gradient(135deg,#1A4B3B,#2A8A6B)',
    'linear-gradient(135deg,#3B3B1A,#8A8A2A)'
  ];

  const name = String(member?.name || '').trim() || 'Sem nome';
  const area = String(member?.area || 'obras').toLowerCase();
  const role = String(member?.role || getEquipeRolesByArea(area)[0] || 'Técnico').trim();

  return {
    id: String(member?.id || `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    name,
    role,
    area,
    diaria: String(member?.diaria || 'R$ 0,00'),
    obra: String(member?.obra || '—'),
    status: String(member?.status || 'disponivel').toLowerCase(),
    initials: String(member?.initials || buildEquipeInitials(name)),
    bg: String(member?.bg || fallbackGradients[index % fallbackGradients.length]),
    tel: String(member?.tel || ''),
    email: String(member?.email || '')
  };
}

function parseEquipeComissaoToNumber(value) {
  const raw = String(value || '')
    .replace('%', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function mapEquipeRowToUi(row, index = 0) {
  return normalizeEquipeMember({
    id: row?.id,
    name: row?.nome,
    area: row?.area,
    role: row?.funcao,
    tel: row?.telefone,
    email: row?.email,
    diaria: formatCurrencyValue(Number(row?.diaria || 0)),
    obra: row?.obras?.codigo || '—',
    status: row?.status
  }, index);
}

function replaceEquipeData(items) {
  equipeData.length = 0;
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    equipeData.push(normalizeEquipeMember(item, index));
  });
}

function loadEquipesFromStorageLegacy() {
  try {
    const raw = localStorage.getItem(EQUIPE_DATA_STORAGE_KEY);
    if (!raw) {
      for (let i = 0; i < equipeData.length; i += 1) {
        equipeData[i] = normalizeEquipeMember(equipeData[i], i);
      }
      equipesLastSyncSource = 'local';
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    replaceEquipeData(parsed);
    equipesLastSyncSource = 'local';
  } catch {
    for (let i = 0; i < equipeData.length; i += 1) {
      equipeData[i] = normalizeEquipeMember(equipeData[i], i);
    }
    equipesLastSyncSource = 'local';
  }
}

function saveEquipesToStorage() {
  try {
    localStorage.setItem(EQUIPE_DATA_STORAGE_KEY, JSON.stringify(equipeData || []));
  } catch {
    // Falha silenciosa: modulo continua funcional em memoria.
  }
}

async function resolveObraIdFromInput(obraCode) {
  const code = String(obraCode || '').trim();
  if (!code || code === '—') return null;

  const byMemory = (Array.isArray(obras) ? obras : []).find((item) => String(item.code || '').trim() === code);
  if (byMemory?.id) return byMemory.id;

  if (!window.db?.from) return null;

  try {
    const { data, error } = await db
      .from('obras')
      .select('id')
      .eq('codigo', code)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.id || null;
  } catch {
    return null;
  }
}

function buildEquipeDbPayload(member, obraId = null) {
  return {
    nome: String(member?.name || '').trim(),
    area: String(member?.area || 'obras').trim().toLowerCase(),
    funcao: String(member?.role || '').trim(),
    telefone: String(member?.tel || '').trim() || null,
    email: String(member?.email || '').trim() || null,
    diaria: parseCurrencyValue(member?.diaria || 0),
    comissao_percentual: 0,
    obra_id: obraId,
    status: String(member?.status || 'disponivel').trim().toLowerCase()
  };
}

async function syncEquipesFromSupabase(options = {}) {
  const { silent = true } = options;
  if (!window.db?.from) return false;

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return false;

  try {
    const { data, error } = await db
      .from('equipe')
      .select('id, nome, area, funcao, telefone, email, diaria, comissao_percentual, status, obras(codigo)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    replaceEquipeData((data || []).map((row, index) => mapEquipeRowToUi(row, index)));
    equipesLastSyncSource = 'supabase';
    saveEquipesToStorage();
    return true;
  } catch (error) {
    equipesLastSyncSource = 'local';
    if (!silent) {
      const msg = isFornecedorSupabaseFallbackError(error)
        ? 'Sem sessão ativa no banco. Mantendo equipes locais.'
        : `Falha ao carregar equipes no banco: ${error?.message || 'erro desconhecido'}`;
      showToast(msg, isFornecedorSupabaseFallbackError(error) ? 'warning' : 'error');
    }
    return false;
  }
}

async function loadEquipesFromStorage(options = {}) {
  const { preferSupabase = true, silent = true } = options;

  if (!preferSupabase) {
    loadEquipesFromStorageLegacy();
    populateEquipes();
    return;
  }

  const hasSession = await hasSupabaseSession();
  if (hasSession) {
    const synced = await syncEquipesFromSupabase({ silent });
    if (synced) {
      populateEquipes();
      return;
    }
  }

  loadEquipesFromStorageLegacy();
  populateEquipes();
}

async function upsertEquipeSupabase(member, editId = '') {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const obraId = await resolveObraIdFromInput(member?.obra);
    const payload = buildEquipeDbPayload(member, obraId);

    if (editId) {
      const { data, error } = await db
        .from('equipe')
        .update(payload)
        .eq('id', editId)
        .select('id, nome, area, funcao, telefone, email, diaria, comissao_percentual, status, obras(codigo)')
        .single();

      if (error) throw error;
      return { ok: true, row: data };
    }

    const { data, error } = await db
      .from('equipe')
      .insert(payload)
      .select('id, nome, area, funcao, telefone, email, diaria, comissao_percentual, status, obras(codigo)')
      .single();

    if (error) throw error;
    return { ok: true, row: data };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      return { ok: false, fallback: true, error };
    }
    return { ok: false, fallback: false, error };
  }
}

async function updateEquipeStatusSupabase(memberId, nextStatus) {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const { data, error } = await db
      .from('equipe')
      .update({ status: nextStatus })
      .eq('id', memberId)
      .select('id, nome, area, funcao, telefone, email, diaria, comissao_percentual, status, obras(codigo)')
      .single();

    if (error) throw error;
    return { ok: true, row: data };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      return { ok: false, fallback: true, error };
    }
    return { ok: false, fallback: false, error };
  }
}

function getFilteredEquipes() {
  const filters = window._equipesFilters || { search: '', area: 'todos', role: 'todos', status: 'todos' };
  const search = normalizeEquipeText(filters.search || '');
  const area = normalizeEquipeText(filters.area || 'todos');
  const role = normalizeEquipeText(filters.role || 'todos');
  const status = normalizeEquipeText(filters.status || 'todos');

  return (Array.isArray(equipeData) ? equipeData : []).filter((member) => {
    if (area !== 'todos' && normalizeEquipeText(member.area) !== area) return false;
    if (role !== 'todos' && !normalizeEquipeText(member.role).includes(role)) return false;
    if (status !== 'todos' && normalizeEquipeText(member.status) !== status) return false;

    if (!search) return true;
    const searchable = `${member.name} ${member.role} ${member.area} ${member.obra} ${member.email} ${member.tel}`;
    return normalizeEquipeText(searchable).includes(search);
  });
}

function parseCurrencyValue(value) {
  if (typeof parseCurrencyBRL === 'function') return parseCurrencyBRL(value || 0);
  const raw = String(value || '0').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  return Number(raw) || 0;
}

function isEquipePagamentoQuitado(status) {
  const norm = String(status || '').toLowerCase();
  return norm === 'pago' || norm === 'recebido';
}

function findEquipeById(memberId) {
  const id = String(memberId || '').trim();
  return (Array.isArray(equipeData) ? equipeData : []).find((member) => String(member.id || '') === id) || null;
}

function getEquipeObrasRelacionadas(member) {
  if (!member || !Array.isArray(obras)) return [];
  const memberName = normalizeEquipeText(member.name || '');
  if (!memberName) return [];

  return obras.filter((obra) => {
    const resp = normalizeEquipeText(obra?.resp || '');
    if (!resp || resp === '—') return false;
    return resp.includes(memberName) || memberName.includes(resp);
  });
}

function getEquipePagamentosRelacionados(member) {
  if (!member || !Array.isArray(financPag)) return [];
  const memberName = normalizeEquipeText(member.name || '');
  if (!memberName) return [];

  return financPag.filter((item) => {
    const fornecedor = normalizeEquipeText(item?.forn || item?.fornecedor || '');
    return fornecedor.includes(memberName) || memberName.includes(fornecedor);
  });
}

function renderEquipeObrasList(obrasList) {
  const container = document.getElementById('eq-detail-obras-list');
  if (!container) return;

  if (!Array.isArray(obrasList) || obrasList.length === 0) {
    container.innerHTML = '<div class="muted">Sem obras vinculadas encontradas.</div>';
    return;
  }

  container.innerHTML = obrasList.slice(0, 12).map((obra) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid var(--border);border-radius:8px">
      <div>
        <div style="font-size:12px;font-weight:600">${obra.code || '—'} · ${obra.name || 'Sem nome'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${obra.client || '—'} · ${obra.prazo || '—'}</div>
      </div>
      <div>${statusBadge(obra.status || 'andamento')}</div>
    </div>
  `).join('');
}

function renderEquipePagamentosList(payments) {
  const container = document.getElementById('eq-detail-pagamentos-list');
  if (!container) return;

  if (!Array.isArray(payments) || payments.length === 0) {
    container.innerHTML = '<div class="muted">Sem pagamentos vinculados ao colaborador.</div>';
    return;
  }

  container.innerHTML = payments.slice(0, 12).map((item) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid var(--border);border-radius:8px">
      <div>
        <div style="font-size:12px;font-weight:600">${item.ref || '—'} · ${item.forn || item.fornecedor || '—'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${item.cat || '—'} · ${item.venc || '—'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;font-weight:700;color:var(--red)">${item.valor || 'R$ 0'}</div>
        <div>${statusBadge(item.status || 'pendente')}</div>
      </div>
    </div>
  `).join('');
}

function openEquipeDetail(memberId) {
  const member = findEquipeById(memberId);
  if (!member) {
    showToast('Colaborador não encontrado.', 'warning');
    return;
  }

  const relatedObras = getEquipeObrasRelacionadas(member);
  const relatedPayments = getEquipePagamentosRelacionados(member);

  const totalObras = relatedObras.length;
  const finalizadas = relatedObras.filter((obra) => String(obra.status || '') === 'concluida').length;
  const andamento = relatedObras.filter((obra) => String(obra.status || '') === 'andamento').length;
  const atrasadas = relatedObras.filter((obra) => String(obra.status || '') === 'atrasada').length;

  const totalPago = relatedPayments
    .filter((item) => isEquipePagamentoQuitado(item.status))
    .reduce((sum, item) => sum + parseCurrencyValue(item.valor), 0);

  const totalPendente = relatedPayments
    .filter((item) => !isEquipePagamentoQuitado(item.status))
    .reduce((sum, item) => sum + parseCurrencyValue(item.valor), 0);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('eq-detail-nome', member.name || '—');
  setText('eq-detail-area-funcao', `${getEquipeAreaLabel(member.area)} · ${member.role || '—'}`);
  const statusEl = document.getElementById('eq-detail-status');
  if (statusEl) statusEl.innerHTML = statusBadge(member.status || 'disponivel');
  setText('eq-detail-telefone', member.tel || '—');
  setText('eq-detail-email', member.email || '—');
  setText('eq-detail-obra-atual', member.obra || '—');

  setText('eq-kpi-total-obras', String(totalObras));
  setText('eq-kpi-finalizadas', String(finalizadas));
  setText('eq-kpi-andamento', String(andamento));
  setText('eq-kpi-atrasadas', String(atrasadas));
  setText('eq-kpi-pago', formatCurrencyValue(totalPago));
  setText('eq-kpi-pendente', formatCurrencyValue(totalPendente));
  setText('eq-kpi-diaria', member.diaria || 'R$ 0');

  renderEquipeObrasList(relatedObras);
  renderEquipePagamentosList(relatedPayments);

  const editBtn = document.getElementById('eq-detail-edit-btn');
  if (editBtn) {
    editBtn.setAttribute('onclick', `closeModal('modal-equipe-detalhe');openEditarMembroEquipe('${String(member.id || '').replace(/'/g, "\\'")}')`);
  }

  openModal('modal-equipe-detalhe');
}

const equipeData = [];

const estoqueData = [];

const fornecedoresData = [];
let equipesLastSyncSource = 'local';
let estoqueLastSyncSource = 'local';
let fornecedoresLastSyncSource = 'local';

function getSyncStatusSuffix(source) {
  return source === 'supabase' ? '' : ' · sincronizacao pendente';
}

const FORNECEDOR_CATEGORY_LABELS = {
  eletrica: 'Elétrica',
  hidraulica: 'Hidráulica',
  civil: 'Civil',
  ferramentas: 'Ferramentas',
  epi: 'EPI',
  geral: 'Geral'
};

function normalizeFornecedorText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getFornecedorCategoryLabel(category) {
  const key = normalizeFornecedorText(category);
  const configured = typeof getConfiguredSupplierCategoryOptions === 'function' ? getConfiguredSupplierCategoryOptions() : [];
  const match = configured.find((item) => slugifyCategoryLabel(item.label) === key || String(item.value || '') === key);
  return match?.label || FORNECEDOR_CATEGORY_LABELS[key] || 'Geral';
}

function getFornecedorCategoryKeyFromStockCategory(category) {
  const key = normalizeFornecedorText(category);
  const configured = typeof getConfiguredSupplierCategoryOptions === 'function' ? getConfiguredSupplierCategoryOptions() : [];
  const match = configured.find((item) => slugifyCategoryLabel(item.label) === key || String(item.label || '').toLowerCase() === key);
  return match?.value || (key.startsWith('eletrica') ? 'eletrica' : key.startsWith('hidraulica') ? 'hidraulica' : key.startsWith('civil') ? 'civil' : key.startsWith('ferrament') ? 'ferramentas' : key === 'epi' ? 'epi' : 'geral');
}

function formatFornecedorTelefone(value) {
  if (typeof formatarTelefoneBr === 'function') return formatarTelefoneBr(value || '');
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatFornecedorCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function onFornecedorTelefoneInput(input) {
  if (!input) return;
  input.value = formatFornecedorTelefone(input.value);
}

function onFornecedorCnpjInput(input) {
  if (!input) return;
  input.value = formatFornecedorCnpj(input.value);
}

function normalizeFornecedor(item, index = 0) {
  const categoryKey = normalizeFornecedorText(item?.categoria || item?.category || 'geral') || 'geral';
  const configured = typeof getConfiguredSupplierCategoryOptions === 'function' ? getConfiguredSupplierCategoryOptions() : [];
  const hasConfiguredMatch = configured.some((entry) => slugifyCategoryLabel(entry.label) === categoryKey || String(entry.value || '') === categoryKey);
  return {
    id: String(item?.id || `forn-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`),
    nome: String(item?.nome || item?.name || '').trim() || 'Fornecedor sem nome',
    categoria: hasConfiguredMatch ? categoryKey : 'geral',
    vendedor: String(item?.vendedor || item?.contato || '').trim(),
    telefone: formatFornecedorTelefone(item?.telefone || ''),
    email: String(item?.email || '').trim(),
    cnpj: formatFornecedorCnpj(item?.cnpj || ''),
    status: normalizeFornecedorText(item?.status || 'ativo') === 'inativo' ? 'inativo' : 'ativo'
  };
}

function mapFornecedorRowToUi(row, index = 0) {
  return normalizeFornecedor({
    id: row?.id,
    nome: row?.nome,
    categoria: row?.categoria,
    vendedor: row?.vendedor,
    telefone: row?.telefone,
    email: row?.email,
    cnpj: row?.cnpj,
    status: row?.status
  }, index);
}

function toFornecedorDbPayload(item) {
  return {
    nome: String(item?.nome || '').trim(),
    categoria: String(item?.categoria || 'geral').trim().toLowerCase() || 'geral',
    vendedor: String(item?.vendedor || '').trim() || null,
    telefone: String(item?.telefone || '').trim() || null,
    email: String(item?.email || '').trim() || null,
    cnpj: String(item?.cnpj || '').trim() || null,
    status: normalizeFornecedorText(item?.status || 'ativo') === 'inativo' ? 'inativo' : 'ativo'
  };
}

function isFornecedorSupabaseFallbackError(error) {
  if (!error) return false;
  const code = String(error.code || '').toLowerCase();
  const status = Number(error.status || 0);
  const msg = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return code === '42501'
    || status === 401
    || status === 403
    || msg.includes('row-level security')
    || msg.includes('permission denied')
    || msg.includes('not authenticated')
    || msg.includes('jwt')
    || msg.includes('failed to fetch')
    || msg.includes('network');
}

async function hasSupabaseSession() {
  if (!window.db?.auth?.getSession) return false;

  try {
    const { data, error } = await db.auth.getSession();
    if (error) return false;
    return Boolean(data?.session);
  } catch {
    return false;
  }
}

function replaceFornecedoresData(items) {
  fornecedoresData.length = 0;
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    fornecedoresData.push(normalizeFornecedor(item, index));
  });
}

function saveFornecedoresToStorage() {
  try {
    localStorage.setItem(FORNECEDORES_DATA_STORAGE_KEY, JSON.stringify(fornecedoresData || []));
  } catch {
    // Falha silenciosa para manter modulo funcional em memoria.
  }
}

function seedFornecedoresFromEstoque() {
  const existingNames = new Set((Array.isArray(fornecedoresData) ? fornecedoresData : []).map((item) => normalizeFornecedorText(item.nome)));
  (Array.isArray(estoqueData) ? estoqueData : []).forEach((item) => {
    const nome = String(item?.forn || '').trim();
    if (!nome || nome === '—') return;
    const key = normalizeFornecedorText(nome);
    if (!key || existingNames.has(key)) return;

    fornecedoresData.push(normalizeFornecedor({
      nome,
      categoria: getFornecedorCategoryKeyFromStockCategory(item?.cat),
      status: 'ativo'
    }, fornecedoresData.length));
    existingNames.add(key);
  });
}

function loadFornecedoresFromStorageLegacy() {
  try {
    const raw = localStorage.getItem(FORNECEDORES_DATA_STORAGE_KEY);
    if (!raw) {
      fornecedoresData.length = 0;
      seedFornecedoresFromEstoque();
      fornecedoresLastSyncSource = 'local';
      saveFornecedoresToStorage();
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      fornecedoresData.length = 0;
      seedFornecedoresFromEstoque();
      fornecedoresLastSyncSource = 'local';
      saveFornecedoresToStorage();
      return;
    }

    replaceFornecedoresData(parsed);
    seedFornecedoresFromEstoque();
    fornecedoresLastSyncSource = 'local';
    saveFornecedoresToStorage();
  } catch {
    fornecedoresData.length = 0;
    seedFornecedoresFromEstoque();
    fornecedoresLastSyncSource = 'local';
    saveFornecedoresToStorage();
  }
}

async function syncFornecedoresFromSupabase(options = {}) {
  const { silent = true } = options;
  if (!window.db?.from) return false;

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return false;

  try {
    const { data, error } = await db
      .from('fornecedores')
      .select('id, nome, categoria, vendedor, telefone, email, cnpj, status')
      .order('nome', { ascending: true });

    if (error) throw error;

    replaceFornecedoresData((data || []).map((row, index) => mapFornecedorRowToUi(row, index)));
    fornecedoresLastSyncSource = 'supabase';
    saveFornecedoresToStorage();
    return true;
  } catch (error) {
    fornecedoresLastSyncSource = 'local';
    if (!silent) {
      const msg = isFornecedorSupabaseFallbackError(error)
        ? 'Sem sessão ativa no banco. Mantendo fornecedores locais.'
        : `Falha ao carregar fornecedores no banco: ${error?.message || 'erro desconhecido'}`;
      showToast(msg, isFornecedorSupabaseFallbackError(error) ? 'warning' : 'error');
    }
    return false;
  }
}

async function loadFornecedoresFromStorage(options = {}) {
  const { preferSupabase = true, silent = true } = options;

  if (!preferSupabase) {
    loadFornecedoresFromStorageLegacy();
    populateFornecedorDatalist();
    updateFornecedoresSummary();
    populateFornecedores();
    return;
  }

  const hasSession = await hasSupabaseSession();
  if (hasSession) {
    const synced = await syncFornecedoresFromSupabase({ silent });
    if (synced) {
      populateFornecedorDatalist();
      updateFornecedoresSummary();
      populateFornecedores();
      return;
    }
  }

  loadFornecedoresFromStorageLegacy();
  populateFornecedorDatalist();
  updateFornecedoresSummary();
  populateFornecedores();
}

async function upsertFornecedorSupabase(item, editId = '') {
  const payload = toFornecedorDbPayload(item);

  if (!window.db?.from) return { ok: false, fallback: true, error: null };
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    if (editId) {
      const { data, error } = await db
        .from('fornecedores')
        .update(payload)
        .eq('id', editId)
        .select('id, nome, categoria, vendedor, telefone, email, cnpj, status')
        .single();

      if (error) throw error;
      return { ok: true, row: data };
    }

    const { data, error } = await db
      .from('fornecedores')
      .insert(payload)
      .select('id, nome, categoria, vendedor, telefone, email, cnpj, status')
      .single();

    if (error) throw error;
    return { ok: true, row: data };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      return { ok: false, fallback: true, error };
    }
    return { ok: false, fallback: false, error };
  }
}

async function updateFornecedorStatusSupabase(id, nextStatus) {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const { data, error } = await db
      .from('fornecedores')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('id, nome, categoria, vendedor, telefone, email, cnpj, status')
      .single();

    if (error) throw error;
    return { ok: true, row: data };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      return { ok: false, fallback: true, error };
    }
    return { ok: false, fallback: false, error };
  }
}

async function ensureFornecedorSupabase(item) {
  if (!window.db?.from) return false;
  const hasSession = await hasSupabaseSession();
  if (!hasSession) return false;

  try {
    const payload = toFornecedorDbPayload(item);
    const { data: existing, error: existingError } = await db
      .from('fornecedores')
      .select('id')
      .ilike('nome', payload.nome)
      .limit(1)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing?.id) return true;

    const { error } = await db.from('fornecedores').insert(payload);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

function saveFornecedoresFiltersToSession() {
  try {
    sessionStorage.setItem(FORNECEDORES_FILTERS_SESSION_KEY, JSON.stringify(window._fornecedoresFilters || {}));
  } catch {
    // Falha silenciosa.
  }
}

function loadFornecedoresFiltersFromSession() {
  try {
    const raw = sessionStorage.getItem(FORNECEDORES_FILTERS_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    window._fornecedoresFilters = {
      search: String(parsed.search || ''),
      categoria: String(parsed.categoria || 'todos'),
      status: String(parsed.status || 'todos')
    };
  } catch {
    window._fornecedoresFilters = window._fornecedoresFilters || { search: '', categoria: 'todos', status: 'todos' };
  }
}

function syncFornecedoresFiltersUI() {
  const filters = window._fornecedoresFilters || { search: '', categoria: 'todos', status: 'todos' };
  const searchEl = document.getElementById('forn-filter-search');
  const categoryEl = document.getElementById('forn-filter-categoria');
  const statusEl = document.getElementById('forn-filter-status');
  if (searchEl) searchEl.value = filters.search || '';
  if (categoryEl) categoryEl.value = filters.categoria || 'todos';
  if (statusEl) statusEl.value = filters.status || 'todos';
}

function onFornecedoresFiltersChange() {
  window._fornecedoresFilters = {
    search: document.getElementById('forn-filter-search')?.value || '',
    categoria: document.getElementById('forn-filter-categoria')?.value || 'todos',
    status: document.getElementById('forn-filter-status')?.value || 'todos'
  };
  saveFornecedoresFiltersToSession();
  populateFornecedores();
}

function clearFornecedoresFilters() {
  window._fornecedoresFilters = { search: '', categoria: 'todos', status: 'todos' };
  saveFornecedoresFiltersToSession();
  syncFornecedoresFiltersUI();
  populateFornecedores();
}

function getFilteredFornecedores() {
  const filters = window._fornecedoresFilters || { search: '', categoria: 'todos', status: 'todos' };
  const search = normalizeFornecedorText(filters.search || '');
  const category = normalizeFornecedorText(filters.categoria || 'todos');
  const status = normalizeFornecedorText(filters.status || 'todos');

  return (Array.isArray(fornecedoresData) ? fornecedoresData : []).filter((item) => {
    if (category !== 'todos' && normalizeFornecedorText(item.categoria) !== category) return false;
    if (status !== 'todos' && normalizeFornecedorText(item.status) !== status) return false;
    if (!search) return true;
    const searchable = `${item.nome} ${item.vendedor} ${item.telefone} ${item.email} ${item.cnpj} ${getFornecedorCategoryLabel(item.categoria)}`;
    return normalizeFornecedorText(searchable).includes(search);
  });
}

function updateFornecedoresSummary() {
  const summary = document.getElementById('fornecedores-summary');
  if (!summary) return;
  const total = (Array.isArray(fornecedoresData) ? fornecedoresData : []).length;
  const ativos = (Array.isArray(fornecedoresData) ? fornecedoresData : []).filter((item) => item.status === 'ativo').length;
  summary.textContent = `${total} fornecedores cadastrados · ${ativos} ativos${getSyncStatusSuffix(fornecedoresLastSyncSource)}`;
}

function populateFornecedorDatalist() {
  const datalist = document.getElementById('fornecedores-sugestoes');
  if (!datalist) return;
  const ativos = (Array.isArray(fornecedoresData) ? fornecedoresData : [])
    .filter((item) => item.status === 'ativo')
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
  datalist.innerHTML = ativos.map((item) => `<option value="${String(item.nome || '').replace(/"/g, '&quot;')}"></option>`).join('');
}

function resetNovoFornecedorModal() {
  const modalTitle = document.getElementById('forn-modal-title');
  const editId = document.getElementById('forn-edit-id');
  const saveBtn = document.getElementById('forn-save-btn');
  const nome = document.getElementById('forn-nome');
  const categoria = document.getElementById('forn-categoria');
  const vendedor = document.getElementById('forn-vendedor');
  const telefone = document.getElementById('forn-telefone');
  const email = document.getElementById('forn-email');
  const cnpj = document.getElementById('forn-cnpj');
  const status = document.getElementById('forn-status');

  if (modalTitle) modalTitle.innerHTML = '<i class="ti ti-truck-delivery" style="margin-right:8px;color:var(--petrol-light)"></i>Novo Fornecedor';
  if (editId) editId.value = '';
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-check"></i>Cadastrar';
  if (nome) nome.value = '';
  if (categoria) categoria.value = '';
  if (vendedor) vendedor.value = '';
  if (telefone) telefone.value = '';
  if (email) email.value = '';
  if (cnpj) cnpj.value = '';
  if (status) status.value = 'ativo';
}

function openEditarFornecedor(id) {
  const fornId = String(id || '').trim();
  if (!fornId) return;
  const fornecedor = (Array.isArray(fornecedoresData) ? fornecedoresData : []).find((item) => String(item.id || '') === fornId);
  if (!fornecedor) {
    showToast('Fornecedor não encontrado para edição.', 'warning');
    return;
  }

  openModal('modal-novo-fornecedor');
  const modalTitle = document.getElementById('forn-modal-title');
  const saveBtn = document.getElementById('forn-save-btn');

  document.getElementById('forn-edit-id').value = fornecedor.id || '';
  document.getElementById('forn-nome').value = fornecedor.nome || '';
  document.getElementById('forn-categoria').value = fornecedor.categoria || 'geral';
  document.getElementById('forn-vendedor').value = fornecedor.vendedor || '';
  document.getElementById('forn-telefone').value = fornecedor.telefone || '';
  document.getElementById('forn-email').value = fornecedor.email || '';
  document.getElementById('forn-cnpj').value = fornecedor.cnpj || '';
  document.getElementById('forn-status').value = fornecedor.status || 'ativo';

  if (modalTitle) modalTitle.innerHTML = '<i class="ti ti-edit" style="margin-right:8px;color:var(--petrol-light)"></i>Editar Fornecedor';
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i>Salvar alterações';
}

async function toggleFornecedorStatus(id) {
  const fornId = String(id || '').trim();
  if (!fornId) return;
  const idx = (Array.isArray(fornecedoresData) ? fornecedoresData : []).findIndex((item) => String(item.id || '') === fornId);
  if (idx < 0) return;

  const nextStatus = fornecedoresData[idx].status === 'ativo' ? 'inativo' : 'ativo';
  const result = await updateFornecedorStatusSupabase(fornId, nextStatus);

  if (result.ok && result.row) {
    fornecedoresData[idx] = mapFornecedorRowToUi(result.row, idx);
    fornecedoresLastSyncSource = 'supabase';
  } else if (result.fallback) {
    fornecedoresData[idx].status = nextStatus;
    fornecedoresLastSyncSource = 'local';
  } else {
    showToast(`Erro ao alterar status do fornecedor: ${result?.error?.message || 'falha desconhecida'}`, 'error');
    return;
  }

  saveFornecedoresToStorage();
  populateFornecedorDatalist();
  populateFornecedores();
  if (result.fallback) {
    showToast('Fornecedor atualizado localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast(fornecedoresData[idx].status === 'ativo' ? 'Fornecedor ativado.' : 'Fornecedor inativado.', 'success');
}

async function salvarFornecedor() {
  const editId = String(document.getElementById('forn-edit-id')?.value || '').trim();
  const nome = String(document.getElementById('forn-nome')?.value || '').trim();
  const categoria = String(document.getElementById('forn-categoria')?.value || '').trim().toLowerCase();
  const vendedor = String(document.getElementById('forn-vendedor')?.value || '').trim();
  const telefone = formatFornecedorTelefone(document.getElementById('forn-telefone')?.value || '');
  const email = String(document.getElementById('forn-email')?.value || '').trim();
  const cnpj = formatFornecedorCnpj(document.getElementById('forn-cnpj')?.value || '');
  const status = String(document.getElementById('forn-status')?.value || 'ativo').trim().toLowerCase();

  if (!nome) {
    showToast('Informe o nome do fornecedor.', 'warning');
    return;
  }
  if (!categoria) {
    showToast('Selecione a categoria do fornecedor.', 'warning');
    return;
  }
  if (!vendedor) {
    showToast('Informe o vendedor do fornecedor.', 'warning');
    return;
  }
  if (String(telefone).replace(/\D/g, '').length < 10) {
    showToast('Informe um telefone válido do fornecedor.', 'warning');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Informe um e-mail válido do fornecedor.', 'warning');
    return;
  }
  if (String(cnpj).replace(/\D/g, '').length !== 14) {
    showToast('Informe um CNPJ válido do fornecedor.', 'warning');
    return;
  }
  if (!status) {
    showToast('Selecione o status do fornecedor.', 'warning');
    return;
  }

  const nomeNorm = normalizeFornecedorText(nome);
  const duplicated = (Array.isArray(fornecedoresData) ? fornecedoresData : []).some((item) => {
    if (String(item.id || '') === editId) return false;
    return normalizeFornecedorText(item.nome || '') === nomeNorm;
  });
  if (duplicated) {
    showToast('Já existe um fornecedor com este nome.', 'warning');
    return;
  }

  const normalized = normalizeFornecedor({
    id: editId || undefined,
    nome,
    categoria,
    vendedor,
    telefone,
    email,
    cnpj,
    status
  }, fornecedoresData.length);

  const dbResult = await upsertFornecedorSupabase(normalized, editId);
  if (!dbResult.ok && !dbResult.fallback) {
    showToast(`Erro ao salvar fornecedor no banco: ${dbResult?.error?.message || 'falha desconhecida'}`, 'error');
    return;
  }

  const sourceItem = dbResult.ok && dbResult.row
    ? mapFornecedorRowToUi(dbResult.row, fornecedoresData.length)
    : normalized;

  if (editId) {
    const idx = fornecedoresData.findIndex((item) => String(item.id || '') === editId);
    if (idx >= 0) fornecedoresData[idx] = { ...fornecedoresData[idx], ...sourceItem, id: sourceItem.id || editId };
    else fornecedoresData.unshift(sourceItem);
  } else {
    fornecedoresData.unshift(sourceItem);
  }

  fornecedoresLastSyncSource = dbResult.ok ? 'supabase' : 'local';

  saveFornecedoresToStorage();
  populateFornecedorDatalist();
  populateFornecedores();
  closeModal('modal-novo-fornecedor');
  resetNovoFornecedorModal();

  if (dbResult.fallback) {
    showToast('Fornecedor salvo localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast(editId ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!', 'success');
}

async function ensureFornecedorFromEstoqueInput(nomeFornecedor, categoriaSugestao = 'geral') {
  const nome = String(nomeFornecedor || '').trim();
  if (!nome || nome === '—') return;

  const nomeNorm = normalizeFornecedorText(nome);
  const exists = (Array.isArray(fornecedoresData) ? fornecedoresData : []).some((item) => normalizeFornecedorText(item.nome || '') === nomeNorm);
  if (exists) return;

  const newFornecedor = normalizeFornecedor({
    nome,
    categoria: categoriaSugestao,
    status: 'ativo'
  }, fornecedoresData.length);

  fornecedoresData.unshift(newFornecedor);

  const synced = await ensureFornecedorSupabase(newFornecedor);
  if (synced) fornecedoresLastSyncSource = 'supabase';
  else fornecedoresLastSyncSource = 'local';

  saveFornecedoresToStorage();
  populateFornecedorDatalist();
  updateFornecedoresSummary();
}

function populateFornecedores() {
  const tbody = document.getElementById('fornecedores-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const list = getFilteredFornecedores();
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center">Nenhum fornecedor encontrado com os filtros atuais.</td></tr>';
    updateFornecedoresSummary();
    return;
  }

  list.forEach((item) => {
    const idSafe = String(item.id || '').replace(/'/g, '&#39;');
    const categoryLabel = getFornecedorCategoryLabel(item.categoria);
    tbody.innerHTML += `<tr>
      <td><div class="bold">${item.nome}</div>${item.cnpj ? `<div style="font-size:11px;color:var(--text-muted)">${item.cnpj}</div>` : ''}</td>
      <td><span class="badge badge-neutral">${categoryLabel}</span></td>
      <td class="muted">${item.vendedor || '—'}</td>
      <td class="muted">${item.telefone || '—'}</td>
      <td class="muted">${item.email || '—'}</td>
      <td>${statusBadge(item.status || 'ativo')}</td>
      <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="openEditarFornecedor('${idSafe}')"><i class="ti ti-edit"></i></button><button class="btn btn-ghost btn-xs" onclick="toggleFornecedorStatus('${idSafe}')"><i class="ti ${item.status === 'ativo' ? 'ti-user-x' : 'ti-user-check'}"></i></button></div></td>
    </tr>`;
  });

  updateFornecedoresSummary();
}

const estoqueDraftItems = [];
let estoqueDraftEditId = null;
let estoqueDraftExpanded = false;

function populateFin() {
  const filtros = window._finFilters || { search: '', status: 'todos', period: 'todos' };
  const receiveTable = document.getElementById('fin-rec-tbody');
  if (receiveTable) {
    receiveTable.innerHTML = '';
    const filteredRec = financRec.filter((item) => matchesFinFilters(item, 'receber', filtros));
    if (filteredRec.length === 0) {
      receiveTable.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center">Nenhum lançamento encontrado com os filtros atuais.</td></tr>';
    }
    filteredRec.forEach((item) => {
      const refSafe = String(item.ref || '').replace(/'/g, '&#39;');
      const isQuitado = ['recebido', 'pago'].includes(String(item.status || '').toLowerCase());
      receiveTable.innerHTML += `<tr>
        <td class="mono">${item.ref}</td>
        <td><div class="bold">${item.client}</div><div style="font-size:11px;color:var(--text-muted)">${item.obra}</div></td>
        <td class="muted">${item.desc}</td>
        <td><span style="font-weight:700;color:var(--green)">${item.valor}</span></td>
        <td class="muted">${item.venc}</td>
        <td>${statusBadge(item.status)}</td>
        <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="openLancamentoFinanceiro('receber','${refSafe}')"><i class="ti ti-edit"></i></button><button class="btn btn-ghost btn-xs" onclick="baixarLancamentoFinanceiro('receber','${refSafe}')" ${isQuitado ? 'disabled title="Já recebido"' : ''}><i class="ti ti-check"></i></button></div></td>
      </tr>`;
    });
  }

  const payTable = document.getElementById('fin-pag-tbody');
  if (payTable) {
    payTable.innerHTML = '';
    const filteredPag = financPag.filter((item) => matchesFinFilters(item, 'pagar', filtros));
    if (filteredPag.length === 0) {
      payTable.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center">Nenhum lançamento encontrado com os filtros atuais.</td></tr>';
    }
    filteredPag.forEach((item) => {
      const refSafe = String(item.ref || '').replace(/'/g, '&#39;');
      const isQuitado = ['pago', 'recebido'].includes(String(item.status || '').toLowerCase());
      payTable.innerHTML += `<tr>
        <td class="mono">${item.ref}</td>
        <td class="bold">${item.forn}</td>
        <td><span class="badge badge-neutral">${item.cat}</span></td>
        <td><span style="font-weight:700;color:var(--red)">${item.valor}</span></td>
        <td class="muted">${item.venc}</td>
        <td>${statusBadge(item.status)}</td>
        <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="openLancamentoFinanceiro('pagar','${refSafe}')"><i class="ti ti-edit"></i></button><button class="btn btn-ghost btn-xs" onclick="baixarLancamentoFinanceiro('pagar','${refSafe}')" ${isQuitado ? 'disabled title="Já pago"' : ''}><i class="ti ti-check"></i></button></div></td>
      </tr>`;
    });
  }

  updateFinanceiroSummary();
}

function normalizeFinText(value) {
  if (typeof normalizeFilterValue === 'function') return normalizeFilterValue(value);
  return String(value || '').toLowerCase().trim();
}

function isFinQuitado(status) {
  const s = String(status || '').toLowerCase();
  return s === 'recebido' || s === 'pago';
}

function matchesFinFilters(item, tipo, filtros) {
  const search = normalizeFinText(filtros?.search || '');
  const status = String(filtros?.status || 'todos').toLowerCase();
  const period = String(filtros?.period || 'todos').toLowerCase();
  const itemStatus = String(item?.status || '').toLowerCase();

  if (status !== 'todos') {
    if (status === 'quitado') {
      if (!isFinQuitado(itemStatus)) return false;
    } else if (itemStatus !== status) {
      return false;
    }
  }

  const vencDate = parseFinanceDate(item?.venc || item?.vencimento || '');
  if (period !== 'todos') {
    if (!vencDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((vencDate.getTime() - today.getTime()) / 86400000);

    if (period === 'hoje' && diffDays !== 0) return false;
    if (period === '7d' && (diffDays < 0 || diffDays > 7)) return false;
    if (period === '30d' && (diffDays < 0 || diffDays > 30)) return false;
    if (period === 'atrasado' && diffDays >= 0) return false;
  }

  if (!search) return true;

  const searchable = tipo === 'receber'
    ? `${item.ref || ''} ${item.client || ''} ${item.obra || ''} ${item.desc || ''} ${item.valor || ''}`
    : `${item.ref || ''} ${item.forn || ''} ${item.cat || ''} ${item.valor || ''} ${item.venc || ''}`;

  return normalizeFinText(searchable).includes(search);
}

function onFinFiltersChange() {
  window._finFilters = {
    search: document.getElementById('fin-filter-search')?.value || '',
    status: document.getElementById('fin-filter-status')?.value || 'todos',
    period: document.getElementById('fin-filter-period')?.value || 'todos'
  };

  saveFinFiltersToSession();

  populateFin();
}

function getFinanceEventDate(item) {
  return parseFinanceDate(item?.updatedAt || item?.venc || item?.vencimento || '');
}

function isSameMonthYear(date, refDate) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  if (!(refDate instanceof Date) || Number.isNaN(refDate.getTime())) return false;
  return date.getMonth() === refDate.getMonth() && date.getFullYear() === refDate.getFullYear();
}

function updateFinanceiroSummary() {
  const metrics = getFinanceMetrics(financRec, financPag);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('fin-stat-receber', formatCurrencyValue(metrics.totalReceber));
  setText('fin-stat-receber-sub', `${metrics.aReceberCount} parcela(s) em aberto`);
  setText('fin-stat-pagar', formatCurrencyValue(metrics.totalPagar));
  setText('fin-stat-saldo', formatCurrencyValue(metrics.saldo));
  setText('fin-stat-faturado', formatCurrencyValue(metrics.faturadoMes));

  const saldoSub = document.getElementById('fin-stat-saldo-sub');
  if (saldoSub) {
    saldoSub.textContent = 'A receber - compromissos - pagos no mês';
  }

  const pagarSub = document.getElementById('fin-stat-pagar-sub');
  if (pagarSub) {
    pagarSub.innerHTML = `<span class="down">${formatCurrencyValue(metrics.pagar7dias)}</span> vence em 7 dias`;
  }
}

async function baixarLancamentoFinanceiro(tipo, referencia) {
  const kind = String(tipo || '').toLowerCase();
  const ref = String(referencia || '').trim();
  if (!ref) return;

  const isReceber = kind === 'receber';
  const table = isReceber ? 'financeiro_receber' : 'financeiro_pagar';
  const newStatus = isReceber ? 'recebido' : 'pago';

  try {
    const { error } = await db.from(table).update({ status: newStatus }).eq('referencia', ref);
    if (error) throw error;

    const targetList = isReceber ? financRec : financPag;
    const idx = targetList.findIndex((item) => String(item.ref || '') === ref);
    if (idx >= 0) targetList[idx] = { ...targetList[idx], status: newStatus, updatedAt: new Date().toISOString() };

    populateFin();
    if (typeof drawFluxo === 'function') drawFluxo();
    if (typeof refreshNotificationBadge === 'function') refreshNotificationBadge();
    showToast(isReceber ? 'Recebimento baixado com sucesso.' : 'Pagamento baixado com sucesso.', 'success');
  } catch (error) {
    console.error(error);
    showToast('Não foi possível baixar o lançamento.', 'error');
  }
}

function populateEquipes() {
  const grid = document.getElementById('equipes-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const members = getFilteredEquipes();
  if (members.length === 0) {
    grid.innerHTML = '<div class="card" style="grid-column:1 / -1;text-align:center;color:var(--text-muted)">Nenhum membro encontrado com os filtros atuais.</div>';
    updateEquipesSummary();
    updateDashboardOperationalStats();
    return;
  }

  members.forEach((member) => {
    const idSafe = String(member.id || '').replace(/'/g, '&#39;');
    const isInactive = String(member.status || '').toLowerCase() === 'inativo';
    grid.innerHTML += `<div class="team-card" onclick="openEquipeDetail('${idSafe}')">
      <div class="team-card-header">
        <div class="avatar" style="background:${member.bg};width:44px;height:44px;font-size:14px">${member.initials}</div>
        <div class="team-card-info">
          <div class="team-card-name">${member.name}</div>
          <div class="team-card-role">${member.role} · ${getEquipeAreaLabel(member.area)}</div>
        </div>
        ${statusBadge(member.status)}
      </div>
      <div class="team-card-body">
        <div class="team-meta-row"><span>Diária</span><span>${member.diaria}</span></div>
        <div class="team-meta-row"><span>Acesso</span><span>${getPermissaoPerfilByEquipeId(member.id)}</span></div>
        <div class="team-meta-row"><span>Obra atual</span><span style="color:var(--petrol-light)">${member.obra}</span></div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-xs" style="flex:1" onclick="event.stopPropagation();openEditarMembroEquipe('${idSafe}')"><i class="ti ti-edit"></i>Editar</button>
        <button class="btn btn-ghost btn-xs" style="flex:1" onclick="event.stopPropagation();toggleMembroEquipeStatus('${idSafe}')"><i class="ti ${isInactive ? 'ti-user-check' : 'ti-user-x'}"></i>${isInactive ? 'Ativar' : 'Inativar'}</button>
      </div>
    </div>`;
  });

  updateEquipesSummary();
  updateDashboardOperationalStats();
}

function resetNovoMembroModal() {
  const modalTitle = document.getElementById('eq-modal-title');
  const editId = document.getElementById('eq-edit-id');
  const saveBtn = document.getElementById('eq-save-btn');
  const nome = document.getElementById('eq-nome');
  const area = document.getElementById('eq-area');
  const role = document.getElementById('eq-funcao');
  const status = document.getElementById('eq-status');
  const telefone = document.getElementById('eq-telefone');
  const email = document.getElementById('eq-email');
  const diaria = document.getElementById('eq-diaria');
  const acesso = document.getElementById('eq-acesso');
  const perfilAcesso = document.getElementById('eq-perfil-acesso');
  const obra = document.getElementById('eq-obra');

  if (modalTitle) modalTitle.innerHTML = '<i class="ti ti-user-plus" style="margin-right:8px;color:var(--petrol-light)"></i>Novo Membro da Equipe';
  if (editId) editId.value = '';
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-check"></i>Adicionar';
  if (nome) nome.value = '';
  if (area) area.value = 'obras';
  if (status) status.value = 'disponivel';
  if (telefone) telefone.value = '';
  if (email) email.value = '';
  if (diaria) diaria.value = '';
  if (acesso) acesso.value = 'nao';
  if (perfilAcesso) {
    perfilAcesso.value = 'Visualizador';
    perfilAcesso.disabled = true;
  }
  if (obra) obra.value = '';
  if (role) setEquipeRoleOptions(area?.value || 'obras');
}

function openEditarMembroEquipe(memberId) {
  const id = String(memberId || '').trim();
  if (!id) return;

  const member = (Array.isArray(equipeData) ? equipeData : []).find((item) => String(item.id || '') === id);
  if (!member) {
    showToast('Membro não encontrado para edição.', 'warning');
    return;
  }

  openModal('modal-novo-membro');

  const modalTitle = document.getElementById('eq-modal-title');
  const editId = document.getElementById('eq-edit-id');
  const saveBtn = document.getElementById('eq-save-btn');
  const nome = document.getElementById('eq-nome');
  const area = document.getElementById('eq-area');
  const status = document.getElementById('eq-status');
  const telefone = document.getElementById('eq-telefone');
  const email = document.getElementById('eq-email');
  const diaria = document.getElementById('eq-diaria');
  const acesso = document.getElementById('eq-acesso');
  const perfilAcesso = document.getElementById('eq-perfil-acesso');
  const obra = document.getElementById('eq-obra');
  const permissao = getPermissaoAcessoByEquipeId(id);

  if (modalTitle) modalTitle.innerHTML = '<i class="ti ti-user-edit" style="margin-right:8px;color:var(--petrol-light)"></i>Editar Membro da Equipe';
  if (editId) editId.value = id;
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i>Salvar alterações';

  if (nome) nome.value = member.name || '';
  if (area) area.value = member.area || 'obras';
  setEquipeRoleOptions(member.area || 'obras', member.role || '');
  if (status) status.value = member.status || 'disponivel';
  if (telefone) telefone.value = _equipePhoneFormatter(member.tel || '');
  if (email) email.value = member.email || '';
  if (diaria) diaria.value = member.diaria || '';
  if (acesso) acesso.value = permissao ? 'sim' : 'nao';
  if (perfilAcesso) {
    perfilAcesso.value = permissao?.perfil || 'Visualizador';
    perfilAcesso.disabled = !permissao;
  }
  if (obra) obra.value = member.obra && member.obra !== '—' ? member.obra : '';
}

async function toggleMembroEquipeStatus(memberId) {
  const id = String(memberId || '').trim();
  if (!id) return;

  const idx = (Array.isArray(equipeData) ? equipeData : []).findIndex((item) => String(item.id || '') === id);
  if (idx < 0) {
    showToast('Membro não encontrado para alterar status.', 'warning');
    return;
  }

  const current = String(equipeData[idx].status || '').toLowerCase();
  const nextStatus = current === 'inativo' ? 'disponivel' : 'inativo';

  const result = await updateEquipeStatusSupabase(id, nextStatus);
  if (result.ok && result.row) {
    equipeData[idx] = mapEquipeRowToUi(result.row, idx);
    equipesLastSyncSource = 'supabase';
  } else if (result.fallback) {
    equipeData[idx].status = nextStatus;
    equipesLastSyncSource = 'local';
  } else {
    showToast(`Erro ao alterar status do membro: ${result?.error?.message || 'falha desconhecida'}`, 'error');
    return;
  }

  saveEquipesToStorage();
  populateEquipes();

  if (result.fallback) {
    showToast('Membro atualizado localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast(equipeData[idx].status === 'inativo' ? 'Membro inativado.' : 'Membro ativado.', 'success');
}

async function salvarMembroEquipe() {
  const editId = String(document.getElementById('eq-edit-id')?.value || '').trim();
  const nome = String(document.getElementById('eq-nome')?.value || '').trim();
  const area = String(document.getElementById('eq-area')?.value || 'obras').toLowerCase();
  const role = String(document.getElementById('eq-funcao')?.value || '').trim();
  const status = String(document.getElementById('eq-status')?.value || 'disponivel').toLowerCase();
  const telefone = String(document.getElementById('eq-telefone')?.value || '').trim();
  const email = String(document.getElementById('eq-email')?.value || '').trim();
  const diaria = String(document.getElementById('eq-diaria')?.value || '').trim();
  const acesso = String(document.getElementById('eq-acesso')?.value || 'nao').toLowerCase();
  const perfilAcesso = String(document.getElementById('eq-perfil-acesso')?.value || 'Visualizador').trim();
  const obra = String(document.getElementById('eq-obra')?.value || '').trim() || '—';

  if (!nome) {
    showToast('Informe o nome do membro.', 'warning');
    return;
  }

  if (!role) {
    showToast('Selecione a função do membro.', 'warning');
    return;
  }

  if (!diaria) {
    showToast('Informe a diária do membro.', 'warning');
    return;
  }

  const member = normalizeEquipeMember({
    id: editId || undefined,
    name: nome,
    area,
    role,
    status,
    tel: telefone,
    email,
    diaria,
    obra
  }, equipeData.length);

  const dbResult = await upsertEquipeSupabase(member, editId);
  if (!dbResult.ok && !dbResult.fallback) {
    showToast(`Erro ao salvar membro no banco: ${dbResult?.error?.message || 'falha desconhecida'}`, 'error');
    return;
  }

  const sourceMember = dbResult.ok && dbResult.row
    ? mapEquipeRowToUi(dbResult.row, equipeData.length)
    : member;

  equipesLastSyncSource = dbResult.ok ? 'supabase' : 'local';

  if (editId) {
    const idx = equipeData.findIndex((item) => String(item.id || '') === editId);
    if (idx >= 0) {
      equipeData[idx] = { ...equipeData[idx], ...sourceMember, id: sourceMember.id || editId };
    } else {
      equipeData.unshift(sourceMember);
    }
  } else {
    equipeData.unshift(sourceMember);
  }

  const selectedPerfil = PERFIS_PADRAO_USUARIO.includes(perfilAcesso) ? perfilAcesso : 'Visualizador';
  const existingAcesso = getPermissaoAcessoByEquipeId(sourceMember.id);

  if (acesso === 'sim') {
    const usuarioPayload = normalizeUsuarioSistema({
      id: existingAcesso?.id,
      equipeId: sourceMember.id,
      nome: sourceMember.name,
      email,
      perfil: selectedPerfil,
      status: 'ativo',
      empresa: 'REIS FLOW',
      convitesEnviados: existingAcesso?.convitesEnviados || 0,
      ultimoAcesso: existingAcesso?.ultimoAcesso || null,
      senhaTemporaria: existingAcesso?.senhaTemporaria || ''
    }, usuariosSistemaData.length);

    const userResult = await upsertUsuarioSistemaSupabase(usuarioPayload, existingAcesso?.id || '');
    if (userResult.ok && userResult.row) {
      const mapped = normalizeUsuarioSistema(userResult.row, 0);
      const idx = usuariosSistemaData.findIndex((row) => String(row.id || '') === String(mapped.id || ''));
      if (idx >= 0) usuariosSistemaData[idx] = mapped;
      else usuariosSistemaData.unshift(mapped);
      saveUsuariosSistemaToStorage();
    } else if (userResult.fallback) {
      if (existingAcesso) {
        const idx = usuariosSistemaData.findIndex((row) => String(row.id || '') === String(existingAcesso.id || ''));
        if (idx >= 0) usuariosSistemaData[idx] = { ...usuariosSistemaData[idx], ...usuarioPayload, id: existingAcesso.id };
      } else {
        usuariosSistemaData.unshift(usuarioPayload);
      }
      saveUsuariosSistemaToStorage();
    } else if (userResult.error) {
      showToast(`Acesso salvo parcialmente: ${userResult.error.message}`, 'warning');
    }
  } else if (existingAcesso) {
    const userResult = await upsertUsuarioSistemaSupabase({ ...existingAcesso, status: 'bloqueado' }, existingAcesso.id);
    if (userResult.ok && userResult.row) {
      const idx = usuariosSistemaData.findIndex((row) => String(row.id || '') === String(existingAcesso.id || ''));
      if (idx >= 0) usuariosSistemaData[idx] = normalizeUsuarioSistema(userResult.row, idx);
      saveUsuariosSistemaToStorage();
    } else if (userResult.fallback) {
      const idx = usuariosSistemaData.findIndex((row) => String(row.id || '') === String(existingAcesso.id || ''));
      if (idx >= 0) {
        usuariosSistemaData[idx].status = 'bloqueado';
        saveUsuariosSistemaToStorage();
      }
    }
  }

  saveEquipesToStorage();
  populateEquipes();
  populatePermissoesEquipeModal();
  closeModal('modal-novo-membro');
  resetNovoMembroModal();

  if (dbResult.fallback) {
    showToast('Membro salvo localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast(editId ? 'Membro atualizado com sucesso!' : 'Membro adicionado com sucesso!', 'success');
}

function normalizeEstoqueText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseEstoqueNumber(value) {
  const n = Number(String(value ?? 0).replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseEstoqueCurrency(value) {
  return parseEstoqueNumber(String(value || '').replace(/\.(?=\d{3}(\D|$))/g, ''));
}

function formatEstoqueCurrency(value) {
  return formatCurrencyValue(parseEstoqueNumber(value));
}

function getEstoqueColor(qtd, min) {
  const quantidade = Math.max(0, parseEstoqueNumber(qtd));
  const minimo = Math.max(0, parseEstoqueNumber(min));
  if (minimo <= 0) return 'var(--green)';
  if (quantidade < minimo) return 'var(--red)';
  if (quantidade < minimo * 1.4) return 'var(--orange)';
  return 'var(--green)';
}

function buildEstoqueCode() {
  const used = new Set([
    ...(Array.isArray(estoqueData) ? estoqueData : []).map((item) => String(item.code || '').trim().toUpperCase()),
    ...estoqueDraftItems.map((item) => String(item.code || '').trim().toUpperCase())
  ]);
  for (let i = 1; i <= 9999; i += 1) {
    const candidate = `EST-${String(i).padStart(3, '0')}`;
    if (!used.has(candidate)) return candidate;
  }
  return `EST-${Date.now().toString().slice(-5)}`;
}

function normalizeEstoqueItem(item, index = 0) {
  const qtd = Math.max(0, Math.floor(parseEstoqueNumber(item?.qtd)));
  const min = Math.max(0, Math.floor(parseEstoqueNumber(item?.min)));
  const custoNumber = parseEstoqueCurrency(item?.custo);
  const codeRaw = String(item?.code || '').trim().toUpperCase();

  return {
    code: codeRaw || `EST-${String(index + 1).padStart(3, '0')}`,
    name: String(item?.name || 'Item sem nome').trim(),
    cat: String(item?.cat || 'Outros').trim(),
    qtd,
    min,
    custo: formatEstoqueCurrency(custoNumber),
    forn: String(item?.forn || '—').trim() || '—',
    cor: getEstoqueColor(qtd, min)
  };
}

function saveEstoqueToStorage() {
  try {
    localStorage.setItem(ESTOQUE_DATA_STORAGE_KEY, JSON.stringify(estoqueData || []));
  } catch {
    // Falha silenciosa para manter modulo funcional em memoria.
  }
}

function loadEstoqueFromStorage() {
  try {
    const raw = localStorage.getItem(ESTOQUE_DATA_STORAGE_KEY);
    if (!raw) {
      for (let i = 0; i < estoqueData.length; i += 1) {
        estoqueData[i] = normalizeEstoqueItem(estoqueData[i], i);
      }
      estoqueLastSyncSource = 'local';
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    estoqueData.length = 0;
    parsed.forEach((item, index) => estoqueData.push(normalizeEstoqueItem(item, index)));
    estoqueLastSyncSource = 'local';
  } catch {
    for (let i = 0; i < estoqueData.length; i += 1) {
      estoqueData[i] = normalizeEstoqueItem(estoqueData[i], i);
    }
    estoqueLastSyncSource = 'local';
  }
}

function saveEstoqueFiltersToSession() {
  try {
    sessionStorage.setItem(ESTOQUE_FILTERS_SESSION_KEY, JSON.stringify(window._estoqueFilters || {}));
  } catch {
    // Falha silenciosa: filtros continuam em memoria.
  }
}

function loadEstoqueFiltersFromSession() {
  try {
    const raw = sessionStorage.getItem(ESTOQUE_FILTERS_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    window._estoqueFilters = {
      search: String(parsed.search || ''),
      categoria: String(parsed.categoria || 'todos')
    };
  } catch {
    window._estoqueFilters = window._estoqueFilters || { search: '', categoria: 'todos' };
  }
}

function syncEstoqueFiltersUI() {
  const filters = window._estoqueFilters || { search: '', categoria: 'todos' };
  const searchEl = document.getElementById('estoque-filter-search');
  const categoryEl = document.getElementById('estoque-filter-categoria');

  if (searchEl) searchEl.value = filters.search || '';
  if (categoryEl) categoryEl.value = filters.categoria || 'todos';
}

function onEstoqueFiltersChange() {
  window._estoqueFilters = {
    search: document.getElementById('estoque-filter-search')?.value || '',
    categoria: document.getElementById('estoque-filter-categoria')?.value || 'todos'
  };
  saveEstoqueFiltersToSession();
  populateEstoque();
}

function clearEstoqueFilters() {
  window._estoqueFilters = { search: '', categoria: 'todos' };
  saveEstoqueFiltersToSession();
  syncEstoqueFiltersUI();
  populateEstoque();
}

function getFilteredEstoque() {
  const filters = window._estoqueFilters || { search: '', categoria: 'todos' };
  const search = normalizeEstoqueText(filters.search || '');
  const categoria = normalizeEstoqueText(filters.categoria || 'todos');

  return (Array.isArray(estoqueData) ? estoqueData : []).filter((item) => {
    if (categoria !== 'todos' && normalizeEstoqueText(item.cat) !== categoria) return false;
    if (!search) return true;
    const searchable = `${item.code} ${item.name} ${item.cat} ${item.forn}`;
    return normalizeEstoqueText(searchable).includes(search);
  });
}

function updateEstoqueSummary() {
  const summary = document.getElementById('estoque-summary');
  if (!summary) return;

  const total = (Array.isArray(estoqueData) ? estoqueData : []).length;
  const lowStock = (Array.isArray(estoqueData) ? estoqueData : []).filter((item) => parseEstoqueNumber(item.qtd) < parseEstoqueNumber(item.min)).length;
  summary.textContent = `${total} item(ns) · ${lowStock} abaixo do minimo${getSyncStatusSuffix(estoqueLastSyncSource)}`;
}

function updateEquipesSummary() {
  const summary = document.getElementById('equipes-summary');
  if (!summary) return;

  const total = (Array.isArray(equipeData) ? equipeData : []).length;
  const ativos = (Array.isArray(equipeData) ? equipeData : []).filter((member) => String(member?.status || '').toLowerCase() !== 'inativo').length;
  summary.textContent = `${total} profissionais · ${ativos} equipes ativas${getSyncStatusSuffix(equipesLastSyncSource)}`;
}

function populateEstoqueMaterialOptions() {
  const select = document.getElementById('est-entrada-item');
  if (!select) return;

  const currentValue = String(select.value || '');
  const options = ['<option value="">Selecione um item</option>'];

  (Array.isArray(estoqueData) ? estoqueData : []).forEach((item) => {
    const code = String(item.code || '').replace(/"/g, '&quot;');
    options.push(`<option value="${code}">${item.code} · ${item.name}</option>`);
  });

  select.innerHTML = options.join('');
  if (currentValue && (Array.isArray(estoqueData) ? estoqueData : []).some((item) => String(item.code || '') === currentValue)) {
    select.value = currentValue;
  }
}

function toggleEstoqueCreator() {
  if (typeof openModal === 'function') {
    openModal('modal-novo-item-estoque');
  }
}

function renderEstoqueDraftList() {
  const container = document.getElementById('est-draft-list');
  const count = document.getElementById('est-draft-count');
  const submitBtn = document.getElementById('est-draft-submit-btn');
  const toggleBtn = document.getElementById('est-draft-toggle-btn');

  if (count) count.textContent = `${estoqueDraftItems.length} item(ns)`;
  if (submitBtn) submitBtn.disabled = estoqueDraftItems.length === 0;
  if (container) {
    container.style.maxHeight = estoqueDraftExpanded ? '280px' : '110px';
  }
  if (toggleBtn) {
    toggleBtn.innerHTML = estoqueDraftExpanded
      ? '<i class="ti ti-chevron-up"></i>'
      : '<i class="ti ti-chevron-down"></i>';
    toggleBtn.title = estoqueDraftExpanded ? 'Mostrar menos' : 'Mostrar mais';
    toggleBtn.disabled = estoqueDraftItems.length <= 1;
  }
  if (!container) return;

  if (estoqueDraftItems.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:12px">Nenhum item adicionado na pré-lista.</div>';
    return;
  }

  container.innerHTML = estoqueDraftItems.map((item) => {
    const idSafe = String(item._draftId || '').replace(/'/g, '&#39;');
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid var(--border);border-radius:8px">
        <div>
          <div style="font-size:12px;font-weight:700">${item.code} · ${item.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${item.cat} · Qtd ${item.qtd} · Min ${item.min} · ${item.custo}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn btn-ghost btn-xs" onclick="editarItemDraftEstoque('${idSafe}')"><i class="ti ti-edit"></i></button>
          <button class="btn btn-ghost btn-xs" onclick="removerItemDraftEstoque('${idSafe}')"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleEstoqueDraftExpand() {
  estoqueDraftExpanded = !estoqueDraftExpanded;
  renderEstoqueDraftList();
}

function atualizarBotaoDraftEstoque() {
  const addBtn = document.getElementById('est-draft-add-btn');
  if (!addBtn) return;
  if (estoqueDraftEditId) {
    addBtn.innerHTML = '<i class="ti ti-device-floppy"></i>Salvar edição';
  } else {
    addBtn.innerHTML = '<i class="ti ti-plus"></i>Adicionar à lista';
  }
}

function resetEstoqueDraftSession() {
  estoqueDraftItems.length = 0;
  estoqueDraftEditId = null;
  estoqueDraftExpanded = false;
  limparNovoItemEstoque();
  atualizarBotaoDraftEstoque();
  renderEstoqueDraftList();
}

async function findFornecedorIdByNome(nome) {
  const fornecedorNome = String(nome || '').trim();
  if (!fornecedorNome || fornecedorNome === '—') return null;
  if (!window.db?.from) return null;

  try {
    const { data, error } = await db
      .from('fornecedores')
      .select('id')
      .ilike('nome', fornecedorNome)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.id || null;
  } catch {
    return null;
  }
}

async function upsertEstoqueItemInSupabase(item) {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const fornecedorNome = String(item?.forn || '').trim();
    const fornecedorId = await findFornecedorIdByNome(fornecedorNome);
    const payload = {
      codigo: String(item?.code || '').trim(),
      nome: String(item?.name || '').trim(),
      categoria: String(item?.cat || 'Outros').trim(),
      quantidade: Math.max(0, Math.floor(parseEstoqueNumber(item?.qtd))),
      minimo: Math.max(0, Math.floor(parseEstoqueNumber(item?.min))),
      custo_unitario: parseEstoqueCurrency(item?.custo),
      fornecedor: fornecedorNome && fornecedorNome !== '—' ? fornecedorNome : null,
      fornecedor_id: fornecedorId
    };

    const { data, error } = await db
      .from('estoque_itens')
      .upsert(payload, { onConflict: 'codigo' })
      .select('id, codigo, quantidade, custo_unitario, fornecedor, fornecedor_id')
      .single();

    if (error) throw error;
    estoqueLastSyncSource = 'supabase';
    return { ok: true, row: data };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      estoqueLastSyncSource = 'local';
      return { ok: false, fallback: true, error };
    }
    estoqueLastSyncSource = 'local';
    return { ok: false, fallback: false, error };
  }
}

async function ensureBaselineMovimentoLegado(itemRow) {
  if (!itemRow?.id || !window.db?.from) return;

  try {
    const { data: anyMov, error: movError } = await db
      .from('estoque_movimentos')
      .select('id')
      .eq('estoque_item_id', itemRow.id)
      .limit(1);

    if (movError) throw movError;
    if (Array.isArray(anyMov) && anyMov.length > 0) return;

    const legadoQtd = Math.max(0, Math.floor(parseEstoqueNumber(itemRow.quantidade)));
    if (legadoQtd <= 0) return;

    const { error: baselineError } = await db.from('estoque_movimentos').insert({
      estoque_item_id: itemRow.id,
      tipo: 'ajuste',
      quantidade: legadoQtd,
      custo_unitario: parseEstoqueCurrency(itemRow.custo_unitario),
      fornecedor_id: itemRow.fornecedor_id || null,
      observacao: 'Saldo inicial legado migrado para trilha de movimentos.'
    });

    if (baselineError) throw baselineError;
  } catch {
    // baseline eh melhor-esforco para evitar inconsistencias na transicao
  }
}

async function findEstoqueItemRowByCode(code) {
  const estoqueCode = String(code || '').trim();
  if (!estoqueCode || !window.db?.from) return null;

  try {
    const { data, error } = await db
      .from('estoque_itens')
      .select('id, codigo, quantidade, custo_unitario, fornecedor, fornecedor_id')
      .eq('codigo', estoqueCode)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch {
    return null;
  }
}

async function registrarMovimentoEstoqueNoSupabase(args) {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  const item = args?.item;
  const tipo = String(args?.tipo || '').trim().toLowerCase();
  const quantidade = Math.max(0, Math.floor(parseEstoqueNumber(args?.quantidade)));
  if (!item || !tipo || quantidade <= 0) return { ok: true };

  const itemBefore = await findEstoqueItemRowByCode(item?.code);
  const itemSync = await upsertEstoqueItemInSupabase(item);
  if (!itemSync.ok) return itemSync;

  await ensureBaselineMovimentoLegado(itemBefore);

  try {
    const fornecedorNome = String(args?.fornecedorNome || item?.forn || '').trim();
    const fornecedorId = args?.fornecedorId || itemSync.row?.fornecedor_id || await findFornecedorIdByNome(fornecedorNome);
    const payload = {
      estoque_item_id: itemSync.row.id,
      tipo,
      quantidade,
      custo_unitario: parseEstoqueCurrency(args?.custoUnitario ?? item?.custo),
      fornecedor_id: fornecedorId || null,
      observacao: args?.observacao || null
    };

    const { error } = await db.from('estoque_movimentos').insert(payload);
    if (error) throw error;
    estoqueLastSyncSource = 'supabase';
    return { ok: true, row: itemSync.row };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      estoqueLastSyncSource = 'local';
      return { ok: false, fallback: true, error };
    }
    estoqueLastSyncSource = 'local';
    return { ok: false, fallback: false, error };
  }
}

function aggregateMovimentosByItem(movimentos = []) {
  const map = new Map();

  (Array.isArray(movimentos) ? movimentos : []).forEach((mov) => {
    const itemId = String(mov?.estoque_item_id || '').trim();
    if (!itemId) return;

    if (!map.has(itemId)) {
      map.set(itemId, {
        hasMov: false,
        entradas: 0,
        saidas: 0,
        ajustes: 0,
        perdas: 0,
        lastCost: null
      });
    }

    const entry = map.get(itemId);
    const tipo = String(mov?.tipo || '').toLowerCase();
    const qtd = Math.max(0, Math.floor(parseEstoqueNumber(mov?.quantidade)));
    entry.hasMov = true;

    if (tipo === 'entrada') entry.entradas += qtd;
    else if (tipo === 'saida') entry.saidas += qtd;
    else if (tipo === 'ajuste') entry.ajustes += qtd;
    else if (tipo === 'perda') entry.perdas += qtd;

    const custoMov = parseEstoqueCurrency(mov?.custo_unitario);
    if (custoMov > 0) entry.lastCost = custoMov;
  });

  return map;
}

function mapEstoqueSupabaseRowToUi(itemRow, movAgg) {
  const baseQtd = Math.max(0, Math.floor(parseEstoqueNumber(itemRow?.quantidade)));
  const minimo = Math.max(0, Math.floor(parseEstoqueNumber(itemRow?.minimo)));

  const hasMov = Boolean(movAgg?.hasMov);
  const saldoMov = hasMov
    ? Math.max(0, (movAgg.entradas + movAgg.ajustes) - (movAgg.saidas + movAgg.perdas))
    : baseQtd;

  const costRaw = movAgg?.lastCost > 0 ? movAgg.lastCost : parseEstoqueCurrency(itemRow?.custo_unitario);

  return normalizeEstoqueItem({
    code: itemRow?.codigo,
    name: itemRow?.nome,
    cat: itemRow?.categoria,
    qtd: saldoMov,
    min: minimo,
    custo: costRaw,
    forn: itemRow?.fornecedor || '—'
  });
}

async function syncEstoqueFromSupabaseByEvents(options = {}) {
  const { silent = true } = options;
  if (!window.db?.from) return false;

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return false;

  try {
    const [itemsRes, movsRes] = await Promise.all([
      db.from('estoque_itens').select('id, codigo, nome, categoria, quantidade, minimo, custo_unitario, fornecedor, fornecedor_id').order('codigo', { ascending: true }),
      db.from('estoque_movimentos').select('estoque_item_id, tipo, quantidade, custo_unitario, created_at').order('created_at', { ascending: true })
    ]);

    if (itemsRes?.error) throw itemsRes.error;
    if (movsRes?.error) throw movsRes.error;

    const aggMap = aggregateMovimentosByItem(movsRes?.data || []);
    estoqueData.length = 0;
    (itemsRes?.data || []).forEach((row) => {
      const mapped = mapEstoqueSupabaseRowToUi(row, aggMap.get(String(row?.id || '')));
      estoqueData.push(mapped);
    });

    estoqueLastSyncSource = 'supabase';

    saveEstoqueToStorage();
    populateEstoqueMaterialOptions();
    updateEstoqueSummary();
    if (window._currentView === 'estoque') populateEstoque();
    return true;
  } catch (error) {
    estoqueLastSyncSource = 'local';
    if (!silent) {
      showToast(`Falha ao sincronizar estoque por eventos: ${error?.message || 'erro desconhecido'}`, 'warning');
    }
    return false;
  }
}

async function excluirItemEstoqueNoSupabase(code) {
  if (!window.db?.from) return { ok: false, fallback: true, error: null };

  const hasSession = await hasSupabaseSession();
  if (!hasSession) return { ok: false, fallback: true, error: null };

  try {
    const { error } = await db.from('estoque_itens').delete().eq('codigo', code);
    if (error) throw error;
    estoqueLastSyncSource = 'supabase';
    return { ok: true };
  } catch (error) {
    if (isFornecedorSupabaseFallbackError(error)) {
      estoqueLastSyncSource = 'local';
      return { ok: false, fallback: true, error };
    }
    estoqueLastSyncSource = 'local';
    return { ok: false, fallback: false, error };
  }
}

function limparNovoItemEstoque() {
  const ids = ['est-item-codigo', 'est-item-nome', 'est-item-categoria', 'est-item-fornecedor', 'est-item-qtd', 'est-item-min', 'est-item-custo'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = '';
  });

  estoqueDraftEditId = null;
  atualizarBotaoDraftEstoque();
}

function editarItemDraftEstoque(draftId) {
  const id = String(draftId || '').trim();
  if (!id) return;

  const item = estoqueDraftItems.find((entry) => String(entry._draftId || '') === id);
  if (!item) return;

  estoqueDraftEditId = id;
  document.getElementById('est-item-codigo').value = item.code || '';
  document.getElementById('est-item-nome').value = item.name || '';
  document.getElementById('est-item-categoria').value = item.cat || '';
  document.getElementById('est-item-fornecedor').value = item.forn || '';
  document.getElementById('est-item-qtd').value = String(item.qtd ?? '');
  document.getElementById('est-item-min').value = String(item.min ?? '');
  document.getElementById('est-item-custo').value = String(parseEstoqueCurrency(item.custo) || '').replace('.', ',');
  atualizarBotaoDraftEstoque();
}

function removerItemDraftEstoque(draftId) {
  const id = String(draftId || '').trim();
  const idx = estoqueDraftItems.findIndex((entry) => String(entry._draftId || '') === id);
  if (idx < 0) return;

  estoqueDraftItems.splice(idx, 1);
  if (estoqueDraftEditId === id) {
    estoqueDraftEditId = null;
    atualizarBotaoDraftEstoque();
  }
  renderEstoqueDraftList();
}

function salvarNovoItemEstoque() {
  const wasEditing = Boolean(estoqueDraftEditId);
  const codeRaw = String(document.getElementById('est-item-codigo')?.value || '').trim().toUpperCase();
  const name = String(document.getElementById('est-item-nome')?.value || '').trim();
  const cat = String(document.getElementById('est-item-categoria')?.value || '').trim();
  const forn = String(document.getElementById('est-item-fornecedor')?.value || '').trim() || '—';
  const qtd = Math.max(0, Math.floor(parseEstoqueNumber(document.getElementById('est-item-qtd')?.value || 0)));
  const min = Math.max(0, Math.floor(parseEstoqueNumber(document.getElementById('est-item-min')?.value || 0)));
  const custo = parseEstoqueNumber(document.getElementById('est-item-custo')?.value || 0);

  if (!name) {
    showToast('Informe o nome do material.', 'warning');
    return;
  }
  if (!cat) {
    showToast('Selecione a categoria do item.', 'warning');
    return;
  }
  if (custo <= 0) {
    showToast('Informe um custo unitário válido.', 'warning');
    return;
  }

  const code = codeRaw || buildEstoqueCode();
  const codeKey = normalizeEstoqueText(code);
  const existsCodeInDbList = (Array.isArray(estoqueData) ? estoqueData : []).some((item) => normalizeEstoqueText(item.code) === codeKey);
  if (existsCodeInDbList) {
    showToast('Já existe um item com este código no estoque.', 'warning');
    return;
  }

  const existsCodeInDraft = estoqueDraftItems.some((item) => normalizeEstoqueText(item.code) === codeKey && String(item._draftId || '') !== String(estoqueDraftEditId || ''));
  if (existsCodeInDraft) {
    showToast('Já existe um item com este código na pré-lista.', 'warning');
    return;
  }

  const normalizedItem = normalizeEstoqueItem({
    code,
    name,
    cat,
    qtd,
    min,
    custo,
    forn
  }, estoqueData.length);

  if (estoqueDraftEditId) {
    const idx = estoqueDraftItems.findIndex((item) => String(item._draftId || '') === String(estoqueDraftEditId));
    if (idx >= 0) {
      estoqueDraftItems[idx] = { ...estoqueDraftItems[idx], ...normalizedItem };
    } else {
      estoqueDraftItems.unshift({
        ...normalizedItem,
        _draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      });
    }
  } else {
    estoqueDraftItems.unshift({
      ...normalizedItem,
      _draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    });
  }

  limparNovoItemEstoque();
  atualizarBotaoDraftEstoque();
  renderEstoqueDraftList();
  showToast(wasEditing ? 'Item da pré-lista atualizado!' : 'Item adicionado à pré-lista!', 'success');
}

async function cadastrarItensEstoqueLote() {
  if (estoqueDraftItems.length === 0) {
    showToast('Adicione ao menos um item na pré-lista.', 'warning');
    return;
  }

  let movimentoFallback = false;
  for (let i = estoqueDraftItems.length - 1; i >= 0; i -= 1) {
    const item = estoqueDraftItems[i];
    await ensureFornecedorFromEstoqueInput(item?.forn, getFornecedorCategoryKeyFromStockCategory(item?.cat));

    const normalizedItem = normalizeEstoqueItem(item, estoqueData.length);
    estoqueData.unshift(normalizedItem);

    const movResult = await registrarMovimentoEstoqueNoSupabase({
      item: normalizedItem,
      tipo: 'entrada',
      quantidade: parseEstoqueNumber(normalizedItem.qtd),
      custoUnitario: normalizedItem.custo,
      fornecedorNome: normalizedItem.forn,
      observacao: 'Cadastro inicial de item no estoque.'
    });

    if (!movResult.ok && !movResult.fallback) {
      showToast(`Erro ao registrar movimento de estoque: ${movResult?.error?.message || 'falha desconhecida'}`, 'error');
      return;
    }

    if (movResult.fallback) movimentoFallback = true;
  }

  saveEstoqueToStorage();
  populateEstoqueMaterialOptions();
  updateEstoqueSummary();
  populateEstoque();
  resetEstoqueDraftSession();
  if (movimentoFallback) {
    showToast('Itens cadastrados localmente. Faça login para sincronizar movimentos no banco.', 'warning');
    return;
  }

  showToast('Itens cadastrados com sucesso!', 'success');
}

function openEditarItemEstoque(code) {
  const itemCode = String(code || '').trim();
  if (!itemCode) return;

  const item = (Array.isArray(estoqueData) ? estoqueData : []).find((entry) => String(entry.code || '') === itemCode);
  if (!item) {
    showToast('Item não encontrado para edição.', 'warning');
    return;
  }

  document.getElementById('est-edit-code').value = item.code || '';
  document.getElementById('est-edit-codigo').value = item.code || '';
  document.getElementById('est-edit-nome').value = item.name || '';
  document.getElementById('est-edit-categoria').value = item.cat || 'Outros';
  document.getElementById('est-edit-fornecedor').value = item.forn && item.forn !== '—' ? item.forn : '';
  document.getElementById('est-edit-qtd').value = String(parseEstoqueNumber(item.qtd));
  document.getElementById('est-edit-min').value = String(parseEstoqueNumber(item.min));
  document.getElementById('est-edit-custo').value = String(parseEstoqueCurrency(item.custo)).replace('.', ',');

  openModal('modal-editar-item-estoque');
}

async function salvarEdicaoItemEstoque() {
  const code = String(document.getElementById('est-edit-code')?.value || '').trim();
  const name = String(document.getElementById('est-edit-nome')?.value || '').trim();
  const cat = String(document.getElementById('est-edit-categoria')?.value || '').trim();
  const forn = String(document.getElementById('est-edit-fornecedor')?.value || '').trim() || '—';
  const qtd = Math.max(0, Math.floor(parseEstoqueNumber(document.getElementById('est-edit-qtd')?.value || 0)));
  const min = Math.max(0, Math.floor(parseEstoqueNumber(document.getElementById('est-edit-min')?.value || 0)));
  const custo = parseEstoqueNumber(document.getElementById('est-edit-custo')?.value || 0);

  if (!code) {
    showToast('Código do item inválido.', 'warning');
    return;
  }
  if (!name) {
    showToast('Informe o nome do material.', 'warning');
    return;
  }
  if (!cat) {
    showToast('Selecione a categoria do item.', 'warning');
    return;
  }
  if (custo <= 0) {
    showToast('Informe um custo unitário válido.', 'warning');
    return;
  }

  const idx = estoqueData.findIndex((item) => String(item.code || '') === code);
  if (idx < 0) {
    showToast('Item não encontrado para salvar.', 'warning');
    return;
  }

  const previous = normalizeEstoqueItem(estoqueData[idx], idx);
  const updated = normalizeEstoqueItem({
    ...estoqueData[idx],
    code,
    name,
    cat,
    qtd,
    min,
    custo,
    forn
  }, idx);

  estoqueData[idx] = updated;

  await ensureFornecedorFromEstoqueInput(forn, getFornecedorCategoryKeyFromStockCategory(cat));

  const deltaQtd = parseEstoqueNumber(updated.qtd) - parseEstoqueNumber(previous.qtd);
  let movimentoFallback = false;
  if (deltaQtd !== 0) {
    const movResult = await registrarMovimentoEstoqueNoSupabase({
      item: updated,
      tipo: deltaQtd > 0 ? 'ajuste' : 'perda',
      quantidade: Math.abs(deltaQtd),
      custoUnitario: updated.custo,
      fornecedorNome: updated.forn,
      observacao: 'Ajuste manual em edição de item.'
    });

    if (!movResult.ok && !movResult.fallback) {
      showToast(`Erro ao registrar movimento de ajuste: ${movResult?.error?.message || 'falha desconhecida'}`, 'error');
      return;
    }
    movimentoFallback = movResult.fallback;
  } else {
    const upsertResult = await upsertEstoqueItemInSupabase(updated);
    if (!upsertResult.ok && !upsertResult.fallback) {
      showToast(`Erro ao atualizar item no banco: ${upsertResult?.error?.message || 'falha desconhecida'}`, 'error');
      return;
    }
    movimentoFallback = upsertResult.fallback;
  }

  saveEstoqueToStorage();
  populateEstoqueMaterialOptions();
  updateEstoqueSummary();
  populateEstoque();
  closeModal('modal-editar-item-estoque');

  if (movimentoFallback) {
    showToast('Material atualizado localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast('Material atualizado com sucesso!', 'success');
}

async function excluirItemEstoqueEditando() {
  const code = String(document.getElementById('est-edit-code')?.value || '').trim();
  if (!code) {
    showToast('Item inválido para exclusão.', 'warning');
    return;
  }

  const idx = estoqueData.findIndex((item) => String(item.code || '') === code);
  if (idx < 0) {
    showToast('Item não encontrado para exclusão.', 'warning');
    return;
  }

  const current = normalizeEstoqueItem(estoqueData[idx], idx);
  let movimentoFallback = false;

  if (parseEstoqueNumber(current.qtd) > 0) {
    const movResult = await registrarMovimentoEstoqueNoSupabase({
      item: current,
      tipo: 'perda',
      quantidade: parseEstoqueNumber(current.qtd),
      custoUnitario: current.custo,
      fornecedorNome: current.forn,
      observacao: 'Exclusão de item de estoque.'
    });

    if (!movResult.ok && !movResult.fallback) {
      showToast(`Erro ao registrar movimento de exclusão: ${movResult?.error?.message || 'falha desconhecida'}`, 'error');
      return;
    }

    movimentoFallback = movResult.fallback;
  }

  const dbDelete = await excluirItemEstoqueNoSupabase(code);
  if (!dbDelete.ok && !dbDelete.fallback) {
    showToast(`Erro ao excluir item no banco: ${dbDelete?.error?.message || 'falha desconhecida'}`, 'error');
    return;
  }
  if (dbDelete.fallback) movimentoFallback = true;

  estoqueData.splice(idx, 1);
  saveEstoqueToStorage();
  populateEstoqueMaterialOptions();
  updateEstoqueSummary();
  populateEstoque();
  closeModal('modal-editar-item-estoque');

  if (movimentoFallback) {
    showToast('Material excluído localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast('Material excluído com sucesso!', 'success');
}

function resetEntradaEstoqueModal() {
  const item = document.getElementById('est-entrada-item');
  const qtd = document.getElementById('est-entrada-qtd');
  const custo = document.getElementById('est-entrada-custo');
  const forn = document.getElementById('est-entrada-forn');

  if (item) item.value = '';
  if (qtd) qtd.value = '';
  if (custo) custo.value = '';
  if (forn) forn.value = '';
}

async function registrarEntradaEstoque() {
  const code = String(document.getElementById('est-entrada-item')?.value || '').trim();
  const qtdEntrada = Math.floor(parseEstoqueNumber(document.getElementById('est-entrada-qtd')?.value || 0));
  const custoEntrada = parseEstoqueNumber(document.getElementById('est-entrada-custo')?.value || 0);
  const fornecedor = String(document.getElementById('est-entrada-forn')?.value || '').trim();

  if (!code) {
    showToast('Selecione o item para registrar a entrada.', 'warning');
    return;
  }
  if (!qtdEntrada || qtdEntrada <= 0) {
    showToast('Informe uma quantidade válida para entrada.', 'warning');
    return;
  }

  const idx = estoqueData.findIndex((item) => String(item.code || '') === code);
  if (idx < 0) {
    showToast('Item de estoque não encontrado.', 'warning');
    return;
  }

  const current = normalizeEstoqueItem(estoqueData[idx], idx);
  const nextQtd = Math.max(0, parseEstoqueNumber(current.qtd) + qtdEntrada);
  const nextCost = custoEntrada > 0 ? custoEntrada : parseEstoqueCurrency(current.custo);

  const updated = normalizeEstoqueItem({
    ...current,
    qtd: nextQtd,
    custo: nextCost,
    forn: fornecedor || current.forn
  }, idx);

  estoqueData[idx] = updated;

  await ensureFornecedorFromEstoqueInput(fornecedor || current.forn, getFornecedorCategoryKeyFromStockCategory(current.cat));

  const movResult = await registrarMovimentoEstoqueNoSupabase({
    item: updated,
    tipo: 'entrada',
    quantidade: qtdEntrada,
    custoUnitario: nextCost,
    fornecedorNome: fornecedor || current.forn,
    observacao: 'Entrada manual no estoque.'
  });

  if (!movResult.ok && !movResult.fallback) {
    showToast(`Erro ao registrar entrada no banco: ${movResult?.error?.message || 'falha desconhecida'}`, 'error');
    return;
  }

  saveEstoqueToStorage();
  updateEstoqueSummary();
  populateEstoque();
  closeModal('modal-nova-entrada');
  resetEntradaEstoqueModal();

  if (movResult.fallback) {
    showToast('Entrada registrada localmente. Faça login para sincronizar com o banco.', 'warning');
    return;
  }

  showToast('Entrada de estoque registrada com sucesso!', 'success');
}

function populateEstoque() {
  const tbody = document.getElementById('estoque-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const itens = getFilteredEstoque();
  if (itens.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="muted" style="text-align:center">Nenhum item encontrado com os filtros atuais.</td></tr>';
    updateEstoqueSummary();
    updateDashboardOperationalStats();
    return;
  }

  itens.forEach((item) => {
    const percentage = Math.round(Math.min(100, (item.qtd / item.min) * 100));
    const lowStock = item.qtd < item.min;
    const codeSafe = String(item.code || '').replace(/'/g, '&#39;');

    tbody.innerHTML += `<tr>
      <td class="mono">${item.code}</td>
      <td><div class="bold">${item.name}</div></td>
      <td><span class="badge badge-neutral">${item.cat}</span></td>
      <td><span style="font-weight:600;color:${item.cor}">${item.qtd}</span></td>
      <td class="muted">${item.min}</td>
      <td><div class="stock-level"><div class="stock-bar"><div class="stock-fill" style="width:${Math.min(100, percentage)}%;background:${item.cor}"></div></div><span style="font-size:11px;color:${item.cor}">${percentage}%</span></div></td>
      <td class="muted">${item.custo}</td>
      <td class="muted">${item.forn}</td>
      <td><div style="display:flex;gap:4px">${lowStock ? `<button class="btn btn-danger btn-xs" onclick="showToast('Pedido enviado ao fornecedor!','success')"><i class="ti ti-shopping-cart"></i>Pedir</button>` : ''}<button class="btn btn-ghost btn-xs" onclick="openModal('modal-nova-entrada');setTimeout(()=>{const el=document.getElementById('est-entrada-item');if(el)el.value='${codeSafe}';},40)"><i class="ti ti-plus"></i></button><button class="btn btn-ghost btn-xs" onclick="openEditarItemEstoque('${codeSafe}')"><i class="ti ti-edit"></i></button></div></td>
    </tr>`;
  });

  updateEstoqueSummary();
  updateDashboardOperationalStats();
}

function normalizeDashboardStatus(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatCurrencyCompactBR(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return 'R$0';
  if (num < 1000) return `R$${Math.round(num)}`;
  if (num < 1000000) return `R$${(num / 1000).toFixed(0)}k`;
  return `R$${(num / 1000000).toFixed(1).replace('.', ',')}M`;
}

function isFinanceQuitadoStatus(status) {
  const s = normalizeDashboardStatus(status);
  return s === 'recebido' || s === 'pago';
}

function getWorkMetrics(obrasList = []) {
  const list = Array.isArray(obrasList) ? obrasList : [];
  const obrasAtivas = list.filter((obra) => {
    const st = normalizeDashboardStatus(obra?.status);
    return st === 'andamento' || st === 'aprovada';
  }).length;

  const obrasAtrasadas = list.filter((obra) => normalizeDashboardStatus(obra?.status) === 'atrasada').length;

  return {
    obrasAtivas,
    obrasAtrasadas,
    totalObras: list.length,
    updatedAt: new Date().toISOString(),
    sourceCount: list.length
  };
}

function getBudgetMetrics(orcList = []) {
  const list = Array.isArray(orcList) ? orcList : [];
  const pendentesList = list.filter((orc) => normalizeDashboardStatus(orc?.status) === 'pendente');
  const clientePendentesList = list.filter((orc) => normalizeDashboardStatus(orc?.status) === 'cliente_pendente');

  return {
    orcPendentes: pendentesList.length,
    orcPendentesValor: pendentesList.reduce((sum, orc) => sum + parseCurrencyValue(orc?.valor), 0),
    orcClientePendentes: clientePendentesList.length,
    updatedAt: new Date().toISOString(),
    sourceCount: list.length
  };
}

function getTeamMetrics(equipesList = []) {
  const list = Array.isArray(equipesList) ? equipesList : [];

  return {
    equipesCampo: list.filter((member) => normalizeDashboardStatus(member?.status) === 'campo').length,
    equipesAtivas: list.filter((member) => normalizeDashboardStatus(member?.status) !== 'inativo').length,
    updatedAt: new Date().toISOString(),
    sourceCount: list.length
  };
}

function getStockMetrics(estoqueList = []) {
  const list = Array.isArray(estoqueList) ? estoqueList : [];
  const estoqueCritico = list.filter((item) => parseEstoqueNumber(item?.qtd) < parseEstoqueNumber(item?.min)).length;

  return {
    estoqueCritico,
    updatedAt: new Date().toISOString(),
    sourceCount: list.length
  };
}

function getFinanceMetrics(recList = [], pagList = []) {
  const receber = Array.isArray(recList) ? recList : [];
  const pagar = Array.isArray(pagList) ? pagList : [];

  const recOpen = receber.filter((item) => !isFinanceQuitadoStatus(item?.status));
  const pagOpen = pagar.filter((item) => !isFinanceQuitadoStatus(item?.status));
  const recPaid = receber.filter((item) => normalizeDashboardStatus(item?.status) === 'recebido');
  const pagPaid = pagar.filter((item) => normalizeDashboardStatus(item?.status) === 'pago');

  const totalReceber = recOpen.reduce((sum, item) => sum + getFinanceAmount(item), 0);
  const totalPagar = pagOpen.reduce((sum, item) => sum + getFinanceAmount(item), 0);
  const totalPagarCompromissado = pagar.reduce((sum, item) => sum + getFinanceAmount(item), 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ate7Dias = new Date(hoje.getTime() + (7 * 86400000));

  const pagar7dias = pagOpen.reduce((sum, item) => {
    const d = parseFinanceDate(item?.venc || item?.vencimento);
    if (!d) return sum;
    return d <= ate7Dias ? sum + getFinanceAmount(item) : sum;
  }, 0);

  const faturadoMes = recPaid
    .filter((item) => isSameMonthYear(getFinanceEventDate(item), hoje))
    .reduce((sum, item) => sum + getFinanceAmount(item), 0);

  const pagoMes = pagPaid
    .filter((item) => isSameMonthYear(getFinanceEventDate(item), hoje))
    .reduce((sum, item) => sum + getFinanceAmount(item), 0);

  const saldo = totalReceber - totalPagarCompromissado - pagoMes;

  const contasAbertas = [...recOpen, ...pagOpen];
  const contasVencendo = contasAbertas
    .filter((item) => {
      const d = parseFinanceDate(item?.venc || item?.vencimento);
      if (!d) return false;
      d.setHours(0, 0, 0, 0);
      return d >= hoje && d <= ate7Dias;
    })
    .reduce((sum, item) => sum + getFinanceAmount(item), 0);

  return {
    totalReceber,
    totalPagar,
    saldo,
    faturadoMes,
    pagar7dias,
    contasVencendo,
    aReceber: totalReceber,
    aReceberCount: recOpen.length,
    totalPagarCompromissado,
    updatedAt: new Date().toISOString(),
    sourceCount: receber.length + pagar.length
  };
}

function getDashboardMetrics() {
  const obrasList = Array.isArray(obras) ? obras : [];
  const orcList = Array.isArray(orcamentos) ? orcamentos : [];
  const recList = Array.isArray(financRec) ? financRec : [];
  const pagList = Array.isArray(financPag) ? financPag : [];
  const equipesList = Array.isArray(equipeData) ? equipeData : [];
  const estoqueList = Array.isArray(estoqueData) ? estoqueData : [];

  const work = getWorkMetrics(obrasList);
  const budget = getBudgetMetrics(orcList);
  const team = getTeamMetrics(equipesList);
  const stock = getStockMetrics(estoqueList);
  const finance = getFinanceMetrics(recList, pagList);

  const lucroPrevisto = Math.max(0, finance.aReceber - finance.totalPagar);
  const margem = finance.aReceber > 0 ? (lucroPrevisto / finance.aReceber) * 100 : 0;

  return {
    obrasAtivas: work.obrasAtivas,
    obrasAtrasadas: work.obrasAtrasadas,
    faturamentoMensal: finance.faturadoMes,
    lucroPrevisto,
    margem,
    orcPendentes: budget.orcPendentes,
    orcPendentesValor: budget.orcPendentesValor,
    orcClientePendentes: budget.orcClientePendentes,
    equipesCampo: team.equipesCampo,
    equipesAtivas: team.equipesAtivas,
    contasVencendo: finance.contasVencendo,
    aReceber: finance.aReceber,
    aReceberCount: finance.aReceberCount,
    estoqueCritico: stock.estoqueCritico,
    totalObras: work.totalObras,
    updatedAt: new Date().toISOString(),
    sourceCount: work.sourceCount + budget.sourceCount + team.sourceCount + stock.sourceCount + finance.sourceCount
  };
}

function setDashboardMetricText(valueId, value, subId, subText) {
  const valueEl = document.getElementById(valueId);
  const subEl = subId ? document.getElementById(subId) : null;
  if (valueEl) valueEl.textContent = value;
  if (subEl && typeof subText === 'string') subEl.textContent = subText;
}

function updateDashboardDeadlineAlert() {
  const alertEl = document.getElementById('dash-obras-alert');
  const titleEl = document.getElementById('dash-obras-alert-title');
  const descEl = document.getElementById('dash-obras-alert-desc');
  if (!alertEl || !titleEl || !descEl) return;

  const delayed = Array.isArray(obras)
    ? obras.filter((obra) => normalizeDashboardStatus(obra?.status) === 'atrasada')
    : [];

  if (delayed.length === 0) {
    alertEl.style.display = 'none';
    return;
  }

  alertEl.style.display = '';
  titleEl.textContent = `${delayed.length} obra(s) atrasada(s) no momento`;

  const obrasList = delayed
    .slice(0, 3)
    .map((obra) => obra?.code || obra?.name || 'Sem codigo')
    .join(', ');

  const extra = delayed.length > 3 ? ` e mais ${delayed.length - 3}` : '';
  descEl.textContent = `${obrasList}${extra} - revise os prazos e notifique as equipes.`;
}

function applyDashboardMetrics() {
  const m = getDashboardMetrics();

  setDashboardMetricText('dash-obras-ativas-value', String(m.obrasAtivas), 'dash-obras-ativas-sub', `${m.totalObras} obras cadastradas`);
  setDashboardMetricText('dash-obras-atrasadas-value', String(m.obrasAtrasadas), 'dash-obras-atrasadas-sub', `${m.totalObras > 0 ? Math.round((m.obrasAtrasadas / m.totalObras) * 100) : 0}% da carteira`);
  setDashboardMetricText('dash-faturamento-mensal-value', formatCurrencyCompactBR(m.faturamentoMensal), 'dash-faturamento-mensal-sub', 'Recebido no periodo atual');
  setDashboardMetricText('dash-lucro-previsto-value', formatCurrencyCompactBR(m.lucroPrevisto), 'dash-lucro-previsto-sub', `${m.margem.toFixed(1)}% margem prevista`);
  setDashboardMetricText('dash-orc-pendentes-value', String(m.orcPendentes), 'dash-orc-pendentes-sub', `${formatCurrencyCompactBR(m.orcPendentesValor)} em aberto`);
  setDashboardMetricText('dash-equipes-campo-value', String(m.equipesCampo), 'dash-equipes-campo-sub', `${m.equipesAtivas} tecnicos ativos`);
  setDashboardMetricText('dash-contas-vencendo-value', formatCurrencyCompactBR(m.contasVencendo), 'dash-contas-vencendo-sub', 'Proximos 7 dias');
  setDashboardMetricText('dash-a-receber-value', formatCurrencyCompactBR(m.aReceber), 'dash-a-receber-sub', `${m.aReceberCount} parcela(s) em aberto`);
  setDashboardMetricText('dash-estoque-critico-value', String(m.estoqueCritico), 'dash-estoque-critico-sub', `${m.estoqueCritico} item(ns) abaixo do minimo`);

  const metaEl = document.getElementById('dash-metrics-meta');
  if (metaEl) {
    const updated = m.updatedAt ? new Date(m.updatedAt) : null;
    const updatedText = updated && !Number.isNaN(updated.getTime())
      ? updated.toLocaleString('pt-BR')
      : 'agora';
    const count = Number(m.sourceCount || 0);
    metaEl.textContent = `Resumo operacional | registros analisados: ${count} | atualizado em: ${updatedText}`;
  }

  updateDashboardDeadlineAlert();
}

function updateDashboardOperationalStats() {
  applyDashboardMetrics();
}

function openPendingClientBudgets() {
  const statusFilter = document.getElementById('orc-filter-status');
  if (statusFilter) statusFilter.value = 'cliente_pendente';
  if (typeof navigate === 'function') navigate('orcamentos', null);
  if (typeof applyOrcamentosFilters === 'function') applyOrcamentosFilters();
}

function buildDashChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const values = [182, 210, 198, 245, 243, 287];
  const maxValue = Math.max(...values);
  const chart = document.getElementById('chart-fat');
  const labels = document.getElementById('chart-labels');

  if (!chart || chart.children.length > 0) return;

  values.forEach((value, index) => {
    const pct = Math.round((value / maxValue) * 100);
    const isLast = index === values.length - 1;
    chart.innerHTML += `<div style="flex:1;border-radius:3px 3px 0 0;height:${pct}%;background:${isLast ? 'var(--petrol-light)' : 'rgba(33,118,163,0.35)'};cursor:pointer;transition:opacity 0.15s;position:relative" title="${months[index]}: R$ ${value}k" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"></div>`;
    labels.innerHTML += `<span>${months[index]}</span>`;
  });
}

function parseFinanceDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = new Date(raw + (raw.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parts = raw.split('/');
  if (parts.length === 3) {
    const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getFinanceAmount(item) {
  return parseCurrencyValue(item?.valor ?? 0);
}

function getFinanceStatus(item) {
  return String(item?.status || '').toLowerCase();
}

function getFlowPeriodConfig(period) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let start = new Date(end);
  let label = 'Últimos 30 dias';
  let type = 'days';
  let points = 30;

  if (period === '7d') {
    start.setDate(end.getDate() - 6);
    label = 'Últimos 7 dias';
    points = 7;
  } else if (period === '15d') {
    start.setDate(end.getDate() - 14);
    label = 'Últimos 15 dias';
    points = 15;
  } else if (period === 'anual') {
    start = new Date(end.getFullYear(), 0, 1);
    label = `Ano de ${end.getFullYear()}`;
    type = 'months';
    points = 12;
  } else {
    start.setDate(end.getDate() - 29);
  }

  return { start, end, label, type, points };
}

function buildFlowSeries(period) {
  const cfg = getFlowPeriodConfig(period);
  const series = [];

  if (cfg.type === 'months') {
    for (let month = 0; month < 12; month += 1) {
      const start = new Date(cfg.end.getFullYear(), month, 1);
      const end = new Date(cfg.end.getFullYear(), month + 1, 0, 23, 59, 59, 999);
      series.push({ label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(start).replace('.', ''), start, end, entradas: 0, saidas: 0, saldo: 0 });
    }
  } else {
    for (let offset = cfg.points - 1; offset >= 0; offset -= 1) {
      const start = new Date(cfg.end);
      start.setDate(cfg.end.getDate() - offset);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      series.push({ label: start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), start, end, entradas: 0, saidas: 0, saldo: 0 });
    }
  }

  const allEntradas = Array.isArray(financRec) ? financRec : [];
  const allSaidas = Array.isArray(financPag) ? financPag : [];

  const fillSeries = (items, isEntrada) => {
    items.forEach((item) => {
      const refDate = parseFinanceDate(item.venc || item.vencimento);
      if (!refDate) return;
      if (refDate < cfg.start || refDate > cfg.end) return;

      const amount = getFinanceAmount(item);
      const bucket = series.find((point) => refDate >= point.start && refDate <= point.end);
      if (!bucket) return;
      if (isEntrada) bucket.entradas += amount;
      else bucket.saidas += amount;
    });
  };

  fillSeries(allEntradas, true);
  fillSeries(allSaidas, false);

  let saldoAcumulado = 0;
  series.forEach((point) => {
    saldoAcumulado += point.entradas - point.saidas;
    point.saldo = saldoAcumulado;
  });

  return { cfg, series };
}

function drawFluxo() {
  const svg = document.getElementById('fluxo-svg');
  if (!svg) return;

  const periodSelect = document.getElementById('fin-flow-period');
  const flowMeta = document.getElementById('fin-flow-meta');
  const flowTitle = document.getElementById('fin-flow-title');
  const period = periodSelect?.value || '30d';
  const { cfg, series } = buildFlowSeries(period);
  const totalEntradas = series.reduce((acc, point) => acc + point.entradas, 0);
  const totalSaidas = series.reduce((acc, point) => acc + point.saidas, 0);
  const saldoFinal = (series.length > 0 ? series[series.length - 1].saldo : 0);

  if (flowTitle) flowTitle.textContent = `Fluxo de Caixa - ${cfg.label}`;
  if (flowMeta) {
    flowMeta.textContent = `Entradas ${formatCurrencyValue(totalEntradas)} | Saidas ${formatCurrencyValue(totalSaidas)} | Saldo ${formatCurrencyValue(saldoFinal)}`;
  }

  const width = 660;
  const height = 170;
  const padX = 20;
  const padY = 18;
  const centerY = height / 2;
  const maxValue = Math.max(1, ...series.flatMap((point) => [Math.abs(point.entradas), Math.abs(point.saidas), Math.abs(point.saldo)]));
  const scaleX = (index) => padX + (series.length <= 1 ? 0 : index * ((width - padX * 2) / (series.length - 1)));
  const scaleSignedY = (value) => centerY - ((value / maxValue) * (height / 2 - padY));

  const entradas = series.map((point) => point.entradas);
  const saidas = series.map((point) => -point.saidas);
  const saldos = series.map((point) => point.saldo);
  const polylineSaldo = saldos.map((value, index) => `${scaleX(index)},${scaleSignedY(value)}`).join(' ');
  const gridLines = [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75].map((ratio) => {
    const y = centerY - ratio * (height / 2 - padY);
    return `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3 4" opacity="0.35"/>`;
  }).join('');
  const labelsY = height - 4;
  const zeroLabelY = centerY - 4;
  const topLabelY = padY + 10;
  const bottomLabelY = height - padY;

  const bars = series.map((point, index) => {
    const xCenter = scaleX(index);
    const barW = Math.max(4, Math.min(10, (width - padX * 2) / Math.max(1, series.length * 2.2)));
    const entradaY = scaleSignedY(point.entradas);
    const saidaY = scaleSignedY(-point.saidas);
    const entradaH = Math.max(0, centerY - entradaY);
    const saidaH = Math.max(0, saidaY - centerY);
    const label = point.label;
    const detail = `${label} | Entradas: ${formatCurrencyValue(point.entradas)} | Saidas: ${formatCurrencyValue(point.saidas)} | Saldo: ${formatCurrencyValue(point.saldo)}`;

    return `
      <g>
        <rect x="${xCenter - barW / 2}" y="${entradaY}" width="${barW}" height="${entradaH}" fill="var(--green)" opacity="0.25" rx="2"/>
        <rect x="${xCenter - barW / 2}" y="${centerY}" width="${barW}" height="${saidaH}" fill="var(--red)" opacity="0.25" rx="2"/>
        <title>${detail}</title>
      </g>
    `;
  }).join('');

  const saldoDots = series.map((point, index) => {
    const x = scaleX(index);
    const y = scaleSignedY(point.saldo);
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--petrol-light)"><title>${point.label} | Saldo ${formatCurrencyValue(point.saldo)}</title></circle>`;
  }).join('');

  svg.innerHTML = `
    ${gridLines}
    <line x1="${padX}" y1="${centerY}" x2="${width - padX}" y2="${centerY}" stroke="var(--border)" stroke-width="1.5"/>
    ${bars}
    <polyline points="${polylineSaldo}" fill="none" stroke="var(--petrol-light)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${saldoDots}
    <text x="${padX}" y="${topLabelY}" fill="var(--text-muted)" font-size="10" text-anchor="start">+${formatCurrencyValue(maxValue)}</text>
    <text x="${padX}" y="${zeroLabelY}" fill="var(--text-muted)" font-size="10" text-anchor="start">0</text>
    <text x="${padX}" y="${bottomLabelY}" fill="var(--text-muted)" font-size="10" text-anchor="start">-${formatCurrencyValue(maxValue)}</text>
    ${series.map((point, index) => `<text x="${scaleX(index)}" y="${labelsY}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${point.label}</text>`).join('')}
  `;
}

function onFinFlowPeriodChange() {
  drawFluxo();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const icon = document.getElementById('sb-icon');
  if (window.innerWidth <= 900) {
    sidebar.classList.toggle('mobile-open');
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('mobile-open'));
    return;
  }

  sidebar.classList.toggle('collapsed');
  icon.className = sidebar.classList.contains('collapsed') ? 'ti ti-layout-sidebar-left-expand' : 'ti ti-layout-sidebar-left-collapse';
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.classList.remove('mobile-open');
  document.body.classList.remove('sidebar-open');
}

function syncSidebarMode() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  if (window.innerWidth > 900) {
    sidebar.classList.remove('mobile-open');
    document.body.classList.remove('sidebar-open');
  }
}

window.addEventListener('resize', syncSidebarMode);

function setObrasView(mode, element) {
  window._obrasViewMode = mode;
  document.querySelectorAll('#view-obras .tab-item').forEach((tab) => tab.classList.remove('active'));
  element.classList.add('active');
  document.getElementById('obras-list').style.display = mode === 'list' ? 'block' : 'none';
  document.getElementById('obras-kanban').style.display = mode === 'kanban' ? 'flex' : 'none';
  if (typeof applyObrasFilters === 'function') {
    applyObrasFilters();
  } else if (mode === 'kanban') {
    populateObras();
  }
}

function setFinTab(tab, element) {
  document.querySelectorAll('#view-financeiro .tab-item').forEach((item) => item.classList.remove('active'));
  if (element) element.classList.add('active');
  ['fin-receber', 'fin-pagar', 'fin-fluxo'].forEach((id) => {
    document.getElementById(id).style.display = 'none';
  });
  const filtersBar = document.getElementById('fin-filters-bar');
  if (filtersBar) filtersBar.style.display = tab === 'fluxo' ? 'none' : '';
  document.getElementById(`fin-${tab}`).style.display = 'block';
  if (tab === 'fluxo') drawFluxo();
}

function carregarObrasNoSelectFinanceiro() {
  const select = document.getElementById('fin-obra-id');
  if (!select) return;

  select.innerHTML = '<option value="">Nenhuma obra</option>';
  (Array.isArray(obras) ? obras : []).forEach((obra) => {
    const idValue = String(obra.id || '').trim();
    if (!idValue) return;
    select.innerHTML += `<option value="${idValue}">${obra.code} - ${obra.name}</option>`;
  });
}

function onLancamentoTipoChange(tipo) {
  const kind = String(tipo || 'receber').toLowerCase();
  const clienteField = document.getElementById('fin-field-cliente');
  const fornecedorField = document.getElementById('fin-field-fornecedor');
  const obraField = document.getElementById('fin-field-obra');
  const categoria = document.getElementById('fin-categoria');

  const isReceber = kind === 'receber';
  if (clienteField) clienteField.style.display = isReceber ? '' : 'none';
  if (obraField) obraField.style.display = isReceber ? '' : 'none';
  if (fornecedorField) fornecedorField.style.display = isReceber ? 'none' : '';
  if (categoria && typeof renderSelectOptions === 'function') {
    renderSelectOptions(categoria, getConfiguredLaunchCategoryOptions(), null);
  }
}

function resetLancamentoModal() {
  const title = document.getElementById('fin-modal-title');
  const saveBtn = document.getElementById('fin-save-btn');
  const editRef = document.getElementById('fin-edit-ref');
  const statusBtn = document.getElementById('fin-status-btn');
  const statusCurrent = document.getElementById('fin-status-current');
  const tipo = document.getElementById('fin-tipo');
  const cliente = document.getElementById('fin-cliente-id');
  const fornecedor = document.getElementById('fin-fornecedor');
  const desc = document.getElementById('fin-descricao');
  const valor = document.getElementById('fin-valor');
  const venc = document.getElementById('fin-vencimento');
  const cat = document.getElementById('fin-categoria');
  const obra = document.getElementById('fin-obra-id');

  if (title) title.innerHTML = '<i class="ti ti-cash" style="margin-right:8px;color:var(--petrol-light)"></i>Novo Lançamento';
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-check"></i>Criar Lançamento';
  if (editRef) editRef.value = '';
  if (statusCurrent) statusCurrent.value = '';
  if (statusBtn) statusBtn.style.display = 'none';
  if (tipo) tipo.disabled = false;

  if (tipo) tipo.value = 'receber';
  if (cliente) cliente.value = '';
  if (fornecedor) fornecedor.value = '';
  if (desc) desc.value = '';
  if (valor) valor.value = '';
  if (cat) cat.value = getConfiguredLaunchCategoryOptions()[0]?.value || 'Serviços';
  if (obra) obra.value = '';

  if (typeof refreshConfigDrivenSelects === 'function') {
    refreshConfigDrivenSelects();
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  if (venc) venc.value = `${yyyy}-${mm}-${dd}`;

  onLancamentoTipoChange('receber');
}

async function openLancamentoFinanceiro(tipo, referencia) {
  const kind = String(tipo || 'receber').toLowerCase();
  const ref = String(referencia || '').trim();

  openModal('modal-lancamento');
  if (typeof carregarClientesNoSelect === 'function') await carregarClientesNoSelect('fin-cliente-id');
  if (typeof carregarObrasNoSelectFinanceiro === 'function') carregarObrasNoSelectFinanceiro();

  const title = document.getElementById('fin-modal-title');
  const saveBtn = document.getElementById('fin-save-btn');
  const editRef = document.getElementById('fin-edit-ref');
  const statusBtn = document.getElementById('fin-status-btn');
  const statusCurrent = document.getElementById('fin-status-current');
  const tipoEl = document.getElementById('fin-tipo');

  if (editRef) editRef.value = ref;
  if (tipoEl) {
    tipoEl.value = kind;
    tipoEl.disabled = true;
  }
  if (title) title.innerHTML = '<i class="ti ti-cash" style="margin-right:8px;color:var(--petrol-light)"></i>Editar Lançamento';
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i>Salvar alterações';

  try {
    const table = kind === 'receber' ? 'financeiro_receber' : 'financeiro_pagar';
    const select = kind === 'receber'
      ? 'referencia, cliente_id, obra_id, descricao, valor, vencimento, status, clientes(nome), obras(codigo)'
      : 'referencia, fornecedor, categoria, valor, vencimento, status';
    const { data, error } = await db.from(table).select(select).eq('referencia', ref).single();
    if (error) throw error;
    if (!data) return;

    const desc = document.getElementById('fin-descricao');
    const valor = document.getElementById('fin-valor');
    const venc = document.getElementById('fin-vencimento');
    const cat = document.getElementById('fin-categoria');
    const cliente = document.getElementById('fin-cliente-id');
    const fornecedor = document.getElementById('fin-fornecedor');
    const obra = document.getElementById('fin-obra-id');

    if (desc) desc.value = data.descricao || '';
    if (valor) valor.value = Number(data.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (venc) venc.value = data.vencimento ? String(data.vencimento).slice(0, 10) : '';

    if (kind === 'receber') {
      if (cliente) cliente.value = data.cliente_id || '';
      if (obra) obra.value = data.obra_id || '';
    } else {
      if (fornecedor) fornecedor.value = data.fornecedor || '';
      if (cat) cat.value = data.categoria || 'Serviços';
    }

    const statusLoaded = String(data.status || '').toLowerCase();
    const dueLoaded = data.vencimento ? String(data.vencimento).slice(0, 10) : '';
    if (statusCurrent) statusCurrent.value = statusLoaded;
    if (statusBtn) {
      statusBtn.style.display = 'inline-flex';
      const nextTarget = getLancamentoStatusTarget(kind, statusLoaded, dueLoaded);
      statusBtn.innerHTML = `<i class="ti ti-toggle-right"></i>${getLancamentoStatusButtonLabel(kind, statusLoaded, nextTarget)}`;
      applyLancamentoStatusButtonStyle(statusBtn, statusLoaded);
    }
  } catch (error) {
    console.error(error);
    showToast('Não foi possível carregar o lançamento para edição.', 'error');
  }
}

function inferirStatusAbertoPorVencimento(vencimentoIso) {
  if (!vencimentoIso) return 'pendente';

  const venc = new Date(`${String(vencimentoIso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(venc.getTime())) return 'pendente';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (venc < hoje) return 'vencido';
  if (venc > hoje) return 'futuro';
  return 'pendente';
}

function isLancamentoQuitado(tipo, status) {
  const kind = String(tipo || '').toLowerCase();
  const value = String(status || '').toLowerCase();
  if (kind === 'receber') return value === 'recebido';
  return value === 'pago';
}

function getLancamentoStatusTarget(tipo, currentStatus, vencimentoIso) {
  const kind = String(tipo || '').toLowerCase();
  if (isLancamentoQuitado(kind, currentStatus)) {
    return inferirStatusAbertoPorVencimento(vencimentoIso);
  }
  return kind === 'receber' ? 'recebido' : 'pago';
}

function getLancamentoStatusButtonLabel(tipo, currentStatus, targetStatus) {
  const kind = String(tipo || '').toLowerCase();
  const current = String(currentStatus || '').toLowerCase();

  const labelAtual = kind === 'receber'
    ? (current === 'recebido' ? 'Recebido' : current === 'vencido' ? 'Vencido' : 'Pendente')
    : (current === 'pago' ? 'Pago' : current === 'vencido' ? 'Vencido' : 'Pendente');

  return `Status: ${labelAtual}`;
}

function applyLancamentoStatusButtonStyle(button, status) {
  if (!button) return;
  const current = String(status || '').toLowerCase();

  let bg = 'var(--orange-bg)';
  let color = 'var(--orange)';
  let border = 'rgba(245,149,51,0.45)';

  if (current === 'recebido' || current === 'pago') {
    bg = 'var(--green-bg)';
    color = 'var(--green)';
    border = 'rgba(45,212,160,0.45)';
  } else if (current === 'vencido') {
    bg = 'var(--red-bg)';
    color = 'var(--red)';
    border = 'rgba(255,95,95,0.45)';
  }

  button.style.background = bg;
  button.style.color = color;
  button.style.border = `1px solid ${border}`;
}

async function alternarStatusLancamentoFinanceiro() {
  const editRef = String(document.getElementById('fin-edit-ref')?.value || '').trim();
  const tipo = String(document.getElementById('fin-tipo')?.value || 'receber').toLowerCase();
  const currentStatus = String(document.getElementById('fin-status-current')?.value || '').toLowerCase();
  const vencimentoIso = String(document.getElementById('fin-vencimento')?.value || '').trim();

  if (!editRef) {
    showToast('Abra um lançamento existente para alterar o status.', 'warning');
    return;
  }

  const targetStatus = getLancamentoStatusTarget(tipo, currentStatus, vencimentoIso);
  const table = tipo === 'receber' ? 'financeiro_receber' : 'financeiro_pagar';

  try {
    const { error } = await db.from(table).update({ status: targetStatus }).eq('referencia', editRef);
    if (error) throw error;

    const list = tipo === 'receber' ? financRec : financPag;
    const idx = list.findIndex((item) => String(item.ref || '') === editRef);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status: targetStatus };
    }

    if (typeof populateFin === 'function') populateFin();
    if (typeof refreshNotificationBadge === 'function') refreshNotificationBadge();

    const statusCurrent = document.getElementById('fin-status-current');
    const statusBtn = document.getElementById('fin-status-btn');
    if (statusCurrent) statusCurrent.value = targetStatus;
    if (statusBtn) {
      const nextTarget = getLancamentoStatusTarget(tipo, targetStatus, vencimentoIso);
      statusBtn.innerHTML = `<i class="ti ti-toggle-right"></i>${getLancamentoStatusButtonLabel(tipo, targetStatus, nextTarget)}`;
      applyLancamentoStatusButtonStyle(statusBtn, targetStatus);
    }

    showToast('Status atualizado com sucesso!', 'success');
  } catch (error) {
    console.error(error);
    showToast('Não foi possível alterar o status.', 'error');
  }
}

function openModal(id) {
  window._modalStack = Array.isArray(window._modalStack) ? window._modalStack : [];

  if (id === 'modal-notifications') {
    document.getElementById(id).classList.add('open');
    return;
  }

  if (typeof canAccessModal === 'function' && !canAccessModal(id)) {
    if (typeof showAccessDenied === 'function') {
      showAccessDenied(id.replace('modal-', '').replace(/-/g, ' '));
    }
    return;
  }

  if (id === 'modal-novo-fornecedor' && typeof resetNovoFornecedorModal === 'function') {
    resetNovoFornecedorModal();
  }

  const overlay = document.getElementById(id);
  if (!overlay) return;

  const baseZ = 1000;
  const nextZ = baseZ + window._modalStack.length * 20;
  overlay.style.zIndex = String(nextZ);
  overlay.classList.add('open');
  window._modalStack.push(id);
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.zIndex = '';
  }
  window._modalStack = Array.isArray(window._modalStack) ? window._modalStack.filter((item) => item !== id) : [];
  if (id === 'modal-novo-cliente' && typeof resetClienteModalMode === 'function') {
    resetClienteModalMode();
  }
  if (id === 'modal-novo-orc' && typeof resetOrcamentoModal === 'function') {
    resetOrcamentoModal();
  }
  if (id === 'modal-novo-fornecedor') {
    resetNovoFornecedorModal();
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon-i');
  const messageEl = document.getElementById('toast-msg');
  const icons = {
    success:'ti-circle-check',
    warning:'ti-alert-triangle',
    error:'ti-alert-circle',
    info:'ti-info-circle'
  };

  toast.className = `toast toast-${type}`;
  icon.className = `ti ${icons[type] || 'ti-check'}`;
  messageEl.textContent = message;

  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

function toggleCheck(element) {
  element.classList.toggle('done');
  if (typeof refreshObraProgressFromChecklist === 'function') {
    refreshObraProgressFromChecklist();
  }
}

function openQuickCreate() {
  openModal('modal-nova-obra');
}

function getImportantNotifications() {
  const notifications = [];

  obras.filter((obra) => obra.status === 'atrasada').forEach((obra) => {
    notifications.push({
      type: 'obra-atrasada',
      severity: 'danger',
      icon: 'ti-building-factory-2',
      title: `${obra.code} atrasada`,
      desc: `${obra.name} · ${obra.client} · prazo ${obra.prazo}`,
      actionLabel: 'Abrir obra',
      actionView: 'obras',
      actionCode: obra.code
    });
  });

  obras.filter((obra) => obra.status === 'pausada').forEach((obra) => {
    notifications.push({
      type: 'obra-problema',
      severity: 'warning',
      icon: 'ti-alert-triangle',
      title: `${obra.code} com sinalização de problema`,
      desc: `${obra.name} · ${obra.client} · status pausado`,
      actionLabel: 'Ver obra',
      actionView: 'obras',
      actionCode: obra.code
    });
  });

  financRec.filter((item) => item.status === 'vencido').forEach((item) => {
    notifications.push({
      type: 'receber-vencido',
      severity: 'danger',
      icon: 'ti-cash-banknote-off',
      title: `Recebimento vencido ${item.ref}`,
      desc: `${item.client} · ${item.obra} · ${item.desc} · ${item.valor}`,
      actionLabel: 'Ir para financeiro',
      actionView: 'financeiro',
      actionTab: 'receber'
    });
  });

  financPag.filter((item) => item.status === 'vencido').forEach((item) => {
    notifications.push({
      type: 'pagar-vencido',
      severity: 'danger',
      icon: 'ti-alert-circle',
      title: `Pagamento em atraso ${item.ref}`,
      desc: `${item.forn} · ${item.cat} · ${item.valor} · venc. ${item.venc}`,
      actionLabel: 'Ir para financeiro',
      actionView: 'financeiro',
      actionTab: 'pagar'
    });
  });

  estoqueData.filter((item) => item.qtd < item.min).forEach((item) => {
    const deficit = item.min - item.qtd;
    notifications.push({
      type: 'estoque-baixo',
      severity: 'warning',
      icon: 'ti-package-import',
      title: `Estoque baixo ${item.code}`,
      desc: `${item.name} · faltam ${deficit} unidade(s) para o mínimo · fornecedor ${item.forn}`,
      actionLabel: 'Abrir estoque',
      actionView: 'estoque'
    });
  });

  const orcList = Array.isArray(orcamentos) ? orcamentos : [];
  const clientePendentes = orcList.filter((orc) => normalizeDashboardStatus(orc?.status) === 'cliente_pendente');
  if (clientePendentes.length > 0) {
    notifications.push({
      type: 'cliente-pendente',
      severity: 'warning',
      icon: 'ti-user-exclamation',
      title: `Cadastro de cliente pendente (${clientePendentes.length})`,
      desc: `${clientePendentes.length} orçamento(s) aguardando vínculo definitivo de cliente.`,
      actionLabel: 'Abrir orçamentos',
      actionView: 'orcamentos',
      actionStatus: 'cliente_pendente'
    });
  }

  return notifications;
}

function refreshNotificationBadge() {
  const badge = document.getElementById('notif-count');
  const obrasBadge = document.getElementById('obras-nav-badge');
  const notifications = getImportantNotifications();

  window._importantNotifications = notifications;

  const obraCount = notifications.filter((item) => item.type === 'obra-atrasada' || item.type === 'obra-problema').length;
  if (obrasBadge) {
    obrasBadge.textContent = String(obraCount);
    obrasBadge.style.display = obraCount > 0 ? 'inline-flex' : 'none';
  }

  if (!badge) return notifications;

  const count = notifications.length;
  badge.textContent = String(count);
  badge.style.display = count > 0 ? 'inline-flex' : 'none';

  return notifications;
}

function openNotificationTarget(index) {
  closeModal('modal-notifications');

  const notification = window._importantNotifications?.[index];

  if (!notification) return;

  if (notification.actionView === 'obras' && notification.actionCode) {
    navigate('obras', null);
    setTimeout(() => openObraDetail(notification.actionCode), 80);
    return;
  }

  if (notification.actionView === 'financeiro') {
    navigate('financeiro', null);
    setTimeout(() => {
      const tab = document.querySelector(`#view-financeiro .tab-item[onclick*="setFinTab('${notification.actionTab}')"]`);
      if (typeof setFinTab === 'function' && notification.actionTab) {
        setFinTab(notification.actionTab, tab || document.querySelector('#view-financeiro .tab-item.active'));
      }
    }, 80);
    return;
  }

  if (notification.actionView === 'estoque') {
    navigate('estoque', null);
    return;
  }

  if (notification.actionView === 'orcamentos') {
    navigate('orcamentos', null);
    setTimeout(() => {
      const statusFilter = document.getElementById('orc-filter-status');
      if (statusFilter && notification.actionStatus) statusFilter.value = notification.actionStatus;
      if (typeof applyOrcamentosFilters === 'function') applyOrcamentosFilters();
    }, 80);
  }
}

function renderNotificationPanel() {
  const summary = document.getElementById('notification-summary');
  const list = document.getElementById('notification-list');
  const notifications = refreshNotificationBadge();

  if (!summary || !list) return;

  const counts = {
    obras: notifications.filter((item) => item.type === 'obra-atrasada').length,
    problemas: notifications.filter((item) => item.type === 'obra-problema').length,
    financeiro: notifications.filter((item) => item.type === 'receber-vencido' || item.type === 'pagar-vencido').length,
    estoque: notifications.filter((item) => item.type === 'estoque-baixo').length,
    cadastro: notifications.filter((item) => item.type === 'cliente-pendente').length
  };

  summary.innerHTML = `
    <div class="notification-summary-card">
      <div class="notification-summary-label">Obras atrasadas</div>
      <div class="notification-summary-value" style="color:var(--red)">${counts.obras}</div>
      <div class="notification-summary-desc">Atrasos que exigem ação imediata</div>
    </div>
    <div class="notification-summary-card">
      <div class="notification-summary-label">Problemas nas obras</div>
      <div class="notification-summary-value" style="color:var(--orange)">${counts.problemas}</div>
      <div class="notification-summary-desc">Obras pausadas ou com sinalização</div>
    </div>
    <div class="notification-summary-card">
      <div class="notification-summary-label">Financeiro em atraso</div>
      <div class="notification-summary-value" style="color:var(--petrol-light)">${counts.financeiro}</div>
      <div class="notification-summary-desc">Recebimentos e pagamentos vencidos</div>
    </div>
    <div class="notification-summary-card">
      <div class="notification-summary-label">Estoque baixo</div>
      <div class="notification-summary-value" style="color:var(--green)">${counts.estoque}</div>
      <div class="notification-summary-desc">Itens abaixo do mínimo</div>
    </div>
    <div class="notification-summary-card">
      <div class="notification-summary-label">Cadastros pendentes</div>
      <div class="notification-summary-value" style="color:var(--petrol-mid)">${counts.cadastro}</div>
      <div class="notification-summary-desc">Orçamentos aguardando vínculo de cliente</div>
    </div>
  `;

  if (notifications.length === 0) {
    list.innerHTML = '<div class="notification-item-empty">Nenhuma notificação crítica no momento.</div>';
    return;
  }

  list.innerHTML = notifications.map((notification, index) => `
    <button class="notification-item notification-item-${notification.severity}" type="button" onclick="openNotificationTarget(${index})">
      <div class="notification-item-icon"><i class="ti ${notification.icon}"></i></div>
      <div class="notification-item-body">
        <div class="notification-item-top">
          <div>
            <div class="notification-item-title">${notification.title}</div>
            <div class="notification-item-desc">${notification.desc}</div>
          </div>
          <span class="badge ${notification.severity === 'danger' ? 'badge-danger' : 'badge-warning'}"><span class="badge-dot"></span>${notification.actionLabel}</span>
        </div>
      </div>
    </button>
  `).join('');
}

function showNotifPanel() {
  renderNotificationPanel();
  openModal('modal-notifications');
}

function clearViewRenderCache(view) {
  const clearIds = {
    dashboard: ['chart-fat', 'chart-labels'],
    obras: ['obras-tbody', 'obras-kanban'],
    orcamentos: ['orc-tbody', 'orc-preview-items'],
    clientes: ['cli-tbody'],
    financeiro: ['fin-rec-tbody', 'fin-pag-tbody', 'fluxo-svg'],
    equipes: ['equipes-grid'],
    estoque: ['estoque-tbody'],
    fornecedores: ['fornecedores-tbody'],
    'obra-detail': ['obra-detail-breadcrumb', 'obra-detail-code', 'obra-detail-name', 'obra-detail-client', 'obra-detail-resp', 'obra-detail-prazo', 'obra-detail-valor', 'obra-detail-status']
  };

  (clearIds[view] || []).forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      element.value = '';
    } else {
      element.innerHTML = '';
    }
  });
}

async function refreshCurrentView() {
  const refreshBtn = document.getElementById('btn-refresh');
  const currentView = window._currentView || 'dashboard';

  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = '0.7';
  }

  try {
    if (typeof loadAllData === 'function') {
      await loadAllData();
    }
    await syncEquipesFromSupabase({ silent: true });
    await syncFornecedoresFromSupabase({ silent: true });
    await syncEstoqueFromSupabaseByEvents({ silent: true });

    if (currentView === 'dashboard') {
      clearViewRenderCache('dashboard');
      if (typeof buildDashChart === 'function') buildDashChart();
      updateDashboardOperationalStats();
    } else if (currentView === 'obras') {
      clearViewRenderCache('obras');
      if (typeof populateObras === 'function') populateObras();
    } else if (currentView === 'orcamentos') {
      clearViewRenderCache('orcamentos');
      if (typeof populateOrc === 'function') populateOrc();
      if (typeof populateOrcPreview === 'function') populateOrcPreview();
    } else if (currentView === 'clientes') {
      clearViewRenderCache('clientes');
      if (typeof populateClientes === 'function') populateClientes();
    } else if (currentView === 'financeiro') {
      clearViewRenderCache('financeiro');
      if (typeof populateFin === 'function') populateFin();
      if (typeof drawFluxo === 'function') drawFluxo();
    } else if (currentView === 'equipes') {
      clearViewRenderCache('equipes');
      if (typeof populateEquipes === 'function') populateEquipes();
    } else if (currentView === 'estoque') {
      clearViewRenderCache('estoque');
      if (typeof populateEstoque === 'function') populateEstoque();
    } else if (currentView === 'fornecedores') {
      clearViewRenderCache('fornecedores');
      if (typeof populateFornecedores === 'function') populateFornecedores();
    } else if (currentView === 'obra-detail') {
      clearViewRenderCache('obra-detail');
      if (typeof openObraDetail === 'function' && window._currentObraCode) {
        openObraDetail(window._currentObraCode);
      }
    }

    if (typeof refreshNotificationBadge === 'function') {
      refreshNotificationBadge();
    }

    showToast('Tela atualizada', 'success');
  } catch (error) {
    console.error('Erro ao atualizar a tela', error);
    showToast('Falha ao atualizar a tela', 'error');
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.style.opacity = '';
    }
  }
}

function addOrcLine() {
  const container = document.getElementById('orc-modal-lines');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', `<div class="budget-line"><input placeholder="Serviço / Material"><input value="1" style="width:100%;text-align:center" oninput="calcLine(this)"><input value="R$ 0,00" placeholder="R$ 0,00" inputmode="decimal" oninput="formatarMoedaInput(this); calcLine(this)" onblur="formatarMoedaInput(this); calcLine(this)"><span class="line-total" style="text-align:right;font-weight:600;color:var(--petrol-light)">R$ 0,00</span><button onclick="this.parentElement.remove();calcTotals()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:15px"><i class="ti ti-x"></i></button></div>`);
}

function parseBudgetLineMoney(value) {
  if (typeof parseMoedaDigitada === 'function') return parseMoedaDigitada(value);
  const raw = String(value || '').trim();
  if (!raw) return 0;
  if (raw.includes(',') || raw.includes('.')) {
    return parseFloat(raw.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }
  const digits = raw.replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
}

function calcLine(input) {
  const line = input.closest('.budget-line');
  const fields = line.querySelectorAll('input');
  const quantity = parseFloat(fields[1].value) || 0;
  if (typeof formatarMoedaInput === 'function') {
    formatarMoedaInput(fields[2]);
  }
  const unit = parseBudgetLineMoney(fields[2].value);
  line.querySelector('.line-total').textContent = Number(quantity * unit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  calcTotals();
}

function calcTotals() {
  let subtotal = 0;

  document.querySelectorAll('#orc-modal-lines .budget-line').forEach((line) => {
    const inputs = line.querySelectorAll('input');
    const quantity = parseFloat(inputs[1].value) || 0;
    const unit = parseBudgetLineMoney(inputs[2].value);
    subtotal += quantity * unit;
  });

  const margin = (parseFloat(document.getElementById('modal-margem').value) || 0) / 100;
  const discount = parseFloat(document.getElementById('modal-desconto').value) || 0;
  const displacement = parseFloat(document.getElementById('modal-desloc').value) || 0;
  const profit = subtotal * margin;
  const total = subtotal + profit + displacement - discount;
  const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  document.getElementById('modal-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('modal-lucro').textContent = formatCurrency(profit);
  document.getElementById('modal-total').textContent = formatCurrency(total);
}

function switchLoginTab(tab, button) {
  const loginPage = document.getElementById('page-login');
  if (loginPage) {
    loginPage.classList.toggle('reset-mode', tab === 'reset');
  }

  document.querySelectorAll('.login-tab').forEach((item) => item.classList.remove('active'));

  if (button) {
    button.classList.add('active');
  } else {
    document.querySelectorAll('.login-tab').forEach((item, index) => {
      if (['login', 'register', 'recover'][index] === tab) {
        item.classList.add('active');
      }
    });
  }

  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('recover-form').style.display = tab === 'recover' ? 'block' : 'none';
  const resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.style.display = tab === 'reset' ? 'block' : 'none';
  }
}

function goToApp(nome, cargo = 'operador') {
  if (typeof setCurrentUserContext === 'function') {
    setCurrentUserContext(nome, cargo);
  }

  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-app').classList.add('active');
  if (typeof applyRolePermissions === 'function') applyRolePermissions();
  buildDashChart();
  Promise.resolve(typeof loadAllData === 'function' ? loadAllData() : null)
    .then(async () => {
      await syncEquipesFromSupabase({ silent: true });
      await syncFornecedoresFromSupabase({ silent: true });
      await syncEstoqueFromSupabaseByEvents({ silent: true });
    })
    .then(() => {
      updateFornecedoresSummary();
      populateFornecedorDatalist();
      if (window._currentView === 'fornecedores') {
        populateFornecedores();
      }
    })
    .catch(() => {
      equipesLastSyncSource = 'local';
      estoqueLastSyncSource = 'local';
      fornecedoresLastSyncSource = 'local';
    });
  setTimeout(() => {
    const saudacao = nome ? `Bem-vindo, ${nome.split(' ')[0]}!` : 'Bem-vindo ao REIS FLOW!';
    showToast(saudacao, 'success');
  }, 300);
}

function goToLogin() {
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
}

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.classList.remove('open');
    });
  });

  if (typeof applyRolePermissions === 'function') applyRolePermissions();
  refreshNotificationBadge();

  loadFinFiltersFromSession();
  syncFinFiltersUI();

  await loadEquipesFromStorage({ preferSupabase: true, silent: true });
  loadEquipesFiltersFromSession();
  syncEquipesFiltersUI();
  resetNovoMembroModal();

  if (typeof refreshUsuariosSistemaData === 'function') {
    await refreshUsuariosSistemaData();
  }

  const estoqueSynced = await syncEstoqueFromSupabaseByEvents({ silent: true });
  if (!estoqueSynced) {
    loadEstoqueFromStorage();
  }
  loadEstoqueFiltersFromSession();
  syncEstoqueFiltersUI();
  await loadFornecedoresFromStorage({ preferSupabase: true, silent: true });
  loadFornecedoresFiltersFromSession();
  syncFornecedoresFiltersUI();
  updateFornecedoresSummary();
  populateFornecedores();
  populateFornecedorDatalist();
  resetNovoFornecedorModal();
  populateEstoqueMaterialOptions();
  resetEntradaEstoqueModal();
  updateEstoqueSummary();
  renderEstoqueDraftList();
  atualizarBotaoDraftEstoque();
  updateDashboardOperationalStats();

  calcTotals();

  setTimeout(() => {
    document.querySelectorAll('.progress-fill').forEach((progress) => {
      const width = progress.style.width;
      progress.style.width = '0';
      setTimeout(() => {
        progress.style.width = width;
      }, 100);
    });
  }, 200);
});
