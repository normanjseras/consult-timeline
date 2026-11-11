/* =====================================================================
   APP
   ===================================================================== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const hd=t=>Math.floor(t/24)+1;
const clock=t=>{let m=Math.round((t-Math.floor(t/24)*24)*60);if(m>=1440)m=1439;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const dlabel=t=>{const d=new Date(2026,9,30+Math.floor(t/24));return DOW[d.getDay()]+' '+(d.getMonth()+1)+'/'+d.getDate()};
const stamp=t=>'HD'+hd(t)+' '+clock(t);
const stampL=t=>'HD'+hd(t)+' · '+dlabel(t)+' · '+clock(t);
const md=t=>{const d=new Date(2026,9,30+Math.floor(t/24));return (d.getMonth()+1)+'/'+d.getDate()};
const dur=h=>h<48?(Math.round(h*10)/10)+' h':(Math.round(h/24*10)/10)+' d';
const latest=(pts,t)=>{let r=null;for(const p of pts){if(p[0]<=t+1e-6)r=p;else break}return r};
const tw=(s,px=12)=>String(s).length*px*0.55;
const f=n=>Math.round(n*10)/10;
const I={
  up:'<svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true"><path d="M2.5 6.5 6.5 3l4 3.5M2.5 10.5 6.5 7l4 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  grid:'<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="1.5" y="1.5" width="11" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 5.2h11M1.5 8.8h11M5.2 1.5v11M8.8 1.5v11" stroke="currentColor" stroke-width="1.1"/></svg>',
  graph:'<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="1.5" y="1.5" width="11" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 10l2.6-3.4 2.2 1.8L11 4.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rows:'<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 3.5h1.6M2 7h1.6M2 10.5h1.6M5.6 3.5H12M5.6 7H12M5.6 10.5H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  chev:'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check:'<svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const state={open:{scope:false,course:false},scope:'enc',ce:false,fetching:null,medGroup:'type',gclosed:new Set(),astf:'all',fmt:{id:'full',dili:'full'},dom:[0,END],tpl:'ugib',lanes:[],labs:[],hidden:new Set(),mode:{labs:'num',vitals:'graph',blood:'graph',idlabs:'graph'},closed:new Set(),spec:'dili',sel:null,chapter:null,edited:false,user:[],ask:null,rowMenu:null};
let W=600,G=252,PREW=0,HL=0,d0=0,d1=END,uid=0,BIN=24;
let RO={},CD={},ROWSETS={};
const X=t=>(t-d0)/(d1-d0)*W;
const allTemplates=()=>[...TEMPLATES,...state.user];
const CARE={ed:'ED',icu:'ICU',floor:'Floor'};
const locAt=t=>{const l=LOC.find(s=>t>=s.s&&t<s.e);return l?CARE[l.kind]:(t>=NOW?'scheduled':'')};
const DRIPS=SUPPORT.filter(r=>!r.text),RESP=SUPPORT.filter(r=>r.text);

const HYPO=[];S.MAP.pts.forEach(p=>{if(p[1]<60){const l=HYPO[HYPO.length-1];if(l&&p[0]-l.e<=4.5)l.e=p[0];else HYPO.push({s:p[0],e:p[0]})}});HYPO.forEach(h=>h.e+=1);
const ONSET=S.ALP.pts.find(p=>p[1]>=2*ULN.ALP)[0];
const Rat=i=>(A.ALT[i]/ULN.ALT)/(A.ALP[i]/ULN.ALP);
const pattern=r=>r>=5?'Hepatocellular':r<=2?'Cholestatic':'Mixed';

/* everything that can be hovered or pinned */
const EV={};
IMAGING.forEach(e=>EV[e.id]={...e,kick:'Imaging'});
PROCS.forEach(e=>EV[e.id]={...e,kick:'Procedure'});
MICRO.forEach(e=>EV[e.id]={...e,kick:'Microbiology',src:'Microbiology report · '+e.acc});
MEDS.filter(m=>m.role).forEach(m=>EV['rx:'+m.id]={id:'rx:'+m.id,t:m.first,kick:'Antimicrobial · '+m.role,title:m.name,src:'MAR and order',rx:m});
NOTES.forEach(n=>EV[n.id]={id:n.id,t:n.t,kick:'Note',title:n.type,src:'Note metadata',note:n,short:n.lab});
CONSULTS.forEach(c=>EV[c.id]={id:c.id,t:c.init,kick:'Consult',title:c.svc,src:'Initial consult note',consult:c});
EPIS.forEach(ep=>EV[ep.id]={id:ep.id,t:ep.s,kick:'Blood product',title:'Red blood cells, '+ep.n+' unit'+(ep.n>1?'s':''),src:'Blood administration record',ep});
TX.filter(u=>u.prod!=='pRBC').forEach(u=>EV[u.id]={id:u.id,t:u.t,kick:'Blood product',title:'Platelets, 1 apheresis unit',src:'Blood administration record',plt:u});

function bodyHTML(e,full){let b='';
  if(e.consult){const c=e.consult;
    b+=`<h5>Question asked</h5><p>${c.q}</p><h5>Assessment</h5><p>${c.a}</p><h5>Recommendations</h5><ul>${c.recs.map(r=>'<li>'+r+'</li>').join('')}</ul>`;
    if(full)b+=`<dl class="kv" style="margin-top:8px"><dt>Consulted</dt><dd>${stamp(c.s)}</dd><dt>Initial note</dt><dd>${stamp(c.init)}</dd><dt>Status</dt><dd>${c.off||'Following'}</dd></dl>`;
    else b+=`<p style="margin-top:5px">${c.off||'Still following'}</p>`}
  else if(e.ep){const ep=e.ep;b+=txChart(e);
    if(full)b+=`<dl class="kv" style="margin-top:10px">${ep.units.map((u,i)=>`<dt>Unit ${i+1}</dt><dd>ordered ${clock(u.t-40/60)}, issued ${clock(u.t-14/60)}, started ${stamp(u.t)}, done ${clock(u.end)} · ${u.where}</dd>`).join('')}</dl><p class="note" style="margin-top:8px">The shaded band starts at the documented bedside start, not at the order or the blood bank issue time. All three are kept so the administration time can be audited.</p>`}
  else if(e.plt){const u=e.plt;b+=txChart(e);if(full)b+=`<dl class="kv" style="margin-top:10px"><dt>Started</dt><dd>${stamp(u.t)} · ${u.where}</dd><dt>Done</dt><dd>${clock(u.end)}</dd></dl>`}
  else if(e.rx){const m=e.rx,d=new Set(m.adm.map(hd)).size;
    b+=`<dl class="kv"><dt>Dose</dt><dd>${m.dose}</dd><dt>Class</dt><dd>${m.cls}</dd><dt>Start</dt><dd>${stamp(m.first)}</dd><dt>Stop</dt><dd>${m.on?'Active':stamp(m.segs[m.segs.length-1].e)}</dd><dt>Days of therapy</dt><dd>${d} (${m.adm.length} doses)</dd><dt>Indication</dt><dd>${m.ind}</dd><dt>Ordered by</dt><dd>${m.by}</dd>${m.plan?`<dt>Planned stop</dt><dd>${stamp(m.plan)} (${md(m.plan)})</dd>`:''}</dl>`}
  else if(e.note){b+=`<dl class="kv"><dt>Signed</dt><dd>${stamp(e.t)}</dd><dt>Author</dt><dd>${e.note.by}</dd></dl><p class="note" style="margin-top:6px">Metadata only. The note text stays in the chart and the link opens it.</p>`}
  else{b+=`<h5>${e.kick==='Imaging'?(e.pending?'Status':'Impression'):e.kick==='Microbiology'?'Result':'Findings'}</h5><p>${e.body}</p>`;
    if(e.spec)b+=`<dl class="kv" style="margin-top:6px"><dt>Specimen</dt><dd>${e.spec}</dd><dt>Collected</dt><dd>${stamp(e.t)}</dd>${e.prelim?`<dt>Preliminary</dt><dd>${e.prelim}</dd>`:''}<dt>${e.resT?'Final':'Current'}</dt><dd>${e.result}${e.resT?', '+stamp(e.resT)+' ('+dur(e.resT-e.t)+' after collection)':''}</dd>${e.firstNeg?'<dt>Note</dt><dd>First negative blood culture after bacteremia</dd>':''}</dl>`}
  return b}
const cardHTML=id=>{const e=EV[id];return `<div class="ck-k">${e.kick}</div><div class="ck-t">${e.title}</div><div class="ck-w">${stampL(e.t)}${e.pending?' · scheduled':''} · ${e.src}</div><div class="ck-b">${bodyHTML(e,false)}</div><div class="ck-f">Click to pin</div>`};

/* ---------- shared drawing ---------- */
const row=(inner,h,label,cls='',pre='')=>`<div class="row ${cls}" style="height:${h}px">${PREW?`<svg class="hp" width="${PREW}" height="${h}">${pre}</svg>`:''}<svg class="p" width="${W}" height="${h}">${inner}</svg><div class="g">${label}</div></div>`;
const lab=(name,unit='',right='')=>`<i class="grip"></i><span class="lb" title="${esc(name)}">${name}</span>${unit?`<span class="un">${unit}</span>`:''}${right}`;
const isOut=(s,v)=>s.lo!=null&&(v<s.lo||v>s.hi);

function backdrop(){let s='';
  if(BIN<24)for(let b=Math.ceil(d0/BIN)*BIN;b<d1;b+=BIN)if(b%24)s+=`<line x1="${f(X(b))}" x2="${f(X(b))}" y1="0" y2="100%" stroke="var(--col)"/>`;
  for(let d=Math.floor(d0/24);d*24<d1;d++){const a=X(d*24);s+=`<line x1="${f(a)}" x2="${f(a)}" y1="0" y2="100%" stroke="var(--day)"/>`}
  const nx=X(NOW);
  if(nx<W)s+=`<rect x="${f(Math.max(nx,0))}" y="0" width="${f(W-Math.max(nx,0))}" height="100%" fill="var(--future)"/>`;
  if(nx>=0&&nx<=W)s+=`<line x1="${f(nx)}" x2="${f(nx)}" y1="0" y2="100%" stroke="var(--mk)" stroke-width="2"/>`;
  return `${PREW?`<div class="backdrop hb" style="left:0;width:${PREW}px"><svg width="${PREW}" height="100%">${histTicks().map(k=>`<line x1="${f(XH(k.t))}" x2="${f(XH(k.t))}" y1="0" y2="100%" stroke="var(--col)"/>`).join('')}</svg></div>`:''}<div class="backdrop" style="left:${PREW}px"><svg width="${W}" height="100%">${s}</svg></div>`}

function axisInner(compact){
  const step=BIN<24?BIN:0,h=compact?26:(step?54:40);let s='';
  for(let d=Math.floor(d0/24);d*24<d1;d++){const a=X(d*24),b=X(d*24+24),va=Math.max(a,0),vb=Math.min(b,W),vw=vb-va,cx=(va+vb)/2;
    if(a>=0)s+=`<line class="ax-l" x1="${f(a)}" x2="${f(a)}" y1="0" y2="${h}"/>`;
    if(vw>15)s+=`<text class="ax-hd" x="${f(cx)}" y="16">${vw>58?'HD ':''}${d+1}</text>`;
    if(!compact&&vw>64)s+=`<text class="ax-dt" x="${f(cx)}" y="30">${dlabel(d*24)}</text>`}
  if(step&&!compact)for(let t=Math.ceil(d0/step)*step;t<d1;t+=step){const x=X(t+step/2);if(x<14||x>W-14||X(step)-X(0)<26)continue;
    s+=`<text class="ax-hr" x="${f(x)}" y="${h-6}">${String(t%24).padStart(2,'0')}:00</text>`}
  return{s,h}}
function renderAxis(){const a=axisInner(false);
  $('#axis').innerHTML=`${PREW?`<svg class="hp" width="${PREW}" height="${a.h}">${histAxis(a.h,false)}</svg>`:''}<svg width="${W}" height="${a.h}" aria-label="Day ruler. Drag to zoom.">${a.s}<rect class="brush" y="0" height="${a.h}" x="0" width="0" style="display:none"/></svg><div class="g"><span id="curL"></span><b id="curT"></b></div>`}

/* section band: name over the label column, icons on the right, like the native timeline */
function head(k,title,o={}){let ic='';
  if(o.mode){const num=state.mode[o.mode]==='num';ic+=`<button class="ib" data-mode="${o.mode}" title="${num?'Show as graph':'Show as numbers'}" aria-label="${num?'Show as graph':'Show as numbers'}">${num?I.graph:I.grid}</button>`}
  if(o.rows){ROWSETS[k]=o.rows;const n=o.rows.filter(r=>state.hidden.has(r.key)).length;ic+=`<button class="ib" data-rows="${k}" title="Choose rows${n?' ('+n+' hidden)':''}" aria-haspopup="true" aria-label="Choose rows">${I.rows}${n?`<span class="cnt">${n}</span>`:''}</button>`}
  if(!o.fixed)ic+=`<button class="ib col" data-collapse="${k}" aria-expanded="${!state.closed.has(k)}" title="Collapse or expand" aria-label="Collapse or expand">${I.up}</button>`;
  return `<div class="lh${o.pink?' pink':''}"><div class="lhp${o.left?' keep':''}">${o.left||''}</div><div class="lhg"><h3>${title}</h3>${ic}</div></div>`}
