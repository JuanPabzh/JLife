// ====== PON AQUÍ TUS DATOS ======
const SB={url:'https://erlrcepycuqjdbgagfyq.supabase.co',key:'sb_publishable_wo1pYdHLCF_0ci07GxzZVQ_F-YD4CAn'};
const VAPID='BMNCrTA8TYa4KQ2tpsC3xlm2w1LJQ9pkms9SM6AJQkBB_pfrVwRFnd89vlltRZSr7zMMrl-di6iY_z4Sp1qf_4E';
const MAIL='juanpabzh@jlife.app';
// =================================

let TOK=null;try{TOK=JSON.parse(localStorage.getItem('jl_tok'))}catch(e){}
async function token(){
 if(TOK&&TOK.exp>Date.now()+60000)return TOK.at;
 const r=await fetch(SB.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify({email:MAIL,password:PASS})});
 const j=await r.json();if(!j.access_token)throw new Error('login supabase');
 TOK={at:j.access_token,exp:Date.now()+j.expires_in*1000};localStorage.setItem('jl_tok',JSON.stringify(TOK));return TOK.at}
async function api(path,opt={}){
 const at=await token();
 const r=await fetch(SB.url+'/rest/v1/'+path,{...opt,headers:{apikey:SB.key,Authorization:'Bearer '+at,'Content-Type':'application/json',...(opt.headers||{})}});
 const t=await r.text();if(!r.ok)throw new Error(t);return t?JSON.parse(t):null}

const UP={Prefer:'resolution=merge-duplicates,return=minimal'};
const srv={
 add:x=>api('todos',{method:'POST',headers:UP,body:JSON.stringify({id:x.id,txt:x.t,d:x.d,h:x.h,done:!!x.done,n:!!x.n})}),
 done:(id,v)=>api('todos?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({done:v})}),
 del:id=>api('todos?id=eq.'+id,{method:'DELETE'})
};
const fire=p=>p.catch(()=>{});

const b64=s=>{const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))};
async function subscribe(){try{
 const reg=await navigator.serviceWorker.ready;
 const sub=(await reg.pushManager.getSubscription())||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(VAPID)});
 await api('push_subs',{method:'POST',headers:UP,body:JSON.stringify({endpoint:sub.endpoint,sub:sub.toJSON()})});
 DB.cfg.push=1;persist();return true}catch(e){return false}}

async function reconcile(){try{
 const s=await api('todos?select=id,txt,d,h,done');
 const sid=new Set(s.map(x=>x.id)),lid=new Set(DB.todo.map(x=>x.id));let ch=0;
 for(const x of DB.todo)if(!sid.has(x.id))await srv.add(x);
 s.forEach(x=>{if(!lid.has(x.id)){DB.todo.push({id:x.id,t:x.txt,d:x.d,h:x.h,done:x.done,n:1});ch=1}});
 if(ch){persist();render()}}catch(e){}}

// ---- enganchar con app.js ----
const _ts=A.tsave;
A.tsave=function(){const n=DB.todo.length;_ts();if(DB.todo.length>n)fire(srv.add(DB.todo[DB.todo.length-1]))};
const _td=A.tdone;
A.tdone=function(v){_td(v);const x=DB.todo.find(y=>y.id===v);if(x)fire(srv.done(v,x.done))};
const _tx=A.tdel;
A.tdel=function(v){_tx(v);if(!DB.todo.some(y=>y.id===v))fire(srv.del(v))};
A.perm=async function(){
 if(!('Notification' in window)){alert('Este navegador no permite avisos');return}
 const p=await Notification.requestPermission();
 if(p!=='granted'){render();return}
 const ok=await subscribe();render();
 alert(ok?'Avisos activados ✓ Llegan aunque cierres la app':'Permiso dado, pero no se pudo conectar con Supabase. Revisa push.js')};
// con avisos del servidor activos, se apagan los avisos locales (si no, llegarían dobles)
const _tick=tick;
tick=function(){if(!DB.cfg.push)_tick()};

if('Notification' in window&&Notification.permission==='granted')subscribe();
reconcile();