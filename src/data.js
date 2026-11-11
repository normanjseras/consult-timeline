/* =====================================================================
   SYNTHETIC DATA. One invented admission. Time is hours since 00:00 on hospital day 1.
   ===================================================================== */
const T=(d,h=0,m=0)=>(d-1)*24+h+m/60;
const ADMIT=T(1,2,10), NOW=T(12,9), END=T(12,18);

/* ---- ADT ---- */
const LOC=[
  {s:ADMIT,e:T(1,5),unit:'ED',kind:'ed',team:'Emergency'},
  {s:T(1,5),e:T(3,13),unit:'MICU',kind:'icu',team:'MICU'},
  {s:T(3,13),e:T(5,2),unit:'5 West',kind:'floor',team:'Medicine C'},
  {s:T(5,2),e:T(7,11),unit:'MICU',kind:'icu',team:'MICU'},
  {s:T(7,11),e:NOW,unit:'5 West',kind:'floor',team:'Medicine C'},
];

/* ---- consulting services ---- */
const CONSULTS=[
  {id:'c_gi',svc:'GI / Hepatology',s:T(1,3),e:null,init:T(1,3,20),q:'Hematemesis in known cirrhosis. Emergent endoscopy?',
   a:'Acute variceal hemorrhage with hemodynamic instability.',
   recs:['Octreotide and ceftriaxone already started; continue','Intubate for airway protection, EGD within 12 hours','Transfuse to hemoglobin 7 g/dL, avoid over-resuscitation','Hold beta-blocker while on vasopressors']},
  {id:'c_id',svc:'Infectious Diseases',s:T(5,9,30),e:null,init:T(5,10,15),q:'Gram-negative rod bacteremia with septic shock.',
   a:'ESBL-producing Klebsiella pneumoniae bacteremia, pulmonary source favored (right lower lobe pneumonia after intubation).',
   recs:['Change piperacillin-tazobactam to meropenem','Stop vancomycin; MRSA nares PCR negative','Repeat blood cultures daily until negative','Remove right IJ catheter; TTE']},
  {id:'c_neph',svc:'Nephrology',s:T(5,14),e:T(9,12),init:T(5,15,30),q:'AKI, creatinine 1.1 to 1.9. Hepatorenal versus ATN?',
   a:'AKI in septic shock with cirrhosis. Bland sediment and low urine sodium favor hepatorenal physiology over ATN.',
   recs:['Albumin 1 g/kg daily for 2 days','Hold diuretics, avoid nephrotoxins and further contrast','Reassess for vasoconstrictor therapy if no response'],off:'Signed off HD9, creatinine 1.4 and falling'},
  {id:'c_ir',svc:'Interventional Radiology',s:T(8,8,30),e:T(8,12),init:T(8,9),q:'PICC for IV antibiotics.',
   a:'Blood cultures negative since HD6. Appropriate for PICC.',recs:['PICC placed HD8 11:00'],off:'Completed HD8'},
  {id:'c_add',svc:'Addiction Medicine',s:T(8,10),e:null,init:T(8,13),q:'Alcohol use disorder, treatment planning before discharge.',
   a:'Severe alcohol use disorder, motivated to stop.',recs:['Start counseling on the unit','Medication choice deferred until liver tests are explained','Arrange intensive outpatient program']},
];

/* ---- flowsheet vitals: piecewise targets + seeded noise ---- */
const VA=[ // t, HR, MAP, Temp, SpO2, RR
  [ADMIT,122,56,36.4,95,24],[T(1,4),118,54,36.2,94,26],[T(1,6),108,66,36.3,99,16],[T(1,12),96,70,36.8,99,16],
  [T(2,0),88,72,37.0,98,16],[T(2,16),84,76,37.1,97,18],[T(3,13),80,78,36.9,96,18],[T(4,6),86,76,37.4,95,18],
  [T(4,12),104,72,38.6,93,22],[T(4,20),112,68,39.1,92,24],[T(5,2),124,52,38.8,90,28],[T(5,6),116,64,38.4,94,24],
  [T(5,18),104,68,38.0,95,22],[T(6,8),96,72,37.6,96,20],[T(7,0),88,76,37.2,96,18],[T(8,0),82,78,36.9,97,16],
  [T(9,0),78,80,36.8,97,16],[T(10,10),80,78,36.8,97,16],[T(10,12),94,71,36.9,97,18],[T(10,15),104,66,36.8,97,20],
  [T(10,22),88,74,36.9,97,16],[T(11,12),80,77,36.8,97,16],[NOW,76,78,36.8,97,16],
];
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const _r=rng(11), gauss=()=>{let u=0;for(let i=0;i<4;i++)u+=_r();return(u-2)/0.577};
function vAt(t,i){let k=0;while(k<VA.length-2&&VA[k+1][0]<=t)k++;const a=VA[k],b=VA[k+1];const f=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));return a[i]+(b[i]-a[i])*f}
const vit={HR:[],MAP:[],Temp:[],SpO2:[],RR:[]};
for(const seg of LOC){const step=seg.kind==='floor'?4:1;for(let t=seg.s;t<(seg.e>=NOW?NOW+0.01:seg.e-0.01);t+=step){
  vit.HR.push([t,Math.round(vAt(t,1)+gauss()*3)]);
  vit.MAP.push([t,Math.round(vAt(t,2)+gauss()*2)]);
  vit.Temp.push([t,Math.round((vAt(t,3)+gauss()*0.14)*10)/10]);
  vit.SpO2.push([t,Math.min(100,Math.round(vAt(t,4)+gauss()*0.9))]);
  vit.RR.push([t,Math.round(vAt(t,5)+gauss()*1.4)]);
}}

