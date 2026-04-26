import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { getSettings, saveSettings } from '@/lib/store'

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getSettings())
}

export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user || user.role === 'viewer')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  await saveSettings(body)
  return NextResponse.json({ ok: true })
}
