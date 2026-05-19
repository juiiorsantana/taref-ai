import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') ?? '*'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json() as { token?: string; email?: string; password?: string; fullName?: string }
    const { token, email, password, fullName } = body

    if (!token || !email || !password || !fullName) {
      return json({ error: 'Campos obrigatórios: token, email, password, fullName' }, 400)
    }

    if (password.length < 8) {
      return json({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Buscar convite
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invErr || !invitation) {
      return json({ error: 'Convite inválido ou não encontrado.' }, 404)
    }

    if (invitation.used_at) {
      return json({ error: 'Este convite já foi utilizado.' }, 410)
    }

    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return json({ error: 'Convite expirado.' }, 410)
    }

    // Se o convite tem email vinculado, valida
    if (invitation.email && invitation.email !== email.trim().toLowerCase()) {
      return json({ error: 'Este convite é para outro email.' }, 403)
    }

    // Criar usuário
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    })

    if (createError || !createData.user) {
      return json({ error: createError?.message ?? 'Erro ao criar usuário' }, 400)
    }

    const newUserId = createData.user.id

    // Upsert profile com role do convite
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        full_name: fullName.trim(),
        role: invitation.role,
      })

    if (profileError) {
      // rollback do auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return json({ error: profileError.message }, 500)
    }

    // Marcar convite como usado
    await supabaseAdmin
      .from('invitations')
      .update({ used_at: new Date().toISOString(), used_by: newUserId })
      .eq('id', invitation.id)

    return json({ success: true })
  } catch {
    return json({ error: 'Erro interno do servidor' }, 500)
  }
})