/* ---- labs ---- */
const daily=arr=>arr.map((v,i)=>[i?T(i+1,4):T(1,2,25),v]);
const plus=(a,x)=>[...a,...x].sort((p,q)=>p[0]-q[0]);
const A={
  AST:[96,128,88,72,104,248,172,126,138,162,188,204],
  ALT:[44,62,54,46,52,112,96,88,104,148,196,214],
  ALP:[118,104,110,116,122,128,142,186,264,348,426,482],
  Tbili:[3.4,3.8,3.2,3.0,3.6,4.4,4.6,5.2,6.1,6.9,7.6,8.2],
  INR:[2.1,1.8,1.7,1.7,2.2,2.3,2.0,1.9,1.9,1.9,2.0,2.0],
  Cr:[1.3,1.2,1.0,1.1,1.9,2.4,2.2,1.7,1.4,1.2,1.2,1.1],
  Na:[131,133,134,133,130,129,131,132,133,133,134,134],
  BUN:[48,36,28,24,34,46,44,36,30,28,38,30],
  WBC:[9.8,8.4,7.6,8.9,21.4,18.2,13.6,10.4,8.8,8.1,7.9,7.4],
  Plt:[41,58,52,61,44,39,47,58,66,71,74,78],
};
const S={
  HR:{label:'HR',unit:'bpm',lo:60,hi:100,dec:0,pts:vit.HR},
  MAP:{label:'MAP',unit:'mmHg',lo:65,hi:105,dec:0,pts:vit.MAP},
  Temp:{label:'Temp',unit:'°C',lo:36,hi:38,dec:1,pts:vit.Temp},
  SpO2:{label:'SpO₂',unit:'%',lo:92,hi:100,dec:0,pts:vit.SpO2},
  RR:{label:'RR',unit:'/min',lo:12,hi:20,dec:0,pts:vit.RR},
  Hgb:{label:'Hgb',unit:'g/dL',lo:13.5,hi:17.5,dec:1,dots:1,pts:[
    [T(1,2,25),6.4],[T(1,5,30),7.3],[T(1,9),8.2],[T(1,15),8.0],[T(2,4),8.3],[T(2,16),8.2],[T(3,4),8.4],[T(4,4),8.1],[T(4,13),7.9],
    [T(5,3),6.8],[T(5,10),7.8],[T(5,18),7.7],[T(6,4),7.9],[T(7,4),8.0],[T(8,4),8.2],[T(9,4),8.4],[T(10,4),8.3],[T(10,13),6.7],
    [T(10,20),8.6],[T(11,4),8.4],[T(11,16),8.5],[T(12,4),8.6]]},
  Plt:{label:'Plt',unit:'K/µL',lo:150,hi:400,dec:0,dots:1,pts:plus(daily(A.Plt),[[T(1,9),66]])},
  WBC:{label:'WBC',unit:'K/µL',lo:4,hi:11,dec:1,dots:1,pts:plus(daily(A.WBC),[[T(4,13),16.8]])},
  INR:{label:'INR',unit:'',lo:0.9,hi:1.1,dec:1,dots:1,pts:daily(A.INR)},
  BUN:{label:'BUN',unit:'mg/dL',lo:7,hi:20,dec:0,dots:1,pts:plus(daily(A.BUN),[[T(10,13),41]])},
  Cr:{label:'Cr',unit:'mg/dL',lo:0.7,hi:1.3,dec:1,dots:1,pts:daily(A.Cr)},
  Na:{label:'Na',unit:'mmol/L',lo:135,hi:145,dec:0,dots:1,pts:daily(A.Na)},
  Lac:{label:'Lactate',unit:'mmol/L',lo:0.5,hi:2.0,dec:1,dots:1,pts:[[T(1,2,25),4.8],[T(1,6),3.6],[T(1,12),2.4],[T(2,4),1.6],[T(5,2,30),4.2],[T(5,8),3.1],[T(5,16),2.2],[T(6,4),1.5],[T(10,13,30),2.1]]},
  AST:{label:'AST',unit:'U/L',lo:10,hi:40,dec:0,dots:1,pts:daily(A.AST)},
  ALT:{label:'ALT',unit:'U/L',lo:10,hi:40,dec:0,dots:1,pts:daily(A.ALT)},
  ALP:{label:'ALP',unit:'U/L',lo:40,hi:130,dec:0,dots:1,pts:daily(A.ALP)},
  Tbili:{label:'T bili',unit:'mg/dL',lo:0.2,hi:1.2,dec:1,dots:1,pts:daily(A.Tbili)},
  MELD:{label:'MELD 3.0',unit:'derived',dec:0,dots:1,pts:[]}, // filled once A.Alb and meld3() are defined below
};
for(const k in S)S[k].key=k;
const LABGROUPS={
  cbc:{name:'CBC',keys:['WBC','Plt']},
  chem:{name:'Chemistry',keys:['Na','Cr','BUN']},
  bleed:{name:'Bleed panel',keys:['Plt','INR','BUN','Lac']},
  liver:{name:'Liver panel',keys:['AST','ALT','ALP','Tbili']},
  meld:{name:'MELD',keys:['INR','Cr','Na','MELD']},
  infection:{name:'Infection',keys:['WBC','Lac','Cr']},
};

/* ---- drips and organ support ---- */
const steps=a=>a.slice(0,-1).map((p,i)=>({s:p[0],e:a[i+1][0],v:p[1]}));
const SUPPORT=[
  {key:'norepi',label:'Norepinephrine',unit:'mcg/kg/min',dec:2,max:0.14,segs:[
    ...steps([[T(1,4,45),.08],[T(1,6),.14],[T(1,10),.10],[T(1,16),.06],[T(2,2),.03],[T(2,10),0]]),
    ...steps([[T(5,2,30),.06],[T(5,4),.12],[T(5,10),.10],[T(5,18),.06],[T(6,2),.03],[T(6,8),0]])]},
  {key:'vaso',label:'Vasopressin',unit:'units/min',dec:2,max:0.03,segs:[{s:T(1,6,30),e:T(1,20),v:.03}]},
  {key:'octreo',label:'Octreotide',unit:'mcg/h',dec:0,max:50,segs:[{s:T(1,2,40),e:T(4,2,40),v:50}]},
  {key:'propofol',label:'Propofol',unit:'mcg/kg/min',dec:0,max:40,segs:steps([[T(1,4,30),40],[T(1,12),30],[T(2,6),20],[T(2,12),0]])},
  {key:'fentanyl',label:'Fentanyl',unit:'mcg/h',dec:0,max:50,segs:steps([[T(1,4,30),50],[T(2,8),25],[T(2,14),0]])},
  {key:'vent',label:'Ventilator',unit:'',text:1,segs:[{s:T(1,4,30),e:T(1,12),t:'VC · FiO₂ 0.50 · PEEP 5'},{s:T(1,12),e:T(2,9),t:'VC · FiO₂ 0.40 · PEEP 5'},{s:T(2,9),e:T(2,16),t:'PS 5/5 · FiO₂ 0.30'}]},
  {key:'o2',label:'Oxygen',unit:'',text:1,segs:[{s:T(2,16),e:T(3,8),t:'NC 2 L'},{s:T(4,14),e:T(5,3),t:'NC 3 L'},{s:T(5,3),e:T(6,6),t:'HFNC 40 L · 0.50'},{s:T(6,6),e:T(7,18),t:'NC 2 L'}]},
];

