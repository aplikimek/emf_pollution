'use client'
import { useState, useMemo } from 'react'
import type { Measurement, Project } from '@/lib/store'

interface Props { measurements: Measurement[]; project: Project; limit: number }

const CITIES = ['Tiranë','Durrës','Vlorë','Shkodër','Elbasan','Korçë','Fier','Berat','Gjirokastër','Lushnjë']

function med(arr: number[]) {
  const s = [...arr].sort((a,b)=>a-b)
  const m = Math.floor(s.length/2)
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2
}
function avg(arr: number[]) { return arr.reduce((a,b)=>a+b,0)/arr.length }
function fmt(n: number) { return isNaN(n) ? '—' : n.toFixed(3) }

export default function ReportsPanel({ measurements, project, limit }: Props) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [type,     setType]     = useState('all')
  const [busy,     setBusy]     = useState('')

  const filtered = useMemo(() => measurements.filter(m => {
    if (dateFrom && new Date(m.createdAt) < new Date(dateFrom)) return false
    if (dateTo   && new Date(m.createdAt) > new Date(dateTo + 'T23:59:59')) return false
    if (type === 'excess' && m.emaxVm < limit) return false
    if (type === 'safe'   && m.emaxVm >= limit) return false
    return true
  }), [measurements, dateFrom, dateTo, type, limit])

  /* ── XLS export ─────────────────────────────────────── */
  async function xlsSummary() {
    setBusy('xls-sum'); const XLSX = await import('xlsx')
    const emax = filtered.map(m=>m.emaxVm), eavg = filtered.map(m=>m.eavgVm), emin = filtered.map(m=>m.eminVm)
    const over = filtered.filter(m=>m.emaxVm>=limit).length
    const rows = [
      {Fusha:'Emax (V/m)', Min:Math.min(...emax).toFixed(3), Maks:Math.max(...emax).toFixed(3), Mesatare:avg(emax).toFixed(3), Mediane:med(emax).toFixed(3)},
      {Fusha:'Eavg (V/m)', Min:Math.min(...eavg).toFixed(3), Maks:Math.max(...eavg).toFixed(3), Mesatare:avg(eavg).toFixed(3), Mediane:med(eavg).toFixed(3)},
      {Fusha:'Emin (V/m)', Min:Math.min(...emin).toFixed(3), Maks:Math.max(...emin).toFixed(3), Mesatare:avg(emin).toFixed(3), Mediane:med(emin).toFixed(3)},
      {Fusha:'Mbi Kufir ICNIRP', Min:'', Maks:'', Mesatare:`${over}/${filtered.length}`, Mediane:`${(over/filtered.length*100).toFixed(1)}%`},
    ]
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Permbledhje')
    XLSX.writeFile(wb, `${project.name}_permbledhje.xlsx`); setBusy('')
  }

  async function xlsList() {
    setBusy('xls-list'); const XLSX = await import('xlsx')
    const rows = filtered.map((m,i)=>({ Nr:i+1, Vendodhja:m.locationName||'', Lat:m.lat, Lon:m.lon, 'Emax(V/m)':m.emaxVm, 'Eavg(V/m)':m.eavgVm, 'Emin(V/m)':m.eminVm, 'Freq(GHz)':m.frequencyGhz??'', 'Largesia(m)':m.distanceM??'', 'Lartesia(m)':m.hightM??'', Data:new Date(m.createdAt).toLocaleDateString('sq-AL') }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Matjet')
    XLSX.writeFile(wb, `${project.name}_matjet.xlsx`); setBusy('')
  }

  async function xlsExcess() {
    setBusy('xls-exc'); const XLSX = await import('xlsx')
    const rows = filtered.filter(m=>m.emaxVm>=limit).map((m,i)=>({ Nr:i+1, Vendodhja:m.locationName||'', Lat:m.lat, Lon:m.lon, 'Emax(V/m)':m.emaxVm, 'Kufiri(V/m)':limit, '%Kufiri':(m.emaxVm/limit*100).toFixed(1)+'%', Data:new Date(m.createdAt).toLocaleDateString('sq-AL') }))
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{Mesazh:'Asnjë tejkalim i kufirit'}])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Tejkalimet')
    XLSX.writeFile(wb, `${project.name}_tejkalimet.xlsx`); setBusy('')
  }

  async function xlsZones() {
    setBusy('xls-zon'); const XLSX = await import('xlsx')
    const zones: Record<string,Measurement[]> = {}
    filtered.forEach(m => { const z = m.locationName||'E paemërtuar'; (zones[z]=zones[z]||[]).push(m) })
    const rows = Object.entries(zones).map(([z,ms])=>({ Zona:z, Matje:ms.length, 'EmaxMes(V/m)':avg(ms.map(m=>m.emaxVm)).toFixed(3), 'EmaxMaks(V/m)':Math.max(...ms.map(m=>m.emaxVm)).toFixed(3), 'MbiKufir':ms.filter(m=>m.emaxVm>=limit).length }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Zonat')
    XLSX.writeFile(wb, `${project.name}_zonat.xlsx`); setBusy('')
  }

  /* ── PDF export ─────────────────────────────────────── */
  async function pdfSummary() {
    setBusy('pdf-sum')
    const { jsPDF } = await import('jspdf'); const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF(); const d = new Date().toLocaleDateString('sq-AL')
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('RAPORT PERMBLEDHESJEJE', 14, 20)
    doc.setFont('helvetica','normal'); doc.setFontSize(10)
    doc.text(`Projekti: ${project.name}`, 14, 30)
    doc.text(`Data: ${d}  |  Matje: ${filtered.length}  |  Kufiri ICNIRP: ${limit} V/m`, 14, 37)
    const emax = filtered.map(m=>m.emaxVm), eavg = filtered.map(m=>m.eavgVm), emin = filtered.map(m=>m.eminVm)
    const over = filtered.filter(m=>m.emaxVm>=limit).length
    autoTable(doc, { startY:45, head:[['Fusha','Min','Maks','Mesatare','Mediane']], body:[
      ['Emax (V/m)', fmt(Math.min(...emax)), fmt(Math.max(...emax)), fmt(avg(emax)), fmt(med(emax))],
      ['Eavg (V/m)', fmt(Math.min(...eavg)), fmt(Math.max(...eavg)), fmt(avg(eavg)), fmt(med(eavg))],
      ['Emin (V/m)', fmt(Math.min(...emin)), fmt(Math.max(...emin)), fmt(avg(emin)), fmt(med(emin))],
      ['Mbi Kufir ICNIRP','',`${over}/${filtered.length}`,`${(over/Math.max(filtered.length,1)*100).toFixed(1)}%`,''],
    ], styles:{fontSize:9}, headStyles:{fillColor:[30,58,82]} })
    doc.save(`${project.name}_permbledhje.pdf`); setBusy('')
  }

  async function pdfList() {
    setBusy('pdf-list')
    const { jsPDF } = await import('jspdf'); const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF('landscape'); doc.setFont('helvetica','bold'); doc.setFontSize(14)
    doc.text('LISTA E MATJEVE', 14, 18)
    doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.text(`${project.name}  |  ${new Date().toLocaleDateString('sq-AL')}  |  ${filtered.length} matje`, 14, 26)
    autoTable(doc, { startY:32, head:[['#','Vendodhja','Lat','Lon','Emax','Eavg','Emin','GHz','Data']], body: filtered.map((m,i)=>[i+1, m.locationName||'—', m.lat.toFixed(5), m.lon.toFixed(5), m.emaxVm.toFixed(3), m.eavgVm.toFixed(3), m.eminVm.toFixed(3), m.frequencyGhz??'—', new Date(m.createdAt).toLocaleDateString('sq-AL')]), styles:{fontSize:7}, headStyles:{fillColor:[30,58,82]} })
    doc.save(`${project.name}_matjet.pdf`); setBusy('')
  }

  async function pdfExcess() {
    setBusy('pdf-exc')
    const { jsPDF } = await import('jspdf'); const { default: autoTable } = await import('jspdf-autotable')
    const exc = filtered.filter(m=>m.emaxVm>=limit)
    const doc = new jsPDF(); doc.setFont('helvetica','bold'); doc.setFontSize(14)
    doc.text('TEJKALIMET E KUFIRIT ICNIRP', 14, 18)
    doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.text(`${project.name}  |  Kufiri: ${limit} V/m  |  ${exc.length} tejkalime nga ${filtered.length} matje`, 14, 26)
    if (exc.length === 0) { doc.text('Asnje tejkalim i kufirit ICNIRP ne periudhen e zgjedhur.', 14, 40) }
    else {
      autoTable(doc, { startY:32, head:[['#','Vendodhja','Lat','Lon','Emax (V/m)','Kufiri (V/m)','% Kufiri','Data']], body: exc.map((m,i)=>[i+1, m.locationName||'—', m.lat.toFixed(5), m.lon.toFixed(5), m.emaxVm.toFixed(3), limit, (m.emaxVm/limit*100).toFixed(1)+'%', new Date(m.createdAt).toLocaleDateString('sq-AL')]), styles:{fontSize:8}, headStyles:{fillColor:[192,32,64]}, bodyStyles:{textColor:[30,0,0]}, alternateRowStyles:{fillColor:[255,240,240]} })
    }
    doc.save(`${project.name}_tejkalimet.pdf`); setBusy('')
  }

  async function pdfZones() {
    setBusy('pdf-zon')
    const { jsPDF } = await import('jspdf'); const { default: autoTable } = await import('jspdf-autotable')
    const zones: Record<string,Measurement[]> = {}
    filtered.forEach(m => { const z = m.locationName||'E paemertuar'; (zones[z]=zones[z]||[]).push(m) })
    const doc = new jsPDF(); doc.setFont('helvetica','bold'); doc.setFontSize(14)
    doc.text('STATISTIKA SIPAS ZONAVE', 14, 18)
    doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.text(`${project.name}  |  ${new Date().toLocaleDateString('sq-AL')}`, 14, 26)
    autoTable(doc, { startY:32, head:[['Zona','Matje','Emax Mes (V/m)','Emax Maks (V/m)','Mbi Kufir']], body: Object.entries(zones).map(([z,ms])=>[z, ms.length, avg(ms.map(m=>m.emaxVm)).toFixed(3), Math.max(...ms.map(m=>m.emaxVm)).toFixed(3), ms.filter(m=>m.emaxVm>=limit).length]), styles:{fontSize:8}, headStyles:{fillColor:[30,58,82]} })
    doc.save(`${project.name}_zonat.pdf`); setBusy('')
  }

  /* ── Manual PDF ──────────────────────────────────────── */
  async function generateManual() {
    setBusy('manual')
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const W = doc.internal.pageSize.getWidth()
    let y = 20

    const h1 = (t: string) => { if(y>250){doc.addPage();y=20} doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(30,58,82); doc.text(t,14,y); y+=10; doc.setTextColor(0,0,0) }
    const h2 = (t: string) => { if(y>255){doc.addPage();y=20} doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(t,14,y); y+=7 }
    const p  = (t: string) => { if(y>258){doc.addPage();y=20} doc.setFont('helvetica','normal'); doc.setFontSize(9); const lines = doc.splitTextToSize(t, W-28) as string[]; doc.text(lines,14,y); y+=lines.length*5+2 }
    const sep = () => { y+=4; doc.setDrawColor(200); doc.line(14,y,W-14,y); y+=6 }

    // Cover
    doc.setFillColor(30,58,82); doc.rect(0,0,W,50,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(245,200,66)
    doc.text('EMF POLLUTION GIS', W/2, 22, {align:'center'})
    doc.setFontSize(11); doc.setTextColor(168,200,224)
    doc.text('Manual Perdorimi — v2.0', W/2, 32, {align:'center'})
    doc.text('emf-pollution.infomat.app', W/2, 42, {align:'center'})
    doc.setTextColor(0,0,0); y = 60

    h1('1. Pershkrim i Pergjithshem'); sep()
    p('EMF Pollution GIS eshte nje aplikacion web per mbledhjen, analizimin dhe vizualizimin e matjeve te fushe elektromagnetike (EMF). Sistemi perdoret per monitorimin e ekspozimit ndaj rrezatimit elektromagnetik ne zona urbane dhe krahasimin me kufijtë e lejuar nga ICNIRP/EU.')
    p('Aplikacioni mbeshtet pune ne ekip me role te ndryshme (Admin, Editor, Viewer), ruajtje te dhenash ne cloud, harta interaktive GIS, interpolim gjeografik, analiza statistikore dhe eksport ne formate te shumta.')

    h1('2. Rolet e Perdoruesve'); sep()
    h2('Admin'); p('• Sheh dhe menaxhon te gjithe perdoruesit\n• Ndryshon rolet e perdoruesve\n• Ka akses te plote ne te gjitha projektet dhe cilesimet')
    h2('Editor'); p('• Krijon projekte te reja\n• Ngarkon te dhena CSV\n• Kryen analiza dhe eksporton rezultate')
    h2('Viewer'); p('• Shikon hartat dhe grafiket\n• Shkarkon raportet\n• Nuk mund te modifikoje te dhenat')

    h1('3. Projektet'); sep()
    p('Cdo projekt perfaqeson nje fushe matjesh per nje zone dhe periudhe te caktuar. Per te krijuar nje projekt te ri: klikoni "+ PROJEKT I RI" ne Dashboard, plotesoni emrin, pershkrimin dhe frekuencen WiFi.')

    h1('4. Ngarkimi i CSV'); sep()
    p('Formati i pritur i skedarit CSV:\nLocation, lat, lon, distanceM, hightM, frequencyGhz, emaxVm, eavgVm, eminVm')
    p('Shembull:\nSheshi Skenderbej, 41.3275, 19.8187, 50, 1.5, 2.4, 2.34, 1.87, 1.42')
    p('Kolona e detyrueshme: lat, lon, emaxVm. Kolonat tjera jane opsionale.')

    h1('5. Harta dhe Interpolimi'); sep()
    h2('Metodat e Interpolimit:')
    p('• IDW (Inverse Distance Weighting): metoda me e shpejte, e mire per shperndarje uniforme\n• NN (Nearest Neighbor): interpolim me fqinjin me te afer, e shpejte dhe e thjeshtë\n• Kriging: metoda geostatistikore, me e sakta per kampione te shperndara mirë\n• RBF Gaussian: funksion baze radiale, e mire per siperfaqe te lëmuara')
    p('Parametri "p" (power) kontrollon forcen e ndikimit te pikave te aferta ne IDW.')

    h1('6. Raportet'); sep()
    p('• Raporti Permbledhejes: statistika min/maks/mesatare per te gjitha fushat\n• Lista e Matjeve: te gjitha matjet me koordinata dhe data\n• Tejkalimet e Kufirit: vetem matjet mbi kufirin ICNIRP\n• Statistika Sipas Zonave: analiza e grupuar sipas vendodhjes')
    p('Cdo raport mund te eksportohet si XLSX (Excel) ose PDF.')

    h1('7. Kufinjte ICNIRP/EU'); sep()
    p('Referenca per vlerat kufitare te ekspozimit (ICNIRP 1998 / EU 1999/519/EC):')
    p('• 900 MHz: 41.2 V/m\n• 1800 MHz: 58.3 V/m\n• 2100 MHz: 61.4 V/m\n• 2400 MHz: 61.4 V/m\n• 5000 MHz: 61.4 V/m')

    h1('8. Kontakt dhe Mbeshtetje'); sep()
    p('Per probleme teknike ose pyetje, kontaktoni administratorin e sistemit.')
    p(`Gjeneruar automatikisht nga EMF Pollution GIS — ${new Date().toLocaleDateString('sq-AL')}`)

    doc.save('manual_emf_gis.pdf'); setBusy('')
  }

  const card = (icon: string, title: string, desc: string, color: string, onXLS: ()=>void, onPDF: ()=>void, busyKey: string) => (
    <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:14,padding:'1.5rem',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:10 }}>
      <span style={{ fontSize:36 }}>{icon}</span>
      <div style={{ fontWeight:700,fontSize:13,color:'var(--text-strong)' }}>{title}</div>
      <div style={{ fontSize:11,color:'var(--dim)',lineHeight:1.5,flex:1 }}>{desc}</div>
      <div style={{ display:'flex',gap:8,marginTop:4 }}>
        <button onClick={onXLS} disabled={!!busy} style={{ padding:'4px 14px',borderRadius:6,border:'1px solid rgba(46,232,154,0.4)',background:'rgba(46,232,154,0.1)',color:'var(--green)',fontSize:10,fontWeight:700,cursor:'pointer',opacity:busy===`xls-${busyKey}`?0.5:1 }}>
          {busy===`xls-${busyKey}`?'...':'XLS'}
        </button>
        <button onClick={onPDF} disabled={!!busy} style={{ padding:'4px 14px',borderRadius:6,border:'1px solid rgba(240,56,88,0.4)',background:'rgba(240,56,88,0.1)',color:'var(--red)',fontSize:10,fontWeight:700,cursor:'pointer',opacity:busy===`pdf-${busyKey}`?0.5:1 }}>
          {busy===`pdf-${busyKey}`?'...':'PDF'}
        </button>
      </div>
    </div>
  )

  const inp: React.CSSProperties = { background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 10px',color:'var(--text)',fontSize:11,outline:'none',colorScheme:'dark' }

  return (
    <div style={{ padding:'1.5rem',maxWidth:900,margin:'0 auto' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:12 }}>
        <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:'var(--text-strong)',letterSpacing:2,margin:0 }}>RAPORTET</h2>
        <button onClick={generateManual} disabled={!!busy} style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:'1px solid var(--border)',background:'var(--panel2)',color:'var(--dim)',fontSize:11,cursor:'pointer' }}>
          {busy==='manual'?'Po gjeneron...':'📖 Shkarko Manualin PDF'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem',flexWrap:'wrap',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:10,padding:'0.75rem 1rem' }}>
        <span style={{ fontSize:11,color:'var(--dim)' }}>Nga:</span>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inp} />
        <span style={{ fontSize:11,color:'var(--dim)' }}>Deri:</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inp} />
        <span style={{ fontSize:11,color:'var(--dim)' }}>Lloji:</span>
        <select value={type} onChange={e=>setType(e.target.value)} style={{...inp,cursor:'pointer'}}>
          <option value="all">Të gjitha</option>
          <option value="excess">Tejkalime kufiri</option>
          <option value="safe">Brenda kufirit</option>
        </select>
        <span style={{ marginLeft:'auto',fontSize:11,color:'var(--dim)' }}>{filtered.length} matje të zgjedhura</span>
      </div>

      {/* Report Cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem' }}>
        {card('📊','Raporti Përmbledhës','Statistika, min/maks/mesatare për të gjitha fushat','blue',xlsSummary,pdfSummary,'sum')}
        {card('📋','Lista e Matjeve','Të gjitha matjet në detaj me koordinata','green',xlsList,pdfList,'list')}
        {card('⚠️','Tejkalime Kufiri','Matjet mbi kufirin e lejuar EU/ICNIRP','red',xlsExcess,pdfExcess,'exc')}
        {card('📍','Statistika Sipas Zonave','Analizë e grupuar sipas vendodhjes','gold',xlsZones,pdfZones,'zon')}
      </div>

      {!filtered.length && (
        <div style={{ marginTop:'2rem',textAlign:'center',color:'var(--dim)',fontSize:13 }}>
          Asnjë matje nuk përputhet me filtrat e zgjedhur.
        </div>
      )}
    </div>
  )
}
