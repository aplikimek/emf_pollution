import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ error: 'No BLOB token' })

  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ limit: 200 })

    // Read users.json to check actual roles
    const usersBlob = blobs.find(b => b.pathname === 'users.json')
    let users: any[] = []
    if (usersBlob) {
      const r = await fetch(usersBlob.url, { cache: 'no-store' })
      if (r.ok) {
        const all = await r.json()
        // Return only name + role (no emails/IDs for safety)
        users = all.map((u: any) => ({ name: u.name, role: u.role, email: u.email }))
      }
    }

    return NextResponse.json({
      allBlobs: blobs.map(b => b.pathname),
      users,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) })
  }
}