/* ---- scheduled medications (MAR) ---- */
const MEDS=[
  {id:'ctx',name:'Ceftriaxone',dose:'1 g IV q24h',cat:'abx',amt:1,u:'g',rt:'IV',segs:[{s:T(1,2,45),e:T(4,15),every:24}]},
  {id:'ptz',name:'Piperacillin-tazobactam',dose:'4.5 g IV q8h',cat:'abx',amt:4.5,u:'g',rt:'IV',segs:[{s:T(4,15),e:T(5,11),every:8}]},
  {id:'vanc',name:'Vancomycin',dose:'1 g IV q12h, by level',cat:'abx',amts:[1250,1000,1000],u:'mg',rt:'IV',segs:[{s:T(4,15,30),e:T(5,18),every:12}]},
  {id:'mero',name:'Meropenem',dose:'1 g IV q8h',cat:'abx',amt:1,u:'g',rt:'IV',segs:[{s:T(5,11),e:null,every:8}],plan:T(13,11)},
  {id:'ppi',name:'Pantoprazole',dose:'40 mg IV q12h / PO daily',cat:'gi',amt:40,u:'mg',rt:'',segs:[{s:T(1,2,40),e:T(4,9),every:12,d:'40 mg IV q12h'},{s:T(4,9),e:T(10,14),every:24,d:'40 mg PO daily'},{s:T(10,14),e:null,every:12,d:'40 mg IV q12h'}]},
  {id:'lact',name:'Lactulose',dose:'20 g PO q8h',cat:'gi',amt:20,u:'g',rt:'PO',segs:[{s:T(2,18),e:null,every:8}]},
  {id:'rif',name:'Rifaximin',dose:'550 mg PO q12h',cat:'gi',amt:550,u:'mg',rt:'PO',segs:[{s:T(3,9),e:null,every:12}]},
  {id:'alb',name:'Albumin 25%',dose:'1 g/kg IV daily',cat:'gi',amt:75,u:'g',rt:'IV',segs:[{s:T(5,16),e:T(7,10),every:24}]},
  {id:'carv',name:'Carvedilol',dose:'3.125 mg PO q12h',cat:'gi',amt:3.125,u:'mg',rt:'PO',segs:[{s:T(8,18),e:T(10,13),every:12},{s:T(11,9),e:null,every:12}],held:[{s:T(10,13),e:T(11,9),why:'Held for rebleed'}]},
  {id:'apap',name:'Acetaminophen',dose:'650 mg PO q6h PRN',cat:'prn',amt:650,u:'mg',rt:'PO',prn:[T(4,12,30),T(4,20),T(5,4),T(5,12),T(5,21),T(6,6)],segs:[]},
];
for(const m of MEDS){m.adm=m.prn?[...m.prn]:[];for(const g of m.segs){const e=Math.min(g.e??NOW,NOW);for(let t=g.s;t<e-0.01;t+=g.every)m.adm.push(t)}m.adm.sort((a,b)=>a-b);m.first=m.adm[0];m.last=m.adm[m.adm.length-1];m.on=m.segs.some(g=>g.e==null)}
for(const m of MEDS){m.heldAdm=[];(m.held||[]).forEach(hh=>{const g=m.segs.filter(x=>x.s<=hh.s).pop();if(!g)return;for(let t=g.s;t<hh.e;t+=g.every)if(t>=hh.s-0.01)m.heldAdm.push(t)})}
const MEDCLASS=[['abx','Antimicrobial'],['gi','GI and hepatic'],['prn','Antipyretics']];

/* ---- blood products. t = bedside administration start ---- */
const TX=[
  {id:'tx1',prod:'pRBC',t:T(1,2,50),dur:20/60,where:'ED',vol:320},
  {id:'tx2',prod:'pRBC',t:T(1,3,30),dur:25/60,where:'ED',vol:310},
  {id:'tx3',prod:'pRBC',t:T(1,6,15),dur:1,where:'MICU',vol:335},
  {id:'tp1',prod:'Platelets',t:T(1,6,30),dur:.5,where:'MICU',vol:250},
  {id:'tx4',prod:'pRBC',t:T(5,4,15),dur:1.5,where:'MICU',vol:330},
  {id:'tx5',prod:'pRBC',t:T(10,14),dur:1+40/60,where:'5 West',vol:325},
  {id:'tx6',prod:'pRBC',t:T(10,16,30),dur:1+50/60,where:'5 West',vol:340},
];
TX.forEach(u=>u.end=u.t+u.dur);
const RBC=TX.filter(u=>u.prod==='pRBC');
const EPIS=[];
for(const u of RBC){const last=EPIS[EPIS.length-1];
  const drawnBetween=last&&S.Hgb.pts.some(p=>p[0]>last.units[last.units.length-1].t&&p[0]<u.t);
  if(last&&!drawnBetween)last.units.push(u);else EPIS.push({units:[u]})}
EPIS.forEach((ep,i)=>{ep.id='ep'+i;ep.s=ep.units[0].t;ep.e=Math.max(...ep.units.map(u=>u.end));
  ep.pre=[...S.Hgb.pts].reverse().find(p=>p[0]<ep.s);ep.post=S.Hgb.pts.find(p=>p[0]>=ep.e+0.25);
  ep.n=ep.units.length;ep.delta=ep.post[1]-ep.pre[1];ep.low=ep.delta/ep.n<0.6;ep.units.forEach(u=>u.ep=ep)});

/* ---- imaging ---- */
const IMAGING=[
  {id:'im1',t:T(1,3,5),short:'CXR',title:'XR chest, portable',src:'Radiology report',body:'No focal consolidation, effusion, or pneumothorax. No free air under the diaphragm.'},
  {id:'im2',t:T(1,5,10),short:'CXR',title:'XR chest, portable (after intubation)',src:'Radiology report',body:'Endotracheal tube tip 4 cm above the carina. Right internal jugular catheter tip at the cavoatrial junction. No pneumothorax.'},
  {id:'im3',t:T(1,11,20),short:'US abdomen + Doppler',title:'US abdomen complete with Doppler',src:'Radiology report',body:'Cirrhotic liver morphology without a focal lesion. Main portal vein patent with hepatopetal flow. Splenomegaly, 15.8 cm. Moderate ascites. Gallbladder wall thickening without stones. Common bile duct 4 mm.'},
  {id:'im4',t:T(4,14,20),short:'CXR',title:'XR chest, 2 views',src:'Radiology report',body:'New right lower lobe consolidation. Small right pleural effusion.'},
  {id:'im5',t:T(5,5,40),short:'CT chest/abd/pelvis',title:'CT chest, abdomen and pelvis with IV contrast',src:'Radiology report',body:'Right lower lobe consolidation with air bronchograms, consistent with pneumonia. No intra-abdominal abscess or bowel ischemia. Cirrhosis with gastroesophageal varices, splenomegaly and moderate ascites. No biliary ductal dilation. Portal and hepatic veins patent.'},
  {id:'im6',t:T(6,13,30),short:'TTE',title:'Transthoracic echocardiogram',src:'Cardiology · echo report',body:'Hyperdynamic left ventricle, ejection fraction 65 to 70%. No valvular vegetation seen. No pericardial effusion.'},
  {id:'im7',t:T(9,10,15),short:'US RUQ',title:'US abdomen limited, right upper quadrant',src:'Radiology report',body:'New layering echogenic sludge in the gallbladder without shadowing stones. Common bile duct 5 mm. No intrahepatic biliary ductal dilation. Hepatic vasculature patent.'},
  {id:'im8',t:T(12,13),short:'MRCP',title:'MR abdomen with MRCP',src:'Order',pending:1,body:'Ordered HD11 16:40. Scheduled today at 13:00. Not yet performed.'},
];

