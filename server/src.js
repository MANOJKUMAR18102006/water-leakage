import express from "express"; import http from "http"; import cors from "cors"; import dotenv from "dotenv"; import mongoose from "mongoose"; import {Server} from "socket.io";
dotenv.config(); const app=express(), server=http.createServer(app), io=new Server(server,{cors:{origin:process.env.CLIENT_ORIGIN||"http://localhost:5173"}});
app.use(cors({origin:process.env.CLIENT_ORIGIN||"http://localhost:5173"})); app.use(express.json());
const schema=new mongoose.Schema({timestamp:Date,inletFlow:Number,outletFlow:Number,pressure:Number,zoneFlows:[Number],status:String,leakZone:String,estimatedLoss:Number,valveOpen:Boolean,scenario:String});
const Reading=mongoose.model("Reading",schema); let readings=[],events=[],latest=null,running=false,scenario="normal",valveOpen=true,timer=null,prev="NORMAL";
const rnd=(a,b)=>a+Math.random()*(b-a), r=n=>Number(n.toFixed(2));
function sample(){let inlet=r(rnd(28,32)),z=[rnd(9,11),rnd(9,11),rnd(9,11)],p=r(rnd(3,3.5)),zone="None";
 if(scenario==="small"){z[1]=rnd(5,7);p=r(rnd(2.1,2.6));zone="Zone 2"} if(scenario==="major"){z[2]=rnd(1,3);p=r(rnd(.8,1.4));zone="Zone 3"}
 if(!valveOpen){inlet=0;z=[0,0,0];p=0}
 z=z.map(r);let out=r(z.reduce((a,b)=>a+b,0)),loss=r(Math.max(0,inlet-out)),imb=inlet?(inlet-out)/inlet*100:0;
 let status=!valveOpen?"ISOLATED":(imb>=25||p<1.5)?"CRITICAL":(imb>=8||p<2.7)?"WARNING":"NORMAL";
 if(status!==prev&&status!=="NORMAL") addEvent(status+" leakage pattern detected",zone,status);
 prev=status;
 if(status==="CRITICAL"&&valveOpen){valveOpen=false;addEvent("Automatic isolation simulated",zone,"ACTION")}
 return {timestamp:new Date(),inletFlow:inlet,outletFlow:out,pressure:p,zoneFlows:z,status,leakZone:status==="NORMAL"?"None":zone,estimatedLoss:loss,valveOpen,scenario};
}
function addEvent(message,zone,severity){let e={timestamp:new Date(),message,zone,severity};events.unshift(e);events=events.slice(0,80);io.emit("event",e)}
async function push(){let s=sample();latest=s;readings.unshift(s);readings=readings.slice(0,100);if(process.env.MONGO_URI)try{await Reading.create(s)}catch(e){console.log(e.message)}io.emit("reading",s)}
function snap(){return {running,scenario,valveOpen,latest,readings:readings.slice(0,40),events:events.slice(0,30)}}
app.get("/api/health",(_,res)=>res.json({ok:true})); app.get("/api/status",(_,res)=>res.json(snap()));
app.get("/api/readings",async(_,res)=>{if(process.env.MONGO_URI)try{return res.json(await Reading.find().sort({timestamp:-1}).limit(60).lean())}catch{}res.json(readings)});
app.get("/api/events",(_,res)=>res.json(events));
app.post("/api/simulation/start",(_,res)=>{running=true;if(!timer)timer=setInterval(()=>{if(running)push()},1500);res.json(snap())});
app.post("/api/simulation/stop",(_,res)=>{running=false;res.json(snap())});
app.post("/api/simulation/scenario",(req,res)=>{if(!["normal","small","major"].includes(req.body.scenario))return res.status(400).json({error:"Invalid scenario"});scenario=req.body.scenario;valveOpen=true;prev="NORMAL";res.json(snap())});
app.post("/api/system/reset",(_,res)=>{running=false;scenario="normal";valveOpen=true;prev="NORMAL";readings=[];events=[];latest=null;res.json(snap())});
app.post("/api/valve",(req,res)=>{if(typeof req.body.open!=="boolean")return res.status(400).json({error:"open must be boolean"});valveOpen=req.body.open;addEvent("Valve "+(valveOpen?"opened":"closed")+" manually (simulation)","All zones","MANUAL");res.json({valveOpen})});
io.on("connection",s=>s.emit("snapshot",snap()));
if(process.env.MONGO_URI)mongoose.connect(process.env.MONGO_URI).then(()=>console.log("MongoDB connected")).catch(e=>console.log("MongoDB unavailable; memory mode:",e.message));
server.listen(Number(process.env.PORT) || 5000, () => console.log(`AquaGrid API: http://localhost:${process.env.PORT || 5000}`));
