const obras = [
  {code:'OB-0031',name:'Reforma Comercial Horizonte',client:'Construtora Horizonte',resp:'Diego Santos',prazo:'28/06/2025',valor:'R$ 148.000',status:'andamento',location:'São Paulo, SP'},
  {code:'OB-0030',name:'Instalação Elétrica Inova',client:'Grupo Inova Obras',resp:'Ana Moura',prazo:'15/06/2025',valor:'R$ 87.400',status:'atrasada',location:'Guarulhos, SP'},
  {code:'OB-0029',name:'Manutenção Preventiva TechFix',client:'TechFix Soluções',resp:'Pedro Lima',prazo:'30/06/2025',valor:'R$ 34.200',status:'concluida',location:'Osasco, SP'},
  {code:'OB-0028',name:'Hidráulica Residencial Silva',client:'João C. Silva',resp:'Diego Santos',prazo:'10/07/2025',valor:'R$ 22.800',status:'orcamento',location:'Barueri, SP'},
  {code:'OB-0027',name:'Reforma Elétrica Galpão ABC',client:'Indústria ABC Ltda',resp:'Ana Moura',prazo:'20/07/2025',valor:'R$ 215.000',status:'andamento',location:'Campinas, SP'},
  {code:'OB-0026',name:'Construção Muro Perimetral',client:'Imóveis Belo Horizonte',resp:'Pedro Lima',prazo:'05/08/2025',valor:'R$ 45.600',status:'aprovada',location:'Belo Horizonte, MG'},
  {code:'OB-0025',name:'Revisão Preventiva Anual',client:'Rio Negro Serviços',resp:'Diego Santos',prazo:'03/06/2025',valor:'R$ 18.900',status:'atrasada',location:'Goiânia, GO'},
  {code:'OB-0024',name:'Instalação Ar-Condicionado Split',client:'Clínica Saúde Total',resp:'Ana Moura',prazo:'12/06/2025',valor:'R$ 9.800',status:'pausada',location:'São Paulo, SP'},
];

const orcamentos = [
  {code:'ORC-2847',client:'Construtora Horizonte',desc:'Reforma Elétrica Completa',valor:'R$ 87.200',margem:'32%',validade:'15/07/2025',status:'pendente'},
  {code:'ORC-2846',client:'Grupo Inova Obras',desc:'Instalação Hidráulica Industrial',valor:'R$ 134.500',margem:'28%',validade:'30/06/2025',status:'aprovado'},
  {code:'ORC-2845',client:'João C. Silva',desc:'Reforma Banheiro + Cozinha',valor:'R$ 22.800',margem:'35%',validade:'20/06/2025',status:'pendente'},
  {code:'ORC-2844',client:'Indústria ABC Ltda',desc:'Manutenção Preventiva Anual',valor:'R$ 48.000',margem:'40%',validade:'10/07/2025',status:'aprovado'},
  {code:'ORC-2843',client:'Rio Negro Serviços',desc:'Cabeamento Estruturado',valor:'R$ 67.000',margem:'30%',validade:'05/06/2025',status:'expirado'},
  {code:'ORC-2842',client:'Clínica Saúde Total',desc:'Instalação Energia Solar',valor:'R$ 89.400',margem:'25%',validade:'25/07/2025',status:'pendente'},
];

const clientes = [
  {name:'Construtora Horizonte',tipo:'CNPJ',doc:'12.345.678/0001-00',tel:'(11) 3847-2000',obras:8,total:'R$ 892k',status:'ativo',initials:'CH',bg:'linear-gradient(135deg,#1B4F6B,#2176A3)'},
  {name:'Grupo Inova Obras',tipo:'CNPJ',doc:'98.765.432/0001-11',tel:'(11) 9847-3020',obras:5,total:'R$ 456k',status:'ativo',initials:'GI',bg:'linear-gradient(135deg,#4A1B8F,#7B3FC4)'},
  {name:'TechFix Soluções',tipo:'CNPJ',doc:'11.222.333/0001-44',tel:'(11) 9234-5678',obras:3,total:'R$ 187k',status:'ativo',initials:'TF',bg:'linear-gradient(135deg,#0F6E56,#1D9E75)'},
  {name:'João Carlos Silva',tipo:'CPF',doc:'123.456.789-00',tel:'(11) 99870-1234',obras:2,total:'R$ 45k',status:'ativo',initials:'JS',bg:'linear-gradient(135deg,#6B3A1F,#A3612A)'},
  {name:'Indústria ABC Ltda',tipo:'CNPJ',doc:'55.666.777/0001-88',tel:'(11) 3000-4000',obras:1,total:'R$ 215k',status:'ativo',initials:'AB',bg:'linear-gradient(135deg,#1A1D24,#3A4055)'},
  {name:'Rio Negro Serviços',tipo:'CNPJ',doc:'44.555.666/0001-77',tel:'(62) 3847-0000',obras:4,total:'R$ 128k',status:'inativo',initials:'RN',bg:'linear-gradient(135deg,#3B3B1A,#8A8A2A)'},
  {name:'Clínica Saúde Total',tipo:'CNPJ',doc:'33.444.555/0001-66',tel:'(11) 4003-8888',obras:1,total:'R$ 9k',status:'ativo',initials:'ST',bg:'linear-gradient(135deg,#1A4B3B,#2A8A6B)'},
];

