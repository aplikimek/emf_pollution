'use client'
import { useEffect, useState } from 'react'

const ROLE_S: Record<string,{c:string;bg:string;b:string}> = {
  admin:  {c:'#f03858',bg:'rgba(240,56,88,0.12)',b:'rgba(240,56,88,0.3)'},
  editor: {c:'#f5c842',bg:'rgba(245,200,66,0.12)',b:'rgba(245,200,66,0.3)'},
  viewer: {c:'#2ee89a',bg:'rgba(46,232,154,0.12)',b:'rgba(46,232,154,0.3)'},
}

export default function AdminUsersClient({ currentUserId, projectCount }: { currentUserId:string; projectCount:number }) {
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<string|null>(null)

  useEffect(() => {
    fetch('/api/admin/users').then(r=>r.json()).then(d => { setUsers(d); setLoading(false) })
  }, [])

  async function changeRole(userId: string, role: string) {
    setSaving(userId)
    const res = await fetch('/api/admin/users', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId, role }) })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } else {
      const err = await res.json().catch(() => ({}))
      alert('Gabim: ' + (err.error ?? res.status))
    }
    setSaving(null)
  }

  const byRole = { admin:0, editor:0, viewer:0 }
  users.forEach(u => { byRole[u.role as keyof typeof byRole]++ })

  return (
    <main style={{ flex:1, overflow:'auto', padding:'1.5rem' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'2rem' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(240,56,88,0.12)', border:'1px solid rgba(240,56,88,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛡</div>
          <div>
            <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, fontWeight:800, color:'#fff', letterSpacing:3, margin:0, textTransform:'uppercase' }}>Menaxhim Users</h1>
            <p style={{ color:'#305070', fontSize:12, marginTop:2 }}>Paneli i Administratorit · {users.length} userë · {projectCount} projekte</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {(['admin','editor','viewer'] as const).map(role => (
            <div key={role} style={{ background:'#080f1a', border:`1px solid ${ROLE_S[role].b}`, borderRadius:12, padding:'1.25rem' }}>
              <div style={{ fontSize:10, color:'#305070', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{role}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:40, fontWeight:800, color:ROLE_S[role].c }}>{byRole[role]}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'#080f1a', border:'1px solid #18304e', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #18304e', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>👥</span>
            <span style={{ color:'#305070', fontSize:10, letterSpacing:2, textTransform:'uppercase' }}>Të gjithë users ({users.length})</span>
          </div>

          {loading ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'#305070' }}>Duke ngarkuar...</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  {['Useri','Email','Roli aktual','Ndrysho rolin','Regjistruar'].map(h => (
                    <th key={h} style={{ background:'#0c1526', color:'#305070', padding:'8px 12px', textAlign:'left', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', borderBottom:'1px solid #18304e' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}
                    style={{ borderBottom:'1px solid rgba(24,48,78,0.4)' }}
                    onMouseEnter={e=>(e.currentTarget).style.background='rgba(245,200,66,0.02)'}
                    onMouseLeave={e=>(e.currentTarget).style.background='transparent'}>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {u.image
                          ? <img src={u.image} alt="" width={28} height={28} style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                          : <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#38c0f5,#2ee89a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#000', flexShrink:0 }}>{u.name?.[0]?.toUpperCase()||'?'}</div>
                        }
                        <span style={{ color:'#a8c8e0', fontWeight:500 }}>{u.name}</span>
                        {u.id === currentUserId && <span style={{ fontSize:9, color:'#305070', background:'#0c1526', padding:'1px 6px', borderRadius:4, border:'1px solid #18304e' }}>JU</span>}
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px', color:'#305070' }}>{u.email}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase', background:ROLE_S[u.role].bg, color:ROLE_S[u.role].c, border:`1px solid ${ROLE_S[u.role].b}` }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      {u.id === currentUserId ? (
                        <span style={{ color:'#305070', fontSize:10 }}>— nuk mund ta ndryshoni</span>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <select
                            value={u.role}
                            onChange={e => changeRole(u.id, e.target.value)}
                            disabled={saving === u.id}
                            style={{ background:'#0c1526', border:'1px solid #18304e', borderRadius:7, padding:'4px 8px', color:'#a8c8e0', fontSize:11, outline:'none', cursor:'pointer', opacity:saving===u.id?0.5:1 }}>
                            <option value="viewer">viewer</option>
                            <option value="editor">editor</option>
                            <option value="admin">admin</option>
                          </select>
                          {saving === u.id && <span style={{ color:'#305070', fontSize:11 }}>Po ruhet...</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding:'10px 12px', color:'#305070', fontSize:10 }}>
                      {new Date(u.createdAt).toLocaleDateString('sq-AL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Instructions */}
        <div style={{ marginTop:'1.5rem', background:'#080f1a', border:'1px solid #18304e', borderRadius:12, padding:'1.25rem', fontSize:11, color:'#305070', lineHeight:1.8 }}>
          <div style={{ color:'#a8c8e0', fontWeight:600, marginBottom:8 }}>Rolet dhe aksesin:</div>
          <div><span style={{ color:'#f03858', fontWeight:700 }}>Admin</span> — sheh dhe menaxhon gjithçka, ndryshon rolet e userëve</div>
          <div><span style={{ color:'#f5c842', fontWeight:700 }}>Editor</span> — krijon projekte, ngarkon matje CSV, kryen analiza, eksporton</div>
          <div><span style={{ color:'#2ee89a', fontWeight:700 }}>Viewer</span> — vetëm shikon hartat dhe grafikët e projekteve ku ka akses</div>
          <div style={{ marginTop:8, color:'#18304e' }}>Useri i parë që hyn me Google bëhet automatikisht Admin.</div>
        </div>
      </div>
    </main>
  )
}
