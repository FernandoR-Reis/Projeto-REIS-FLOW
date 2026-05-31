// =============================================================
//  REIS FLOW — Configuração do Supabase
//  Preencha as duas linhas abaixo com os dados do seu projeto.
//  Você encontra esses valores em:
//    Supabase → Project Settings → API
// =============================================================

const SUPABASE_URL      = 'COLE_AQUI_SUA_PROJECT_URL';
const SUPABASE_ANON_KEY = 'COLE_AQUI_SUA_ANON_KEY';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
