'use strict';
/* Exercise library: data/exercises.js (IMG, EX). Profiles: data/woman.js, data/man.js -> window.PROFILES */
let P=null,PID=null,PLAN=null,DAYS={},ORDER=[],CYCLE=[],REST_AFTER=new Set(),LV={},GATES=[];
const PIDS=['woman','man'];
/* Older builds used personal profile ids. They map onto the new ones. */
const OLD_IDS={neha:'woman',noble:'man'};

/* =========================================================
   STATE
   Everything is saved on this phone, in this browser, under lifts.v1.<profile>.
   ========================================================= */
const keyOf = id=>'lifts.v1.'+id;
const ACTIVE_KEY='lifts.active', LEGACY_KEY='nehaLifts.v1';
let S;
function defState(){ return {start:null,goalKg:null,sessions:[],cur:null,logs:{},body:[],meas:[],gates:{},levelOverride:null,restSkip:{}}; }
function loadState(){
  try{ S=Object.assign(defState(),JSON.parse(localStorage.getItem(keyOf(PID))||'{}')); }
  catch(e){ S=defState(); }
}
function save(){ try{ localStorage.setItem(keyOf(PID),JSON.stringify(S)); }catch(e){ toast('Could not save. Is the phone storage full?'); } }
/* Level dates are counted in weeks from the start date (the first session). */
function refreshLV(){
  LV={}; const base=S.start||today();
  Object.entries(P.levels||{}).forEach(([i,l])=>{
    LV[i]=Object.assign({},l,{from:addDays(base,(l.w[0]-1)*7),to:l.w[1]?addDays(base,l.w[1]*7-1):'9999-12-31'});
  });
}
function goalEnd(){ return (P.goal&&P.goal.weeks) ? addDays(S.start||today(),P.goal.weeks*7-1) : null; }
function setProfile(id){
  PID=id; P=window.PROFILES[id]; PLAN=P.plan;
  DAYS={}; ORDER=[]; CYCLE=P.cycle||[]; GATES=P.gates||[];
  REST_AFTER=new Set();
  if(PLAN){
    CYCLE.forEach((k,i)=>{ if(k==='R') return; DAYS[k]=Object.assign({n:i+1},P.days[k]); ORDER.push(k); if(CYCLE[(i+1)%CYCLE.length]==='R') REST_AFTER.add(k); });
  }
  T=null; openId=null;
  loadState(); refreshLV();
  try{ localStorage.setItem(ACTIVE_KEY,id); }catch(e){}
  document.title='Go Lift';
}
/* One-time carry-over of saves from older builds. The old keys stay as a backup. */
function migrateLegacy(){
  try{
    const ls=localStorage;
    const copy=(from,to,patch)=>{
      const old=ls.getItem(from); if(!old||ls.getItem(keyOf(to))) return;
      let d; try{ d=JSON.parse(old); }catch(e){ return; }
      patch&&patch(d); ls.setItem(keyOf(to),JSON.stringify(d));
    };
    /* The first woman plan ran on fixed dates from 30 Sep 2026 with a 69.5–70.5 kg goal. */
    const wPatch=d=>{ if(!d.start) d.start='2026-09-30'; if(!d.goalKg) d.goalKg={lo:69.5,hi:70.5}; };
    copy(keyOf('neha'),'woman',wPatch);
    copy(LEGACY_KEY,'woman',wPatch);
    copy(keyOf('noble'),'man');
    const a=ls.getItem(ACTIVE_KEY); if(a&&OLD_IDS[a]) ls.setItem(ACTIVE_KEY,OLD_IDS[a]);
  }catch(e){}
}

const $ = (s,r=document)=>r.querySelector(s);
const pad = n=>String(n).padStart(2,'0');
const ds = d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = ()=>ds(new Date());
const addDays = (s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ds(d)};
const diffDays = (a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const fmt = (s,o={weekday:'short',day:'numeric',month:'short'})=>new Date(s+'T12:00:00').toLocaleDateString('en-GB',o);
const num = v=>{const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n};
const fx = n=>(Math.round(n*10)/10).toString();

const autoLevel = ()=>{const t=today();const n=Object.keys(LV).length;for(let i=1;i<n;i++) if(t<=LV[i].to) return i;return n};
const level = ()=>S.levelOverride||autoLevel();
const nextDay = d=>ORDER[(ORDER.indexOf(d)+1)%ORDER.length];
const lastSession = ()=>S.sessions[S.sessions.length-1];

function plan(){
  const t=today();
  if(S.cur && S.cur.date===t) return {kind:S.cur.finished?'done':'train',day:S.cur.day,lv:S.cur.level};
  const last=lastSession();
  const nd=last?nextDay(last.day):ORDER[0];
  if(last && REST_AFTER.has(last.day) && last.date===addDays(t,-1) && !S.restSkip[t])
    return {kind:'rest',day:nd,lv:level(),after:last.day};
  return {kind:'train',day:nd,lv:level()};
}
const getList = id=> id==='warmup' ? P.warm : (P.lists||{})[id];
function items(lv,day){
  const a=[{id:'warmup',type:'list',L:P.warm}];
  PLAN[lv][day].forEach(([k,sets,reps,note,rest])=>{
    if(k[0]==='@'){ const id=k.slice(1); a.push({id,type:'list',L:getList(id)}); }
    else a.push({id:k,type:'ex',k,sets,reps,note,rest:rest||EX[k].rest});
  });
  if(P.walk&&P.walk[lv]) a.push({id:'walk',type:'walk',min:P.walk[lv]});
  let no=0; a.forEach(x=>{ if(x.type==='ex') x.no=++no; });
  return a;
}
function curToday(){ return (S.cur && S.cur.date===today()) ? S.cur : null; }
function ensureCur(){
  if(!S.start){ S.start=today(); refreshLV(); }
  const p=plan();
  if(!curToday()){ S.cur={date:today(),day:p.day,level:p.lv,sets:{},done:{},chk:{},finished:false}; save(); }
  if(!S.cur.chk) S.cur.chk={};
  return S.cur;
}
const chk = (c,id)=> (c.chk[id]=c.chk[id]||{});
const logKey = k=>EX[k].log||k;
function lastLog(k){
  const a=S.logs[logKey(k)]||[];
  for(let i=a.length-1;i>=0;i--) if(a[i].date!==today()) return a[i];
  return null;
}
function repNums(reps){ return (String(reps).match(/\d+/g)||[]).map(Number); }
function topRep(reps){ if(/max/.test(reps)) return null; const n=repNums(reps); return n.length?Math.max(...n.slice(0,2)):null; }
function lowRep(reps){ if(/max/.test(reps)) return null; const n=repNums(reps); return n.length?n[0]:null; }

function getSets(x){
  const c=ensureCur();
  let a=c.sets[x.id];
  if(!a){
    const last=lastLog(x.k);
    a=Array.from({length:x.sets},(_,i)=>{
      const ls=last&&(last.sets[i]||last.sets[last.sets.length-1]);
      return {w: ls&&ls.w!=null&&ls.w!=='' ? String(ls.w) : '', r: ls&&ls.r ? String(ls.r) : String(lowRep(x.reps)??''), d:false};
    });
    c.sets[x.id]=a; save();
  }
  while(a.length<x.sets) a.push({...a[a.length-1],d:false});
  if(a.length>x.sets) a.length=x.sets;
  return a;
}
function suggestion(x){
  const e=EX[x.k], last=lastLog(x.k); const top=topRep(x.reps);
  const lvNow=(curToday()||{}).level||level();
  if(LV[lvNow]&&LV[lvNow].deload) return {t:last?'Deload week: same weight as last time, half the sets. Leave feeling fresh.':'Deload week: pick a weight that feels easy and clean.',plain:true};
  if(!last) return {t:'First time logging this. Pick a weight where the last 2–3 reps feel hard but clean.',plain:true};
  if(top && last.sets.length>=x.sets && last.sets.every(s=>(num(s.r)||0)>=top)){
    if(e.assist) return {t:'You hit every rep last time. Drop the help by 2.5 kg today.'};
    if(e.bw && x.k==='incline_pushup') return {t:'You hit every rep last time. Move the bar one notch lower today.'};
    if(e.bw) return {t:'You hit every rep last time. Make it slightly harder today (slower, or hold a light weight).'};
    return {t:`You hit every rep last time. Add ${e.step||2.5} kg today.`};
  }
  return {t:'Same weight as last time. Beat at least one rep somewhere.',plain:true};
}

/* =========================================================
   ICONS
   ========================================================= */
const I = {
  x:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  img:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 9"/></svg>',
  play:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pause:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6v12M15 6v12"/></svg>',
  skip:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>',
  check:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  arrow:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  spark:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
  yt:'<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z"/></svg>',
  plus15:'<span style="font-size:15px;font-weight:700">+15</span>',
};
const gImg = q=>'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q);
const yt = q=>'https://www.youtube.com/results?search_query='+encodeURIComponent(q+' form');

/* =========================================================
   TOAST / THEME / TRANSITIONS
   ========================================================= */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1900);}
