import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InvitePayload = {
  equipe_id: string;
  nome: string;
  email: string;
  perfil: string;
  status?: string;
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

    const { data: membership, error: membershipError } = await adminClient
      .from('tenant_memberships')
      .select('empresa_id, role, active')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (membershipError || !membership?.empresa_id || !membership.active) {
      return new Response(JSON.stringify({ error: 'Caller has no verified organization membership.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (String(membership.role || '').toLowerCase() !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only an organization admin may invite users or change access.' }), {
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
    const normalizedProfile = perfilConvite.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const invitedRole = ({
      administrador: 'admin',
      admin: 'admin',
      gerente: 'gestor',
      gestor: 'gestor',
      financeiro: 'financeiro',
      'auxiliar financeiro': 'financeiro',
      visualizador: 'visualizador',
      comercial: 'operador',
      compras: 'operador',
      estoque: 'operador',
      obras: 'operador',
      rh: 'operador',
    } as Record<string, string>)[normalizedProfile];

    if (!equipeId || !nome || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['ativo', 'bloqueado', 'convite_pendente'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid invite status.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!invitedRole) {
      return new Response(JSON.stringify({ error: 'Invalid organization role.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (invitedRole === 'admin') {
      return new Response(JSON.stringify({ error: 'Administrator privileges are assigned only by the trusted organization bootstrap.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (membership.role !== 'admin' && ['admin', 'gestor'].includes(invitedRole)) {
      return new Response(JSON.stringify({ error: 'Only an organization admin may assign an admin or manager role.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: company, error: companyError } = await adminClient
      .from('empresas')
      .select('id, nome, status')
      .eq('id', membership.empresa_id)
      .maybeSingle();

    if (companyError || !company || company.status !== 'ativo') {
      return new Response(JSON.stringify({ error: 'Verified organization not found.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: equipe } = await adminClient
      .from('equipe')
      .select('id, nome, email, empresa_id')
      .eq('id', equipeId)
      .maybeSingle();

    if (!equipe || equipe.empresa_id !== membership.empresa_id) {
      return new Response(JSON.stringify({ error: 'Colaborador não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingInvite, error: existingInviteError } = await adminClient
      .from('usuarios_sistema')
      .select('id, empresa_id, auth_user_id')
      .eq('email', email)
      .maybeSingle();
    if (existingInviteError) {
      return new Response(JSON.stringify({ error: 'Could not verify existing organization invite.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (existingInvite && existingInvite.empresa_id !== membership.empresa_id) {
      return new Response(JSON.stringify({ error: 'This email is already associated with another organization.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let matchedAuthUser = null;
    for (let page = 1; page <= 100; page += 1) {
      const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
      if (usersError) {
        return new Response(JSON.stringify({ error: 'Could not verify the invited account.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      matchedAuthUser = usersData.users.find((item) => String(item.email || '').toLowerCase() === email) || null;
      if (matchedAuthUser || usersData.users.length < 100) break;
    }

    let authUserId = matchedAuthUser?.id || existingInvite?.auth_user_id || null;
    let existingMembership: { empresa_id: string; active: boolean; role: string } | null = null;
    if (authUserId) {
      const { data, error: existingMembershipError } = await adminClient
        .from('tenant_memberships')
        .select('empresa_id, active, role')
        .eq('user_id', authUserId)
        .maybeSingle();
      if (existingMembershipError) {
        return new Response(JSON.stringify({ error: 'Could not verify existing account membership.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      existingMembership = data;
      if (existingMembership && existingMembership.empresa_id !== membership.empresa_id) {
        return new Response(JSON.stringify({ error: 'This account already belongs to another organization.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (existingMembership?.role === 'admin') {
        return new Response(JSON.stringify({ error: 'Administrator memberships cannot be changed through the invite flow.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!authUserId && status !== 'bloqueado') {
      const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          nome,
          empresa: company.nome,
          perfil: perfilConvite,
        },
        redirectTo: `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback`,
      });

      if (inviteResult.error) {
        return new Response(JSON.stringify({ error: inviteResult.error.message || 'Could not send invite.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      authUserId = inviteResult.data?.user?.id || null;
    }

    if (!authUserId) {
      if (status === 'bloqueado' && existingInvite) {
        const { data: row, error } = await adminClient
          .from('usuarios_sistema')
          .update({ status: 'bloqueado' })
          .eq('id', existingInvite.id)
          .eq('empresa_id', membership.empresa_id)
          .select('id, equipe_id, auth_user_id, empresa_id, nome, email, perfil, status, ultimo_acesso, empresa, convites_enviados')
          .single();
        if (error) {
          return new Response(JSON.stringify({ error: 'Could not block the pending invite.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ ok: true, row }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Supabase did not return the invited account ID.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (status === 'bloqueado') {
      if (existingMembership) {
        const { error: blockMembershipError } = await adminClient
          .from('tenant_memberships')
          .update({ active: false })
          .eq('user_id', authUserId)
          .eq('empresa_id', membership.empresa_id);
        if (blockMembershipError) {
          return new Response(JSON.stringify({ error: 'Could not revoke the organization membership.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } else {
      if (!existingMembership) {
        const { error: insertMembershipError } = await adminClient
          .from('tenant_memberships')
          .insert({
            user_id: authUserId,
            empresa_id: membership.empresa_id,
            role: invitedRole,
            active: true,
          });

        if (insertMembershipError && insertMembershipError.code !== '23505') {
          return new Response(JSON.stringify({ error: 'Could not assign the verified organization membership.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const { data: savedMembership, error: savedMembershipError } = await adminClient
        .from('tenant_memberships')
        .select('empresa_id')
        .eq('user_id', authUserId)
        .maybeSingle();
      if (savedMembershipError || savedMembership?.empresa_id !== membership.empresa_id) {
        return new Response(JSON.stringify({ error: 'This account is already associated with another organization.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateMembershipError } = await adminClient
        .from('tenant_memberships')
        .update({ role: invitedRole, active: true })
        .eq('user_id', authUserId)
        .eq('empresa_id', membership.empresa_id);
      if (updateMembershipError) {
        return new Response(JSON.stringify({ error: 'Could not apply the organization role.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (status !== 'bloqueado') {
      const { error: saveProfileError } = await adminClient
        .from('profiles')
        .upsert({
          id: authUserId,
          nome,
          cargo: invitedRole,
          empresa_id: membership.empresa_id,
        }, { onConflict: 'id' });

      if (saveProfileError) {
        return new Response(JSON.stringify({ error: 'Could not save the invited account profile.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: row, error } = await adminClient
      .from('usuarios_sistema')
      .upsert({
        equipe_id: equipeId,
        auth_user_id: authUserId,
        empresa_id: membership.empresa_id,
        nome,
        email,
        perfil: perfilConvite,
        status,
        ultimo_acesso: null,
        empresa: company.nome,
        convites_enviados: 1,
      }, { onConflict: 'email' })
      .select('id, equipe_id, auth_user_id, nome, email, perfil, status, ultimo_acesso, empresa, convites_enviados')
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