/* ---- procedures, merged from endoscopy, IR, and bedside procedure notes ---- */
const PROCS=[
  {id:'pr1',t:T(1,4,30),short:'Intubation',title:'Endotracheal intubation',src:'Anesthesia procedure note',body:'Rapid sequence intubation for airway protection before emergent endoscopy. Grade 1 view. 7.5 tube secured at 23 cm.'},
  {id:'pr2',t:T(1,4,55),short:'Central line',title:'Central venous catheter, right internal jugular',src:'Bedside procedure note · MICU',body:'Ultrasound-guided triple-lumen catheter. Position confirmed on chest radiograph.'},
  {id:'pr3',t:T(1,7,30),short:'EGD, 5 bands',title:'EGD with variceal band ligation',src:'Endoscopy report',body:'Three columns of large esophageal varices with red wale signs. Active oozing from one column 2 cm above the gastroesophageal junction. Five bands placed with hemostasis. Mild portal hypertensive gastropathy. No gastric varices. Normal duodenum.'},
  {id:'pr4',t:T(2,10,30),short:'Paracentesis',title:'Diagnostic paracentesis',src:'Bedside procedure note · MICU',body:'60 mL of straw-colored fluid from the left lower quadrant under ultrasound guidance. Sent for cell count, albumin, total protein and culture.'},
  {id:'pr5',t:T(2,16),short:'Extubation',title:'Extubation',src:'Respiratory therapy note',body:'Passed a spontaneous breathing trial. Extubated to 2 L nasal cannula.'},
  {id:'pr6',t:T(5,3,10),short:'Arterial line',title:'Arterial line, left radial',src:'Bedside procedure note · MICU',body:'Placed for hemodynamic monitoring on vasopressors.'},
  {id:'pr7',t:T(6,15),short:'Central line out',title:'Central venous catheter removed',src:'Nursing procedure note',body:'Right internal jugular catheter removed after 5.4 days at the request of Infectious Diseases. Tip not cultured.'},
  {id:'pr8',t:T(8,11),short:'PICC (IR)',title:'PICC placement, right basilic vein',src:'Interventional Radiology report',body:'Fluoroscopy-guided 4 Fr single-lumen PICC, 41 cm, tip at the cavoatrial junction. Placed after blood cultures had been negative for 48 hours.'},
  {id:'pr9',t:T(10,17,30),short:'EGD',title:'EGD, diagnostic',src:'Endoscopy report',body:'Post-banding ulcer in the distal esophagus with adherent clot and no active bleeding. Two residual small varices, not banded. No blood in the stomach or duodenum. No endoscopic therapy.'},
];

/* ---- microbiology ---- */
const MICRO=[
  {id:'mc1',t:T(2,10,30),short:'Ascites',title:'Ascitic fluid cell count and culture',spec:'Ascitic fluid',res:'neg',result:'No growth, final',body:'180 nucleated cells/µL, 22% neutrophils (40 PMN/µL). Culture: no growth, final at 5 days.'},
  {id:'mc2',t:T(4,13,10),short:'Blood ×2',title:'Blood cultures, 2 sets',spec:'Blood, peripheral and R IJ',res:'pos',result:'K. pneumoniae (ESBL), 2 of 2 sets',body:'Both sets positive. Gram-negative rods at 9.5 hours. Rapid panel HD5 01:05: Klebsiella pneumoniae, CTX-M detected. Final identification and susceptibilities HD6 09:10.'},
  {id:'mc3',t:T(4,13,30),short:'Urine',title:'Urinalysis and urine culture',spec:'Urine, clean catch',res:'neg',result:'No growth, final',body:'No pyuria. Culture: no growth, final.'},
  {id:'mc4',t:T(4,15),short:'MRSA nares',title:'MRSA nares PCR',spec:'Nares swab',res:'neg',result:'Not detected',body:'MRSA not detected.'},
  {id:'mc5',t:T(4,16),short:'Sputum',title:'Sputum Gram stain and culture',spec:'Sputum, expectorated',res:'pos',result:'K. pneumoniae (ESBL), moderate growth',body:'Gram stain: many neutrophils, few epithelial cells, gram-negative rods. Culture: moderate growth of Klebsiella pneumoniae with the same susceptibility profile as the blood isolate, plus normal respiratory flora.'},
  {id:'mc6',t:T(5,9),short:'Blood ×2',title:'Blood cultures, 2 sets',spec:'Blood, peripheral ×2',res:'pos',result:'K. pneumoniae (ESBL), 1 of 2 sets',body:'One of two sets positive. Drawn two hours before the first meropenem dose.'},
  {id:'mc7',t:T(6,9),short:'Blood ×2',title:'Blood cultures, 2 sets',spec:'Blood, peripheral ×2',res:'neg',result:'No growth, final',body:'No growth, final at 5 days. First negative set.'},
  {id:'mc8',t:T(8,6),short:'Blood ×2',title:'Blood cultures, 2 sets',spec:'Blood, peripheral ×2',res:'neg',result:'No growth at 4 days',body:'No growth at 4 days, preliminary.'},
  {id:'mc9',t:T(9,11),short:'C. difficile',title:'C. difficile PCR',spec:'Stool',res:'neg',result:'Not detected',body:'Toxin gene not detected.'},
];
const SUSC=[['Ampicillin','≥32','R'],['Ampicillin-sulbactam','≥32/16','R'],['Cefazolin','≥64','R'],['Ceftriaxone','≥64','R','ctx'],['Cefepime','16','R'],
  ['Piperacillin-tazobactam','16/4','SDD','ptz'],['Ertapenem','≤0.5','S'],['Meropenem','≤0.25','S','mero'],['Ciprofloxacin','≥4','R'],['Gentamicin','≤1','S'],['Amikacin','≤2','S'],['TMP-SMX','≥4/76','R']];
const DEVICES=[
  {label:'Endotracheal tube',s:T(1,4,30),e:T(2,16)},
  {label:'Central line, R IJ',s:T(1,4,55),e:T(6,15)},
  {label:'Urinary catheter',s:T(1,5),e:T(3,10)},
  {label:'Urinary catheter',s:T(5,3),e:T(7,9)},
  {label:'Arterial line, L radial',s:T(5,3,10),e:T(7,10)},
  {label:'PICC, R basilic',s:T(8,11),e:null},
];