const subh=t=>`<div class="subh"><i></i><b>${t}</b></div>`;
const shown=(key)=>!state.hidden.has(key);

/* numbers in time cells, like the native results rows */
function cellsRow(s,agg='last'){if(W/((d1-d0)/BIN)<26)return graphRow(s,36,agg==='last');const h=28;let g='';
  for(let b=Math.floor(d0/BIN)*BIN;b<d1;b+=BIN){const vals=s.pts.filter(p=>p[0]>=b&&p[0]<b+BIN);if(!vals.length)continue;
    const a=Math.max(X(b),0);let e=Math.min(X(b+BIN),W);if(b<NOW&&b+BIN>NOW&&X(NOW)-a>=24)e=Math.min(e,X(NOW));const cw=e-a;if(cw<16)continue;
    const nums=vals.map(v=>v[1]),lo=Math.min(...nums),hi=Math.max(...nums),last=nums[nums.length-1];
    let txt,out,tip;
    if(agg==='range'){const wide=cw>=tw(lo.toFixed(s.dec)+'–'+hi.toFixed(s.dec),12)+8;txt=lo===hi||!wide?last.toFixed(s.dec):lo.toFixed(s.dec)+'–'+hi.toFixed(s.dec);out=isOut(s,lo)||isOut(s,hi);
      tip=s.label+' '+s.unit+'|Lowest '+lo.toFixed(s.dec)+', highest '+hi.toFixed(s.dec)+'|Last '+last.toFixed(s.dec)+' at '+stamp(vals[vals.length-1][0])+'|'+vals.length+' readings'}
    else{txt=last.toFixed(s.dec);out=isOut(s,last);
      tip=s.label+(s.unit&&s.unit!=='derived'?' '+s.unit:'')+(s.lo!=null?' (ref '+s.lo+' to '+s.hi+')':'')+'|'+vals.map(v=>stamp(v[0])+'   '+v[1].toFixed(s.dec)).join('|')+(s.note?'|'+s.note(vals[vals.length-1][0]):'')}
    g+=`<g data-tip="${esc(tip)}"><rect class="hit" x="${f(a)}" y="0" width="${f(cw)}" height="${h}"/><text class="cv${out?' ab':''}${cw<34?' sm':''}" x="${f((a+e)/2)}" y="${h/2+4.2}">${txt}</text>${agg==='last'&&vals.length>1&&cw>30?`<circle class="more" cx="${f((a+e)/2+tw(txt,12)/2+5)}" cy="9" r="1.6"/>`:''}</g>`}
  return row(g,h,lab(s.label,s.unit==='derived'?'':s.unit),'',PREW?hLabNum(s,h):'')}

/* stretches where a series is beyond a limit: red fill to the limit line, red trace, worst value labelled */
function excur(pts,thr,dir){const out=[],bad=v=>dir<0?v<thr:v>thr;let cur=null;
  for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[i-1];
    if(bad(p[1])){if(!cur){cur=[];if(q&&p[0]-q[0]<=8)cur.push([q[0]+(p[0]-q[0])*(thr-q[1])/(p[1]-q[1]),thr])}cur.push(p)}
    else if(cur){cur.push([q[0]+(p[0]-q[0])*(thr-q[1])/(p[1]-q[1]),thr]);out.push(cur);cur=null}}
  if(cur)out.push(cur);return out}
function alarmMarks(pts,limits,Y,h,fmtV){let g='';const labs=[];
  limits.forEach(([thr,dir])=>{const yt=Y(thr);if(yt<1||yt>h-1)return;
    g+=`<line class="thr2" x1="0" x2="${W}" y1="${f(yt)}" y2="${f(yt)}"/><text class="gt" x="${W-4}" y="${f(dir<0?yt-2:yt+9)}" text-anchor="end">${thr}</text>`;
    excur(pts,thr,dir).forEach(e=>{const a=X(e[0][0]),b=X(e[e.length-1][0]);if(b<0||a>W)return;const line=e.map(p=>f(X(p[0]))+' '+f(Y(p[1]))).join('L');
      g+=`<path class="exf" d="M${line}L${f(b)} ${f(yt)}L${f(a)} ${f(yt)}Z"/><path class="exl" d="M${line}"/>`;
      const w=e.reduce((m,p)=>dir<0?(p[1]<m[1]?p:m):(p[1]>m[1]?p:m));if(w[1]!==thr)labs.push({x:X(w[0]),y:Y(w[1]),dir,txt:fmtV(w),sev:Math.abs(Y(w[1])-yt)})})});
  const put=[];labs.sort((a,b)=>b.sev-a.sev).forEach(l=>{if(l.x<4||l.x>W-4||put.some(q=>Math.abs(q.x-l.x)<40))return;put.push(l);
    const ty=l.dir<0?(l.y+12<h-1?l.y+12:l.y-5):(l.y-5>9?l.y-5:l.y+12);g+=`<text class="exv" x="${f(Math.min(Math.max(l.x,14),W-14))}" y="${f(ty)}" text-anchor="middle">${l.txt}</text>`});
  return g}

/* one quiet line per row, value at the cursor in the label column */
function graphRow(s,h=40,dots=true,alarm=false){
  const vs=s.pts.map(p=>p[1]).concat(hPts(s.key).map(o=>o.v));let lo=Math.min(...vs),hi=Math.max(...vs);if(hi-lo<1e-9){hi+=1;lo-=1}
  const pad=(hi-lo)*.18;lo-=pad;hi+=pad;const top=5,bot=5,Y=v=>top+(hi-v)/(hi-lo)*(h-top-bot);let g='';
  if(s.lo!=null){const y1=Math.max(Y(s.hi),0),y2=Math.min(Y(s.lo),h);if(y2>y1)g+=`<rect class="ref" x="0" width="${W}" y="${f(y1)}" height="${f(y2-y1)}"/>`}
  const vis=s.pts.filter(p=>p[0]>=d0-30&&p[0]<=d1+30);
  if(vis.length>1)g+=`<path class="ln" d="M${vis.map(p=>f(X(p[0]))+' '+f(Y(p[1]))).join('L')}"/>`;
  if(dots)vis.forEach(p=>g+=`<circle class="dot" cx="${f(X(p[0]))}" cy="${f(Y(p[1]))}" r="2.6"/>`);
  if(alarm&&s.lo!=null)g+=alarmMarks(vis,[[s.lo,-1],[s.hi,1]],Y,h,p=>p[1].toFixed(s.dec));
  const k=s.key+'#'+(uid++);
  g+=`<circle class="cd" data-cd="${k}" r="4" cx="-20" cy="0" style="display:none"/>`;
  RO[k]=t=>{const p=latest(s.pts,t);return p?`<span class="${isOut(s,p[1])?'ab':''}">${p[1].toFixed(s.dec)}</span>`:''};
  CD[k]=t=>{const p=latest(s.pts,t);return p?[X(p[0]),Y(p[1])]:null};
  return row(g,h,lab(s.label,s.unit==='derived'?'':s.unit,`<span class="rv" data-ro="${k}"></span>`),'',PREW?hLabGraph(s,Y):'')}

/* a square on a row: something given, done or resulted */
const sq=(x,y,cls='',z=9)=>`<rect class="dose ${cls}" x="${f(x-z/2)}" y="${f(y-z/2)}" width="${f(z)}" height="${f(z)}"/>`;

function eventsRow(items,name,kind){
  const narrow=W<520,lvH=20,ends=[-1e9,-1e9];let g='';
  items.filter(e=>e.t>=d0&&e.t<=d1).forEach(e=>{
    const x=X(e.t);let lb=narrow?'':e.short;let w=12+(lb?tw(lb)+8:0);
    let lv=ends.findIndex(v=>v<x-8);
    if(lv<0){if(ends.length<6){ends.push(-1e9);lv=ends.length-1}else{lb='';w=12;lv=ends.indexOf(Math.min(...ends))}}
    const left=lb&&x+w>W-2;const y=13+lv*lvH;ends[lv]=left?x+8:x+w-2;
    const cls=e.res?(e.res==='pos'?'pos':'neg'):(e.pending?'open':'');
    g+=`<g class="ev${state.sel===e.id?' sel':''}" data-ev="${e.id}" data-card="${e.id}" tabindex="0" role="button" aria-label="${esc(e.title+', '+stamp(e.t))}"><rect class="hit" x="${f(left?x-w+4:x-8)}" y="${y-10}" width="${f(w+4)}" height="20"/>${sq(x,y,cls)}${e.res==='pos'?`<path d="M${f(x-2.4)} ${y}h4.8M${f(x)} ${y-2.4}v4.8" stroke="#fff" stroke-width="1.5"/>`:''}${lb?`<text class="el" x="${f(left?x-9:x+9)}" y="${y+4.2}" text-anchor="${left?'end':'start'}">${esc(lb)}</text>`:''}</g>`});
  return row(g,8+ends.length*lvH,lab(name),'',kind?hEv([kind]):'')}

/* cultures: square at collection, line to the result time, result text at the end */
function microRow(name,kind){const narrow=W<520,lvH=22,ends=[-1e9,-1e9];let g='';
  MICRO.filter(e=>e.kind===kind&&(e.resT??NOW)>=d0&&e.t<=d1).forEach(e=>{
    const x=X(e.t),xr=X(e.resT??NOW),txt=narrow?'':e.short+(kind==='test'&&e.st==='neg'?'':' · '+e.rshort)+(e.firstNeg?' · first negative':''),lw=txt?tw(txt)+8:0;
    const left=txt&&xr+8+lw>W-2,a=left?x-10-lw:x-8,b=left?xr+8:xr+8+lw;
    let lv=ends.findIndex(v=>v<a-4);if(lv<0){ends.push(-1e9);lv=ends.length-1}
    ends[lv]=b;const y=13+lv*lvH;
    g+=`<g class="ev${state.sel===e.id?' sel':''}" data-ev="${e.id}" data-card="${e.id}" tabindex="0" role="button" aria-label="${esc(e.title+', '+stamp(e.t))}"><rect class="hit" x="${f(a)}" y="${y-10}" width="${f(b-a)}" height="20"/><line class="ml ${e.st}" x1="${f(x)}" x2="${f(xr)}" y1="${y}" y2="${y}"/>${e.resT?`<rect class="mr ${e.st}" x="${f(xr-1.5)}" y="${y-5}" width="3" height="10"/>`:''}${sq(x,y,e.st)}${e.st==='pos'?`<path d="M${f(x-2.4)} ${y}h4.8M${f(x)} ${y-2.4}v4.8" stroke="#fff" stroke-width="1.5"/>`:''}${txt?`<text class="el ${e.st}" x="${f(left?x-9:xr+7)}" y="${y+4.2}" text-anchor="${left?'end':'start'}">${esc(txt)}</text>`:''}</g>`});
  return row(g,8+ends.length*lvH,lab(name))}
const MKEY='<span style="display:inline-flex;align-items:center;gap:5px"><svg width="10" height="10"><rect width="10" height="10" fill="var(--crit)"/></svg>positive</span><span style="display:inline-flex;align-items:center;gap:5px"><svg width="10" height="10"><rect x="1" y="1" width="8" height="8" fill="var(--surface)" stroke="var(--dc)" stroke-width="1.6"/></svg>negative</span><span style="display:inline-flex;align-items:center;gap:5px"><svg width="10" height="10"><rect x="1" y="1" width="8" height="8" fill="var(--surface)" stroke="var(--dc)" stroke-width="1.6" stroke-dasharray="2 2"/></svg>pending</span><span>line runs from collection to result</span>';
const NGRP=[['primary','Primary team'],['consult','Consultants'],['proc','Procedure reports']];
function laneNotes(){return NGRP.map(([k,n])=>eventsRow(NOTES.filter(x=>x.grp===k).map(x=>({...EV[x.id],short:x.fu?'':x.lab})),n,k==='primary'?'notes':null)).join('')}

/* ---------- sections ---------- */
function laneLocation(){let g='';const h=30;
  LOC.forEach(sg=>{const a=X(sg.s),b=X(sg.e),w=Math.max(b-a-1,1),va=Math.max(a,0),vw=Math.min(b,W)-va,t=CARE[sg.kind];
    g+=`<rect x="${f(a)}" y="7" width="${f(w)}" height="16" fill="var(--care-${sg.kind})" data-tip="${esc(t+'|'+sg.unit+' · '+sg.team+'|'+stamp(sg.s)+' to '+(sg.e>=NOW?'now':stamp(sg.e))+' ('+dur(sg.e-sg.s)+')')}"/>`;
    if(tw(t,11)+12<vw)g+=`<text class="seglab" x="${f(va+6)}" y="19" fill="var(--care-${sg.kind}-ink)">${t}</text>`});
  return row(g,h,lab('ICU, floor or ED'),'',hEv(['enc'],15))}

