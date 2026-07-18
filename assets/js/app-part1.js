const obras = [];

const orcamentos = [];

const clientes = [];

const orcPreviewItems = [
  {desc:'Cabeamento elétrico 2,5mm — 200m',qtd:200,unit:'R$ 2,40',total:'R$ 480'},
  {desc:'Quadro distribuição 24 disjuntores',qtd:2,unit:'R$ 380,00',total:'R$ 760'},
  {desc:'Instalação pontos tomadas (50un)',qtd:50,unit:'R$ 80,00',total:'R$ 4.000'},
  {desc:'Instalação luminárias LED',qtd:30,unit:'R$ 120,00',total:'R$ 3.600'},
  {desc:'Mão de obra — equipe 4 pessoas · 5 dias',qtd:1,unit:'R$ 12.800',total:'R$ 12.800'},
];

const ROLE_ACCESS = {
  admin: {
    label: 'Administrador',
    views: ['dashboard', 'obras', 'orcamentos', 'clientes', 'financeiro', 'equipes', 'estoque', 'configuracoes'],
    modals: ['modal-nova-obra', 'modal-novo-orc', 'modal-orc-detalhe', 'modal-novo-cliente', 'modal-lancamento', 'modal-novo-membro', 'modal-nova-entrada', 'modal-cliente-detalhe', 'modal-etapas-obra', 'modal-historico-obra', 'modal-equipe-detalhe']
  },
  gestor: {
    label: 'Gestor',
    views: ['dashboard', 'obras', 'orcamentos', 'clientes', 'financeiro', 'equipes', 'estoque', 'configuracoes'],
    modals: ['modal-nova-obra', 'modal-novo-orc', 'modal-orc-detalhe', 'modal-novo-cliente', 'modal-lancamento', 'modal-novo-membro', 'modal-nova-entrada', 'modal-cliente-detalhe', 'modal-etapas-obra', 'modal-historico-obra', 'modal-equipe-detalhe']
  },
  financeiro: {
    label: 'Financeiro',
    views: ['dashboard', 'financeiro'],
    modals: ['modal-lancamento']
  },
  tecnico: {
    label: 'Técnico',
    views: ['dashboard', 'obras', 'estoque'],
    modals: ['modal-nova-entrada', 'modal-etapas-obra', 'modal-historico-obra']
  },
  operador: {
    label: 'Operador',
    views: ['dashboard', 'obras', 'orcamentos', 'clientes', 'financeiro', 'equipes', 'estoque', 'configuracoes'],
    modals: ['modal-nova-obra', 'modal-novo-orc', 'modal-orc-detalhe', 'modal-novo-cliente', 'modal-cliente-detalhe', 'modal-etapas-obra', 'modal-historico-obra', 'modal-lancamento', 'modal-equipe-detalhe']
  }
};

window._currentView = window._currentView || 'dashboard';
window._currentObraCode = window._currentObraCode || null;

function normalizeRole(role) {
  const value = String(role || 'operador').toLowerCase();
  return ROLE_ACCESS[value] ? value : 'operador';
}

function getCurrentRole() {
  return normalizeRole(sessionStorage.getItem('reisflow_role'));
}

function getCurrentUserName() {
  return sessionStorage.getItem('reisflow_user_name') || '';
}

function setCurrentUserContext(nome, cargo) {
  sessionStorage.setItem('reisflow_user_name', nome || '');
  sessionStorage.setItem('reisflow_role', normalizeRole(cargo));
}

function canAccessView(view) {
  const role = getCurrentRole();
  return ROLE_ACCESS[role].views.includes(view);
}

function canAccessModal(id) {
  const role = getCurrentRole();
  return ROLE_ACCESS[role].modals.includes(id);
}

function applyRolePermissions() {
  const role = getCurrentRole();
  const access = ROLE_ACCESS[role];
  const allowedViews = new Set(access.views);

  document.querySelectorAll('.nav-item').forEach((item) => {
    const handler = item.getAttribute('onclick') || '';
    const match = handler.match(/navigate\('([^']+)'/);
    if (!match) return;

    const view = match[1];
    item.style.display = allowedViews.has(view) ? '' : 'none';
  });

  document.querySelectorAll('.user-role').forEach((el) => {
    el.textContent = access.label;
  });

  const userCardName = document.querySelector('.user-card .user-name');
  if (userCardName && getCurrentUserName()) {
    userCardName.textContent = getCurrentUserName();
  }

  const avatar = document.querySelector('.user-card .avatar');
  if (avatar && getCurrentUserName()) {
    const initials = getCurrentUserName()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
    avatar.textContent = initials || avatar.textContent;
  }

  document.querySelectorAll('button[onclick]').forEach((button) => {
    const handler = button.getAttribute('onclick') || '';
    const modalMatch = handler.match(/openModal\('([^']+)'/);

    if (handler.includes('openQuickCreate()')) {
      button.style.display = canAccessModal('modal-nova-obra') ? '' : 'none';
      return;
    }

    if (modalMatch) {
      button.style.display = canAccessModal(modalMatch[1]) ? '' : 'none';
    }
  });
}

function applyObraDetailAccess() {
  const role = getCurrentRole();
  const canSeeFinance = ['admin', 'gestor', 'financeiro'].includes(role);
  const canSeeOps = ['admin', 'gestor', 'tecnico', 'operador'].includes(role);

  const cards = document.querySelectorAll('#view-obra-detail .card');
  cards.forEach((card) => {
    const title = card.querySelector('.section-hdr h3');
    const titleText = title ? title.textContent.trim().toLowerCase() : '';

    if (titleText.includes('financeiro da obra')) {
      card.style.display = canSeeFinance ? '' : 'none';
    }

    if (titleText.includes('etapas da obra') || titleText.includes('histórico') || titleText.includes('galeria de fotos')) {
      card.style.display = canSeeOps ? '' : 'none';
    }
  });

  document.querySelectorAll('#view-obra-detail .detail-header .btn').forEach((button) => {
    const text = button.textContent.trim().toLowerCase();
    if (text.includes('editar')) {
      button.style.display = canSeeOps ? '' : 'none';
    }
    if (text.includes('relatório')) {
      button.style.display = ['admin', 'gestor'].includes(role) ? '' : 'none';
    }
  });
}

function showAccessDenied(view) {
  showToast(`Acesso restrito para este perfil em ${view || 'esta área'}.`, 'warning');
}

function statusBadge(status) {
  const map = {
    andamento:'<span class="badge badge-info"><span class="badge-dot"></span>Em andamento</span>',
    atrasada:'<span class="badge badge-danger"><span class="badge-dot"></span>Atrasada</span>',
    concluida:'<span class="badge badge-success"><span class="badge-dot"></span>Concluída</span>',
    orcamento:'<span class="badge badge-warning"><span class="badge-dot"></span>Orçamento</span>',
    aprovada:'<span class="badge badge-purple">Aprovada</span>',
    pausada:'<span class="badge badge-neutral"><span class="badge-dot"></span>Pausada</span>',
    pendente:'<span class="badge badge-warning"><span class="badge-dot"></span>Pendente</span>',
    aprovado:'<span class="badge badge-success"><span class="badge-dot"></span>Aprovado</span>',
    reprovado:'<span class="badge badge-danger"><span class="badge-dot"></span>Reprovado</span>',
    expirado:'<span class="badge badge-neutral"><span class="badge-dot"></span>Expirado</span>',
    ativo:'<span class="badge badge-success"><span class="badge-dot"></span>Ativo</span>',
    inativo:'<span class="badge badge-neutral"><span class="badge-dot"></span>Inativo</span>',
    vencido:'<span class="badge badge-danger"><span class="badge-dot"></span>Vencido</span>',
    futuro:'<span class="badge badge-neutral"><span class="badge-dot"></span>Futuro</span>',
    recebido:'<span class="badge badge-success"><span class="badge-dot"></span>Recebido</span>',
    pago:'<span class="badge badge-success"><span class="badge-dot"></span>Pago</span>',
    campo:'<span class="badge badge-info"><span class="badge-dot"></span>Em campo</span>',
    disponivel:'<span class="badge badge-success"><span class="badge-dot"></span>Disponível</span>',
    afastado:'<span class="badge badge-warning"><span class="badge-dot"></span>Afastado</span>'
  };

  return map[status] || `<span class="badge badge-neutral">${status}</span>`;
}

const OBRA_PROGRESS_RULE = {
  etapas: 0.7,
  prazo: 0.2,
  marcos: 0.1
};

const OBRA_ETAPAS_STORAGE_KEY = 'reisflow_obra_etapas';
const OBRA_HISTORY_STORAGE_KEY = 'reisflow_obra_history';
const OBRA_ETAPAS_DEFAULT_LIMIT = 5;
const OBRA_HISTORY_DEFAULT_LIMIT = 3;
window._obraHistoryFilters = window._obraHistoryFilters || {
  type: 'todos',
  period: 'todos',
  search: ''
};
const DEFAULT_OBRA_ETAPAS = [
  { id: 'etapa-1', titulo: 'Levantamento e vistoria', done: true },
  { id: 'etapa-2', titulo: 'Projeto aprovado pelo cliente', done: true },
  { id: 'etapa-3', titulo: 'Demolição área interna', done: true },
  { id: 'etapa-4', titulo: 'Elétrica — fase 1 (70% concluído)', done: false },
  { id: 'etapa-5', titulo: 'Hidráulica e instalações', done: false },
  { id: 'etapa-6', titulo: 'Acabamento e pintura', done: false },
  { id: 'etapa-7', titulo: 'Vistoria final e entrega', done: false }
];

