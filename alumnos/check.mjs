import assert from 'node:assert/strict';
import {lessons,hasAccess,normalizeState,progress,defaultState} from './model.mjs';
assert.equal(lessons.length,6);
for(const s of ['active','grace','cancelled'])assert.ok(hasAccess(s));
for(const s of ['suspended','expired','unknown'])assert.equal(hasAccess(s),false);
const s=normalizeState({version:1,status:'bad',current:'missing',completed:['idea','idea','bad'],notes:{idea:'a'.repeat(3000),bad:'discard'},questions:[null,{id:'1',lesson:'idea',text:'Consulta',replies:['Respuesta',null]}]});
assert.equal(s.status,'active');assert.equal(s.current,'idea');assert.deepEqual(s.completed,['idea']);assert.equal(s.notes.idea.length,2000);assert.equal(s.questions[0].replies.length,1);assert.equal(progress(s),17);assert.deepEqual(normalizeState({version:0}),defaultState());
console.log('Modelo de demo: acceso, progreso y datos locales verificados.');