function laneConsults(){let rows='';
  CONSULTS.forEach(c=>{const h=30,y=16,e=c.e??NOW,a=X(c.s),b=X(e);let g='';
    g+=`<rect class="ord" x="${f(a)}" y="${y-4}" width="${f(Math.max(b-a,2))}" height="8"/>`;
    if(c.e)g+=`<rect class="dc" x="${f(b-1.5)}" y="${y-11}" width="3" height="22"/>`;
    g+=sq(X(c.init),y);
    g=`<g class="ev${state.sel===c.id?' sel':''}" data-ev="${c.id}" data-card="${c.id}" tabindex="0" role="button" aria-label="${esc(c.svc+' consult')}"><rect class="hit" x="${f(a-6)}" y="2" width="${f(Math.max(b-a,2)+12)}" height="${h-4}"/>${g}</g>`;
    rows+=row(g,h,lab(c.svc))});
  return rows}

const VIT=['HR','NIBP','ABP','MAP','Temp','SpO2','RR'];
/* blood pressure: systolic and diastolic as one band; cuff and arterial line are separate rows on the same scale */
const BPX=(()=>{const a=[...BP.NIBP.pts,...BP.ABP.pts];return[Math.min(...a.map(p=>p[2]))-4,Math.max(...a.map(p=>p[1]))+4]})();
function bpRow(b){if(!b.pts.some(p=>p[0]>=d0&&p[0]<=d1))return'';
  const k=b.key+'#'+(uid++),read=`<span class="rv" data-ro="${k}"></span>`;
  RO[k]=t=>{const p=latest(b.pts,t);return p&&t-p[0]<12?`<span class="${p[1]<90?'ab':''}">${p[1]}/${p[2]}</span>`:''};
  if(state.mode.vitals==='num'&&W/((d1-d0)/BIN)>=58){const h=28;let g='';
    for(let c=Math.floor(d0/BIN)*BIN;c<d1;c+=BIN){const v=b.pts.filter(p=>p[0]>=c&&p[0]<c+BIN);if(!v.length)continue;const a=Math.max(X(c),0),e=Math.min(X(c+BIN),W);if(e-a<40)continue;
      const lo=v.reduce((m,p)=>p[1]<m[1]?p:m),la=v[v.length-1];
      g+=`<g data-tip="${esc(b.label+'|Lowest systolic '+lo[1]+'/'+lo[2]+' at '+stamp(lo[0])+'|Last '+la[1]+'/'+la[2]+' at '+stamp(la[0])+'|'+v.length+' readings')}"><rect class="hit" x="${f(a)}" y="0" width="${f(e-a)}" height="${h}"/><text class="cv${lo[1]<90?' ab':''}" x="${f((a+e)/2)}" y="${h/2+4.2}">${lo[1]}/${lo[2]}</text></g>`}
    return row(g,h,lab(b.label,'lowest',read))}
  const h=50,Y=v=>5+(BPX[1]-v)/(BPX[1]-BPX[0])*(h-10),vis=b.pts.filter(p=>p[0]>=d0-30&&p[0]<=d1+30),runs=[];
  vis.forEach(p=>{const l=runs[runs.length-1];if(l&&p[0]-l[l.length-1][0]<=8)l.push(p);else runs.push([p])});
  let g='';
  runs.forEach(r=>{if(r.length<2)return;const up=r.map(p=>f(X(p[0]))+' '+f(Y(p[1]))),dn=r.map(p=>f(X(p[0]))+' '+f(Y(p[2]))).reverse();
    g+=`<path class="dfill" d="M${up.join('L')}L${dn.join('L')}Z"/><path class="ln" style="stroke-width:1.3" d="M${up.join('L')}"/><path class="ln" style="stroke-width:1.3" d="M${dn.reverse().join('L')}"/>`});
  g+=alarmMarks(vis,[[90,-1]],Y,h,p=>p[1]+'/'+p[2]);
  return row(g,h,lab(b.label,b.unit,read))}
function laneVitals(){const ks=VIT.filter(k=>shown('vit:'+k));if(!ks.length)return empty('All rows are hidden. Use the row picker to bring them back.');
  return ks.map(k=>BP[k]?bpRow(BP[k]):state.mode.vitals==='num'?cellsRow(S[k],'range'):graphRow(S[k],50,false,true)).join('')}
const empty=t=>`<div class="row" style="height:32px"><div style="width:${W+PREW}px;flex:none;display:flex;align-items:center;padding:0 12px;font-size:12px;color:var(--ink-3)">${t}</div><div class="g"></div></div>`;

/* infusions: stepped rate line over a light fill; hover a step for the rate */
function dripRow(r){const h=40,base=34,mx=18,Y=v=>base-4-(v/r.max)*mx;let g='';
  const runs=[];r.segs.forEach(sg=>{const l=runs[runs.length-1];if(l&&Math.abs(l[l.length-1].e-sg.s)<1e-6)l.push(sg);else runs.push([sg])});
  runs.forEach(run=>{const x0=X(run[0].s),x1=X(run[run.length-1].e);if(x1<0||x0>W)return;
    let area=`M${f(x0)} ${base}`,top='';
    run.forEach((sg,i)=>{area+=`V${f(Y(sg.v))}H${f(X(sg.e))}`;top+=`${i?'L':'M'}${f(X(sg.s))} ${f(Y(sg.v))}H${f(X(sg.e))}`});
    g+=`<path class="dfill" d="${area}V${base}Z"/><path class="dline" d="${top}"/>`;
    const y0=Y(run[0].v);g+=`<path class="dflag" d="M${f(x0)} ${f(y0-4.5)}l7 4.5-7 4.5z"/>`;
    const ye=Y(run[run.length-1].v);g+=`<path class="dx" d="M${f(x1-3.5)} ${f(ye-3.5)}l7 7M${f(x1+3.5)} ${f(ye-3.5)}l-7 7"/>`;
    const peak=run.reduce((a,b)=>b.v>a.v?b:a);
    const all=run.every(sg=>X(sg.e)-X(sg.s)>=tw(sg.v.toFixed(r.dec),11)+14);
    if(all)run.forEach(sg=>{g+=`<text class="dlab" x="${f((X(sg.s)+X(sg.e))/2)}" y="${f(Y(sg.v)-4)}" text-anchor="middle">${sg.v.toFixed(r.dec)}</text>`});
    else{const txt=peak.v.toFixed(r.dec),cx=Math.min(Math.max((X(peak.s)+X(peak.e))/2,tw(txt,11)/2+2),W-tw(txt,11)/2-2);g+=`<text class="dlab" x="${f(cx)}" y="${f(Y(peak.v)-4)}" text-anchor="middle">${txt}</text>`}
    run.forEach(sg=>g+=`<rect class="hit" x="${f(X(sg.s))}" y="0" width="${f(Math.max(X(sg.e)-X(sg.s),3))}" height="${h}" data-tip="${esc(r.label+'|'+sg.v.toFixed(r.dec)+' '+r.unit+'|'+stamp(sg.s)+' to '+stamp(sg.e)+' ('+dur(sg.e-sg.s)+')')}"/>`)});
  const k=r.key+'#'+(uid++);RO[k]=t=>{const sg=r.segs.find(s=>t>=s.s&&t<s.e);return sg?sg.v.toFixed(r.dec):''};
  return row(g,h,lab(r.label,r.unit,`<span class="rv" data-ro="${k}"></span>`))}
const inView=r=>r.segs.some(s=>s.e>d0&&s.s<d1);
function laneSupport(){const rs=DRIPS.filter(r=>shown('drip:'+r.key));if(!rs.length)return empty('All rows are hidden. Use the row picker to bring them back.');const v=rs.filter(inView);return v.length?v.map(dripRow).join(''):empty('No infusions running in this window.')}

function laneResp(){const rs=RESPROWS.filter(r=>shown('resp:'+r.key));if(!rs.length)return empty('All rows are hidden. Use the row picker to bring them back.');
  const v=rs.filter(inView);if(!v.length)return empty('Room air in this window.');
  return v.map(r=>{const h=30;let g='';
    r.segs.forEach(sg=>{const a=X(sg.s),b=X(sg.e),w=Math.max(b-a-1,1),va=Math.max(a,0),vw=Math.min(b,W)-va;
      g+=`<rect class="dfill" x="${f(a)}" y="7" width="${f(w)}" height="16" data-tip="${esc(r.label+'|'+sg.t+(r.unit?' '+r.unit:'')+'|'+stamp(sg.s)+' to '+stamp(sg.e)+' ('+dur(sg.e-sg.s)+')')}"/>`;
      if(tw(sg.t,11)+10<vw)g+=`<text class="seglab" x="${f(va+5)}" y="19" fill="var(--ink)" style="font-weight:400">${esc(sg.t)}</text>`});
    return row(g,h,lab(r.label,r.unit||''))}).join('')}
/* no device in this patient: show the rows the section carries so the layout can be judged */
function laneMcs(){return empty('No mechanical circulatory support this encounter. With a device, these rows fill in.')+['Device and mode','Flow, L/min','Speed or P-level','Sweep gas and FiO₂','IABP ratio'].map(n=>row('',26,lab(n),'ghost')).join('')}

function labKeys(){const out=[];state.labs.forEach(gk=>LABGROUPS[gk].keys.forEach(k=>{if(!out.includes(k))out.push(k)}));return out}
const labChips=()=>Object.keys(LABGROUPS).map(k=>{const nd=LABGROUPS[k].needs;return `<button class="chip" data-lab="${k}" aria-pressed="${state.labs.includes(k)}"${nd?` title="Also turns on ${nd.map(n=>LABGROUPS[n].name).join(', ')}, which holds some of its inputs"`:''}>${LABGROUPS[k].name}${nd&&!state.labs.includes(k)?`<span style="opacity:.65;font-weight:400"> + ${nd.map(n=>LABGROUPS[n].name.toLowerCase()).join(', ')}</span>`:''}</button>`}).join('');
function laneLabs(){const ks=labKeys();if(!ks.length)return empty('Choose a lab grouping on the left of the section bar.');
  return ks.map(k=>state.mode.labs==='num'?cellsRow(S[k]):graphRow(S[k],38)).join('')}

