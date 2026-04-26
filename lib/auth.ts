import { auth, currentUser } from '@clerk/nextjs/server'
import { upsertClerkUser } from '@/lib/store'

export interface SessionUser {
  id:    string
  email: string
  name:  string
  image: string | null
  role:  'admin' | 'editor' | 'viewer'
}

export async function getServerUser(): Promise<SessionUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name  = clerkUser.fullName ?? clerkUser.firstName ?? email.split('@')[0]
  const image = clerkUser.imageUrl ?? null

  const dbUser = await upsertClerkUser({ clerkId: userId, email, name, image })
  return { id: dbUser.id, email: dbUser.email, name: dbUser.name, image: dbUser.image, role: dbUser.role }
}
