// =============================================================
//  REIS FLOW — Autenticação real com Supabase
// =============================================================

// Verifica se o usuário já está logado ao abrir o site.
// Se sim, vai direto para o sistema sem mostrar a tela de login.
window.addEventListener('DOMContentLoaded', async () => {
  if (isLocalAdminSession()) {
    goToApp('Administrador', 'admin');
    return;
  }

  const { data } = await db.auth.getSession();
  if (data.session) {
    await abrirComPerfil(data.session.user);
  }
});

function isLocalHost() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function isLocalAdminSession() {
  return isLocalHost() && sessionStorage.getItem('reisflow_admin_local') === '1';
}

function setLocalAdminSession(active) {
  if (active) {
    sessionStorage.setItem('reisflow_admin_local', '1');
  } else {
    sessionStorage.removeItem('reisflow_admin_local');
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LOGIN_LOADER_MODULES = [
  {
    icon: 'ti-building-factory-2',
    name: 'Obras',
    desc: 'Carregando cronogramas e projetos',
    iconColor: '#3AACDF',
    iconBg: 'rgba(33,118,163,0.14)',
    dotColor: '#3AACDF'
  },
  {
    icon: 'ti-cash',
    name: 'Financeiro',
    desc: 'Sincronizando indicadores financeiros',
    iconColor: '#2DD4A0',
    iconBg: 'rgba(45,212,160,0.12)',
    dotColor: '#2DD4A0'
  },
  {
    icon: 'ti-packages',
    name: 'Estoque',
    desc: 'Atualizando materiais e inventário',
    iconColor: '#F59533',
    iconBg: 'rgba(245,149,51,0.12)',
    dotColor: '#F59533'
  },
  {
    icon: 'ti-hard-hat',
    name: 'Equipe',
    desc: 'Organizando equipes e responsaveis',
    iconColor: '#A76EF6',
    iconBg: 'rgba(167,110,246,0.12)',
    dotColor: '#A76EF6'
  },
  {
    icon: 'ti-file-dollar',
    name: 'Orcamentos',
    desc: 'Preparando propostas e contratos',
    iconColor: '#3AACDF',
    iconBg: 'rgba(58,172,223,0.12)',
    dotColor: '#3AACDF'
  },
  {
    icon: 'ti-layout-dashboard',
    name: 'Dashboard',
    desc: 'Gerando indicadores estrategicos',
    iconColor: '#2DD4A0',
    iconBg: 'rgba(45,212,160,0.12)',
    dotColor: '#2DD4A0'
  },
  {
    icon: 'ti-robot',
    name: 'Tecnologia',
    desc: 'Processando automacoes e integracoes',
    iconColor: '#3AACDF',
    iconBg: 'rgba(33,118,163,0.14)',
    dotColor: '#3AACDF'
  }
];

const LOGIN_LOADER_PROGRESS = [
  'Sincronizando informacoes',
  'Validando dados',
  'Preparando relatorios',
  'Finalizando carregamento'
];

const LOGIN_TRANSITION_MS = 4000;

let loaderRunToken = 0;

function getLoginLoaderNodes() {
  return {
    overlay: document.getElementById('login-loading'),
    loader: document.getElementById('loader'),
    card: document.getElementById('module-card'),
    iconEl: document.getElementById('module-icon'),
    nameEl: document.getElementById('module-name'),
    descEl: document.getElementById('module-desc'),
    statusEl: document.getElementById('module-status'),
    fillEl: document.getElementById('progress-fill'),
    msgEl: document.getElementById('progress-msg'),
    doneEl: document.getElementById('done-overlay'),
    prepText: document.getElementById('preparing-text'),
    dotsRow: document.getElementById('dots-row'),
    stageEl: document.getElementById('module-stage'),
    replayBtn: document.getElementById('replay-btn'),
    themeBtns: document.querySelectorAll('#login-loading .theme-btn')
  };
}

function isLoaderTokenValid(token) {
  return token === loaderRunToken;
}

function loginLoaderSetTheme(theme) {
  const { loader, themeBtns } = getLoginLoaderNodes();
  if (!loader) return;
  loader.classList.toggle('light', theme === 'light');
  themeBtns.forEach((btn) => {
    const isActive = btn.dataset.theme === theme;
    btn.classList.toggle('active', isActive);
  });
}

function loginLoaderBuildDots(nodes) {
  if (!nodes.dotsRow) return;
  nodes.dotsRow.innerHTML = '';
  LOGIN_LOADER_MODULES.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.id = `dot-${index}`;
    nodes.dotsRow.appendChild(dot);
  });
}

function loginLoaderUpdateDots(index) {
  LOGIN_LOADER_MODULES.forEach((module, i) => {
    const dot = document.getElementById(`dot-${i}`);
    if (!dot) return;
    dot.classList.remove('done', 'current');
    dot.style.background = '';
    if (i < index) {
      dot.classList.add('done');
      dot.style.background = module.dotColor;
    } else if (i === index) {
      dot.classList.add('current');
      dot.style.background = module.dotColor;
    }
  });
}