/* transfusion response: one small chart, time on the x axis. Shaded = unit running; points = the counts before and after. */
function txChart(e){const isP=!!e.plt,units=isP?[e.plt]:e.ep.units,s=isP?S.Plt:S.Hgb,dec=isP?0:1,un=isP?'K/µL':'g/dL';
  const pre=isP?[...s.pts].reverse().find(p=>p[0]<units[0].t):e.ep.pre,post=isP?s.pts.find(p=>p[0]>units[units.length-1].end):e.ep.post;
  const pts=s.pts.filter(p=>p[0]>=pre[0]-1e-6&&p[0]<=post[0]+1e-6),t0=pre[0],t1=post[0],n=units.length,d=post[1]-pre[1];
  const w=360,h=132,L=28,R=28,top=34,base=94,x=t=>L+(t-t0)/(t1-t0)*(w-L-R);
  const vs=pts.map(p=>p[1]),lo=Math.min(...vs),hi=Math.max(...vs),y=v=>base-12-(v-lo)/((hi-lo)||1)*(base-top-22);
  let g=`<text class="tc-k" x="0" y="10">${isP?'Platelets':'Hemoglobin'}, ${un}</text><text class="tc-k" x="${w}" y="10" text-anchor="end">shaded: unit running</text><line x1="0" x2="${w}" y1="${base}" y2="${base}" stroke="var(--rowline)"/>`;
  units.forEach((u,i)=>{const a=x(u.t),b=Math.max(x(u.end),a+3);
    g+=`<rect x="${f(a)}" y="${top-14}" width="${f(b-a)}" height="${base-top+14}" fill="var(--fill)"/><line x1="${f(a)}" x2="${f(a)}" y1="${top-14}" y2="${base}" stroke="var(--mk)" stroke-width="1.5"/>${n>1?`<text class="tc-u" x="${f(a+4)}" y="${top-3}">${i+1}</text>`:''}<text class="tc-u" x="${f(a)}" y="${base+26}" text-anchor="middle">${clock(u.t)}</text>`});
  g+=`<path d="M${pts.map(p=>f(x(p[0]))+' '+f(y(p[1]))).join('L')}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
  pts.forEach((p,i)=>{const ends=i===0||i===pts.length-1;g+=`<circle cx="${f(x(p[0]))}" cy="${f(y(p[1]))}" r="${ends?4.5:3}" fill="var(--ink)" stroke="var(--surface)" stroke-width="1.5"/><text class="tc-v" x="${f(x(p[0]))}" y="${f(y(p[1])-9)}" text-anchor="middle">${p[1].toFixed(dec)}</text>${ends?`<text class="tc-t" x="${f(x(p[0]))}" y="${base+13}" text-anchor="middle">${clock(p[0])}</text>`:''}`});
  g+=`<text class="tc-u" x="0" y="${base+26}">started</text>`;
  const head=isP?`<b>${d>=0?'+':''}${d.toFixed(0)} K/µL</b> after 1 unit`:`<b>${d>=0?'+':''}${d.toFixed(1)} g/dL</b> after ${n} unit${n>1?'s':''}, ${(d/n).toFixed(2)} per unit${e.ep.low?'. Below the 1 g/dL usually expected':''}`;
  return `<div class="txh">${head}</div><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="max-width:100%;height:auto;display:block">${g}</svg>`}

function laneTx(){let rows='';const s=S.Hgb;
  if(state.mode.blood==='num')rows+=cellsRow(s);
  else{const h=70,top=14,bot=12,lo=6,hi=Math.max(9.2,...hPts('Hgb').map(o=>o.v+.4)),Y=v=>top+(hi-v)/(hi-lo)*(h-top-bot);let g='';
    EPIS.forEach(ep=>g+=`<rect class="dfill" x="${f(X(ep.s))}" y="0" width="${f(Math.max(X(ep.e)-X(ep.s),3))}" height="${h}"/>`);
    g+=`<line class="thr" x1="0" x2="${W}" y1="${f(Y(7))}" y2="${f(Y(7))}"/><text class="gt" x="${W-4}" y="${f(Y(7)+11)}" text-anchor="end">7</text>`;
    const vis=s.pts.filter(p=>p[0]>=d0-30&&p[0]<=d1+30);
    g+=`<path class="ln" style="stroke-width:1.8" d="M${vis.map(p=>f(X(p[0]))+' '+f(Y(p[1]))).join('L')}"/>`;
    vis.forEach(p=>g+=`<circle class="dot" cx="${f(X(p[0]))}" cy="${f(Y(p[1]))}" r="3"/>`);
    EPIS.forEach(ep=>{g+=`<g class="epfx${state.sel===ep.id?' on':''}" data-ep="${ep.id}">`;
      [[ep.pre,'end'],[ep.post,'start']].forEach(([p,anc])=>{const x=X(p[0]),y=Y(p[1]),flip=(anc==='end'&&x<30)||(anc==='start'&&x>W-30);
        g+=`<circle cx="${f(x)}" cy="${f(y)}" r="4.8" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><text class="epv" x="${f(flip?x:x+(anc==='end'?-8:8))}" y="${f(flip?y-9:y+4.3)}" text-anchor="${flip?'middle':anc}">${p[1].toFixed(1)}</text>`});
      g+='</g>'});
    const k='Hgb#'+(uid++);g+=`<circle class="cd" data-cd="${k}" r="4.4" cx="-20" cy="0" style="display:none"/>`;
    RO[k]=t=>{const p=latest(s.pts,t);return p?`<span class="ab">${p[1].toFixed(1)}</span>`:''};CD[k]=t=>{const p=latest(s.pts,t);return p?[X(p[0]),Y(p[1])]:null};
    rows+=row(g,h,lab('Hemoglobin','g/dL',`<span class="rv" data-ro="${k}"></span>`),'',PREW?hLabGraph(s,Y):'')}
  const unitRow=(items,name)=>{const h=34,y=22;let g='';
    items.forEach((it,i)=>{const x=X(it.t);if(x<-8||x>W+8)return;const nx=items[i+1]?X(items[i+1].t):1e9,px=i?X(items[i-1].t):-1e9;
      const txt=String(it.n);let tx=x,anc='middle',ty=y-8;
      if(nx-x<16){tx=x-7;anc='end';ty=y+4}else if(x-px<16){tx=x+7;anc='start';ty=y+4}
      g+=`<g class="ev${state.sel===it.id?' sel':''}" data-ev="${it.id}" data-card="${it.id}" tabindex="0" role="button" aria-label="${esc(name+' '+stamp(it.t))}"><rect class="hit" x="${f(x-11)}" y="2" width="22" height="${h-4}"/>${sq(x,y)}<text class="dlab" x="${f(tx)}" y="${ty}" text-anchor="${anc}">${txt}</text></g>`});
    return row(g,h,lab(name,'units'))};
  rows+=unitRow(EPIS.map(ep=>({id:ep.id,t:ep.s,n:ep.n})),'Red blood cells');
  rows+=unitRow(TX.filter(u=>u.prod!=='pRBC').map(u=>({id:u.id,t:u.t,n:1})),'Platelets');
  return rows}

/* medication row: grey bar while the order is active, a square per dose given */
function medRow(m,right='',plain=false){const h=34,y=22;let g='';
  const end=m.segs.length?Math.min(m.segs[m.segs.length-1].e??NOW,NOW):null;
  if(m.segs.length)g+=`${m.role?`<rect class="hit ev" data-ev="rx:${m.id}" data-card="rx:${m.id}" x="${f(X(m.segs[0].s))}" y="2" width="${f(Math.max(X(end)-X(m.segs[0].s),1))}" height="${h-4}"/>`:''}<rect class="ord" style="pointer-events:none" x="${f(X(m.segs[0].s))}" y="${y-4}" width="${f(Math.max(X(end)-X(m.segs[0].s),1))}" height="8"/>`;
  if(m.plan&&X(NOW)<W)g+=`<rect class="plan" x="${f(X(NOW)+1)}" y="${y-3.5}" width="${f(Math.max(X(Math.min(m.plan,END+48))-X(NOW)-1,2))}" height="7" data-tip="${esc(m.name+'|Planned stop '+stamp(m.plan)+' ('+md(m.plan)+')')}"/>`;
  if(m.segs.length&&m.segs[m.segs.length-1].e!=null)g+=`<rect class="dc" x="${f(X(end)-1.5)}" y="${y-12}" width="3" height="24" data-tip="${esc(m.name+' discontinued|'+stamp(end))}"/>`;
  const xs=m.adm.map(X);let gap=1e9;for(let i=1;i<xs.length;i++)gap=Math.min(gap,xs[i]-xs[i-1]);
  let prev=null,seen=false;const z=gap<11?Math.max(4,gap-2):9;
  m.adm.forEach((t,i)=>{const x=xs[i];if(x<-6||x>W+6)return;const amt=m.amts?m.amts[i]:m.amt,txt=String(amt);
    const show=!plain&&(gap>=Math.max(44,tw(txt,11)+12)||!seen||amt!==prev);seen=true;prev=amt;
    g+=`<g data-tip="${esc(m.name+'|'+amt+' '+m.u+(m.rt?' '+m.rt:'')+(m.prn?' · PRN dose':' · scheduled dose')+'|Given '+stamp(t))}"><rect class="hit" x="${f(x-Math.min(7,Math.max(gap/2,3)))}" y="2" width="${f(Math.min(14,Math.max(gap,6)))}" height="${h-4}"/>${sq(x,y,'',z)}${show?`<text class="dlab" x="${f(x)}" y="${y-8}" text-anchor="middle">${txt}</text>`:''}</g>`});
  m.heldAdm.forEach(t=>{const x=X(t);if(x<-6||x>W+6)return;g+=`<g data-tip="${esc(m.name+'|Dose held: '+(m.held[0].why||'held')+'|Due '+stamp(t))}"><rect class="hit" x="${f(x-7)}" y="2" width="14" height="${h-4}"/>${sq(x,y,'open',Math.max(z,6))}</g>`});
  const sig=m.segs.length&&m.segs[m.segs.length-1].d||m.dose,last=m.segs[m.segs.length-1];
  const hist=m.segs.length>1&&m.segs.some(x=>x.d)?m.segs.map(x=>(x.d||m.dose)+': '+stamp(x.s)+' to '+(x.e?stamp(x.e):'now')):[m.segs.length?stamp(m.segs[0].s)+' to '+(last.e?stamp(last.e):'now'):'No standing schedule'];
  const tipL=[m.name,sig+(m.prn?'':' · scheduled'),...hist,m.adm.length+' dose'+(m.adm.length===1?'':'s')+' given'+(m.heldAdm.length?', '+m.heldAdm.length+' held':'')].join('|');
  return row(g,h,`<i class="grip"></i><span class="lb" data-tip="${esc(tipL)}">${m.name}</span>${m.prn?'<span class="tag prn" title="Given as needed">PRN</span>':''}<span class="un" data-tip="${esc(tipL)}">${sig}</span>${right}`)}
/* medications are grouped; the grouping can be switched and each group hidden */
const MGROUP={type:['Type',m=>m.type],route:['Route',m=>m.route],sched:['Scheduled or PRN',m=>m.prn?'PRN, as needed':'Scheduled'],status:['Status',m=>m.on||m.prn?'Active':'Stopped']};
function medGroups(){const fn=MGROUP[state.medGroup][1],out=[];MEDS.forEach(m=>{const k=fn(m);let g=out.find(x=>x.k===k);if(!g)out.push(g={k,list:[]});g.list.push(m)});return out}
const medChips=()=>'<span>Group by</span>'+Object.keys(MGROUP).map(k=>`<button class="chip" data-mgroup="${k}" aria-pressed="${state.medGroup===k}">${MGROUP[k][0]}</button>`).join('');
function laneMeds(){let rows='';
  medGroups().forEach(g=>{const list=g.list.filter(m=>shown('med:'+m.id)),key=state.medGroup+':'+g.k,closed=state.gclosed.has(key);if(!closed&&!list.length)return;
    rows+=`<div class="subh"><i></i><b><button class="gbtn${closed?' closed':''}" data-gcol="${esc(key)}" aria-expanded="${!closed}" title="${closed?'Show':'Hide'} this group">${I.chev}<span>${esc(g.k)}</span></button><span class="gn">${closed?g.list.length+' hidden':list.length}</span></b></div>`;
    if(!closed)rows+=list.map(m=>medRow(m)).join('')});
  const hv=homeVisible();
  if(hv.length){const closed=state.gclosed.has('home');rows+=`<div class="subh"><i></i><b><button class="gbtn${closed?' closed':''}" data-gcol="home" aria-expanded="${!closed}">${I.chev}<span>Before admission, dispense history</span></button><span class="gn">${closed?hv.length+' hidden':hv.length}</span></b></div>`;if(!closed)rows+=hv.map(m=>homeRow(m)).join('')}
  return rows}

const LANES={
  location:{title:'Level of care',render:laneLocation},
  consults:{title:'Consults',render:laneConsults},
  vitals:{title:'Vitals',mode:'vitals',left:()=>state.mode.vitals==='num'?'':'<span style="display:inline-flex;align-items:center;gap:6px"><svg width="22" height="12"><path d="M0 2L7 10L15 9L22 2Z" fill="var(--sR-bg)"/><path d="M0 2L7 10L15 9L22 2" fill="none" stroke="var(--sR)" stroke-width="1.8"/></svg>Outside the limit line. The red number is the worst value in that stretch.</span>',rows:()=>VIT.map(k=>({key:'vit:'+k,label:(S[k]||BP[k]).label})),render:laneVitals},
  support:{title:'IV Drips',pink:1,rows:()=>DRIPS.map(r=>({key:'drip:'+r.key,label:r.label})),render:laneSupport},
  resp:{title:'Vent and oxygen',pink:1,rows:()=>RESPROWS.map(r=>({key:'resp:'+r.key,label:r.label})),render:laneResp},
  mcs:{title:'Circulatory support',pink:1,render:laneMcs},
  labs:{title:'Labs',mode:'labs',left:labChips,render:laneLabs},
  transfusion:{title:'Transfusions',mode:'blood',render:laneTx},
  meds:{title:'Medications',left:medChips,rows:()=>medGroups().flatMap(g=>g.list.map(m=>({key:'med:'+m.id,label:m.name,grp:g.k}))),render:laneMeds},
  micro:{title:'Microbiology',left:()=>MKEY,render:()=>microRow('Cultures','cx')+microRow('PCR, antigen, serology','test')},
  imaging:{title:'Imaging',render:()=>eventsRow(IMAGING,'Studies','imaging')},
  procedures:{title:'Procedures',render:()=>eventsRow(PROCS,'Procedures and lines','procedures')},
  notes:{title:'Notes',render:laneNotes},
};
const ORDER=Object.keys(LANES);

function renderLanes(){let h=backdrop();
  state.lanes.forEach(k=>{const L=LANES[k],closed=state.closed.has(k);
    h+=`<section class="lane${closed?' closed':''}">${head(k,L.title,{pink:L.pink,mode:L.mode,rows:L.rows&&L.rows(),left:L.left&&!closed?L.left():''})}${closed?'':L.render()}</section>`});
  if(!state.lanes.length)h+=empty('No sections selected. Add some from the Sections menu.');
  h+='<div class="xhair" hidden></div>';$('#lanes').innerHTML=h}

/* ---------- specialty modules ---------- */
const stat=(k,v,sm,n)=>`<div class="stat"><div class="eyebrow">${k}</div><div class="v">${v}${sm?`<small>${sm}</small>`:''}</div><div class="n">${n}</div></div>`;
const STI={flag:['Flagged','<path d="M6 1.5 11 10.5H1z" fill="currentColor"/>'],part:['Partly excluded','<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="currentColor"/>'],neg:['Excluded','<path d="M2 6.5 5 9.5l5-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'],pend:['Pending','<circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 3.5V6l2 1.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'],none:['Not sent','<path d="M2.5 6h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>']};
function candExposure(c){if(c.home){const m=HOME.find(x=>x.id===c.home);return{first:m.fills[0]*24+20,last:(m.fills[0]+m.supply)*24,on:false,n:0,home:m}}
  if(c.med){const m=MEDS.find(x=>x.id===c.med);return{first:m.first,last:m.last,on:m.on,n:m.adm.length,m}}
  const d=SUPPORT.find(x=>x.key===c.drip);return{first:d.segs[0].s,last:d.segs[d.segs.length-1].e,on:false,d}}

const grade=s=>'g'+('ABCDE'.includes(s[0])?s[0]:'X');
const CORD={flag:0,part:1,pend:2,none:3,neg:4};
function specDili(){
  const n=A.ALT.length-1,io=S.ALP.pts.findIndex(p=>p[0]===ONSET),rNow=Rat(n),rOn=Rat(io),r6=Rat(5);
  const CL_=candList(),before=CL_.filter(c=>candExposure(c).first<ONSET).length,si=SCOPES.findIndex(x=>x[0]===state.scope),fx=state.fetching,np=hPts('ALP').length;
  let h=`<div class="stats">${stat('Pattern now',pattern(rNow),'R '+rNow.toFixed(1),`R was ${rOn.toFixed(1)} at onset and ${r6.toFixed(1)} at the HD6 aminotransferase peak (${pattern(r6).toLowerCase()}).`)}${stat('Onset','HD'+hd(ONSET),'ALP ≥ 2× ULN',`ALP ${A.ALP[io]} U/L at ${stamp(ONSET)}. It is ${A.ALP[n]} today and has risen every day since HD6.`)}${stat('Bilirubin',A.Tbili[n].toFixed(1),'mg/dL',`Up from ${A.Tbili[0]} on admission, when it was already abnormal from cirrhosis. INR ${A.INR[n].toFixed(1)}, albumin ${A.Alb[n].toFixed(1)}, MELD 3.0 ${S.MELD.pts[n][1]}.`)}${stat('Agents before onset',before,'of '+CL_.length+' listed',amxOn()?'Includes an outpatient amoxicillin-clavulanate course (LiverTox A) that ended '+dur(ONSET-candExposure(AMX).last)+' before onset. Two inpatient agents carry category B.':'Two carry LiverTox category B with a compatible pattern: ceftriaxone and piperacillin-tazobactam.')}</div>`;
  h+=`<div class="reqrow">${si<2?`<span class="st part">${WARNI}Short lookback</span><span>${si===0?'Only this encounter is loaded.':'Only the 30 days before admission are loaded.'} Liver injury can begin weeks after a drug is stopped, so earlier outpatient prescriptions and the baseline trend are not being checked.</span><button class="btn" data-scope="6m"${fx?' disabled':''}>Fetch 6 months</button>`:`<span class="st neg">${OKI}History loaded</span><span>Back to ${mdy(-HL)}: ${np} earlier liver panel${np===1?'':'s'} and ${homeVisible().length} outpatient prescriptions from dispense history.${amxOn()?' One is a new candidate: amoxicillin-clavulanate.':''}</span>${si<SCOPES.length-1?`<button class="btn" data-scope="${SCOPES[si+1][0]}"${fx?' disabled':''}>Fetch ${SCOPES[si+1][1].toLowerCase()}</button>`:''}`}${fx?`<span class="hint">${esc(fx.label)}</span>`:''}</div>`;
  // other causes come first
  h+=`<div class="pane"><h3>Other causes to rule out first <span class="hint" style="font-weight:400">Filled in from the same timeline: flowsheets, imaging, cultures and results.</span></h3><ul class="ccs">${[...COMPETE].sort((a,b)=>CORD[a.st]-CORD[b.st]).map(c=>{const s=STI[c.st];return `<li class="cc ${c.st}"><span class="st ${c.st}"><svg width="12" height="12" viewBox="0 0 12 12">${s[1]}</svg>${s[0]}</span><b>${c.t}</b><span>${c.d}</span></li>`}).join('')}</ul></div>`;
  const ax=axisInner(true);let rows=row(ax.s,ax.h,'','',histAxis(ax.h,true));
  const H=176,top=10,bot=10,lo=Math.log(0.6),hi=Math.log(10),Y=v=>top+(hi-Math.log(v))/(hi-lo)*(H-top-bot);let g='';
  [1,2,5,10].forEach(v=>{g+=`<line class="${v===1?'thr':'gl'}" x1="0" x2="${W}" y1="${f(Y(v))}" y2="${f(Y(v))}"/><text class="gt" x="${W-4}" y="${f(Y(v)-3)}" text-anchor="end">${v}×</text>`});
  const SER=[['ALT','c1'],['AST','c2'],['ALP','c3'],['Tbili','c4']];let leg='';
  SER.forEach(([k,c])=>{const s=S[k],u=ULN[k],vis=s.pts.filter(p=>p[0]>=d0-30&&p[0]<=d1+30);
    g+=`<path d="M${vis.map(p=>f(X(p[0]))+' '+f(Y(p[1]/u))).join('L')}" fill="none" stroke="var(--${c})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const k1=k+'x#'+(uid++),k2=k+'r#'+(uid++);
    g+=`<circle data-cd="${k1}" r="4" cx="-20" cy="0" style="display:none;fill:var(--${c});stroke:var(--surface);stroke-width:1.5"/>`;
    RO[k1]=t=>{const p=latest(s.pts,t);return p?(p[1]/u).toFixed(1)+'×':''};RO[k2]=t=>{const p=latest(s.pts,t);return p?p[1].toFixed(s.dec):''};
    CD[k1]=t=>{const p=latest(s.pts,t);return p?[X(p[0]),Y(p[1]/u)]:null};
    leg+=`<div class="li"><i style="background:var(--${c})"></i><span>${s.label}</span><span class="rv" data-ro="${k1}"></span><small data-ro="${k2}"></small></div>`});
  const hl=PREW?`<line class="thr" x1="0" x2="${PREW}" y1="${f(Y(1))}" y2="${f(Y(1))}"/>`+SER.map(([k,c])=>hLabGraph(S[k],Y,`var(--${c})`,ULN[k])).join(''):'';
  rows+=head('s:lft','Liver tests, × upper limit',{fixed:1})+row(g,H,`<div class="legend">${leg}</div>`,'',hl);
  let hy='';HYPO.forEach(x=>hy+=`<rect x="${f(X(x.s))}" y="9" width="${f(Math.max(X(x.e)-X(x.s),4))}" height="12" fill="var(--sR)" data-tip="${esc('MAP below 60 mmHg|'+stamp(x.s)+' to '+stamp(x.e))}"/>`);
  rows+=head('s:hypo','Hypotension',{fixed:1})+row(hy,30,lab('MAP below 60'));
  const crows=CL_.map(c=>({key:'cand:'+c.name,label:c.name}));
  rows+=head('s:cand','Candidate agents',{fixed:1,rows:crows});
  CL_.filter(c=>shown('cand:'+c.name)).forEach(c=>{const e=candExposure(c),badge=`<span class="lt-s bd ${grade(c.score)}" title="LiverTox likelihood category">${c.score==='A[H] / D'?'A[H]':c.score}</span>`;
    if(e.home)rows+=homeRow(e.home,badge);
    else if(e.m)rows+=medRow(e.m,badge,true);
    else{let g2='';const sg0=e.d.segs[0],sg1=e.d.segs[e.d.segs.length-1];g2+=`<rect class="dfill" x="${f(X(sg0.s))}" y="16" width="${f(Math.max(X(sg1.e)-X(sg0.s),2))}" height="12" data-tip="${esc(c.name+' infusion|'+stamp(sg0.s)+' to '+stamp(sg1.e))}"/><path class="dline" d="M${f(X(sg0.s))} 16H${f(X(sg1.e))}"/>`;
      rows+=row(g2,34,lab(c.name,'infusion',badge))}});
  const ox=X(ONSET);
  h+=`<div class="wrap" style="border-top:1px solid var(--rowline)">${backdrop()}${rows}${ox>=0&&ox<=W?`<div class="onset" style="left:${f(PREW+ox)}px"><span${ox>W-170?' class="l"':''}>Onset · ALP ≥ 2× ULN</span></div>`:''}<div class="xhair" hidden></div></div>`;
  let tb='';CL_.forEach(c=>{const e=candExposure(c);const lat=ONSET-e.first,since=e.last<ONSET&&!e.on?dur(ONSET-e.last)+' before onset':'still given at onset';
    tb+=`<tr><td><b>${c.name}</b></td><td class="n">${e.home?mdy(e.first)+' to '+mdy(e.last)+', outpatient':stamp(e.first).split(' ')[0]+(e.on?' to now':' to '+stamp(e.last).split(' ')[0])+(e.n?', '+e.n+' doses':', infusion')}</td><td class="n">${lat>0?dur(lat):'after onset'}</td><td class="n">${since}</td><td><span class="lt-s ${grade(c.score)}">${c.score}</span></td><td>${c.url?`<a href="${c.url}" target="_blank" rel="noopener">${c.typ}</a>`:c.typ}</td><td>${c.read}</td></tr>`});
  h+=`<div class="pane wide"><h3>Candidate agents <span class="tag">LiverTox · NIH</span><span class="tag">Last column LLM-drafted</span></h3><p class="cap">Inpatient agents given before onset, plus outpatient prescriptions started inside the loaded lookback, ordered by how well timing and pattern fit. Long-standing home medications stay on the timeline. Latency is counted from the first dose to ${stamp(ONSET)}. The typical presentation links to the LiverTox chapter.</p><div class="ltkey"><span>LiverTox likelihood</span><span><i class="lt-s gA">A</i>well established</span><span><i class="lt-s gB">B</i>highly likely</span><span><i class="lt-s gC">C</i>probable</span><span><i class="lt-s gD">D</i>possible</span><span><i class="lt-s gE">E</i>unlikely</span><span><i class="lt-s gX">–</i>not listed</span></div><div class="scroll"><table style="min-width:880px"><thead><tr><th>Agent</th><th>Given</th><th>First dose to onset</th><th>Last dose</th><th>LiverTox</th><th>Typical presentation</th><th>Read for this patient</th></tr></thead><tbody>${tb}</tbody></table></div></div>`;
  h+=copyPane('dili',[['full','Liver tests + agents'],['tests','Liver tests only'],['agents','Agents only']]);
  return h}

