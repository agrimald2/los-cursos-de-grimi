import {defaultState,normalizeState} from './model.mjs';
export const KEY='grimi-alumnos-demo-v1';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export class ConflictError extends Error{constructor(path){super('Otra pestaña cambió '+path+'. Tu texto sigue disponible; copiálo antes de recargar.');this.name='ConflictError'}}
export function mergeState(base,local,remote){
 function merge(b,l,r,path){
  if(equal(l,b))return r;if(equal(r,b)||equal(l,r))return l;
  if(path==='current')return l; // Last local navigation wins; unlike authored text, this is not a content conflict.
  if(Array.isArray(l)&&Array.isArray(r)){
   if(path==='completed')return [...new Set([...r,...l.filter(v=>!(b||[]).includes(v))])].filter(v=>!(b||[]).includes(v)||l.includes(v));
   const bm=new Map((b||[]).map(x=>[x.id,x])),lm=new Map(l.map(x=>[x.id,x])),rm=new Map(r.map(x=>[x.id,x]));
   return [...new Set([...rm.keys(),...lm.keys()])].map(id=>merge(bm.get(id),lm.get(id),rm.get(id),path+'.'+id)).filter(Boolean);
  }
  if(l&&r&&typeof l==='object'&&typeof r==='object'&&!Array.isArray(l)&&!Array.isArray(r)){
   const out={};for(const key of new Set([...Object.keys(b||{}),...Object.keys(l),...Object.keys(r)])){const v=merge(b?.[key],l[key],r[key],path?path+'.'+key:key);if(v!==undefined)Object.defineProperty(out,key,{value:v,enumerable:true,writable:true,configurable:true})}return out;
  }
  throw new ConflictError(path);
 }
 return merge(base,local,remote,'');
}
export function createStore(storage,locks){
 let base=defaultState();
 function read(){const text=storage.getItem(KEY);return normalizeState(text?JSON.parse(text):null)}
 return {
  load(){base=read();return structuredClone(base)},
  sync(local){const remote=read(),merged=mergeState(base,local,remote);base=structuredClone(remote);return structuredClone(merged)},
  async save(local,{reset=false}={}){
   // Native locks serialize read/merge/write across tabs. Never claim atomic multi-tab writes without them.
   if(!locks?.request)throw new Error('Este navegador no permite guardado coordinado entre pestañas. Conservá una copia de tu texto.');
   return locks.request(KEY,()=>{const remote=read();const merged=reset?defaultState():mergeState(base,local,remote);
    if(merged.questions.length>50||merged.questions.some(q=>q.replies.length>20))throw new Error('Se alcanzó límite de consultas o respuestas de esta demo. Tu texto sigue disponible.');
    const clean=normalizeState(merged);storage.setItem(KEY,JSON.stringify(clean));base=clean;return structuredClone(clean);
   });
  }
 };
}
