import React, { useEffect, useMemo, useState } from 'react'

type Dex = 'Raydium' | 'PumpSwap'
type MigrationEvent = {
  id: string; name: string; symbol: string; mint: string; imageUrl?: string;
  marketCapUSD: number; liquidityUSD?: number; holders?: number; devReputation?: number;
  riskTags?: string[]; dex: Dex; poolAddress: string; timeISO: string; creator?: string;
  bondingCurveProgress?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
const fmtUSD = (n:number)=> new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)
const ago=(iso:string)=>{ const d=Date.now()-new Date(iso).getTime(); const s=Math.max(1,Math.floor(d/1000));
  if(s<60) return s+'s temu'; const m=Math.floor(s/60); if(m<60) return m+'m temu';
  const h=Math.floor(m/60); if(h<24) return h+'h temu'; const dd=Math.floor(h/24); return dd+'d temu'; }
const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x))
const scale=(x:number,[mn,mx]:[number,number],out=10)=>clamp(((x-mn)/(mx-mn))*out,0,out)
const STRATS={Konserwatywna:{preferRaydium:true,mcapRange:[60000,140000],liqRange:[15000,50000],minHolders:150,riskPenalty:12,recencyBonusMinutes:10},
 Zbalansowana:{preferRaydium:true,mcapRange:[50000,120000],liqRange:[10000,40000],minHolders:100,riskPenalty:10,recencyBonusMinutes:15},
 Agresywna:{preferRaydium:false,mcapRange:[30000,100000],liqRange:[5000,30000],minHolders:60,riskPenalty:8,recencyBonusMinutes:20}} as const
function scoreEvent(e:MigrationEvent,s:any){ let sc=50; if(s.preferRaydium&&e.dex==='Raydium') sc+=6; else if(!s.preferRaydium&&e.dex==='PumpSwap') sc+=3;
  sc+=scale(e.marketCapUSD,s.mcapRange as any,16)-6; sc+=scale(e.liquidityUSD||0,s.liqRange as any,18)-6;
  const h=e.holders||0; sc+=clamp(((h-s.minHolders)/(s.minHolders*1.5))*12,-6,12);
  sc+=clamp(((e.devReputation||50)-50)/50*8,-8,8);
  const mins=Math.max(0,(Date.now()-new Date(e.timeISO).getTime())/60000); sc+=mins<=s.recencyBonusMinutes?8:mins<=s.recencyBonusMinutes*3?4:0;
  const risks=(e.riskTags?.length||0); sc-=risks*s.riskPenalty; return clamp(Math.round(sc),0,100) }
const MOCK:MigrationEvent[]=[
 {id:'evt_01',name:'CATJET',symbol:'CJT',mint:'CATJEt111...111',marketCapUSD:89000,liquidityUSD:22000,holders:210,devReputation:72,riskTags:[],dex:'PumpSwap',poolAddress:'pswPoo1CATJET',timeISO:new Date(Date.now()-3*60*1000).toISOString(),bondingCurveProgress:100},
 {id:'evt_02',name:'SOL PUPPY',symbol:'PUP',mint:'PUPPY111...111',marketCapUSD:72000,liquidityUSD:18000,holders:130,devReputation:65,riskTags:['mint-not-renounced'],dex:'Raydium',poolAddress:'rayPoo1PUPPY',timeISO:new Date(Date.now()-18*60*1000).toISOString(),bondingCurveProgress:100}
]