const dotOf=m=>new Set(m.adm.map(hd)).size;
const SIRC=v=>v==='S'?'S':(v==='R'||v==='IR')?'R':'I';
const isoName=o=>o.org.replace('K.','Klebsiella').replace('P.','Pseudomonas').split(' ')[0];
function astSummary(cells){const t=cells.filter(Boolean).map(c=>SIRC(c[1]));if(!t.length)return['none','Not tested'];
  const s=t.filter(x=>x==='S').length,r=t.filter(x=>x==='R').length;
  if(s===ISO.length)return['neg','Active against all '+ISO.length];
  if(s===t.length)return['pend','S where tested, '+t.length+' of '+ISO.length];
  if(r===t.length)return['flag','Resistant in all'];
  if(s===0)return['part','None fully susceptible'];
  return['part','Discordant: S in '+s+' of '+t.length]}
const RESST={pos:['flag','Positive'],neg:['neg','Negative'],pend:['pend','Pending']};
function specId(){
  const bc=MICRO.filter(m=>/Blood/.test(m.short)),pos=bc.filter(m=>m.st==='pos'),firstPos=pos[0].t,fn=MICRO.find(m=>m.firstNeg),pend=bc.filter(m=>m.st==='pend');
  const tests=MICRO.filter(m=>m.kind==='test'),cxs=MICRO.filter(m=>m.kind==='cx'),tp=tests.filter(m=>m.st==='pend');
  const mero=MEDS.find(m=>m.role&&m.on),sc=PROCS.find(x=>x.sc),up=IMAGING.find(x=>x.pending);
  const cr=A.Cr[A.Cr.length-1],crcl=Math.round((140-CTX.age)*CTX.wt/(72*cr)),pk=Math.max(...A.Cr);
  let h=`<div class="stats">${stat('Active antimicrobials',mero.name,mero.dose.replace(/^\S+ \S+ /,''),`Day ${dotOf(mero)} of therapy. Started ${stamp(mero.first)} (${md(mero.first)}). Planned stop HD${hd(mero.plan)} (${md(mero.plan)}), per ID.`)}${stat('Blood cultures',pos.length+' positive draws','first negative HD'+hd(fn.t),`First negative set drawn ${stamp(fn.t)}, ${hd(NOW)-hd(fn.t)} days ago. ${pend.length} set still pending.`)}${stat('Source control','Central line removed','HD'+hd(sc.t),`${stamp(sc.t)}. Right IJ catheter out after 5.4 days, at the request of Infectious Diseases.`)}${stat('Pending and upcoming',tp.length+' tests pending','',`${tp.map(m=>m.short).join(', ')}. Meropenem planned stop HD${hd(mero.plan)}. ${up.short} ${stamp(up.t)}.`)}</div>`;
  h+=`<div class="ctxrow"><span><b>Renal</b>Cr ${cr.toFixed(1)} (peak ${pk.toFixed(1)} on HD${A.Cr.indexOf(pk)+1}), CrCl about ${crcl} mL/min</span><span><b>Allergies</b>${CTX.allergy}</span><span><b>MDRO history</b>${CTX.mdro}</span><span><b>Culture drawn to carbapenem</b>${(mero.first-firstPos).toFixed(1)} h</span></div>`;
  const ax=axisInner(true);let rows=row(ax.s,ax.h,'','',histAxis(ax.h,true));
  rows+=head('s:abx','Antimicrobial',{fixed:1});
  ['Prophylaxis','Empiric','Targeted'].forEach(role=>{const list=MEDS.filter(m=>m.role===role);if(list.length)rows+=subh(role)+list.map(m=>medRow(m,`<span class="rv" title="Days of therapy" style="color:var(--ink)">DOT ${dotOf(m)}</span>`)).join('')});
  rows+=head('s:cx','Microbiology',{fixed:1,left:MKEY})+microRow('Cultures','cx')+microRow('PCR, antigen, serology','test');
  rows+=head('s:fever','Fever and labs',{fixed:1,mode:'idlabs'});
  rows+=state.mode.idlabs==='num'?cellsRow(S.Temp,'range')+cellsRow(S.WBC)+cellsRow(S.CRP)+cellsRow(S.Cr):graphRow(S.Temp,50,false,true)+graphRow(S.WBC,38)+graphRow(S.CRP,38)+graphRow(S.Cr,38);
  rows+=head('s:dev','Lines and devices',{fixed:1});
  DEVICES.forEach(d=>{const e=d.e??NOW;rows+=row(`<rect class="ord" x="${f(X(d.s))}" y="11" width="${f(Math.max(X(e)-X(d.s),2))}" height="8" data-tip="${esc(d.label+'|'+stamp(d.s)+' to '+(d.e?stamp(d.e):'now, in place')+'|'+dur(e-d.s))}"/>${sq(X(d.s),15)}${d.e?`<rect class="dc" x="${f(X(e)-1.5)}" y="4" width="3" height="22"/>`:''}`,30,lab(d.label,'',`<span class="rv" title="Dwell time" style="color:var(--ink)">${dur(e-d.s)}</span>`))});
  rows+=head('s:notes','Notes',{fixed:1})+eventsRow(NOTES.filter(n=>n.idn).map(n=>EV[n.id]),'ID notes')+eventsRow(NOTES.filter(n=>!n.idn).map(n=>EV[n.id]),'Other notes');
  h+=`<div class="wrap">${backdrop()}${rows}<div class="xhair" hidden></div></div>`;
  // susceptibilities across every isolate
  const flt=state.astf,cur=AST.find(r=>r[1]===mero.id);
  const list=AST.filter(r=>{const m=r[1]&&MEDS.find(x=>x.id===r[1]);return flt==='given'?!!m:flt==='alls'?astSummary(r.slice(2))[0]==='neg':true});
  const hdr=ISO.map(o=>`<th class="iso" data-ev="${o.cx}" data-card="${o.cx}" tabindex="0"><b>${o.org}</b>${o.tag?' '+o.tag:''}<span>${o.src} · ${o.when}</span></th>`).join('');
  const body=list.map(r=>{const [d,id,...cells]=r,m=id&&MEDS.find(x=>x.id===id),sum=astSummary(cells);
    return `<tr class="${m&&m.on?'cur':''}"><td>${m?'<b>'+d+'</b>':d}${m&&m.on?' <span class="tag">current</span>':''}</td>${cells.map(c=>`<td class="n">${c?`<span class="sir ${SIRC(c[1])}">${c[1]==='IR'?'R':c[1]}</span><small>${c[1]==='IR'?'intrinsic':c[0]}</small>`:'<span class="nt">–</span>'}</td>`).join('')}<td><span class="st ${sum[0]}">${sum[1]}</span></td><td class="n">${m?'HD'+hd(m.first)+(m.on?' to now':' to HD'+hd(m.last))+', '+m.adm.length+' doses':''}</td></tr>`}).join('');
  h+=`<div class="pane"><h3>Susceptibilities across isolates <span class="hint" style="font-weight:400">One column per isolate, so overlap and discordance show in a row.</span></h3><p class="cap">Current therapy, ${mero.name.toLowerCase()}: ${ISO.map((o,i)=>cur[2+i]?cur[2+i][1]+' for '+isoName(o)+' ('+o.src.toLowerCase()+')':'').filter(Boolean).join(', ')}. Select an isolate heading to pin its culture report.</p><div class="copybar">${[['all','All agents'],['given','Given this admission'],['alls','Active against every isolate']].map(([k,n])=>`<button class="chip" data-astf="${k}" aria-pressed="${flt===k}">${n}</button>`).join('')}</div><div class="scroll"><table class="ast" style="min-width:820px"><thead><tr><th>Antimicrobial</th>${hdr}<th>Across isolates</th><th>Given</th></tr></thead><tbody>${body||'<tr><td colspan="6">No agent matches this filter.</td></tr>'}</tbody></table></div></div>`;
  const cu=cxs.map(m=>`<tr data-ev="${m.id}" tabindex="0"><td class="n">${stamp(m.t)}</td><td>${m.spec}</td><td class="n">${m.resT?stamp(m.resT)+' · '+dur(m.resT-m.t):'Pending'}</td><td>${m.st==='pos'?'<b>'+m.result+'</b>':m.result}${m.firstNeg?' <span class="tag">first negative</span>':''}</td></tr>`).join('');
  const tu=tests.map(m=>`<tr data-ev="${m.id}" tabindex="0"><td class="n">${stamp(m.t)}</td><td>${m.title}<br><span class="note">${m.spec}</span></td><td><span class="st ${RESST[m.st][0]}">${RESST[m.st][1]}</span></td><td>${m.result}</td></tr>`).join('');
  h+=`<div class="two" style="border-top:1px solid var(--col)"><div class="pane"><h3>Culture log</h3><p class="cap">Every culture this encounter, with time from collection to final result. Select a row to pin the full report.</p><div class="scroll"><table style="min-width:560px"><thead><tr><th>Collected</th><th>Specimen</th><th>Resulted</th><th>Result</th></tr></thead><tbody>${cu}</tbody></table></div></div><div class="pane"><h3>PCR, antigen and serology</h3><p class="cap">Non-culture ID tests: mycobacterial, viral, fungal markers and screening.</p><div class="scroll"><table style="min-width:440px"><thead><tr><th>Collected</th><th>Test</th><th>Status</th><th>Result</th></tr></thead><tbody>${tu}</tbody></table></div></div></div>`;
  h+=copyPane('id',[['full','Antimicrobials + micro'],['abx','Antimicrobials only'],['micro','Micro only']]);
  return h}

