'use client'
import { useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SessionUser } from '@/lib/auth'

const ROLE: Record<string,{c:string;bg:string;b:string}> = {
  admin:  {c:'#f03858',bg:'rgba(240,56,88,0.12)',b:'rgba(240,56,88,0.3)'},
  editor: {c:'#f5c842',bg:'rgba(245,200,66,0.12)',b:'rgba(245,200,66,0.3)'},
  viewer: {c:'#2ee89a',bg:'rgba(46,232,154,0.12)',b:'rgba(46,232,154,0.3)'},
}

export default function Sidebar({ user }: { user: SessionUser }) {
  const path  = usePathname()
  const { signOut } = useClerk()
  const rs    = ROLE[user.role]

  const nav = [
    { href:'/dashboard',   icon:'🗂', label:'Dashboard' },
    ...(user.role === 'admin' ? [
      { href:'/admin/users', icon:'👥', label:'Menaxhim Users' },
    ] : []),
  ]

  return (
    <aside style={{ width:218, background:'#080f1a', borderRight:'1px solid #18304e', display:'flex', flexDirection:'column', flexShrink:0, height:'100vh' }}>
      <Link href="/dashboard" style={{ textDecoration:'none', padding:'1.1rem', borderBottom:'1px solid #18304e', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#f5c842,#f06030)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, boxShadow:'0 0 14px rgba(245,200,66,0.2)' }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:800, letterSpacing:2, color:'#fff', lineHeight:1 }}>EMF GIS</div>
          <div style={{ fontSize:9, color:'#305070', letterSpacing:2, textTransform:'uppercase' }}>Pollution Analysis</div>
        </div>
      </Link>

      <nav style={{ flex:1, padding:'0.6rem', overflowY:'auto' }}>
        {nav.map(({ href, icon, label }) => {
          const active = href === '/dashboard' ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'0.55rem 0.75rem', borderRadius:8, marginBottom:2, textDecoration:'none', fontSize:12, fontWeight:500, color: active ? '#f5c842' : '#305070', background: active ? 'rgba(245,200,66,0.07)' : 'transparent', border: active ? '1px solid rgba(245,200,66,0.2)' : '1px solid transparent', transition:'all 0.15s' }}>
              <span style={{ fontSize:16 }}>{icon}</span>{label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding:'0.6rem', borderTop:'1px solid #18304e' }}>
        <div style={{ background:'#0c1526', borderRadius:10, padding:'0.75rem', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            {user.image ? (
              <img src={user.image} alt={user.name} width={32} height={32} style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
            ) : (
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#38c0f5,#2ee89a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#000', flexShrink:0 }}>
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:11, color:'#fff', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
              <div style={{ fontSize:9, color:'#305070', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase', background:rs.bg, color:rs.c, border:`1px solid ${rs.b}` }}>
            {user.role}
          </span>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: '/auth/login' })}
          style={{ width:'100%', padding:'7px', background:'none', border:'1px solid #18304e', borderRadius:8, color:'#305070', fontSize:11, cursor:'pointer' }}
          onMouseEnter={e=>{(e.currentTarget).style.color='#f03858';(e.currentTarget).style.borderColor='rgba(240,56,88,0.3)'}}
          onMouseLeave={e=>{(e.currentTarget).style.color='#305070';(e.currentTarget).style.borderColor='#18304e'}}>
          🚪 Dilni
        </button>
      </div>
    </aside>
  )
}
