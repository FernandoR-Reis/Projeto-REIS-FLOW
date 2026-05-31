// =============================================================
//  REIS FLOW — CRUD: salvar dados reais no Supabase
//  Cada função lê os campos do modal, valida e grava no banco.
// =============================================================

// Gera um código sequencial simples baseado na data/hora
function gerarCodigo(prefixo) {
  const agora = Date.now().toString().slice(-5);
  return `${prefixo}-${agora}`;
}

const CRUD_DEMO_CLIENTES_STORAGE_KEY = 'reisflow_demo_clientes';

function isErroPermissao(error) {
  if (!error) return false;
  const msg = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return error.code === '42501'
    || error.status === 401
    || error.status === 403
    || msg.includes('row-level security')
    || msg.includes('permission denied')
    || msg.includes('jwt')
    || msg.includes('not authenticated')
    || msg.includes('violates row-level security policy');
}

function lerClientesDemoLocal() {
  try {
    const raw = localStorage.getItem(CRUD_DEMO_CLIENTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function salvarClientesDemoLocal(lista) {
  localStorage.setItem(CRUD_DEMO_CLIENTES_STORAGE_KEY, JSON.stringify(lista));
}

function cadastrarClienteEmModoDemo({ nome, tipo, doc, tel }) {
  const docLimpo = String(doc || '').replace(/\D/g, '');
  const lista = lerClientesDemoLocal();

  const jaExiste = lista.some((c) => String(c.doc || '').replace(/\D/g, '') === docLimpo)
    || clientes.some((c) => String(c.doc || '').replace(/\D/g, '') === docLimpo);

  if (jaExiste) {
    showToast('Já existe um cliente com este CPF/CNPJ', 'warning');
    return false;
  }

  lista.push({ name: nome, tipo, doc, tel, status: 'ativo' });
  salvarClientesDemoLocal(lista);

  const partes = nome.split(' ').filter(Boolean);
  const iniciais = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : nome.slice(0, 2);
  const cores = [
    'linear-gradient(135deg,#1B4F6B,#2176A3)',
    'linear-gradient(135deg,#4A1B8F,#7B3FC4)',
    'linear-gradient(135deg,#0F6E56,#1D9E75)',
    'linear-gradient(135deg,#6B3A1F,#A3612A)',
    'linear-gradient(135deg,#1A1D24,#3A4055)',
    'linear-gradient(135deg,#3B3B1A,#8A8A2A)'
  ];

  clientes.push({
    name: nome,
    tipo,
    doc,
    tel: tel || '—',
    obras: 0,
    total: 'R$ —',
    status: 'ativo',
    initials: String(iniciais || 'CL').toUpperCase(),
    bg: cores[clientes.length % cores.length]
  });

  const cliTbody = document.getElementById('cli-tbody');
  if (cliTbody) cliTbody.innerHTML = '';
  populateClientes();
  carregarClientesNoSelect('obra-cliente-id');
  carregarClientesNoSelect('orc-cliente-id');

  showToast(`${nome} cadastrado em modo demo local`, 'success');
  return true;
}

// Converte "R$ 148.000" ou "148000" para número
function parseMoeda(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Preenche o <select> de clientes em um modal a partir do banco
async function carregarClientesNoSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  const { data, error } = await db.from('clientes').select('id, nome').order('nome');
  if (error || !data) return;

  sel.innerHTML = '<option value="">Selecione um cliente</option>';
  data.forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
}

// Chama quando os modais de obra e orçamento forem abertos
document.addEventListener('DOMContentLoaded', () => {
  // Pré-carrega quando a página termina de montar
  // (Os selects só ficam corretos depois do login, mas não tem problema)
  setTimeout(() => {
    carregarClientesNoSelect('obra-cliente-id');
    carregarClientesNoSelect('orc-cliente-id');
  }, 1500);
});

// Observa quando um modal abre para recarregar os selects
const _openModalOriginal = window.openModal;
window.openModal = function(id) {
  _openModalOriginal(id);
  if (id === 'modal-nova-obra') carregarClientesNoSelect('obra-cliente-id');
  if (id === 'modal-novo-orc')  carregarClientesNoSelect('orc-cliente-id');
};


// -------------------------------------------------------------
//  SALVAR OBRA
// -------------------------------------------------------------
async function salvarObra() {
  const nome          = document.getElementById('obra-nome').value.trim();
  const clienteId     = document.getElementById('obra-cliente-id').value;
  const responsavel   = document.getElementById('obra-responsavel').value.trim();
  const localizacao   = document.getElementById('obra-localizacao').value.trim();
  const prazo         = document.getElementById('obra-prazo').value || null;
  const valorRaw      = document.getElementById('obra-valor').value;
  const valor         = parseMoeda(valorRaw);

  if (!nome) { showToast('Informe o título da obra', 'warning'); return; }
  if (!clienteId) { showToast('Selecione um cliente', 'warning'); return; }

  const codigo = gerarCodigo('OB');

  const { error } = await db.from('obras').insert({
    codigo,
    nome,
    cliente_id: clienteId,
    responsavel_nome: responsavel || null,
    localizacao: localizacao || null,
    prazo: prazo,
    valor,
    status: 'orcamento'
  });

  if (error) {
    console.error(error);
    showToast('Erro ao salvar obra: ' + error.message, 'error');
    return;
  }

  showToast(`Obra ${codigo} criada com sucesso!`, 'success');
  closeModal('modal-nova-obra');

  // Limpa campos
  ['obra-nome', 'obra-responsavel', 'obra-localizacao', 'obra-prazo', 'obra-valor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Recarrega a lista de obras da view atual
  const tbody = document.getElementById('obras-tbody');
  if (tbody) tbody.innerHTML = '';
  const kanban = document.getElementById('obras-kanban');
  if (kanban) kanban.innerHTML = '';
  await loadAllData();
  populateObras();
}


// -------------------------------------------------------------
//  SALVAR ORÇAMENTO
// -------------------------------------------------------------
async function salvarOrcamento() {
  const clienteId  = document.getElementById('orc-cliente-id').value;
  const descricao  = document.getElementById('orc-descricao').value.trim();
  const validade   = document.getElementById('orc-validade').value || null;
  const margem     = parseFloat(document.getElementById('modal-margem').value) || 0;

  // Calcula o valor total a partir das linhas do modal
  let subtotal = 0;
  document.querySelectorAll('#orc-modal-lines .budget-line').forEach(line => {
    const inputs = line.querySelectorAll('input');
    subtotal += (parseFloat(inputs[1].value) || 0) * (parseFloat(inputs[2].value) || 0);
  });
  const desconto     = parseFloat(document.getElementById('modal-desconto').value) || 0;
  const deslocamento = parseFloat(document.getElementById('modal-desloc').value) || 0;
  const valor        = subtotal + subtotal * (margem / 100) + deslocamento - desconto;

  if (!clienteId) { showToast('Selecione um cliente', 'warning'); return; }
  if (!descricao) { showToast('Informe a descrição do serviço', 'warning'); return; }

  const codigo = gerarCodigo('ORC');

  const { data: orcData, error: orcError } = await db.from('orcamentos').insert({
    codigo,
    cliente_id: clienteId,
    descricao,
    valor: valor > 0 ? valor : 0,
    margem_percentual: margem,
    validade,
    status: 'pendente'
  }).select().single();

  if (orcError) {
    console.error(orcError);
    showToast('Erro ao salvar orçamento: ' + orcError.message, 'error');
    return;
  }

  // Salva os itens do orçamento
  const linhas = [];
  document.querySelectorAll('#orc-modal-lines .budget-line').forEach(line => {
    const inputs = line.querySelectorAll('input');
    const desc  = inputs[0].value.trim();
    const qtd   = parseFloat(inputs[1].value) || 1;
    const unit  = parseFloat(inputs[2].value) || 0;
    if (desc) linhas.push({ orcamento_id: orcData.id, descricao: desc, quantidade: qtd, valor_unitario: unit });
  });

  if (linhas.length > 0) {
    await db.from('orcamento_itens').insert(linhas);
  }

  showToast(`Orçamento ${codigo} criado!`, 'success');
  closeModal('modal-novo-orc');

  // Limpa campos e recarrega lista
  document.getElementById('orc-descricao').value = '';
  document.getElementById('orc-validade').value  = '';
  document.getElementById('orc-modal-lines').innerHTML = `
    <div class="budget-line"><input placeholder="Serviço / Material" style="grid-column:1"><input value="1" style="width:100%;text-align:center" oninput="calcLine(this)"><input value="0" placeholder="R$ 0,00" oninput="calcLine(this)"><span class="line-total" style="text-align:right;font-weight:600;color:var(--petrol-light)">R$ 0</span><button onclick="this.parentElement.remove();calcTotals()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:15px"><i class="ti ti-x"></i></button></div>`;
  calcTotals();

  const orcTbody = document.getElementById('orc-tbody');
  if (orcTbody) orcTbody.innerHTML = '';
  await loadAllData();
  populateOrc();
}


// -------------------------------------------------------------
//  SALVAR CLIENTE
// -------------------------------------------------------------
async function salvarCliente() {
  const nome  = document.getElementById('cli-nome').value.trim();
  const tipo  = document.getElementById('cli-tipo').value;
  const doc   = document.getElementById('cli-doc').value.trim();
  const tel   = document.getElementById('cli-tel').value.trim();

  if (!nome) { showToast('Informe o nome do cliente', 'warning'); return; }
  if (!doc)  { showToast('Informe o CPF ou CNPJ', 'warning'); return; }

  const { data: sessionInfo } = await db.auth.getSession();
  const modoDemoSemSessao = sessionStorage.getItem('reisflow_admin_local') === '1' && !sessionInfo?.session;

  if (modoDemoSemSessao) {
    const ok = cadastrarClienteEmModoDemo({ nome, tipo, doc, tel });
    if (!ok) return;
    closeModal('modal-novo-cliente');
    ['cli-nome', 'cli-doc', 'cli-tel', 'cli-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    return;
  }

  const { error } = await db.from('clientes').insert({
    nome,
    tipo_documento: tipo,
    documento: doc,
    telefone: tel || null,
    status: 'ativo'
  });

  if (error) {
    if (error.code === '23505') {
      showToast('Já existe um cliente com este CPF/CNPJ', 'warning');
    } else if (isErroPermissao(error)) {
      const ok = cadastrarClienteEmModoDemo({ nome, tipo, doc, tel });
      if (!ok) return;
      closeModal('modal-novo-cliente');
      ['cli-nome', 'cli-doc', 'cli-tel', 'cli-email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      showToast('Sem permissão no banco. Cliente salvo em modo demo local.', 'warning');
      return;
    } else {
      showToast('Erro ao salvar cliente: ' + error.message, 'error');
    }
    return;
  }

  showToast(`${nome} cadastrado com sucesso!`, 'success');
  closeModal('modal-novo-cliente');

  // Limpa campos
  ['cli-nome', 'cli-doc', 'cli-tel', 'cli-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Recarrega lista de clientes
  const cliTbody = document.getElementById('cli-tbody');
  if (cliTbody) cliTbody.innerHTML = '';
  await loadAllData();
  populateClientes();

  // Atualiza os selects de cliente nos modais
  carregarClientesNoSelect('obra-cliente-id');
  carregarClientesNoSelect('orc-cliente-id');
}
