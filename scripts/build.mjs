import {cp,mkdir,rm,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
// Explicit allowlist: never deploy source tests, prompts, keys, private notes or local browser artifacts.
const pages=['index.html','curso.html','membresia.html'];
for(const page of pages){await cp(path.join('public-web',page),path.join('dist',page))}
await cp('public-web/assets','dist/assets',{recursive:true});
await mkdir('dist/public-web',{recursive:true});
for(const page of pages)await cp(path.join('public-web',page),path.join('dist/public-web',page));
await cp('public-web/assets','dist/public-web/assets',{recursive:true});
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