function theme(c){$('meta[name=theme-color]').setAttribute('content',c);}
function blurIn(el){ if(!el) return; el.classList.remove('blur-in'); void el.offsetWidth; el.classList.add('blur-in'); }
let swapping=false;
function swapView(html, after){
  const v=$('#view');
  if(!v.innerHTML){ v.innerHTML=html; blurIn(v); after&&after(); return; }
  v.classList.remove('blur-in'); v.classList.add('blur-out');
  setTimeout(()=>{ v.innerHTML=html; v.classList.remove('blur-out'); blurIn(v); window.scrollTo(0,0); after&&after(); },210);
}

/* =========================================================
   RING (wavy progress)
   ========================================================= */
const RS=270, RC=135, RR=108, AMP=7, WAVES=24;
function wavePath(frac, phase){
  if(frac<=0.001) return '';
  const end=frac*Math.PI*2, step=Math.PI/180*1.2; let d='';
  for(let a=0;a<=end+1e-6;a+=step){
    const t=Math.min(a,end); const R=RR+AMP*Math.sin(WAVES*t+phase);
    d+=(d?'L':'M')+(RC+R*Math.sin(t)).toFixed(2)+' '+(RC-R*Math.cos(t)).toFixed(2);
  }
  return d;
}
function arcPath(frac){
  const gap = frac>0.001 && frac<0.999 ? 0.16 : 0;
  if(frac>=0.999) return '';
  const a0=frac*Math.PI*2+gap, a1=Math.PI*2-gap;
  if(frac<=0.001) return `M${RC} ${RC-RR}A${RR} ${RR} 0 1 1 ${RC-0.01} ${RC-RR}`;
  const p=a=>[(RC+RR*Math.sin(a)).toFixed(2),(RC-RR*Math.cos(a)).toFixed(2)];
  const [x0,y0]=p(a0),[x1,y1]=p(a1); const large=(a1-a0)>Math.PI?1:0;
  return `M${x0} ${y0}A${RR} ${RR} 0 ${large} 1 ${x1} ${y1}`;
}
function ringSVG(){
  return `<svg viewBox="0 0 ${RS} ${RS}"><path id="rArc" fill="none" stroke="#262624" stroke-width="7" stroke-linecap="round"/><path id="rWave" fill="none" stroke="var(--ac)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function smallRing(frac,label){
  const r=32,c=2*Math.PI*r;
  return `<div class="ring-sm"><svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="${r}" fill="none" stroke="#2A2A28" stroke-width="5"/><circle cx="37" cy="37" r="${r}" fill="none" stroke="var(--ac)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-Math.max(0.02,Math.min(1,frac)))}" transform="rotate(-90 37 37)"/></svg><b>${label}</b></div>`;
}

/* =========================================================
   TIMER (rest + walk)
   ========================================================= */
let T=null; // {id,total,end,paused,left}
function startTimer(id,sec){ T={id,total:sec*1000,end:Date.now()+sec*1000,paused:false,left:sec*1000}; }
function timerLeft(){ if(!T) return 0; return T.paused?T.left:Math.max(0,T.end-Date.now()); }
function fmtT(ms){ const s=Math.ceil(ms/1000), m=Math.floor(s/60); return m? `${m}m ${pad(s%60)}s` : `${s} sec`; }
function fmtShort(ms){ const s=Math.ceil(ms/1000); return `${Math.floor(s/60)}:${pad(s%60)}`; }
let actx;
function beep(){
  try{ navigator.vibrate&&navigator.vibrate([180,90,180]); }catch(e){}
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    [0,0.22].forEach(off=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);const t=actx.currentTime+off;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.25,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);o.start(t);o.stop(t+0.18);});
  }catch(e){}
}
function timerDone(){
  const id=T.id; T=null; beep();
  if(id==='walk'){ const c=ensureCur(); c.done.walk=true; save(); toast('Walk done'); }
  else toast('Rest over — next set');
  if(openId) refreshDetail(); else if(TAB==='today') renderTodayQuiet();
}

/* =========================================================
   TODAY
   ========================================================= */
function dotHTML(x,i,c,isNext){
  const done=c&&c.done[x.id];
  let n,l,s;
  if(x.type==='list'){ n=x.L.badge; l=x.L.short; s=x.L.mins; }
  else if(x.type==='walk'){ n='END'; l='Incline walk'; s=`${x.min} min`; }
  else { n=pad(x.no||i); l=EX[x.k].sh; s=`${x.sets}×${x.reps.replace(/ \/ \w+/,'')}${EX[x.k].unit==='sec'?'s':EX[x.k].unit==='m'?'m':''}`; }
  return `<button class="dot${done?' done':''}${isNext&&!done?' next':''}" data-act="open" data-id="${x.id}"><span class="n">${done?'✓':n}</span><span class="l">${l}</span><span class="s">${s}</span></button>`;
}
const chipHTML = lv=>`<button class="chip pchip" data-act="switch" aria-label="Switch profile"><b>${P.name}</b>${lv?` · Level ${lv}`:''}<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5l3 3 3-3"/></svg></button>`;
function pendingHTML(){
  return `<div class="today">
    <div class="t-top">${chipHTML()}</div>
    <div class="t-head"><div class="t-day">${fmt(today())}</div><h1>Plan in<br>the works</h1><div class="t-sub">${P.pendingNote||''}</div></div>
    <div class="t-foot"><div class="t-cap">Log weight and measurements in Progress in the meantime.</div></div>
  </div>`;
}
function todayHTML(){
  if(!PLAN) return pendingHTML();
  const p=plan();
  if(p.kind==='rest') return restHTML(p);
  const d=DAYS[p.day], it=items(p.lv,p.day), c=curToday();
  const done=it.filter(x=>c&&c.done[x.id]).length;
  const nextIdx=it.findIndex(x=>!(c&&c.done[x.id]));
  const started = c && (done>0 || Object.values(c.sets).some(a=>a.some(s=>s.d)) || Object.values(c.chk||{}).some(o=>Object.values(o).some(Boolean)));
  const fin=p.kind==='done';
  let cap = fin ? 'Session saved. That counts.' : done ? 'done today — keep going' : 'Tap the first circle to start';
  let btn = fin ? `<button class="btn-ink ghost" data-act="undo">Undo finish</button>`
    : done ? `<button class="btn-ink" data-act="finish">${I.check} ${done===it.length?'Finish session':'Finish session early'}</button>` : '';
  const rp = (T && T.id!=='walk' && !fin) ? `<button class="restpill" data-act="open" data-id="${T.id}"><i></i><span id="restTxt">Rest ${fmtShort(timerLeft())}</span> · ${EX[T.id]?EX[T.id].sh:''}</button><br>` : (T && T.id==='walk' ? `<button class="restpill" data-act="open" data-id="walk"><i></i><span id="restTxt">Walk ${fmtShort(timerLeft())}</span></button><br>` : '');
  return `<div class="today">
    <div class="t-top">${chipHTML(p.lv)}
      <div class="daypick">${ORDER.map(k=>`<button data-act="pick" data-day="${k}" class="${k===p.day?'on':''}" ${fin||(started&&k!==p.day)?'disabled':''} aria-label="${DAYS[k].name}">${DAYS[k].n}</button>`).join('')}</div></div>
    <div class="t-head" id="tHead"><div class="t-day">Day ${d.n} of ${CYCLE.length} · ${fmt(today())}</div><h1>${d.name}</h1><div class="t-sub">${d.sub}</div></div>
    <div class="grid${it.length>9?' g4':''}" id="tGrid">${it.map((x,i)=>dotHTML(x,i,c,i===nextIdx)).join('')}</div>
    <div class="t-foot">${rp}<div class="t-count">${done} out of ${it.length}</div><div class="t-cap">${cap}</div>${btn}</div>
  </div>`;
}
function restHTML(p){
  const dn = CYCLE.indexOf(p.after)+2;
  const cyc = CYCLE.map(k=>k==='R'?['R','Rest']:[k,DAYS[k].short]);
  const pos = dn-1, rc=P.restCopy||{big:'Rest',cap:'Walk, stretch, sleep.'};
  return `<div class="today">
    <div class="t-top">${chipHTML(p.lv)}<span class="chip">Cycle day ${dn} of ${CYCLE.length}</span></div>
    <div class="t-head"><div class="t-day">Day ${dn} of ${CYCLE.length} · ${fmt(today())}</div><h1>Rest day</h1><div class="t-sub">Muscle is built on the days off.</div></div>
    <div class="grid">${cyc.map((c,i)=>`<div class="dot ${i<pos?'done':i===pos?'next':c[0]==='R'?'rest':''}"><span class="n">${pad(i+1)}</span><span class="l">${c[1]}</span><span class="s">${i<pos?'done':i===pos?'today':''}</span></div>`).join('')}</div>
    <div class="t-foot"><div class="t-count">${rc.big}</div><div class="t-cap">${rc.cap} Next up: ${DAYS[p.day].name}.</div>
    <button class="btn-ink ghost" data-act="trainanyway">Train anyway</button></div>
  </div>`;
}
function renderTodayQuiet(){ if(TAB!=='today') return; $('#view').innerHTML=todayHTML(); }

/* =========================================================
   DETAIL
   ========================================================= */
let openId=null, origin=null, curPhase=0, dispFrac=0;
function findItem(id){ const p=plan(); const c=curToday(); const lv=c?c.level:p.lv, day=c?c.day:p.day; return items(lv,day).find(x=>x.id===id); }
function photoHTML(e){
  const im=e.img&&IMG[e.img];
  if(!im) return `<div class="photo"><div class="nophoto">${I.img}<span>No verified photo for this one.<br>Tap “More photos” below.</span></div></div>`;
  return `<div class="photo"><i class="fr" role="img" aria-label="${e.n} start position" style="background-image:url(${im})"></i><i class="fr b" role="img" aria-label="${e.n} end position" style="background-image:url(${im})"></i><span class="tag">START ⇄ FINISH</span>${e.sim?`<div class="badge"><b>Similar</b><span>${e.sim}</span></div>`:''}</div>`;
}
function detailHTML(x){
  if(x.type==='list') return listHTML(x);
  if(x.type==='walk') return walkHTML(x);
  const e=EX[x.k];
  const pills=[`<span class="pill">${x.sets} × ${x.reps}${e.unit?' '+e.unit:''}</span>`,`<span class="pill">Rest ${x.rest>=120?fx(x.rest/60)+' min':x.rest+'s'}</span>`];
  if(P.wristPills){
    if(e.straps) pills.push('<span class="pill ac">Straps on</span>');
    if(e.neutral) pills.push('<span class="pill ac">Neutral grip</span>');
    if(e.handles) pills.push('<span class="pill ac">Straight wrists</span>');
  }
  if(e.assist) pills.push('<span class="pill ac">Less help = progress</span>');
  if(e.how||e.mind) pills.push('<button class="pill ac" data-act="toguide">How-to &amp; tips ↓</button>');
  return `<div class="d-in">
    <div class="d-top"><button class="ic" data-act="close" aria-label="Close">${I.x}</button><h2>${DAYS[(curToday()||{}).day||plan().day].name}</h2><a class="ic ac" href="${gImg(e.q)}" target="_blank" rel="noopener" aria-label="More photos">${I.img}</a></div>
    ${photoHTML(e)}
    <div class="d-name">${e.n}</div>
    <div class="pills">${pills.join('')}</div>
    ${x.note?`<p class="note">${x.note}</p>`:''}
    <div class="ringwrap">${ringSVG()}<div class="ringc"><div class="rc-big" id="rcBig"></div><div class="rc-sm" id="rcSm"></div><div class="rc-mid" id="rcMid"></div><div class="rc-mini" id="rcMini"></div></div></div>
    <div id="dHint"></div>
    <div class="sets" id="dSets"></div>
    <div class="last" id="dLast"></div>
    ${guideHTML(e)}
    <div class="links"><a href="${gImg(e.q)}" target="_blank" rel="noopener">${I.img} More photos</a><a href="${yt(e.q)}" target="_blank" rel="noopener">${I.yt} Watch form</a></div>
  </div><div class="dock" id="dDock"></div>`;
}
function guideHTML(e){
  if(!e.how && !e.mind) return '';
  return `<div class="guide">
    ${e.how?`<div class="g-h">How to do it</div><ol class="g-how">${e.how.map(s=>`<li>${s}</li>`).join('')}</ol>`:''}
    ${e.mind?`<div class="g-h">Keep in mind</div><ul class="g-mind">${e.mind.map(s=>`<li>${s}</li>`).join('')}</ul>`:''}
  </div>`;
}
function setsHTML(x){
  const e=EX[x.k], a=getSets(x);
  const wl = e.bw ? '—' : (e.label||'kg');
  const rl = e.unit||'reps';
  return `<div class="sh"><span>Set</span><span>${wl}</span><span>${rl}</span><span></span></div>` + a.map((s,i)=>`
    <div class="set${s.d?' d':''}">
      <span class="no">${i+1}</span>
      ${e.bw?`<div class="stp off">Bodyweight</div>`:`<div class="stp"><button data-act="step" data-f="w" data-i="${i}" data-v="-1" aria-label="Less weight">−</button><input inputmode="decimal" type="number" step="any" placeholder="0" value="${s.w}" data-f="w" data-i="${i}"><button data-act="step" data-f="w" data-i="${i}" data-v="1" aria-label="More weight">+</button></div>`}
      <div class="stp"><button data-act="step" data-f="r" data-i="${i}" data-v="-1" aria-label="Fewer">−</button><input inputmode="numeric" type="number" placeholder="${topRep(x.reps)??'max'}" value="${s.r}" data-f="r" data-i="${i}"><button data-act="step" data-f="r" data-i="${i}" data-v="1" aria-label="More">+</button></div>
      <button class="chk${s.d?' on':''}" data-act="set" data-i="${i}" aria-label="Set ${i+1} done">${I.check}</button>
    </div>`).join('');
}
function lastHTML(x){
  const l=lastLog(x.k); if(!l) return '';
  const e=EX[x.k];
  const parts=l.sets.map(s=> e.bw ? `${s.r}` : `${s.w||0}${e.assist?' help':' kg'} × ${s.r}`);
  return `Last time · ${fmt(l.date,{day:'numeric',month:'short'})}: <b>${parts.join(' · ')}</b>`;
}
function dockHTML(x){
  if(T && T.id===x.id) return `<button class="cbtn" data-act="tpause" aria-label="${T.paused?'Resume':'Pause'}">${T.paused?I.play:I.pause}</button><button class="cbtn" data-act="tadd" aria-label="Add 15 seconds">${I.plus15}</button><button class="cbtn" data-act="tskip" aria-label="Skip rest">${I.skip}</button>`;
  const a=getSets(x), n=a.findIndex(s=>!s.d);
  if(n===-1){
    const nx=nextOpenItem(x.id);
    return nx ? `<button class="pbtn" data-act="next" data-id="${nx.id}">Next: ${itemName(nx)} ${I.arrow}</button>` : `<button class="pbtn" data-act="close">All done — back ${I.arrow}</button>`;
  }
  return `<button class="pbtn" data-act="logset">${I.check} Log set ${n+1} of ${a.length}</button>`;
}
function nextOpenItem(fromId){
  const c=curToday(); const it=items(c.level,c.day); const i=it.findIndex(x=>x.id===fromId);
  return it.slice(i+1).concat(it.slice(0,i)).find(x=>!c.done[x.id]) || null;
}
const itemName = x=> x.type==='walk' ? 'Incline walk' : x.type==='list' ? x.L.short : EX[x.k].sh;
function listHTML(x){
  const L=x.L;
  return `<div class="d-in">
    <div class="d-top"><button class="ic" data-act="close" aria-label="Close">${I.x}</button><h2>${L.top}</h2><span style="width:42px"></span></div>
    <div class="d-name" style="margin-top:6px">${L.title}</div>
    <p class="note">${L.note}</p>
    <div class="ringwrap">${ringSVG()}<div class="ringc"><div class="rc-big" id="rcBig"></div><div class="rc-sm" id="rcSm"></div><div class="rc-mid" id="rcMid"></div><div class="rc-mini" id="rcMini"></div></div></div>
    <div class="list warm" id="dSets">${listRows(x)}</div>
  </div><div class="dock" id="dDock"></div>`;
}
function listRows(x){
  const o=chk(ensureCur(),x.id);
  return x.L.items.map((w,i)=>`<div class="li"><div class="thumb">${w.img&&IMG[w.img]?`<i class="fr b" style="background-image:url(${IMG[w.img]})"></i>`:I.img}</div><div class="t"><b>${w.t}</b><span>${w.d}</span><br><a href="${gImg(w.q)}" target="_blank" rel="noopener">See photos</a></div><button class="chk${o[i]?' on':''}" data-act="li" data-l="${x.id}" data-i="${i}" aria-label="${w.t} done">${I.check}</button></div>`).join('');
}
function walkHTML(x){
  return `<div class="d-in">
    <div class="d-top"><button class="ic" data-act="close" aria-label="Close">${I.x}</button><h2>Finisher</h2><span style="width:42px"></span></div>
    <div class="d-name" style="margin-top:6px">Incline walk</div>
    <div class="pills"><span class="pill">${x.min} min</span><span class="pill">Incline 8–12%</span><span class="pill">5–5.5 km/h</span></div>
    <p class="note">Brisk but able to talk. No holding the rails.</p>
    <div class="ringwrap">${ringSVG()}<div class="ringc"><div class="rc-big" id="rcBig"></div><div class="rc-sm" id="rcSm"></div><div class="rc-mid" id="rcMid"></div><div class="rc-mini" id="rcMini"></div></div></div>
  </div><div class="dock" id="dDock"></div>`;
}
function walkDock(x){
  const c=ensureCur();
  if(c.done.walk) return `<button class="pbtn" data-act="close">Done — back ${I.arrow}</button>`;
  if(T&&T.id==='walk') return `<button class="cbtn" data-act="tpause">${T.paused?I.play:I.pause}</button><button class="cbtn" data-act="tskip" aria-label="Finish walk">${I.skip}</button>`;
  return `<button class="pbtn" data-act="walkstart">${I.play} Start ${x.min}-min timer</button><button class="cbtn dk" data-act="walkdone" aria-label="Mark done">${I.check}</button>`;
}
function ringState(){
  const x=findItem(openId); if(!x) return {f:0};
  const c=ensureCur();
  if(x.type==='list'){ const o=chk(c,x.id), N=x.L.items.length, n=x.L.items.filter((_,i)=>o[i]).length; return {f:n/N,big:`${n}/${N}`,sm:'steps done',mid:n===N?(x.id==='warmup'?'Ready to lift':'Done'):x.L.mins,mini:''}; }
  if(x.type==='walk'){
    if(T&&T.id==='walk'){ const l=timerLeft(); return {f:1-l/T.total,big:fmtT(l),sm:'remaining',mid:'Incline walk',mini:T.paused?'paused':'keep the pace',live:1}; }
    if(c.done.walk) return {f:1,big:'Done',sm:'nice finish',mid:'',mini:''};
    return {f:0,big:`${x.min}m 00s`,sm:'ready',mid:'Incline walk',mini:''};
  }
  const a=getSets(x), n=a.filter(s=>s.d).length;
  if(T&&T.id===x.id){ const l=timerLeft(); return {f:1-l/T.total,big:fmtT(l),sm:'remaining',mid:`${n+1>a.length?'All':''}Set ${Math.min(n+1,a.length)}`,mini:T.paused?'paused':'next set starts after rest',live:1}; }
  return {f:n/a.length,big:`${n}/${a.length}`,sm:'sets done',mid:n===a.length?'Complete':`${x.sets} × ${x.reps}`,mini:n===a.length?'':LV[c.level].rir};
}
function refreshDetail(soft=true){
  const x=findItem(openId); if(!x) return;
  const sets=$('#dSets'), dock=$('#dDock'), hint=$('#dHint'), last=$('#dLast');
  if(x.type==='ex'){
    if(sets){ sets.innerHTML=setsHTML(x); }
    if(hint){ const s=suggestion(x); hint.innerHTML=`<div class="hint${s.plain?' plain':''}">${I.spark}<span>${s.t}</span></div>`; }
    if(last) last.innerHTML=lastHTML(x);
    if(dock){ dock.innerHTML=dockHTML(x); if(soft) blurIn(dock); }
  } else if(x.type==='list'){
    if(sets) sets.innerHTML=listRows(x);
    if(dock){ const o=chk(ensureCur(),x.id); const all=x.L.items.every((_,i)=>o[i]); const nx=nextOpenItem(x.id); dock.innerHTML= all ? (nx?`<button class="pbtn" data-act="next" data-id="${nx.id}">Next: ${itemName(nx)} ${I.arrow}</button>`:`<button class="pbtn" data-act="close">Back ${I.arrow}</button>`) : `<button class="pbtn dk" data-act="liall" data-l="${x.id}">${I.check} Mark all done</button>`; if(soft) blurIn(dock); }
  } else if(x.type==='walk'){
    if(dock){ dock.innerHTML=walkDock(x); if(soft) blurIn(dock); }
  }
  updateRingText(true);
}
let lastTxt='';
function updateRingText(force){
  const s=ringState(); const key=[s.big,s.sm,s.mid,s.mini].join('|');
  if(!force && key===lastTxt) return; lastTxt=key;
  const set=(id,v)=>{const el=$('#'+id); if(el) el.textContent=v||'';};
  set('rcBig',s.big); set('rcSm',s.sm); set('rcMid',s.mid); set('rcMini',s.mini);
}
let wakeLock=null;
async function keepAwake(on){ try{ if(on&&'wakeLock' in navigator){ wakeLock=await navigator.wakeLock.request('screen'); } else if(!on&&wakeLock){ await wakeLock.release(); wakeLock=null; } }catch(e){} }

function openItem(id, el){
  ensureCur();
  const x=findItem(id); if(!x) return;
  const D=$('#detail');
  const r=(el||document.body).getBoundingClientRect();
  origin={x:r.left+r.width/2,y:r.top+r.height/2,r:Math.max(10,r.width/2)};
  openId=id; dispFrac=0; lastTxt='';
  D.innerHTML=detailHTML(x);
  D.style.transition='none';
  D.style.clipPath=`circle(${origin.r}px at ${origin.x}px ${origin.y}px)`;
  D.classList.add('open'); D.scrollTop=0; void D.offsetWidth;
  D.style.transition='';
  refreshDetail(false);
  requestAnimationFrame(()=>{
    D.style.clipPath=`circle(150vmax at ${origin.x}px ${origin.y}px)`;
    D.classList.add('shown'); document.body.classList.add('in-detail'); theme('#000000');
  });
  keepAwake(true);
}
function closeDetail(){
  const D=$('#detail'); if(!openId) return;
  renderTodayQuiet();
  const el=document.querySelector(`#view [data-id="${openId}"]`);
  if(el){ const r=el.getBoundingClientRect(); origin={x:r.left+r.width/2,y:r.top+r.height/2,r:r.width/2}; }
  D.classList.remove('shown'); document.body.classList.remove('in-detail');
  D.style.clipPath=`circle(${origin.r}px at ${origin.x}px ${origin.y}px)`;
  theme(TAB==='today'?'#C5F34E':'#000000');
  openId=null;
  setTimeout(()=>{ if(!openId){ D.classList.remove('open'); D.innerHTML=''; } },620);
  keepAwake(false);
}
function goNext(id){
  const D=$('#detail'); const x=findItem(id); if(!x) return;
  D.classList.remove('blur-in'); D.firstElementChild&&D.firstElementChild.classList.add('blur-out');
  setTimeout(()=>{
    openId=id; dispFrac=0; lastTxt='';
    D.innerHTML=detailHTML(x); D.scrollTop=0;
    const di=D.querySelector('.d-in'); di.style.transition='none'; blurIn(di);
    refreshDetail(false); renderTodayQuiet();
    const el=document.querySelector(`#view [data-id="${id}"]`); if(el){const r=el.getBoundingClientRect(); origin={x:r.left+r.width/2,y:r.top+r.height/2,r:r.width/2}; D.style.transition='none'; D.style.clipPath=`circle(150vmax at ${origin.x}px ${origin.y}px)`; void D.offsetWidth; D.style.transition='';}
  },220);
}

/* =========================================================
   ACTIONS
   ========================================================= */
function markSet(x,i,force){
  const c=ensureCur(), a=getSets(x), s=a[i];
  s.d = force!=null ? force : !s.d;
  const allDone=a.every(q=>q.d);
  c.done[x.id]=allDone;
  if(s.d){
    if(!s.r && topRep(x.reps)==null) {}
    if(allDone){ T&&T.id===x.id&&(T=null); toast(`${EX[x.k].sh} done`); try{navigator.vibrate&&navigator.vibrate(40)}catch(e){} }
    else startTimer(x.id, x.rest);
  } else if(T&&T.id===x.id) T=null;
  save(); refreshDetail();
}
function finishSession(){
  const c=ensureCur(); const it=items(c.level,c.day);
  const done=it.filter(x=>c.done[x.id]).length;
  if(done<it.length && !confirm(`Finish with ${done} of ${it.length} done?`)) return;
  it.filter(x=>x.type==='ex').forEach(x=>{
    const a=(c.sets[x.id]||[]).filter(s=>s.d); if(!a.length) return;
    const k=logKey(x.k); (S.logs[k]=S.logs[k]||[]).push({date:c.date,lv:c.level,sets:a.map(s=>({w:s.w,r:s.r}))});
  });
  S.sessions.push({date:c.date,day:c.day,level:c.level,done,total:it.length});
  c.finished=true; T=null; save();
  swapView(todayHTML()); toast('Session saved');
}
function undoFinish(){
  const c=curToday(); if(!c||!c.finished) return;
  const l=lastSession(); if(l&&l.date===c.date) S.sessions.pop();
  Object.keys(S.logs).forEach(k=>{ S.logs[k]=S.logs[k].filter(e=>e.date!==c.date); });
  c.finished=false; save(); swapView(todayHTML());
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act],[data-tab]'); if(!b) return;
  if(b.dataset.tab){ setTab(b.dataset.tab); return; }
  const act=b.dataset.act, x=openId?findItem(openId):null;
  switch(act){
    case 'open': if(plan().kind==='rest') return; openItem(b.dataset.id,b); break;
    case 'close': closeDetail(); break;
    case 'next': goNext(b.dataset.id); break;
    case 'pick': {
      const c=curToday(); const day=b.dataset.day;
      if(!S.start){ S.start=today(); refreshLV(); }
      if(c){ c.day=day; c.sets={}; c.done={}; c.chk={}; } else { S.cur={date:today(),day,level:level(),sets:{},done:{},chk:{},finished:false}; }
      save(); const g=$('#view .today'); swapView(todayHTML()); break; }
    case 'trainanyway': S.restSkip[today()]=true; save(); swapView(todayHTML()); break;
    case 'finish': finishSession(); break;
    case 'undo': undoFinish(); break;
    case 'step': {
      const a=getSets(x), i=+b.dataset.i, f=b.dataset.f, v=+b.dataset.v;
      const stepSize = f==='w' ? (EX[x.k].step||2.5) : 1;
      const cur=num(a[i][f])??0; let nv=Math.max(0,cur+v*stepSize); a[i][f]=fx(nv);
      // carry weight forward to later undone sets
      if(f==='w') for(let j=i+1;j<a.length;j++) if(!a[j].d) a[j].w=a[i].w;
      save(); const sets=$('#dSets'); if(sets) sets.innerHTML=setsHTML(x); break; }
    case 'set': markSet(x,+b.dataset.i); break;
    case 'logset': { const a=getSets(x); const i=a.findIndex(s=>!s.d); if(i>-1) markSet(x,i,true); break; }
    case 'tpause': if(T){ if(T.paused){T.end=Date.now()+T.left;T.paused=false}else{T.left=timerLeft();T.paused=true} refreshDetail(); } break;
    case 'tadd': if(T){ if(T.paused)T.left+=15000; else T.end+=15000; T.total+=15000; } break;
    case 'tskip': if(T){ const id=T.id; T=null; if(id==='walk'){ensureCur().done.walk=true;save();} refreshDetail(); } break;
    case 'li': { const c=ensureCur(), id=b.dataset.l, L=getList(id), o=chk(c,id), i=+b.dataset.i; o[i]=!o[i]; c.done[id]=L.items.every((_,j)=>o[j]); save(); refreshDetail(); break; }
    case 'liall': { const c=ensureCur(), id=b.dataset.l, L=getList(id), o=chk(c,id); L.items.forEach((_,i)=>o[i]=true); c.done[id]=true; save(); refreshDetail(); break; }
    case 'walkstart': { const it=findItem('walk'); startTimer('walk',it.min*60); refreshDetail(); break; }
    case 'walkdone': { const c=ensureCur(); c.done.walk=true; T&&T.id==='walk'&&(T=null); save(); refreshDetail(); break; }
    case 'level': { const v=b.dataset.v; S.levelOverride = v==='auto'?null:+v; const c=curToday(); if(c && !c.finished && !Object.values(c.sets).some(a=>a.some(s=>s.d))){ c.level=level(); c.sets={}; } save(); swapView(planHTML()); break; }
    case 'gate': S.gates[b.dataset.k]=!S.gates[b.dataset.k]; save(); b.classList.toggle('on'); break;
    case 'logw': { const v=num($('#wIn').value); if(!v||v<30||v>250){toast('Enter weight in kg');return;} S.body=S.body.filter(x=>x.date!==today()); S.body.push({date:today(),kg:v}); S.body.sort((a,b)=>a.date<b.date?-1:1); save(); swapView(progressHTML()); toast('Weight logged'); break; }
    case 'logm': { const m={date:today()}; let any=false; measFields().forEach(([k])=>{ const v=num($('#m_'+k).value); m[k]=v; if(v) any=true; }); if(!any){toast('Enter at least one');return;} S.meas=S.meas.filter(x=>x.date!==today()); S.meas.push(m); save(); swapView(progressHTML()); toast('Measurements saved'); break; }
    case 'goalkg': { const lo=num($('#gLo').value), hi=num($('#gHi').value)||lo; if(!lo||lo<30||lo>250){toast('Enter a goal in kg');return;} S.goalKg={lo:Math.min(lo,hi),hi:Math.max(lo,hi)}; save(); swapView(progressHTML()); toast('Goal saved'); break; }
    case 'setstart': { const v=$('#stIn').value; if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){toast('Pick a date');return;} S.start=v; S.levelOverride=null; refreshLV(); save(); swapView(planHTML()); toast('Start date saved'); break; }
    case 'export': exportData(); break;
    case 'import': $('#importFile').click(); break;
    case 'reset': if(confirm(`Erase all workouts, weights and measurements for the ${P.name} profile on this phone?`)){ try{localStorage.removeItem(keyOf(PID));}catch(e){} location.reload(); } break;
    case 'switch': openPicker(true); break;
    case 'pickprofile': pickProfile(b.dataset.id); break;
    case 'closepicker': closePicker(); break;
    case 'toguide': { const g=$('#detail .guide'); if(g) g.scrollIntoView({behavior:'smooth',block:'start'}); break; }
  }
});
document.addEventListener('input',e=>{
  const t=e.target; if(!t.dataset||!t.dataset.f||!openId) return;
  const x=findItem(openId); const a=getSets(x); const i=+t.dataset.i;
  a[i][t.dataset.f]=t.value;
  if(t.dataset.f==='w') for(let j=i+1;j<a.length;j++) if(!a[j].d){ a[j].w=t.value; const inp=document.querySelector(`input[data-f="w"][data-i="${j}"]`); if(inp) inp.value=t.value; }
  save();
});
function exportData(){
  const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${PID}-lifts-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
  toast('Backup downloaded');
}

