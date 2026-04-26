'use client'
import { useEffect, useRef } from 'react'
import type { Map as LMap, ImageOverlay, LayerGroup } from 'leaflet'
import type { Measurement, Project } from '@/lib/store'

function eRGB(e:number,lim:number):[number,number,number]{const t=Math.min(1.5,e/lim);const s:any=[[26,64,200],[32,192,104],[240,208,0],[224,88,32],[224,16,48]];const i=Math.min(Math.floor(t/0.375),s.length-2);const f=t/0.375-i;const a=s[i],b=s[i+1];return[a[0]+(b[0]-a[0])*f|0,a[1]+(b[1]-a[1])*f|0,a[2]+(b[2]-a[2])*f|0]}
const eC=(e:number,lim:number,al=1)=>{const[r,g,b]=eRGB(e,lim);return `rgba(${r},${g},${b},${al})`}
const eH=(e:number,lim:number)=>{const[r,g,b]=eRGB(e,lim);return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}
const d2=(a:number,b:number,c:number,d:number)=>Math.sqrt((a-c)**2+(b-d)**2)

type FK='emaxVm'|'eavgVm'|'eminVm'
function IDW(lat:number,lon:number,pts:Measurement[],fk:FK,p:number){let n=0,d=0;for(const pt of pts){const r=d2(lat,lon,pt.lat,pt.lon);if(r<1e-7)return pt[fk];const w=1/r**p;n+=w*pt[fk];d+=w}return d>0?n/d:0}
function NN(lat:number,lon:number,pts:Measurement[],fk:FK){let md=1e9,v=0;for(const p of pts){const r=d2(lat,lon,p.lat,p.lon);if(r<md){md=r;v=p[fk]}}return v}
function Krig(lat:number,lon:number,pts:Measurement[],fk:FK){let n=0,d=0;for(const p of pts){const r=d2(lat,lon,p.lat,p.lon);const w=Math.max(0,1-Math.exp(-3*r/0.025));const ww=1-w;n+=ww*p[fk];d+=ww}return d>0.001?n/d:IDW(lat,lon,pts,fk,2)}
function RBF(lat:number,lon:number,pts:Measurement[],fk:FK){const s=0.018;let n=0,d=0;for(const p of pts){const r=d2(lat,lon,p.lat,p.lon);const w=Math.exp(-(r*r)/(2*s*s));n+=w*p[fk];d+=w}return d>0.001?n/d:IDW(lat,lon,pts,fk,2)}
function pred(lat:number,lon:number,pts:Measurement[],m:string,fk:FK,p:number){if(m==='nn')return NN(lat,lon,pts,fk);if(m==='kriging')return Krig(lat,lon,pts,fk);if(m==='rbf')return RBF(lat,lon,pts,fk);return IDW(lat,lon,pts,fk,p)}
const FK_MAP:Record<string,FK>={emax:'emaxVm',eavg:'eavgVm',emin:'eminVm'}

interface Props {
  measurements:Measurement[];project:Project;activeField:'emax'|'eavg'|'emin'
  method:string;idwPower:number;resolution:number;limit:number
  onGridComputed:(c:{lat:number;lon:number;val:number}[],m:Record<string,number>)=>void
}

