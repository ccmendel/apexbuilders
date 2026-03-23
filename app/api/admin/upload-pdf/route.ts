import { randomUUID } from 'crypto'
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

export async function POST(request: NextRequest) {
  const sessionEmail = getSessionEmail(request)
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    const maxSizeBytes = 10 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'PDF must be 10MB or smaller' }, { status: 400 })
    }

    const extension = 'pdf'
    const safeName = (file.name || 'curriculum.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `curriculum/${Date.now()}-${randomUUID()}-${safeName.endsWith('.pdf') ? safeName : `${safeName}.${extension}`}`

    const supabaseAdmin = createAdminClient()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('course-assets')
      .upload(path, file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from('course-assets').getPublicUrl(path)

    return NextResponse.json({
      success: true,
      path,
      publicUrl: data.publicUrl,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
  }
}
