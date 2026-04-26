import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { getUsers, updateUserRole } from '@/lib/store'
import type { Role } from '@/lib/store'

export async function GET() {
  const user = await getServerUser()
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await getUsers()
  return NextResponse.json(users.map(({ clerkId: _, ...u }) => u))
}

export async function PATCH(req: NextRequest) {
  const user = await getServerUser()
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { userId, role } = await req.json()
  if (!['admin', 'editor', 'viewer'].includes(role))
    return NextResponse.json({ error: 'Rol i pavlefshëm' }, { status: 400 })
  if (userId === user.id)
    return NextResponse.json({ error: 'Nuk mund të ndryshoni rolin tuaj' }, { status: 400 })
  await updateUserRole(userId, role as Role)
  return NextResponse.json({ ok: true })
}
