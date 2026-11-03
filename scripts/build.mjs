import {cp,mkdir,rm,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {publicConfig} from './public-config.mjs';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
// Explicit allowlist: never deploy source tests, prompts, keys, private notes or local browser artifacts.
const pages=['index.html','curso.html','membresia.html','privacidad.html','terminos.html'];
const fingerprint=content=>createHash('sha256').update(content).digest('hex').slice(0,12);
const siteScript=await readFile('public-web/assets/site.js');
const siteName=`site-${fingerprint(siteScript)}.js`;
for(const page of pages){
  const html=(await readFile(path.join('public-web',page),'utf8')).replaceAll('src="assets/site.js"',`src="assets/${siteName}"`);
  await writeFile(path.join('dist',page),html);
}
await cp('public-web/assets','dist/assets',{recursive:true});
await writeFile(path.join('dist/assets',siteName),siteScript);
await writeFile('dist/assets/config.json',JSON.stringify(publicConfig(process.env)));
await mkdir('dist/ingresar',{recursive:true});
const bundle=await build({entryPoints:['ingresar/app.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,write:false,outfile:'app.js'});
const loginScript=bundle.outputFiles[0].contents;
const loginName=`app-${fingerprint(loginScript)}.js`;
await writeFile(path.join('dist/ingresar',loginName),loginScript);
await writeFile('dist/ingresar/index.html',(await readFile('ingresar/index.html','utf8')).replace('src="app.js"',`src="${loginName}"`));
await mkdir('dist/public-web',{recursive:true});
for(const page of pages)await cp(path.join('dist',page),path.join('dist/public-web',page));
await cp('public-web/assets','dist/public-web/assets',{recursive:true});
await writeFile(path.join('dist/public-web/assets',siteName),siteScript);
for(const [dir,files] of Object.entries({
 alumnos:['index.html','style.css','app.js','model.mjs','store.mjs'],
 superadmin:['index.html','style.css','app.js']
})){
 await mkdir(path.join('dist',dir),{recursive:true});
 for(const file of files)await cp(path.join(dir,file),path.join('dist',dir,file));
}
await mkdir('dist/brand',{recursive:true});
await cp('brand/tokens','dist/brand/tokens',{recursive:true});
await cp('brand/assets','dist/brand/assets',{recursive:true,filter:src=>!src.endsWith('.md')&&!src.includes('mascot-concepts')&&!src.endsWith('README.md')});
await writeFile('dist/robots.txt','User-agent: *\nDisallow: /\n');
const mustExist=['dist/index.html','dist/curso.html','dist/membresia.html','dist/alumnos/index.html','dist/superadmin/index.html','dist/assets/grimmy.webp'];
for(const file of mustExist)await access(file);
console.log('Build estático listo: dist/. Registro, cobros y demos conservan etiquetas de disponibilidad.');
