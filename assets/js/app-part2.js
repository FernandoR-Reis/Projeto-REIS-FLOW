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
  return EQUIPE_ROLES_BY_AREA[key] || EQUIPE_ROLES_BY_AREA.obras;
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
    comissao: String(member?.comissao || '0%'),
    obra: String(member?.obra || '—'),
    status: String(member?.status || 'disponivel').toLowerCase(),
    initials: String(member?.initials || buildEquipeInitials(name)),
    bg: String(member?.bg || fallbackGradients[index % fallbackGradients.length]),
    tel: String(member?.tel || ''),
    email: String(member?.email || '')
  };
}

function loadEquipesFromStorage() {
  try {
    const raw = localStorage.getItem(EQUIPE_DATA_STORAGE_KEY);
    if (!raw) {
      for (let i = 0; i < equipeData.length; i += 1) {
        equipeData[i] = normalizeEquipeMember(equipeData[i], i);
      }
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    equipeData.length = 0;
    parsed.forEach((member, index) => equipeData.push(normalizeEquipeMember(member, index)));
  } catch {
    for (let i = 0; i < equipeData.length; i += 1) {
      equipeData[i] = normalizeEquipeMember(equipeData[i], i);
    }
  }
}

function saveEquipesToStorage() {
  try {
    localStorage.setItem(EQUIPE_DATA_STORAGE_KEY, JSON.stringify(equipeData || []));
  } catch {
    // Falha silenciosa: modulo continua funcional em memoria.
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
  setText('eq-kpi-comissao', member.comissao || '0%');

  renderEquipeObrasList(relatedObras);
  renderEquipePagamentosList(relatedPayments);

  const editBtn = document.getElementById('eq-detail-edit-btn');
  if (editBtn) {
    editBtn.setAttribute('onclick', `closeModal('modal-equipe-detalhe');openEditarMembroEquipe('${String(member.id || '').replace(/'/g, "\\'")}')`);
  }

  openModal('modal-equipe-detalhe');
}

const equipeData = [
  {name:'Diego Santos',role:'Mestre de Obras',diaria:'R$ 320',comissao:'3%',obra:'OB-0031',status:'campo',initials:'DS',bg:'linear-gradient(135deg,#1B4F6B,#2176A3)'},
  {name:'Ana Moura',role:'Eletricista Senior',diaria:'R$ 280',comissao:'2.5%',obra:'OB-0030',status:'campo',initials:'AM',bg:'linear-gradient(135deg,#4A1B8F,#7B3FC4)'},
  {name:'Pedro Lima',role:'Encanador',diaria:'R$ 240',comissao:'2%',obra:'OB-0029',status:'disponivel',initials:'PL',bg:'linear-gradient(135deg,#0F6E56,#1D9E75)'},
  {name:'Marcos Vieira',role:'Ajudante',diaria:'R$ 160',comissao:'0%',obra:'—',status:'disponivel',initials:'MV',bg:'linear-gradient(135deg,#6B3A1F,#A3612A)'},
  {name:'Luiz Henrique',role:'Pedreiro',diaria:'R$ 220',comissao:'1.5%',obra:'OB-0027',status:'campo',initials:'LH',bg:'linear-gradient(135deg,#1A4B3B,#2A8A6B)'},
  {name:'Cláudio Ferreira',role:'Eletricista',diaria:'R$ 260',comissao:'2%',obra:'OB-0031',status:'campo',initials:'CF',bg:'linear-gradient(135deg,#3B3B1A,#8A8A2A)'},
  {name:'Renata Costa',role:'Técnica',diaria:'R$ 200',comissao:'1%',obra:'—',status:'afastado',initials:'RC',bg:'linear-gradient(135deg,#4B1A2A,#A32A5A)'},
];

const estoqueData = [
  {code:'EST-001',name:'Cabo PIAL 2,5mm',cat:'Elétrica',qtd:480,min:200,custo:'R$ 2,40',forn:'Elétrica Premium',cor:'var(--green)'},
  {code:'EST-002',name:'Disjuntor 20A',cat:'Elétrica',qtd:18,min:30,custo:'R$ 28,00',forn:'Elétrica Premium',cor:'var(--red)'},
  {code:'EST-003',name:'Tubo PVC 3/4"',cat:'Hidráulica',qtd:145,min:50,custo:'R$ 12,50',forn:'Hidrobom',cor:'var(--green)'},
  {code:'EST-004',name:'Cimento 50kg',cat:'Civil',qtd:22,min:40,custo:'R$ 38,00',forn:'Depósito Fácil',cor:'var(--red)'},
  {code:'EST-005',name:'Tomada 2P+T',cat:'Elétrica',qtd:67,min:50,custo:'R$ 8,40',forn:'Elétrica Premium',cor:'var(--orange)'},
  {code:'EST-006',name:'Fio Terra 4mm',cat:'Elétrica',qtd:320,min:100,custo:'R$ 3,80',forn:'Elétrica Premium',cor:'var(--green)'},
  {code:'EST-007',name:'Registro gaveta 3/4"',cat:'Hidráulica',qtd:8,min:15,custo:'R$ 42,00',forn:'Hidrobom',cor:'var(--red)'},
  {code:'EST-008',name:'Arame galvanizado',cat:'Civil',qtd:34,min:20,custo:'R$ 18,00',forn:'Depósito Fácil',cor:'var(--green)'},
];

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

function parseFinDate(dateText) {
  if (typeof parseDatePtBr === 'function') return parseDatePtBr(dateText);
  const value = String(dateText || '').trim();
  const parts = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) return null;
  const [, dd, mm, yyyy] = parts;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
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

  const vencDate = parseFinDate(item?.venc || '');
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

function getFinValueNumber(item) {
  if (typeof parseCurrencyBRL === 'function') return parseCurrencyBRL(item?.valor || 0);
  const raw = String(item?.valor || '0').replace(/[^\d,.-]/g, '').replace(',', '.');
  return Number(raw) || 0;
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
  const recOpen = financRec.filter((item) => !['recebido', 'pago'].includes(String(item.status || '').toLowerCase()));
  const pagOpen = financPag.filter((item) => !['pago', 'recebido'].includes(String(item.status || '').toLowerCase()));
  const recPaid = financRec.filter((item) => String(item.status || '').toLowerCase() === 'recebido');
  const pagPaid = financPag.filter((item) => String(item.status || '').toLowerCase() === 'pago');

  const totalReceber = recOpen.reduce((sum, item) => sum + getFinValueNumber(item), 0);
  const totalPagar = pagOpen.reduce((sum, item) => sum + getFinValueNumber(item), 0);
  const totalPagarCompromissado = financPag.reduce((sum, item) => sum + getFinValueNumber(item), 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ate7Dias = new Date(hoje.getTime() + (7 * 86400000));

  const pagar7dias = pagOpen.reduce((sum, item) => {
    const d = parseDatePtBr(item.venc);
    if (!d) return sum;
    return d <= ate7Dias ? sum + getFinValueNumber(item) : sum;
  }, 0);

  const faturadoMes = recPaid
    .filter((item) => isSameMonthYear(getFinanceEventDate(item), hoje))
    .reduce((sum, item) => sum + getFinValueNumber(item), 0);

  const pagoMes = pagPaid
    .filter((item) => isSameMonthYear(getFinanceEventDate(item), hoje))
    .reduce((sum, item) => sum + getFinValueNumber(item), 0);

  const saldo = totalReceber - totalPagarCompromissado - pagoMes;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const currency = (value) => (typeof formatCurrencyBRL === 'function'
    ? formatCurrencyBRL(value)
    : Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

  setText('fin-stat-receber', currency(totalReceber));
  setText('fin-stat-receber-sub', `${recOpen.length} parcela(s) em aberto`);
  setText('fin-stat-pagar', currency(totalPagar));
  setText('fin-stat-saldo', currency(saldo));
  setText('fin-stat-faturado', currency(faturadoMes));

  const saldoSub = document.getElementById('fin-stat-saldo-sub');
  if (saldoSub) {
    saldoSub.textContent = 'A receber - compromissos - pagos no mês';
  }

  const pagarSub = document.getElementById('fin-stat-pagar-sub');
  if (pagarSub) {
    pagarSub.innerHTML = `<span class="down">${currency(pagar7dias)}</span> vence em 7 dias`;
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
        <div class="team-meta-row"><span>Comissão</span><span>${member.comissao}</span></div>
        <div class="team-meta-row"><span>Obra atual</span><span style="color:var(--petrol-light)">${member.obra}</span></div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-xs" style="flex:1" onclick="event.stopPropagation();openEditarMembroEquipe('${idSafe}')"><i class="ti ti-edit"></i>Editar</button>
        <button class="btn btn-ghost btn-xs" style="flex:1" onclick="event.stopPropagation();toggleMembroEquipeStatus('${idSafe}')"><i class="ti ${isInactive ? 'ti-user-check' : 'ti-user-x'}"></i>${isInactive ? 'Ativar' : 'Inativar'}</button>
      </div>
    </div>`;
  });
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
  const comissao = document.getElementById('eq-comissao');
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
  if (comissao) comissao.value = '';
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
  const comissao = document.getElementById('eq-comissao');
  const obra = document.getElementById('eq-obra');

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
  if (comissao) comissao.value = _equipeComissaoFormatter(member.comissao || '');
  if (obra) obra.value = member.obra && member.obra !== '—' ? member.obra : '';
}

function toggleMembroEquipeStatus(memberId) {
  const id = String(memberId || '').trim();
  if (!id) return;

  const idx = (Array.isArray(equipeData) ? equipeData : []).findIndex((item) => String(item.id || '') === id);
  if (idx < 0) {
    showToast('Membro não encontrado para alterar status.', 'warning');
    return;
  }

  const current = String(equipeData[idx].status || '').toLowerCase();
  equipeData[idx].status = current === 'inativo' ? 'disponivel' : 'inativo';
  saveEquipesToStorage();
  populateEquipes();
  showToast(equipeData[idx].status === 'inativo' ? 'Membro inativado.' : 'Membro ativado.', 'success');
}

function salvarMembroEquipe() {
  const editId = String(document.getElementById('eq-edit-id')?.value || '').trim();
  const nome = String(document.getElementById('eq-nome')?.value || '').trim();
  const area = String(document.getElementById('eq-area')?.value || 'obras').toLowerCase();
  const role = String(document.getElementById('eq-funcao')?.value || '').trim();
  const status = String(document.getElementById('eq-status')?.value || 'disponivel').toLowerCase();
  const telefone = String(document.getElementById('eq-telefone')?.value || '').trim();
  const email = String(document.getElementById('eq-email')?.value || '').trim();
  const diaria = String(document.getElementById('eq-diaria')?.value || '').trim();
  const comissaoRaw = String(document.getElementById('eq-comissao')?.value || '').trim();
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
    comissao: formatEquipeComissaoValue(comissaoRaw),
    obra
  }, equipeData.length);

  if (editId) {
    const idx = equipeData.findIndex((item) => String(item.id || '') === editId);
    if (idx >= 0) {
      equipeData[idx] = { ...equipeData[idx], ...member, id: editId };
    } else {
      equipeData.unshift(member);
    }
  } else {
    equipeData.unshift(member);
  }

  saveEquipesToStorage();
  populateEquipes();
  closeModal('modal-novo-membro');
  resetNovoMembroModal();
  showToast(editId ? 'Membro atualizado com sucesso!' : 'Membro adicionado com sucesso!', 'success');
}

function populateEstoque() {
  const tbody = document.getElementById('estoque-tbody');
  if (!tbody || tbody.children.length > 0) return;

  estoqueData.forEach((item) => {
    const percentage = Math.round(Math.min(100, (item.qtd / item.min) * 100));
    const lowStock = item.qtd < item.min;

    tbody.innerHTML += `<tr>
      <td class="mono">${item.code}</td>
      <td><div class="bold">${item.name}</div></td>
      <td><span class="badge badge-neutral">${item.cat}</span></td>
      <td><span style="font-weight:600;color:${item.cor}">${item.qtd}</span></td>
      <td class="muted">${item.min}</td>
      <td><div class="stock-level"><div class="stock-bar"><div class="stock-fill" style="width:${Math.min(100, percentage)}%;background:${item.cor}"></div></div><span style="font-size:11px;color:${item.cor}">${percentage}%</span></div></td>
      <td class="muted">${item.custo}</td>
      <td class="muted">${item.forn}</td>
      <td><div style="display:flex;gap:4px">${lowStock ? `<button class="btn btn-danger btn-xs" onclick="showToast('Pedido enviado ao fornecedor!','success')"><i class="ti ti-shopping-cart"></i>Pedir</button>` : ''}<button class="btn btn-ghost btn-xs" onclick="openModal('modal-nova-entrada')"><i class="ti ti-plus"></i></button></div></td>
    </tr>`;
  });
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
  const raw = item?.valor ?? 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const text = String(raw).replace(/[^\d,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : 0;
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

  const isReceber = kind === 'receber';
  if (clienteField) clienteField.style.display = isReceber ? '' : 'none';
  if (obraField) obraField.style.display = isReceber ? '' : 'none';
  if (fornecedorField) fornecedorField.style.display = isReceber ? 'none' : '';
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
  if (cat) cat.value = 'Serviços';
  if (obra) obra.value = '';

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

  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'modal-novo-cliente' && typeof resetClienteModalMode === 'function') {
    resetClienteModalMode();
  }
  if (id === 'modal-novo-orc' && typeof resetOrcamentoModal === 'function') {
    resetOrcamentoModal();
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

  return notifications;
}

function refreshNotificationBadge() {
  const badge = document.getElementById('notif-count');
  const notifications = getImportantNotifications();

  window._importantNotifications = notifications;

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
    estoque: notifications.filter((item) => item.type === 'estoque-baixo').length
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

    if (currentView === 'dashboard') {
      clearViewRenderCache('dashboard');
      if (typeof buildDashChart === 'function') buildDashChart();
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
  container.insertAdjacentHTML('beforeend', `<div class="budget-line"><input placeholder="Serviço / Material"><input value="1" style="width:100%;text-align:center" oninput="calcLine(this)"><input value="0" placeholder="R$ 0,00" oninput="calcLine(this)"><span class="line-total" style="text-align:right;font-weight:600;color:var(--petrol-light)">R$ 0</span><button onclick="this.parentElement.remove();calcTotals()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:15px"><i class="ti ti-x"></i></button></div>`);
}

function calcLine(input) {
  const line = input.closest('.budget-line');
  const fields = line.querySelectorAll('input');
  const quantity = parseFloat(fields[1].value) || 0;
  const unit = parseFloat(fields[2].value) || 0;
  line.querySelector('.line-total').textContent = `R$ ${Math.round(quantity * unit).toLocaleString('pt-BR')}`;
  calcTotals();
}

function calcTotals() {
  let subtotal = 0;

  document.querySelectorAll('#orc-modal-lines .budget-line').forEach((line) => {
    const inputs = line.querySelectorAll('input');
    const quantity = parseFloat(inputs[1].value) || 0;
    const unit = parseFloat(inputs[2].value) || 0;
    subtotal += quantity * unit;
  });

  const margin = (parseFloat(document.getElementById('modal-margem').value) || 0) / 100;
  const discount = parseFloat(document.getElementById('modal-desconto').value) || 0;
  const displacement = parseFloat(document.getElementById('modal-desloc').value) || 0;
  const profit = subtotal * margin;
  const total = subtotal + profit + displacement - discount;
  const formatCurrency = (value) => `R$ ${Math.round(value).toLocaleString('pt-BR')}`;

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
  loadAllData();
  setTimeout(() => {
    const saudacao = nome ? `Bem-vindo, ${nome.split(' ')[0]}!` : 'Bem-vindo ao REIS FLOW!';
    showToast(saudacao, 'success');
  }, 300);
}

function goToLogin() {
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.classList.remove('open');
    });
  });

  if (typeof applyRolePermissions === 'function') applyRolePermissions();
  refreshNotificationBadge();

  loadFinFiltersFromSession();
  syncFinFiltersUI();

  loadEquipesFromStorage();
  loadEquipesFiltersFromSession();
  syncEquipesFiltersUI();
  resetNovoMembroModal();

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
