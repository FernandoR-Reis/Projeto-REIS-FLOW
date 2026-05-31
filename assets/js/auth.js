// =============================================================
//  REIS FLOW — Autenticação real com Supabase
// =============================================================

// Verifica se o usuário já está logado ao abrir o site.
// Se sim, vai direto para o sistema sem mostrar a tela de login.
window.addEventListener('DOMContentLoaded', async () => {
  const { data } = await db.auth.getSession();
  if (data.session) {
    const nome = data.session.user.user_metadata?.nome || data.session.user.email;
    goToApp(nome);
  }
});

// LOGIN — chamado quando o usuário clica em "Acessar o sistema"
async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;

  if (!email || !senha) {
    showToast('Preencha e-mail e senha', 'warning');
    return;
  }

  const btn = document.getElementById('btn-login');
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  const { data, error } = await db.auth.signInWithPassword({ email, password: senha });

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-arrow-right" style="margin-right:6px"></i>Acessar o sistema';

  if (error) {
    showToast('E-mail ou senha incorretos', 'error');
    return;
  }

  const nome = data.user.user_metadata?.nome || data.user.email;
  goToApp(nome);
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
  await db.from('profiles').upsert({ id: data.user.id, nome, cargo: 'admin' });

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
  await db.auth.signOut();
  goToLogin();
}