/* ---- liver injury module ---- */
const ULN={ALT:40,AST:40,ALP:130,Tbili:1.2};
const LT='https://www.ncbi.nlm.nih.gov/books/';
const CAND=[ // LiverTox likelihood categories and presentations verified against the NIH chapters, 10 Nov 2026
  {name:'Ceftriaxone',med:'ctx',score:'B',url:LT+'NBK548258/',typ:'Biliary sludge within days; rare cholestatic hepatitis at 1 to 4 weeks.',read:'Timing compatible. New gallbladder sludge on the HD9 ultrasound matches the described pseudolithiasis.'},
  {name:'Piperacillin-tazobactam',med:'ptz',score:'B',url:LT+'NBK548825/',typ:'Cholestatic or mixed; onset 1 to 3 weeks after starting, often after stopping.',read:'Pattern compatible. Latency is shorter than the usual 1 to 3 weeks, though onset after stopping is described.'},
  {name:'Vancomycin',med:'vanc',score:'A',url:LT+'NBK548881/',typ:'With hypersensitivity, mostly DRESS, after 2 to 4 weeks of IV therapy.',read:'Three doses only. The described injury follows weeks of continuous therapy.'},
  {name:'Meropenem',med:'mero',score:'D',url:LT+'NBK547861/',typ:'Rare cholestatic jaundice, usually after 1 to 3 weeks of therapy.',read:'ALP was already climbing two days after the first dose. Still being given.'},
  {name:'Pantoprazole',med:'ppi',score:'C',url:LT+'NBK548461/',typ:'Hepatocellular; generally within the first 4 weeks.',read:'Expected pattern is hepatocellular. This injury is cholestatic.'},
  {name:'Acetaminophen',med:'apap',score:'A[HD]',url:LT+'NBK548162/',typ:'Hepatocellular and dose-dependent; transient ALT rises after 3 to 7 days at 4 g daily.',read:'3.9 g in total over 3 days. Dose-dependent injury would not be expected.'},
  {name:'Octreotide',drip:'octreo',score:'C',url:LT+'NBK547947/',typ:'ALT and AST predominant; onset generally within 1 to 6 months.',read:'72-hour infusion. Reported latency is months.'},
  {name:'Propofol',drip:'propofol',score:'A[H] / D',url:LT+'NBK547909/',typ:'Idiosyncratic hepatocellular injury days to weeks after anesthesia; infusion syndrome with high doses over days.',read:'32-hour infusion at conventional doses. Expected pattern is hepatocellular.'},
  {name:'Carvedilol',med:'carv',score:'D',url:LT+'NBK548399/',typ:'Single case report; onset at 6 months, mixed pattern.',read:'Started after ALP had begun to rise.'},
  {name:'Rifaximin',med:'rif',score:'E',url:LT+'NBK548082/',typ:'Little evidence of liver injury.',read:'Not expected.'},
  {name:'Lactulose',med:'lact',score:'–',url:null,typ:'No LiverTox chapter.',read:'Not expected.'},
];
const COMPETE=[
  {st:'flag',t:'Hypoperfusion',d:'MAP below 60 mmHg on HD1 and again on HD5, found automatically in the flowsheet. AST peaked at 248 on HD6 and fell, which fits a separate, earlier hit.'},
  {st:'flag',t:'Sepsis-associated cholestasis',d:'Klebsiella bacteremia HD4 to HD5. Blood cultures negative since HD6, and ALP kept rising afterwards.'},
  {st:'part',t:'Biliary obstruction',d:'Ultrasound HD9: no ductal dilation, new gallbladder sludge. MRCP scheduled today at 13:00.'},
  {st:'neg',t:'Portal or hepatic vein thrombosis',d:'Doppler HD1, CT HD5 and ultrasound HD9: vessels patent.'},
  {st:'pend',t:'Viral hepatitis',d:'HAV IgM, HBsAg, anti-HBc IgM and HCV RNA sent HD11, pending. HEV not sent.'},
  {st:'part',t:'Alcohol-associated hepatitis',d:'Last drink the day before admission. AST to ALT ratio was 2.2 on admission and is 1.0 now.'},
  {st:'none',t:'Autoimmune hepatitis',d:'ANA, smooth muscle antibody and IgG not sent.'},
  {st:'neg',t:'Parenteral nutrition',d:'None this encounter.'},
];

/* ---- course outline ---- */
const CHAPTERS=[
  {id:'ch1',s:T(1,0),e:T(3,13),t:'Variceal hemorrhage',d:'Hematemesis with shock. Intubated, EGD with 5 bands, 3 units of red cells. Extubated HD2, to the floor HD3.'},
  {id:'ch2',s:T(4,6),e:T(7,11),t:'Pneumonia, ESBL bacteremia, septic shock',d:'Fever HD4 with Klebsiella in blood and sputum. Back to the MICU on vasopressors, AKI. Meropenem from HD5, cultures clear HD6.'},
  {id:'ch3',s:T(7,11),e:T(10,10),t:'Recovery, with cholestatic liver tests rising',d:'Off oxygen, creatinine recovering, PICC placed. ALP crosses 2× ULN on HD9; ultrasound shows new gallbladder sludge.'},
  {id:'ch4',s:T(10,10),e:T(11,6),t:'Rebleed from a banding ulcer',d:'Melena, hemoglobin 6.7, 2 units. EGD shows a post-banding ulcer without active bleeding. Carvedilol held overnight.'},
  {id:'ch5',s:T(11,6),e:END,t:'Now',d:'Hemodynamically stable. ALP 482 and bilirubin 8.2, both still rising. Meropenem day 7 of 7. MRCP today at 13:00.'},
];

/* ---- templates ---- */
const NONABX=MEDS.filter(m=>m.cat!=='abx').map(m=>'med:'+m.id);
const TEMPLATES=[
  {id:'general',name:'General inpatient',owner:'Everyone',lanes:['location','consults','vitals','support','resp','labs','transfusion','meds','imaging','procedures'],hide:['vit:RR'],labs:['cbc','chem'],spec:'dili'},
  {id:'ugib',name:'Upper GI bleed',owner:'GI & Hepatology',lanes:['location','transfusion','vitals','support','labs','meds','procedures','imaging','consults'],hide:['vit:Temp','vit:SpO2','vit:RR','drip:propofol','drip:fentanyl'],labs:['bleed'],spec:'dili'},
  {id:'liver',look:'6m',name:'Liver tests and MELD',owner:'GI & Hepatology',lanes:['location','labs','meds','support','vitals','imaging','procedures','consults'],hide:['vit:HR','vit:Temp','vit:SpO2','vit:RR'],labs:['liver','meld'],spec:'dili'},
  {id:'infection',name:'Infection workup',owner:'Infectious Diseases',lanes:['location','vitals','labs','micro','meds','support','resp','procedures','imaging','notes','consults'],hide:['vit:SpO2','vit:RR',...NONABX,'drip:octreo','drip:propofol','drip:fentanyl'],labs:['infection'],spec:'id'},
];

