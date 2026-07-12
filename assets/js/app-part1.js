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
    modals: ['modal-nova-obra', 'modal-novo-orc', 'modal-orc-detalhe', 'modal-novo-cliente', 'modal-lancamento', 'modal-novo-membro', 'modal-nova-entrada', 'modal-cliente-detalhe']
  },
  gestor: {
    label: 'Gestor',
    views: ['dashboard', 'obras', 'orcamentos', 'clientes', 'financeiro', 'equipes', 'estoque', 'configuracoes'],
    modals: ['modal-nova-obra', 'modal-novo-orc', 'modal-orc-detalhe', 'modal-novo-cliente', 'modal-lancamento', 'modal-novo-membro', 'modal-nova-entrada', 'modal-cliente-detalhe']
  },
  financeiro: {
    label: 'Financeiro',
    views: ['dashboard', 'financeiro'],
    modals: ['modal-lancamento']
  },
  tecnico: {
    label: 'Técnico',
    views: ['dashboard', 'obras', 'estoque'],
    modals: ['modal-nova-entrada']
  },
  operador: {
    label: 'Operador',
    views: ['dashboard', 'obras', 'orcamentos', 'clientes', 'financeiro', 'equipes', 'estoque', 'configuracoes'],
    modals: ['modal-nova-obra', 'modal-novo-orc', 'modal-orc-detalhe', 'modal-novo-cliente', 'modal-cliente-detalhe']
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
    if (text.includes('editar') || text.includes('relatório')) {
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
    campo:'<span class="badge badge-info"><span class="badge-dot"></span>Em campo</span>',
    disponivel:'<span class="badge badge-success"><span class="badge-dot"></span>Disponível</span>',
    afastado:'<span class="badge badge-warning"><span class="badge-dot"></span>Afastado</span>'
  };

  return map[status] || `<span class="badge badge-neutral">${status}</span>`;
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

function populateObras() {
  const obrasFiltradas = getFilteredObras();
  const tbody = document.getElementById('obras-tbody');
  if (tbody && tbody.children.length === 0) {
    obrasFiltradas.forEach((obra) => {
      tbody.innerHTML += `<tr onclick="openObraDetail('${obra.code}')">
        <td class="mono">${obra.code}</td>
        <td><div class="bold">${obra.name}</div></td>
        <td class="muted">${obra.client}</td>
        <td><div style="display:flex;align-items:center;gap:6px"><div class="avatar-sm avatar" style="font-size:9px">${obra.resp.split(' ').map((part) => part[0]).join('')}</div>${obra.resp}</div></td>
        <td class="muted">${obra.prazo}</td>
        <td><span style="font-weight:600;color:var(--petrol-light)">${obra.valor}</span></td>
        <td>${statusBadge(obra.status)}</td>
        <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openObraDetail('${obra.code}')"><i class="ti ti-eye"></i></button><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();showToast('Editar obra','info')"><i class="ti ti-edit"></i></button></div></td>
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

  orcamentos.forEach((orcamento) => {
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
      db.from('financeiro_receber').select('referencia, descricao, valor, vencimento, status, clientes(nome), obras(codigo)').order('created_at', { ascending: false }),
      db.from('financeiro_pagar').select('referencia, fornecedor, categoria, valor, vencimento, status').order('created_at', { ascending: false })
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
          status: item.status
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
          status: item.status
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