/* =========================================================
   PLAN TAB
   ========================================================= */
function calMonths(){
  const base=S.start||today(), end=goalEnd()||addDays(base,62);
  const t=today(), last=t>end?t:end;
  const out=[]; let y=+base.slice(0,4), m=+base.slice(5,7)-1;
  const ly=+last.slice(0,4), lm=+last.slice(5,7)-1;
  while(y<ly||(y===ly&&m<=lm)){ out.push([y,m,new Date(y,m,1).toLocaleDateString('en-GB',{month:'short'})]); if(++m>11){m=0;y++;} }
  return out.slice(-3);
}
function calHTML(){
  const done=new Set(S.sessions.map(s=>s.date)); const t=today();
  const st=S.start||t;
  return `<div class="cal">${calMonths().map(([y,m,l])=>{
    const first=new Date(y,m,1), off=(first.getDay()+6)%7, n=new Date(y,m+1,0).getDate();
    let g=''; for(let i=0;i<off;i++) g+='<i class="x"></i>';
    for(let d=1;d<=n;d++){ const s=`${y}-${pad(m+1)}-${pad(d)}`; let c='';
      if(s<st) c='x'; else if(done.has(s)) c='t'; else if(s>t) c='f';
      if(s===t) c+=' now'; g+=`<i class="${c}"></i>`; }
    return `<div><div class="m">${l}</div><div class="g">${g}</div></div>`;}).join('')}</div>`;
}
function pageHead(title,right){ return `<div class="p-head"><h1>${title}</h1><div class="lbl">${right||''}</div></div>`; }
function planHTML(){
  if(!PLAN) return `<div class="page">${pageHead('Plan',P.name)}<div class="card"><div class="ttl">Coming soon</div><div class="mini">${P.pendingNote||'This plan is being built.'}</div></div></div>`;
  const lv=level(), L=LV[lv], p=plan(), t=today(), nLv=Object.keys(LV).length, G=P.goal;
  const wLen=L.w[1]?L.w[1]-L.w[0]+1:null;
  const wk=Math.max(1,Math.floor(diffDays(L.from,t)/7)+1);
  const frac=wLen?Math.min(1,Math.max(0,(diffDays(L.from,t)+1)/(wLen*7))):Math.min(1,wk/12);
  const cycPos = p.kind==='rest' ? CYCLE.indexOf(p.after)+1 : CYCLE.indexOf(p.day);
  const cyc=CYCLE.map((k,i)=>k==='R'?['R','Rest']:[String(i+1),DAYS[k].short]);
  const total=S.sessions.length; const wkCount=S.sessions.filter(s=>diffDays(s.date,t)<7).length;
  const end=goalEnd(), endLabel=end?fmt(end,{day:'numeric',month:'short'}):'';
  const daysLeft=end&&S.start?diffDays(t,end):null;
  const planWeek=S.start?Math.floor(diffDays(S.start,t)/7)+1:0;
  const gates=GATES.filter(g=>!g.lv||g.lv===lv);
  const head=!S.start?'Starts with your first session':daysLeft>0?`${daysLeft} days to ${endLabel}`:`Week ${planWeek}`;
  return `<div class="page">
    ${pageHead('Plan',head)}
    <div class="row2">
      <div class="card">${smallRing(frac,lv)}<div class="ttl">${L.name}</div><div class="lbl">${S.start?(wLen?`Week ${Math.min(wk,wLen)} of ${wLen}`:`Week ${wk}`):'Not started'}</div></div>
      <div class="card"><div class="big">${total}</div><div class="sp" style="height:30px"></div><div class="ttl">Sessions</div><div class="lbl">${S.start?`${wkCount} in the last 7 days · since ${fmt(S.start,{day:'numeric',month:'short'})}`:'None yet'}</div></div>
    </div>
    <div class="card">${calHTML()}<div class="sp"></div>
      <div style="display:flex;align-items:center;gap:14px">${smallRing((cycPos+1)/CYCLE.length,cycPos+1)}<div><div class="ttl">${p.kind==='rest'?'Rest today':DAYS[p.day].name}</div><div class="lbl">${p.kind==='rest'?'Next: '+DAYS[p.day].name:p.kind==='done'?'Done today':'Up next'} · ${L.rir.toLowerCase()}</div></div></div>
      <div class="cyc" style="grid-template-columns:repeat(${CYCLE.length},1fr)">${cyc.map((c,i)=>`<div><span class="${c[0]==='R'?'r':''}${i===cycPos?' on':''}">${c[0]==='R'?'–':c[0]}</span><small>${c[1]}</small></div>`).join('')}</div>
    </div>
    <div class="card"><div class="ttl">Start date</div><div class="lbl" style="margin:4px 0 12px">${S.start?`Week ${planWeek} of the plan. Levels and the calendar count from this day.`:'Set automatically when you start your first session. You can also pick it now.'}</div>
      <div class="field"><input class="inp" id="stIn" type="date" value="${S.start||t}"><button class="btn-ac" data-act="setstart">Save</button></div>
    </div>
    <div class="card"><div class="ttl">Level</div><div class="lbl" style="margin:4px 0 14px">Auto follows the weeks since your start date. Override only after the gates below are all ticked.</div>
      <div class="seg">${['auto',...Object.keys(LV).map(Number)].map(v=>`<button data-act="level" data-v="${v}" class="${(v==='auto'&&!S.levelOverride)||S.levelOverride===v?'on':''}">${v==='auto'?'Auto':'L'+v}</button>`).join('')}</div>
      <div class="mini">${P.levelNote||''}</div>
    </div>
    <div class="card"><div class="ttl">${lv<nLv?`Gates to reach Level ${lv+1}`:'Final level'}</div>
      <div class="list">${lv<nLv?gates.map(g=>`<div class="li"><button class="tick${S.gates[lv+g.k]?' on':''}" data-act="gate" data-k="${lv+g.k}">${I.check.replace('20','14').replace('20','14')}</button><span>${g.t}</span></div>`).join(''):`<div class="li"><span>${P.finalNote||''}</span></div>`}</div>
    </div>
    ${P.rules?`<details class="card"><summary><span class="ttl">Every-session rules</span>${I.plus}</summary><div class="rules">
      ${P.rules.map(([h,t])=>`<h4>${h}</h4><p>${t}${h==='PACING'?' '+L.rir+'.':''}</p>`).join('')}
    </div></details>`:''}
    ${ORDER.map(k=>`<details class="card"><summary><span><span class="ttl">${DAYS[k].name}</span><br><span class="lbl">Day ${DAYS[k].n} · ${DAYS[k].sub}</span></span>${I.plus}</summary><div class="list" style="margin-top:10px">${PLAN[lv][k].map(([ek,s,r])=>ek[0]==='@'?`<div class="li"><span>${getList(ek.slice(1)).title}</span><span class="k">${getList(ek.slice(1)).mins}</span></div>`:`<div class="li"><span>${EX[ek].n}</span><span class="k">${s} × ${r}${EX[ek].unit&&EX[ek].unit!=='reps'?' '+EX[ek].unit:''}</span></div>`).join('')}${(P.walk&&P.walk[lv])?`<div class="li"><span>Incline walk</span><span class="k">${P.walk[lv]} min</span></div>`:''}</div></details>`).join('')}
  </div>`;
}