const orcPreviewItems = [
  {desc:'Cabeamento elétrico 2,5mm — 200m',qtd:200,unit:'R$ 2,40',total:'R$ 480'},
  {desc:'Quadro distribuição 24 disjuntores',qtd:2,unit:'R$ 380,00',total:'R$ 760'},
  {desc:'Instalação pontos tomadas (50un)',qtd:50,unit:'R$ 80,00',total:'R$ 4.000'},
  {desc:'Instalação luminárias LED',qtd:30,unit:'R$ 120,00',total:'R$ 3.600'},
  {desc:'Mão de obra — equipe 4 pessoas · 5 dias',qtd:1,unit:'R$ 12.800',total:'R$ 12.800'},
];

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
  document.querySelectorAll('.view').forEach((section) => {
    section.style.display = 'none';
  });

  document.getElementById('view-obra-detail').style.display = 'block';
  document.getElementById('view-obra-detail').className = 'view fade-in';
  document.getElementById('topbar-breadcrumb').innerHTML = `<span>REIS FLOW</span><span class="sep">/</span><span onclick="navigate('obras',null)" style="cursor:pointer;color:var(--petrol-light)">Obras</span><span class="sep">/</span><span class="cur">${code}</span>`;
  populateObraDetail(code);
}

function populateObras() {
  const tbody = document.getElementById('obras-tbody');
  if (tbody && tbody.children.length === 0) {
    obras.forEach((obra) => {
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
    const items = obras.filter((obra) => obra.status === column.key);
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
    tbody.innerHTML += `<tr>
      <td class="mono">${orcamento.code}</td>
      <td>${orcamento.client}</td>
      <td class="muted">${orcamento.desc}</td>
      <td><span style="font-weight:600;color:var(--petrol-light)">${orcamento.valor}</span></td>
      <td><span class="profit-up"><i class="ti ti-trending-up"></i>${orcamento.margem}</span></td>
      <td class="muted">${orcamento.validade}</td>
      <td>${statusBadge(orcamento.status)}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="showToast('Visualizar PDF','info')"><i class="ti ti-file-type-pdf"></i></button>
        <button class="btn btn-ghost btn-xs" onclick="showToast('Enviar orçamento','success')"><i class="ti ti-send"></i></button>
      </div></td>
    </tr>`;
  });
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
    const [resObras, resOrc, resCli] = await Promise.all([
      db.from('obras').select('*, clientes(nome)').order('created_at', { ascending: false }),
      db.from('orcamentos').select('*, clientes(nome)').order('created_at', { ascending: false }),
      db.from('clientes').select('*').order('nome')
    ]);

    // Sobrescreve os arrays do sistema com dados reais
    if (resObras.data && resObras.data.length > 0) {
      obras.length = 0;
      resObras.data.forEach(o => {
        obras.push({
          code: o.codigo,
          name: o.nome,
          client: o.clientes?.nome || '—',
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

    if (resOrc.data && resOrc.data.length > 0) {
      orcamentos.length = 0;
      resOrc.data.forEach(o => {
        orcamentos.push({
          code: o.codigo,
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

    if (resCli.data && resCli.data.length > 0) {
      clientes.length = 0;
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
        clientes.push({
          name: c.nome,
          tipo: c.tipo_documento,
          doc: c.documento,
          tel: c.telefone || '—',
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
  } catch (err) {
    console.warn('Supabase não configurado — usando dados de exemplo.', err);
  }
}

function populateClientes() {
  const tbody = document.getElementById('cli-tbody');
  if (!tbody || tbody.children.length > 0) return;

  clientes.forEach((cliente) => {
    tbody.innerHTML += `<tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar-sm avatar" style="background:${cliente.bg}">${cliente.initials}</div><div><div class="bold">${cliente.name}</div><div style="font-size:11px;color:var(--text-muted)">${cliente.tipo}</div></div></div></td>
      <td class="mono" style="font-size:11px">${cliente.doc}</td>
      <td class="muted">${cliente.tel}</td>
      <td><span class="badge badge-info">${cliente.obras} obras</span></td>
      <td><span class="profit-up"><i class="ti ti-trending-up"></i>${cliente.total}</span></td>
      <td>${statusBadge(cliente.status)}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs"><i class="ti ti-eye"></i></button>
        <button class="btn btn-ghost btn-xs"><i class="ti ti-edit"></i></button>
        <button class="btn btn-ghost btn-xs"><i class="ti ti-phone"></i></button>
      </div></td>
    </tr>`;
  });
}
