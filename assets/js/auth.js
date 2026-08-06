// =============================================================
//  REIS FLOW — Autenticação real com Supabase
// =============================================================

// Verifica se o usuário já está logado ao abrir o site.
// Se sim, vai direto para o sistema sem mostrar a tela de login.
window.addEventListener('DOMContentLoaded', async () => {
  setLoginLoading(false);

  db.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      showResetPasswordForm();
    }
  });

  if (isPasswordRecoveryFlow()) {
    showResetPasswordForm();
    return;
  }

  const { data } = await db.auth.getSession();
  if (data.session) {
    clearAuthCallbackParams();
    await abrirComPerfil(data.session.user);
  }
});

function isPasswordRecoveryFlow() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const type = (hash.get('type') || query.get('type') || '').toLowerCase();
  const recoveryFlag = (query.get('recovery') || '').toLowerCase();

  if (type === 'recovery') return true;
  if (recoveryFlag === '1' || recoveryFlag === 'true') return true;

  return false;
}

function clearAuthCallbackParams() {
  const url = new URL(window.location.href);
  const query = url.searchParams;

  const keepRecovery = query.get('recovery');

  url.search = '';
  if (keepRecovery === '1' || keepRecovery === 'true') url.searchParams.set('recovery', keepRecovery);
  url.hash = '';

  const cleanUrl = `${url.origin}${url.pathname}${url.search}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function showResetPasswordForm() {
  if (typeof switchLoginTab === 'function') {
    switchLoginTab('reset', null);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBrazilPhone(digits) {
  const num = String(digits || '').replace(/\D/g, '').slice(0, 11);
  if (!num) return '';
  if (num.length <= 2) return `(${num}`;
  if (num.length <= 6) return `(${num.slice(0, 2)}) ${num.slice(2)}`;
  if (num.length <= 10) return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
}

function onRegisterPhoneInput(input) {
  if (!input) return;
  input.value = formatBrazilPhone(input.value);
}

function onRegisterPhonePaste(event) {
  const input = event?.target;
  if (!input) return;
  event.preventDefault();
  const text = event.clipboardData?.getData('text') || '';
  input.value = formatBrazilPhone(text);
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
    name: 'Operações',
    desc: 'Finalizando preparação do ambiente',
    iconColor: '#F59533',
    iconBg: 'rgba(245,149,51,0.12)',
    dotColor: '#F59533'
  }
];

const LOGIN_LOADER_PROGRESS = [
  'Sincronizando informacoes',
  'Validando dados',
  'Finalizando carregamento'
];

let loaderRunToken = 0;
let loaderRunPromise = Promise.resolve();

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

    const percent = Math.round(((i + 1) / total) * 82);
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
  nodes.fillEl.style.transition = 'width 0.9s cubic-bezier(0.22,1,0.36,1)';
  nodes.fillEl.style.width = '100%';
  await wait(900);
  if (!isLoaderTokenValid(token)) return;

  nodes.stageEl.style.transition = 'none';
  nodes.stageEl.style.opacity = '0';
  nodes.doneEl.classList.add('visible');
  await wait(1800);
  if (!isLoaderTokenValid(token)) return;
  nodes.prepText.style.transition = 'opacity 0.35s ease';
  nodes.prepText.style.opacity = '0';
  nodes.msgEl.style.transition = 'opacity 0.3s ease';
  nodes.msgEl.style.opacity = '0';

  await wait(420);
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
      if (typeof window.setTheme === 'function') {
        window.setTheme(btn.dataset.theme);
      }
      loginLoaderSetTheme(btn.dataset.theme);
    });
  });
}

function setLoginLoading(active) {
  const { overlay } = getLoginLoaderNodes();
  const btn = document.getElementById('btn-login');

  if (overlay) {
    overlay.classList.toggle('open', active);
    overlay.style.display = active ? 'block' : 'none';
    overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
  }

  if (active) {
    loaderRunToken += 1;
    bindLoginLoaderEvents();
    const currentTheme = typeof window.getCurrentTheme === 'function'
      ? window.getCurrentTheme()
      : 'dark';
    loginLoaderSetTheme(currentTheme);
    loaderRunPromise = runLoginLoaderSequence(loaderRunToken);
  } else {
    loaderRunToken += 1;
    loaderRunPromise = Promise.resolve();
  }

  if (btn) {
    btn.disabled = active;
    btn.innerHTML = active
      ? '<i class="ti ti-loader-2" style="margin-right:6px"></i>Carregando...'
      : '<i class="ti ti-arrow-right" style="margin-right:6px"></i>Acessar o sistema';
  }
}

async function playLoginLoader() {
  setLoginLoading(true);
  await loaderRunPromise;
  setLoginLoading(false);
}

function isLocalHost() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function setLocalAdminSession(active) {
  if (active) {
    sessionStorage.setItem('reisflow_admin_local', '1');
  } else {
    sessionStorage.removeItem('reisflow_admin_local');
  }
}

function isLocalAdminSession() {
  return sessionStorage.getItem('reisflow_admin_local') === '1';
}

async function abrirComPerfil(user) {
  const email = user.email || '';
  const permitidoPorEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const { data: perfil } = await db
    .from('profiles')
    .select('nome, cargo, empresa_id')
    .eq('id', user.id)
    .maybeSingle();

  const cargoPerfil = String(perfil?.cargo || '').toLowerCase();
  const cargoMetadata = String(user?.user_metadata?.cargo || user?.user_metadata?.role || '').toLowerCase();
  const cargoDetectado = permitidoPorEmail ? 'admin' : (cargoPerfil || cargoMetadata || 'operador');
  const cargo = typeof normalizeRole === 'function'
    ? normalizeRole(cargoDetectado)
    : cargoDetectado;
  const nome = perfil?.nome || user.user_metadata?.nome || email;

  if (!perfil || perfil.cargo !== cargo || !perfil.nome) {
    await db.from('profiles').upsert({ id: user.id, nome, cargo });
  }

  // Armazena empresa_id na sessão para uso global
  if (perfil?.empresa_id) {
    sessionStorage.setItem('reisflow_empresa_id', perfil.empresa_id);
  }

  if (typeof syncUsuarioSistemaIdentityFromAuth === 'function') {
    await syncUsuarioSistemaIdentityFromAuth();
  }

  goToApp(nome, cargo);
}

function getCurrentEmpresaId() {
  return sessionStorage.getItem('reisflow_empresa_id') || null;
}

function isEmailNotConfirmedError(error) {
  if (!error) return false;

  const code = String(error.code || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();

  return code === 'email_not_confirmed'
    || message.includes('email not confirmed')
    || message.includes('not confirmed');
}

function getAuthErrorMessage(error, fallbackMessage) {
  if (!error) return fallbackMessage;

  const message = typeof error.message === 'string'
    ? error.message.trim()
    : '';

  if (!message || message === '{}' || message === '[object Object]') {
    return fallbackMessage;
  }

  return message;
}

function isServerAuthError(error) {
  const status = Number(error?.status || error?.statusCode || 0);
  return status >= 500;
}

async function resendConfirmationEmail() {
  const email = document.getElementById('login-email').value.trim();
  const btn = document.getElementById('btn-resend-confirmation');

  if (!email) {
    showToast('Informe seu e-mail de login para reenviar a confirmacao.', 'warning');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Reenviando...';
  }

  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  const { error } = await db.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${baseUrl}index.html`
    }
  });

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Reenviar confirmacao de e-mail';
  }

  if (error) {
    showToast(getAuthErrorMessage(error, 'Nao foi possivel reenviar a confirmacao. Tente novamente em alguns minutos.'), 'error');
    return;
  }

  showToast('E-mail de confirmacao reenviado! Verifique sua caixa de entrada.', 'success');
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

  if (isLocalHost() && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && senhaNormalizada === ADMIN_PASSWORD) {
    setLocalAdminSession(true);
    await playLoginLoader();
    goToApp('Administrador', 'admin');
    return;
  }

  const { data, error } = await db.auth.signInWithPassword({ email, password: senha });

  if (error) {
    const errorMessage = String(error.message || '').toLowerCase();

    if (isEmailNotConfirmedError(error)) {
      showToast('Seu e-mail ainda nao foi confirmado. Verifique sua caixa de entrada.', 'warning');
      return;
    }

    if (errorMessage.includes('invalid login credentials')) {
      showToast('E-mail ou senha incorretos. Se acabou de cadastrar, confirme seu e-mail antes de entrar.', 'warning');
      return;
    }

    showToast('E-mail ou senha incorretos', 'error');
    return;
  }

  await playLoginLoader();
  await abrirComPerfil(data.user);
}