const DEFAULT_OBRA_HISTORY = [
  {
    id: 'seed-h-1',
    type: 'foto_upload',
    title: 'Fotos enviadas — fase elétrica',
    desc: 'Registro inicial de acompanhamento da obra.',
    dateIso: new Date().toISOString()
  },
  {
    id: 'seed-h-2',
    type: 'etapa_concluida',
    title: 'Etapa demolição concluída',
    desc: 'Atualização inicial do cronograma.',
    dateIso: new Date(Date.now() - 86400000).toISOString()
  }
];

function readObraEtapasStore() {
  try {
    const raw = localStorage.getItem(OBRA_ETAPAS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveObraEtapasStore(store) {
  localStorage.setItem(OBRA_ETAPAS_STORAGE_KEY, JSON.stringify(store || {}));
}

function readObraHistoryStore() {
  try {
    const raw = localStorage.getItem(OBRA_HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveObraHistoryStore(store) {
  localStorage.setItem(OBRA_HISTORY_STORAGE_KEY, JSON.stringify(store || {}));
}

async function getCurrentAuthUserId() {
  if (!window.db?.auth) return null;
  try {
    const { data } = await db.auth.getSession();
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}

function getCurrentActorName() {
  const nome = typeof getCurrentUserName === 'function' ? String(getCurrentUserName() || '').trim() : '';
  return nome || 'Usuario do sistema';
}

function findObraByCode(code) {
  const key = String(code || '').trim();
  return (Array.isArray(obras) ? obras : []).find((obra) => String(obra.code || '') === key) || null;
}

function getObraIdByCode(code) {
  return findObraByCode(code)?.id || null;
}

function canSyncObraWithDb(code) {
  return Boolean(window.db && getObraIdByCode(code));
}

async function persistObraEtapasToDb(code, etapas) {
  if (!canSyncObraWithDb(code)) return;
  const obraId = getObraIdByCode(code);
  if (!obraId) return;

  try {
    await db.from('obra_etapas').delete().eq('obra_id', obraId);
    const payload = normalizeEtapaList(etapas).map((etapa, index) => ({
      obra_id: obraId,
      titulo: etapa.titulo,
      status: etapa.done ? 'concluida' : 'pendente',
      ordem: index + 1
    }));
    if (payload.length > 0) {
      await db.from('obra_etapas').insert(payload);
    }
  } catch {
    // Mantem fallback local quando banco indisponivel.
  }
}

async function syncObraEtapasFromDb(code) {
  if (!canSyncObraWithDb(code)) return;
  const obraId = getObraIdByCode(code);
  if (!obraId) return;

  try {
    const { data, error } = await db
      .from('obra_etapas')
      .select('id, titulo, status, ordem')
      .eq('obra_id', obraId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return;

    if (Array.isArray(data) && data.length > 0) {
      const normalized = data.map((item, index) => ({
        id: String(item.id || `etapa-db-${index}`),
        titulo: String(item.titulo || '').trim(),
        done: String(item.status || 'pendente').toLowerCase() === 'concluida'
      })).filter((item) => item.titulo);

      if (normalized.length > 0) {
        const store = readObraEtapasStore();
        store[String(code || '').trim()] = normalized;
        saveObraEtapasStore(store);
      }
    } else {
      // Primeira sincronizacao: sobe o estado local atual para o banco.
      persistObraEtapasToDb(code, getObraEtapas(code));
    }
  } catch {
    // Mantem fallback local quando banco indisponivel.
  }
}

async function persistObraHistoryEventToDb(code, event) {
  if (!canSyncObraWithDb(code)) return;
  const obraId = getObraIdByCode(code);
  if (!obraId) return;

  try {
    const autorId = await getCurrentAuthUserId();
    await db.from('obra_historico').insert({
      obra_id: obraId,
      tipo: String(event?.type || 'info'),
      titulo: String(event?.title || 'Atualização da obra').trim(),
      descricao: String(event?.desc || '').trim(),
      metadata: event?.metadata && typeof event.metadata === 'object' ? event.metadata : {},
      autor_id: autorId
    });
  } catch {
    // Mantem fallback local quando banco indisponivel.
  }
}

async function persistObraHistorySnapshotToDb(code, events) {
  if (!canSyncObraWithDb(code)) return;
  const obraId = getObraIdByCode(code);
  if (!obraId) return;

  try {
    const autorId = await getCurrentAuthUserId();
    await db.from('obra_historico').delete().eq('obra_id', obraId);
    const payload = normalizeHistoryList(events).map((event) => ({
      obra_id: obraId,
      tipo: event.type,
      titulo: event.title,
      descricao: event.desc,
      metadata: event.metadata && typeof event.metadata === 'object' ? event.metadata : {},
      autor_id: event.authorId || autorId
    }));
    if (payload.length > 0) {
      await db.from('obra_historico').insert(payload);
    }
  } catch {
    // Mantem fallback local quando banco indisponivel.
  }
}

async function syncObraHistoryFromDb(code) {
  if (!canSyncObraWithDb(code)) return;
  const obraId = getObraIdByCode(code);
  if (!obraId) return;

  try {
    const { data, error } = await db
      .from('obra_historico')
      .select('id, tipo, titulo, descricao, metadata, autor_id, created_at')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });

    if (error) return;

    if (Array.isArray(data) && data.length > 0) {
      const normalized = data.map((item, index) => ({
        id: String(item.id || `hist-db-${index}`),
        type: String(item.tipo || 'info'),
        title: String(item.titulo || 'Atualização da obra').trim(),
        desc: String(item.descricao || '').trim(),
        dateIso: String(item.created_at || new Date().toISOString()),
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
        authorId: String(item.autor_id || '').trim() || null,
        actorName: String(item.metadata?.actor_name || '').trim() || ''
      })).filter((item) => item.title);

      const store = readObraHistoryStore();
      store[String(code || '').trim()] = normalized;
      saveObraHistoryStore(store);
    } else {
      // Primeira sincronizacao: sobe o historico local atual para o banco.
      persistObraHistorySnapshotToDb(code, getObraHistory(code));
    }
  } catch {
    // Mantem fallback local quando banco indisponivel.
  }
}

async function syncObraDetailFromDb(code) {
  await Promise.all([
    syncObraEtapasFromDb(code),
    syncObraHistoryFromDb(code)
  ]);

  if (window._currentObraCode === String(code || '').trim()) {
    renderObraEtapasChecklist(code);
    renderObraHistoryTimeline(code);
    refreshObraProgressFromChecklist();
    renderObraHistoryModalContent(code);
  }
}

function normalizeHistoryList(events) {
  return (Array.isArray(events) ? events : [])
    .map((event, index) => ({
      id: String(event?.id || `hist-${Date.now()}-${index}`),
      type: String(event?.type || 'info'),
      title: String(event?.title || 'Atualização da obra').trim(),
      desc: String(event?.desc || '').trim(),
      dateIso: String(event?.dateIso || new Date().toISOString()),
      metadata: event?.metadata && typeof event.metadata === 'object' ? event.metadata : {},
      authorId: String(event?.authorId || '').trim() || null,
      actorName: String(event?.actorName || event?.metadata?.actor_name || '').trim() || ''
    }))
    .filter((event) => event.title)
    .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
}

function getObraHistory(code) {
  const key = String(code || '').trim();
  if (!key) return [];

  const store = readObraHistoryStore();
  const fromStore = normalizeHistoryList(store[key]);
  if (fromStore.length > 0) return fromStore;

  const seeded = DEFAULT_OBRA_HISTORY.map((item) => ({
    ...item,
    id: `${item.id}-${key}`
  }));
  store[key] = seeded;
  saveObraHistoryStore(store);
  return seeded;
}

function setObraHistory(code, historyEvents) {
  const key = String(code || '').trim();
  if (!key) return;

  const store = readObraHistoryStore();
  const normalized = normalizeHistoryList(historyEvents);
  store[key] = normalized;
  saveObraHistoryStore(store);
  persistObraHistorySnapshotToDb(key, normalized);
}

function addObraHistoryEvent(code, event) {
  const key = String(code || '').trim();
  if (!key) return;

  const actorName = String(event?.actorName || getCurrentActorName()).trim();
  const metadataBase = event?.metadata && typeof event.metadata === 'object' ? { ...event.metadata } : {};
  if (!metadataBase.actor_name) metadataBase.actor_name = actorName;

  const history = getObraHistory(key);
  history.unshift({
    id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: String(event?.type || 'info'),
    title: String(event?.title || 'Atualização da obra').trim(),
    desc: String(event?.desc || '').trim(),
    dateIso: new Date().toISOString(),
    metadata: metadataBase,
    authorId: null,
    actorName
  });

  const recentEvent = history[0];
  persistObraHistoryEventToDb(key, recentEvent);

  const store = readObraHistoryStore();
  store[key] = normalizeHistoryList(history.slice(0, 100));
  saveObraHistoryStore(store);

  if (window._currentObraCode === key) {
    renderObraHistoryTimeline(key);
    renderObraHistoryModalContent(key);
  }
}

function formatHistoryDate(dateIso) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return 'Agora';

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  if (isToday) return `Hoje, ${hh}:${mm}`;
  return `${d.toLocaleDateString('pt-BR')}, ${hh}:${mm}`;
}

function formatHistoryDescription(event) {
  const base = String(event?.desc || '').trim() || 'Atualização registrada no histórico.';
  const actor = String(event?.actorName || event?.metadata?.actor_name || '').trim();
  if (!actor) return base;
  return `${base} · por ${actor}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stringifyAuditValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function formatHistoryMetadataDetails(event) {
  const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : null;
  if (!metadata) return '';

  const before = metadata.before && typeof metadata.before === 'object' ? metadata.before : null;
  const after = metadata.after && typeof metadata.after === 'object' ? metadata.after : null;
  const changed = Array.isArray(metadata.changed_fields) ? metadata.changed_fields : [];

  if (!before && !after && changed.length === 0) return '';

  const keys = Array.from(new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {})
  ]));

  const title = changed.length > 0
    ? `Campos: ${escapeHtml(changed.join(', '))}`
    : 'Detalhes da alteração';

  if (keys.length === 0) {
    return `<div class="tl-audit"><div class="tl-audit-head"><span class="tl-audit-chip">Auditoria</span></div><div class="tl-audit-title">${title}</div></div>`;
  }

  const rows = keys.map((key) => {
    const beforeVal = escapeHtml(stringifyAuditValue(before?.[key]));
    const afterVal = escapeHtml(stringifyAuditValue(after?.[key]));
    const label = escapeHtml(String(key).replace(/_/g, ' '));
    return `<div class="tl-audit-row"><span>${label}</span><span>${beforeVal} -> ${afterVal}</span></div>`;
  }).join('');

  return `<div class="tl-audit"><div class="tl-audit-head"><span class="tl-audit-chip">Auditoria</span></div><div class="tl-audit-title">${title}</div>${rows}</div>`;
}

function hasAuditMetadata(event) {
  const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : null;
  if (!metadata) return false;
  const before = metadata.before && typeof metadata.before === 'object' ? metadata.before : null;
  const after = metadata.after && typeof metadata.after === 'object' ? metadata.after : null;
  const changed = Array.isArray(metadata.changed_fields) ? metadata.changed_fields : [];
  return Boolean(before || after || changed.length > 0);
}

function getHistoryVisual(type) {
  const map = {
    etapa_concluida: { icon: 'ti-check', bg: 'var(--green-bg)', color: 'var(--green)' },
    etapa_reaberta: { icon: 'ti-rotate-clockwise-2', bg: 'var(--orange-bg)', color: 'var(--orange)' },
    etapa_adicionada: { icon: 'ti-plus', bg: 'var(--blue-bg)', color: 'var(--petrol-light)' },
    etapa_excluida: { icon: 'ti-trash', bg: 'var(--red-bg)', color: 'var(--red)' },
    etapa_editada: { icon: 'ti-edit', bg: 'var(--blue-bg)', color: 'var(--petrol-light)' },
    obra_editada: { icon: 'ti-pencil', bg: 'rgba(167,110,246,0.14)', color: '#A76EF6' },
    foto_upload: { icon: 'ti-camera', bg: 'var(--blue-bg)', color: 'var(--petrol-light)' },
    info: { icon: 'ti-info-circle', bg: 'var(--blue-bg)', color: 'var(--petrol-light)' }
  };

  return map[String(type || '').toLowerCase()] || map.info;
}

function renderObraHistoryTimeline(code) {
  const container = document.getElementById('obra-history-timeline');
  const toggleBtn = document.getElementById('obra-history-toggle-btn');
  const meta = document.getElementById('obra-history-meta');
  if (!container) return;

  const history = getObraHistory(code);
  const total = history.length;
  const visibleEvents = history.slice(0, OBRA_HISTORY_DEFAULT_LIMIT);

  if (history.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:12px">Sem histórico registrado para esta obra.</div>';
    if (toggleBtn) toggleBtn.style.display = 'none';
    if (meta) meta.textContent = '';
    return;
  }

  container.innerHTML = visibleEvents.map((event) => {
    const visual = getHistoryVisual(event.type);
    return `<div class="timeline-item">
      <div class="tl-dot" style="background:${visual.bg};color:${visual.color}"><i class="ti ${visual.icon}" style="font-size:12px"></i></div>
      <div class="tl-line"></div>
      <div class="tl-content"><div class="tl-title">${event.title}</div><div class="tl-desc">${formatHistoryDescription(event)}</div><div class="tl-date">${formatHistoryDate(event.dateIso)}</div></div>
    </div>`;
  }).join('');

  if (toggleBtn) {
    if (total > OBRA_HISTORY_DEFAULT_LIMIT) {
      toggleBtn.style.display = '';
      toggleBtn.textContent = 'Ver completo';
    } else {
      toggleBtn.style.display = 'none';
    }
  }

  if (meta) {
    if (total <= OBRA_HISTORY_DEFAULT_LIMIT) {
      meta.textContent = `${total} registro(s) no histórico.`;
    } else {
      meta.textContent = `Mostrando ${OBRA_HISTORY_DEFAULT_LIMIT} de ${total} registros.`;
    }
  }
}

function getFilteredObraHistory(history, filters) {
  const type = String(filters?.type || 'todos');
  const period = String(filters?.period || 'todos');
  const search = normalizeFilterValue(filters?.search || '');

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  return (Array.isArray(history) ? history : []).filter((event) => {
    if (type !== 'todos' && String(event.type || '') !== type) return false;

    if (period !== 'todos') {
      const eventDate = new Date(event.dateIso);
      if (Number.isNaN(eventDate.getTime())) return false;

      if (period === 'hoje') {
        const startToday = new Date();
        startToday.setHours(0, 0, 0, 0);
        if (eventDate < startToday || eventDate > now) return false;
      }

      if (period === '7d') {
        const start = new Date(now.getTime() - (7 * 86400000));
        if (eventDate < start) return false;
      }

      if (period === '30d') {
        const start = new Date(now.getTime() - (30 * 86400000));
        if (eventDate < start) return false;
      }
    }

    if (!search) return true;
    const text = normalizeFilterValue(`${event.title || ''} ${event.desc || ''}`);
    return text.includes(search);
  });
}

function renderObraHistoryModalContent(obraCode) {
  const code = String(obraCode || '').trim();
  const container = document.getElementById('obra-history-full-timeline');
  const meta = document.getElementById('obra-history-full-meta');
  if (!container) return;

  const history = getObraHistory(code);
  const filtered = getFilteredObraHistory(history, window._obraHistoryFilters);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:12px">Nenhum evento encontrado com os filtros atuais.</div>';
  } else {
    container.innerHTML = filtered.map((event) => {
      const visual = getHistoryVisual(event.type);
      const metadataDetails = formatHistoryMetadataDetails(event);
      return `<div class="timeline-item">
        <div class="tl-dot" style="background:${visual.bg};color:${visual.color}"><i class="ti ${visual.icon}" style="font-size:12px"></i></div>
        <div class="tl-line"></div>
        <div class="tl-content"><div class="tl-title">${event.title}</div><div class="tl-desc">${formatHistoryDescription(event)}</div>${metadataDetails}<div class="tl-date">${formatHistoryDate(event.dateIso)}</div></div>
      </div>`;
    }).join('');
  }

  if (meta) {
    const auditCount = filtered.filter((event) => hasAuditMetadata(event)).length;
    meta.textContent = `${filtered.length} de ${history.length} registro(s) exibidos. ${auditCount} com auditoria detalhada.`;
  }
}

function onObraHistoryFilterChange() {
  window._obraHistoryFilters = {
    type: document.getElementById('obra-history-filter-type')?.value || 'todos',
    period: document.getElementById('obra-history-filter-period')?.value || 'todos',
    search: document.getElementById('obra-history-filter-search')?.value || ''
  };

  if (window._currentObraCode) {
    renderObraHistoryModalContent(window._currentObraCode);
  }
}

function openObraHistoryModal() {
  const obraCode = String(window._currentObraCode || '').trim();
  if (!obraCode) return;

  const codeEl = document.getElementById('obra-history-modal-code');
  const typeEl = document.getElementById('obra-history-filter-type');
  const periodEl = document.getElementById('obra-history-filter-period');
  const searchEl = document.getElementById('obra-history-filter-search');

  if (codeEl) codeEl.textContent = obraCode;

  window._obraHistoryFilters = { type: 'todos', period: 'todos', search: '' };
  if (typeEl) typeEl.value = 'todos';
  if (periodEl) periodEl.value = 'todos';
  if (searchEl) searchEl.value = '';

  renderObraHistoryModalContent(obraCode);

  openModal('modal-historico-obra');
}

function registrarUploadFotoObra() {
  const obraCode = String(window._currentObraCode || '').trim();
  if (!obraCode) {
    showToast('Abra uma obra para registrar fotos.', 'warning');
    return;
  }

  addObraHistoryEvent(obraCode, {
    type: 'foto_upload',
    title: 'Foto adicionada na galeria',
    desc: `Registro manual de foto na obra ${obraCode}.`,
    metadata: {
      after: {
        origem: 'registro_manual',
        obra_codigo: obraCode
      }
    }
  });

  showToast('Upload de foto registrado no histórico.', 'success');
}

function normalizeEtapaList(etapas) {
  return (Array.isArray(etapas) ? etapas : [])
    .map((etapa, index) => ({
      id: String(etapa?.id || `etapa-${Date.now()}-${index}`),
      titulo: String(etapa?.titulo || '').trim(),
      done: Boolean(etapa?.done)
    }))
    .filter((etapa) => etapa.titulo);
}

function getObraEtapas(code) {
  const key = String(code || '').trim();
  if (!key) return [];

  const store = readObraEtapasStore();
  const fromStore = normalizeEtapaList(store[key]);

  if (fromStore.length > 0) {
    return fromStore;
  }

  const seeded = DEFAULT_OBRA_ETAPAS.map((item) => ({ ...item }));
  store[key] = seeded;
  saveObraEtapasStore(store);
  return seeded;
}

function setObraEtapas(code, etapas) {
  const key = String(code || '').trim();
  if (!key) return;

  const sanitized = normalizeEtapaList(etapas);
  const store = readObraEtapasStore();
  store[key] = sanitized;
  saveObraEtapasStore(store);
  persistObraEtapasToDb(key, sanitized);
}

function renderObraEtapasChecklist(code) {
  const container = document.getElementById('obra-etapas-checklist');
  const meta = document.getElementById('obra-etapas-meta');
  if (!container) return;

  const etapas = getObraEtapas(code);
  const total = etapas.length;
  const visibleEtapas = etapas.slice(0, OBRA_ETAPAS_DEFAULT_LIMIT);

  if (etapas.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:12px">Sem etapas cadastradas para esta obra.</div>';
    if (meta) meta.textContent = '';
    return;
  }

  container.innerHTML = visibleEtapas.map((etapa) => {
    const doneClass = etapa.done ? ' done' : '';
    const idSafe = String(etapa.id || '').replace(/'/g, '&#39;');
    return `<div class="check-item${doneClass}" onclick="toggleObraEtapaStatus('${idSafe}')"><div class="check-box"></div><span class="check-label">${etapa.titulo}</span></div>`;
  }).join('');

  if (meta) {
    if (total <= OBRA_ETAPAS_DEFAULT_LIMIT) {
      meta.textContent = `${total} etapa(s) cadastrada(s).`;
    } else {
      meta.textContent = `Mostrando ${OBRA_ETAPAS_DEFAULT_LIMIT} de ${total} etapas. Clique em "Ver completo" para visualizar e editar tudo.`;
    }
  }
}

function toggleObraEtapaStatus(etapaId) {
  const obraCode = String(window._currentObraCode || '').trim();
  if (!obraCode) return;

  const etapas = getObraEtapas(obraCode);
  const idx = etapas.findIndex((etapa) => String(etapa.id) === String(etapaId || ''));
  if (idx < 0) return;

  const etapaAtual = etapas[idx];
  const novoDone = !etapaAtual.done;
  etapas[idx] = { ...etapas[idx], done: novoDone };
  setObraEtapas(obraCode, etapas);
  addObraHistoryEvent(obraCode, {
    type: novoDone ? 'etapa_concluida' : 'etapa_reaberta',
    title: novoDone ? 'Etapa concluída' : 'Etapa reaberta',
    desc: etapaAtual.titulo,
    metadata: {
      before: { status: etapaAtual.done ? 'concluida' : 'pendente' },
      after: { status: novoDone ? 'concluida' : 'pendente' },
      changed_fields: ['status']
    }
  });
  renderObraEtapasChecklist(obraCode);
  refreshObraProgressFromChecklist();
}

function openEtapasEditor() {
  const obraCode = String(window._currentObraCode || '').trim();
  if (!obraCode) {
    showToast('Abra uma obra para gerenciar etapas.', 'warning');
    return;
  }

  const hiddenCode = document.getElementById('etapas-editor-obra-code');
  if (hiddenCode) hiddenCode.value = obraCode;

  renderEtapasEditor(obraCode);
  openModal('modal-etapas-obra');
}

function renderEtapasEditor(obraCode) {
  const container = document.getElementById('etapas-editor-list');
  if (!container) return;

  const etapas = getObraEtapas(obraCode);
  if (etapas.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:12px">Sem etapas cadastradas. Clique em "Adicionar etapa".</div>';
    return;
  }

  container.innerHTML = etapas.map((etapa) => {
    const idSafe = String(etapa.id || '').replace(/'/g, '&#39;');
    const titleSafe = String(etapa.titulo || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return `<div class="field-row etapa-editor-row" style="grid-template-columns:120px 1fr" data-etapa-id="${idSafe}" draggable="true">
      <div class="field">
        <label style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span>Status</span><span class="etapa-drag-handle" title="Arrastar para reordenar" style="cursor:grab;color:var(--text-muted)"><i class="ti ti-grip-vertical"></i></span></label>
        <select class="etapa-editor-status">
          <option value="pendente" ${etapa.done ? '' : 'selected'}>Pendente</option>
          <option value="concluida" ${etapa.done ? 'selected' : ''}>Concluída</option>
        </select>
      </div>
      <div class="field">
        <label>Etapa</label>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
          <input class="etapa-editor-title" value="${titleSafe}" placeholder="Nome da etapa">
          <button class="btn btn-ghost btn-xs" onclick="removeEtapaEditorRow(this)" type="button" title="Excluir etapa"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');

  setupEtapasEditorDnD();
}

function addEtapaEditorRow() {
  const container = document.getElementById('etapas-editor-list');
  if (!container) return;

  if (container.textContent.includes('Sem etapas cadastradas')) {
    container.innerHTML = '';
  }

  const row = document.createElement('div');
  row.className = 'field-row etapa-editor-row';
  row.style.gridTemplateColumns = '120px 1fr';
  row.setAttribute('data-etapa-id', `etapa-${Date.now()}`);
  row.setAttribute('draggable', 'true');
  row.innerHTML = `<div class="field">
      <label style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span>Status</span><span class="etapa-drag-handle" title="Arrastar para reordenar" style="cursor:grab;color:var(--text-muted)"><i class="ti ti-grip-vertical"></i></span></label>
      <select class="etapa-editor-status">
        <option value="pendente" selected>Pendente</option>
        <option value="concluida">Concluída</option>
      </select>
    </div>
    <div class="field">
      <label>Etapa</label>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
        <input class="etapa-editor-title" value="" placeholder="Nome da etapa">
        <button class="btn btn-ghost btn-xs" onclick="removeEtapaEditorRow(this)" type="button" title="Excluir etapa"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  container.appendChild(row);
  setupEtapasEditorDnD();
}

function setupEtapasEditorDnD() {
  const rows = document.querySelectorAll('#etapas-editor-list .etapa-editor-row');
  rows.forEach((row) => {
    row.addEventListener('dragstart', onEtapaDragStart);
    row.addEventListener('dragover', onEtapaDragOver);
    row.addEventListener('drop', onEtapaDrop);
    row.addEventListener('dragend', onEtapaDragEnd);
  });
}

function onEtapaDragStart(event) {
  const row = event.currentTarget;
  if (!row) return;
  row.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', row.getAttribute('data-etapa-id') || '');
}

function onEtapaDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onEtapaDrop(event) {
  event.preventDefault();
  const target = event.currentTarget;
  const container = document.getElementById('etapas-editor-list');
  const dragging = document.querySelector('#etapas-editor-list .etapa-editor-row.dragging');
  if (!target || !container || !dragging || target === dragging) return;

  const rect = target.getBoundingClientRect();
  const dropAfter = event.clientY > rect.top + (rect.height / 2);
  if (dropAfter) {
    container.insertBefore(dragging, target.nextElementSibling);
  } else {
    container.insertBefore(dragging, target);
  }
}

function onEtapaDragEnd() {
  document.querySelectorAll('#etapas-editor-list .etapa-editor-row.dragging').forEach((row) => {
    row.classList.remove('dragging');
  });
}

function removeEtapaEditorRow(button) {
  const row = button?.closest('.etapa-editor-row');
  if (!row) return;
  row.remove();
}

function applyEtapasEditor() {
  const obraCode = document.getElementById('etapas-editor-obra-code')?.value?.trim() || '';
  if (!obraCode) {
    showToast('Obra não identificada para salvar etapas.', 'warning');
    return;
  }

  const etapasAntes = getObraEtapas(obraCode);
  const rows = document.querySelectorAll('#etapas-editor-list .etapa-editor-row');
  const etapas = Array.from(rows).map((row, index) => {
    const etapaId = row.getAttribute('data-etapa-id') || `etapa-${Date.now()}-${index}`;
    const title = row.querySelector('.etapa-editor-title')?.value?.trim() || '';
    const status = row.querySelector('.etapa-editor-status')?.value || 'pendente';
    return {
      id: etapaId,
      titulo: title,
      done: status === 'concluida'
    };
  }).filter((etapa) => etapa.titulo);

  if (etapas.length === 0) {
    showToast('Cadastre ao menos uma etapa antes de salvar.', 'warning');
    return;
  }

  const beforeMap = new Map(etapasAntes.map((etapa) => [etapa.id, etapa]));
  const afterMap = new Map(etapas.map((etapa) => [etapa.id, etapa]));

  setObraEtapas(obraCode, etapas);

  etapas.forEach((etapa) => {
    const before = beforeMap.get(etapa.id);
    if (!before) {
      addObraHistoryEvent(obraCode, {
        type: 'etapa_adicionada',
        title: 'Etapa adicionada',
        desc: etapa.titulo,
        metadata: {
          after: {
            etapa_id: etapa.id,
            titulo: etapa.titulo,
            status: etapa.done ? 'concluida' : 'pendente'
          }
        }
      });
      return;
    }

    if (before.titulo !== etapa.titulo) {
      addObraHistoryEvent(obraCode, {
        type: 'etapa_editada',
        title: 'Etapa editada',
        desc: `${before.titulo} -> ${etapa.titulo}`,
        metadata: {
          before: { titulo: before.titulo },
          after: { titulo: etapa.titulo },
          changed_fields: ['titulo']
        }
      });
    }

    if (before.done !== etapa.done) {
      addObraHistoryEvent(obraCode, {
        type: etapa.done ? 'etapa_concluida' : 'etapa_reaberta',
        title: etapa.done ? 'Etapa concluída' : 'Etapa reaberta',
        desc: etapa.titulo,
        metadata: {
          before: { status: before.done ? 'concluida' : 'pendente' },
          after: { status: etapa.done ? 'concluida' : 'pendente' },
          changed_fields: ['status']
        }
      });
    }
  });

  etapasAntes.forEach((etapa) => {
    if (!afterMap.has(etapa.id)) {
      addObraHistoryEvent(obraCode, {
        type: 'etapa_excluida',
        title: 'Etapa excluída',
        desc: etapa.titulo,
        metadata: {
          before: {
            etapa_id: etapa.id,
            titulo: etapa.titulo,
            status: etapa.done ? 'concluida' : 'pendente'
          }
        }
      });
    }
  });

  renderObraEtapasChecklist(obraCode);
  refreshObraProgressFromChecklist();
  closeModal('modal-etapas-obra');
  showToast('Etapas atualizadas com sucesso!', 'success');
}

function parseDatePtBr(dateText) {
  const raw = String(dateText || '').trim();
  if (!raw || raw === '—') return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const dIso = new Date(`${raw}T00:00:00`);
    return Number.isNaN(dIso.getTime()) ? null : dIso;
  }

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getPrazoProgressScore(obra) {
  if (!obra) return 0;
  if (obra.status === 'concluida') return 100;

  const prazoDate = parseDatePtBr(obra.prazo);
  if (!prazoDate) return 50;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = prazoDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays >= 7) return 100;
  if (diffDays >= 0) return 70;
  return 20;
}

function getMarcoProgressScore(obra) {
  const map = {
    orcamento: 20,
    aprovada: 60,
    andamento: 80,
    pausada: 50,
    atrasada: 40,
    concluida: 100
  };

  return map[String(obra?.status || '').toLowerCase()] || 20;
}

function getEtapasProgressScore() {
  const etapaEls = document.querySelectorAll('#view-obra-detail .checklist .check-item');
  if (!etapaEls || etapaEls.length === 0) return 0;

  const done = Array.from(etapaEls).filter((el) => el.classList.contains('done')).length;
  return Math.round((done / etapaEls.length) * 100);
}

function updateObraProgressUI(obra) {
  const progressValue = document.getElementById('obra-progress-value');
  const progressFill = document.getElementById('obra-progress-fill');
  const progressMeta = document.getElementById('obra-progress-meta');
  if (!progressValue || !progressFill || !progressMeta) return;

  const etapasScore = getEtapasProgressScore();
  const prazoScore = getPrazoProgressScore(obra);
  const marcoScore = getMarcoProgressScore(obra);

  const total = Math.round(
    (etapasScore * OBRA_PROGRESS_RULE.etapas)
    + (prazoScore * OBRA_PROGRESS_RULE.prazo)
    + (marcoScore * OBRA_PROGRESS_RULE.marcos)
  );

  progressValue.textContent = `${total}%`;
  progressFill.style.width = `${total}%`;
  progressMeta.textContent = `Regra: etapas ${Math.round(OBRA_PROGRESS_RULE.etapas * 100)}% (${etapasScore}%) + prazo ${Math.round(OBRA_PROGRESS_RULE.prazo * 100)}% (${prazoScore}%) + marcos ${Math.round(OBRA_PROGRESS_RULE.marcos * 100)}% (${marcoScore}%).`;
}

function refreshObraProgressFromChecklist() {
  if (window._currentView !== 'obra-detail' || !window._currentObraCode) return;
  const obraAtual = (Array.isArray(obras) ? obras : []).find((item) => item.code === window._currentObraCode) || null;
  if (!obraAtual) return;
  updateObraProgressUI(obraAtual);
}

function setBreadcrumb(viewLabel) {
  document.getElementById('topbar-breadcrumb').innerHTML = `<span>REIS FLOW</span><span class="sep">/</span><span class="cur">${viewLabel}</span>`;
}

function navigate(view, element) {
  if (!canAccessView(view)) {
    showAccessDenied(view);
    return;
  }

  window._currentView = view;
  window._currentObraCode = null;

  document.querySelectorAll('.view').forEach((section) => {
    section.style.display = 'none';
  });

  const target = document.getElementById(`view-${view}`);
  if (target) {
    target.style.display = 'block';
    target.className = 'view fade-in';
  }

  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));

  if (element) {
    element.classList.add('active');
  } else {
    document.querySelectorAll('.nav-item').forEach((item) => {
      const handler = item.getAttribute('onclick') || '';
      if (handler.includes(`'${view}'`)) {
        item.classList.add('active');
      }
    });
  }

  const labels = {
    dashboard:'Dashboard',
    obras:'Obras',
    orcamentos:'Orçamentos',
    clientes:'Clientes',
    financeiro:'Financeiro',
    equipes:'Equipes',
    estoque:'Estoque',
    configuracoes:'Configurações'
  };

  setBreadcrumb(labels[view] || view);

  if (view === 'obras') populateObras();
  if (view === 'orcamentos') {
    populateOrc();
    populateOrcPreview();
  }
  if (view === 'clientes') populateClientes();
  if (view === 'financeiro') {
    populateFin();
    drawFluxo();
  }
  if (view === 'equipes') populateEquipes();
  if (view === 'estoque') populateEstoque();

  if (window.innerWidth <= 900 && typeof closeSidebar === 'function') closeSidebar();
}

function populateObraDetail(code) {
  const obra = obras.find((item) => item.code === code);
  if (!obra) return;

  document.getElementById('obra-detail-breadcrumb').textContent = obra.code;
  document.getElementById('obra-detail-code').textContent = obra.code;
  document.getElementById('obra-detail-name').textContent = obra.name;
  document.getElementById('obra-detail-client').textContent = `${obra.client} · ${obra.location}`;
  document.getElementById('obra-detail-resp').textContent = obra.resp;
  document.getElementById('obra-detail-prazo').textContent = obra.prazo;
  document.getElementById('obra-detail-valor').textContent = obra.valor;
  document.getElementById('obra-detail-status').innerHTML = statusBadge(obra.status);
  renderObraEtapasChecklist(code);
  renderObraHistoryTimeline(code);
  updateObraProgressUI(obra);
}

function openObraDetail(code) {
  if (!canAccessView('obras')) {
    showAccessDenied('obras');
    return;
  }

  window._currentView = 'obra-detail';
  window._currentObraCode = code;

  document.querySelectorAll('.view').forEach((section) => {
    section.style.display = 'none';
  });

  document.getElementById('view-obra-detail').style.display = 'block';
  document.getElementById('view-obra-detail').className = 'view fade-in';
  document.getElementById('topbar-breadcrumb').innerHTML = `<span>REIS FLOW</span><span class="sep">/</span><span onclick="navigate('obras',null)" style="cursor:pointer;color:var(--petrol-light)">Obras</span><span class="sep">/</span><span class="cur">${code}</span>`;
  populateObraDetail(code);
  applyObraDetailAccess();
  syncObraDetailFromDb(code);
}

function normalizeFilterValue(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapStatusFilterToKey(statusLabel) {
  const normalized = normalizeFilterValue(statusLabel);
  const map = {
    'em andamento': 'andamento',
    'orcamento': 'orcamento',
    'atrasada': 'atrasada',
    'finalizada': 'concluida'
  };
  return map[normalized] || '';
}

function inferObraPriority(obra) {
  const normalized = normalizeFilterValue(obra?.prioridade || '');
  if (['alta', 'media', 'baixa'].includes(normalized)) return normalized;

  if (obra?.status === 'atrasada' || obra?.status === 'pausada') return 'alta';
  if (obra?.status === 'andamento' || obra?.status === 'aprovada') return 'media';
  return 'baixa';
}

function getFilteredObras() {
  const searchValue = normalizeFilterValue(document.getElementById('obras-search')?.value || '');
  const statusKey = mapStatusFilterToKey(document.getElementById('obras-filter-status')?.value || '');
  const responsibleValue = normalizeFilterValue(document.getElementById('obras-filter-resp')?.value || '');
  const priorityValue = normalizeFilterValue(document.getElementById('obras-filter-prioridade')?.value || '');

  return obras.filter((obra) => {
    if (statusKey && obra.status !== statusKey) return false;

    if (responsibleValue && !responsibleValue.includes('todos') && normalizeFilterValue(obra.resp) !== responsibleValue) {
      return false;
    }

    if (priorityValue && priorityValue !== 'prioridade' && inferObraPriority(obra) !== priorityValue) {
      return false;
    }

    if (!searchValue) return true;

    const searchable = [obra.code, obra.name, obra.client, obra.resp, obra.location, obra.status]
      .map((value) => normalizeFilterValue(value))
      .join(' ');

    return searchable.includes(searchValue);
  });
}

function applyObrasFilters() {
  const tbody = document.getElementById('obras-tbody');
  if (tbody) tbody.innerHTML = '';
  const kanban = document.getElementById('obras-kanban');
  if (kanban) kanban.innerHTML = '';
  populateObras();
}

function clearObrasFilters() {
  const search = document.getElementById('obras-search');
  const status = document.getElementById('obras-filter-status');
  const resp = document.getElementById('obras-filter-resp');
  const prioridade = document.getElementById('obras-filter-prioridade');

  if (search) search.value = '';
  if (status) status.value = 'Todos os status';
  if (resp) resp.value = 'Todos os responsáveis';
  if (prioridade) prioridade.value = 'Prioridade';
  applyObrasFilters();
}

function populateObras() {
  const obrasFiltradas = getFilteredObras();
  const tbody = document.getElementById('obras-tbody');
  if (tbody && tbody.children.length === 0) {
    const canEditObra = canAccessView('obras');
    obrasFiltradas.forEach((obra) => {
      const editButton = canEditObra
        ? `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openObraEdit('${obra.code}')"><i class="ti ti-edit"></i></button>`
        : `<button class="btn btn-ghost btn-xs" disabled title="Sem permissão"><i class="ti ti-edit"></i></button>`;
      tbody.innerHTML += `<tr onclick="openObraDetail('${obra.code}')">
        <td class="mono">${obra.code}</td>
        <td><div class="bold">${obra.name}</div></td>
        <td class="muted">${obra.client}</td>
        <td><div style="display:flex;align-items:center;gap:6px"><div class="avatar-sm avatar" style="font-size:9px">${obra.resp.split(' ').map((part) => part[0]).join('')}</div>${obra.resp}</div></td>
        <td class="muted">${obra.prazo}</td>
        <td><span style="font-weight:600;color:var(--petrol-light)">${obra.valor}</span></td>
        <td>${statusBadge(obra.status)}</td>
        <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openObraDetail('${obra.code}')"><i class="ti ti-eye"></i></button>${editButton}</div></td>
      </tr>`;
    });
  }

  const kanban = document.getElementById('obras-kanban');
  if (!kanban || kanban.children.length > 0) return;

  const columns = [
    {key:'orcamento',label:'Orçamento',color:'var(--orange)'},
    {key:'aprovada',label:'Aprovado',color:'#A76EF6'},
    {key:'andamento',label:'Em andamento',color:'var(--petrol-light)'},
    {key:'pausada',label:'Pausada',color:'var(--gray)'},
    {key:'atrasada',label:'Atrasada',color:'var(--red)'},
    {key:'concluida',label:'Concluída',color:'var(--green)'}
  ];

  columns.forEach((column) => {
    const items = obrasFiltradas.filter((obra) => obra.status === column.key);
    const cards = items.map((obra) => `
      <div class="kanban-card" onclick="openObraDetail('${obra.code}')">
        <div class="code">${obra.code}</div>
        <div class="name">${obra.name}</div>
        <div class="client">${obra.client}</div>
        <div class="meta">${statusBadge(obra.status)}<div class="deadline ${obra.status === 'atrasada' ? 'late' : ''}"><i class="ti ti-calendar"></i>${obra.prazo}</div></div>
      </div>
    `).join('');

    kanban.innerHTML += `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-title"><span style="width:8px;height:8px;border-radius:50%;background:${column.color};display:inline-block"></span>${column.label}<span class="kanban-col-count">${items.length}</span></div>
          <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px" onclick="showToast('Adicionar obra','info')"><i class="ti ti-plus"></i></button>
        </div>
        <div class="kanban-cards">${cards || '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-dim)">Sem obras</div>'}</div>
      </div>
    `;
  });
}

function populateOrc() {
  const tbody = document.getElementById('orc-tbody');
  if (!tbody || tbody.children.length > 0) return;

  const lista = getFilteredOrcamentos();
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center">Nenhum orçamento encontrado com os filtros atuais.</td></tr>';
    return;
  }

  lista.forEach((orcamento) => {
    const orcId = String(orcamento.id || '');
    const editButton = orcId
      ? `<button class="btn btn-ghost btn-xs" onclick="editOrcamento('${orcId}')"><i class="ti ti-edit"></i></button>`
      : `<button class="btn btn-ghost btn-xs" disabled title="Orçamento sem ID"><i class="ti ti-edit"></i></button>`;
    tbody.innerHTML += `<tr onclick="openOrcamentoDetail('${orcId}')" style="cursor:pointer">
      <td class="mono">${orcamento.code}</td>
      <td>${orcamento.client}</td>
      <td class="muted">${orcamento.desc}</td>
      <td><span style="font-weight:600;color:var(--petrol-light)">${orcamento.valor}</span></td>
      <td><span class="profit-up"><i class="ti ti-trending-up"></i>${orcamento.margem}</span></td>
      <td class="muted">${orcamento.validade}</td>
      <td>${statusBadge(orcamento.status)}</td>
      <td><div style="display:flex;gap:4px">
        <span onclick="event.stopPropagation()">${editButton}</span>
        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();gerarPdfOrcamento('${orcId}')"><i class="ti ti-file-type-pdf"></i></button>
        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();enviarOrcamento('${orcId}')"><i class="ti ti-send"></i></button>
      </div></td>
    </tr>`;
  });
}

function getFilteredOrcamentos() {
  const search = normalizeFilterValue(document.getElementById('orc-search')?.value || '');
  const status = normalizeFilterValue(document.getElementById('orc-filter-status')?.value || 'todos');

  return (Array.isArray(orcamentos) ? orcamentos : []).filter((orcamento) => {
    const itemStatus = normalizeFilterValue(orcamento?.status || '');
    if (status !== 'todos' && itemStatus !== status) return false;

    if (!search) return true;

    const searchable = [orcamento.code, orcamento.client, orcamento.desc, orcamento.valor, orcamento.validade, orcamento.status]
      .map((value) => normalizeFilterValue(value))
      .join(' ');

    return searchable.includes(search);
  });
}

function applyOrcamentosFilters() {
  const tbody = document.getElementById('orc-tbody');
  if (tbody) tbody.innerHTML = '';
  populateOrc();
}

function clearOrcamentosFilters() {
  const search = document.getElementById('orc-search');
  const status = document.getElementById('orc-filter-status');

  if (search) search.value = '';
  if (status) status.value = 'todos';
  applyOrcamentosFilters();
}

async function loadOrcamentoItens(orcamentoId) {
  const id = String(orcamentoId || '').trim();
  if (!id) return [];

  const { data, error } = await db
    .from('orcamento_itens')
    .select('descricao, quantidade, valor_unitario')
    .eq('orcamento_id', id)
    .order('created_at', { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return data;
}

function findClienteById(clienteId) {
  return (Array.isArray(clientes) ? clientes : []).find((c) => String(c.id || '') === String(clienteId || '')) || null;
}

function formatPhoneForWhatsApp(phoneRaw) {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

async function openOrcamentoDetail(orcamentoId) {
  const id = String(orcamentoId || '').trim();
  const orc = (Array.isArray(orcamentos) ? orcamentos : []).find((item) => String(item.id || '') === id);
  if (!orc) {
    showToast('Orçamento não encontrado.', 'warning');
    return;
  }

  const itens = await loadOrcamentoItens(id);
  const detailId = document.getElementById('orc-detail-id');
  const tbody = document.getElementById('orc-detail-itens');
  if (detailId) detailId.value = id;

  document.getElementById('orc-detail-code').textContent = orc.code || '—';
  document.getElementById('orc-detail-client').textContent = orc.client || '—';
  document.getElementById('orc-detail-valor').textContent = orc.valor || '—';
  document.getElementById('orc-detail-margem').textContent = orc.margem || '—';
  document.getElementById('orc-detail-validade').textContent = orc.validade || '—';
  document.getElementById('orc-detail-status').innerHTML = statusBadge(orc.status || 'pendente');
  document.getElementById('orc-detail-desc').textContent = orc.desc || '—';
  const orcDetailStatus = document.getElementById('orc-detail-status-value');
  const orcDetailStatusBtn = document.getElementById('btn-toggle-orc-status');
  if (orcDetailStatus) orcDetailStatus.value = orc.status || 'pendente';
  if (orcDetailStatusBtn) {
    const statusAtual = String(orc.status || 'pendente').toLowerCase();
    orcDetailStatusBtn.innerHTML = statusAtual === 'aprovado'
      ? '<i class="ti ti-toggle-right"></i>Reprovar orçamento'
      : statusAtual === 'reprovado'
        ? '<i class="ti ti-toggle-right"></i>Reabrir orçamento'
        : '<i class="ti ti-toggle-right"></i>Aprovar orçamento';
  }

  if (tbody) {
    tbody.innerHTML = '';
    if (itens.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted" style="text-align:center">Sem itens cadastrados</td></tr>';
    } else {
      itens.forEach((item) => {
        const qtd = Number(item.quantidade || 0);
        const unit = Number(item.valor_unitario || 0);
        const total = qtd * unit;
        tbody.innerHTML += `<tr><td>${item.descricao || '—'}</td><td>${qtd.toLocaleString('pt-BR')}</td><td>${unit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td>${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>`;
      });
    }
  }

  openModal('modal-orc-detalhe');
}

async function gerarPdfOrcamento(orcamentoId) {
  const id = String(orcamentoId || '').trim();
  const orc = (Array.isArray(orcamentos) ? orcamentos : []).find((item) => String(item.id || '') === id);
  if (!orc) {
    showToast('Orçamento não encontrado para gerar PDF.', 'warning');
    return;
  }

  if (!window.jspdf?.jsPDF) {
    showToast('Biblioteca de PDF indisponível no momento.', 'error');
    return;
  }

  const itens = await loadOrcamentoItens(id);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 18;
  doc.setFontSize(16);
  doc.text(`Orçamento ${orc.code || ''}`, 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Cliente: ${orc.client || '—'}`, 14, y); y += 7;
  doc.text(`Descrição: ${orc.desc || '—'}`, 14, y); y += 7;
  doc.text(`Valor: ${orc.valor || '—'}`, 14, y); y += 7;
  doc.text(`Margem: ${orc.margem || '—'}`, 14, y); y += 7;
  doc.text(`Validade: ${orc.validade || '—'}`, 14, y); y += 10;

  doc.setFontSize(12);
  doc.text('Itens do orçamento', 14, y);
  y += 8;

  doc.setFontSize(10);
  if (itens.length === 0) {
    doc.text('Sem itens cadastrados.', 14, y);
  } else {
    itens.forEach((item, index) => {
      const qtd = Number(item.quantidade || 0);
      const unit = Number(item.valor_unitario || 0);
      const total = qtd * unit;
      const linha = `${index + 1}. ${item.descricao || '—'} | Qtd: ${qtd.toLocaleString('pt-BR')} | Unit: ${unit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      const linhas = doc.splitTextToSize(linha, 182);
      doc.text(linhas, 14, y);
      y += linhas.length * 5;
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
    });
  }

  doc.save(`Orcamento-${orc.code || 'sem-codigo'}.pdf`);
  showToast('PDF do orçamento gerado.', 'success');
}

async function enviarOrcamento(orcamentoId) {
  const id = String(orcamentoId || '').trim();
  const orc = (Array.isArray(orcamentos) ? orcamentos : []).find((item) => String(item.id || '') === id);
  if (!orc) {
    showToast('Orçamento não encontrado para envio.', 'warning');
    return;
  }

  const cliente = findClienteById(orc.clientId);
  const whatsappNumber = formatPhoneForWhatsApp(cliente?.tel || '');
  const email = String(cliente?.email || '').trim();

  await gerarPdfOrcamento(id);

  const texto = `Olá! Segue o orçamento ${orc.code} no valor de ${orc.valor}.`;
  let abriuCanal = false;

  if (whatsappNumber) {
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    abriuCanal = true;
  }

  if (email) {
    const assunto = encodeURIComponent(`Orçamento ${orc.code}`);
    const corpo = encodeURIComponent(`${texto}\n\nPDF gerado no sistema para envio.`);
    window.location.href = `mailto:${email}?subject=${assunto}&body=${corpo}`;
    abriuCanal = true;
  }

  if (!abriuCanal) {
    showToast('Cliente sem telefone/e-mail cadastrado para envio.', 'warning');
    return;
  }

  showToast('Canais de envio abertos (WhatsApp/e-mail).', 'success');
}

function populateOrcPreview() {
  const container = document.getElementById('orc-preview-items');
  if (!container || container.children.length > 0) return;

  orcPreviewItems.forEach((item) => {
    container.innerHTML += `<div style="display:grid;grid-template-columns:1fr 80px 100px 90px;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span>${item.desc}</span><span style="text-align:center;color:var(--text-muted)">${item.qtd}</span><span style="color:var(--text-muted)">${item.unit}</span><span style="text-align:right;font-weight:600">${item.total}</span>
    </div>`;
  });
}

// =============================================================
//  Carregamento de dados reais do Supabase
//  Esta função substitui os dados fixos do código pelos dados
//  reais que estão salvos no banco de dados.
// =============================================================
async function loadAllData() {
  try {
    const [resObras, resOrc, resCli, resFinRec, resFinPag] = await Promise.all([
      db.from('obras').select('*, clientes(nome)').order('created_at', { ascending: false }),
      db.from('orcamentos').select('*, clientes(nome)').order('created_at', { ascending: false }),
      db.from('clientes').select('*').order('nome'),
      db.from('financeiro_receber').select('referencia, descricao, valor, vencimento, status, created_at, clientes(nome), obras(codigo)').order('created_at', { ascending: false }),
      db.from('financeiro_pagar').select('referencia, fornecedor, categoria, valor, vencimento, status, created_at').order('created_at', { ascending: false })
    ]);

    const queryErrors = [
      resObras?.error,
      resOrc?.error,
      resCli?.error,
      resFinRec?.error,
      resFinPag?.error
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      throw queryErrors[0];
    }

    // Sobrescreve os arrays do sistema com dados reais
    obras.length = 0;
    if (resObras.data && resObras.data.length > 0) {
      resObras.data.forEach(o => {
        obras.push({
          id: o.id || null,
          code: o.codigo,
          name: o.nome,
          client: o.clientes?.nome || '—',
          clientId: o.cliente_id || null,
          resp: o.responsavel_nome || '—',
          prazo: o.prazo ? new Date(o.prazo).toLocaleDateString('pt-BR') : '—',
          valor: 'R$ ' + Number(o.valor).toLocaleString('pt-BR'),
          status: o.status,
          location: o.localizacao || '—'
        });
      });
      // Força atualização da tabela ao reentrar na view
      const tbody = document.getElementById('obras-tbody');
      if (tbody) tbody.innerHTML = '';
      const kanban = document.getElementById('obras-kanban');
      if (kanban) kanban.innerHTML = '';
    }

    orcamentos.length = 0;
    if (resOrc.data && resOrc.data.length > 0) {
      resOrc.data.forEach(o => {
        orcamentos.push({
          id: o.id || null,
          code: o.codigo,
          clientId: o.cliente_id || null,
          client: o.clientes?.nome || '—',
          desc: o.descricao,
          valor: 'R$ ' + Number(o.valor).toLocaleString('pt-BR'),
          margem: Number(o.margem_percentual).toFixed(0) + '%',
          validade: o.validade ? new Date(o.validade).toLocaleDateString('pt-BR') : '—',
          status: o.status
        });
      });
      const orcTbody = document.getElementById('orc-tbody');
      if (orcTbody) orcTbody.innerHTML = '';
    }

    clientes.length = 0;
    if (resCli.data && resCli.data.length > 0) {
      const cores = [
        'linear-gradient(135deg,#1B4F6B,#2176A3)',
        'linear-gradient(135deg,#4A1B8F,#7B3FC4)',
        'linear-gradient(135deg,#0F6E56,#1D9E75)',
        'linear-gradient(135deg,#6B3A1F,#A3612A)',
        'linear-gradient(135deg,#1A1D24,#3A4055)',
        'linear-gradient(135deg,#3B3B1A,#8A8A2A)'
      ];
      resCli.data.forEach((c, i) => {
        const partes = c.nome.split(' ');
        const iniciais = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : c.nome.slice(0, 2);
        const emailLocal = typeof getClienteEmailByDoc === 'function' ? getClienteEmailByDoc(c.documento) : '';
        clientes.push({
          id: c.id || null,
          name: c.nome,
          tipo: c.tipo_documento,
          doc: c.documento,
          tel: c.telefone || '—',
          email: c.email || emailLocal || '',
          obras: 0,
          total: 'R$ —',
          status: c.status,
          initials: iniciais.toUpperCase(),
          bg: cores[i % cores.length]
        });
      });
      const cliTbody = document.getElementById('cli-tbody');
      if (cliTbody) cliTbody.innerHTML = '';
    }

    if (typeof financRec !== 'undefined' && Array.isArray(financRec)) {
      financRec.length = 0;
      (resFinRec.data || []).forEach((item) => {
        financRec.push({
          ref: item.referencia,
          client: item.clientes?.nome || '—',
          obra: item.obras?.codigo || '—',
          desc: item.descricao,
          valor: 'R$ ' + Number(item.valor || 0).toLocaleString('pt-BR'),
          venc: item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : '—',
          status: item.status,
          updatedAt: item.created_at || null
        });
      });
    }

    if (typeof financPag !== 'undefined' && Array.isArray(financPag)) {
      financPag.length = 0;
      (resFinPag.data || []).forEach((item) => {
        financPag.push({
          ref: item.referencia,
          forn: item.fornecedor,
          cat: item.categoria || '—',
          valor: 'R$ ' + Number(item.valor || 0).toLocaleString('pt-BR'),
          venc: item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : '—',
          status: item.status,
          updatedAt: item.created_at || null
        });
      });
    }

    updateClientesSummary();
  } catch (err) {
    console.warn('Falha ao carregar dados do Supabase.', err);
    const raw = String(err?.message || '').toLowerCase();
    if (
      raw.includes('jwt')
      || raw.includes('unauthorized')
      || raw.includes('permission')
      || raw.includes('row-level security')
      || raw.includes('auth')
    ) {
      showToast('Sem sessão válida no Supabase. Faça login com GitHub ou e-mail/senha para carregar os dados.', 'warning');
    } else {
      showToast('Erro ao carregar dados do banco. Verifique autenticação/permissões.', 'error');
    }
  }

  if (typeof refreshNotificationBadge === 'function') {
    refreshNotificationBadge();
  }
}

function updateClientesSummary() {
  const summaryEl = document.getElementById('clientes-summary');
  if (!summaryEl) return;

  const total = Array.isArray(clientes) ? clientes.length : 0;
  const ativos = (Array.isArray(clientes) ? clientes : []).filter((c) => {
    return normalizeFilterValue(c?.status) === 'ativo';
  }).length;
  const inativos = (Array.isArray(clientes) ? clientes : []).filter((c) => {
    return normalizeFilterValue(c?.status) === 'inativo';
  }).length;

  summaryEl.textContent = `${total} clientes cadastrados · ${ativos} ativos · ${inativos} inativos`;
}

function getClientesFilteredList() {
  const searchEl = document.getElementById('clientes-search');
  const tipoEl = document.getElementById('clientes-filter-tipo');
  const statusEl = document.getElementById('clientes-filter-status');

  const term = normalizeFilterValue(searchEl?.value || '');
  const tipo = String(tipoEl?.value || 'todos').trim().toUpperCase();
  const status = normalizeFilterValue(statusEl?.value || 'todos');

  return (Array.isArray(clientes) ? clientes : []).filter((cliente) => {
    const nome = normalizeFilterValue(cliente?.name || '');
    const doc = normalizeFilterValue(cliente?.doc || '');
    const tel = normalizeFilterValue(cliente?.tel || '');
    const tipoCliente = String(cliente?.tipo || '').trim().toUpperCase();
    const statusCliente = normalizeFilterValue(cliente?.status || '');

    const matchesTerm = !term || nome.includes(term) || doc.includes(term) || tel.includes(term);
    const matchesTipo = tipo === 'TODOS' || tipoCliente === tipo;
    const matchesStatus = status === 'todos' || statusCliente === status;

    return matchesTerm && matchesTipo && matchesStatus;
  });
}

function renderClientesTableRows(lista) {
  const tbody = document.getElementById('cli-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  lista.forEach((cliente) => {
    const docEncoded = encodeURIComponent(cliente.doc || '');
    tbody.innerHTML += `<tr onclick="viewCliente('${docEncoded}')" style="cursor:pointer">
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar-sm avatar" style="background:${cliente.bg}">${cliente.initials}</div><div><div class="bold">${cliente.name}</div><div style="font-size:11px;color:var(--text-muted)">${cliente.tipo}</div></div></div></td>
      <td class="mono" style="font-size:11px">${cliente.doc}</td>
      <td class="muted">${cliente.tel}</td>
      <td><span class="badge badge-info">${cliente.obras} obras</span></td>
      <td><span class="profit-up"><i class="ti ti-trending-up"></i>${cliente.total}</span></td>
      <td>${statusBadge(cliente.status)}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editCliente('${docEncoded}')"><i class="ti ti-edit"></i></button>
        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openClienteWhatsapp('${docEncoded}')"><i class="ti ti-brand-whatsapp"></i></button>
      </div></td>
    </tr>`;
  });
}

function applyClientesFilters() {
  renderClientesTableRows(getClientesFilteredList());
}

function clearClientesFilters() {
  const search = document.getElementById('clientes-search');
  const tipo = document.getElementById('clientes-filter-tipo');
  const status = document.getElementById('clientes-filter-status');

  if (search) search.value = '';
  if (tipo) tipo.value = 'todos';
  if (status) status.value = 'todos';
  applyClientesFilters();
}

function populateClientes() {
  updateClientesSummary();
  applyClientesFilters();
}

function decodeDocParam(encodedDoc) {
  try {
    return decodeURIComponent(encodedDoc || '');
  } catch {
    return String(encodedDoc || '');
  }
}

function findClienteByDoc(doc) {
  const normalized = String(doc || '').replace(/\D/g, '');
  return clientes.find((c) => String(c.doc || '').replace(/\D/g, '') === normalized) || null;
}

function parseCurrencyBRL(value) {
  const raw = String(value || '');
  const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return Number(normalized) || 0;
}

function formatCurrencyBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getClienteDashboardMetrics(cliente) {
  const nomeCliente = normalizeFilterValue(cliente?.name || '');
  const obrasCliente = (Array.isArray(obras) ? obras : []).filter((obra) => normalizeFilterValue(obra.client) === nomeCliente);

  const totalObras = obrasCliente.length;
  const finalizadas = obrasCliente.filter((obra) => obra.status === 'concluida').length;
  const andamento = obrasCliente.filter((obra) => obra.status === 'andamento').length;
  const atraso = obrasCliente.filter((obra) => obra.status === 'atrasada').length;
  const valorContratado = obrasCliente.reduce((sum, obra) => sum + parseCurrencyBRL(obra.valor), 0);

  const obraCodes = new Set(obrasCliente.map((obra) => String(obra.code || '').trim()).filter(Boolean));
  const lancamentosReceber = (typeof financRec !== 'undefined' && Array.isArray(financRec) ? financRec : []).filter((item) => {
    const byCode = obraCodes.has(String(item.obra || '').trim());
    const nomeItem = normalizeFilterValue(item.client || '');
    const byName = nomeItem === nomeCliente || nomeItem.includes(nomeCliente) || nomeCliente.includes(nomeItem);
    return byCode || byName;
  });

  const valorRecebido = lancamentosReceber
    .filter((item) => ['recebido', 'pago'].includes(normalizeFilterValue(item.status)))
    .reduce((sum, item) => sum + parseCurrencyBRL(item.valor), 0);

  const valorAReceber = lancamentosReceber
    .filter((item) => !['recebido', 'pago'].includes(normalizeFilterValue(item.status)))
    .reduce((sum, item) => sum + parseCurrencyBRL(item.valor), 0);

  const valorVencido = lancamentosReceber
    .filter((item) => normalizeFilterValue(item.status) === 'vencido')
    .reduce((sum, item) => sum + parseCurrencyBRL(item.valor), 0);

  return {
    totalObras,
    finalizadas,
    andamento,
    atraso,
    valorContratado,
    valorRecebido,
    valorAReceber,
    valorVencido
  };
}

function resetClienteModalMode() {
  const title = document.getElementById('modal-cliente-title');
  const btn = document.getElementById('btn-salvar-cliente');
  const editDoc = document.getElementById('cli-edit-doc');
  const statusInput = document.getElementById('cli-current-status');
  const toggleBtn = document.getElementById('btn-toggle-cliente-status');

  if (title) {
    title.innerHTML = '<i class="ti ti-user-plus" style="margin-right:8px;color:var(--petrol-light)"></i>Novo Cliente';
  }
  if (btn) {
    btn.innerHTML = '<i class="ti ti-check"></i>Cadastrar';
  }
  if (editDoc) editDoc.value = '';
  if (statusInput) statusInput.value = 'ativo';
  if (toggleBtn) {
    toggleBtn.style.display = 'none';
    toggleBtn.innerHTML = '<i class="ti ti-user-x"></i>Inativar cliente';
  }
}

function viewCliente(encodedDoc) {
  const doc = decodeDocParam(encodedDoc);
  const cliente = findClienteByDoc(doc);
  if (!cliente) {
    showToast('Cliente não encontrado', 'warning');
    return;
  }

  document.getElementById('cliente-detail-nome').textContent = cliente.name || '—';
  document.getElementById('cliente-detail-tipo').textContent = cliente.tipo || '—';
  document.getElementById('cliente-detail-doc').textContent = cliente.doc || '—';
  document.getElementById('cliente-detail-tel').textContent = cliente.tel || '—';
  document.getElementById('cliente-detail-obras').textContent = String(cliente.obras ?? '—');
  document.getElementById('cliente-detail-total').textContent = cliente.total || '—';
  document.getElementById('cliente-detail-status').innerHTML = statusBadge(cliente.status || 'ativo');
  const clienteDetailDoc = document.getElementById('cliente-detail-doc-value');
  const clienteDetailStatus = document.getElementById('cliente-detail-status-value');
  const clienteDetailStatusBtn = document.getElementById('btn-toggle-cliente-status-detail');
  if (clienteDetailDoc) clienteDetailDoc.value = cliente.doc || '';
  if (clienteDetailStatus) clienteDetailStatus.value = cliente.status || 'ativo';
  if (clienteDetailStatusBtn) {
    clienteDetailStatusBtn.innerHTML = normalizeFilterValue(cliente.status || 'ativo') === 'ativo'
      ? '<i class="ti ti-user-x"></i>Inativar cliente'
      : '<i class="ti ti-user-check"></i>Ativar cliente';
  }

  const metrics = getClienteDashboardMetrics(cliente);
  document.getElementById('cliente-kpi-finalizadas').textContent = String(metrics.finalizadas);
  document.getElementById('cliente-kpi-andamento').textContent = String(metrics.andamento);
  document.getElementById('cliente-kpi-atraso').textContent = String(metrics.atraso);
  document.getElementById('cliente-kpi-total-obras').textContent = String(metrics.totalObras);
  document.getElementById('cliente-kpi-contratado').textContent = formatCurrencyBRL(metrics.valorContratado);
  document.getElementById('cliente-kpi-recebido').textContent = formatCurrencyBRL(metrics.valorRecebido);
  document.getElementById('cliente-kpi-receber').textContent = formatCurrencyBRL(metrics.valorAReceber);
  document.getElementById('cliente-kpi-vencido').textContent = formatCurrencyBRL(metrics.valorVencido);

  openModal('modal-cliente-detalhe');
}

function editCliente(encodedDoc) {
  const doc = decodeDocParam(encodedDoc);
  const cliente = findClienteByDoc(doc);
  if (!cliente) {
    showToast('Cliente não encontrado', 'warning');
    return;
  }

  const title = document.getElementById('modal-cliente-title');
  const btn = document.getElementById('btn-salvar-cliente');
  const editDoc = document.getElementById('cli-edit-doc');
  const statusInput = document.getElementById('cli-current-status');
  const toggleBtn = document.getElementById('btn-toggle-cliente-status');
  const statusAtual = normalizeFilterValue(cliente.status || 'ativo') === 'inativo' ? 'inativo' : 'ativo';

  if (title) {
    title.innerHTML = '<i class="ti ti-edit" style="margin-right:8px;color:var(--petrol-light)"></i>Editar Cliente';
  }
  if (btn) {
    btn.innerHTML = '<i class="ti ti-device-floppy"></i>Salvar alterações';
  }
  if (editDoc) editDoc.value = cliente.doc || '';
  if (statusInput) statusInput.value = statusAtual;
  if (toggleBtn) {
    toggleBtn.style.display = 'inline-flex';
    toggleBtn.innerHTML = statusAtual === 'ativo'
      ? '<i class="ti ti-user-x"></i>Inativar cliente'
      : '<i class="ti ti-user-check"></i>Ativar cliente';
  }

  document.getElementById('cli-nome').value = cliente.name || '';
  document.getElementById('cli-tipo').value = cliente.tipo || 'CNPJ';
  document.getElementById('cli-doc').value = cliente.doc || '';
  document.getElementById('cli-tel').value = cliente.tel && cliente.tel !== '—' ? cliente.tel : '';

  openModal('modal-novo-cliente');
}

function openClienteWhatsapp(encodedDoc) {
  const doc = decodeDocParam(encodedDoc);
  const cliente = findClienteByDoc(doc);
  if (!cliente) {
    showToast('Cliente não encontrado', 'warning');
    return;
  }

  const rawPhone = String(cliente.tel || '');
  const digits = rawPhone.replace(/\D/g, '');

  if (!digits || digits.length < 10) {
    showToast('Cliente sem telefone válido para WhatsApp', 'warning');
    return;
  }

  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
}
