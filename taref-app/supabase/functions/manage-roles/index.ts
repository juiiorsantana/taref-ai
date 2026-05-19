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

const ALLOWED_ROLES = ['user', 'admin'] as const
type AssignableRole = typeof ALLOWED_ROLES[number]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Não autorizado' }, 401)
  }
  const token = authHeader.slice(7)

  try {
    const body = await req.json() as { targetUserId?: string; newRole?: string }
    const { targetUserId, newRole } = body

    if (!targetUserId || !newRole) {
      return json({ error: 'Campos obrigatórios ausentes: targetUserId, newRole' }, 400)
    }

    if (!ALLOWED_ROLES.includes(newRole as AssignableRole)) {
      return json({ error: `Role inválido. Permitidos: ${ALLOWED_ROLES.join(', ')}` }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Verify caller identity
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'Token inválido ou expirado' }, 401)
    }

    // Verify caller has super_admin role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      return json({ error: 'Perfil do solicitante não encontrado' }, 404)
    }

    if (callerProfile.role !== 'super_admin') {
      return json({ error: 'Acesso negado. Apenas super_admin pode alterar roles.' }, 403)
    }

    // Prevent self-demotion
    if (user.id === targetUserId) {
      return json({ error: 'Não é possível alterar o próprio role.' }, 400)
    }

    // Verify target exists
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      return json({ error: 'Usuário alvo não encontrado' }, 404)
    }

    // Prevent downgrading another super_admin
    if (targetProfile.role === 'super_admin') {
      return json({ error: 'Não é possível alterar o role de outro super_admin.' }, 403)
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (updateError) {
      return json({ error: updateError.message }, 500)
    }

    return json({ success: true })
  } catch {
    return json({ error: 'Erro interno do servidor' }, 500)
  }
})