/* =========================================================
   PROGRESS TAB
   ========================================================= */
const measFields = ()=>P.meas||[['waist','Waist'],['hips','Hips'],['arm','Upper arm']];
function weightChart(pts){
  const GK=S.goalKg, W=320,H=150,P0=8, end=goalEnd();
  const d0=pts[0].date, dEnd=(end&&end>today())?end:addDays(today(),Math.max(28,diffDays(d0,today())+14));
  const span=Math.max(7,diffDays(d0,dEnd));
  const kgs=pts.map(p=>p.kg).concat(GK?[GK.lo,GK.hi]:[]);
  const lo=Math.floor(Math.min(...kgs)-0.5), hi=Math.ceil(Math.max(...kgs)+0.5);
  const X=d=>P0+(W-2*P0)*diffDays(d0,d)/span, Y=k=>P0+(H-2*P0)*(1-(k-lo)/(hi-lo));
  const line=pts.map((p,i)=>`${i?'L':'M'}${X(p.date).toFixed(1)} ${Y(p.kg).toFixed(1)}`).join('');
  const lastP=pts[pts.length-1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H+20}" width="100%">
    ${GK?`<rect x="${P0}" y="${Y(GK.hi)}" width="${W-2*P0}" height="${Math.max(2,Y(GK.lo)-Y(GK.hi))}" rx="6" fill="rgba(197,243,78,.10)"/>
    <text x="${W-P0-4}" y="${Y(GK.hi)-6}" text-anchor="end" font-size="11" fill="#8E8E89">Goal ${GK.lo===GK.hi?GK.lo:GK.lo+'–'+GK.hi}</text>`:''}
    <line x1="${X(today())}" x2="${X(today())}" y1="${P0}" y2="${H-P0}" stroke="#2A2A28" stroke-dasharray="3 4"/>
    <path d="${line}" fill="none" stroke="#C5F34E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map(p=>`<circle cx="${X(p.date)}" cy="${Y(p.kg)}" r="${p===lastP?5:3}" fill="${p===lastP?'#C5F34E':'#0E0E0E'}" stroke="#C5F34E" stroke-width="2"/>`).join('')}
    <text x="${P0}" y="${H+16}" font-size="11" fill="#55554F">${fmt(d0,{day:'numeric',month:'short'})}</text>
    <text x="${W-P0}" y="${H+16}" font-size="11" fill="#55554F" text-anchor="end">${fmt(dEnd,{day:'numeric',month:'short'})}</text>
    <text x="${P0}" y="${P0+10}" font-size="11" fill="#55554F">${hi} kg</text>
    <text x="${P0}" y="${H-P0-2}" font-size="11" fill="#55554F">${lo} kg</text>
  </svg>`;
}
function ratioHTML(){
  const R=P.ratio; if(!R) return '';
  const m=[...S.meas].reverse().find(x=>x[R.a]&&x[R.b]);
  const v=m?m[R.a]/m[R.b]:null;
  return `<div class="card"><div class="lbl">${R.label}</div>
    <div class="big" style="margin-top:10px">${v?v.toFixed(2):'—'}<span class="unit">/ ${R.target}</span></div>
    <div class="bar"><i style="width:${v?Math.min(100,v/R.target*100):0}%"></i></div>
    <div class="mini">${v?(v>=R.target?'At the ideal. Hold the waist, keep building the shoulders.':`Shoulders need about ${fx(R.target*m[R.b]-m[R.a])} cm more at this waist.`)+' ':'Log shoulders and waist below. '}${R.cap}</div></div>`;
}
function progressHTML(){
  const t=today(), G=P.goal, GK=S.goalKg, end=goalEnd(); const pts=[...S.body].sort((a,b)=>a.date<b.date?-1:1);
  const wk=pts.filter(p=>diffDays(p.date,t)<7);
  const avg=pts.length?(wk.length?wk.reduce((s,p)=>s+p.kg,0)/wk.length:pts[pts.length-1].kg):null;
  const delta=pts.length?avg-pts[0].kg:0;
  let vol=0; Object.entries(S.logs).forEach(([k,arr])=>{ const e=EX[k]; if(!e||e.assist||e.bw||e.unit==='m') return; arr.forEach(l=>{ if(diffDays(l.date,t)<7) l.sets.forEach(s=>vol+=(num(s.w)||0)*(num(s.r)||0)); }); });
  const MF=measFields(), m=S.meas, m1=m[m.length-1];
  const first=k=>m.find(x=>x[k]!=null);
  const md=(k)=>{ if(!m1||m1[k]==null) return '<b>—</b>'; const f=first(k); const d=f&&f!==m1?m1[k]-f[k]:null; return `<b>${fx(m1[k])}</b>${d!=null?`<em>${d>0?'+':''}${fx(d)} cm</em>`:''}`; };
  const lifts=Object.entries(S.logs).filter(([k,a])=>EX[k]&&!EX[k].bw&&a.length).map(([k,a])=>{
    const best=l=>Math.max(...l.sets.map(s=>num(s.w)||0)); const f=best(a[0]), l=best(a[a.length-1]); return {k,f,l,a:EX[k].assist};
  }).filter(x=>x.l>0);
  const pace = G&&G.weekly ? ` · aim for ${G.weekly} per week` : '';
  const endLabel=end?fmt(end,{day:'numeric',month:'short'}):'';
  return `<div class="page">
    ${pageHead('Progress',P.name)}
    <div class="card">
      <div class="lbl">Body weight · 7-day average</div>
      <div class="big" style="margin-top:10px">${avg==null?'—':fx(avg)}<span class="unit">kg</span></div><div class="mini">${pts.length?`${delta>0?'+':''}${fx(delta)} kg since start${pace}`:'Log your first weigh-in below.'}</div>
      ${pts.length?weightChart(pts):''}
      <div class="field"><input class="inp" id="wIn" inputmode="decimal" type="number" step="0.1" placeholder="Today's weight, kg"><button class="btn-ac" data-act="logw">Log</button></div>
      <div class="mini">Weigh every morning after the bathroom, before food. Only the weekly average matters.</div>
      <details class="goalset"><summary>${GK?`Goal: ${GK.lo===GK.hi?GK.lo:GK.lo+'–'+GK.hi} kg${end&&S.start?' by '+endLabel:''} · change`:'Set a goal weight'}</summary>
        <div class="field"><input class="inp" id="gLo" inputmode="decimal" type="number" step="0.5" placeholder="From kg" value="${GK?GK.lo:''}"><input class="inp" id="gHi" inputmode="decimal" type="number" step="0.5" placeholder="To kg" value="${GK?GK.hi:''}"><button class="btn-ac" data-act="goalkg">Save</button></div>
      </details>
    </div>
    <div class="row2">
      <div class="card"><div class="lbl">Volume lifted</div><div class="big" style="font-size:36px;margin-top:22px">${vol>=1000?fx(vol/1000)+'k':Math.round(vol)}<span class="unit">kg</span></div><div class="lbl" style="margin-top:6px">Last 7 days</div></div>
      <div class="card"><div class="lbl">Sessions</div><div class="big" style="font-size:36px;margin-top:22px">${S.sessions.length}${G&&G.sessions?`<span class="unit">/ ~${G.sessions}</span>`:''}</div><div class="lbl" style="margin-top:6px">${end&&S.start?`by ${endLabel}`:'logged'}</div></div>
    </div>
    ${ratioHTML()}
    <div class="card"><div class="ttl">Measurements</div><div class="lbl" style="margin-top:4px">Every 2 weeks, same light, same time. Take photos too.</div>
      <div class="ms">${MF.map(([k,l])=>`<div><span class="lbl">${l}</span>${md(k)}</div>`).join('')}</div>
      <div class="meas">${MF.map(([k,l])=>`<input class="inp" id="m_${k}" inputmode="decimal" type="number" step="0.1" placeholder="${l}">`).join('')}</div>
      <button class="btn-ac" style="width:100%;margin-top:10px" data-act="logm">Save measurements</button>
    </div>
    <div class="card"><div class="ttl">Strength</div><div class="lbl" style="margin-top:4px">Heaviest set, first session → latest</div>
      <div class="list">${lifts.length?lifts.map(x=>`<div class="li"><span>${EX[x.k].n}</span><span class="k">${fx(x.f)} → <b style="color:var(--ac)">${fx(x.l)}</b> ${x.a?'kg help':'kg'}</span></div>`).join(''):'<div class="li"><span class="lbl">Finish a session and your lifts show up here.</span></div>'}</div>
    </div>
    <div class="card"><div class="ttl">Profile</div><div class="lbl" style="margin-top:4px">Each profile keeps its own plan, logs and backup on this phone.</div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn-gh" data-act="switch">Switch profile</button></div>
    </div>
    <div class="card"><div class="ttl">Backup · ${P.name}</div><div class="lbl" style="margin-top:4px">Everything saves on this phone automatically. Download a backup every week or two, and before changing phones or clearing browser data.</div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn-gh" data-act="export">Download backup</button><button class="btn-gh" data-act="import">Restore</button><button class="btn-gh" data-act="reset" style="color:#ff8a7a">Reset</button></div>
    </div>
    <p class="credit">Exercise photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">Free Exercise DB</a> (public domain).<br>Add this page to the home screen for the full-screen app.</p>
  </div>`;
}

/* =========================================================
   TABS + LOOP
   ========================================================= */
let TAB='today';
function themeFor(t){ return t==='today' ? '#C5F34E' : '#000000'; }
function setTab(t,force){
  if(t===TAB && !force) return; TAB=t;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  theme(themeFor(t));
  document.body.style.background = t==='today' ? '#C5F34E' : '';
  swapView(t==='today'?todayHTML():t==='plan'?planHTML():progressHTML());
}
function loop(){
  if(T && !T.paused && timerLeft()<=0) timerDone();
  if(openId){
    const s=ringState();
    dispFrac += ((s.f||0)-dispFrac)*0.12;
    curPhase += s.live?0.06:0.018;
    const w=$('#rWave'), a=$('#rArc');
    if(w){ w.setAttribute('d',wavePath(dispFrac,curPhase)); a.setAttribute('d',arcPath(dispFrac)); }
    updateRingText(false);
  }
  const rt=$('#restTxt'); if(rt&&T) rt.textContent=(T.id==='walk'?'Walk ':'Rest ')+fmtShort(timerLeft());
  else if(rt&&!T&&TAB==='today'&&!openId) renderTodayQuiet();
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{ if(!document.hidden){ if(openId) keepAwake(true); if(TAB==='today'&&!openId) renderTodayQuiet(); }});
window.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDetail(); });

/* =========================================================
   SPLASH + PROFILE PICKER
   ========================================================= */
function splash(html,{hold=1400,mid}={}){
  return new Promise(res=>{
    const el=$('#splash'); let ranMid=false, done=false, tm;
    if(html!=null){ el.innerHTML=html; el.className=''; void el.offsetWidth; el.classList.add('on'); }
    const runMid=()=>{ if(!ranMid){ ranMid=true; mid&&mid(); } };
    const finish=()=>{
      if(done) return; done=true; clearTimeout(tm); runMid();
      el.classList.remove('on'); el.classList.add('out');
      setTimeout(()=>{ el.className=''; el.innerHTML=''; el.onclick=null; res(); },480);
    };
    setTimeout(runMid,html!=null?450:0);
    tm=setTimeout(finish,hold+(html!=null?450:0));
    el.onclick=finish;
  });
}
function profSplashHTML(p){
  const s=p.splash;
  return `<div class="sp-prof" style="background:${s.theme}"><img src="${s.img}" alt="" style="object-position:${s.pos}"><h1 style="color:${s.color};text-shadow:${s.shadow}">${s.text}</h1></div>`;
}
function openPicker(cancelable){
  const el=$('#picker');
  el.innerHTML=`<div class="pk-in">
    <div class="pk-top"><span class="pk-q">Who’s lifting?</span>${cancelable?`<button class="ic" data-act="closepicker" aria-label="Close">${I.x}</button>`:''}</div>
    ${PIDS.map(id=>{const p=window.PROFILES[id], sp=p.splash; return `<button class="pk${id===PID?' on':''}" data-act="pickprofile" data-id="${id}" style="background:${sp.theme}" aria-label="${p.name}"><img src="${sp.img}" alt="" style="object-position:${sp.pickPos||sp.pos}"><span class="pk-lab">${id===PID?'<span class="pk-cur">Current</span>':''}<span class="pk-name" style="color:${sp.color};text-shadow:${sp.shadow}">${sp.text}</span></span></button>`}).join('')}
  </div>`;
  el.classList.add('show'); blurIn(el.firstElementChild);
}
function closePicker(){ const el=$('#picker'); el.classList.remove('show'); setTimeout(()=>{ if(!el.classList.contains('show')) el.innerHTML=''; },320); }
function mountProfile(id){
  setProfile(id); TAB='today';
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab==='today'));
  theme('#C5F34E'); document.body.style.background='#C5F34E';
  const D=$('#detail'); D.classList.remove('open','shown'); D.innerHTML=''; document.body.classList.remove('in-detail');
  $('#view').innerHTML=todayHTML(); blurIn($('#view')); window.scrollTo(0,0);
}
function pickProfile(id){
  if(id===PID){ closePicker(); return; }
  const p=window.PROFILES[id];
  theme(p.splash.theme);
  splash(profSplashHTML(p),{hold:1900,mid:()=>{ $('#picker').classList.remove('show'); $('#picker').innerHTML=''; mountProfile(id); }}).then(()=>theme('#C5F34E'));
}

/* =========================================================
   BOOT
   ========================================================= */
function boot(){
  migrateLegacy();
  let id=null;
  try{
    let q=(new URLSearchParams(location.search).get('p')||'').toLowerCase(); q=OLD_IDS[q]||q;
    if(q && window.PROFILES[q]) id=q;
    if(!id){ const a=localStorage.getItem(ACTIVE_KEY); if(a&&window.PROFILES[a]) id=a; }
  }catch(e){}
  if(id) mountProfile(id);
  splash(null,{hold:1500}).then(()=>{ if(!id) openPicker(false); });
  requestAnimationFrame(loop);
  try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(e){}
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
$('#importFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{ const d=JSON.parse(await f.text()); if(!d.sessions) throw 0; S=Object.assign(defState(),d); save(); refreshLV(); toast('Backup restored'); setTab(TAB,true); }
  catch(err){ toast('That file is not a backup'); }
  e.target.value='';
});
boot();