/* ---- added for the ID view: roles and indications, culture result times, CRP, note metadata ---- */
const CTX={age:61,wt:75,allergy:'Sulfonamides (rash)',mdro:'None before this admission'};
Object.assign(MEDS.find(m=>m.id==='ctx'),{role:'Prophylaxis',cls:'Third-generation cephalosporin',ind:'Infection prophylaxis, cirrhosis with GI bleeding',by:'Emergency Medicine'});
Object.assign(MEDS.find(m=>m.id==='ptz'),{role:'Empiric',cls:'Beta-lactam with beta-lactamase inhibitor',ind:'Hospital-acquired pneumonia, sepsis',by:'Medicine C'});
Object.assign(MEDS.find(m=>m.id==='vanc'),{role:'Empiric',cls:'Glycopeptide',ind:'Hospital-acquired pneumonia, MRSA coverage',by:'Medicine C'});
Object.assign(MEDS.find(m=>m.id==='mero'),{role:'Targeted',cls:'Carbapenem',ind:'ESBL Klebsiella pneumoniae bacteremia and pneumonia',by:'MICU, on Infectious Diseases recommendation'});
const MRES={
  mc1:[T(7,10,30),'No growth'],
  mc2:[T(6,9,10),'Klebsiella ESBL, 2 of 2',{prelim:'HD4 22:40: gram-negative rods, 2 of 2 sets. HD5 01:05 rapid panel: Klebsiella pneumoniae, CTX-M detected.'}],
  mc3:[T(6,7),'No growth'],mc4:[T(4,19,30),'Not detected'],
  mc5:[T(6,14),'Klebsiella ESBL',{prelim:'HD4 18:10 Gram stain: many neutrophils, gram-negative rods.'}],
  mc6:[T(6,20),'Klebsiella ESBL, 1 of 2',{prelim:'HD5 21:30: gram-negative rods, 1 of 2 sets.'}],
  mc7:[T(11,9),'No growth',{firstNeg:1}],mc8:[null,'No growth to date, day 4'],mc9:[T(9,15),'Not detected'],
};
MICRO.forEach((m,i)=>{const r=MRES[m.id];m.resT=r[0];m.rshort=r[1];Object.assign(m,r[2]||{});m.st=m.resT==null?'pend':m.res;m.acc='26M-'+(30417+i*113)});
PROCS.find(x=>x.id==='pr7').sc=1;
S.CRP={key:'CRP',label:'CRP',unit:'mg/L',lo:0,hi:10,dec:0,dots:1,pts:daily([24,31,28,52,188,236,204,151,102,74,58,46])};
LABGROUPS.infection.keys=['WBC','CRP','Lac','Cr'];
const NOTES=[
  {id:'n1',t:T(1,3,20),type:'GI consult note',lab:'GI consult',by:'GI / Hepatology',grp:'consult'},
  {id:'n2',t:T(1,6),type:'H&P',lab:'H&P',by:'MICU',grp:'primary'},
  {id:'n3',t:T(1,8,15),type:'Endoscopy report',lab:'EGD report',by:'GI / Hepatology',grp:'proc'},
  {id:'n4',t:T(3,13,30),type:'Transfer note, ICU to floor',lab:'Transfer',by:'Medicine C',grp:'primary'},
  {id:'n5',t:T(5,3),type:'Transfer note, floor to ICU',lab:'Transfer',by:'MICU',grp:'primary'},
  {id:'n6',t:T(5,10,15),type:'ID consult note',lab:'ID consult',by:'Infectious Diseases',grp:'consult',idn:1},
  {id:'n7',t:T(5,15,30),type:'Nephrology consult note',lab:'Nephrology consult',by:'Nephrology',grp:'consult'},
  {id:'n8',t:T(6,14),type:'ID follow-up note',lab:'ID f/u',by:'Infectious Diseases',grp:'consult',idn:1,fu:1},
  {id:'n9',t:T(7,12),type:'Transfer note, ICU to floor',lab:'Transfer',by:'Medicine C',grp:'primary'},
  {id:'n10',t:T(7,15),type:'ID follow-up note',lab:'ID f/u',by:'Infectious Diseases',grp:'consult',idn:1,fu:1},
  {id:'n11',t:T(8,11,30),type:'IR procedure report',lab:'IR report',by:'Interventional Radiology',grp:'proc'},
  {id:'n12',t:T(8,13),type:'Addiction Medicine consult note',lab:'Addiction consult',by:'Addiction Medicine',grp:'consult'},
  {id:'n13',t:T(8,14,30),type:'ID follow-up note',lab:'ID f/u',by:'Infectious Diseases',grp:'consult',idn:1,fu:1},
  {id:'n14',t:T(9,14),type:'ID follow-up note',lab:'ID f/u',by:'Infectious Diseases',grp:'consult',idn:1,fu:1},
  {id:'n15',t:T(10,15),type:'ID follow-up note',lab:'ID f/u',by:'Infectious Diseases',grp:'consult',idn:1,fu:1},
  {id:'n16',t:T(10,18,15),type:'Endoscopy report',lab:'EGD report',by:'GI / Hepatology',grp:'proc'},
  {id:'n17',t:T(11,14),type:'ID follow-up note',lab:'ID f/u',by:'Infectious Diseases',grp:'consult',idn:1,fu:1},
];

/* ---- medication types, for grouping ---- */
const MTYPE={ctx:'Antimicrobial',ptz:'Antimicrobial',vanc:'Antimicrobial',mero:'Antimicrobial',ppi:'Acid suppression',lact:'Hepatic encephalopathy',rif:'Hepatic encephalopathy',carv:'Portal hypertension',alb:'Albumin',apap:'Analgesic and antipyretic'};
MEDS.forEach(m=>{m.type=MTYPE[m.id];m.route=m.rt||'IV'});

/* ---- more ID data: a second organism, and non-culture tests ---- */
MICRO.forEach(m=>m.kind=(m.id==='mc4'||m.id==='mc9')?'test':'cx');
const MX=(id,t,kind,short,title,spec,st,result,resT,rshort,body,x)=>MICRO.push(Object.assign({id,t,kind,short,title,spec,res:st==='pend'?'neg':st,st,result,resT,rshort,body,acc:'26M-'+(31600+MICRO.length*97)},x||{}));
MX('mc10',T(9,9,30),'cx','Sputum','Sputum Gram stain and culture','Sputum, expectorated','pos','P. aeruginosa, light growth',T(11,10),'Pseudomonas','Gram stain: few neutrophils, moderate epithelial cells, gram-negative rods. Culture: light growth of Pseudomonas aeruginosa, plus normal respiratory flora.');
MX('t1',T(4,15,10),'test','Resp viral PCR','Respiratory viral panel PCR','Nasopharyngeal swab','neg','No virus detected',T(4,19),'Not detected','Influenza A and B, RSV, SARS-CoV-2 and the extended panel: not detected.');
MX('t2',T(4,17),'test','Legionella Ag','Legionella urinary antigen','Urine','neg','Negative',T(4,21),'Negative','Legionella pneumophila serogroup 1 antigen: negative.');
MX('t3',T(4,17,5),'test','S. pneumoniae Ag','Streptococcus pneumoniae urinary antigen','Urine','neg','Negative',T(4,21),'Negative','Negative.');
MX('t4',T(5,6),'test','HIV Ag/Ab','HIV-1/2 antigen and antibody','Serum','neg','Non-reactive',T(5,14),'Non-reactive','Non-reactive.');
MX('t5',T(5,6,5),'test','β-D-glucan','(1,3)-beta-D-glucan','Serum','neg','Negative, below 31 pg/mL',T(7,15),'Negative','Below 31 pg/mL. Negative.');
MX('t6',T(5,10),'test','AFB smear + culture','AFB smear and mycobacterial culture','Sputum','pend','Smear negative; culture no growth at 1 week',null,'Smear negative, culture pending','Culture is held for 6 to 8 weeks.',{prelim:'HD5 16:00: no acid-fast bacilli seen on smear.'});
MX('t7',T(5,10,5),'test','TB PCR','Mycobacterium tuberculosis complex PCR','Sputum','neg','MTB complex not detected',T(6,11),'Not detected','Mycobacterium tuberculosis complex DNA not detected.');
MX('t8',T(11,6),'test','CMV PCR','CMV DNA PCR, quantitative','Plasma','pend','Pending',null,'Pending','Sent with the liver test workup. Not yet resulted.');
MX('t9',T(11,6,5),'test','Hepatitis panel','HAV IgM, HBsAg, anti-HBc IgM, HCV RNA','Serum','pend','Pending',null,'Pending','Sent with the liver test workup. Not yet resulted.');
MICRO.sort((a,b)=>a.t-b.t);
COMPETE.find(c=>c.t==='Viral hepatitis').d='HAV IgM, HBsAg, anti-HBc IgM, HCV RNA and CMV PCR sent HD11, pending. HEV not sent.';