function loginLoaderRenderSpinner(color) {
  const spinner = document.createElement('div');
  spinner.className = 'module-spinner';
  spinner.style.borderTopColor = color;
  return spinner;
}

function loginLoaderRenderDone() {
  const done = document.createElement('div');
  done.className = 'module-done';
  done.textContent = '✓';
  return done;
}

async function loginLoaderShowModule(nodes, index, token) {
  if (!isLoaderTokenValid(token)) return;
  const module = LOGIN_LOADER_MODULES[index];

  nodes.card.className = 'module-card';
  nodes.card.style.opacity = '0';

  await wait(40);
  if (!isLoaderTokenValid(token)) return;

  nodes.iconEl.style.background = module.iconBg;
  nodes.iconEl.innerHTML = `<i class="ti ${module.icon}" aria-hidden="true" style="font-size:21px;color:${module.iconColor}"></i>`;
  nodes.nameEl.textContent = module.name;
  nodes.descEl.textContent = module.desc;

  nodes.statusEl.innerHTML = '';
  nodes.statusEl.appendChild(loginLoaderRenderSpinner(module.iconColor));
  nodes.card.className = 'module-card enter';
  loginLoaderUpdateDots(index);
}

async function loginLoaderCompleteModule(nodes, index, token) {
  if (!isLoaderTokenValid(token)) return;

  nodes.statusEl.innerHTML = '';
  nodes.statusEl.appendChild(loginLoaderRenderDone());

  const dot = document.getElementById(`dot-${index}`);
  if (dot) {
    dot.classList.remove('current');
    dot.classList.add('done');
  }

  await wait(450);
  if (!isLoaderTokenValid(token)) return;

  nodes.card.className = 'module-card exit';
  await wait(250);
  if (!isLoaderTokenValid(token)) return;

  nodes.card.style.opacity = '0';
  nodes.card.className = 'module-card';
}

function resetLoginLoaderUi(nodes) {
  if (!nodes.overlay) return;
  if (nodes.replayBtn) nodes.replayBtn.style.display = 'none';
  if (nodes.doneEl) {
    nodes.doneEl.classList.remove('visible');
    nodes.doneEl.style.opacity = '0';
  }
  if (nodes.stageEl) {
    nodes.stageEl.style.opacity = '1';
    nodes.stageEl.style.transition = '';
  }
  if (nodes.prepText) {
    nodes.prepText.style.opacity = '1';
    nodes.prepText.textContent = 'Preparando seu ambiente de trabalho...';
    nodes.prepText.style.transition = '';
  }
  if (nodes.fillEl) {
    nodes.fillEl.style.transition = 'none';
    nodes.fillEl.style.width = '0%';
  }
  if (nodes.msgEl) {
    nodes.msgEl.textContent = LOGIN_LOADER_PROGRESS[0];
    nodes.msgEl.style.opacity = '1';
    nodes.msgEl.style.transition = '';
  }
  if (nodes.card) {
    nodes.card.className = 'module-card';
    nodes.card.style.opacity = '0';
  }
  loginLoaderBuildDots(nodes);
}

async function runLoginLoaderSequence(token) {
  const nodes = getLoginLoaderNodes();
  if (!nodes.overlay || !nodes.card) return;

  resetLoginLoaderUi(nodes);
  await wait(80);
  if (!isLoaderTokenValid(token)) return;

  nodes.fillEl.style.transition = 'width 0.7s cubic-bezier(0.22,1,0.36,1)';
  const total = LOGIN_LOADER_MODULES.length;

  for (let i = 0; i < total; i += 1) {
    await loginLoaderShowModule(nodes, i, token);
    if (!isLoaderTokenValid(token)) return;

    const percent = Math.round(((i + 0.7) / total) * 88);
    nodes.fillEl.style.width = `${percent}%`;

    const msgIndex = Math.min(
      Math.floor(i / (total / LOGIN_LOADER_PROGRESS.length)),
      LOGIN_LOADER_PROGRESS.length - 1
    );
    nodes.msgEl.textContent = LOGIN_LOADER_PROGRESS[msgIndex];

    await wait(620);
    if (!isLoaderTokenValid(token)) return;

    if (i < total - 1) {
      await loginLoaderCompleteModule(nodes, i, token);
    } else {
      nodes.statusEl.innerHTML = '';
      nodes.statusEl.appendChild(loginLoaderRenderDone());
      await wait(350);
    }
  }

  if (!isLoaderTokenValid(token)) return;

  nodes.msgEl.textContent = 'Finalizando carregamento';
  nodes.fillEl.style.width = '100%';
  await wait(500);
  if (!isLoaderTokenValid(token)) return;

  nodes.stageEl.style.transition = 'opacity 0.45s ease';
  nodes.stageEl.style.opacity = '0';
  nodes.prepText.style.transition = 'opacity 0.35s ease';
  nodes.prepText.style.opacity = '0';
  nodes.msgEl.style.transition = 'opacity 0.3s ease';
  nodes.msgEl.style.opacity = '0';

  await wait(420);
  if (!isLoaderTokenValid(token)) return;

  nodes.doneEl.classList.add('visible');
}

