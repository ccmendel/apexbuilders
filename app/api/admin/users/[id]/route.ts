import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminCookieName, verifySessionToken } from '@/lib/admin-auth'

function getSessionEmail(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value
  if (!token) {
    return null
  }

  const session = verifySessionToken(token)
  return session?.email ?? null
}

async function getUserIdFromParams(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await Promise.resolve(params)
  return resolved.id
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = await getUserIdFromParams(params)

  try {
    const { suspend } = await request.json() as { suspend: boolean }
    const supabaseAdmin = createAdminClient()

    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id,email')
      .eq('id', userId)
      .single()

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: suspend ? '876000h' : 'none',
    })

    if (authError) {
      return NextResponse.json({ error: 'Failed to update auth state' }, { status: 500 })
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        is_suspended: suspend,
        suspended_at: suspend ? new Date().toISOString() : null,
      })
      .eq('id', userId)

    if (dbError) {
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, suspended: suspend })
  } catch {
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = await getUserIdFromParams(params)

  try {
    const supabaseAdmin = createAdminClient()

    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id,email')
      .eq('id', userId)
      .single()

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    const { error: userDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (userDeleteError) {
      return NextResponse.json({ error: 'Failed to delete user record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
