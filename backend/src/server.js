import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fetchRaydiumPairs } from "./sources/raydium.js";
const app = express(); app.use(cors()); app.use(express.json({limit:'1mb'}))
const PORT = Number(process.env.PORT || 8080)
let events = []
app.get('/health', (req,res)=> res.json({ok:true}))
app.post('/ingest', (req,res)=>{ const e=req.body||{}
  if(!e.mint||!e.symbol||!e.name||!e.dex||!e.poolAddress||!e.timeISO) return res.status(400).json({error:'Missing fields'})
  e.id = e.id || `${e.mint}-${e.timeISO}`; events.push(e); if(events.length>5000) events=events.slice(-5000); res.json({ok:true}) })
app.get('/migrations', (req,res)=>{ const w=Number(req.query.windowHours||24); const cut=Date.now()-w*60*60*1000
  const list = events.filter(e=> new Date(e.timeISO).getTime()>=cut).sort((a,b)=> new Date(b.timeISO)-new Date(a.timeISO)); res.json(list) })
app.post('/seed-demo', (req,res)=>{ const now=Date.now(); for(let i=0;i<20;i++){ events.push({
  id:`demo_${i}`, name:`DEMO ${i}`, symbol:`D${i}`, mint:`DEMO${i}`.padEnd(44,'X'), marketCapUSD:50000+i*3000, liquidityUSD:9000+i*1500,
  holders:60+i*10, devReputation:50+(i%5)*5, riskTags:i%3===0?['sus-dev']:[], dex:i%2===0?'Raydium':'PumpSwap', poolAddress:`pool_${i}`,
  timeISO:new Date(now - i*15*60*1000).toISOString(), bondingCurveProgress:100 }) } res.json({ok:true}) })
app.listen(PORT, ()=> console.log('backend on', PORT))
