// =============================================================
//  REIS FLOW — Configuração do Supabase
//  Preencha as duas linhas abaixo com os dados do seu projeto.
//  Você encontra esses valores em:
//    Supabase → Project Settings → API
// =============================================================

const SUPABASE_URL      = 'https://hlcjxbioohyheenagpup.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_V8j4wVI1ltBz-EH5aYngwA_TbTCAMv9';
const ADMIN_EMAIL       = 'admin@reisflow.com.br';
const ADMIN_PASSWORD    = 'ADMIN';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);