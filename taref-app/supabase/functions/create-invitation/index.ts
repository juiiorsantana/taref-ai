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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Não autorizado' }, 401)
  }
  const token = authHeader.slice(7)

  try {
    const body = await req.json() as { email?: string; expiresInDays?: number }
    const email = body.email?.trim().toLowerCase() || null
    const expiresInDays = Math.max(1, Math.min(30, body.expiresInDays ?? 7))

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return json({ error: 'Token inválido' }, 401)

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) return json({ error: 'Perfil não encontrado' }, 404)

    if (callerProfile.role !== 'super_admin') {
      return json({ error: 'Apenas super_admin pode criar convites.' }, 403)
    }

    const inviteToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: invitation, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        token: inviteToken,
        created_by: user.id,
        role: 'admin',
        email,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (insertError) return json({ error: insertError.message }, 500)

    return json({ success: true, invitation })
  } catch {
    return json({ error: 'Erro interno do servidor' }, 500)
  }
})