/* plain-text summaries for pasting into a note, built only from structured data */
function noteText(kind){const L=[],fmt=state.fmt[kind];
  if(kind==='id'){
    if(fmt!=='micro'){L.push(`ANTIMICROBIAL HISTORY (${md(ADMIT)} to present)`);
      MEDS.filter(m=>m.role).forEach(m=>L.push(`- ${m.name} ${m.dose}: ${md(m.first)} to ${m.on?'present':md(m.last)} (HD${hd(m.first)} to HD${hd(m.on?NOW:m.last)}), ${m.adm.length} doses, DOT ${dotOf(m)}. ${m.role}.${m.plan?' Planned stop '+md(m.plan)+'.':''}`))}
    if(fmt==='full')L.push('');
    if(fmt!=='abx'){L.push('CULTURES');
      MICRO.filter(m=>m.kind==='cx').forEach(m=>L.push(`- ${md(m.t)} ${clock(m.t)} ${m.title} (${m.spec}): ${m.result}`));
      const fn=MICRO.find(m=>m.firstNeg);L.push(`- First negative blood culture: ${md(fn.t)} ${clock(fn.t)} (HD${hd(fn.t)})`);
      L.push('','SUSCEPTIBILITIES');
      ISO.forEach((o,i)=>L.push(`- ${o.org}${o.tag?' '+o.tag:''} (${o.src.toLowerCase()}, ${o.when}): `+AST.filter(r=>r[2+i]).map(r=>r[0]+' '+(r[2+i][1]==='IR'?'R (intrinsic)':r[2+i][1])).join(', ')));
      L.push('','OTHER ID TESTS');
      MICRO.filter(m=>m.kind==='test').forEach(m=>L.push(`- ${md(m.t)} ${m.title} (${m.spec}): ${m.result}`))}}
  else{const n=A.ALT.length-1,io=S.ALP.pts.findIndex(p=>p[0]===ONSET);
    if(fmt!=='agents'){L.push('LIVER TESTS (multiple of upper limit in parentheses)');L.push('Date    AST         ALT         ALP         T bili');
      const c=(k,i)=>(A[k][i].toFixed(S[k].dec)+' ('+(A[k][i]/ULN[k]).toFixed(1)+'x)').padEnd(12);
      A.ALT.forEach((_,i)=>L.push(md(i*24+4).padEnd(8)+c('AST',i)+c('ALT',i)+c('ALP',i)+c('Tbili',i).trim()));
      L.push(`Pattern: ${pattern(Rat(n)).toLowerCase()}, R ${Rat(n).toFixed(1)} today (${Rat(io).toFixed(1)} at onset). Onset ${md(ONSET)} ${clock(ONSET)} (HD${hd(ONSET)}), ALP at or above 2x ULN.`)}
    if(fmt==='full')L.push('');
    if(fmt!=='tests'){L.push('AGENTS GIVEN BEFORE ONSET');
      candList().forEach(c=>{const e=candExposure(c);L.push(`- ${c.name}: ${md(e.first)} to ${e.on?'present':md(e.last)}, ${e.home?'outpatient course':e.n?e.n+' doses':'infusion'}; first dose to onset ${dur(ONSET-e.first)}; LiverTox ${c.score==='–'?'not listed':c.score}`)})}}
  return L.join('\n')}
function copyPane(kind,opts){return `<div class="pane wide"><h3>Copy to note <span class="hint" style="font-weight:400">Plain text built from the structured data above. No LLM.</span></h3><div class="copybar">${opts.map(([k,n])=>`<button class="chip" data-fmt="${kind}:${k}" aria-pressed="${state.fmt[kind]===k}">${n}</button>`).join('')}<button class="go" data-copy="${kind}">Copy</button></div><pre class="notepre" id="note-${kind}">${esc(noteText(kind))}</pre></div>`}

function renderSpec(){
  const tabs=[['dili','GI / Hepatology','Liver injury'],['id','Infectious Diseases','Cultures and antimicrobials']];
  $('#spectabs').innerHTML=tabs.map(([k,o,n])=>`<button class="tab" role="tab" aria-selected="${state.spec===k}" data-spec="${k}"><small>${o}</small>${n}</button>`).join('')+['Hematology · Anemia and transfusion response','Hematology · Hemolysis','Nephrology · AKI'].map(n=>`<span class="tab ghost">${n} <span class="tag">proposed</span></span>`).join('');
  $('#specbody').innerHTML=state.spec==='dili'?specDili():specId()}

/* ---------- what data is in the view, and how far back it reaches ---------- */
const mdy=t=>{const d=new Date(2026,9,30+Math.floor(t/24));return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2)};
const scopeDays=()=>SCOPES.find(s=>s[0]===state.scope)[2];
const priorItems=()=>PRIOR.filter(p=>-p.t/24<=scopeDays()&&(!p.outside||state.ce)).sort((a,b)=>b.t-a.t);
/* history strip: records from before admission, drawn on their own compressed time scale to the left of the encounter */
const XH=t=>2+(t+HL)/HL*(PREW-12);
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const OKI='<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.5 5 9.5l5-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',WARNI='<svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5 11 10.5H1z" fill="currentColor"/></svg>',NOI='<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function histTicks(){const out=[];
  if(HL<=31*24){for(let k=1;k*7*24<HL;k++)out.push({t:-k*7*24,label:md(-k*7*24)})}
  else for(let m=0;m<40;m++){const d=new Date(2026,9-m,1),t=(d-new Date(2026,9,30))/36e5;if(t<-HL)break;out.push({t,label:MON[d.getMonth()]+(d.getMonth()===0?" '"+String(d.getFullYear()).slice(2):'')})}
  return out}
function histAxis(h,compact){if(!PREW)return'';const tk=histTicks(),step=tk.length>1?Math.abs(XH(tk[0].t)-XH(tk[1].t)):99,every=step<30?Math.ceil(30/step):1;let s='';
  tk.forEach((k,i)=>{const x=XH(k.t);s+=`<line class="ax-l" x1="${f(x)}" x2="${f(x)}" y1="${compact?h-8:h-16}" y2="${h}"/>`;if(i%every===0&&x<PREW-24)s+=`<text class="ax-hr" x="${f(x+3)}" y="${h-5}" style="text-anchor:start">${k.label}</text>`});
  if(!compact)s+=`<text class="ax-dt" x="6" y="15" style="text-anchor:start;font-weight:600">Before admission · ${SCOPES.find(x=>x[0]===state.scope)[1].toLowerCase()}</text>`;
  return s}
const hPts=key=>PREW?priorItems().filter(p=>p.kind==='lab'&&p.vals[key]!=null).map(p=>({t:p.t,v:p.vals[key],p})).sort((a,b)=>a.t-b.t):[];
const hTip=(s,o)=>esc(s.label+' '+o.v.toFixed(s.dec)+(s.unit&&s.unit!=='derived'?' '+s.unit:'')+'|'+mdy(o.t)+' · '+o.p.src+(o.p.outside?' (outside)':''));
function hLabGraph(s,Y,col='var(--mk)',scale=1){const a=hPts(s.key);if(!a.length)return'';
  let g=`<path d="M${a.map(o=>f(XH(o.t))+' '+f(Y(o.v/scale))).join('L')}L${PREW} ${f(Y(s.pts[0][1]/scale))}" fill="none" stroke="${col}" stroke-width="1.5"/>`;
  a.forEach(o=>g+=`<circle cx="${f(XH(o.t))}" cy="${f(Y(o.v/scale))}" r="2.8" fill="${o.p.outside?'var(--surface)':col}" stroke="${col}" stroke-width="1.4" data-tip="${hTip(s,o)}"/>`);
  return g}
