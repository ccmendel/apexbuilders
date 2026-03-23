import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createSessionToken,
  getAdminCookieName,
  verifyPassword,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const bootstrapEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const bootstrapPassword = process.env.ADMIN_PASSWORD || ''

    let authenticated = false

    if (normalizedEmail === bootstrapEmail && password === bootstrapPassword) {
      authenticated = true
    } else {
      const supabaseAdmin = createAdminClient()
      const { data: admin, error } = await supabaseAdmin
        .from('admins')
        .select('email,password_hash')
        .eq('email', normalizedEmail)
        .single()

      if (error || !admin) {
        return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
      }

      authenticated = verifyPassword(password, admin.password_hash)
    }

    if (!authenticated) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const token = createSessionToken(normalizedEmail)
    const response = NextResponse.json({ success: true })
    response.cookies.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
