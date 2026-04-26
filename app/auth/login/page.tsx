'use client'
import { SignIn } from '@clerk/nextjs'

const S = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#04080f', padding:'1rem' } as const,
  card: { width:'100%', maxWidth:420, display:'flex', flexDirection:'column' as const, alignItems:'center', gap:24 },
  logo: { display:'inline-flex', alignItems:'center', justifyContent:'center', width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#f5c842,#f06030)', fontSize:34, boxShadow:'0 0 40px rgba(245,200,66,0.25)' },
}

export default function LoginPage() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>⚡</div>
        <div style={{ textAlign:'center' }}>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:800, color:'#fff', letterSpacing:4, margin:0 }}>EMF POLLUTION GIS</h1>
          <p style={{ color:'#305070', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginTop:6 }}>Analizë Interaktive Elektromagnetike</p>
        </div>

        <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
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

        <SignIn
          routing="hash"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorBackground:     '#080f1a',
              colorText:           '#a8c8e0',
              colorPrimary:        '#f5c842',
              colorInputBackground:'#0c1526',
              colorInputText:      '#a8c8e0',
              borderRadius:        '10px',
            },
            elements: {
              rootBox:    { width:'100%' },
              card:       { background:'#080f1a', border:'1px solid #18304e', boxShadow:'none' },
              headerTitle:{ display:'none' },
              headerSubtitle: { display:'none' },
            },
          }}
        />

        <p style={{ color:'#305070', fontSize:11, textAlign:'center', lineHeight:1.6 }}>
          Useri i parë bëhet automatikisht <span style={{ color:'#f03858', fontWeight:700 }}>Admin</span>.<br/>
          Të tjerët marrin rolin <span style={{ color:'#2ee89a', fontWeight:700 }}>Viewer</span>.
        </p>
      </div>
    </div>
  )
}