function bindLoginLoaderEvents() {
  const { replayBtn, themeBtns } = getLoginLoaderNodes();

  if (replayBtn && !replayBtn.dataset.bound) {
    replayBtn.dataset.bound = '1';
    replayBtn.addEventListener('click', () => {
      const token = loaderRunToken;
      runLoginLoaderSequence(token);
    });
  }

  themeBtns.forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      loginLoaderSetTheme(btn.dataset.theme);
    });
  });
}

function ensureMinimumDelay(startedAt, minMs) {
  const elapsed = Date.now() - startedAt;
  if (elapsed >= minMs) return Promise.resolve();
  return wait(minMs - elapsed);
}

function setLoginLoading(active) {
  const { overlay } = getLoginLoaderNodes();
  const btn = document.getElementById('btn-login');

  if (overlay) {
    overlay.classList.toggle('open', active);
    overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
  }

  if (active) {
    loaderRunToken += 1;
    bindLoginLoaderEvents();
    runLoginLoaderSequence(loaderRunToken);
  } else {
    loaderRunToken += 1;
  }

  if (btn) {
    btn.disabled = active;
    btn.innerHTML = active
      ? '<i class="ti ti-loader-2" style="margin-right:6px"></i>Carregando...'
      : '<i class="ti ti-arrow-right" style="margin-right:6px"></i>Acessar o sistema';
  }
}

async function abrirComPerfil(user) {
  const email = user.email || '';
  const permitidoPorEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const { data: perfil } = await db
    .from('profiles')
    .select('nome, cargo')
    .eq('id', user.id)
    .maybeSingle();

  const cargo = normalizeRole(perfil?.cargo || (permitidoPorEmail ? 'admin' : 'operador'));
  const nome = perfil?.nome || user.user_metadata?.nome || email;

  if (!perfil || perfil.cargo !== cargo || !perfil.nome) {
    await db.from('profiles').upsert({ id: user.id, nome, cargo });
  }

  goToApp(nome, cargo);
}

// LOGIN — chamado quando o usuário clica em "Acessar o sistema"
async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;
  const senhaNormalizada = senha.trim();

  if (!email || !senha) {
    showToast('Preencha e-mail e senha', 'warning');
    return;
  }

  const loginStart = Date.now();
  setLoginLoading(true);

  if (isLocalHost() && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && senhaNormalizada.toUpperCase() === ADMIN_PASSWORD) {
    await ensureMinimumDelay(loginStart, LOGIN_TRANSITION_MS);
    setLoginLoading(false);
    setLocalAdminSession(true);
    goToApp('Administrador', 'admin');
    return;
  }

  const { data, error } = await db.auth.signInWithPassword({ email, password: senha });

  if (error) {
    await ensureMinimumDelay(loginStart, 1200);
    setLoginLoading(false);
    showToast('E-mail ou senha incorretos', 'error');
    return;
  }

  await ensureMinimumDelay(loginStart, LOGIN_TRANSITION_MS);
  setLoginLoading(false);
  await abrirComPerfil(data.user);
}

// CADASTRO — chamado quando o usuário clica em "Criar conta grátis"
async function registerUser() {
  const nome    = document.getElementById('register-nome').value.trim();
  const email   = document.getElementById('register-email').value.trim();
  const empresa = document.getElementById('register-empresa').value.trim();
  const senha   = document.getElementById('register-senha').value;

  if (!nome || !email || !empresa || !senha) {
    showToast('Preencha todos os campos', 'warning');
    return;
  }

  if (senha.length < 6) {
    showToast('A senha precisa ter pelo menos 6 caracteres', 'warning');
    return;
  }

  const btn = document.getElementById('btn-register');
  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  const { data, error } = await db.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, empresa } }
  });

  btn.disabled = false;
  btn.textContent = 'Criar conta grátis';

  if (error) {
    showToast(error.message || 'Erro ao criar conta', 'error');
    return;
  }

  // O Supabase cria automaticamente um perfil via trigger (ou podemos criar aqui).
  await db.from('profiles').upsert({ id: data.user.id, nome, cargo: 'operador' });

  showToast('Conta criada! Verifique seu e-mail para confirmar.', 'success');
  setTimeout(() => switchLoginTab('login', null), 2000);
}

// RECUPERAR SENHA — chamado quando clica em "Enviar link de recuperação"
async function recoverUser() {
  const email = document.getElementById('recover-email').value.trim();

  if (!email) {
    showToast('Informe seu e-mail', 'warning');
    return;
  }

  const btn = document.getElementById('btn-recover');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/index.html'
  });

  btn.disabled = false;
  btn.textContent = 'Enviar link de recuperação';

  if (error) {
    showToast('Erro ao enviar e-mail', 'error');
    return;
  }

  showToast('Link enviado! Verifique sua caixa de entrada.', 'success');
}

// LOGOUT — chamado quando o usuário clica em "Sair"
async function logoutUser() {
  setLocalAdminSession(false);
  sessionStorage.removeItem('reisflow_role');
  sessionStorage.removeItem('reisflow_user_name');
  await db.auth.signOut();
  goToLogin();
}
