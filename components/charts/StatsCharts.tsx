'use client'
import type { Measurement } from '@/lib/store'

export function eH(e:number,lim:number){const t=Math.min(1.5,e/lim);const s:any=[[26,64,200],[32,192,104],[240,208,0],[224,88,32],[224,16,48]];const i=Math.min(Math.floor(t/0.375),s.length-2);const f=t/0.375-i;const a=s[i],b=s[i+1];return'#'+[a[0]+(b[0]-a[0])*f|0,a[1]+(b[1]-a[1])*f|0,a[2]+(b[2]-a[2])*f|0].map((x:number)=>x.toString(16).padStart(2,'0')).join('')}

export default function StatsCharts({measurements,limit,activeField}:{measurements:Measurement[];limit:number;activeField:string}){
  if(!measurements.length)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#305070',fontSize:13}}>Ngarko matjet për statistika</div>
  const fk=activeField==='emax'?'emaxVm':activeField==='eavg'?'eavgVm':'eminVm' as any
  const vals=measurements.map(m=>m[fk as keyof Measurement] as number)
  const mx=Math.max(...vals)||1,B=8,step=mx/B
  const hist=Array.from({length:B},(_,i)=>({v:i*step,c:vals.filter(v=>v>=i*step&&v<(i+1)*step).length}))
  const safe=vals.filter(v=>v<limit).length,over=vals.length-safe
  const card={background:'#080f1a',border:'1px solid #18304e',borderRadius:12,padding:'1rem'}
  const title={fontSize:9,color:'#305070',letterSpacing:2,textTransform:'uppercase' as const,marginBottom:10}
  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
      <div style={card}>
        <div style={title}>Shpërndarja {activeField.toUpperCase()} (V/m)</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:3,height:110}}>
          {hist.map((h,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,height:'100%',justifyContent:'flex-end'}}>
              <div style={{width:'100%',background:eH(h.v+step/2,limit),opacity:.8,borderRadius:'3px 3px 0 0',height:h.c?`${(h.c/(Math.max(...hist.map(x=>x.c))||1))*100}%`:'2px',minHeight:2,transition:'height .3s'}}/>
              <div style={{fontSize:7,color:'#305070',writingMode:'vertical-rl',transform:'rotate(180deg)',height:32}}>{h.v.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={title}>Nën / Mbi kufi ICNIRP ({limit} V/m)</div>
        {[{l:'Nën kufi',v:safe,c:'#2ee89a'},{l:'Mbi kufi ⚠',v:over,c:'#f03858'}].map(({l,v,c})=>(
          <div key={l} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
              <span style={{color:'#a8c8e0'}}>{l}</span>
              <span style={{color:c,fontWeight:700}}>{v} ({vals.length?(v/vals.length*100).toFixed(1):0}%)</span>
            </div>
            <div style={{height:10,background:'#0c1526',borderRadius:5,overflow:'hidden',border:'1px solid #18304e'}}>
              <div style={{height:'100%',width:`${vals.length?(v/vals.length*100):0}%`,background:c,opacity:.7,borderRadius:5}}/>
            </div>
          </div>
        ))}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:12}}>
          {[{l:'Emax avg',v:measurements.reduce((s,m)=>s+m.emaxVm,0)/measurements.length},{l:'Eavg avg',v:measurements.reduce((s,m)=>s+m.eavgVm,0)/measurements.length},{l:'Emin avg',v:measurements.reduce((s,m)=>s+m.eminVm,0)/measurements.length}].map(({l,v})=>(
            <div key={l} style={{background:'#0c1526',borderRadius:8,padding:'8px',textAlign:'center',border:'1px solid #18304e'}}>
              <div style={{fontSize:8,color:'#305070',marginBottom:3}}>{l}</div>
              <div style={{fontSize:14,fontWeight:700,color:eH(v,limit)}}>{v.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={title}>E vs Distanca (m)</div>
        <div style={{position:'relative',height:130,border:'1px solid #18304e',borderRadius:8,overflow:'hidden',background:'#0c1526'}}>
          {measurements.filter(m=>m.distanceM).map((m,i)=>{
            const ev=m[fk as keyof Measurement] as number
            const ad=measurements.filter(x=>x.distanceM).map(x=>x.distanceM!),ae=measurements.filter(x=>x.distanceM).map(x=>x[fk as keyof Measurement] as number)
            const mxD=Math.max(...ad)||1,mnE=Math.min(...ae),mxE=Math.max(...ae)||1
            const x=((m.distanceM||0)/mxD)*88+6,y=100-((ev-mnE)/(mxE-mnE||1))*88-6
            return<div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:7,height:7,borderRadius:'50%',background:eH(ev,limit),transform:'translate(-50%,-50%)',opacity:.85}} title={`${m.locationName||''}: ${ev} V/m @ ${m.distanceM}m`}/>
          })}
        </div>
      </div>
      <div style={card}>
        <div style={title}>E mesatare sipas frekuencës (GHz)</div>
        {Object.entries(measurements.reduce((acc,m)=>{const k=String(m.frequencyGhz||'?');if(!acc[k])acc[k]=[];acc[k].push(m[fk as keyof Measurement] as number);return acc},{} as Record<string,number[]>)).map(([freq,values])=>{
          const avg=(values as number[]).reduce((a:number,b:number)=>a+b,0)/(values as number[]).length
          return(
            <div key={freq} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                <span style={{color:'#a8c8e0'}}>{freq} GHz</span>
                <span style={{color:eH(avg,limit),fontWeight:700}}>{avg.toFixed(2)} V/m</span>
              </div>
              <div style={{height:8,background:'#0c1526',borderRadius:4,overflow:'hidden',border:'1px solid #18304e'}}>
                <div style={{height:'100%',width:`${Math.min(avg/limit*100,100)}%`,background:eH(avg,limit),opacity:.7,borderRadius:4}}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
