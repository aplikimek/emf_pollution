import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { getProjectsForUser, createProject } from '@/lib/store'
import type { User } from '@/lib/store'

const ICNIRP: Record<string, number> = {
  '0.9': 41.25, '1.8': 41.25, '2.4': 41.25, '3.5': 42.0, '5': 42.8,
}

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const projects = await getProjectsForUser(user.id, user.role)
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role === 'viewer')
    return NextResponse.json({ error: 'Forbidden — vetëm viewer' }, { status: 403 })

  const { name, description, frequency } = await req.json()
  if (!name?.trim())
    return NextResponse.json({ error: 'Emri është i detyrueshëm' }, { status: 400 })

  const freq  = parseFloat(frequency) || 2.4
  const limit = ICNIRP[String(frequency)] ?? 41.25

  const owner: User = {
    id: user.id, email: user.email, name: user.name,
    image: user.image, role: user.role, clerkId: '', createdAt: '',
  }

  const project = await createProject(name.trim(), description?.trim() || null, owner, freq, limit)
  return NextResponse.json(project, { status: 201 })
}
