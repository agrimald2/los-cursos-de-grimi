import {readFile,writeFile} from 'node:fs/promises';
import {Resvg} from '@resvg/resvg-js';
const mascot=await readFile('brand/assets/images/grimmy-welcome-v1.png');
const font={fontFiles:['public-web/assets/plus-jakarta-sans.ttf'],loadSystemFonts:false,defaultFontFamily:'Plus Jakarta Sans'};
const variants={
 academia:{lines:['Tu idea merece','salir del chat.'],description:['Creá apps con AI. Desde cero,','con Grimmy al lado.'],tag:'LOS CURSOS DE GRIMI'},
 curso:{lines:['Tu primera','app con AI.'],description:['Idea, diseño, construcción y seguridad.','Aprendé creando algo tuyo.'],tag:'CURSO PARA PRINCIPIANTES'},
 membresia:{lines:['Un lugar.','Todo el club.'],description:['Cursos, materiales y encuentros.','Tu próxima versión empieza acá.'],tag:'MEMBRESÍA · S/50 AL MES'}
};
for(const [name,data] of Object.entries(variants)){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#211332"/><circle cx="1040" cy="340" r="300" fill="#FF4BC5"/><path d="M760 540L1150 150" stroke="#70F6EC" stroke-width="3" opacity=".5"/><text x="64" y="85" font-family="Plus Jakarta Sans" font-size="26" font-weight="800" fill="#70F6EC">grimmy. / LOS CURSOS DE GRIMI</text><text x="64" y="235" font-family="Plus Jakarta Sans" font-size="76" font-weight="800" fill="#FFF7FF">${data.lines.map((line,i)=>`<tspan x="64" dy="${i?88:0}">${line}</tspan>`).join('')}</text><text x="68" y="408" font-family="Plus Jakarta Sans" font-size="24" fill="#E9D9F1">${data.description.map((line,i)=>`<tspan x="68" dy="${i?36:0}">${line}</tspan>`).join('')}</text><rect x="64" y="516" width="625" height="56" rx="28" fill="#FF4BC5"/><text x="87" y="552" font-family="Plus Jakarta Sans" font-size="19" font-weight="800" fill="#211332">${data.tag}</text><image href="data:image/png;base64,${mascot.toString('base64')}" x="725" y="32" width="475" height="713"/></svg>`;
 const png=new Resvg(svg,{font}).render().asPng();
 await writeFile(`public-web/assets/social/${name}-v1.png`,png);
}
const icon=await readFile('brand/assets/logo/isotipo.svg','utf8');
for(const size of [180,192,512])await writeFile(`public-web/assets/pwa/icon-${size}.png`,new Resvg(icon,{fitTo:{mode:'width',value:size}}).render().asPng());
const safeIcon=icon.replace(/<svg[^>]*>/,'<svg x="51" y="51" width="410" height="410" viewBox="0 0 64 64">');
const maskable=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#FF4BC5"/>${safeIcon}</svg>`;
await writeFile('public-web/assets/pwa/icon-maskable-512.png',new Resvg(maskable).render().asPng());
console.log('Exportadas tres tarjetas sociales y cuatro iconos desde assets de marca aprobados.');
