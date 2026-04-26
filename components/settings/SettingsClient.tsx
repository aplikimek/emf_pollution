'use client'
import { useState } from 'react'
import type { AppSettings } from '@/lib/store'
import type { SessionUser } from '@/lib/auth'

const CITIES = ['Tiranë','Durrës','Vlorë','Shkodër','Elbasan','Korçë','Fier','Berat','Gjirokastër','Lushnjë','Kavajë','Pogradec','Kukës','Lezhë','Sarandë']

interface Props { initial: AppSettings; user: SessionUser }

export default function SettingsClient({ initial, user }: Props) {
  const [s, setS] = useState<AppSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')
  const canEdit = user.role !== 'viewer'

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(s) })
    setMsg(res.ok ? '✓ Cilësimet u ruajtën' : '⚠ Gabim gjatë ruajtjes')
    setSaving(false); setTimeout(()=>setMsg(''), 3000)
  }

  async function exportJSON() {
    const a = document.createElement('a')
    a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(s, null, 2))
    a.download = 'emf_settings.json'; a.click()
  }

  async function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const text = await f.text()
    try { setS(JSON.parse(text)); setMsg('✓ Konfigurim i ngarkuar') }
    catch { setMsg('⚠ Skedar JSON i pavlefshëm') }
    e.target.value = ''; setTimeout(()=>setMsg(''), 3000)
  }

  function resetDefaults() {
    if (!confirm('Rivendos cilësimet në vlerat fillestare?')) return
    setS({ city:'Tiranë', icnirpLimits:{'900':41.2,'1800':58.3,'2100':61.4,default:41.2}, measurementTypes:{emf:true,airQuality:false,noise:false,radiation:false} })
    setMsg('Cilësimet u rivendosën — klikoni Ruaj për të konfirmuar')
  }

  const inp: React.CSSProperties = { width:'100%',background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:8,padding:'0.6rem 0.85rem',color:'var(--text)',fontSize:13,outline:'none' }
  const panel = (title: string, icon: string, children: React.ReactNode) => (
    <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:14,padding:'1.5rem' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:'1.25rem' }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:700,color:'var(--text-strong)',letterSpacing:1,margin:0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
  const lbl = (text: string) => <label style={{ display:'block',color:'var(--dim)',fontSize:9,letterSpacing:2,textTransform:'uppercase',marginBottom:6 }}>{text}</label>

  return (
    <div style={{ flex:1,overflow:'auto',padding:'1.5rem' }}>
      <div style={{ maxWidth:900,margin:'0 auto' }}>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:800,color:'var(--text-strong)',letterSpacing:3,textTransform:'uppercase',margin:'0 0 1.5rem' }}>Cilësimet</h1>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem' }}>

          {/* Geographic */}
          {panel('Konfigurim Gjeografik','🌍',(
            <div>
              {lbl('Qyteti / Rajoni')}
              <select value={s.city} onChange={e=>setS({...s,city:e.target.value})} disabled={!canEdit} style={{...inp,cursor:'pointer'}}>
                {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ))}

          {/* ICNIRP limits */}
          {panel('Kufiri i Ekspozimit (ICNIRP/EU)','⚡',(
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {([['900','Kufiri Emax për 900 MHz (V/m)'],['1800','Kufiri Emax për 1800 MHz (V/m)'],['2100','Kufiri Emax për 2100 MHz (V/m)'],['default','Kufiri i paracaktuar (V/m) — nëse frekuenca nuk dihet']] as const).map(([k,label])=>(
                <div key={k}>
                  {lbl(label)}
                  <input type="number" step="0.1" value={s.icnirpLimits[k]} disabled={!canEdit}
                    onChange={e=>setS({...s,icnirpLimits:{...s.icnirpLimits,[k]:parseFloat(e.target.value)||0}})}
                    style={inp} />
                </div>
              ))}
            </div>
          ))}

          {/* Measurement types */}
          {panel('Llojet e Matjes','🌿',(
            <div>
              <p style={{ fontSize:11,color:'var(--dim)',marginBottom:12 }}>Aktivizo llojet e matjes sipas nevojës</p>
              {([['emf','🧲 Fusha Elektromagnetike (EMF)'],['airQuality','💨 Cilësia e Ajrit (PM2.5, PM10, CO2, O3)'],['noise','🔊 Zhurmë (dB)'],['radiation','☢️ Rrezatim (µSv/h)']] as const).map(([k,label])=>(
                <label key={k} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10,cursor:canEdit?'pointer':'default' }}>
                  <input type="checkbox" checked={s.measurementTypes[k]} disabled={!canEdit}
                    onChange={e=>setS({...s,measurementTypes:{...s.measurementTypes,[k]:e.target.checked}})}
                    style={{ accentColor:'var(--gold)',width:15,height:15 }} />
                  <span style={{ fontSize:12,color:'var(--text)' }}>{label}</span>
                </label>
              ))}
            </div>
          ))}

          {/* Export / Import */}
          {panel('Eksporto / Importo Konfigurim','💾',(
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button onClick={exportJSON} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12,cursor:'pointer',textAlign:'left' }}>
                💾 Eksporto të dhënat (JSON)
              </button>
              <label style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12,cursor:'pointer' }}>
                📂 Importo të dhënat (JSON)
                <input type="file" accept=".json" style={{ display:'none' }} onChange={importJSON} disabled={!canEdit} />
              </label>
              {canEdit && (
                <button onClick={resetDefaults} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'var(--red-tint)',border:'1px solid var(--red-border)',borderRadius:8,color:'var(--red)',fontSize:12,cursor:'pointer',textAlign:'left' }}>
                  🗑 Reset Sistemi (vlerat fillestare)
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Save bar */}
        {canEdit && (
          <div style={{ position:'sticky',bottom:0,background:'var(--bg)',padding:'1rem 0',display:'flex',alignItems:'center',gap:12 }}>
            <button onClick={save} disabled={saving} style={{ flex:1,padding:'0.9rem',background:'var(--green-tint)',border:'1px solid var(--green-border)',borderRadius:10,color:'var(--green)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:2,cursor:'pointer',opacity:saving?0.6:1 }}>
              {saving ? 'Duke ruajtur...' : '💾 Ruaj Cilësimet'}
            </button>
            {msg && <span style={{ fontSize:12,color:msg.startsWith('⚠')?'var(--red)':'var(--green)' }}>{msg}</span>}
          </div>
        )}
        {!canEdit && <p style={{ fontSize:12,color:'var(--dim)',textAlign:'center',marginTop:'1rem' }}>Vetëm adminët dhe editorët mund të modifikojnë cilësimet.</p>}
      </div>
    </div>
  )
}
