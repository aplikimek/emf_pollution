'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Papa from 'papaparse'
import type { Project, Measurement } from '@/lib/store'
import type { SessionUser } from '@/lib/auth'
import Link from 'next/link'
import MembersModal  from '@/components/ui/MembersModal'
import ExportPanel   from '@/components/map/ExportPanel'
import CrossVal      from '@/components/map/CrossVal'
import MeasTable     from '@/components/map/MeasTable'
import StatsCharts   from '@/components/charts/StatsCharts'
import ReportsPanel  from '@/components/map/ReportsPanel'

import type { Basemap } from '@/components/map/GISMap'

const DEMO_ROWS = [
  { locationName:'Sheshi Skënderbej', lat:41.3275, lon:19.8187, distanceM:50,  hightM:1.5, frequencyGhz:2.4, emaxVm:2.34, eavgVm:1.87, eminVm:1.42 },
  { locationName:'Blloku',            lat:41.3198, lon:19.8172, distanceM:30,  hightM:1.5, frequencyGhz:2.4, emaxVm:3.12, eavgVm:2.54, eminVm:1.98 },
  { locationName:'Rruga e Kavajës',   lat:41.3221, lon:19.8098, distanceM:40,  hightM:1.5, frequencyGhz:2.4, emaxVm:4.56, eavgVm:3.89, eminVm:3.21 },
  { locationName:'Stadiumi Q.Stafa',  lat:41.3312, lon:19.8223, distanceM:60,  hightM:2.0, frequencyGhz:2.4, emaxVm:1.98, eavgVm:1.65, eminVm:1.23 },
  { locationName:'Pazari i Ri',       lat:41.3289, lon:19.8134, distanceM:25,  hightM:1.5, frequencyGhz:2.4, emaxVm:5.23, eavgVm:4.12, eminVm:3.45 },
  { locationName:'Universiteti',      lat:41.3167, lon:19.8189, distanceM:80,  hightM:1.5, frequencyGhz:2.4, emaxVm:2.87, eavgVm:2.34, eminVm:1.76 },
  { locationName:'Parku Rinia',       lat:41.3254, lon:19.8201, distanceM:35,  hightM:1.5, frequencyGhz:2.4, emaxVm:1.54, eavgVm:1.23, eminVm:0.98 },
  { locationName:'Myslym Shyri',      lat:41.3234, lon:19.8156, distanceM:20,  hightM:1.5, frequencyGhz:2.4, emaxVm:6.78, eavgVm:5.43, eminVm:4.12 },
  { locationName:'Kinostudio',        lat:41.3345, lon:19.8267, distanceM:45,  hightM:2.0, frequencyGhz:2.4, emaxVm:2.12, eavgVm:1.78, eminVm:1.34 },
  { locationName:'Komuna e Parisit',  lat:41.3178, lon:19.8134, distanceM:55,  hightM:1.5, frequencyGhz:2.4, emaxVm:3.45, eavgVm:2.87, eminVm:2.23 },
  { locationName:'Rruga Fortuzi',     lat:41.3298, lon:19.8089, distanceM:30,  hightM:1.5, frequencyGhz:2.4, emaxVm:4.89, eavgVm:3.98, eminVm:3.12 },
  { locationName:'Selvia',            lat:41.3267, lon:19.8245, distanceM:40,  hightM:1.5, frequencyGhz:2.4, emaxVm:2.67, eavgVm:2.12, eminVm:1.65 },
  { locationName:'Vasil Shanto',      lat:41.3189, lon:19.8212, distanceM:35,  hightM:1.5, frequencyGhz:2.4, emaxVm:3.98, eavgVm:3.23, eminVm:2.56 },
  { locationName:'Ali Demi',          lat:41.3156, lon:19.8298, distanceM:50,  hightM:2.0, frequencyGhz:2.4, emaxVm:1.87, eavgVm:1.54, eminVm:1.12 },
  { locationName:'Laprake',           lat:41.3389, lon:19.8312, distanceM:65,  hightM:2.0, frequencyGhz:2.4, emaxVm:2.45, eavgVm:1.98, eminVm:1.56 },
]

const GISMap = dynamic(() => import('@/components/map/GISMap'), {
  ssr: false,
  loading: () => (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#030810', color:'#305070' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:40, marginBottom:8 }}>🗺</div><p style={{ fontSize:13 }}>Po ngarkohet harta...</p></div>
    </div>
  ),
})

