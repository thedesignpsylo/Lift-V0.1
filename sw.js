/* Network-first for code/data, cache-first for images, so the app still opens in a gym with bad signal. */
const V='go-lift-v3';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin) return;
  const put=res=>{ if(res&&res.ok){ const c=res.clone(); caches.open(V).then(ch=>ch.put(r,c)); } return res; };
  if(r.destination==='image'){
    e.respondWith(caches.match(r).then(h=>h||fetch(r).then(put)));
  } else {
    e.respondWith(fetch(r).then(put).catch(()=>caches.match(r,{ignoreSearch:true})));
  }
});
