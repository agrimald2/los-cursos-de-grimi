/* Public presentation only. Never store account pages, callbacks, API responses or payments. */
const CACHE='__GRIMI_CACHE__';
const PRECACHE=__GRIMI_PRECACHE__;
const STATIC=new Set(PRECACHE.filter(path=>path.startsWith('/assets/')));
const PUBLIC_PAGES=new Set(['/','/index.html','/curso.html']);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(PRECACHE.map(path=>new Request(path,{cache:'reload',credentials:'omit'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('grimi-public-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('authorization')||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      // Only public pages and the exact install start URL may be cached; OAuth and payment queries never are.
      const publicPage=PUBLIC_PAGES.has(url.pathname)&&(!url.search||(url.pathname==='/'&&url.search==='?source=pwa'));
      try{
        const response=await fetch(request,{signal:typeof AbortSignal.timeout==='function'?AbortSignal.timeout(6500):undefined});
        if(publicPage&&response.ok&&!response.redirected&&!/private|no-store/i.test(response.headers.get('cache-control')||''))await cache.put(url.pathname,response.clone());
        return response;
      }catch{
        const fallback=(publicPage?await cache.match(url.pathname):null)||await cache.match('/offline.html');
        if(!fallback)return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reconectar · Grimmy</title><body style="background:#211332;color:#FFF7FF;font:18px system-ui;padding:32px"><h1>Necesitás reconectarte.</h1><p>El dispositivo liberó los archivos guardados. Volvé a conectarte para cargar la academia.</p><a style="color:#70F6EC" href="/">Reintentar</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
        const html=(await fallback.text()).replace('</head>','<meta name="grimi-offline" content="true"></head>');
        // Mark this response only; never overwrite the clean cached public page.
        return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      }
    })());
  }else if(STATIC.has(url.pathname)&&!url.search){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),cached=await cache.match(url.pathname);
      return cached||fetch(request,{signal:AbortSignal.timeout(6500)});
    })());
  }
});
