import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWelcomeEmailHtml } from '@/lib/welcome-email'

export async function POST(request: Request) {
  try {
    const { name, email, phone, country, password } = await request.json()

    if (!name || !email || !phone || !country || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const trimmedName = String(name).trim()
    const trimmedPhone = String(phone).trim()
    const trimmedCountry = String(country).trim()

    const supabaseAdmin = createAdminClient()

    const { data: createResult, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        name: trimmedName,
        phone: trimmedPhone,
        country: trimmedCountry,
      },
    })

    if (createError || !createResult.user) {
      if (createError?.message?.toLowerCase().includes('already') || createError?.status === 422) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: createError?.message || 'Failed to create account' }, { status: 500 })
    }

    const userId = createResult.user.id

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: normalizedEmail,
        name: trimmedName,
        phone: trimmedPhone,
        country: trimmedCountry,
        added_to_whatsapp: false,
      }, { onConflict: 'id' })

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    let emailSent = false
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'ApexBuilders <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: 'Welcome to ApexBuilders! 🚀',
        html: getWelcomeEmailHtml(trimmedName),
      })

      if (!emailError) {
        emailSent = true
      }
    }

    return NextResponse.json({ success: true, emailSent })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong while creating your account' }, { status: 500 })
  }
}
