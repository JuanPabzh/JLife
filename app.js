const USER='juanpabzh',PASS='LifeJuan10',KEY='jlife_v1';
const PARTS=['Pecho','Espalda','Abdomen','Bíceps','Tríceps','Hombros','Piernas','Cardio','Descanso'];
const SH=['Pec','Esp','Abd','Bíc','Trí','Hom','Pie','Car','Des'];
const DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const TIPOS={ingreso:'Ingreso',gasto:'Gasto',ahorro:'Ahorro',pagar:'Por pagar',cobrar:'Por cobrar'};
const IMG={logo:'imagenes/logo-jlife.png',fin:'imagenes/jfinanzas.png',gym:'imagenes/jgym.png'};

// ---------- utilidades ----------
const $=s=>document.querySelector(s);
const ymd=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const dt=s=>new Date(s+'T12:00:00');
const today=()=>ymd(new Date());
const wd=s=>(dt(s).getDay()+6)%7;
const addDays=(s,n)=>{const d=dt(s);d.setDate(d.getDate()+n);return ymd(d)};
const weekOf=s=>{const m=addDays(s,-wd(s));return[...Array(7)].map((_,i)=>addDays(m,i))};
const monthOf=s=>{const d=dt(s),y=d.getFullYear(),m=d.getMonth(),n=new Date(y,m+1,0).getDate();return[...Array(n)].map((_,i)=>ymd(new Date(y,m,i+1)))};
const money=n=>(n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('es-CO');
const fdate=s=>dt(s).toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'});
const fd2=s=>dt(s).toLocaleDateString('es-CO',{day:'numeric',month:'short'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const tog=(a,p)=>a.includes(p)?a.filter(x=>x!==p):p==='Descanso'?['Descanso']:[...a.filter(x=>x!=='Descanso'),p];

// ---------- datos ----------
let DB;try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){}
DB=DB||{ws:[{id:'propio',name:'Propio',lines:[]},{id:'jlegacy',name:'JLegacy',lines:['Style','Tech','Software','General']}],
 mov:[],plan:[[],[],[],[],[],[],[]],days:{},cfg:{peso:77,altura:170,edad:'',base:''}};
const persist=()=>localStorage.setItem(KEY,JSON.stringify(DB));
const S={logged:localStorage.getItem('jl_auth')==='1',mod:null,tab:'disp',gtab:'sem',ws:'propio',date:today(),auto:true,add:false};

// ---------- finanzas ----------
const sumT=(m,t)=>m.filter(x=>x.t===t).reduce((a,x)=>a+x.amt,0);
const fin=id=>{const m=DB.mov.filter(x=>x.ws===id),ing=sumT(m,'ingreso'),gas=sumT(m,'gasto'),aho=sumT(m,'ahorro');
 return{m,ing,gas,aho,pagar:sumT(m,'pagar'),cobrar:sumT(m,'cobrar'),disp:ing-gas-aho}};

// ---------- gimnasio / nutrición ----------
const gd=d=>DB.days[d]||{};
const partsOf=d=>gd(d).parts||DB.plan[wd(d)];
const base=()=>{const c=DB.cfg;if(c.base)return+c.base;if(c.edad)return Math.round((10*c.peso+6.25*c.altura-5*c.edad+5)*1.2);return 2000};
const bal=d=>{const g=gd(d);return(g.cons===undefined||g.cons==='')?null:+g.cons-(base()+(+g.quem||0))};
const sgn=k=>k===null?'—':(k<=0?'Déficit ':'Superávit ')+Math.abs(Math.round(k))+' kcal · '+Math.abs(k/7700).toFixed(2)+' kg';
const tot=ds=>{let k=0,n=0;ds.forEach(d=>{const b=bal(d);if(b!==null){k+=b;n++}});return{k,n}};
const cls=b=>b===null?'':b<=0?'pos':'warn';

// ---------- vistas ----------
const nav=(t,cur,a)=>`<nav>${t.map(([k,l])=>`<button class="${k===cur?'on':''}" data-a="${a}" data-v="${k}">${l}</button>`).join('')}</nav>`;

const vLogin=()=>`<div class="login"><img class="logo-img" src="${IMG.logo}" alt="JLife"><p class="sub" style="text-align:center">by JLegacy</p>
<input id="u" placeholder="Usuario" autocapitalize="none" autocomplete="username">
<input id="p" type="password" placeholder="Contraseña" autocomplete="current-password">
<button class="btn" data-a="login">Entrar</button><div class="err" id="err"></div></div>`;

const vMenu=()=>`<div class="top"><img class="mlogo" src="${IMG.logo}" alt="JLife"><button class="ghost" style="font-size:12px" data-a="logout">Salir</button></div>
<div class="hello"><h1>Hola, Juan</h1><small>${fdate(today())}</small></div>
<button class="opt" data-a="mod" data-v="fin"><img class="ic" src="${IMG.fin}" alt=""><span><b>Finanzas</b><small>Propio · JLegacy · emprendimientos</small></span><em>›</em></button>
<button class="opt" data-a="mod" data-v="gym"><img class="ic" src="${IMG.gym}" alt=""><span><b>Gimnasio</b><small>Rutina · calorías · déficit</small></span><em>›</em></button>
<button class="ghost" style="font-size:12px;margin-top:18px" data-a="exp">⬇ Respaldar datos</button>`;

const rowM=m=>`<div class="row"><span class="d">${m.d.slice(5)}</span><span class="t">${m.desc||TIPOS[m.t]}<small>${TIPOS[m.t]}${m.line?' · '+m.line:''}</small></span>
<b class="${m.t==='gasto'||m.t==='pagar'?'neg':m.t==='ahorro'?'sav':'pos'}">${money(m.amt)}</b>
${m.t==='pagar'||m.t==='cobrar'?`<button class="ok" data-a="done" data-v="${m.id}">✓</button>`:''}<button class="x" data-a="del" data-v="${m.id}">×</button></div>`;

const vForm=w=>`<div class="form"><div class="g2"><select id="ft">${Object.entries(TIPOS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
<input id="fa" type="number" inputmode="decimal" placeholder="Monto"></div>
<input id="fd" placeholder="Descripción (ej. Gorras, Arriendo, Meta moto)">
<div class="g2">${w.lines.length?`<select id="fl">${w.lines.map(l=>`<option>${l}</option>`).join('')}</select>`:'<span></span>'}<input id="ff" type="date" value="${today()}"></div>
<button class="btn" data-a="saveMov">Guardar</button></div>`;

function vFin(){
 const w=DB.ws.find(x=>x.id===S.ws)||DB.ws[0];S.ws=w.id;const f=fin(w.id);let b='';
 const chips=DB.ws.map(x=>`<button class="chip ${x.id===w.id?'on':''}" data-a="ws" data-v="${x.id}">${x.name}</button>`).join('')+'<button class="chip" data-a="newws">＋ Nuevo</button>';
 if(S.add)b+=vForm(w);
 if(S.tab==='disp'){
  b+=`<div class="big"><small>Disponible · ${w.name}</small><h1 class="${f.disp<0?'neg':''}">${money(f.disp)}</h1>
  <div class="mini"><span class="pos">↑ ${money(f.ing)}</span><span class="neg">↓ ${money(f.gas)}</span><span class="sav">◆ ${money(f.aho)}</span></div></div>`;
  if(w.lines.length)b+='<h3>Por línea</h3>'+w.lines.map(l=>{const m=f.m.filter(x=>x.line===l),i=sumT(m,'ingreso'),g=sumT(m,'gasto');
   return`<div class="row"><span class="t">${l}</span><span class="pos">${money(i)}</span><span class="neg">${money(g)}</span><b>${money(i-g)}</b></div>`}).join('');
  b+='<h3>Movimientos</h3>'+(f.m.length?[...f.m].sort((a,c)=>c.d.localeCompare(a.d)).slice(0,40).map(rowM).join(''):'<p class="empty">Sin movimientos. Toca ＋ para agregar.</p>');
 }else if(S.tab==='pend'){
  const p=f.m.filter(x=>x.t==='pagar'||x.t==='cobrar').sort((a,c)=>a.d.localeCompare(c.d));
  b+=`<div class="big"><small>Pagos pendientes · ${w.name}</small><h1 class="neg">${money(f.pagar)}</h1><div class="mini"><span class="pos">Por cobrar ${money(f.cobrar)}</span></div></div>
  <h3>Lista (✓ = ya se pagó / cobró)</h3>`+(p.length?p.map(rowM).join(''):'<p class="empty">Nada pendiente 🎉</p>');
 }else{
  const g={};f.m.filter(x=>x.t==='ahorro').forEach(x=>{const k=x.desc||'General';g[k]=(g[k]||0)+x.amt});
  b+=`<div class="big"><small>Ahorros · ${w.name}</small><h1 class="sav">${money(f.aho)}</h1></div><h3>Por meta</h3>`+
   Object.entries(g).map(([k,v])=>`<div class="row"><span class="t">${k}</span><b class="sav">${money(v)}</b></div>`).join('')+
   '<p class="empty">Usa ＋ → Ahorro. Un monto negativo es un retiro.</p>';
 }
 return`<div class="top"><button class="ghost" data-a="back">‹</button><b>Finanzas</b><button class="ghost" data-a="add">${S.add?'✕':'＋'}</button></div>
 <div class="chips">${chips}</div>${b}${nav([['disp','Disponible'],['pend','Pendientes'],['aho','Ahorros']],S.tab,'tab')}`;
}

const kcS=k=>(k<=0?'−':'+')+Math.abs(Math.round(k)).toLocaleString('es-CO')+' kcal';
const kgS=k=>(k<=0?'−':'+')+Math.abs(k/7700).toFixed(2)+' kg';
const acum=d=>{
 const dia=bal(d),w=tot(weekOf(d)),m=tot(monthOf(d));
 const c=(l,k,n)=>`<div class="ac"><small>${l}</small>${n?`<b class="${k<=0?'pos':'warn'}">${kcS(k)}</b><em class="${k<=0?'pos':'warn'}">${kgS(k)}</em>`:'<b>—</b>'}</div>`;
 return`<div class="acs">${c('Día',dia||0,dia!==null)}${c('Semana',w.k,w.n)}${c('Mes',m.k,m.n)}</div>`};

function vGym(){
 const d=S.date,g=gd(d),ps=partsOf(d),b0=bal(d);let b='';
 const dn=`<div class="dn"><button class="ghost" data-a="dd" data-v="-1">‹</button><label>${fdate(d)}${d!==today()?' ✎':''}<input type="date" id="pick" value="${d}"></label><button class="ghost" data-a="dd" data-v="1">›</button><button class="chip s" data-a="hoy">Hoy</button></div>`;
 if(S.gtab==='sem'){
  const wk=weekOf(d);
  b=`<div class="dn"><button class="ghost" data-a="dd" data-v="-7">‹</button><label>${fd2(wk[0])} – ${fd2(wk[6])}<input type="date" id="pick" value="${d}"></label><button class="ghost" data-a="dd" data-v="7">›</button><button class="chip s" data-a="hoy">Hoy</button></div>
  <div class="tb"><div class="th"><span></span>${SH.map(x=>`<span>${x}</span>`).join('')}</div>`+
  wk.map(x=>{const p=partsOf(x);return`<div class="tr ${x===today()?'hoy':''}"><b data-a="goto" data-v="${x}">${DIAS[wd(x)]}<small>${x.slice(8)}</small></b>${PARTS.map(q=>`<button class="cell ${p.includes(q)?'on':''}" data-a="cell" data-v="${x}|${q}"></button>`).join('')}</div>`}).join('')+
  `</div><p class="empty">Pec=Pecho · Esp=Espalda · Abd=Abdomen · Bíc=Bíceps · Trí=Tríceps · Hom=Hombros · Pie=Piernas · Car=Cardio · Des=Descanso.<br>Toca un cuadro para marcarlo o quitarlo. Todo es opcional. Toca el día (Lun, Mar…) para ir a sus calorías.</p>
  <div class="chips"><button class="chip s" data-a="setbase">Usar como rutina base</button><button class="chip s" data-a="resetwk">Volver a rutina base</button></div>`;
 }else if(S.gtab==='dia'){
  b=dn+`<h3>Entrenamiento del día</h3><div class="chips wrap">${PARTS.map(p=>`<button class="chip ${ps.includes(p)?'on':''}" data-a="part" data-v="${p}">${p}</button>`).join('')}</div>
  <h3>Nutrición</h3><div class="g3">
  <label>Consumidas<input type="number" inputmode="numeric" data-f="cons" value="${g.cons??''}"></label>
  <label>Quemadas (ejercicio)<input type="number" inputmode="numeric" data-f="quem" value="${g.quem??''}"></label>
  <label>Cardio (min)<input type="number" inputmode="numeric" data-f="cardio" value="${g.cardio??''}"></label></div>
  <div class="big"><small>Balance del día · gasto base ${base()} kcal</small><h2 class="${cls(b0)}">${sgn(b0)}</h2></div>`;
 }else if(S.gtab==='res'){
  const wk=weekOf(d),tw=tot(wk),tm=tot(monthOf(d));
  b=dn+`<div class="big"><small>Semana · ${tw.n}/7 días registrados</small><h2 class="${tw.n?cls(tw.k):''}">${tw.n?sgn(tw.k):'—'}</h2></div>`+
  wk.map(x=>{const bb=bal(x),gg=gd(x);return`<div class="row ${x===d?'sel':''}" data-a="goto" data-v="${x}"><span class="d">${DIAS[wd(x)]} ${x.slice(8)}</span>
   <span class="t">${partsOf(x).map(p=>p.slice(0,3)).join(' · ')||'—'}<small>${gg.cons?gg.cons+' kcal':'sin datos'}</small></span>
   <b class="${cls(bb)}">${bb===null?'—':(bb>0?'+':'')+Math.round(bb)}</b></div>`}).join('')+
  `<div class="big"><small>Mes · ${tm.n} días registrados</small><h2 class="${tm.n?cls(tm.k):''}">${tm.n?sgn(tm.k):'—'}</h2>
  ${tm.n?`<small>Promedio: ${Math.round(tm.k/tm.n)} kcal/día</small>`:''}</div>`;
 }else{
  b=`<h3>Ajustes</h3><div class="g4"><label>Peso kg<input type="number" inputmode="decimal" data-c="peso" value="${DB.cfg.peso}"></label>
  <label>Altura cm<input type="number" inputmode="numeric" data-c="altura" value="${DB.cfg.altura}"></label>
  <label>Edad<input type="number" inputmode="numeric" data-c="edad" value="${DB.cfg.edad}"></label>
  <label>Gasto base<input type="number" inputmode="numeric" data-c="base" value="${DB.cfg.base}" placeholder="${base()}"></label></div>
  <p class="empty">Gasto base = lo que quemas sin entrenar. Vacío = se calcula con peso, altura y edad (2000 si no pones edad). 1 kg ≈ 7.700 kcal.</p>`;
 }
 return`<div class="top"><button class="ghost" data-a="back">‹</button><b>Gimnasio</b><span></span></div>${S.gtab==='plan'?'':acum(d)}${b}${nav([['sem','Semana'],['dia','Día'],['res','Resumen'],['plan','Ajustes']],S.gtab,'gtab')}`;
}

// fx=true -> reproduce la animación de entrada (login, menú, cambio de módulo/pestaña)
function render(fx){const a=$('#app');a.className=fx?'fx':'';
 a.innerHTML=!S.logged?vLogin():!S.mod?vMenu():S.mod==='fin'?vFin():vGym()}

// ---------- acciones ----------
const A={
 login(){if($('#u').value.trim().toLowerCase()===USER&&$('#p').value===PASS){S.logged=true;localStorage.setItem('jl_auth','1');render(true)}else $('#err').textContent='Usuario o contraseña incorrectos'},
 logout(){S.logged=false;S.mod=null;localStorage.removeItem('jl_auth');render(true)},
 mod(v){S.mod=v;S.tab='disp';S.gtab='sem';S.add=false;render(true)},
 back(){S.mod=null;S.add=false;render(true)},
 tab(v){S.tab=v;render(true)},gtab(v){S.gtab=v;render(true)},
 ws(v){S.ws=v;render(true)},
 newws(){const n=prompt('Nombre del nuevo emprendimiento');if(n&&n.trim()){const id=uid();DB.ws.push({id,name:n.trim(),lines:[]});S.ws=id;persist();render()}},
 add(){S.add=!S.add;render()},
 saveMov(){const amt=Number($('#fa').value);if(!amt)return;
  DB.mov.push({id:uid(),ws:S.ws,t:$('#ft').value,amt,desc:$('#fd').value.trim(),line:$('#fl')?$('#fl').value:'',d:$('#ff').value||today()});
  persist();S.add=false;render()},
 done(v){const m=DB.mov.find(x=>x.id===v);m.t=m.t==='pagar'?'gasto':'ingreso';m.d=today();persist();render()},
 del(v){if(confirm('¿Borrar este movimiento?')){DB.mov=DB.mov.filter(x=>x.id!==v);persist();render()}},
 part(p){const g=DB.days[S.date]=gd(S.date);g.parts=tog(partsOf(S.date),p);persist();render()},
 cell(v){const[x,p]=v.split('|');const g=DB.days[x]=gd(x);g.parts=tog(partsOf(x),p);persist();render()},
 setbase(){DB.plan=weekOf(S.date).map(x=>[...partsOf(x)]);persist();alert('Listo: esta semana quedó como tu rutina base')},
 resetwk(){weekOf(S.date).forEach(x=>{if(DB.days[x])delete DB.days[x].parts});persist();render()},
 dd(v){S.date=addDays(S.date,+v);S.auto=S.date===today();render()},
 hoy(){S.date=today();S.auto=true;render()},
 goto(v){S.date=v;S.auto=v===today();S.gtab='dia';render(true)},
 exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB)],{type:'application/json'}));a.download='jlife-respaldo-'+today()+'.json';a.click()}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.v)});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.f){DB.days[S.date]={...gd(S.date),[t.dataset.f]:t.value};persist();render()}
 else if(t.dataset.c){DB.cfg[t.dataset.c]=t.value;persist();render()}
 else if(t.id==='pick'&&t.value){S.date=t.value;S.auto=S.date===today();render()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!S.logged)A.login()});

// día nuevo automático: si estabas en "hoy" y cambió la fecha, salta al día nuevo
const sync=()=>{if(S.auto&&S.date!==today()){S.date=today();render()}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(sync,60000);

// fondo animado (las orbes se estilan en style.css)
document.body.insertAdjacentHTML('afterbegin','<div id="bg"><i></i><i></i><i></i></div>');

render(true);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');