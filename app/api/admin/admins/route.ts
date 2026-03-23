import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminCookieName, hashPassword, verifySessionToken } from '@/lib/admin-auth'

function getSessionEmail(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value
  if (!token) {
    return null
  }

  const session = verifySessionToken(token)
  return session?.email ?? null
}

export async function GET(request: NextRequest) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('id,name,email,created_at')
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ admins: [] })
    }
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }

  const bootstrapEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const merged = [...(data || [])]

  if (bootstrapEmail && !merged.find((admin) => admin.email.toLowerCase() === bootstrapEmail)) {
    merged.unshift({
      id: 'bootstrap-admin',
      name: 'CCMendel',
      email: bootstrapEmail,
      created_at: new Date(0).toISOString(),
    })
  }

  return NextResponse.json({ admins: merged })
}

export async function POST(request: NextRequest) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('admins')
      .insert({
        name: String(name).trim(),
        email: normalizedEmail,
        password_hash: hashPassword(String(password)),
        created_by: sessionEmail,
      })

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Admins table is missing. Run supabase/schema.sql first.' }, { status: 500 })
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}
