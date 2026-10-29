const C='jlife-v5',F=['./','index.html','style.css','app.js','push.js','manifest.json','imagenes/logo-jlife.png','imagenes/jfinanzas.png','imagenes/jgym.png','imagenes/jpendientes.png','imagenes/jicon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){}
 e.waitUntil(self.registration.showNotification(d.title||'JLife',{body:d.body||'',tag:d.tag,icon:'imagenes/logo-jlife.png',vibrate:[120,60,120]}))});