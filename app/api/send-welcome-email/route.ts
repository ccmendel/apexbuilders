import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1)); border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #8B5CF6, #EC4899); border-radius: 16px; line-height: 60px; font-size: 28px; font-weight: bold; color: white;">A</div>
            </div>
            
            <h1 style="color: white; text-align: center; font-size: 28px; margin-bottom: 10px;">Welcome to ApexBuilders!</h1>
            
            <p style="color: #94a3b8; text-align: center; font-size: 16px; margin-bottom: 30px;">Hey ${name}, you're all set! 🎉</p>
            
            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
              <h2 style="color: white; font-size: 18px; margin-bottom: 15px;">What's next?</h2>
              <ul style="color: #94a3b8; padding-left: 20px; line-height: 1.8;">
                <li>Join our WhatsApp community and start implementing immediately</li>
                <li>Learn TikTok growth, social media strategy, and digital asset creation</li>
                <li>Master AI automation, video editing, AI video creation, and DevOps skills</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #64748b; font-size: 14px;">
                Questions? Reply to this email or reach out on WhatsApp.
              </p>
            </div>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #475569; font-size: 12px;">© 2026 ApexBuilders. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
