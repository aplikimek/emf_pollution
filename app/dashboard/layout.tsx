import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/auth/login')
  return (
    <div style={{ display:'flex', height:'100vh', background:'#04080f', overflow:'hidden' }}>
      <Sidebar user={user} />
      <main style={{ flex:1, overflow:'auto' }}>{children}</main>
    </div>
  )
}
