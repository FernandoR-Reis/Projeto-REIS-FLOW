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
const CLIENTE_EMAILS_STORAGE_KEY = 'reisflow_cliente_emails';

function lerMapaEmailsClientes() {
  try {
    const raw = localStorage.getItem(CLIENTE_EMAILS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function salvarMapaEmailsClientes(mapa) {
  localStorage.setItem(CLIENTE_EMAILS_STORAGE_KEY, JSON.stringify(mapa || {}));
}

function salvarEmailClientePorDoc(doc, email) {
  const chave = String(doc || '').replace(/\D/g, '');
  if (!chave) return;

  const mapa = lerMapaEmailsClientes();
  const valor = String(email || '').trim();
  if (valor) {
    mapa[chave] = valor;
  } else {
    delete mapa[chave];
  }
  salvarMapaEmailsClientes(mapa);
}

function getClienteEmailByDoc(doc) {
  const chave = String(doc || '').replace(/\D/g, '');
  if (!chave) return '';
  const mapa = lerMapaEmailsClientes();
  return String(mapa[chave] || '').trim();
}

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

// Converte "R$ 148.000" ou "148000" para número
function parseMoeda(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function getValidadeAutomaticaIso() {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatarDataPtBr(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function createOrcamentoLineHtml(desc = '', qtd = 1, unit = 0) {
  const descEscaped = String(desc || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const quantidade = Number(qtd) > 0 ? Number(qtd) : 1;
  const valorUnit = Number(unit) > 0 ? Number(unit) : 0;
  const total = Math.round(quantidade * valorUnit).toLocaleString('pt-BR');

  return `<div class="budget-line"><input placeholder="Serviço / Material" value="${descEscaped}" style="grid-column:1"><input value="${quantidade}" style="width:100%;text-align:center" oninput="calcLine(this)"><input value="${valorUnit}" placeholder="R$ 0,00" oninput="calcLine(this)"><span class="line-total" style="text-align:right;font-weight:600;color:var(--petrol-light)">R$ ${total}</span><button onclick="this.parentElement.remove();calcTotals()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:15px"><i class="ti ti-x"></i></button></div>`;
}

function resetOrcamentoModal() {
  const title = document.getElementById('modal-orc-title');
  const btnSalvar = document.getElementById('btn-salvar-orc');
  const editId = document.getElementById('orc-edit-id');
  const validadeInfo = document.getElementById('orc-validade-info');

  if (title) {
    title.innerHTML = '<i class="ti ti-file-dollar" style="margin-right:8px;color:var(--petrol-light)"></i>Novo Orçamento';
  }
  if (btnSalvar) {
    btnSalvar.innerHTML = '<i class="ti ti-check"></i>Salvar orçamento';
  }
  if (editId) editId.value = '';

  const clienteSel = document.getElementById('orc-cliente-id');
  if (clienteSel) clienteSel.value = '';
  const descricao = document.getElementById('orc-descricao');
  if (descricao) descricao.value = '';

  const margem = document.getElementById('modal-margem');
  const desconto = document.getElementById('modal-desconto');
  const desloc = document.getElementById('modal-desloc');
  if (margem) margem.value = '30';
  if (desconto) desconto.value = '0';
  if (desloc) desloc.value = '0';

  const linhas = document.getElementById('orc-modal-lines');
  if (linhas) {
    linhas.innerHTML = createOrcamentoLineHtml();
  }

  if (validadeInfo) {
    validadeInfo.textContent = `Validade automática: ${formatarDataPtBr(getValidadeAutomaticaIso())} (15 dias).`;
  }

  if (typeof calcTotals === 'function') calcTotals();
}

async function editOrcamento(orcamentoId) {
  const id = String(orcamentoId || '').trim();
  if (!id) {
    showToast('Orçamento sem identificador para edição.', 'warning');
    return;
  }

  const registro = (Array.isArray(orcamentos) ? orcamentos : []).find((o) => String(o.id || '') === id);
  if (!registro) {
    showToast('Orçamento não encontrado para edição.', 'warning');
    return;
  }

  openModal('modal-novo-orc');

  if (typeof carregarClientesNoSelect === 'function') {
    await carregarClientesNoSelect('orc-cliente-id');
  }

  const title = document.getElementById('modal-orc-title');
  const btnSalvar = document.getElementById('btn-salvar-orc');
  const editId = document.getElementById('orc-edit-id');
  const clienteSel = document.getElementById('orc-cliente-id');
  const descricao = document.getElementById('orc-descricao');
  const margem = document.getElementById('modal-margem');
  const validadeInfo = document.getElementById('orc-validade-info');

  if (title) {
    title.innerHTML = '<i class="ti ti-edit" style="margin-right:8px;color:var(--petrol-light)"></i>Editar Orçamento';
  }
  if (btnSalvar) {
    btnSalvar.innerHTML = '<i class="ti ti-device-floppy"></i>Salvar alterações';
  }
  if (editId) editId.value = id;
  if (clienteSel) clienteSel.value = registro.clientId || '';
  if (descricao) descricao.value = registro.desc || '';
  if (margem) margem.value = String(parseFloat(String(registro.margem || '').replace(',', '.')) || 0);
  if (validadeInfo) {
    validadeInfo.textContent = `Validade atual: ${registro.validade || '—'} · nova validade automática ao salvar: ${formatarDataPtBr(getValidadeAutomaticaIso())}.`;
  }

  const linhas = document.getElementById('orc-modal-lines');
  if (!linhas) return;

  const { data: itens, error } = await db
    .from('orcamento_itens')
    .select('descricao, quantidade, valor_unitario')
    .eq('orcamento_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    showToast('Falha ao carregar itens para edição.', 'warning');
    linhas.innerHTML = createOrcamentoLineHtml();
    calcTotals();
    return;
  }

  linhas.innerHTML = '';
  if (Array.isArray(itens) && itens.length > 0) {
    itens.forEach((item) => {
      linhas.insertAdjacentHTML('beforeend', createOrcamentoLineHtml(item.descricao, item.quantidade, item.valor_unitario));
    });
  } else {
    linhas.innerHTML = createOrcamentoLineHtml();
  }

  if (typeof calcTotals === 'function') calcTotals();
}

function somenteDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function formatarCpf(digitos) {
  const d = somenteDigitos(digitos).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarCnpj(digitos) {
  const d = somenteDigitos(digitos).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatarDocumentoPorTipo(valor, tipo) {
  const digitos = somenteDigitos(valor);
  return tipo === 'CPF' ? formatarCpf(digitos) : formatarCnpj(digitos);
}

function formatarTelefoneBr(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function setClienteDocType(tipo) {
  const tipoEl = document.getElementById('cli-tipo');
  const docEl = document.getElementById('cli-doc');
  const btnCpf = document.getElementById('cli-tipo-cpf');
  const btnCnpj = document.getElementById('cli-tipo-cnpj');

  if (!tipoEl || !docEl || !btnCpf || !btnCnpj) return;

  const tipoFinal = tipo === 'CPF' ? 'CPF' : 'CNPJ';
  tipoEl.value = tipoFinal;

  btnCpf.classList.toggle('active', tipoFinal === 'CPF');
  btnCnpj.classList.toggle('active', tipoFinal === 'CNPJ');

  docEl.placeholder = tipoFinal === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00';
  docEl.value = formatarDocumentoPorTipo(docEl.value, tipoFinal);
}

function aplicarMascarasClienteCampos() {
  const tipoEl = document.getElementById('cli-tipo');
  const docEl = document.getElementById('cli-doc');
  const telEl = document.getElementById('cli-tel');

  if (!tipoEl || !docEl || !telEl) return;

  const atualizarDocumento = () => {
    const tipo = tipoEl.value === 'CPF' ? 'CPF' : 'CNPJ';
    setClienteDocType(tipo);
  };

  const atualizarTelefone = () => {
    telEl.value = formatarTelefoneBr(telEl.value);
  };

  atualizarDocumento();
  atualizarTelefone();

  if (!docEl.dataset.maskBound) {
    docEl.addEventListener('input', atualizarDocumento);
    docEl.addEventListener('blur', atualizarDocumento);
    docEl.dataset.maskBound = '1';
  }

  if (!telEl.dataset.maskBound) {
    telEl.addEventListener('input', atualizarTelefone);
    telEl.addEventListener('blur', atualizarTelefone);
    telEl.dataset.maskBound = '1';
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

async function resolverClienteId(valorSelecionado, selectId) {
  const valor = String(valorSelecionado || '').trim();
  if (!valor) return null;
  if (isUuid(valor)) return valor;

  const select = document.getElementById(selectId);
  const selectedOption = select?.selectedOptions?.[0];
  const nomeSelecionado = String(selectedOption?.textContent || '').trim();

  let chaveLocal = '';
  if (valor.startsWith('local:')) {
    try {
      chaveLocal = decodeURIComponent(valor.slice(6));
    } catch {
      chaveLocal = valor.slice(6);
    }
  }

  const docRef = String(chaveLocal || '').replace(/\D/g, '');
  const nomeRef = String(nomeSelecionado || chaveLocal || '').trim().toLowerCase();

  if (nomeRef && Array.isArray(obras)) {
    const fromObras = obras.find((item) => {
      const nomeObra = String(item.client || '').trim().toLowerCase();
      return nomeObra === nomeRef && isUuid(item.clientId);
    });
    if (fromObras?.clientId) return fromObras.clientId;
  }

  try {
    const { data, error } = await db.from('clientes').select('id, nome, documento');
    if (error || !Array.isArray(data)) return null;

    const encontrado = data.find((item) => {
      const docItem = String(item.documento || '').replace(/\D/g, '');
      const nomeItem = String(item.nome || '').trim().toLowerCase();
      if (docRef && docItem && docRef === docItem) return true;
      if (nomeRef && nomeItem && nomeRef === nomeItem) return true;
      return false;
    });

    if (encontrado?.id) return encontrado.id;

    // Se vier de fallback local, tenta criar o cliente no banco para obter UUID.
    if (valor.startsWith('local:')) {
      const nomeNovo = nomeSelecionado || (chaveLocal && !docRef ? chaveLocal : 'Cliente sem nome');
      const docNovo = chaveLocal || null;
      const tipoDocumento = docRef.length === 11 ? 'CPF' : 'CNPJ';

      const payload = {
        nome: nomeNovo,
        documento: docNovo,
        tipo_documento: tipoDocumento,
        telefone: null,
        email: null,
        status: 'ativo'
      };

      const { data: created, error: createError } = await db
        .from('clientes')
        .insert(payload)
        .select('id')
        .single();

      if (!createError && created?.id) {
        return created.id;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function adicionarClienteNoMapa(mapa, registro) {
  if (!registro) return;

  const nome = String(registro.nome || registro.name || '').trim();
  if (!nome) return;

  const doc = String(registro.documento || registro.doc || '').trim();
  const docKey = doc ? doc.replace(/\D/g, '') : '';
  const nomeKey = nome.toLowerCase();
  const key = docKey || nomeKey;

  if (mapa.has(key)) return;

  mapa.set(key, {
    id: registro.id || null,
    nome,
    doc
  });
}

function obterNomeClienteSelecionado(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return 'Cliente não informado';
  const opt = select.selectedOptions?.[0];
  return String(opt?.textContent || 'Cliente não informado').trim() || 'Cliente não informado';
}

function salvarObraEmModoDemoLocal({ codigo, nome, clienteNome, responsavel, localizacao, prazo, valor }) {
  const prazoFmt = prazo
    ? new Date(`${prazo}T00:00:00`).toLocaleDateString('pt-BR')
    : '—';

  const valorFmt = `R$ ${Number(valor || 0).toLocaleString('pt-BR')}`;

  obras.unshift({
    code: codigo,
    name: nome,
    client: clienteNome,
    resp: responsavel || '—',
    prazo: prazoFmt,
    valor: valorFmt,
    status: 'orcamento',
    location: localizacao || '—'
  });
}

function parseCurrencyTextToNumber(text) {
  if (!text) return 0;
  const normalized = String(text).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return Number(normalized) || 0;
}

function adicionarOrcamentoNoMapa(mapa, registro) {
  if (!registro) return;

  const code = String(registro.codigo || registro.code || '').trim();
  if (!code || mapa.has(code)) return;

  const client = String(registro.clientes?.nome || registro.client || '').trim();
  const desc = String(registro.descricao || registro.desc || '').trim();
  const status = String(registro.status || 'pendente').trim();
  const value = typeof registro.valor === 'number'
    ? registro.valor
    : parseCurrencyTextToNumber(registro.valor);

  mapa.set(code, {
    id: registro.id || null,
    code,
    clientId: registro.cliente_id || registro.clientId || null,
    client,
    desc,
    value,
    status
  });
}

async function obterOrcamentosParaSelect() {
  const mapa = new Map();

  try {
    const { data } = await db.from('orcamentos').select('id, codigo, descricao, valor, status, cliente_id, clientes(nome)').order('created_at', { ascending: false });
    if (Array.isArray(data)) {
      data.forEach((o) => adicionarOrcamentoNoMapa(mapa, o));
    }
  } catch {
    // Ignora falha no banco e usa fallback local.
  }

  if (Array.isArray(orcamentos)) {
    orcamentos.forEach((o) => adicionarOrcamentoNoMapa(mapa, o));
  }

  return Array.from(mapa.values());
}

async function carregarOrcamentosNoSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  const lista = await obterOrcamentosParaSelect();

  sel.innerHTML = '<option value="">Selecione um orçamento</option>';
  lista.forEach((o) => {
    const value = o.id || `local-orc:${encodeURIComponent(o.code)}`;
    const valorFmt = Number(o.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    sel.innerHTML += `<option value="${value}" data-code="${o.code}" data-client="${o.client}" data-client-id="${o.clientId || ''}" data-valor="${o.value || 0}" data-desc="${o.desc || ''}">${o.code} — ${o.client || 'Cliente não informado'} — ${valorFmt}</option>`;
  });
}

function onObraOrcamentoChange() {
  const select = document.getElementById('obra-orcamento-id');
  const clientInput = document.getElementById('obra-cliente-nome');
  const titleInput = document.getElementById('obra-nome');
  const valueInput = document.getElementById('obra-valor');
  if (!select || !clientInput) return;

  const selected = select.selectedOptions?.[0];
  if (!selected || !selected.value) {
    clientInput.value = '';
    return;
  }

  const clientName = selected.getAttribute('data-client') || '';
  const desc = selected.getAttribute('data-desc') || '';
  const valor = Number(selected.getAttribute('data-valor') || 0);

  clientInput.value = clientName;
  if (titleInput && !titleInput.value.trim() && desc) {
    titleInput.value = desc;
  }
  if (valueInput && (!valueInput.value || parseMoeda(valueInput.value) === 0) && valor > 0) {
    valueInput.value = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

async function obterClientesParaSelect() {
  const mapa = new Map();

  try {
    const { data } = await db.from('clientes').select('id, nome, documento').order('nome');
    if (Array.isArray(data)) {
      data.forEach((c) => adicionarClienteNoMapa(mapa, c));
    }
  } catch {
    // Ignora falha do banco e usa fallback local.
  }

  if (Array.isArray(clientes)) {
    clientes.forEach((c) => adicionarClienteNoMapa(mapa, c));
  }

  lerClientesDemoLocal().forEach((c) => adicionarClienteNoMapa(mapa, c));

  return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// Preenche o <select> de clientes em um modal com banco + fallback local
async function carregarClientesNoSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  const lista = await obterClientesParaSelect();

  sel.innerHTML = '<option value="">Selecione um cliente</option>';
  lista.forEach((c) => {
    const value = c.id || `local:${encodeURIComponent(c.doc || c.nome)}`;
    sel.innerHTML += `<option value="${value}">${c.nome}</option>`;
  });
}

// Chama quando os modais de obra e orçamento forem abertos
document.addEventListener('DOMContentLoaded', () => {
  aplicarMascarasClienteCampos();
  resetOrcamentoModal();

  // Pré-carrega quando a página termina de montar
  // (Os selects só ficam corretos depois do login, mas não tem problema)
  setTimeout(() => {
    carregarOrcamentosNoSelect('obra-orcamento-id');
    carregarClientesNoSelect('orc-cliente-id');
    carregarClientesNoSelect('fin-cliente-id');
  }, 1500);
});

// Observa quando um modal abre para recarregar os selects
const _openModalOriginal = window.openModal;
window.openModal = function(id) {
  _openModalOriginal(id);
  if (id === 'modal-nova-obra') {
    carregarOrcamentosNoSelect('obra-orcamento-id');
    const clientName = document.getElementById('obra-cliente-nome');
    if (clientName) clientName.value = '';
  }
  if (id === 'modal-novo-orc')  carregarClientesNoSelect('orc-cliente-id');
  if (id === 'modal-novo-orc')  resetOrcamentoModal();
  if (id === 'modal-lancamento') carregarClientesNoSelect('fin-cliente-id');
  if (id === 'modal-novo-cliente') aplicarMascarasClienteCampos();
};


// -------------------------------------------------------------
//  SALVAR OBRA
// -------------------------------------------------------------
async function salvarObra() {
  const nome          = document.getElementById('obra-nome').value.trim();
  const orcamentoRaw  = document.getElementById('obra-orcamento-id').value;
  const orcamentoOpt  = document.getElementById('obra-orcamento-id').selectedOptions?.[0] || null;
  const responsavel   = document.getElementById('obra-responsavel').value.trim();
  const localizacao   = document.getElementById('obra-localizacao').value.trim();
  const prazo         = document.getElementById('obra-prazo').value || null;
  const valorRaw      = document.getElementById('obra-valor').value;
  const valor         = parseMoeda(valorRaw);

  if (!nome) { showToast('Informe o título da obra', 'warning'); return; }
  if (!orcamentoRaw) { showToast('Selecione um orçamento para criar a obra', 'warning'); return; }

  const clienteRaw = orcamentoOpt?.getAttribute('data-client-id') || '';
  const clienteNome = orcamentoOpt?.getAttribute('data-client') || 'Cliente não informado';

  const clienteId = await resolverClienteId(clienteRaw, 'obra-orcamento-id');
  const codigo = gerarCodigo('OB');

  if (!clienteId) {
    showToast('Cliente sem ID válido no banco. Cadastro local está desativado.', 'warning');
    return;
  }

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
  ['obra-nome', 'obra-responsavel', 'obra-localizacao', 'obra-prazo', 'obra-valor', 'obra-cliente-nome'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const orcSelect = document.getElementById('obra-orcamento-id');
  if (orcSelect) orcSelect.value = '';

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
  const orcamentoEditId = document.getElementById('orc-edit-id')?.value?.trim() || '';
  const clienteRaw = document.getElementById('orc-cliente-id').value;
  const descricao  = document.getElementById('orc-descricao').value.trim();
  const validade   = getValidadeAutomaticaIso();
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

  if (!clienteRaw) { showToast('Selecione um cliente', 'warning'); return; }

  const clienteId = await resolverClienteId(clienteRaw, 'orc-cliente-id');
  if (!clienteId) {
    showToast('Cliente sem ID válido no banco. Atualize o cadastro do cliente e tente novamente.', 'warning');
    return;
  }

  if (!descricao) { showToast('Informe a descrição do serviço', 'warning'); return; }

  let orcData = null;
  let orcError = null;
  let codigo = '';

  if (orcamentoEditId) {
    const result = await db
      .from('orcamentos')
      .update({
        cliente_id: clienteId,
        descricao,
        valor: valor > 0 ? valor : 0,
        margem_percentual: margem,
        validade
      })
      .eq('id', orcamentoEditId)
      .select('id, codigo')
      .single();

    orcData = result.data;
    orcError = result.error;
    codigo = result.data?.codigo || '';
  } else {
    codigo = gerarCodigo('ORC');
    const result = await db.from('orcamentos').insert({
      codigo,
      cliente_id: clienteId,
      descricao,
      valor: valor > 0 ? valor : 0,
      margem_percentual: margem,
      validade,
      status: 'pendente'
    }).select('id, codigo').single();

    orcData = result.data;
    orcError = result.error;
    codigo = result.data?.codigo || codigo;
  }

  if (orcError) {
    console.error(orcError);
    showToast('Erro ao salvar orçamento: ' + orcError.message, 'error');
    return;
  }

  if (orcamentoEditId) {
    await db.from('orcamento_itens').delete().eq('orcamento_id', orcData.id);
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

  showToast(orcamentoEditId ? `Orçamento ${codigo} atualizado!` : `Orçamento ${codigo} criado!`, 'success');
  closeModal('modal-novo-orc');

  // Limpa campos e recarrega lista
  resetOrcamentoModal();

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
  const email = document.getElementById('cli-email').value.trim();
  const editDoc = document.getElementById('cli-edit-doc')?.value?.trim() || '';
  const isEditMode = !!editDoc;

  if (!nome) { showToast('Informe o nome do cliente', 'warning'); return; }
  if (!doc)  { showToast('Informe o CPF ou CNPJ', 'warning'); return; }
  if (!tel)  { showToast('Informe o telefone do cliente', 'warning'); return; }
  if (!email) { showToast('Informe o e-mail do cliente', 'warning'); return; }

  const docDigits = String(doc).replace(/\D/g, '');
  if (tipo === 'CPF' && docDigits.length !== 11) {
    showToast('CPF inválido. Informe os 11 dígitos.', 'warning');
    return;
  }
  if (tipo === 'CNPJ' && docDigits.length !== 14) {
    showToast('CNPJ inválido. Informe os 14 dígitos.', 'warning');
    return;
  }

  const telDigits = String(tel).replace(/\D/g, '');
  if (telDigits.length < 10 || telDigits.length > 11) {
    showToast('Telefone inválido. Use DDD + número (10 ou 11 dígitos).', 'warning');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('E-mail inválido. Verifique o formato informado.', 'warning');
    return;
  }

  let error = null;

  if (isEditMode) {
    const clienteAtual = typeof findClienteByDoc === 'function' ? findClienteByDoc(editDoc) : null;
    const clienteId = clienteAtual?.id || null;

    if (clienteId) {
      const result = await db.from('clientes').update({
        nome,
        tipo_documento: tipo,
        documento: doc,
        telefone: tel || null
      }).eq('id', clienteId);
      error = result.error || null;
    } else {
      const docOld = String(editDoc || '').replace(/\D/g, '');
      const index = clientes.findIndex((c) => String(c.doc || '').replace(/\D/g, '') === docOld);
      if (index >= 0) {
        clientes[index] = {
          ...clientes[index],
          name: nome,
          tipo,
          doc,
          tel: tel || '—',
          email: email || clientes[index].email || ''
        };
      }
    }
  } else {
    const result = await db.from('clientes').insert({
      nome,
      tipo_documento: tipo,
      documento: doc,
      telefone: tel || null,
      status: 'ativo'
    });
    error = result.error || null;
  }

  if (error) {
    if (error.code === '23505') {
      showToast('Já existe um cliente com este CPF/CNPJ', 'warning');
    } else {
      showToast('Erro ao salvar cliente: ' + error.message, 'error');
    }
    return;
  }

  salvarEmailClientePorDoc(doc, email);

  showToast(isEditMode ? `${nome} atualizado com sucesso!` : `${nome} cadastrado com sucesso!`, 'success');
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
  carregarOrcamentosNoSelect('obra-orcamento-id');
  carregarClientesNoSelect('orc-cliente-id');
}

async function toggleClienteStatus() {
  const editDoc = document.getElementById('cli-edit-doc')?.value?.trim() || '';
  const statusInput = document.getElementById('cli-current-status');
  const toggleBtn = document.getElementById('btn-toggle-cliente-status');

  if (!editDoc) {
    showToast('Abra um cliente em modo edição para alterar o status.', 'warning');
    return;
  }

  const clienteAtual = typeof findClienteByDoc === 'function' ? findClienteByDoc(editDoc) : null;
  if (!clienteAtual) {
    showToast('Cliente não encontrado para atualizar status.', 'warning');
    return;
  }

  const statusAtual = String(statusInput?.value || clienteAtual.status || 'ativo').toLowerCase() === 'inativo'
    ? 'inativo'
    : 'ativo';
  const novoStatus = statusAtual === 'ativo' ? 'inativo' : 'ativo';

  let error = null;
  if (clienteAtual.id) {
    const result = await db
      .from('clientes')
      .update({ status: novoStatus })
      .eq('id', clienteAtual.id);
    error = result.error || null;
  } else {
    const docRef = String(editDoc || '').replace(/\D/g, '');
    const index = clientes.findIndex((c) => String(c.doc || '').replace(/\D/g, '') === docRef);
    if (index >= 0) {
      clientes[index] = { ...clientes[index], status: novoStatus };
    }
  }

  if (error) {
    showToast('Erro ao alterar status do cliente: ' + error.message, 'error');
    return;
  }

  if (statusInput) statusInput.value = novoStatus;
  if (toggleBtn) {
    toggleBtn.innerHTML = novoStatus === 'ativo'
      ? '<i class="ti ti-user-x"></i>Inativar cliente'
      : '<i class="ti ti-user-check"></i>Ativar cliente';
  }

  showToast(`Cliente ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`, 'success');

  const cliTbody = document.getElementById('cli-tbody');
  if (cliTbody) cliTbody.innerHTML = '';
  await loadAllData();
  populateClientes();

  carregarOrcamentosNoSelect('obra-orcamento-id');
  carregarClientesNoSelect('orc-cliente-id');
}
