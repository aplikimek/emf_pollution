'use client'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

const S = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#04080f', padding:'1rem' } as const,
  card:  { width:'100%', maxWidth:400, background:'#080f1a', border:'1px solid #18304e', borderRadius:18, padding:'2.5rem', textAlign:'center' as const },
  logo:  { display:'inline-flex', alignItems:'center', justifyContent:'center', width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#f5c842,#f06030)', fontSize:34, marginBottom:16, boxShadow:'0 0 40px rgba(245,200,66,0.25)' },
  h1:    { fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:800, color:'#fff', letterSpacing:4, marginBottom:6 },
  sub:   { color:'#305070', fontSize:11, letterSpacing:2, textTransform:'uppercase' as const, marginBottom:32 },
  divider: { borderTop:'1px solid #18304e', margin:'24px 0', position:'relative' as const },
  btn:   { width:'100%', padding:'14px 20px', borderRadius:12, border:'1px solid #18304e', background:'#0c1526', color:'#a8c8e0', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:12, transition:'all 0.2s' } as const,
}

function LoginInner() {
  const params = useSearchParams()
  const cb     = params.get('callbackUrl') || '/dashboard'
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    await signIn('google', { callbackUrl: cb })
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>⚡</div>
        <h1 style={S.h1}>EMF POLLUTION GIS</h1>
        <p style={S.sub}>Analizë Interaktive Elektromagnetike</p>

        {/* Role info chips */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:28, flexWrap:'wrap' }}>
          {[
            { role:'Admin',  color:'#f03858', desc:'Menaxhon gjithçka' },
            { role:'Editor', color:'#f5c842', desc:'Ngarkon & analizon' },
            { role:'Viewer', color:'#2ee89a', desc:'Vetëm shikon' },
          ].map(({ role, color, desc }) => (
            <div key={role} style={{ background:`${color}12`, border:`1px solid ${color}30`, borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
              <div style={{ color, fontSize:11, fontWeight:700, letterSpacing:1 }}>{role}</div>
              <div style={{ color:'#305070', fontSize:9, marginTop:2 }}>{desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor='rgba(66,133,244,0.5)'; t.style.background='rgba(66,133,244,0.08)' }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor='#18304e'; t.style.background='#0c1526' }}
          style={{ ...S.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.5-11.2-8.3l-6.5 5C9.5 39.4 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4-4.1 5.3l6.2 5.2C36.9 40.7 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          {loading ? 'Po identifikohet...' : 'Hyni me Google'}
        </button>

        <p style={{ color:'#305070', fontSize:11, marginTop:20, lineHeight:1.6 }}>
          Useri i parë që hyn bëhet automatikisht <span style={{ color:'#f03858', fontWeight:700 }}>Admin</span>.<br/>
          Të tjerët marrin rolin <span style={{ color:'#2ee89a', fontWeight:700 }}>Viewer</span> deri sa adminni t'u ndryshojë rolin.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#04080f', color:'#305070' }}>
        Duke ngarkuar...
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
