import {spawnSync} from 'node:child_process';
const checks=[
 ['--check','public-web/assets/site.js'],['--check','alumnos/app.js'],
 ['--check','alumnos/store.mjs'],['--check','superadmin/app.js'],
 ['alumnos/check.mjs'],['alumnos/store-check.mjs']
];
for(const args of checks){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
console.log('Sintaxis y pruebas de estado: OK.');
