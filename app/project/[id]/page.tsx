import { getServerUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProjectById, getMeasurements, canAccessProject, getEffectiveProjectRole } from '@/lib/store'
import Sidebar from '@/components/layout/Sidebar'
import ProjectClient from '@/components/map/ProjectClient'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) redirect('/auth/login')

  const project = await getProjectById(id)
  if (!project || !canAccessProject(project, user.id, user.role)) notFound()

  const measurements  = await getMeasurements(id)
  const projectRole   = getEffectiveProjectRole(project, user.id, user.role)

  return (
    <div style={{ display:'flex', height:'100vh', background:'#04080f', overflow:'hidden' }}>
      <Sidebar user={user} />
      <ProjectClient
        project={project}
        initMeasurements={measurements}
        user={user}
        projectRole={projectRole}
      />
    </div>
  )
}