const TABS = [
  {id:'map',     ico:'🗺', lbl:'Hartë'},
  {id:'charts',  ico:'📊', lbl:'Analiza'},
  {id:'cv',      ico:'✓',  lbl:'Cross-Val'},
  {id:'export',  ico:'⬇',  lbl:'Export'},
  {id:'table',   ico:'📋', lbl:'Tabelë'},
  {id:'reports', ico:'📑', lbl:'Raporte'},
]

interface Props {
  project: Project; initMeasurements: Measurement[]
  user: SessionUser; projectRole: 'admin'|'editor'|'viewer'
}

export default function ProjectClient({ project, initMeasurements, user, projectRole }: Props) {
  const [tab,    setTab]    = useState('map')
  const [meas,   setMeas]   = useState<Measurement[]>(initMeasurements)
  const [upl,    setUpl]    = useState(false)
  const [uplMsg, setUplMsg] = useState('')
  const [showM,  setShowM]  = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [field,  setField]  = useState<'emax'|'eavg'|'emin'>('emax')
  const [method, setMethod] = useState<'idw'|'nn'|'kriging'|'rbf'>('idw')
  const [power,  setPower]  = useState(2)
  const [res,    setRes]    = useState(80)
  const [grid,    setGrid]    = useState<{lat:number;lon:number;val:number}[]>([])
  const [meta,    setMeta]    = useState<Record<string,number>>({})
  const [basemap, setBasemap] = useState<Basemap>('dark')

  const canEdit = projectRole !== 'viewer'
  const isOwner = user.role === 'admin' || project.ownerId === user.id
  const limit   = project.icnirpLimit

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUpl(true); setUplMsg('Po lexohet CSV...')
    Papa.parse(file, {
      header:true, dynamicTyping:true, skipEmptyLines:true,
      complete: async (r) => {
        const rows = r.data as any[]
        const k    = rows[0] ? Object.keys(rows[0]) : []
        const fi   = (v:string[]) => k.find(x => v.some(y => x.toLowerCase().includes(y)))
        const lK   = fi(['lat','latitude']), oK = fi(['lon','lng','longitude'])
        if (!lK || !oK) { setUplMsg('⚠ lat/lon mungojnë'); setUpl(false); return }
        const body = rows.map((r:any)=>({
          locationName: r['Location']||r['location']||'',
          lat: Number(r[lK!]), lon: Number(r[oK!]),
          distanceM:    Number(r[fi(['distance','dist'])||'']||0)||null,
          hightM:       Number(r[fi(['hight','height','alt'])||'']||0)||null,
          frequencyGhz: Number(r[fi(['frequency','freq','ghz'])||'']||0)||null,
          emaxVm: Number(r[fi(['emax','e_max'])||'']||0),
          eavgVm: Number(r[fi(['eavg','e_avg'])||'']||0),
          eminVm: Number(r[fi(['emin','e_min'])||'']||0),
        })).filter((r:any)=>!isNaN(r.lat)&&!isNaN(r.lon)&&r.emaxVm>0)
        setUplMsg(`Po zëvendësohen me ${body.length} matje...`)
        const res = await fetch(`/api/measurements/${project.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ replace:true, rows:body }) })
        const data = await res.json()
        if (!res.ok) { setUplMsg(`⚠ ${data.error}`); setUpl(false); return }
        setMeas(data)
        setUplMsg(`✓ ${data.length} matje nga CSV`)
        setUpl(false); setTimeout(()=>setUplMsg(''),4000)
        e.target.value=''
      }
    })
  }

  async function handleDelete(id: string) {
    await fetch(`/api/measurements/${project.id}`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({measurementId:id}) })
    setMeas(prev=>prev.filter(m=>m.id!==id))
  }

  async function handleLoadDemo() {
    setUplMsg('Po ngarkohen matjet demo...')
    const res = await fetch(`/api/measurements/${project.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ replace:true, rows:DEMO_ROWS }) })
    const data = await res.json()
    if (!res.ok) { setUplMsg(`⚠ ${data.error}`); return }
    setMeas(data)
    setUplMsg(`✓ ${data.length} matje demo u ngarkuan`)
    setTimeout(()=>setUplMsg(''),4000)
  }

  async function handleClearAll() {
    setConfirmClear(false)
    setUplMsg('Po fshihen të gjitha matjet...')
    await fetch(`/api/measurements/${project.id}`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({all:true}) })
    setMeas([])
    setUplMsg('✓ Të gjitha matjet u fshinë')
    setTimeout(()=>setUplMsg(''),3000)
  }

  // ── Shared styles ─────────────────────────────────────────
  const tabBtn = (a: boolean) => ({ width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,cursor:'pointer',border:`1px solid ${a?'var(--gold-border)':'transparent'}`,background:a?'var(--gold-glow)':'none',color:a?'var(--gold)':'var(--dim)',transition:'all 0.15s' } as const)
  const fieldBtn = (a: boolean) => ({ padding:'3px 10px',borderRadius:6,border:`1px solid ${a?'var(--gold-border)':'transparent'}`,background:a?'var(--gold-tint)':'none',color:a?'var(--gold)':'var(--dim)',fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase' as const,cursor:'pointer' })

  return (
    <div style={{ flex:1,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden' }}>
      {/* ── Header ── */}
      <header style={{ flexShrink:0,height:52,background:'var(--panel)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,padding:'0 1rem' }}>
        <Link href="/dashboard" style={{ color:'var(--dim)',textDecoration:'none',fontSize:18,lineHeight:1 }}>←</Link>
        <div style={{ width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#f5c842,#f06030)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--text-strong)',letterSpacing:1,lineHeight:1 }}>{project.name}</div>
          <div style={{ fontSize:9,color:'var(--dim)' }}>{meas.length} matje · {project.frequency} GHz · ICNIRP {limit} V/m</div>
        </div>
        <div style={{ display:'flex',gap:4,marginLeft:12 }}>
          {(['emax','eavg','emin'] as const).map(f=><button key={f} onClick={()=>setField(f)} style={fieldBtn(field===f)}>{f}</button>)}
        </div>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8 }}>
          {uplMsg && <span style={{ fontSize:11,padding:'3px 10px',borderRadius:20,background:uplMsg.startsWith('⚠')?'var(--red-tint)':'var(--green-tint)',color:uplMsg.startsWith('⚠')?'var(--red)':'var(--green)' }}>{uplMsg}</span>}
          {canEdit && (
            <label style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',border:'1px solid var(--blue-border)',borderRadius:8,color:'var(--blue)',fontSize:11,cursor:upl?'not-allowed':'pointer',opacity:upl?0.5:1 }}>
              ⬆ {upl?'Ngarkim...':'Ngarko CSV (zëvendëso)'}
              <input type="file" accept=".csv" style={{ display:'none' }} onChange={handleCSV} disabled={upl} />
            </label>
          )}
          {canEdit && (
            <button onClick={handleLoadDemo} style={{ padding:'5px 10px',border:'1px solid var(--gold-border)',borderRadius:8,color:'var(--gold)',fontSize:11,background:'var(--gold-glow)',cursor:'pointer' }}>
              📦 Demo
            </button>
          )}
          {canEdit && meas.length > 0 && (
            confirmClear
              ? <span style={{ display:'flex',alignItems:'center',gap:4 }}>
                  <span style={{ fontSize:10,color:'var(--red)' }}>Fshi {meas.length} matje?</span>
                  <button onClick={handleClearAll} style={{ padding:'4px 10px',border:'1px solid var(--red-border)',borderRadius:7,background:'var(--red-tint)',color:'var(--red)',fontSize:11,cursor:'pointer' }}>Po</button>
                  <button onClick={()=>setConfirmClear(false)} style={{ padding:'4px 10px',border:'1px solid var(--border)',borderRadius:7,background:'none',color:'var(--dim)',fontSize:11,cursor:'pointer' }}>Jo</button>
                </span>
              : <button onClick={()=>setConfirmClear(true)} style={{ padding:'5px 10px',border:'1px solid var(--border)',borderRadius:8,color:'var(--dim)',fontSize:11,background:'none',cursor:'pointer' }}>🗑 Pastro</button>
          )}
          {isOwner && (
            <button onClick={()=>setShowM(true)} style={{ padding:'5px 12px',border:'1px solid var(--border)',borderRadius:8,color:'var(--dim)',fontSize:11,background:'none',cursor:'pointer' }}>👥 Members</button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ flex:1,display:'flex',overflow:'hidden' }}>
        {/* Tab icons */}
        <div style={{ width:52,background:'var(--panel)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0',gap:4 }}>
          {TABS.map(({id,ico,lbl})=><button key={id} onClick={()=>setTab(id)} title={lbl} style={tabBtn(tab===id)}>{ico}</button>)}
        </div>

        {/* Map */}
        <div style={{ flex:1,display:tab==='map'?'flex':'none',flexDirection:'column',position:'relative' }}>
          {/* Interpolation controls - top right */}
          <div style={{ position:'absolute',top:10,right:10,zIndex:1000,display:'flex',alignItems:'center',gap:6,background:'rgba(4,8,15,0.88)',border:'1px solid #18304e',borderRadius:12,padding:'6px 10px',backdropFilter:'blur(6px)' }}>
            {([['idw','IDW'],['nn','NN'],['kriging','Kriging'],['rbf','RBF']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setMethod(v as any)} style={{ padding:'3px 9px',borderRadius:6,border:`1px solid ${method===v?'rgba(245,200,66,0.5)':'rgba(255,255,255,0.08)'}`,background:method===v?'rgba(245,200,66,0.18)':'transparent',color:method===v?'#f5c842':'#6080a0',fontSize:10,fontWeight:method===v?700:400,letterSpacing:.5,cursor:'pointer',transition:'all 0.15s' }}>{l}</button>
            ))}
            <span style={{ color:'#18304e',margin:'0 2px' }}>|</span>
            <span style={{ color:'#305070',fontSize:10 }}>p</span>
            <input type="range" min={1} max={5} step={0.5} value={power} onChange={e=>setPower(+e.target.value)} style={{ width:50,accentColor:'#f5c842' }} />
            <span style={{ color:'#f5c842',fontSize:10,minWidth:14 }}>{power}</span>
            <span style={{ color:'#18304e',margin:'0 2px' }}>|</span>
            <input type="range" min={30} max={150} step={10} value={res} onChange={e=>setRes(+e.target.value)} style={{ width:50,accentColor:'#f5c842' }} />
            <span style={{ color:'#f5c842',fontSize:10,minWidth:20 }}>{res}px</span>
          </div>
          {/* Basemap selector - top left */}
          <div style={{ position:'absolute',top:10,left:10,zIndex:1000,display:'flex',alignItems:'center',gap:4,background:'rgba(4,8,15,0.88)',border:'1px solid #18304e',borderRadius:12,padding:'6px 10px',backdropFilter:'blur(6px)' }}>
            <span style={{ color:'#305070',fontSize:9,fontWeight:700,letterSpacing:1,marginRight:2 }}>HARTË</span>
            {([
              ['dark',      '🌑', 'Dark'],
              ['streets',   '🗺', 'Google'],
              ['satellite', '🛰', 'Satelit'],
              ['hybrid',    '🌍', 'Hibrid'],
              ['asig',      '🛸', 'Satelitore 2025'],
            ] as const).map(([v,ico,lbl])=>(
              <button key={v} onClick={()=>setBasemap(v)} title={lbl} style={{ padding:'3px 8px',borderRadius:6,border:`1px solid ${basemap===v?'rgba(56,192,245,0.5)':'rgba(255,255,255,0.08)'}`,background:basemap===v?'rgba(56,192,245,0.15)':'transparent',color:basemap===v?'#38c0f5':'#6080a0',fontSize:10,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:3 }}>
                <span style={{ fontSize:11 }}>{ico}</span><span style={{ fontWeight:basemap===v?700:400 }}>{lbl}</span>
              </button>
            ))}
          </div>
          <GISMap measurements={meas} project={project} activeField={field} method={method} idwPower={power} resolution={res} limit={limit} basemap={basemap} onGridComputed={(g,m)=>{setGrid(g);setMeta(m)}} />
        </div>

        {tab==='charts'  && <div style={{ flex:1,overflow:'auto',padding:'1rem' }}><StatsCharts measurements={meas} limit={limit} activeField={field} /></div>}
        {tab==='cv'      && <div style={{ flex:1,overflow:'auto',padding:'1rem' }}><CrossVal measurements={meas} limit={limit} method={method} idwPower={power} /></div>}
        {tab==='export'  && <div style={{ flex:1,overflow:'auto',padding:'1rem' }}><ExportPanel measurements={meas} gridCache={grid} gridMeta={meta} project={project} limit={limit} /></div>}
        {tab==='table'   && <div style={{ flex:1,overflow:'auto',padding:'1rem' }}><MeasTable measurements={meas} limit={limit} canEdit={canEdit} onDelete={handleDelete} /></div>}
        {tab==='reports' && <div style={{ flex:1,overflow:'auto' }}><ReportsPanel measurements={meas} project={project} limit={limit} /></div>}
      </div>

      {showM && <MembersModal projectId={project.id} ownerId={project.ownerId} currentUserId={user.id} onClose={()=>setShowM(false)} />}
    </div>
  )
}
