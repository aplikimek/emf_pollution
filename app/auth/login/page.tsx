'use client'
import { SignIn } from '@clerk/nextjs'
import { useTheme } from '@/components/ui/ThemeProvider'

export default function LoginPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#f5c842,#f06030)', fontSize: 34, boxShadow: '0 0 40px rgba(245,200,66,0.25)' }}>⚡</div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: 4, margin: 0 }}>EMF POLLUTION GIS</h1>
          <p style={{ color: 'var(--dim)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>Analizë Interaktive Elektromagnetike</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { role: 'Admin',  color: 'var(--red)',   desc: 'Menaxhon gjithçka' },
            { role: 'Editor', color: 'var(--gold)',  desc: 'Ngarkon & analizon' },
            { role: 'Viewer', color: 'var(--green)', desc: 'Vetëm shikon' },
          ].map(({ role, color, desc }) => (
            <div key={role} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{role}</div>
              <div style={{ color: 'var(--dim)', fontSize: 9, marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>

        <SignIn
          routing="hash"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorBackground:      dark ? '#080f1a' : '#ffffff',
              colorText:            dark ? '#a8c8e0' : '#1e3a52',
              colorPrimary:         dark ? '#f5c842' : '#b88a0a',
              colorInputBackground: dark ? '#0c1526' : '#e6f0f7',
              colorInputText:       dark ? '#a8c8e0' : '#1e3a52',
              borderRadius:         '10px',
            },
            elements: {
              rootBox:        { width: '100%' },
              card:           { background: dark ? '#080f1a' : '#ffffff', border: `1px solid ${dark ? '#18304e' : '#c2d6e8'}`, boxShadow: 'none' },
              headerTitle:    { display: 'none' },
              headerSubtitle: { display: 'none' },
            },
          }}
        />

        <p style={{ color: 'var(--dim)', fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}>
          Useri i parë bëhet automatikisht <span style={{ color: 'var(--red)', fontWeight: 700 }}>Admin</span>.<br/>
          Të tjerët marrin rolin <span style={{ color: 'var(--green)', fontWeight: 700 }}>Viewer</span>.
        </p>
      </div>
    </div>
  )
}
