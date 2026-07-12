const financRec = [];

const financPag = [];

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
  const receiveTable = document.getElementById('fin-rec-tbody');
  if (receiveTable && receiveTable.children.length === 0) {
    financRec.forEach((item) => {
      receiveTable.innerHTML += `<tr>
        <td class="mono">${item.ref}</td>
        <td><div class="bold">${item.client}</div><div style="font-size:11px;color:var(--text-muted)">${item.obra}</div></td>
        <td class="muted">${item.desc}</td>
        <td><span style="font-weight:700;color:var(--green)">${item.valor}</span></td>
        <td class="muted">${item.venc}</td>
        <td>${statusBadge(item.status)}</td>
        <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="showToast('Marcar como recebido','success')"><i class="ti ti-check"></i></button><button class="btn btn-ghost btn-xs"><i class="ti ti-edit"></i></button></div></td>
      </tr>`;
    });
  }

  const payTable = document.getElementById('fin-pag-tbody');
  if (payTable && payTable.children.length === 0) {
    financPag.forEach((item) => {
      payTable.innerHTML += `<tr>
        <td class="mono">${item.ref}</td>
        <td class="bold">${item.forn}</td>
        <td><span class="badge badge-neutral">${item.cat}</span></td>
        <td><span style="font-weight:700;color:var(--red)">${item.valor}</span></td>
        <td class="muted">${item.venc}</td>
        <td>${statusBadge(item.status)}</td>
        <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="showToast('Baixar pagamento','success')"><i class="ti ti-check"></i></button><button class="btn btn-ghost btn-xs"><i class="ti ti-edit"></i></button></div></td>
      </tr>`;
    });
  }
}

function populateEquipes() {
  const grid = document.getElementById('equipes-grid');
  if (!grid || grid.children.length > 0) return;

  equipeData.forEach((member) => {
    grid.innerHTML += `<div class="team-card" onclick="showToast('Perfil carregado','info')">
      <div class="team-card-header">
        <div class="avatar" style="background:${member.bg};width:44px;height:44px;font-size:14px">${member.initials}</div>
        <div class="team-card-info">
          <div class="team-card-name">${member.name}</div>
          <div class="team-card-role">${member.role}</div>
        </div>
        ${statusBadge(member.status)}
      </div>
      <div class="team-card-body">
        <div class="team-meta-row"><span>Diária</span><span>${member.diaria}</span></div>
        <div class="team-meta-row"><span>Comissão</span><span>${member.comissao}</span></div>
        <div class="team-meta-row"><span>Obra atual</span><span style="color:var(--petrol-light)">${member.obra}</span></div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-xs" style="flex:1" onclick="event.stopPropagation();showToast('Ver perfil completo','info')"><i class="ti ti-user"></i>Perfil</button>
        <button class="btn btn-ghost btn-xs" style="flex:1" onclick="event.stopPropagation();showToast('Alocando técnico...','info')"><i class="ti ti-building-factory-2"></i>Alocar</button>
      </div>
    </div>`;
  });
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

function drawFluxo() {
  const svg = document.getElementById('fluxo-svg');
  if (!svg || svg.innerHTML !== '') return;

  const width = 660;
  const height = 170;
  const pad = 20;
  const entradas = [42, 68, 55, 84, 72, 91, 63, 78, 95, 68, 85, 102];
  const saidas = [38, 52, 49, 67, 58, 74, 55, 68, 80, 57, 72, 88];
  const maxValue = Math.max(...entradas, ...saidas);
  const scaleY = (value) => (height - pad) - (value / maxValue) * (height - pad * 2);
  const scaleX = (index) => pad + index * ((width - pad * 2) / 11);

  const polylineEntrada = entradas.map((value, index) => `${scaleX(index)},${scaleY(value)}`).join(' ');
  const polylineSaida = saidas.map((value, index) => `${scaleX(index)},${scaleY(value)}`).join(' ');

  svg.innerHTML = `
    <polyline points="${polylineEntrada}" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${polylineSaida}" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${entradas.map((_, index) => `<circle cx="${scaleX(index)}" cy="${scaleY(entradas[index])}" r="3" fill="var(--green)"/>`).join('')}
    ${saidas.map((_, index) => `<circle cx="${scaleX(index)}" cy="${scaleY(saidas[index])}" r="3" fill="var(--red)"/>`).join('')}
    <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="var(--border)" stroke-width="1"/>
  `;
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
  element.classList.add('active');
  ['fin-receber', 'fin-pagar', 'fin-fluxo'].forEach((id) => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById(`fin-${tab}`).style.display = 'block';
  if (tab === 'fluxo') drawFluxo();
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
