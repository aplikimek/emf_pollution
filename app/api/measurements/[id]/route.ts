import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { getProjectById, canAccessProject, getEffectiveProjectRole, getMeasurements, addMeasurements, deleteMeasurement, clearMeasurements } from '@/lib/store'

type P = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: P) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const project = await getProjectById(id)
  if (!project || !canAccessProject(project, user.id, user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(await getMeasurements(id))
}

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const project = await getProjectById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const role = getEffectiveProjectRole(project, user.id, user.role)
  if (role === 'viewer') return NextResponse.json({ error: 'Forbidden — viewer' }, { status: 403 })

  const body = await req.json()
  const replace = body?.replace === true
  const rows = Array.isArray(body) ? body : (body?.rows ?? [])
  if (!Array.isArray(rows) || !rows.length)
    return NextResponse.json({ error: 'Array i zbrazët' }, { status: 400 })

  const toInsert = rows.map((r: any) => ({
    projectId:    id,
    uploadedBy:   user.id,
    locationName: r.locationName ?? r.location_name ?? r.Location ?? null,
    lat:          Number(r.lat),
    lon:          Number(r.lon),
    distanceM:    r.distanceM   != null ? Number(r.distanceM)   : null,
    hightM:       r.hightM      != null ? Number(r.hightM)      : null,
    frequencyGhz: r.frequencyGhz!= null ? Number(r.frequencyGhz): null,
    emaxVm:       Number(r.emaxVm),
    eavgVm:       Number(r.eavgVm),
    eminVm:       Number(r.eminVm),
  })).filter((r: any) => !isNaN(r.lat) && !isNaN(r.lon) && r.emaxVm > 0)

  if (replace) await clearMeasurements(id)
  const inserted = await addMeasurements(id, toInsert)
  return NextResponse.json(inserted, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: P) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const project = await getProjectById(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const role = getEffectiveProjectRole(project, user.id, user.role)
  if (role === 'viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  if (body?.all === true) {
    await clearMeasurements(id)
    return NextResponse.json({ ok: true })
  }
  await deleteMeasurement(id, body.measurementId)
  return NextResponse.json({ ok: true })
}
