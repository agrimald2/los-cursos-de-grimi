export const lessons=[
 {id:'idea',title:'Tu idea, bien definida',stage:'Idea',lead:'Elegí un problema y una persona a quien ayudar. La primera versión no necesita resolverlo todo.',steps:['Escribí quién va a usar tu app y qué necesita resolver.','Elegí una sola acción que esa persona debería poder completar.','Dejá mejoras para después: primero probá si tu idea ayuda.'],exercise:'Mi app ayuda a ___ a ___ mediante ___.'},
 {id:'design',title:'Diseñar primera pantalla',stage:'Diseño',lead:'Una pantalla empieza por un recorrido claro, antes de elegir colores.',steps:['Anotá qué necesita ver primero quien entra.','Elegí una acción principal y describí qué ocurre después.','Pensá estados de carga, éxito, vacío y error.'],exercise:'Describí una pantalla y su acción principal. Incluí qué pasa si algo falla.'},
 {id:'build',title:'Construir con AI',stage:'Construcción',lead:'Pedí cambios pequeños, revisá resultado y probá cada parte antes de sumar otra.',steps:['Dale contexto de producto y objetivo concreto a AI.','Pedí una función por vez y revisá qué archivos cambian.','Probá resultado con datos normales e inesperados.'],exercise:'Escribí una instrucción con contexto, objetivo y criterio para comprobar resultado.'},
 {id:'robust',title:'Errores y pruebas',stage:'Robustez',lead:'Que funcione una vez no alcanza. Probá qué pasa cuando faltan datos o una operación falla.',steps:['Comprobá entradas vacías e inválidas.','Mostrá mensajes que expliquen qué se puede hacer.','Repetí acciones y verificá que no dupliquen información.'],exercise:'Listá tres formas en que una función podría fallar y cómo debería responder.'},
 {id:'security',title:'Cuidar acceso y datos',stage:'Ciberseguridad',lead:'Antes de publicar, revisá permisos, datos y secretos. Una interfaz escondida no protege una operación.',steps:['Comprobá permisos también del lado del servidor.','No incluyas secretos ni claves privadas en código del navegador.','Revisá qué información se registra y quién puede verla.'],exercise:'Identificá un dato privado y explicá quién debería poder acceder a él.'},
 {id:'publish',title:'Publicar primera app',stage:'Publicación',lead:'Publicá una versión acotada y comprobá recorrido completo en su entorno real.',steps:['Revisá configuración, variables y permisos del entorno.','Probá recorrido principal en móvil y escritorio.','Compartí versión y registrá problemas antes de sumar funciones.'],exercise:'Escribí checklist de publicación con tres comprobaciones que no vas a saltear.'}
];
export const statuses=['active','grace','cancelled','suspended','expired'];
export const hasAccess=status=>['active','grace','cancelled'].includes(status);
export const defaultState=()=>({version:1,status:'active',renewalCancelled:false,current:'idea',completed:[],notes:{},questionDrafts:{},replyDrafts:{},questions:[],reminders:true});
export function normalizeState(raw){
 const s=defaultState();if(!raw||raw.version!==1)return s;
 if(statuses.includes(raw.status))s.status=raw.status;
 s.renewalCancelled=Boolean(raw.renewalCancelled)||['cancelled','expired'].includes(s.status);
 const ids=lessons.map(l=>l.id);if(ids.includes(raw.current))s.current=raw.current;
 if(Array.isArray(raw.completed))s.completed=[...new Set(raw.completed.filter(id=>ids.includes(id)))];
 if(raw.notes&&typeof raw.notes==='object')for(const id of ids)if(typeof raw.notes[id]==='string')s.notes[id]=raw.notes[id].slice(0,2000);
 for(const id of ids)if(typeof raw.questionDrafts?.[id]==='string')s.questionDrafts[id]=raw.questionDrafts[id].slice(0,800);
 if(raw.replyDrafts&&typeof raw.replyDrafts==='object')for(const [id,text] of Object.entries(raw.replyDrafts).slice(-100))if(typeof text==='string')Object.defineProperty(s.replyDrafts,id,{value:text.slice(0,500),enumerable:true,writable:true,configurable:true});
 if(Array.isArray(raw.questions))s.questions=raw.questions.filter(q=>q&&typeof q.id==='string'&&ids.includes(q.lesson)&&typeof q.text==='string'&&q.text.trim()).slice(-50).map(q=>({id:q.id,text:q.text.slice(0,800),lesson:q.lesson,replies:Array.isArray(q.replies)?q.replies.slice(-20).flatMap((r,i)=>{
  if(typeof r==='string'){const own=r.startsWith('Vos · ejemplo local: ');return [{id:`legacy-${q.id}-${i}`,author:own?'Vos · ejemplo local':'Grimmy · ejemplo',text:(own?r.slice('Vos · ejemplo local: '.length):r.replace(/^Grimmy · ejemplo:\s*/,'' )).slice(0,500)}]}
  if(r&&typeof r.id==='string'&&typeof r.text==='string')return [{id:r.id,author:r.author==='Grimmy · ejemplo'?'Grimmy · ejemplo':'Vos · ejemplo local',text:r.text.slice(0,500)}];return [];
 }):[]}));
 if(typeof raw.reminders==='boolean')s.reminders=raw.reminders;return s;
}
export const progress=s=>Math.round(s.completed.length/lessons.length*100);
export const resumeLesson=s=>lessons.find(l=>l.id===s.current&&!s.completed.includes(l.id))||lessons.find(l=>!s.completed.includes(l.id))||lessons.find(l=>l.id===s.current)||lessons[0];
export const nextLesson=s=>lessons.slice(lessons.findIndex(l=>l.id===s.current)+1).find(l=>!s.completed.includes(l.id))||lessons.find(l=>!s.completed.includes(l.id));
export function membershipDates(s){
 const dates={active:['Próximo cobro','2 de diciembre de 2026'],cancelled:['Acceso hasta','2 de diciembre de 2026'],grace:['Resolvé pago antes de','5 de noviembre de 2026'],suspended:['Gracia terminada el','1 de noviembre de 2026'],expired:['Acceso terminado el','1 de noviembre de 2026']};
 return {label:dates[s.status][0],date:dates[s.status][1]};
}
