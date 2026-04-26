import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProjectsForUser } from '@/lib/store'
import Sidebar from '@/components/layout/Sidebar'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const user = await getServerUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')
  const projects = await getProjectsForUser(user.id, 'admin')
  return (
    <div style={{ display:'flex', height:'100vh', background:'#04080f', overflow:'hidden' }}>
      <Sidebar user={user} />
      <AdminUsersClient currentUserId={user.id} projectCount={projects.length} />
    </div>
  )
}
