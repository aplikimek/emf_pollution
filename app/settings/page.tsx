import { getServerUser } from '@/lib/auth'
import { getSettings } from '@/lib/store'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import SettingsClient from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const user = await getServerUser()
  if (!user) redirect('/auth/login')
  const settings = await getSettings()
  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg)', overflow:'hidden' }}>
      <Sidebar user={user} />
      <SettingsClient initial={settings} user={user} />
    </div>
  )
}