function hLabNum(s,h){const a=hPts(s.key).reverse();let g='',edge=1e9;
  a.forEach(o=>{const x=XH(o.t),txt=o.v.toFixed(s.dec),w=tw(txt,12)+6,fits=x+w/2<edge-1&&x-w/2>0&&x+w/2<PREW-3;
    g+=fits?`<text class="cv${isOut(s,o.v)?' ab':''}" x="${f(x)}" y="${h/2+4.2}" data-tip="${hTip(s,o)}">${txt}</text>`:`<circle class="more" cx="${f(x)}" cy="${h/2}" r="2.2" data-tip="${hTip(s,o)}"/>`;if(fits)edge=x-w/2});
  return g}
function hEv(kinds,y=13){if(!PREW)return'';return priorItems().filter(p=>kinds.includes(p.kind)).map(p=>`<g data-tip="${esc(p.title+(p.outside?' (outside)':'')+'|'+mdy(p.t)+' · '+p.src+(p.body?'|'+p.body:''))}"><rect class="hit" x="${f(XH(p.t)-8)}" y="${y-10}" width="16" height="20"/>${sq(XH(p.t),y,p.outside?'open':'')}</g>`).join('')}
const homeVisible=()=>PREW?HOME.filter(m=>m.fills.some(d=>d*24>=-HL)):[];
const amxOn=()=>homeVisible().some(m=>m.id==='amx');
const candList=()=>(amxOn()?[AMX]:[]).concat(CAND);
function homeRow(m,right=''){const h=34,y=22,fl=m.fills.filter(d=>d*24>=-HL),a=XH(fl[0]*24),b=XH(Math.min((fl[fl.length-1]+m.supply)*24,0));
  let g=`<rect class="ord" x="${f(a)}" y="${y-4}" width="${f(Math.max(b-a,2))}" height="8"/>`;
  fl.forEach(d=>g+=`<g data-tip="${esc(m.name+'|'+m.sig+'|Filled '+mdy(d*24)+', '+m.supply+'-day supply|'+m.src)}"><rect class="hit" x="${f(XH(d*24)-6)}" y="2" width="12" height="${h-4}"/>${sq(XH(d*24),y,'',fl.length>8?6:9)}</g>`);
  const enc=m.held?`<g data-tip="${esc(m.name+'|Held on admission')}"><rect class="hit" x="${f(X(ADMIT)-8)}" y="2" width="16" height="${h-4}"/>${sq(X(ADMIT),y,'open')}</g>`:'';
  return row(enc,h,`<i class="grip"></i><span class="lb">${m.name}</span><span class="tag prn" style="color:var(--ink-2);border-color:var(--rowline);background:none" title="Outpatient prescription">home</span><span class="un">${m.sig}</span>${right}`,'',g)}
function renderScope(){const fx=state.fetching,open=state.open.scope,sc=SCOPES.find(s=>s[0]===state.scope),ci=SCOPES.indexOf(sc),pi=priorItems(),own=pi.filter(p=>!p.outside),out=pi.filter(p=>p.outside),nl=own.filter(p=>p.kind==='lab').length,nd=own.length-nl;
  const tp=allTemplates().find(t=>t.id===state.tpl),fills=homeVisible().reduce((n,m)=>n+m.fills.filter(d=>d*24>=-HL).length,0),want=tp.look&&ci<SCOPES.findIndex(x=>x[0]===tp.look)?SCOPES.find(x=>x[0]===tp.look):null;
  let h=`<div class="sc-top"><button class="xp" data-open="scope" aria-expanded="${open}">${I.chev}<h2>Data in this view</h2></button><div class="seg" role="group" aria-label="How far back to fetch">${SCOPES.map(s=>`<button data-scope="${s[0]}" aria-pressed="${state.scope===s[0]}"${fx?' disabled':''}>${s[1]}</button>`).join('')}</div>`;
  if(fx)h+=`<span class="hint">${esc(fx.label)}</span>`;
  else{h+=`<span class="st ${state.ce?'part':'flag'}">${WARNI}Outside records ${state.ce?'partly included':'not included'}</span>`;
    if(want)h+=`<span class="st pend">${esc(tp.name)} is built for ${want[1]}</span><button class="btn" style="height:26px" data-scope="${want[0]}">Fetch ${want[1]}</button>`;
    if(!open)h+=`<button class="hint lk" data-open="scope">What is and is not included</button>`}
  h+='</div>';
  if(fx)h+=`<div class="prog"><i style="animation-duration:${fx.ms}ms"></i></div>`;
  if(open){
    h+=`<p class="hint" style="margin:8px 0 0">Wider ranges take longer to fetch: about 2 s for this encounter, 5 s for 30 days, 15 s for 6 months, 20 s for a year, over a minute for everything. Waits are shortened in this mock-up.</p>`;
    h+=`<div class="cov"><div><span class="st neg">${OKI}Included</span><b>This encounter</b><span>ADT, flowsheets, MAR, results, microbiology, imaging and procedure reports, note metadata. Current to HD12 09:00.</span></div>`;
    h+=state.scope==='enc'?`<div><span class="st none">${NOI}Not loaded</span><b>Earlier records at this hospital</b><span>Nothing from before this admission is loaded, so baselines, outpatient prescriptions and earlier procedures are missing. Widen the range to fetch them.</span></div>`
      :`<div><span class="st neg">${OKI}Included</span><b>Earlier records at this hospital</b><span>${sc[1]} before admission: ${nl} lab draw${nl===1?'':'s'}, ${nd} visits, reports or notes, and ${fills} pharmacy fill${fills===1?'':'s'}. They sit in the history strip to the left of the admission, on a compressed time scale.</span></div>`;
    h+=state.ce?`<div><span class="st part">${WARNI}Partly included</span><b>Outside records (Care Everywhere)</b><span>Downloaded from 1 of 2 organizations; the other has not responded. ${out.length?out.length+' outside item'+(out.length===1?' is':'s are')+' in the history strip, drawn hollow.':'Outside items are older than the current range; widen it to see them.'}</span></div>`
      :`<div><span class="st flag">${WARNI}Not included</span><b>Outside records (Care Everywhere)</b><span>2 organizations hold records for this patient. None are in this view: outside data is only included after it has been downloaded into the chart.</span><span class="covact"><button class="btn" data-ce${fx?' disabled':''}>Download outside records</button><span class="hint">The slowest fetch; can take a minute or more.</span></span></div>`;
    h+=`<div><span class="st none">${NOI}Never searched</span><b>Not read by this view</b><span>Note text (metadata only), scanned documents and media, and outside records that were never downloaded.</span></div></div>`}
  $('#scope').innerHTML=h}

/* ---------- outline, ask ---------- */
const dayLine=i=>md(i*24)+' (HD'+(i+1)+'): '+DAILY[i];
const dayText=()=>DAILY.map((_,i)=>dayLine(i)).join('\n');
function renderChapters(){const op=state.open.course;$('#courseBody').hidden=!op;$('#courseBtn').setAttribute('aria-expanded',op);$('#chapters').innerHTML=DAILY.map((t,i)=>`<li class="${state.chapter==='d'+i?'on':''}"><button class="dd" data-day="${i}" aria-pressed="${state.chapter==='d'+i}" title="Zoom the timeline to this day">${md(i*24)} <span>HD${i+1}</span></button><span>${t}</span></li>`).join('')}
const cite=(id,txt)=>`<button class="cite" data-ev="${id}" data-card="${id}">${txt}</button>`;
const ASK=[
  {q:'How much blood has he received, and did hemoglobin respond?',a:()=>{
    let p=`<p>${RBC.length} units of red cells across ${EPIS.length} episodes, and 1 unit of platelets ${cite('tp1','HD1 06:30')}.</p><p>`;
    p+=EPIS.map(ep=>`${stamp(ep.s)}: ${ep.n} unit${ep.n>1?'s':''}, hemoglobin ${ep.pre[1].toFixed(1)} to ${ep.post[1].toFixed(1)} ${cite(ep.id,'record')}`).join('. ')+'.</p>';
    const low=EPIS.find(e=>e.low);
    if(low)p+=`<p>The first episode rose ${(low.delta/low.n).toFixed(2)} g/dL per unit, measured while he was still bleeding before the banding ${cite('pr3','EGD')}. Each later episode rose about 1 g/dL per unit.</p>`;return p}},
  {q:'Which antimicrobials has he had, and for how long?',a:()=>{
    let p='<p>'+MEDS.filter(m=>m.cat==='abx').map(m=>`${m.name}: HD${hd(m.first)}${m.on?' to now':' to HD'+hd(m.last)}, ${m.adm.length} doses over ${new Set(m.adm.map(hd)).size} days`).join('. ')+'.</p>';
    p+=`<p>The blood isolate ${cite('mc2','HD4 culture')} is resistant to ceftriaxone, susceptible-dose-dependent to piperacillin-tazobactam, and susceptible to meropenem. Blood cultures have been negative since ${cite('mc7','HD6')}.</p>`;return p}},
  {q:'What happened in the five days before the ALP rise?',a:()=>{
    const hy=HYPO.filter(x=>x.s>ONSET-120&&x.s<ONSET)[0];
    return `<p>ALP crossed 2× ULN at ${stamp(ONSET)}. In the five days before:</p><p>Septic shock with MAP below 60 mmHg${hy?' from '+stamp(hy.s):''}, a return to the ICU, and norepinephrine until HD6. Klebsiella bacteremia ${cite('mc2','HD4')} that cleared by ${cite('mc7','HD6')}. Ceftriaxone stopped on HD4 after 4 doses, piperacillin-tazobactam and vancomycin given HD4 to HD5, and meropenem started HD5. Contrast CT on ${cite('im5','HD5')}. AKI with creatinine peaking at ${Math.max(...A.Cr)} on HD6.</p><p>The ultrasound on ${cite('im7','HD9')} then showed new gallbladder sludge without ductal dilation.</p>`}},
];
function renderAsk(){$('#askq').innerHTML='<span class="eyebrow">Ask this timeline</span>'+ASK.map((a,i)=>`<button class="q" data-ask="${i}" aria-pressed="${state.ask===i}">${a.q}</button>`).join('');
  const el=$('#ans');if(state.ask==null)el.hidden=true;else{el.hidden=false;el.innerHTML=ASK[state.ask].a()}}

/* ---------- menus ---------- */
const ck=(on,r)=>`<span class="ck${r?' r':''}">${on?I.check:''}</span>`;
function renderMenus(){
  const cur=allTemplates().find(t=>t.id===state.tpl),groups={};allTemplates().forEach(t=>(groups[t.owner]=groups[t.owner]||[]).push(t));
  let h='';for(const o in groups){h+=`<h4>${o==='Everyone'?'Shared with everyone':o==='Only me'?'My templates':'Shared by '+esc(o)}</h4>`;
    groups[o].forEach(t=>h+=`<button class="mi" role="menuitemradio" aria-checked="${t.id===state.tpl}" data-tpl="${t.id}">${ck(t.id===state.tpl,1)}${esc(t.name)}<span class="d">${t.lanes.length} sections</span></button>`)}
  h+=`<div class="save"><div class="eyebrow">Save the current view as a template</div><div class="r"><input type="text" id="tplNew" placeholder="Template name" aria-label="Template name"><select id="tplShare" aria-label="Share with"><option>Only me</option><option>GI &amp; Hepatology</option><option>Everyone</option></select></div><div class="r"><button class="go" id="tplSave">Save</button><span class="hint" style="align-self:center">Kept for this session only.</span></div></div>`;
  $('#tplMenu').innerHTML=h;$('#tplName').textContent=cur.name+(state.edited?' · edited':'');
  let m='<h4>Core sections</h4>';ORDER.forEach(k=>{const on=state.lanes.includes(k);m+=`<button class="mi" role="menuitemcheckbox" aria-checked="${on}" data-mod="${k}">${ck(on)}${LANES[k].title}</button>`});
  $('#modMenu').innerHTML=m;$('#modCount').textContent=state.lanes.length+' of '+ORDER.length;
  const rm=$('#rowMenu');
  if(state.rowMenu&&ROWSETS[state.rowMenu]){rm.innerHTML='<h4>Rows shown</h4>'+ROWSETS[state.rowMenu].map((r,i,a)=>{const on=!state.hidden.has(r.key);return (r.grp&&(!i||a[i-1].grp!==r.grp)?'<h4>'+esc(r.grp)+'</h4>':'')+`<button class="mi" role="menuitemcheckbox" aria-checked="${on}" data-hide="${r.key}">${ck(on)}${esc(r.label)}</button>`}).join('')}
  else{rm.hidden=true;state.rowMenu=null}}