export default function HunterApp(){
  const [events,setEvents]=useState<MigrationEvent[]>([])
  const [q,setQ]=useState(''); const [dex,setDex]=useState<'Both'|Dex>('Both'); const [windowHrs,setWindowHrs]=useState(24)
  const [strategy,setStrategy]=useState<keyof typeof STRATS>('Zbalansowana'); const [minScore,setMinScore]=useState(75)
  const [minLP,setMinLP]=useState(10000); const [minHolders,setMinHolders]=useState(80); const [picksOnly,setPicksOnly]=useState(false)
  const [err,setErr]=useState<string|null>(null)
  useEffect(()=>{(async()=>{try{const r=await fetch(`${API_BASE}/migrations?windowHours=${windowHrs}`); if(!r.ok)throw 0; setEvents(await r.json())}
  catch{setErr('API niedostępne – demo'); setEvents(MOCK)}})()},[])
  const conf=STRATS[strategy]
  const enriched=useMemo(()=>events.map(e=>{const score=scoreEvent(e,conf);const isPick=score>=minScore&&(e.liquidityUSD||0)>=minLP&&(e.holders||0)>=minHolders;return {e,score,isPick}}),[events,conf,minScore,minLP,minHolders])
  const list=useMemo(()=>{const cut=Date.now()-windowHrs*60*60*1000; return enriched.filter(x=>new Date(x.e.timeISO).getTime()>=cut)
   .filter(x=>dex==='Both'||x.e.dex===dex).filter(x=>{const s=q.trim().toLowerCase(); if(!s) return true; return x.e.name.toLowerCase().includes(s)||x.e.symbol.toLowerCase().includes(s)||x.e.mint.toLowerCase().includes(s)})
   .filter(x=>picksOnly?x.isPick:true).sort((a,b)=>new Date(b.e.timeISO).getTime()-new Date(a.e.timeISO).getTime())},[enriched,q,dex,windowHrs,picksOnly])
  return (<div style={{fontFamily:'Inter,system-ui,Arial',padding:16,maxWidth:1100,margin:'0 auto'}}>
    <h1 style={{fontSize:28,marginBottom:4}}>Pump → Raydium Hunter</h1>
    <div style={{color:'#666',fontSize:14,marginBottom:12}}>Screener z „typami”. <b>To nie jest porada inwestycyjna.</b> {err && <span style={{color:'#c00'}}> — {err}</span>}</div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
      <input placeholder="Szukaj" value={q} onChange={e=>setQ(e.target.value)} style={{padding:8,flex:'1 1 260px',border:'1px solid #ddd',borderRadius:8}}/>
      <select value={dex} onChange={e=>setDex(e.target.value as any)} style={{padding:8,border:'1px solid #ddd',borderRadius:8}}><option value="Both">Wszystkie DEX</option><option value="Raydium">Raydium</option><option value="PumpSwap">PumpSwap</option></select>
      <select value={windowHrs} onChange={e=>setWindowHrs(Number(e.target.value))} style={{padding:8,border:'1px solid #ddd',borderRadius:8}}><option value="1">1h</option><option value="3">3h</option><option value="6">6h</option><option value="12">12h</option><option value="24">24h</option></select>
      <select value={strategy} onChange={e=>setStrategy(e.target.value as any)} style={{padding:8,border:'1px solid #ddd',borderRadius:8}}><option>Konserwatywna</option><option>Zbalansowana</option><option>Agresywna</option></select>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
      <Metric label="Min. score" value={minScore} onChange={setMinScore} min={0} max={100}/>
      <Metric label="Min. LP (USD)" value={minLP} onChange={setMinLP} min={0} max={50000} step={500}/>
      <Metric label="Min. holderzy" value={minHolders} onChange={setMinHolders} min={0} max={500} step={5}/>
    </div>
    <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><input type="checkbox" checked={picksOnly} onChange={e=>setPicksOnly(e.target.checked)}/> Pokaż tylko typy spełniające progi</label>
    <div style={{display:'grid',gridTemplateColumns:'5fr 2fr 2fr 3fr',fontSize:12,color:'#666',padding:'6px 8px',borderBottom:'1px solid #eee'}}><div>Token</div><div>Mcap</div><div>Bonding</div><div style={{textAlign:'right'}}>Score / Akcje</div></div>
    {list.map(({e,score,isPick})=>(
      <div key={e.id} style={{display:'grid',gridTemplateColumns:'5fr 2fr 2fr 3fr',alignItems:'center',gap:8,padding:'8px 8px',borderBottom:'1px solid #f0f0f0'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:36,height:36,background:'#eee',borderRadius:10}}/>
          <div><div style={{fontWeight:600,display:'flex',gap:6,alignItems:'center'}}><span>{e.name}</span>
          <span style={{fontSize:11,color:'#666',border:'1px solid #ddd',padding:'2px 6px',borderRadius:999}}>{e.symbol}</span>
          <span style={{fontSize:11,color:'#fff',background:e.dex==='Raydium'?'#0ea5e9':'#22c55e',padding:'2px 6px',borderRadius:999}}>{e.dex}</span>
          {isPick && <span style={{fontSize:11,color:'#fff',background:'#059669',padding:'2px 6px',borderRadius:999}}>TYP</span>}</div>
          <div style={{fontSize:11,color:'#777'}}>mint: {e.mint.slice(0,4)}…{e.mint.slice(-4)} · {ago(e.timeISO)}</div></div>
        </div>
        <div style={{fontWeight:600}}>{fmtUSD(e.marketCapUSD)}</div>
        <div><div style={{width:'100%',height:6,background:'#eee',borderRadius:999,overflow:'hidden'}}><div style={{width:`${Math.min(100,e.bondingCurveProgress||0)}%`,height:'100%',background:'#111'}}/></div>
          <div style={{fontSize:10,color:'#777'}}>bonding: {e.bondingCurveProgress||0}%</div></div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,alignItems:'center'}}>
          <span style={{fontSize:11,color:'#fff',background: score>=85?'#065f46':score>=75?'#15803d':score>=65?'#ca8a04':'#6b7280',padding:'2px 6px',borderRadius:999}}>{score}</span>
          <a href={`https://solscan.io/token/${e.mint}`} target="_blank" rel="noreferrer" style={{fontSize:12}}>Solscan</a>
          <a href={e.dex==='Raydium'?`https://raydium.io/pool/${e.poolAddress}`:`https://pump.fun/swap/${e.poolAddress}`} target="_blank" rel="noreferrer" style={{fontSize:12}}>{e.dex}</a>
          <a href={`https://jup.ag/swap/SOL-${e.mint}`} target="_blank" rel="noreferrer" style={{fontSize:12}}>Jupiter</a>
        </div>
      </div>
    ))}
    <div style={{fontSize:11,color:'#777',marginTop:12}}>Informacje i sugestie mają charakter edukacyjny i nie stanowią porady inwestycyjnej.</div>
  </div>)}
function Metric({label,value,onChange,min,max,step=1}:{label:string,value:number,onChange:(n:number)=>void,min:number,max:number,step?:number}){
  return (<div style={{border:'1px solid #eee',borderRadius:12,padding:12}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span>{label}</span><b>{value}</b></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))} style={{width:'100%'}}/>
  </div>)}
