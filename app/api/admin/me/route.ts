import { NextRequest, NextResponse } from 'next/server'
import { getAdminCookieName, verifySessionToken } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const session = verifySessionToken(token)
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, admin: { email: session.email } })
}
