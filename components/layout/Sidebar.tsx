'use client'
import { useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SessionUser } from '@/lib/auth'
import ThemeToggle from '@/components/ui/ThemeToggle'

const ROLE: Record<string, { c: string; bg: string; b: string }> = {
  admin:  { c: 'var(--red)',   bg: 'var(--red-tint)',   b: 'var(--red-border)'   },
  editor: { c: 'var(--gold)',  bg: 'var(--gold-tint)',  b: 'var(--gold-border)'  },
  viewer: { c: 'var(--green)', bg: 'var(--green-tint)', b: 'var(--green-border)' },
}

export default function Sidebar({ user }: { user: SessionUser }) {
  const path  = usePathname()
  const { signOut } = useClerk()
  const rs    = ROLE[user.role]

  const nav = [
    { href: '/dashboard',   icon: '🗂', label: 'Dashboard' },
    { href: '/settings',    icon: '⚙',  label: 'Cilësimet' },
    ...(user.role === 'admin' ? [
      { href: '/admin/users', icon: '👥', label: 'Menaxhim Users' },
    ] : []),
  ]

  return (
    <aside style={{ width: 218, background: 'var(--panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', padding: '1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f5c842,#f06030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 0 14px rgba(245,200,66,0.2)' }}>⚡</div>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: 2, color: 'var(--text-strong)', lineHeight: 1 }}>EMF GIS</div>
          <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: 2, textTransform: 'uppercase' }}>Pollution Analysis</div>
        </div>
      </Link>

      <nav style={{ flex: 1, padding: '0.6rem', overflowY: 'auto' }}>
        {nav.map(({ href, icon, label }) => {
          const active = href === '/dashboard' ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.75rem', borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 12, fontWeight: 500,
                color:      active ? 'var(--gold)'         : 'var(--dim)',
                background: active ? 'var(--gold-glow)'    : 'transparent',
                border:     active ? '1px solid var(--gold-glow-b)' : '1px solid transparent',
                transition: 'all 0.15s' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>{label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0.6rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ background: 'var(--panel2)', borderRadius: 10, padding: '0.75rem', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {user.image ? (
              <img src={user.image} alt={user.name} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#38c0f5,#2ee89a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-strong)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 9, color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', background: rs.bg, color: rs.c, border: `1px solid ${rs.b}` }}>
            {user.role}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <ThemeToggle />
          <button
            onClick={() => signOut({ redirectUrl: '/auth/login' })}
            style={{ flex: 1, padding: '7px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--dim)', fontSize: 11, cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-border)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            🚪 Dilni
          </button>
        </div>
      </div>
    </aside>
  )
}