export default function GISMap({measurements,project,activeField,method,idwPower,resolution,limit,onGridComputed}:Props){
  const cRef=useRef<HTMLDivElement>(null)
  const mapRef=useRef<LMap|null>(null)
  const intRef=useRef<ImageOverlay|null>(null)
  const ptsRef=useRef<LayerGroup|null>(null)
  const stRef=useRef({measurements,method,idwPower,limit})
  useEffect(()=>{stRef.current={measurements,method,idwPower,limit}},[measurements,method,idwPower,limit])

  useEffect(()=>{
    if(mapRef.current||!cRef.current)return
    import('leaflet').then(L=>{
      const map=L.map(cRef.current!,{zoomControl:true}).setView([41.328,19.818],13)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© CartoDB',subdomains:'abcd',maxZoom:20}).addTo(map)
      mapRef.current=map
      map.on('mousemove',e=>{const el=document.getElementById('cb');if(el)el.textContent=`lat: ${e.latlng.lat.toFixed(6)}  lon: ${e.latlng.lng.toFixed(6)}  ·  klik për parashikim`})
      map.on('click',e=>{
        const{measurements:pts,method:meth,idwPower:pow,limit:lim}=stRef.current
        if(!pts.length)return
        const lat=e.latlng.lat,lon=e.latlng.lng
        const pE=pred(lat,lon,pts,meth,'emaxVm',pow),pA=pred(lat,lon,pts,meth,'eavgVm',pow),pI=pred(lat,lon,pts,meth,'eminVm',pow)
        let md=1e9,near=pts[0];for(const p of pts){const r=d2(lat,lon,p.lat,p.lon);if(r<md){md=r;near=p}}
        const pct=(pE/lim*100).toFixed(1),col=eH(pE,lim)
        const nb=pts.filter(p=>d2(lat,lon,p.lat,p.lon)<0.015)
        let ci='—';if(nb.length>=2){const nv=nb.map(p=>p.emaxVm);const sd=Math.sqrt(nv.reduce((s,v)=>{const dd=v-pE;return s+dd*dd},0)/nv.length);ci=`[${(pE-1.96*sd).toFixed(2)} — ${(pE+1.96*sd).toFixed(2)}] V/m`}
        const lbl=parseFloat(pct)<25?'Shumë i sigurt':parseFloat(pct)<50?'I sigurt':parseFloat(pct)<75?'Mesatar':parseFloat(pct)<100?'Afër kufirit':'MBI KUFI ⚠'
        L.popup({maxWidth:265,className:'emf-popup'}).setLatLng(e.latlng).setContent(`
<div style="font-family:monospace;background:#080f1a;color:#a8c8e0;border-radius:10px;border:1px solid #18304e;overflow:hidden;min-width:240px">
  <div style="background:linear-gradient(135deg,#0c1a30,#112240);padding:9px 12px 7px;border-bottom:1px solid #18304e">
    <div style="font-weight:700;color:#fff;font-size:14px">📍 VLERAT E PARASHIKUARA</div>
    <div style="font-size:9px;color:#305070;margin-top:2px">${lat.toFixed(5)}, ${lon.toFixed(5)} · ${meth.toUpperCase()}</div>
  </div>
  <div style="padding:10px 12px">
    <div style="display:grid;grid-template-columns:50px 1fr 52px;gap:2px 8px;font-size:10px;margin-bottom:8px">
      <span style="color:#305070">Fusha</span><span style="color:#305070">Parashikuar</span><span style="color:#305070">Rez.</span>
      <b style="color:#f5c842">Emax</b><b style="color:${eH(pE,lim)};font-size:12px">${pE.toFixed(3)} V/m</b><span style="color:${pE>near.emaxVm?'#f06030':'#2ee89a'};font-size:9px">${(pE-near.emaxVm)>0?'+':''}${(pE-near.emaxVm).toFixed(2)}</span>
      <span>Eavg</span><span style="color:${eH(pA,lim)}">${pA.toFixed(3)} V/m</span><span style="font-size:9px;color:#305070">${(pA-near.eavgVm)>0?'+':''}${(pA-near.eavgVm).toFixed(2)}</span>
      <span>Emin</span><span style="color:${eH(pI,lim)}">${pI.toFixed(3)} V/m</span><span style="font-size:9px;color:#305070">${(pI-near.eminVm)>0?'+':''}${(pI-near.eminVm).toFixed(2)}</span>
    </div>
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#305070;margin-bottom:3px"><span>% ICNIRP (${lim} V/m)</span><span style="color:${col};font-weight:700">${pct}%</span></div>
      <div style="height:6px;background:#0c1526;border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.min(parseFloat(pct),100)}%;background:${col}"></div></div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;font-size:9px">
      <span style="background:${col}20;border:1px solid ${col}50;padding:2px 8px;border-radius:5px;color:${col};font-weight:700">${lbl}</span>
      <span style="color:#305070">${(md*111000).toFixed(0)} m larg pikës</span>
    </div>
    <div style="background:#0c1526;border:1px solid #18304e;border-radius:6px;padding:6px 8px;font-size:9px;color:#305070">
      CI 95%: ${ci} · ${nb.length} pikë afër<br/>Matja: ${near.locationName||'—'}
    </div>
  </div>
</div>`).openOn(map)
      })
    })
    return()=>{mapRef.current?.remove();mapRef.current=null}
  },[])

  useEffect(()=>{
    if(!mapRef.current)return
    import('leaflet').then(L=>{
      if(ptsRef.current)mapRef.current!.removeLayer(ptsRef.current)
      const layer=L.layerGroup()
      const fk=FK_MAP[activeField]
      for(const m of measurements){
        const e=m[fk],col=eH(e,limit)
        L.circleMarker([m.lat,m.lon],{radius:7,fillColor:col,color:'rgba(255,255,255,0.5)',weight:1,fillOpacity:.9})
          .bindPopup(`<div style="font-family:monospace;font-size:10px;background:#0c1526;color:#a8c8e0;padding:10px;border-radius:7px;min-width:170px;border:1px solid #18304e"><b style="font-size:13px;color:#fff">${m.locationName||'—'}</b><div style="margin-top:5px;display:grid;grid-template-columns:1fr 1fr;gap:2px 10px"><span style="color:#305070">Emax</span><b style="color:${eH(m.emaxVm,limit)}">${m.emaxVm} V/m</b><span style="color:#305070">Eavg</span><b style="color:${eH(m.eavgVm,limit)}">${m.eavgVm} V/m</b><span style="color:#305070">Emin</span><b style="color:${eH(m.eminVm,limit)}">${m.eminVm} V/m</b><span style="color:#305070">Distanca</span><span>${m.distanceM||'—'} m</span><span style="color:#305070">Lartësia</span><span>${m.hightM||'—'} m</span><span style="color:#305070">Frekuenca</span><span>${m.frequencyGhz||'—'} GHz</span></div></div>`,{className:'emf-popup'})
          .addTo(layer)
      }
      layer.addTo(mapRef.current!)
      ptsRef.current=layer
      if(measurements.length){const lats=measurements.map(m=>m.lat),lons=measurements.map(m=>m.lon);mapRef.current!.fitBounds([[Math.min(...lats),Math.min(...lons)],[Math.max(...lats),Math.max(...lons)]],{padding:[40,40]})}
    })
  },[measurements,activeField,limit])

  useEffect(()=>{
    if(!mapRef.current||measurements.length<3)return
    import('leaflet').then(L=>{
      if(intRef.current)mapRef.current!.removeLayer(intRef.current)
      const fk=FK_MAP[activeField]
      const lats=measurements.map(m=>m.lat),lons=measurements.map(m=>m.lon)
      const pad=0.008,minLat=Math.min(...lats)-pad,maxLat=Math.max(...lats)+pad,minLon=Math.min(...lons)-pad,maxLon=Math.max(...lons)+pad
      const dlat=(maxLat-minLat)/resolution,dlon=(maxLon-minLon)/resolution
      const canvas=document.createElement('canvas');canvas.width=resolution;canvas.height=resolution
      const ctx=canvas.getContext('2d')!
      const cache:{lat:number;lon:number;val:number}[]=[]
      for(let i=0;i<resolution;i++)for(let j=0;j<resolution;j++){
        const lat=minLat+i*dlat,lon=minLon+j*dlon
        const val=pred(lat,lon,measurements,method,fk,idwPower)
        cache.push({lat,lon,val});ctx.fillStyle=eC(val,limit,0.65);ctx.fillRect(j,resolution-1-i,1,1)
      }
      onGridComputed(cache,{minLat,maxLat,minLon,maxLon,resolution,dlat,dlon})
      intRef.current=L.imageOverlay(canvas.toDataURL(),[[minLat,minLon],[maxLat,maxLon]],{opacity:1})
      intRef.current.addTo(mapRef.current!)
    })
  },[measurements,activeField,method,idwPower,resolution,limit])

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative'}}>
      <div ref={cRef} style={{flex:1}}/>
      <div id="cb" style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(8,15,26,0.85)',borderTop:'1px solid #18304e',padding:'3px 12px',fontSize:10,color:'#305070',zIndex:500,pointerEvents:'none'}}>
        Lëviz mbi hartë · klik kudo për vlera të parashikuara
      </div>
    </div>
  )
}
