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

  const roleColor = user.role === 'admin' ? 'var(--red)' : user.role === 'editor' ? 'var(--gold)' : 'var(--green)'

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 4 }}>
            Mirë se erdhët, <span style={{ color: 'var(--text)' }}>{user.name}</span>
            {' · '}
            <span style={{ fontWeight: 700, fontSize: 11, color: roleColor }}>{user.role.toUpperCase()}</span>
          </p>
        </div>
        {canCreate && <NewProjectBtn />}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '🗂', label: 'Projekte',     value: projects.length,                                           color: 'var(--blue)'  },
          { icon: '📡', label: 'Matje totale', value: projects.reduce((s, p) => s + ((p as any).measurementCount || 0), 0), color: 'var(--green)' },
          { icon: '👤', label: 'Roli',          value: user.role.toUpperCase(),                                   color: roleColor      },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ color: 'var(--dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</span>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--dim)', textAlign: 'center', gap: 12 }}>
          <span style={{ fontSize: 48, opacity: 0.3 }}>🗺</span>
          <p style={{ fontSize: 13 }}>{canCreate ? 'Krijoni projektin e parë me butonin + sipër.' : 'Nuk keni akses në asnjë projekt. Kontaktoni administratorin.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {projects.map(p => (
            <Link key={p.id} href={`/project/${p.id}`} className="project-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗺</div>
                <span style={{ fontSize: 10, color: 'var(--dim)', background: 'var(--panel2)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>{p.frequency} GHz</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: 1, marginBottom: 4 }}>{p.name}</div>
              {p.description && <p style={{ color: 'var(--dim)', fontSize: 11, marginBottom: 10 }}>{p.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--dim)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <span>ICNIRP {p.icnirpLimit} V/m</span>
                <span>🕒 {new Date(p.updatedAt).toLocaleDateString('sq-AL')}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: 'var(--dim)' }}>
                Pronari: <span style={{ color: 'var(--text)' }}>{p.ownerName}</span>
                {p.memberIds.length > 0 && <span style={{ marginLeft: 8 }}>· {p.memberIds.length} anëtar{p.memberIds.length !== 1 ? 'ë' : ''}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