/* ---------- render + interaction ---------- */
let roEls=[],cdEls=[],xh=[];
function renderAll(){
  G=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter'))||252;
  PREW=state.scope==='enc'?0:(G<200?92:Math.round(Math.min(360,Math.max(220,($('#lanes').clientWidth-G)*0.25))));HL=scopeDays()*24;W=Math.max(120,Math.floor($('#lanes').clientWidth-G-PREW));$('#app').style.setProperty('--plotw',(W+PREW)+'px');$('#app').style.setProperty('--prew',PREW+'px');
  [d0,d1]=state.dom;const span=d1-d0;BIN=span<=30?2:span<=84?6:span<=160?12:24;while(BIN<24&&W/(span/BIN)<24)BIN=BIN===2?6:BIN===6?12:24;
  RO={};CD={};ROWSETS={};uid=0;
  renderScope();renderChapters();renderAsk();renderAxis();renderLanes();renderSpec();renderMenus();
  roEls=$$('[data-ro]');cdEls=$$('[data-cd]');xh=$$('.xhair');
  const r=state.dom,is=(a,b)=>Math.abs(r[0]-a)<.01&&Math.abs(r[1]-b)<.01;
  $$('#ranges button').forEach(b=>{const k=b.dataset.range;b.setAttribute('aria-pressed',k==='all'?is(0,END):is(NOW-(+k),END))});
  setCursor(null)}
function setCursor(t){const tt=t??NOW;
  roEls.forEach(el=>{const fn=RO[el.dataset.ro];if(fn)el.innerHTML=fn(tt)});
  cdEls.forEach(el=>{const p=t==null?null:CD[el.dataset.cd]?.(tt);if(p&&p[0]>=0&&p[0]<=W){el.setAttribute('cx',f(p[0]));el.setAttribute('cy',f(p[1]));el.style.display=''}else el.style.display='none'});
  xh.forEach(x=>{if(t==null)x.hidden=true;else{x.hidden=false;x.style.left=f(PREW+X(t))+'px'}});
  const a=$('#curT'),b=$('#curL');if(a){a.textContent=stamp(tt);b.textContent=t==null?'Now · '+locAt(NOW-.1):locAt(tt)||' '}}
function setDomain(a,b,chapter=null){a=Math.max(0,a);b=Math.min(END,b);if(b-a<6){const c=(a+b)/2;a=Math.max(0,c-3);b=Math.min(END,a+6)}state.dom=[a,b];state.chapter=chapter;renderAll()}
function applyTemplate(id){const t=allTemplates().find(x=>x.id===id);if(!t)return;state.tpl=id;state.lanes=[...t.lanes];state.hidden=new Set([...t.hide,'resp:rate','resp:vt']);state.labs=[...t.labs];state.spec=t.spec;state.edited=false;state.closed.clear();state.medGroup='type';state.gclosed.clear();renderAll()}
const toggle=(arr,k)=>{const i=arr.indexOf(k);if(i<0)arr.push(k);else arr.splice(i,1)};

function openDetail(id){const e=EV[id];if(!e)return;state.sel=id;
  $('#dKick').textContent=e.kick;$('#dTitle').textContent=e.title;$('#dWhen').textContent=stampL(e.t)+(e.pending?' · scheduled':'');
  $('#dBody').innerHTML=`<div>${bodyHTML(e,true)}</div><dl class="kv"><dt>Source</dt><dd>${e.src}</dd></dl><div class="da"><button class="btn" data-center="${e.t}">Center timeline here</button><button class="btn" disabled title="Not wired in the mock-up">Open source document ↗</button></div><p class="note">In a build this panel links straight to the source document in the chart.</p>`;
  $('#detail').hidden=false;
  $$('.ev.sel').forEach(x=>x.classList.remove('sel'));$$(`.ev[data-ev="${id}"]`).forEach(x=>x.classList.add('sel'));fxEp(null)}
function closeDetail(){$('#detail').hidden=true;state.sel=null;fxEp(null);$$('.ev.sel').forEach(x=>x.classList.remove('sel'))}
function closeMenus(){$$('.menu').forEach(m=>m.hidden=true);$$('.pop>.btn').forEach(b=>b.setAttribute('aria-expanded','false'));state.rowMenu=null}

document.addEventListener('click',e=>{
  const T_=e.target;const q=s=>T_.closest(s);let el;
  if(el=q('#tplBtn,#modBtn')){const m=$('#'+(el.id==='tplBtn'?'tplMenu':'modMenu')),was=m.hidden;closeMenus();m.hidden=!was;el.setAttribute('aria-expanded',String(was));return}
  if(el=q('[data-rows]')){const k=el.dataset.rows,was=state.rowMenu===k;closeMenus();if(was)return;state.rowMenu=k;rmY=scrollY;renderMenus();
    const rm=$('#rowMenu'),r=el.getBoundingClientRect();rm.hidden=false;const w=rm.offsetWidth,hh=rm.offsetHeight;
    rm.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+'px';rm.style.top=(r.bottom+4+hh>innerHeight?Math.max(8,r.top-hh-4):r.bottom+4)+'px';return}
  if(el=q('[data-hide]')){const k=el.dataset.hide;state.hidden.has(k)?state.hidden.delete(k):state.hidden.add(k);state.edited=true;renderAll();return}
  if(el=q('#tplSave')){const name=$('#tplNew').value.trim();if(!name){$('#tplNew').focus();return}
    const t={id:'u'+Date.now(),name,owner:$('#tplShare').value,lanes:[...state.lanes],hide:[...state.hidden],labs:[...state.labs],spec:state.spec};state.user.push(t);state.tpl=t.id;state.edited=false;closeMenus();renderAll();return}
  if(el=q('[data-tpl]')){closeMenus();applyTemplate(el.dataset.tpl);return}
  if(el=q('[data-mod]')){toggle(state.lanes,el.dataset.mod);state.edited=true;renderAll();return}
  if(!q('.pop')&&!q('#rowMenu'))closeMenus();
  if(el=q('#dClose')){closeDetail();return}
  if(el=q('[data-center]')){const t=+el.dataset.center;setDomain(t-20,t+20);return}
  if(el=q('[data-ev]')){tip.hidden=true;openDetail(el.dataset.ev);return}
  if(el=q('[data-mode]')){const k=el.dataset.mode;state.mode[k]=state.mode[k]==='num'?'graph':'num';renderAll();return}
  if(el=q('[data-collapse]')){const k=el.dataset.collapse;state.closed.has(k)?state.closed.delete(k):state.closed.add(k);renderAll();return}
  if(el=q('[data-range]')){const k=el.dataset.range;k==='all'?setDomain(0,END):setDomain(NOW-(+k),END);return}
  if(el=q('[data-lab]')){const k=el.dataset.lab,on=!state.labs.includes(k);toggle(state.labs,k);if(on)(LABGROUPS[k].needs||[]).forEach(n=>{if(!state.labs.includes(n))state.labs.splice(state.labs.indexOf(k),0,n)});state.edited=true;renderAll();return}
  if(el=q('[data-day]')){const i=+el.dataset.day,id='d'+i;if(state.chapter===id)setDomain(0,END);else setDomain(i*24-3,Math.min(i*24+27,END),id);return}
  if(el=q('[data-fmt]')){const [k,v]=el.dataset.fmt.split(':');state.fmt[k]=v;const sy=scrollY;renderAll();scrollTo(0,sy);return}
  if(el=q('[data-copy]')){const kd=el.dataset.copy,pre=kd==='days'?{textContent:dayText()}:$('#note-'+kd),sel=kd==='days'?$('#chapters'):pre,done=()=>{el.textContent='Copied';setTimeout(()=>el.textContent='Copy',1400)};
    const fb=()=>{const r=document.createRange();r.selectNodeContents(sel);const s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy')}catch(_){}done()};
    try{navigator.clipboard.writeText(pre.textContent).then(done,fb)}catch(_){fb()}return}
  if(el=q('[data-open]')){const k=el.dataset.open;state.open[k]=!state.open[k];renderAll();return}
  if(el=q('[data-mgroup]')){state.medGroup=el.dataset.mgroup;state.edited=true;renderAll();return}
  if(el=q('[data-gcol]')){const k=el.dataset.gcol;state.gclosed.has(k)?state.gclosed.delete(k):state.gclosed.add(k);state.edited=true;renderAll();return}
  if(el=q('[data-astf]')){state.astf=el.dataset.astf;const sy=scrollY;renderAll();scrollTo(0,sy);return}
  if(el=q('[data-scope]')){const nx=SCOPES.findIndex(x=>x[0]===el.dataset.scope),cur=SCOPES.findIndex(x=>x[0]===state.scope),sc=SCOPES[nx];if(state.fetching||nx===cur)return;
    if(nx<cur){state.scope=sc[0];renderAll();return}
    state.fetching={label:'Fetching '+(sc[0]==='all'?'all earlier records':sc[1]+' before admission')+'… wider ranges take longer.',ms:sc[3]};{const sy=scrollY;renderAll();scrollTo(0,sy)}
    setTimeout(()=>{state.scope=sc[0];state.fetching=null;const sy=scrollY;renderAll();scrollTo(0,sy)},sc[3]);return}
  if(el=q('[data-ce]')){if(state.fetching)return;state.fetching={label:'Requesting outside records… this is the slowest fetch.',ms:5000};renderScope();setTimeout(()=>{state.ce=true;state.fetching=null;renderAll()},5000);return}
  if(el=q('[data-spec]')){state.spec=el.dataset.spec;renderAll();return}
  if(el=q('[data-ask]')){const i=+el.dataset.ask;state.ask=state.ask===i?null:i;renderAsk();return}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeMenus();closeDetail()}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[data-ev][tabindex]')){e.preventDefault();openDetail(e.target.dataset.ev)}});
let rmY=0;addEventListener('scroll',()=>{const t_=document.getElementById('tip');if(t_)t_.hidden=true;if(state.rowMenu&&Math.abs(scrollY-rmY)>80){$('#rowMenu').hidden=true;state.rowMenu=null}},{passive:true});

/* hover: full note or result for events, dose for squares; crosshair for readouts */
const tip=$('#tip');let raf=0,lastCard=null,hotEp=null;
const fxEp=id=>$$('.epfx').forEach(el=>el.classList.toggle('on',el.dataset.ep===id||el.dataset.ep===state.sel));
function placeTip(e){const w=tip.offsetWidth,hh=tip.offsetHeight;let x=e.clientX+14,y=e.clientY+16;if(x+w>innerWidth-8)x=e.clientX-w-12;if(y+hh>innerHeight-8)y=Math.max(8,e.clientY-hh-12);tip.style.left=Math.max(8,x)+'px';tip.style.top=y+'px'}
document.addEventListener('pointermove',e=>{
  const c=e.target.closest?.('[data-card]'),t=c?null:e.target.closest?.('[data-tip]');
  const hot=c&&EV[c.dataset.card]&&EV[c.dataset.card].ep?c.dataset.card:null;if(hot!==hotEp){hotEp=hot;fxEp(hot)}
  if(c&&c.dataset.card!==state.sel){if(lastCard!==c.dataset.card){lastCard=c.dataset.card;tip.className='card';tip.innerHTML=cardHTML(lastCard)}tip.hidden=false;placeTip(e)}
  else if(t){lastCard=null;tip.className='';tip.innerHTML=t.dataset.tip.split('|').map((l,i)=>i?`<div>${esc(l)}</div>`:`<b>${esc(l)}</b>`).join('');tip.hidden=false;placeTip(e)}
  else{lastCard=null;tip.hidden=true}
  const w=e.target.closest?.('.wrap');
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{if(!w){setCursor(null);return}const x=e.clientX-w.getBoundingClientRect().left-PREW;if(x<0||x>W)setCursor(null);else setCursor(d0+x/W*(d1-d0))})});
document.addEventListener('pointerleave',()=>{tip.hidden=true;setCursor(null)});
document.addEventListener('focusin',e=>{const c=e.target.closest?.('[data-card]');if(c&&e.target.matches(':focus-visible')){tip.className='card';tip.innerHTML=cardHTML(c.dataset.card);tip.hidden=false;const r=c.getBoundingClientRect();placeTip({clientX:r.right,clientY:r.bottom})}});
document.addEventListener('focusout',()=>{tip.hidden=true});

/* drag-to-zoom on the day ruler */
(()=>{const ax=$('#axis');let br=null;
  ax.addEventListener('pointerdown',e=>{const svg=$('svg:not(.hp)',ax);if(!svg||e.button)return;const r=svg.getBoundingClientRect(),x=e.clientX-r.left;if(x<0||x>W)return;br={x0:x,x1:x,left:r.left};try{ax.setPointerCapture(e.pointerId)}catch(_){}});
  ax.addEventListener('pointermove',e=>{if(!br)return;br.x1=Math.min(Math.max(e.clientX-br.left,0),W);const b=$('.brush',ax);if(!b)return;b.setAttribute('x',Math.min(br.x0,br.x1));b.setAttribute('width',Math.abs(br.x1-br.x0));b.style.display=''});
  const up=()=>{if(!br)return;const a=Math.min(br.x0,br.x1),b=Math.max(br.x0,br.x1);br=null;if(b-a>8)setDomain(d0+a/W*(d1-d0),d0+b/W*(d1-d0));else{const r=$('.brush',ax);if(r)r.style.display='none'}};
  ax.addEventListener('pointerup',up);ax.addEventListener('pointercancel',()=>{br=null});
  ax.addEventListener('dblclick',()=>setDomain(0,END))})();

let lastW=0;new ResizeObserver(()=>{const w=$('#tl').clientWidth;if(Math.abs(w-lastW)>1){lastW=w;requestAnimationFrame(renderAll)}}).observe($('#tl'));
applyTemplate('ugib');
