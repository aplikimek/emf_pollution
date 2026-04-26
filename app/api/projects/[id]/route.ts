import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import {
  getProjectById, deleteProject, canAccessProject,
  addProjectMember, removeProjectMember, getUsers,
} from '@/lib/store'

type P = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: P) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const project = await getProjectById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessProject(project, user.id, user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Build member list with user info
  const allUsers = await getUsers()
  const members = project.memberIds.map(uid => {
    const u = allUsers.find(x => x.id === uid)
    return u ? { userId: uid, name: u.name, email: u.email, image: u.image, role: project.memberRoles[uid] ?? 'viewer' } : null
  }).filter(Boolean)

  // Available users to add (not already members, not owner)
  const available = user.role === 'admin'
    ? allUsers.filter(u => u.id !== project.ownerId && !project.memberIds.includes(u.id))
    : []

  return NextResponse.json({ project, members, available })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const project = await getProjectById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.role !== 'admin' && project.ownerId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await deleteProject(id)
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const project = await getProjectById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isOwnerOrAdmin = user.role === 'admin' || project.ownerId === user.id
  if (!isOwnerOrAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, userId, role } = await req.json()
  if (action === 'add')    await addProjectMember(id, userId, role ?? 'viewer')
  if (action === 'remove') await removeProjectMember(id, userId)
  return NextResponse.json({ ok: true })
}