/* isolates and one combined susceptibility table. IR = intrinsically resistant, not tested. null = not reported. */
const ISO=[
  {org:'K. pneumoniae',tag:'ESBL',src:'Blood',when:'HD4',cx:'mc2'},
  {org:'K. pneumoniae',tag:'ESBL',src:'Sputum',when:'HD4',cx:'mc5'},
  {org:'P. aeruginosa',tag:'',src:'Sputum',when:'HD9',cx:'mc10'},
];
const K_=(m,r)=>[[m,r],[m,r]];
const AST=[
  ['Ampicillin',null,...K_('≥32','R'),['','IR']],
  ['Ampicillin-sulbactam',null,...K_('≥32/16','R'),['','IR']],
  ['Cefazolin',null,...K_('≥64','R'),['','IR']],
  ['Ceftriaxone','ctx',...K_('≥64','R'),['','IR']],
  ['Ceftazidime',null,...K_('≥32','R'),['4','S']],
  ['Cefepime',null,...K_('16','R'),['4','S']],
  ['Piperacillin-tazobactam','ptz',...K_('16/4','SDD'),['8/4','S']],
  ['Ertapenem',null,...K_('≤0.5','S'),['','IR']],
  ['Meropenem','mero',...K_('≤0.25','S'),['4','I']],
  ['Ceftazidime-avibactam',null,...K_('≤0.5/4','S'),['2/4','S']],
  ['Ciprofloxacin',null,...K_('≥4','R'),['0.5','S']],
  ['Gentamicin',null,...K_('≤1','S'),null],
  ['Tobramycin',null,...K_('≤1','S'),['≤1','S']],
  ['Amikacin',null,...K_('≤2','S'),null],
  ['TMP-SMX',null,...K_('≥4/76','R'),['','IR']],
  ['Vancomycin','vanc',null,null,null],
];

/* ---- records from before this admission (hours relative to HD1 00:00, negative) ---- */
const CL=(d,vals)=>({t:d*24+8,kind:'lab',src:'Hepatology clinic',vals});
const PRIOR=[
  CL(-21,{Hgb:10.9,Plt:92,WBC:5.1,INR:1.4,BUN:14,Cr:0.9,Na:136,AST:61,ALT:33,ALP:109,Tbili:1.9}),
  {t:-40*24+22,kind:'lab',src:'County General ED',outside:1,vals:{Hgb:11.2,Plt:98,WBC:11.6,Cr:1.0,Na:135,AST:74,ALT:36,ALP:112,Tbili:1.8}},
  CL(-96,{Hgb:11.4,Plt:104,WBC:5.4,INR:1.3,BUN:13,Cr:0.9,Na:137,AST:55,ALT:30,ALP:104,Tbili:1.6}),
  CL(-180,{Hgb:11.8,Plt:110,WBC:5.6,INR:1.3,BUN:12,Cr:0.9,Na:137,AST:52,ALT:28,ALP:101,Tbili:1.5}),
  CL(-270,{Hgb:12.1,Plt:118,WBC:5.9,INR:1.2,BUN:12,Cr:0.9,Na:138,AST:66,ALT:34,ALP:98,Tbili:1.4}),
  CL(-352,{Hgb:12.4,Plt:124,WBC:6.1,INR:1.2,BUN:11,Cr:0.8,Na:138,AST:88,ALT:41,ALP:104,Tbili:1.6}),
  ...[-21,-96,-180,-270,-352].map(d=>({t:d*24+9,kind:'enc',title:'Hepatology clinic visit',src:'Outpatient encounter'})),
  {t:-40*24+21,kind:'enc',title:'ED visit, County General',src:'Outside encounter',outside:1,body:'Dental abscess. Discharged on amoxicillin-clavulanate for 10 days.'},
  ...[-21,-96,-180,-270,-352].map(d=>({t:d*24+10,kind:'notes',title:'Hepatology clinic note',src:'Outpatient note'})),
  {t:-40*24+23,kind:'notes',title:'ED visit summary, County General',src:'Outside document',outside:1},
  {t:-410*24+12,kind:'notes',title:'Discharge summary, County General',src:'Outside document',outside:1},
  {t:-96*24+11,kind:'imaging',title:'US abdomen, HCC surveillance',src:'Radiology report',body:'Cirrhotic liver without focal lesion. Trace ascites. Spleen 14.9 cm.'},
  {t:-270*24+11,kind:'imaging',title:'US abdomen, HCC surveillance',src:'Radiology report',body:'Cirrhotic liver without focal lesion. No ascites.'},
  {t:-152*24+9,kind:'procedures',title:'EGD, variceal screening',src:'Endoscopy report',body:'Small esophageal varices without red wale signs. Mild portal hypertensive gastropathy.'},
];
/* outpatient prescriptions from pharmacy dispense history; fills in days before admission */
const F30=[-336,-306,-276,-246,-216,-186,-156,-126,-96,-66,-36,-6];
const HOME=[
  {id:'amx',name:'Amoxicillin-clavulanate',sig:'875 mg PO q12h, 10 days',fills:[-40],supply:10,src:'Pharmacy dispense history, outside prescriber'},
  {id:'spiro',name:'Spironolactone',sig:'100 mg PO daily',fills:F30,supply:30,src:'Pharmacy dispense history',held:1},
  {id:'furo',name:'Furosemide',sig:'40 mg PO daily',fills:F30,supply:30,src:'Pharmacy dispense history',held:1},
];
const AMX={name:'Amoxicillin-clavulanate',home:'amx',score:'A',url:LT+'NBK548517/',typ:'Cholestatic, sometimes mixed; onset a few days to 8 weeks after starting, often after the course is finished.',read:'Outpatient course filled 40 days before admission. Onset falls 7 weeks after the first dose, inside the described window, and the pattern matches.'};
const SCOPES=[['enc','This encounter',0,0],['30d','30 days',30,1200],['6m','6 months',183,2200],['1y','1 year',365,3000],['all','All records',450,4500]];

