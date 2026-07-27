import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InvitePayload = {
  equipe_id: string;
  nome: string;
  email: string;
  perfil: string;
  status?: string;
  senha_temporaria?: string;
  empresa?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('RF_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('RF_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('RF_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { data: authData } = await userClient.auth.getUser();
    const caller = authData?.user;
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('cargo')
      .eq('id', caller.id)
      .maybeSingle();

    const role = String(profile?.cargo || '').toLowerCase();
    if (!['admin', 'gestor'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Forbidden.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as InvitePayload;
    const equipeId = String(payload?.equipe_id || '').trim();
    const nome = String(payload?.nome || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    const perfilConvite = String(payload?.perfil || 'Visualizador').trim();
    const status = String(payload?.status || 'convite_pendente').trim();
    const senhaTemporaria = String(payload?.senha_temporaria || '').trim() || null;
    const empresa = String(payload?.empresa || 'REIS FLOW').trim();

    if (!equipeId || !nome || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: equipe } = await adminClient
      .from('equipe')
      .select('id, nome, email')
      .eq('id', equipeId)
      .maybeSingle();

    if (!equipe) {
      return new Response(JSON.stringify({ error: 'Colaborador não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const matchedAuthUser = existingUser?.users?.find((item) => String(item.email || '').toLowerCase() === email) || null;

    let authUserId = matchedAuthUser?.id || null;
    if (!authUserId) {
      const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          nome,
          empresa,
          perfil: perfilConvite,
        },
        redirectTo: `${supabaseUrl.replace('https://', 'https://')}/auth/v1/callback`,
      });

      if (inviteResult.error) {
        return new Response(JSON.stringify({ error: inviteResult.error.message || 'Could not send invite.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      authUserId = inviteResult.data?.user?.id || null;
    }

    const { data: row, error } = await adminClient
      .from('usuarios_sistema')
      .upsert({
        equipe_id: equipeId,
        auth_user_id: authUserId,
        nome,
        email,
        perfil: perfilConvite,
        status,
        senha_temporaria: senhaTemporaria,
        ultimo_acesso: null,
        empresa,
        convites_enviados: 1,
      }, { onConflict: 'email' })
      .select('id, equipe_id, auth_user_id, nome, email, perfil, status, senha_temporaria, ultimo_acesso, empresa, convites_enviados')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Could not save invite.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, row }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
