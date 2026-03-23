import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getWelcomeEmailHtml } from '@/lib/welcome-email'

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)
    const { email, name } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'ApexBuilders <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to ApexBuilders! 🚀',
      html: getWelcomeEmailHtml(name)
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