/* ---- daily events list, one line per hospital day, the way primary teams keep it ---- */
const DAILY=[
  'Admitted with hematemesis and shock, Hgb 6.4. Intubated for airway protection, R IJ line. EGD: bleeding esophageal varices, 5 bands. 3 u pRBC, 1 u platelets. Octreotide, ceftriaxone, norepinephrine and vasopressin. ICU.',
  'Off norepinephrine. Diagnostic paracentesis: no SBP. Extubated.',
  'Transferred to the floor. Lactulose and rifaximin on board. Octreotide finishing its 72 hours.',
  'Fever to 39, WBC 16.8. CXR: new RLL consolidation. Blood, urine and sputum cultures sent. Ceftriaxone changed to piperacillin-tazobactam plus vancomycin.',
  'Septic shock overnight, back to ICU on norepinephrine. Blood cultures 2 of 2 Klebsiella pneumoniae, ESBL. ID consulted: meropenem started, vancomycin stopped. 1 u pRBC for Hgb 6.8. CT chest/abdomen/pelvis: RLL pneumonia, no abscess. AKI, Cr 1.9; nephrology consulted, albumin given.',
  'Off norepinephrine. Blood cultures drawn today are the first negative set. TTE: no vegetation. Central line removed. Cr peaks at 2.4, AST at 248.',
  'Back to the floor. Off oxygen.',
  'PICC placed by IR. Carvedilol started. Addiction Medicine consulted. Cr 1.7 and falling.',
  'ALP 264, now 2x the upper limit. RUQ ultrasound: new gallbladder sludge, no ductal dilation. Nephrology signed off. Repeat sputum culture sent.',
  'Melena, Hgb 6.7, 2 u pRBC. EGD: post-banding ulcer, no active bleeding, no therapy. Carvedilol held, pantoprazole back to IV twice daily.',
  'Carvedilol resumed. Sputum from HD9 grows Pseudomonas. Hepatitis panel and CMV PCR sent, MRCP ordered.',
  'Stable. ALP 482 and bilirubin 8.2, both still rising. Meropenem day 7 of 7. MRCP at 13:00.',
];

/* ---- albumin and MELD 3.0 (Kim et al. 2021; formula and bounds checked against a published calculator) ---- */
A.Alb=[2.6,2.4,2.5,2.5,2.1,2.4,2.6,2.5,2.4,2.4,2.3,2.4];
S.Alb={key:'Alb',label:'Albumin',unit:'g/dL',lo:3.5,hi:5.0,dec:1,dots:1,pts:daily(A.Alb)};
const meld3=(bi,inr,cr,na,alb,female)=>{bi=Math.max(bi,1);inr=Math.max(inr,1);cr=Math.min(Math.max(cr,1),3);na=Math.min(Math.max(na,125),137);alb=Math.min(Math.max(alb,1.5),3.5);
  const s=Math.round((female?1.33:0)+4.56*Math.log(bi)+0.82*(137-na)-0.24*(137-na)*Math.log(bi)+9.09*Math.log(inr)+11.14*Math.log(cr)+1.85*(3.5-alb)-1.83*(3.5-alb)*Math.log(cr)+6);
  return Math.min(40,Math.max(6,s))}; // OPTN reported range is 6–40
S.MELD.pts=daily(A.Cr.map((c,i)=>meld3(A.Tbili[i],A.INR[i],c,A.Na[i],A.Alb[i],false)));
S.MELD.note=t=>{const i=S.MELD.pts.findIndex(p=>p[0]===t);return i<0?'':'From bilirubin '+A.Tbili[i].toFixed(1)+', INR '+A.INR[i].toFixed(1)+', creatinine '+A.Cr[i].toFixed(1)+', sodium '+A.Na[i]+', albumin '+A.Alb[i].toFixed(1)+', male'};
LABGROUPS.liver.keys=['AST','ALT','ALP','Tbili','Alb'];
LABGROUPS.meld={name:'MELD 3.0',keys:['MELD','Tbili','INR','Cr','Na','Alb'],needs:['liver']};
[[-21,3.1],[-96,3.2],[-180,3.3],[-270,3.4],[-352,3.5]].forEach(([d,a])=>{const p=PRIOR.find(x=>x.kind==='lab'&&x.t===d*24+8);p.vals.Alb=a;const v=p.vals;v.MELD=meld3(v.Tbili,v.INR,v.Cr,v.Na,a,false)});

/* ---- blood pressure by cuff and by arterial line (line in place HD5 03:10 to HD7 10:00) ---- */
const ART=[T(5,3,10),T(7,10)];
const BP={NIBP:{key:'NIBP',label:'BP, cuff',unit:'mmHg',pts:[]},ABP:{key:'ABP',label:'BP, arterial line',unit:'mmHg',pts:[]}};
S.MAP.pts.forEach(([t,m],i)=>{const inA=t>=ART[0]&&t<=ART[1],pp=40+(m-60)*0.4+gauss()*2,sy=Math.round(m+2/3*pp),di=Math.round(m-pp/3);
  if(!inA||i%4===0)BP.NIBP.pts.push([t,sy-(inA?2:0),di+(inA?1:0)]);
  if(inA)BP.ABP.pts.push([t,sy+Math.round(gauss()*2),di])});

/* ---- oxygen device and ventilator settings ---- */
const RESPROWS=[
  {key:'dev',label:'O₂ device',segs:[{s:T(1,4,30),e:T(2,16),t:'Ventilator, ETT'},{s:T(2,16),e:T(3,8),t:'NC 2 L'},{s:T(4,14),e:T(5,3),t:'NC 3 L'},{s:T(5,3),e:T(6,6),t:'HFNC 40 L'},{s:T(6,6),e:T(7,18),t:'NC 2 L'}]},
  {key:'mode',label:'Vent mode',segs:[{s:T(1,4,30),e:T(2,9),t:'VC'},{s:T(2,9),e:T(2,16),t:'PS 5/5'}]},
  {key:'fio2',label:'FiO₂',segs:[{s:T(1,4,30),e:T(1,12),t:'0.50'},{s:T(1,12),e:T(2,9),t:'0.40'},{s:T(2,9),e:T(2,16),t:'0.30'},{s:T(5,3),e:T(6,6),t:'0.50'}]},
  {key:'peep',label:'PEEP',unit:'cmH₂O',segs:[{s:T(1,4,30),e:T(2,16),t:'5'}]},
  {key:'rate',label:'Set rate',unit:'/min',segs:[{s:T(1,4,30),e:T(1,12),t:'16'},{s:T(1,12),e:T(2,9),t:'14'}]},
  {key:'vt',label:'Tidal volume',unit:'mL',segs:[{s:T(1,4,30),e:T(2,9),t:'450'}]},
];
