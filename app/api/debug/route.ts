import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ error: 'No BLOB token' })

  try {
    const { put, list } = await import('@vercel/blob')

    // Write test
    const blob = await put('_test.json', JSON.stringify({ ok: true, ts: Date.now() }), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false,
    })

    // Read back via list
    const { blobs } = await list({ limit: 50 })

    return NextResponse.json({
      writeUrl: blob.url,
      allBlobs: blobs.map(b => b.pathname),
      tokenPrefix: token.slice(0, 30) + '...',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) })
  }
}
