import {readFile,writeFile,cp,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://cursos.alonsogrimaldo.com';
const hash=content=>createHash('sha256').update(content).digest('hex').slice(0,12);
const attr=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const info={
 'index.html':{path:'/',title:'LOS CURSOS DE GRIMI · Tu primera app con AI',description:'De una idea a tu primera app: aprendé diseño, construcción con AI y seguridad, paso a paso con Grimmy. Cursos para principiantes.',image:'academia'},
 'curso.html':{path:'/curso.html',title:'Tu primera app con AI · Aprendé creando con Grimmy',description:'Convertí tu idea en una app publicada. Diseño, construcción con AI, robustez y ciberseguridad, explicado para principiantes. Clases grabadas, material y encuentros.',image:'curso'},
 'membresia.html':{path:'/membresia.html',title:'Membresía Grimmy · Tu lugar en el club',description:'S/50 al mes para cursos publicados, materiales, consultas y encuentros. Preventa: primer curso el 6 de noviembre de 2026. Revisá renovación y devolución antes de reservar.',image:'membresia'},
 'instalar.html':{path:'/instalar.html',title:'Instalar Grimmy · Academia a un toque',description:'Llevá LOS CURSOS DE GRIMI a tu pantalla de inicio. App instalable para aprender con AI y volver a tu academia desde tu celular.',image:'academia'},
 'privacidad.html':{path:'/privacidad.html',title:'Privacidad · LOS CURSOS DE GRIMI',description:'Cómo administramos tu cuenta, sesión, membresía y pagos en LOS CURSOS DE GRIMI.',image:'academia'},
 'terminos.html':{path:'/terminos.html',title:'Condiciones de preventa · LOS CURSOS DE GRIMI',description:'Precio, renovación, inicio del primer curso, cancelación y política de devolución de la preventa.',image:'membresia'},
 'offline.html':{path:'/offline.html',title:'Sin conexión · Grimmy',description:'Reconectate para entrar a tu cuenta o gestionar membresía y pagos.',image:'academia'}
};
export async function buildPwa({pages,siteName}){
  const pwaScript=await readFile('public-web/assets/pwa.js'),pwaStyle=await readFile('public-web/assets/pwa.css');
  const pwaName=`pwa-${hash(pwaScript)}.js`,cssName=`pwa-${hash(pwaStyle)}.css`;
  await writeFile(`dist/assets/${pwaName}`,pwaScript);await writeFile(`dist/assets/${cssName}`,pwaStyle);
  await cp('public-web/manifest.webmanifest','dist/manifest.webmanifest');
  const targets=[...pages,...pages.map(p=>'public-web/'+p),'ingresar/index.html','alumnos/index.html','superadmin/index.html'];
  for(const target of targets){
    let html=await readFile('dist/'+target,'utf8');
    const base=target.replace('public-web/',''),meta=info[base]||{path:target.replace('index.html',''),title:'Mi cuenta · LOS CURSOS DE GRIMI',description:'Entrá de forma segura a tu cuenta de la academia de Grimi.',image:'academia'};
    const image=`${origin}/assets/social/${meta.image}-v1.png`,url=origin+(meta.path.startsWith('/')?meta.path:'/'+meta.path);
    const tags={
      'og:type':'website','og:site_name':'LOS CURSOS DE GRIMI','og:locale':'es_PE','og:title':meta.title,'og:description':meta.description,'og:url':url,
      'og:image':image,'og:image:secure_url':image,'og:image:type':'image/png','og:image:width':'1200','og:image:height':'630',
      'og:image:alt':'Grimmy, mascota 3D de LOS CURSOS DE GRIMI, junto al título de la academia o curso'
    };
    const social=Object.entries(tags).map(([property,content])=>`<meta property="${property}" content="${attr(content)}">`).join('');
    const publicIndexable=['index.html','curso.html','membresia.html','instalar.html'].includes(base);
    if(publicIndexable)html=html.replace(/<meta name="robots"[^>]*>/g,'');
    html=html.replace(/<meta name="description"[^>]*>/g,'');
    html=html.replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover');
    if(!html.includes('name="theme-color"'))html=html.replace('</head>','<meta name="theme-color" content="#211332"></head>');
    html=html.replace('</head>',`<meta name="description" content="${attr(meta.description)}"><link rel="canonical" href="${url}">${social}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(meta.title)}"><meta name="twitter:description" content="${attr(meta.description)}"><meta name="twitter:image" content="${image}"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" sizes="180x180" href="/assets/pwa/icon-180.png"><link rel="stylesheet" href="/assets/${cssName}"><script src="/assets/${pwaName}" defer></script></head>`);
    await writeFile('dist/'+target,html);
  }
  const precache=['/','/index.html','/curso.html','/offline.html','/manifest.webmanifest',`/assets/${siteName}`,`/assets/${pwaName}`,`/assets/${cssName}`,
    '/assets/site.css','/assets/tokens.css','/assets/plus-jakarta-sans.ttf','/assets/grimmy.webp','/assets/favicon.svg',
    '/assets/pwa/icon-180.png','/assets/pwa/icon-192.png','/assets/pwa/icon-512.png','/assets/pwa/icon-maskable-512.png'];
  const sw=await readFile('public-web/sw.js','utf8');
  const content=[];
  for(const url of precache){const file='dist'+(url==='/'?'/index.html':url);await access(file);content.push(await readFile(file))}
  const version=hash(Buffer.concat([Buffer.from(sw),...content]));
  await writeFile('dist/sw.js',sw.replace('__GRIMI_CACHE__','grimi-public-'+version).replace('__GRIMI_PRECACHE__',JSON.stringify(precache)));
  await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /ingresar/\nDisallow: /alumnos/\nDisallow: /superadmin/\nDisallow: /brand/\nDisallow: /public-web/\nSitemap: ${origin}/sitemap.xml\n`);
  await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/curso.html','/membresia.html','/instalar.html'].map(path=>`<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`);
}
