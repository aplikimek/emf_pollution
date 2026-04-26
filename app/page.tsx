import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
export default async function Home() {
  const user = await getServerUser()
  redirect(user ? '/dashboard' : '/auth/login')
}
