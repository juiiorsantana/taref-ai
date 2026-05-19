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

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ba = enc.encode(a)
  const bb = enc.encode(b)
  if (ba.length !== bb.length) return false
  let mismatch = 0
  for (let i = 0; i < ba.length; i++) mismatch |= ba[i] ^ bb[i]
  return mismatch === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { email, password, fullName, adminToken } = await req.json()

    if (!email || !password || !fullName || !adminToken) {
      return json({ error: 'Campos obrigatórios ausentes' }, 400)
    }

    const expectedToken = Deno.env.get('ADMIN_CREATE_TOKEN')
    if (!expectedToken) {
      return json({ error: 'Serviço não configurado' }, 500)
    }

    if (!timingSafeEqual(adminToken, expectedToken)) {
      return json({ error: 'Token inválido' }, 401)
    }

    if (password.length < 12) {
      return json({ error: 'Senha deve ter no mínimo 12 caracteres' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Only allow creating the first super_admin if no super_admin exists yet
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin')

    if ((count ?? 0) > 0) {
      return json({ error: 'Super admin já existe. Use o painel de usuários para gerenciar roles.' }, 409)
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    })

    if (error) return json({ error: error.message }, 400)

    await supabaseAdmin
      .from('profiles')
      .upsert({ id: data.user.id, full_name: fullName.trim(), role: 'super_admin' })

    return json({ success: true })
  } catch {
    return json({ error: 'Erro interno do servidor' }, 500)
  }
})
