const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/FS4C1oLVj07GOCctAzMyX8?mode=gi_t'

export function getWelcomeEmailHtml(name: string) {
  const appBaseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const dashboardLoginUrl = `${appBaseUrl.replace(/\/$/, '')}/login`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:#070b1a; color:#fff;">
        <div style="max-width:640px; margin:0 auto; padding:32px 16px;">
          <div style="background:linear-gradient(150deg, rgba(139,92,246,0.22), rgba(236,72,153,0.18), rgba(6,182,212,0.16)); border:1px solid rgba(255,255,255,0.14); border-radius:24px; padding:36px 28px; box-shadow:0 10px 40px rgba(0,0,0,0.35);">
            <div style="text-align:center; margin-bottom:28px;">
              <div style="display:inline-block; width:62px; height:62px; line-height:62px; border-radius:16px; font-weight:800; font-size:28px; color:#fff; background:linear-gradient(135deg,#8B5CF6,#EC4899,#06B6D4);">A</div>
            </div>

            <h1 style="margin:0 0 8px; font-size:32px; line-height:1.2; text-align:center; color:#fff;">Welcome to ApexBuilders 🚀</h1>
            <p style="margin:0 0 24px; text-align:center; color:#cbd5e1; font-size:16px;">Congrats ${name}! You’re officially in.</p>

            <div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; margin-bottom:22px;">
              <h2 style="margin:0 0 14px; font-size:18px; color:#fff;">What you’ll master</h2>
              <ul style="margin:0; padding-left:18px; color:#cbd5e1; line-height:1.8; font-size:14px;">
                <li>TikTok and social media growth systems</li>
                <li>Digital asset creation and monetization</li>
                <li>AI automation workflows</li>
                <li>Video editing and AI video creation</li>
                <li>DevOps foundations for builders</li>
              </ul>
            </div>

            <div style="text-align:center; margin:28px 0 14px;">
              <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="display:inline-block; text-decoration:none; background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; font-weight:700; font-size:16px; padding:14px 22px; border-radius:999px; box-shadow:0 8px 24px rgba(34,197,94,0.35);">Join WhatsApp Community</a>
            </div>

            <div style="text-align:center; margin:0 0 22px;">
              <a href="${dashboardLoginUrl}" target="_blank" style="display:inline-block; text-decoration:none; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.25); color:#fff; font-weight:700; font-size:15px; padding:12px 20px; border-radius:999px;">Login to Dashboard & Start Learning</a>
            </div>

            <p style="margin:0; text-align:center; color:#94a3b8; font-size:13px; line-height:1.6;">
              Need help? Reply to this email and our team will support you.
            </p>

            <div style="border-top:1px solid rgba(255,255,255,0.12); margin-top:24px; padding-top:16px; text-align:center; color:#64748b; font-size:12px;">
              © 2026 ApexBuilders. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

export const WHATSAPP_GROUP_URL = WHATSAPP_GROUP_LINK