// CADASTRO — chamado quando o usuário clica em "Criar conta grátis"
async function registerUser() {
  const nome    = document.getElementById('register-nome').value.trim();
  const email   = document.getElementById('register-email').value.trim();
  const empresa = document.getElementById('register-empresa').value.trim();
  const telefone = document.getElementById('register-telefone')?.value.trim() || '';
  const senha   = document.getElementById('register-senha').value;

  if (!nome || !email || !empresa || !telefone || !senha) {
    showToast('Preencha todos os campos', 'warning');
    return;
  }

  const phoneDigits = telefone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    showToast('Informe um telefone valido com DDD.', 'warning');
    return;
  }

  if (senha.length < 6) {
    showToast('A senha precisa ter pelo menos 6 caracteres', 'warning');
    return;
  }

  const btn = document.getElementById('btn-register');
  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  let data = null;
  let error = null;
  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

  try {
    const response = await db.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, empresa },
        emailRedirectTo: `${baseUrl}index.html`
      }
    });

    data = response.data;
    error = response.error;
  } catch (err) {
    error = err;
  }

  btn.disabled = false;
  btn.textContent = 'Criar conta grátis';

  if (error) {
    if (isServerAuthError(error)) {
      showToast('Cadastro indisponivel no momento. Tente novamente em alguns minutos.', 'error');
      return;
    }

    showToast(getAuthErrorMessage(error, 'Erro ao criar conta'), 'error');
    return;
  }

  if (!data?.user?.id) {
    showToast('Cadastro enviado, mas o Supabase nao retornou o usuario. Tente novamente.', 'warning');
    return;
  }

  // So cria empresa/perfil quando existe sessao ativa; sem sessao, o RLS bloqueia o insert.
  if (data.session?.access_token) {
    // 1. Criar empresa
    const { data: empresaData, error: empresaError } = await db
      .from('empresas')
      .insert({ nome: empresa, telefone: telefone || null })
      .select('id')
      .single();

    if (empresaError || !empresaData?.id) {
      showToast('Conta criada, mas erro ao configurar empresa. Tente entrar novamente.', 'warning');
      return;
    }

    // 2. Criar perfil vinculado à empresa com cargo admin
    const { error: profileError } = await db
      .from('profiles')
      .upsert({ id: data.user.id, nome, cargo: 'admin', empresa_id: empresaData.id });

    if (profileError) {
      showToast('Conta criada, mas houve erro ao criar perfil. Tente entrar novamente.', 'warning');
      return;
    }

    await abrirComPerfil(data.user);
    showToast('Conta criada com sucesso!', 'success');
    return;
  }

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

  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}index.html?recovery=1`
  });

  btn.disabled = false;
  btn.textContent = 'Enviar link de recuperação';

  if (error) {
    showToast(getAuthErrorMessage(error, 'Erro ao enviar e-mail'), 'error');
    return;
  }

  showToast('Link enviado! Verifique sua caixa de entrada.', 'success');
}

async function updatePasswordUser() {
  const senha = document.getElementById('reset-password').value;
  const confirmar = document.getElementById('reset-password-confirm').value;
  const btn = document.getElementById('btn-update-password');

  if (!senha || !confirmar) {
    showToast('Preencha os dois campos de senha.', 'warning');
    return;
  }

  if (senha.length < 6) {
    showToast('A senha precisa ter pelo menos 6 caracteres.', 'warning');
    return;
  }

  if (senha !== confirmar) {
    showToast('As senhas nao conferem.', 'warning');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const { error } = await db.auth.updateUser({ password: senha });

  btn.disabled = false;
  btn.textContent = 'Salvar nova senha';

  if (error) {
    const rawMessage = String(error.message || '').toLowerCase();
    const missingSession = rawMessage.includes('auth session missing')
      || rawMessage.includes('invalid token')
      || rawMessage.includes('jwt')
      || rawMessage.includes('expired');

    if (missingSession) {
      showToast('Link de recuperacao invalido ou expirado. Solicite um novo e-mail de recuperacao.', 'warning');
      return;
    }

    showToast(getAuthErrorMessage(error, 'Nao foi possivel redefinir a senha.'), 'error');
    return;
  }

  await db.auth.signOut();

  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);

  document.getElementById('reset-password').value = '';
  document.getElementById('reset-password-confirm').value = '';
  switchLoginTab('login', null);
  showToast('Senha redefinida com sucesso! Faça login com sua nova senha.', 'success');
}

// LOGOUT — chamado quando o usuário clica em "Sair"
async function logoutUser() {
  setLocalAdminSession(false);
  sessionStorage.removeItem('reisflow_role');
  sessionStorage.removeItem('reisflow_user_name');
  sessionStorage.removeItem('reisflow_empresa_id');
  await db.auth.signOut();
  goToLogin();
}

window.addEventListener('DOMContentLoaded', async () => {
  if (typeof refreshUsuariosSistemaData === 'function') {
    await refreshUsuariosSistemaData();
  }
});
