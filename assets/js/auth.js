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

  const btn = document.getElementById('btn-login');
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  if (isLocalHost() && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && senhaNormalizada.toUpperCase() === ADMIN_PASSWORD) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-arrow-right" style="margin-right:6px"></i>Acessar o sistema';
    setLocalAdminSession(true);
    goToApp('Administrador', 'admin');
    return;
  }

  const { data, error } = await db.auth.signInWithPassword({ email, password: senha });

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-arrow-right" style="margin-right:6px"></i>Acessar o sistema';

  if (error) {
    showToast('E-mail ou senha incorretos', 'error');
    return;
  }

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
