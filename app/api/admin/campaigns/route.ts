import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminCookieName, verifySessionToken } from '@/lib/admin-auth'

type Segment = 'all' | 'pending' | 'added'

function getSessionEmail(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value
  if (!token) return null
  const session = verifySessionToken(token)
  return session?.email ?? null
}

function buildCampaignHtml(subject: string, body: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#070b1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
          <div style="background:linear-gradient(150deg, rgba(139,92,246,0.22), rgba(236,72,153,0.18), rgba(6,182,212,0.16));border:1px solid rgba(255,255,255,0.14);border-radius:24px;padding:30px 26px;color:#fff;">
            <div style="text-align:center;margin-bottom:18px;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:14px;font-weight:800;font-size:24px;color:#fff;background:linear-gradient(135deg,#8B5CF6,#EC4899,#06B6D4);">A</div>
            </div>
            <h1 style="margin:0 0 10px;font-size:28px;line-height:1.2;text-align:center;">${subject}</h1>
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px 16px;margin-top:14px;color:#cbd5e1;line-height:1.7;white-space:pre-wrap;">${body}</div>
            <div style="text-align:center;margin:22px 0 12px;">
              <a href="https://chat.whatsapp.com/FS4C1oLVj07GOCctAzMyX8?mode=gi_t" target="_blank" style="display:inline-block;text-decoration:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:700;font-size:15px;padding:12px 18px;border-radius:999px;">Join WhatsApp Community</a>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.12);margin-top:18px;padding-top:12px;text-align:center;color:#64748b;font-size:12px;">© 2026 ApexBuilders</div>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function GET(request: NextRequest) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('id,subject,segment,total_recipients,sent_count,failed_count,created_by,created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ campaigns: [] })
      }
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
    }

    const { subject, body, segment } = await request.json() as { subject: string; body: string; segment: Segment }

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    const chosenSegment: Segment = ['all', 'pending', 'added'].includes(segment) ? segment : 'all'

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from('users')
      .select('email,name,added_to_whatsapp')
      .not('email', 'is', null)

    if (chosenSegment === 'pending') query = query.eq('added_to_whatsapp', false)
    if (chosenSegment === 'added') query = query.eq('added_to_whatsapp', true)

    const { data: recipients, error: usersError } = await query
    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users for campaign' }, { status: 500 })
    }

    const uniqueRecipients = (recipients || [])
      .filter((entry) => !!entry.email)
      .map((entry) => ({ email: String(entry.email).trim().toLowerCase(), name: entry.name || 'Builder' }))
      .filter((entry, idx, arr) => arr.findIndex((x) => x.email === entry.email) === idx)

    if (uniqueRecipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for selected segment' }, { status: 400 })
    }

    const resend = new Resend(resendApiKey)
    const html = buildCampaignHtml(subject.trim(), body.trim())

    let sentCount = 0
    let failedCount = 0

    for (const recipient of uniqueRecipients) {
      const { error } = await resend.emails.send({
        from: 'ApexBuilders <onboarding@resend.dev>',
        to: recipient.email,
        subject: subject.trim(),
        html,
      })

      if (error) failedCount += 1
      else sentCount += 1
    }

    const { error: insertError } = await supabaseAdmin.from('campaigns').insert({
      subject: subject.trim(),
      body: body.trim(),
      segment: chosenSegment,
      total_recipients: uniqueRecipients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      created_by: sessionEmail,
    })

    if (insertError && insertError.code !== '42P01') {
      return NextResponse.json({ error: 'Campaign sent but failed to save campaign log' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      totalRecipients: uniqueRecipients.length,
      sentCount,
      failedCount,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 })
  }
}
