const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve('dist'),errors=[];let release=1;
 const server=http.createServer(async(req,res)=>{
   try{
     const url=new URL(req.url,'http://localhost');
     if(url.pathname==='/api/pwa-check'){res.setHeader('Content-Type','application/json');res.end('{"private":"network-only"}');return}
     const file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
     if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
     let bytes=await fs.readFile(file);
     if(url.pathname==='/sw.js'&&release===2)bytes=Buffer.from(bytes.toString().replace(/grimi-public-([a-f0-9]+)/,'grimi-public-second-$1'));
     const ext=path.extname(file),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf'};
     res.setHeader('Content-Type',types[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(bytes);
   }catch{res.writeHead(404);res.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})}),context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 try{
   await context.route('**/auth/v1/settings',r=>r.fulfill({json:{external:{google:false}}}));
   await page.goto(origin+'/');
   await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}))});
   const manifest=await (await page.request.get(origin+'/manifest.webmanifest')).json();
   assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
   for(const pagePath of ['/','/curso.html','/membresia.html']){
     const html=await (await page.request.get(origin+pagePath)).text();
     assert.match(html,/<meta property="og:image" content="https:\/\/cursos\.alonsogrimaldo\.com\/assets\/social\//);
     assert.match(html,/<meta property="og:description"/);
     assert.match(html,/<link rel="manifest" href="\/manifest.webmanifest"/);
     assert.doesNotMatch(html,/noindex,nofollow/);
   }
   for(const name of ['academia','curso','membresia']){
     const png=await fs.readFile(`dist/assets/social/${name}-v1.png`);assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
   }
   const cdp=await context.newCDPSession(page);
   const parsed=await cdp.send('Page.getAppManifest');assert.deepEqual(parsed.errors,[]);
   await page.goto(origin+'/instalar.html');
   await page.setViewportSize({width:320,height:740});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'install guide 320px overflow');
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.setViewportSize({width:844,height:390});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'install guide landscape overflow');
   await page.setViewportSize({width:390,height:844});
   await page.goto(origin+'/ingresar/');
   await page.evaluate(()=>fetch('/api/pwa-check',{headers:{Authorization:'Bearer private-canary'}}).then(r=>r.json()));
   let keys=await page.evaluate(async()=>{const result=[];for(const cache of await caches.keys())for(const req of await(await caches.open(cache)).keys())result.push(req.url);return result});
   assert.ok(keys.length>8);
   assert.ok(keys.every(url=>!url.includes('/api/')&&!url.includes('/ingresar/')&&!url.includes('/superadmin/')&&!url.includes('code=')),'private resources must never enter cache');
   await context.setOffline(true);
   await page.goto(origin+'/curso.html');await page.getByRole('heading',{level:1,name:/Tu primera/}).waitFor();
   await page.getByText('Sin conexión. Cuenta y pagos necesitan internet.',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile overflow');
   await page.goto(origin+'/ingresar/');await page.getByRole('heading',{level:1,name:/Tu idea sigue acá/}).waitFor();
   await page.screenshot({path:'ingresar/preview-pwa-offline.png',fullPage:true});
   await page.goto(origin+'/?source=pwa');await page.getByRole('heading',{level:1,name:/Tu app/}).waitFor();
   await context.setOffline(false);await page.goto(origin+'/');
   release=2;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});
   await page.getByRole('button',{name:'Actualizar',exact:true}).waitFor();
   await page.getByRole('button',{name:'Actualizar',exact:true}).click();
   await page.waitForFunction(async()=>{const keys=await caches.keys();return keys.some(k=>k.startsWith('grimi-public-second-'))&&keys.filter(k=>k.startsWith('grimi-public-')).length===1});
   await page.evaluate(async()=>{for(const key of await caches.keys())if(key.startsWith('grimi-public-'))await caches.delete(key)});
   await context.setOffline(true);await page.goto(origin+'/ingresar/');
   await page.getByRole('heading',{name:'Necesitás reconectarte.',exact:true}).waitFor();
   assert.deepEqual(errors,[]);
   console.log('PASS: social metadata, PNG dimensions, manifest, public offline, private/API exclusion, installed start URL and opt-in update with cache cleanup.');
 }catch(error){console.error('PWA diagnostics',await page.evaluate(()=>({online:navigator.onLine,status:[...document.querySelectorAll('.pwa-status')].map(e=>({hidden:e.hidden,text:e.textContent})),scripts:[...document.scripts].map(e=>e.src)})),errors);throw error}finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
