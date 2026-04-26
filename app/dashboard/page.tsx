import { getServerUser } from '@/lib/auth'
import { getProjectsForUser } from '@/lib/store'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewProjectBtn from '@/components/ui/NewProjectBtn'

export default async function DashboardPage() {
  const user = await getServerUser()
  if (!user) redirect('/auth/login')
  const projects = await getProjectsForUser(user.id, user.role)
  const canCreate = user.role !== 'viewer'

  const S = {
    page:  { padding:'1.5rem', maxWidth:1100, margin:'0 auto' },
    stat:  { background:'#080f1a', border:'1px solid #18304e', borderRadius:12, padding:'1.25rem' },
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'2rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:800, color:'#fff', letterSpacing:3, textTransform:'uppercase', margin:0 }}>Dashboard</h1>
          <p style={{ color:'#305070', fontSize:13, marginTop:4 }}>
            Mirë se erdhët, <span style={{ color:'#a8c8e0' }}>{user.name}</span>
            {' · '}
            <span style={{ fontWeight:700, fontSize:11, color: user.role==='admin'?'#f03858':user.role==='editor'?'#f5c842':'#2ee89a' }}>
              {user.role.toUpperCase()}
            </span>
          </p>
        </div>
        {canCreate && <NewProjectBtn />}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { icon:'🗂', label:'Projekte',     value:projects.length,                                  color:'#38c0f5' },
          { icon:'📡', label:'Matje totale', value:projects.reduce((s,p)=>s+(p as any).measurementCount||0,0), color:'#2ee89a' },
          { icon:'👤', label:'Roli',          value:user.role.toUpperCase(),                          color:user.role==='admin'?'#f03858':user.role==='editor'?'#f5c842':'#2ee89a' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={S.stat}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ color:'#305070', fontSize:10, letterSpacing:2, textTransform:'uppercase' }}>{label}</span>
            </div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:38, fontWeight:800, color, lineHeight:1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, color:'#305070', textAlign:'center', gap:12 }}>
          <span style={{ fontSize:48, opacity:0.3 }}>🗺</span>
          <p style={{ fontSize:13 }}>{canCreate ? 'Krijoni projektin e parë me butonin + sipër.' : 'Nuk keni akses në asnjë projekt. Kontaktoni administratorin.'}</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {projects.map(p => (
            <Link key={p.id} href={`/project/${p.id}`} className="project-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#0c1526', border:'1px solid #18304e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🗺</div>
                <span style={{ fontSize:10, color:'#305070', background:'#0c1526', padding:'3px 8px', borderRadius:20, border:'1px solid #18304e' }}>{p.frequency} GHz</span>
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:19, fontWeight:700, color:'#fff', letterSpacing:1, marginBottom:4 }}>{p.name}</div>
              {p.description && <p style={{ color:'#305070', fontSize:11, marginBottom:10 }}>{p.description}</p>}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#305070', paddingTop:10, borderTop:'1px solid #18304e' }}>
                <span>ICNIRP {p.icnirpLimit} V/m</span>
                <span>🕒 {new Date(p.updatedAt).toLocaleDateString('sq-AL')}</span>
              </div>
              <div style={{ marginTop:6, fontSize:10, color:'#305070' }}>
                Pronari: <span style={{ color:'#a8c8e0' }}>{p.ownerName}</span>
                {p.memberIds.length > 0 && <span style={{ marginLeft:8 }}>· {p.memberIds.length} anëtar{p.memberIds.length!==1?'ë':''}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
