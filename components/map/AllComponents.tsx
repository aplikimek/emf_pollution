'use client'
import { useState } from 'react'
import type { Measurement, Project } from '@/lib/store'
import { eH } from '@/components/charts/StatsCharts'

// ── CROSS VALIDATION ─────────────────────────────────────────
function d2(a:number,b:number,c:number,d:number){return Math.sqrt((a-c)**2+(b-d)**2)}
function p2(lat:number,lon:number,pts:Measurement[],m:string,fk:string,pow:number){
  if(m==='nn'){let md=1e9,v=0;for(const p of pts){const r=d2(lat,lon,p.lat,p.lon);if(r<md){md=r;v=(p as any)[fk]}}return v}
  const s=0.018;let n=0,d=0;for(const p of pts){const r=d2(lat,lon,p.lat,p.lon);const w=m==='rbf'?Math.exp(-(r*r)/(2*s*s)):m==='kriging'?Math.max(0,1-Math.exp(-3*r/0.025)):1/r**pow;n+=w*(p as any)[fk];d+=w}return d>0.001?n/d:0
}

export function CrossVal({measurements,limit,method,idwPower}:{measurements:Measurement[];limit:number;method:string;idwPower:number}){
  const [cvM,setCvM]=useState<'loo'|'kfold'|'rand'>('loo')
  const [k,setK]=useState(5)
  const [fld,setFld]=useState<'emax'|'eavg'|'emin'>('emax')
  const [res,setRes]=useState<any>(null)
  const [run,setRun]=useState(false)
  function doRun(){
    if(measurements.length<5)return;setRun(true)
    const fk=fld==='emax'?'emaxVm':fld==='eavg'?'eavgVm':'eminVm'
    const obs:number[]=[],prd:number[]=[]
    setTimeout(()=>{
      if(cvM==='loo'){for(let i=0;i<measurements.length;i++){obs.push((measurements[i] as any)[fk]);prd.push(p2(measurements[i].lat,measurements[i].lon,measurements.filter((_,j)=>j!==i),method,fk,idwPower))}}
      else if(cvM==='kfold'){const sh=[...measurements].sort(()=>Math.random()-.5);const fs=Math.ceil(sh.length/k);for(let f=0;f<k;f++){const s=f*fs,e=Math.min(s+fs,sh.length);const test=sh.slice(s,e),train=[...sh.slice(0,s),...sh.slice(e)];for(const pt of test){obs.push((pt as any)[fk]);prd.push(p2(pt.lat,pt.lon,train,method,fk,idwPower))}}}
      else{const sh=[...measurements].sort(()=>Math.random()-.5);const sp=Math.floor(sh.length*.7);for(const pt of sh.slice(sp)){obs.push((pt as any)[fk]);prd.push(p2(pt.lat,pt.lon,sh.slice(0,sp),method,fk,idwPower))}}
      const n=obs.length,mae=obs.reduce((s,o,i)=>s+Math.abs(o-prd[i]),0)/n,rmse=Math.sqrt(obs.reduce((s,o,i)=>s+(o-prd[i])**2,0)/n)
      const mo=obs.reduce((a,b)=>a+b,0)/n,r2=1-obs.reduce((s,o,i)=>s+(o-prd[i])**2,0)/(obs.reduce((s,o)=>s+(o-mo)**2,0)||1)
      const bias=obs.reduce((s,o,i)=>s+(prd[i]-o),0)/n,over=obs.filter(o=>o>=limit).length
      setRes({mae:mae.toFixed(3),rmse:rmse.toFixed(3),r2:r2.toFixed(4),bias:bias.toFixed(3),over,n,obs,prd,res:obs.map((o,i)=>prd[i]-o)})
      setRun(false)
    },50)
  }
  const card={background:'#080f1a',border:'1px solid #18304e',borderRadius:12,padding:'1rem'}
  const sel={background:'#0c1526',border:'1px solid #18304e',borderRadius:8,padding:'5px 8px',color:'#a8c8e0',fontSize:11,outline:'none',cursor:'pointer'}
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div style={card}>
        <div style={{fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Konfigurimi</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:10,alignItems:'end'}}>
          <div><div style={{fontSize:9,color:'#305070',marginBottom:4}}>Metoda CV</div>
            <select value={cvM} onChange={e=>setCvM(e.target.value as any)} style={sel}>
              <option value="loo">Leave-One-Out</option><option value="kfold">K-Fold</option><option value="rand">Random 70/30</option>
            </select></div>
          <div><div style={{fontSize:9,color:'#305070',marginBottom:4}}>K={k}</div>
            <input type="range" min={3} max={10} value={k} onChange={e=>setK(+e.target.value)} style={{width:'100%',accentColor:'#f5c842'}}/></div>
          <div><div style={{fontSize:9,color:'#305070',marginBottom:4}}>Fusha</div>
            <select value={fld} onChange={e=>setFld(e.target.value as any)} style={sel}>
              <option value="emax">Emax</option><option value="eavg">Eavg</option><option value="emin">Emin</option>
            </select></div>
          <button onClick={doRun} disabled={run||measurements.length<5}
            style={{padding:'8px 16px',background:'#0c2a10',border:'1px solid #2ee89a',borderRadius:8,color:'#2ee89a',fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,letterSpacing:2,cursor:'pointer',opacity:run||measurements.length<5?0.4:1}}>
            {run?'...':'▶ KRYEJ'}</button>
        </div>
        {measurements.length<5&&<div style={{marginTop:8,fontSize:11,color:'#f03858'}}>⚠ Duhen ≥5 matje</div>}
      </div>
      {res&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'0.75rem'}}>
            {[{l:'MAE (V/m)',v:res.mae,c:'#2ee89a'},{l:'RMSE (V/m)',v:res.rmse,c:'#38c0f5'},{l:'R² Score',v:res.r2,c:+res.r2>0.85?'#2ee89a':+res.r2>0.6?'#f5c842':'#f03858'},{l:'Bias',v:res.bias,c:Math.abs(+res.bias)<1?'#2ee89a':'#f5c842'},{l:'% mbi kufi',v:`${res.over}/${res.n}`,c:'#f03858'},{l:'Pikë test',v:res.n,c:'#a8c8e0'}].map(({l,v,c})=>(
              <div key={l} style={card}><div style={{fontSize:8,color:'#305070',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>{l}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:700,color:c}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div style={card}>
              <div style={{fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>Observed vs Predicted</div>
              <div style={{position:'relative',height:150,border:'1px solid #18304e',borderRadius:8,overflow:'hidden',background:'#0c1526'}}>
                {res.obs.map((o:number,i:number)=>{const mn=Math.min(...res.obs,...res.prd),mx2=Math.max(...res.obs,...res.prd),rng=mx2-mn||1;const x=((o-mn)/rng)*88+6,y=100-((res.prd[i]-mn)/rng)*88-6;return<div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:6,height:6,borderRadius:'50%',background:'#f5c842',transform:'translate(-50%,-50%)',opacity:.7}}/>})}
              </div>
            </div>
            <div style={card}>
              <div style={{fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>Residualet</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:1,height:150,padding:'0 4px'}}>
                {res.res.map((r:number,i:number)=>{const ma=Math.max(...res.res.map((x:number)=>Math.abs(x)))||1;const h=Math.abs(r)/ma*70;return(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:r>=0?'flex-end':'flex-start',height:'100%'}}>
                    <div style={{width:'100%',height:`${h}%`,background:r>0?'#f06030':'#f5c842',opacity:.75,borderRadius:r>0?'2px 2px 0 0':'0 0 2px 2px',minHeight:1}}/>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── MEASUREMENTS TABLE ────────────────────────────────────────
export function MeasTable({measurements,limit,canEdit,onDelete}:{measurements:Measurement[];limit:number;canEdit:boolean;onDelete:(id:string)=>void}){
  if(!measurements.length)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#305070',fontSize:13}}>Nuk ka matje. Ngarko CSV.</div>
  function cat(e:number){const p=e/limit;return p<0.5?{l:'I sigurt',c:'#2ee89a'}:p<0.75?{l:'Mesatar',c:'#f5c842'}:p<1?{l:'Afër kufirit',c:'#f06030'}:{l:'MBI KUFI ⚠',c:'#f03858'}}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:'#fff',letterSpacing:2}}>TABELA E MATJEVE</h3>
        <span style={{color:'#305070',fontSize:11}}>{measurements.length} matje · ICNIRP <span style={{color:'#f03858'}}>{limit} V/m</span></span>
      </div>
      <div style={{background:'#080f1a',border:'1px solid #18304e',borderRadius:12,overflow:'hidden'}}>
        <div style={{overflowX:'auto',maxHeight:'calc(100vh - 220px)',overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead>
              <tr>{['#','Lokacioni','GHz','Emax','Eavg','Emin','Dist(m)','H(m)','ICNIRP',canEdit?'Del':''].filter(Boolean).map(h=>(
                <th key={h} style={{background:'#0c1526',color:'#305070',padding:'6px 8px',textAlign:'left',fontSize:8,letterSpacing:1,textTransform:'uppercase',borderBottom:'1px solid #18304e',position:'sticky',top:0}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {measurements.map((m,i)=>{const{l,c}=cat(m.emaxVm);return(
                <tr key={m.id} style={{borderBottom:'1px solid rgba(24,48,78,0.4)'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(245,200,66,0.03)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                  <td style={{padding:'4px 8px',color:'#305070'}}>{i+1}</td>
                  <td style={{padding:'4px 8px',color:'#a8c8e0'}}>{m.locationName||'—'}</td>
                  <td style={{padding:'4px 8px',color:'#a8c8e0'}}>{m.frequencyGhz||'—'}</td>
                  <td style={{padding:'4px 8px',color:eH(m.emaxVm,limit),fontWeight:700}}>{m.emaxVm}</td>
                  <td style={{padding:'4px 8px',color:eH(m.eavgVm,limit)}}>{m.eavgVm}</td>
                  <td style={{padding:'4px 8px',color:eH(m.eminVm,limit)}}>{m.eminVm}</td>
                  <td style={{padding:'4px 8px',color:'#305070'}}>{m.distanceM||'—'}</td>
                  <td style={{padding:'4px 8px',color:'#305070'}}>{m.hightM||'—'}</td>
                  <td style={{padding:'4px 8px'}}><span style={{background:`${c}18`,border:`1px solid ${c}40`,color:c,padding:'1px 7px',borderRadius:8,fontSize:8,fontWeight:700}}>{l}</span></td>
                  {canEdit&&<td style={{padding:'4px 8px'}}><button onClick={()=>{if(confirm('Fshi matjen?'))onDelete(m.id)}} style={{background:'none',border:'none',color:'#305070',cursor:'pointer',fontSize:13}}
                    onMouseEnter={e=>(e.currentTarget).style.color='#f03858'} onMouseLeave={e=>(e.currentTarget).style.color='#305070'}>🗑</button></td>}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── EXPORT PANEL ─────────────────────────────────────────────
export function ExportPanel({measurements,gridCache,gridMeta,project,limit}:{measurements:Measurement[];gridCache:{lat:number;lon:number;val:number}[];gridMeta:Record<string,number>;project:Project;limit:number}){
  const slug=project.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
  function dl(content:string|ArrayBuffer,name:string,mime:string){const b=content instanceof ArrayBuffer?new Blob([content],{type:mime}):new Blob([content],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click()}
  function expCSV(){const h='Location,lat,lon,Distance (m),Hight (m),Frequency (GHz),Emax (V/m),Eavg (V/m),Emin (V/m),ICNIRP_limit,over_limit\n';const r=measurements.map(m=>`${m.locationName||''},${m.lat},${m.lon},${m.distanceM||''},${m.hightM||''},${m.frequencyGhz||''},${m.emaxVm},${m.eavgVm},${m.eminVm},${limit},${m.emaxVm>=limit?'YES':'NO'}`).join('\n');dl(h+r,`${slug}_data.csv`,'text/csv')}
  function expGeoJSON(){const fc={type:'FeatureCollection',features:measurements.map(m=>({type:'Feature',geometry:{type:'Point',coordinates:[m.lon,m.lat]},properties:{Location:m.locationName,Emax_Vm:m.emaxVm,Eavg_Vm:m.eavgVm,Emin_Vm:m.eminVm,ICNIRP_Vm:limit,over_limit:m.emaxVm>=limit?'YES':'NO',pct_limit:+(m.emaxVm/limit*100).toFixed(2)}}))};dl(JSON.stringify(fc,null,2),`${slug}_points.geojson`,'application/json')}
  function expGeoTIFF(){
    if(!gridCache.length||!gridMeta.resolution){alert('Kryej interpolimin fillimisht');return}
    const{minLat,maxLat,minLon,maxLon,resolution:r}=gridMeta;const W=r|0,H=r|0
    const dlat=(maxLat-minLat)/H,dlon=(maxLon-minLon)/W,pixels=new Float32Array(W*H)
    for(const c of gridCache){const col=Math.round((c.lon-minLon)/dlon),row=H-1-Math.round((c.lat-minLat)/dlat);if(col>=0&&col<W&&row>=0&&row<H)pixels[row*W+col]=c.val}
    const numT=14,iOff=8,iSz=2+numT*12+4,bOff=iOff+iSz,sOff=bOff+2,tOff=sOff+24,gOff=tOff+48,pOff=gOff+80
    const buf=new ArrayBuffer(pOff+W*H*4);const v=new DataView(buf);const u=new Uint8Array(buf)
    u[0]=0x49;u[1]=0x49;v.setUint16(2,42,true);v.setUint32(4,iOff,true)
    let tIdx=iOff+2;const T=(t:number,ty:number,c:number,val:number)=>{v.setUint16(tIdx,t,true);v.setUint16(tIdx+2,ty,true);v.setUint32(tIdx+4,c,true);v.setUint32(tIdx+8,val,true);tIdx+=12}
    v.setUint16(iOff,numT,true);T(256,4,1,W);T(257,4,1,H);T(258,3,1,32);T(259,3,1,1);T(262,3,1,1);T(278,4,1,H);T(273,4,1,pOff);T(277,3,1,1);T(279,4,1,W*H*4);T(284,3,1,1);T(339,3,1,3);T(33550,12,3,sOff);T(33922,12,6,tOff);T(34736,3,20,gOff);v.setUint32(tIdx,0,true)
    v.setFloat64(sOff,dlon,true);v.setFloat64(sOff+8,dlat,true);v.setFloat64(sOff+16,0,true)
    v.setFloat64(tOff,0,true);v.setFloat64(tOff+8,0,true);v.setFloat64(tOff+16,0,true);v.setFloat64(tOff+24,minLon,true);v.setFloat64(tOff+32,maxLat,true);v.setFloat64(tOff+40,0,true)
    v.setUint16(gOff,1,true);v.setUint16(gOff+2,1,true);v.setUint16(gOff+4,0,true);v.setUint16(gOff+6,4,true)
    v.setUint16(gOff+8,1024,true);v.setUint16(gOff+10,0,true);v.setUint16(gOff+12,1,true);v.setUint16(gOff+14,2,true)
    v.setUint16(gOff+16,2048,true);v.setUint16(gOff+18,0,true);v.setUint16(gOff+20,1,true);v.setUint16(gOff+30,4326,true)
    for(let i=0;i<pixels.length;i++)v.setFloat32(pOff+i*4,pixels[i],true)
    dl(buf,`${slug}_raster.tif`,'image/tiff')
  }
  function expSHP(){
    import('jszip').then(({default:JSZip})=>{
      const N=measurements.length,sb=new ArrayBuffer(100+N*28);const sv=new DataView(sb)
      sv.setInt32(0,9994,false);sv.setInt32(24,(100+N*28)/2,false);sv.setInt32(28,1000,true);sv.setInt32(32,1,true)
      const lats=measurements.map(m=>m.lat),lons=measurements.map(m=>m.lon)
      sv.setFloat64(36,Math.min(...lons),true);sv.setFloat64(44,Math.min(...lats),true);sv.setFloat64(52,Math.max(...lons),true);sv.setFloat64(60,Math.max(...lats),true)
      let off=100;for(let i=0;i<N;i++){sv.setInt32(off,i+1,false);sv.setInt32(off+4,10,false);sv.setInt32(off+8,1,true);sv.setFloat64(off+12,measurements[i].lon,true);sv.setFloat64(off+20,measurements[i].lat,true);off+=28}
      const xb=new ArrayBuffer(100+N*8);const xv=new DataView(xb);xv.setInt32(0,9994,false);xv.setInt32(24,(100+N*8)/2,false);xv.setInt32(28,1000,true);xv.setInt32(32,1,true);xv.setFloat64(36,Math.min(...lons),true);xv.setFloat64(44,Math.min(...lats),true);xv.setFloat64(52,Math.max(...lons),true);xv.setFloat64(60,Math.max(...lats),true);let xo=100,ro=100;for(let i=0;i<N;i++){xv.setInt32(xo,ro/2,false);xv.setInt32(xo+4,10,false);xo+=8;ro+=28}
      const flds=[{n:'Location',t:'C',l:40},{n:'lat',t:'N',l:14,d:8},{n:'lon',t:'N',l:14,d:8},{n:'Emax_Vm',t:'N',l:12,d:4},{n:'Eavg_Vm',t:'N',l:12,d:4},{n:'Emin_Vm',t:'N',l:12,d:4},{n:'ICNIRP_Vm',t:'N',l:10,d:2},{n:'over_limit',t:'C',l:3}]
      const rl=1+flds.reduce((s,f)=>s+f.l,0),dHL=32+flds.length*32+1,db=new ArrayBuffer(dHL+N*rl+1);const du=new Uint8Array(db);const dv2=new DataView(db)
      du[0]=3;dv2.setUint32(4,N,true);dv2.setUint16(8,dHL,true);dv2.setUint16(10,rl,true);let fo=32;const enc=new TextEncoder()
      for(const f of flds){const nb=enc.encode(f.n.substring(0,11).padEnd(11,'\0'));for(let i=0;i<11;i++)du[fo+i]=nb[i];du[fo+11]=f.t.charCodeAt(0);du[fo+16]=f.l;du[fo+17]=(f as any).d||0;fo+=32}
      du[fo]=0x0D;let do2=dHL
      for(const m of measurements){du[do2++]=0x20;const vals=[m.locationName||'',m.lat.toFixed(8),m.lon.toFixed(8),m.emaxVm.toFixed(4),m.eavgVm.toFixed(4),m.eminVm.toFixed(4),limit.toFixed(2),m.emaxVm>=limit?'YES':'NO'];for(let fi=0;fi<flds.length;fi++){const fl=flds[fi].l;const s=String(vals[fi]).substring(0,fl).padStart(fl,' ');const by=enc.encode(s);for(let bi=0;bi<fl;bi++)du[do2+bi]=bi<by.length?by[bi]:0x20;do2+=fl}}
      du[do2]=0x1A
      const prj='GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
      const zip=new JSZip();zip.file(`${slug}.shp`,sb);zip.file(`${slug}.shx`,xb);zip.file(`${slug}.dbf`,db);zip.file(`${slug}.prj`,prj)
      zip.generateAsync({type:'blob',compression:'DEFLATE'}).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${slug}_shapefile.zip`;a.click()})
    })
  }
  const btn=(ico:string,lbl:string,sub:string,fn:()=>void,dis=false)=>(
    <button onClick={fn} disabled={dis} style={{padding:'12px 8px',background:'#080f1a',border:'1px solid #18304e',borderRadius:10,color:dis?'#305070':'#a8c8e0',cursor:dis?'not-allowed':'pointer',textAlign:'center',transition:'all 0.15s',opacity:dis?0.4:1}} onMouseEnter={e=>{if(!dis){(e.currentTarget).style.borderColor='rgba(56,192,245,0.4)';(e.currentTarget).style.background='rgba(56,192,245,0.04)'}}} onMouseLeave={e=>{(e.currentTarget).style.borderColor='#18304e';(e.currentTarget).style.background='#080f1a'}}>
      <div style={{fontSize:20,marginBottom:4}}>{ico}</div>
      <div style={{fontSize:11,fontWeight:600}}>{lbl}</div>
      <div style={{fontSize:9,color:'#305070',marginTop:2}}>{sub}</div>
    </button>
  )
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div style={{background:'#080f1a',border:'1px solid #18304e',borderRadius:12,padding:'1rem'}}>
        <div style={{fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>Formatet e eksportit</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.75rem'}}>
          {btn('📊','CSV','Të gjitha fushat',expCSV)}
          {btn('🔵','GeoJSON','Pikët · QGIS',expGeoJSON)}
          {btn('🗂','Shapefile','ZIP · .shp+.dbf+.prj',expSHP)}
          {btn('🛰','GeoTIFF','Float32 · EPSG:4326',expGeoTIFF,!gridCache.length)}
          {btn('🌐','GeoJSON Grid','Rrjeta interpoluar',()=>{if(!gridCache.length){alert('Kryej interpolimin');return}const thin=gridCache.filter((_,i)=>i%4===0);dl(JSON.stringify({type:'FeatureCollection',features:thin.map(c=>({type:'Feature',geometry:{type:'Point',coordinates:[c.lon,c.lat]},properties:{E_Vm:+c.val.toFixed(4),ICNIRP_Vm:limit,over_limit:c.val>=limit?'YES':'NO'}}))}),`${slug}_grid.geojson`,'application/json')},!gridCache.length)}
        </div>
      </div>
      <div style={{background:'#080f1a',border:'1px solid #18304e',borderRadius:12,padding:'1rem',fontSize:11,color:'#305070',lineHeight:1.8}}>
        <div style={{color:'#a8c8e0',fontWeight:600,marginBottom:8}}>Udhëzime QGIS:</div>
        <div><b style={{color:'#f5c842'}}>CSV:</b> Layer → Add Delimited Text → X=lon, Y=lat → EPSG:4326</div>
        <div><b style={{color:'#f5c842'}}>GeoJSON:</b> Layer → Add Vector Layer → zgjidh .geojson</div>
        <div><b style={{color:'#f5c842'}}>Shapefile:</b> Shpalos ZIP, pastaj Layer → Add Vector Layer → .shp</div>
        <div><b style={{color:'#f5c842'}}>GeoTIFF:</b> Layer → Add Raster Layer → Symbology → Singleband pseudocolor</div>
      </div>
    </div>
  )
}

// ── MEMBERS MODAL ─────────────────────────────────────────────
export function MembersModal({projectId,ownerId,currentUserId,onClose}:{projectId:string;ownerId:string;currentUserId:string;onClose:()=>void}){
  const [members,setMembers]=useState<any[]>([])
  const [available,setAvailable]=useState<any[]>([])
  const [sel,setSel]=useState('')
  const [role,setRole]=useState<'editor'|'viewer'>('viewer')
  const [loading,setLoading]=useState(false)
  useState(()=>{fetch(`/api/projects/${projectId}`).then(r=>r.json()).then(d=>{setMembers(d.members||[]);setAvailable(d.available||[])})})
  async function add(){if(!sel)return;setLoading(true);await fetch(`/api/projects/${projectId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',userId:sel,role})});const r=await fetch(`/api/projects/${projectId}`);const d=await r.json();setMembers(d.members||[]);setSel('');setLoading(false)}
  async function rem(uid:string){await fetch(`/api/projects/${projectId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'remove',userId:uid})});setMembers(prev=>prev.filter((m:any)=>m.userId!==uid))}
  const card={background:'#080f1a',border:'1px solid #18304e',borderRadius:16,padding:'1.5rem',width:'100%',maxWidth:480,maxHeight:'80vh',overflowY:'auto' as const}
  const inp={background:'#0c1526',border:'1px solid #18304e',borderRadius:8,padding:'6px 10px',color:'#a8c8e0',fontSize:11,outline:'none',cursor:'pointer'}
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:'#fff',letterSpacing:2,margin:0}}>ANËTARËT</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#305070',fontSize:22,cursor:'pointer',lineHeight:1}}>×</button>
        </div>
        {members.length>0&&(
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>Anëtarët aktualë</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {members.map((m:any)=>(
                <div key={m.userId} style={{display:'flex',alignItems:'center',gap:10,background:'#0c1526',borderRadius:8,padding:'8px 12px'}}>
                  {m.image?<img src={m.image} alt="" width={28} height={28} style={{borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>:<div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#38c0f5,#2ee89a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#000',flexShrink:0}}>{m.name?.[0]?.toUpperCase()||'?'}</div>}
                  <div style={{flex:1,overflow:'hidden'}}><div style={{fontSize:12,color:'#fff',fontWeight:600}}>{m.name}</div><div style={{fontSize:10,color:'#305070'}}>{m.email}</div></div>
                  <span style={{fontSize:9,padding:'2px 8px',borderRadius:20,fontWeight:700,letterSpacing:1,textTransform:'uppercase',background:m.role==='editor'?'rgba(245,200,66,0.15)':'rgba(46,232,154,0.15)',color:m.role==='editor'?'#f5c842':'#2ee89a',border:`1px solid ${m.role==='editor'?'rgba(245,200,66,0.3)':'rgba(46,232,154,0.3)'}`}}>{m.role}</span>
                  {currentUserId!==m.userId&&<button onClick={()=>rem(m.userId)} style={{background:'none',border:'none',color:'#305070',cursor:'pointer',fontSize:14,lineHeight:1}} onMouseEnter={e=>(e.currentTarget).style.color='#f03858'} onMouseLeave={e=>(e.currentTarget).style.color='#305070'}>🗑</button>}
                </div>
              ))}
            </div>
          </div>
        )}
        {available.length>0&&(
          <div style={{borderTop:'1px solid #18304e',paddingTop:'1rem'}}>
            <div style={{fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>Shto anëtar</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={sel} onChange={e=>setSel(e.target.value)} style={{...inp,flex:1}}><option value="">Zgjidh userin...</option>{available.map((u:any)=><option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select>
              <select value={role} onChange={e=>setRole(e.target.value as any)} style={inp}><option value="viewer">Viewer</option><option value="editor">Editor</option></select>
              <button onClick={add} disabled={!sel||loading} style={{padding:'6px 14px',background:'#0c2a10',border:'1px solid #2ee89a',borderRadius:8,color:'#2ee89a',fontSize:11,cursor:'pointer',opacity:!sel||loading?0.5:1}}>{loading?'...':'+ Shto'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
