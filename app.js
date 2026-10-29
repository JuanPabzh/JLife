const USER='juanpabzh',PASS='LifeJuan10',KEY='jlife_v1';
const PARTS=['Pecho','Espalda','Abdomen','Bíceps','Tríceps','Hombros','Piernas','Cardio','Descanso'];
const SH=['Pec','Esp','Abd','Bíc','Trí','Hom','Pie','Car','Des'];
const DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const TIPOS={ingreso:'Ingreso',gasto:'Gasto',pagar:'Por pagar',cobrar:'Por cobrar',ahorro:'Ahorro',aaho:'Pasado a ahorros',daho:'Retiro de ahorros',retiro:'Retiro de ahorro'};
const FORM=['ingreso','gasto','pagar','cobrar'];
const IMG={logo:'imagenes/logo-jlife.png',fin:'imagenes/jfinanzas.png',gym:'imagenes/jgym.png',pend:'imagenes/jpendientes.png'};

// ---------- utilidades ----------
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ymd=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const dt=s=>new Date(s+'T12:00:00');
const today=()=>ymd(new Date());
const hhmm=()=>{const n=new Date();return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')};
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
DB.todo=DB.todo||[];
if(!DB.ws.some(x=>x.id==='ahorros'))DB.ws.splice(Math.min(2,DB.ws.length),0,{id:'ahorros',name:'Ahorros',lines:[]});
const persist=()=>localStorage.setItem(KEY,JSON.stringify(DB));
const S={logged:localStorage.getItem('jl_auth')==='1',mod:null,tab:'disp',gtab:'sem',ptab:'dia',ws:'propio',date:today(),auto:true,add:false,sv:null};

// ---------- finanzas ----------
// pagar/cobrar solo cuentan en el disponible cuando están marcados (paid)
const kind=x=>x.t==='pagar'?(x.paid?'gasto':''):x.t==='cobrar'?(x.paid?'ingreso':''):x.t;
const sumK=(m,k)=>m.filter(x=>kind(x)===k).reduce((a,x)=>a+x.amt,0);
const sumT=(m,t)=>m.filter(x=>x.t===t).reduce((a,x)=>a+x.amt,0);
const sumP=(m,t)=>m.filter(x=>x.t===t&&!x.paid).reduce((a,x)=>a+x.amt,0);
// aho = lo que Propio/negocio ha mandado a ahorros (neto de retiros). Incluye ahorros antiguos.
const fin=id=>{const m=DB.mov.filter(x=>x.ws===id),ing=sumK(m,'ingreso'),gas=sumK(m,'gasto'),
 aho=sumT(m,'ahorro')+sumT(m,'aaho')-sumT(m,'daho');
 return{m,ing,gas,aho,pagar:sumP(m,'pagar'),cobrar:sumP(m,'cobrar'),disp:ing-gas-aho}};
// saldo de cada meta de ahorro (sección Ahorros)
const metas=list=>{const o={};list.filter(x=>x.ws==='ahorros').forEach(x=>{const k=x.desc||'General';o[k]=(o[k]||0)+(x.t==='retiro'?-x.amt:x.t==='ahorro'?x.amt:0)});return o};
// dinero global: ingresos − gastos de todas las secciones (lo ahorrado sigue contando)
const glob=()=>DB.ws.filter(w=>w.id!=='ahorros').reduce((a,w)=>{const f=fin(w.id);return a+f.ing-f.gas},0);
const gl=()=>`<div style="display:flex;align-items:baseline;gap:8px;margin:6px 0 2px;padding-top:6px;border-top:1px solid var(--line)"><small class="mut">Dinero Global</small><b style="font-size:15px">${money(glob())}</b></div>`;
const key=m=>(m.paid&&m.pd)||m.d;
const newest=(a,c)=>key(c).localeCompare(key(a))||((c.ts||0)-(a.ts||0));

// ---------- gimnasio / nutrición ----------
const gd=d=>DB.days[d]||{};
const partsOf=d=>gd(d).parts||DB.plan[wd(d)];
const base=()=>{const c=DB.cfg;if(c.base)return+c.base;if(c.edad)return Math.round((10*c.peso+6.25*c.altura-5*c.edad+5)*1.2);return 2000};
const bal=d=>{const g=gd(d);return(g.cons===undefined||g.cons==='')?null:+g.cons-(base()+(+g.quem||0))};
const sgn=k=>k===null?'—':(k<=0?'Déficit ':'Superávit ')+Math.abs(Math.round(k))+' kcal · '+Math.abs(k/7700).toFixed(2)+' kg';
const tot=ds=>{let k=0,n=0;ds.forEach(d=>{const b=bal(d);if(b!==null){k+=b;n++}});return{k,n}};
const cls=b=>b===null?'':b<=0?'pos':'warn';
const kcS=k=>(k<=0?'−':'+')+Math.abs(Math.round(k)).toLocaleString('es-CO')+' kcal';
const kgS=k=>(k<=0?'−':'+')+Math.abs(k/7700).toFixed(2)+' kg';
const acum=d=>{
 const dia=bal(d),w=tot(weekOf(d)),m=tot(monthOf(d));
 const c=(l,k,n)=>`<div class="ac"><small>${l}</small>${n?`<b class="${k<=0?'pos':'warn'}">${kcS(k)}</b><em class="${k<=0?'pos':'warn'}">${kgS(k)}</em>`:'<b>—</b>'}</div>`;
 return`<div class="acs">${c('Día',dia||0,dia!==null)}${c('Semana',w.k,w.n)}${c('Mes',m.k,m.n)}</div>`};

// ---------- pendientes ----------
const pendCount=d=>DB.todo.filter(x=>x.d===d&&!x.done).length;
const late=x=>!x.done&&(x.d<today()||(x.d===today()&&x.h&&x.h<hhmm()));
const rowT=x=>`<div class="row ${x.done?'hecho':''}"><button class="chk ${x.done?'on':''}" data-a="tdone" data-v="${x.id}"></button>
<span class="t">${esc(x.t)}<small class="${late(x)?'late':''}">${x.h?x.h+' · ':''}${fdate(x.d)}${late(x)?' · vencido':''}</small></span><button class="x" data-a="tdel" data-v="${x.id}">×</button></div>`;
const byTime=(a,b)=>(a.done-b.done)||((a.h||'99:99')>(b.h||'99:99')?1:-1);

// ---------- vistas ----------
const nav=(t,cur,a)=>`<nav>${t.map(([k,l])=>`<button class="${k===cur?'on':''}" data-a="${a}" data-v="${k}">${l}</button>`).join('')}</nav>`;
const dnav=d=>`<div class="dn"><button class="ghost" data-a="dd" data-v="-1">‹</button><label>${fdate(d)}${d!==today()?' ✎':''}<input type="date" id="pick" value="${d}"></label><button class="ghost" data-a="dd" data-v="1">›</button><button class="chip s" data-a="hoy">Hoy</button></div>`;

const vLogin=()=>`<div class="login"><img class="logo-img" src="${IMG.logo}" alt="JLife"><p class="sub" style="text-align:center">by JLegacy</p>
<input id="u" placeholder="Usuario" autocapitalize="none" autocomplete="username">
<input id="p" type="password" placeholder="Contraseña" autocomplete="current-password">
<button class="btn" data-a="login">Entrar</button><div class="err" id="err"></div></div>`;

const vMenu=()=>{const n=pendCount(today());return`<div class="top"><img class="mlogo" src="${IMG.logo}" alt="JLife"><button class="ghost" style="font-size:12px" data-a="logout">Salir</button></div>
<div class="hello"><h1>Hola, Juan</h1><small>${fdate(today())}</small></div>
<button class="opt" data-a="mod" data-v="fin"><img class="ic" src="${IMG.fin}" alt=""><span><b>Finanzas</b><small>Propio · JLegacy · ahorros · emprendimientos</small></span><em>›</em></button>
<button class="opt" data-a="mod" data-v="gym"><img class="ic" src="${IMG.gym}" alt=""><span><b>Gimnasio</b><small>Rutina · calorías · déficit</small></span><em>›</em></button>
<button class="opt" data-a="mod" data-v="pend"><img class="ic" src="${IMG.pend}" alt=""><span><b>Pendientes</b><small>${n?n+(n===1?' pendiente para hoy':' pendientes para hoy'):'Nada pendiente para hoy'}</small></span><em>›</em></button>
<button class="ghost" style="font-size:12px;margin-top:18px" data-a="exp">⬇ Respaldar datos</button>`};

const rowM=m=>{const pc=m.t==='pagar'||m.t==='cobrar';
 const tag=pc&&m.paid?(m.t==='pagar'?'Pagado':'Cobrado'):m.t==='ahorro'?(m.ws==='ahorros'?'Ingreso a ahorro':'Ahorro (antiguo)'):TIPOS[m.t];
 const c=(m.t==='gasto'||m.t==='pagar'||m.t==='retiro')?'neg':(m.t==='ahorro'||m.t==='aaho')?'sav':'pos';
 return`<div class="row"><span class="d">${key(m).slice(5)}</span><span class="t">${esc(m.desc||(m.ws==='ahorros'?'General':TIPOS[m.t]))}<small>${tag}${m.line?' · '+esc(m.line):''}</small></span>
<b class="${pc&&!m.paid?'mut':c}">${money(m.amt)}</b>${pc?`<button class="chk ${m.paid?'on':''}" data-a="done" data-v="${m.id}"></button>`:''}<button class="x" data-a="del" data-v="${m.id}">×</button></div>`};

const vForm=w=>`<div class="form"><div class="g2"><select id="ft">${FORM.map(k=>`<option value="${k}">${TIPOS[k]}</option>`).join('')}</select>
<input id="fa" type="number" inputmode="decimal" placeholder="Monto"></div>
<input id="fd" placeholder="Descripción (ej. Gorras, Arriendo)">
<div class="g2">${w.lines.length?`<select id="fl">${w.lines.map(l=>`<option>${esc(l)}</option>`).join('')}</select>`:'<span></span>'}<input id="ff" type="date" value="${today()}"></div>
<button class="btn" data-a="saveMov">Guardar</button></div>`;

function vSav(){
 const mt=metas(DB.mov),ks=Object.entries(mt),total=ks.reduce((a,[,v])=>a+v,0);
 const am=DB.mov.filter(x=>x.ws==='ahorros').sort(newest);
 let b=`<div class="big"><small>Total ahorrado</small><h1 class="sav">${money(total)}</h1></div>${gl()}
 <div class="g2" style="margin:8px 0"><button class="btn" data-a="sv" data-v="in">Ingresar</button><button class="btn" data-a="sv" data-v="out">Sacar</button></div>`;
 if(S.sv==='in')b+=`<div class="form"><p class="empty">Sale de Propio · disponible ${money(fin('propio').disp)}</p>
 <input id="sa" type="number" inputmode="decimal" placeholder="Monto">
 <input id="sm" list="ml" placeholder="Meta (ej. Moto, Emergencias)"><datalist id="ml">${ks.map(([k])=>`<option value="${esc(k)}">`).join('')}</datalist>
 <button class="btn" data-a="saveSv">Guardar en ahorros</button></div>`;
 if(S.sv==='out'){const o=ks.filter(([,v])=>v>0);
  b+=o.length?`<div class="form"><p class="empty">La plata pasa a Propio.</p>
  <input id="sa" type="number" inputmode="decimal" placeholder="Monto">
  <select id="sm">${o.map(([k,v])=>`<option value="${esc(k)}">${esc(k)} · ${money(v)}</option>`).join('')}</select>
  <button class="btn" data-a="saveSv">Sacar y pasar a Propio</button></div>`:'<p class="empty">No hay ahorros para sacar.</p>'}
 b+='<h3>Por meta</h3>'+(ks.filter(([,v])=>v!==0).map(([k,v])=>`<div class="row"><span class="t">${esc(k)}</span><b class="sav">${money(v)}</b></div>`).join('')||'<p class="empty">Aún no tienes ahorros.</p>');
 b+='<h3>Movimientos de ahorro</h3>'+(am.length?am.map(rowM).join(''):'<p class="empty">Sin movimientos de ahorro.</p>');
 return b}

function vFin(){
 const w=DB.ws.find(x=>x.id===S.ws)||DB.ws[0];S.ws=w.id;
 const chips=DB.ws.map(x=>`<button class="chip ${x.id===w.id?'on':''}" data-a="ws" data-v="${x.id}">${esc(x.name)}</button>`).join('')+'<button class="chip" data-a="newws">＋ Nuevo</button>';
 if(w.id==='ahorros')return`<div class="top"><button class="ghost" data-a="back">‹</button><b>Finanzas</b><span></span></div><div class="chips wrap">${chips}</div>${vSav()}`;
 const f=fin(w.id);let b='';
 const mg=(w.id!=='propio'&&w.id!=='jlegacy')?`<div class="chips"><button class="chip s" data-a="renws">Renombrar</button><button class="chip s" data-a="delws">Borrar «${esc(w.name)}»</button></div>`:'';
 if(S.add)b+=vForm(w);
 if(S.tab==='pend'){
  const p=f.m.filter(x=>x.t==='pagar'||x.t==='cobrar').sort((a,c)=>(!!a.paid-!!c.paid)||newest(a,c));
  b+=`<div class="big"><small>Pagos pendientes · ${esc(w.name)}</small><h1 class="neg">${money(f.pagar)}</h1><div class="mini"><span class="pos">Por cobrar ${money(f.cobrar)}</span></div></div>${gl()}
  <h3>Lista (el chulo marca pagado / cobrado)</h3>`+(p.length?p.map(rowM).join(''):'<p class="empty">Nada pendiente 🎉</p>');
 }else{
  const mk=today().slice(0,7),fm=f.m.filter(x=>key(x).slice(0,7)===mk),mi=sumK(fm,'ingreso'),mgs=sumK(fm,'gasto'),mes=dt(today()).toLocaleDateString('es-CO',{month:'long'});
  b+=`<div class="big"><small>Disponible · ${esc(w.name)}</small><h1 class="${f.disp<0?'neg':''}">${money(f.disp)}</h1>
  <div class="mini"><span class="mut">${mes}</span><span class="pos">↑ ${money(mi)}</span><span class="neg">↓ ${money(mgs)}</span>${f.aho?`<span class="sav">◆ ${money(f.aho)}</span>`:''}</div></div>${gl()}`;
  if(w.lines.length)b+='<h3>Por línea</h3>'+w.lines.map(l=>{const m=f.m.filter(x=>x.line===l),i=sumK(m,'ingreso'),g=sumK(m,'gasto');
   return`<div class="row"><span class="t">${esc(l)}</span><span class="pos">${money(i)}</span><span class="neg">${money(g)}</span><b>${money(i-g)}</b></div>`}).join('');
  b+='<h3>Movimientos (los más nuevos arriba)</h3>'+(f.m.length?[...f.m].sort(newest).slice(0,40).map(rowM).join(''):'<p class="empty">Sin movimientos. Toca ＋ para agregar.</p>');
 }
 return`<div class="top"><button class="ghost" data-a="back">‹</button><b>Finanzas</b><button class="ghost" data-a="add">${S.add?'✕':'＋'}</button></div>
 <div class="chips wrap">${chips}</div>${mg}${b}${nav([['disp','Disponible'],['pend','Pendientes']],S.tab,'tab')}`;
}

function vGym(){
 const d=S.date,g=gd(d),ps=partsOf(d),b0=bal(d);let b='';
 const dn=dnav(d);
 if(S.gtab==='sem'){
  const wk=weekOf(d);
  b=`<div class="dn"><button class="ghost" data-a="dd" data-v="-7">‹</button><label>${fd2(wk[0])} – ${fd2(wk[6])}<input type="date" id="pick" value="${d}"></label><button class="ghost" data-a="dd" data-v="7">›</button><button class="chip s" data-a="hoy">Hoy</button></div>
  <div class="tb"><div class="th"><span></span>${SH.map(x=>`<span>${x}</span>`).join('')}</div>`+
  wk.map(x=>{const p=partsOf(x);return`<div class="tr ${x===today()?'hoy':''}"><b data-a="goto" data-v="${x}">${DIAS[wd(x)]}<small>${x.slice(8)}</small></b>${PARTS.map(q=>`<button class="cell ${p.includes(q)?'on':''}" data-a="cell" data-v="${x}|${q}"></button>`).join('')}</div>`}).join('')+
  `</div><p class="empty">Pec=Pecho · Esp=Espalda · Abd=Abdomen · Bíc=Bíceps · Trí=Tríceps · Hom=Hombros · Pie=Piernas · Car=Cardio · Des=Descanso.<br>Toca un cuadro para marcarlo o quitarlo. Todo es opcional. Toca el día (Lun, Mar…) para ir a sus calorías.</p>
  <div class="chips"><button class="chip s" data-a="setbase">Usar como rutina base</button><button class="chip s" data-a="resetwk">Volver a rutina base</button></div>`;
 }else if(S.gtab==='dia'){
  b=dn+`<h3>Entrenamiento del día</h3><div class="chips wrap">${PARTS.map(p=>`<button class="chip ${ps.includes(p)?'on':''}" data-a="part" data-v="${p}">${p}</button>`).join('')}</div>
  <h3>Nutrición</h3><div class="g2">
  <label>Consumidas<input type="number" inputmode="numeric" data-f="cons" value="${g.cons??''}"></label>
  <label>Quemadas (ejercicio)<input type="number" inputmode="numeric" data-f="quem" value="${g.quem??''}"></label></div>
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

function vPend(){
 const d=S.date;let b='';
 const ok=('Notification' in window)&&Notification.permission==='granted';
 if(!ok)b+=`<button class="chip s" style="margin:2px 0 6px" data-a="perm">Activar avisos</button>`;
 if(S.add)b+=`<div class="form"><input id="tt" placeholder="¿Qué tienes pendiente?"><div class="g2"><input id="td" type="date" value="${d}"><input id="th" type="time"></div>
 <p class="empty">La hora es opcional. Sin hora solo se avisa en el resumen de las 5 am de ese día.</p><button class="btn" data-a="tsave">Guardar</button></div>`;
 if(S.ptab==='dia'){
  const l=DB.todo.filter(x=>x.d===d).sort(byTime),n=l.filter(x=>!x.done).length;
  b+=dnav(d)+`<div class="big"><small>${d===today()?'Hoy':fdate(d)}</small><h2>${n?n+(n===1?' pendiente':' pendientes'):(l.length?'Todo listo ✓':'Sin pendientes')}</h2></div>`+
   (l.length?l.map(rowT).join(''):'<p class="empty">Nada para este día. Toca ＋ para agregar.</p>');
 }else{
  const v=DB.todo.filter(x=>!x.done&&x.d<today()).sort((a,c)=>a.d.localeCompare(c.d)),
        p=DB.todo.filter(x=>!x.done&&x.d>=today()).sort((a,c)=>a.d.localeCompare(c.d)||byTime(a,c));
  b+=(v.length?'<h3>Vencidos</h3>'+v.map(rowT).join(''):'')+'<h3>Próximos</h3>'+(p.length?p.map(rowT).join(''):'<p class="empty">No tienes nada próximo.</p>');
 }
 return`<div class="top"><button class="ghost" data-a="back">‹</button><b>Pendientes</b><button class="ghost" data-a="add">${S.add?'✕':'＋'}</button></div>${b}${nav([['dia','Día'],['prox','Próximos']],S.ptab,'ptab')}`;
}

// fx=true -> reproduce la animación de entrada
function render(fx){const a=$('#app');a.className=fx?'fx':'';
 a.innerHTML=!S.logged?vLogin():!S.mod?vMenu():S.mod==='fin'?vFin():S.mod==='gym'?vGym():vPend()}

// ---------- avisos ----------
function notify(t,b,tag){
 if(!('Notification' in window)||Notification.permission!=='granted'||!navigator.serviceWorker)return;
 navigator.serviceWorker.ready.then(r=>r.showNotification(t,{body:b,tag,icon:IMG.logo,badge:IMG.logo,vibrate:[120,60,120]}))}
function tick(){
 const t=today(),h=hhmm(),pend=DB.todo.filter(x=>x.d===t&&!x.done);
 if(h>='05:00'&&DB.cfg.n5!==t){DB.cfg.n5=t;persist();
  if(pend.length)notify('JLife · Pendientes de hoy',pend.map(x=>(x.h?x.h+' ':'')+x.t).join(' · '),'resumen-'+t)}
 pend.forEach(x=>{if(x.h&&x.h<=h&&!x.n){x.n=1;persist();notify('Pendiente: '+x.t,'Hoy a las '+x.h,'p-'+x.id)}})}

// ---------- acciones ----------
const A={
 login(){if($('#u').value.trim().toLowerCase()===USER&&$('#p').value===PASS){S.logged=true;localStorage.setItem('jl_auth','1');render(true)}else $('#err').textContent='Usuario o contraseña incorrectos'},
 logout(){S.logged=false;S.mod=null;localStorage.removeItem('jl_auth');render(true)},
 mod(v){S.mod=v;S.tab='disp';S.gtab='sem';S.ptab='dia';S.add=false;S.sv=null;S.date=today();S.auto=true;render(true)},
 back(){S.mod=null;S.add=false;S.sv=null;render(true)},
 tab(v){S.tab=v;render(true)},gtab(v){S.gtab=v;render(true)},ptab(v){S.ptab=v;render(true)},
 ws(v){S.ws=v;S.sv=null;S.add=false;render(true)},
 newws(){const n=prompt('Nombre del nuevo emprendimiento');if(n&&n.trim()){const id=uid();DB.ws.push({id,name:n.trim(),lines:[]});S.ws=id;S.sv=null;persist();render()}},
 renws(){const w=DB.ws.find(x=>x.id===S.ws),n=prompt('Nuevo nombre',w.name);if(n&&n.trim()){w.name=n.trim();persist();render()}},
 delws(){const w=DB.ws.find(x=>x.id===S.ws);
  if(confirm('¿Borrar «'+w.name+'» y todos sus movimientos? No se puede deshacer.')){
   DB.ws=DB.ws.filter(x=>x.id!==w.id);DB.mov=DB.mov.filter(x=>x.ws!==w.id);S.ws='propio';persist();render()}},
 add(){S.add=!S.add;render()},
 saveMov(){const amt=Number($('#fa').value);if(!(amt>0))return;
  DB.mov.push({id:uid(),ws:S.ws,t:$('#ft').value,amt,desc:$('#fd').value.trim(),line:$('#fl')?$('#fl').value:'',d:$('#ff').value||today(),ts:Date.now()});
  persist();S.add=false;render()},
 done(v){const m=DB.mov.find(x=>x.id===v);m.paid=!m.paid;if(m.paid)m.pd=today();else delete m.pd;persist();render()},
 del(v){const m=DB.mov.find(x=>x.id===v);if(!m)return;
  const rest=DB.mov.filter(x=>m.g?x.g!==m.g:x.id!==v);
  if(Object.values(metas(rest)).some(x=>x<0)){alert('No puedes borrar este movimiento: esa plata de ahorro ya se retiró.');return}
  const n=m.g?DB.mov.filter(x=>x.g===m.g).length:1;
  if(confirm(n>1?'Este movimiento está ligado a '+(n-1)+' más (ahorros ↔ Propio). Se borran todos. ¿Continuar?':'¿Borrar este movimiento?')){
   DB.mov=rest;persist();render()}},
 sv(v){S.sv=S.sv===v?null:v;render()},
 saveSv(){const amt=Number($('#sa').value),k=(($('#sm').value||'').trim())||'General';
  if(!(amt>0)){alert('Escribe un monto mayor a 0');return}
  const g=uid(),ts=Date.now(),d=today(),desc=k==='General'?'':k;
  if(S.sv==='in'){
   const disp=fin('propio').disp;
   if(amt>disp){alert('No alcanza: en Propio tienes '+money(disp)+' disponibles');return}
   DB.mov.push({id:uid(),ws:'ahorros',t:'ahorro',amt,desc,d,ts,g});
   DB.mov.push({id:uid(),ws:'propio',t:'aaho',amt,desc:'Ahorro: '+k,d,ts,g});
  }else{
   const have=metas(DB.mov)[k]||0;
   if(amt>have){alert('No alcanza: en «'+k+'» tienes '+money(have));return}
   DB.mov.push({id:uid(),ws:'ahorros',t:'retiro',amt,desc,d,ts,g});
   DB.mov.push({id:uid(),ws:'propio',t:'daho',amt,desc:'Retiro de ahorro: '+k,d,ts,g});
  }
  persist();S.sv=null;render()},
 part(p){const g=DB.days[S.date]=gd(S.date);g.parts=tog(partsOf(S.date),p);persist();render()},
 cell(v){const[x,p]=v.split('|');const g=DB.days[x]=gd(x);g.parts=tog(partsOf(x),p);persist();render()},
 setbase(){DB.plan=weekOf(S.date).map(x=>[...partsOf(x)]);persist();alert('Listo: esta semana quedó como tu rutina base')},
 resetwk(){weekOf(S.date).forEach(x=>{if(DB.days[x])delete DB.days[x].parts});persist();render()},
 dd(v){S.date=addDays(S.date,+v);S.auto=S.date===today();render()},
 hoy(){S.date=today();S.auto=true;render()},
 goto(v){S.date=v;S.auto=v===today();S.gtab='dia';render(true)},
 tsave(){const t=$('#tt').value.trim();if(!t)return;const d=$('#td').value||S.date,h=$('#th').value||'';
  DB.todo.push({id:uid(),t,d,h,done:false,n:(d===today()&&h&&h<=hhmm())?1:0});persist();S.add=false;render()},
 tdone(v){const x=DB.todo.find(y=>y.id===v);x.done=!x.done;persist();render()},
 tdel(v){if(confirm('¿Borrar este pendiente?')){DB.todo=DB.todo.filter(x=>x.id!==v);persist();render()}},
 perm(){if(!('Notification' in window)){alert('Este navegador no permite avisos');return}
  Notification.requestPermission().then(p=>{render();if(p==='granted')notify('JLife','Avisos activados ✓','test')})},
 exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB)],{type:'application/json'}));a.download='jlife-respaldo-'+today()+'.json';a.click()}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.v)});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.f){DB.days[S.date]={...gd(S.date),[t.dataset.f]:t.value};persist();render()}
 else if(t.dataset.c){DB.cfg[t.dataset.c]=t.value;persist();render()}
 else if(t.id==='pick'&&t.value){S.date=t.value;S.auto=S.date===today();render()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!S.logged)A.login()});

// día nuevo automático + revisión de avisos
const sync=()=>{if(S.auto&&S.date!==today()){S.date=today();render()}tick()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(sync,30000);

// fondo animado
document.body.insertAdjacentHTML('afterbegin','<div id="bg"><i></i><i></i><i></i></div>');

render(true);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');