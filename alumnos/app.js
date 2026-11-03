import {lessons,defaultState,hasAccess,progress,resumeLesson,nextLesson,membershipDates} from './model.mjs';
import {createStore,mergeState,KEY} from './store.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const store=createStore(localStorage,navigator.locks);
let state=defaultState(),storageWorks=true,unsaved=false,queue=Promise.resolve(),draftTimer,toastTimer,actionBusy=false;
function beginAction(){if(actionBusy){toast('Esperá que termine guardado antes de otra acción.');return false}actionBusy=true;return true}
try{state=store.load()}catch(error){storageWorks=false;showStorageError(error)}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500)}
function showStorageError(error){storageWorks=false;$('#storage-warning').hidden=false;$('#storage-message').textContent=error.name==='ConflictError'?error.message:'No se guardaron cambios. Tu texto sigue en esta página; reintentá o copiálo antes de cerrar.';$('#notes-status').textContent='No guardado. Conservá tu texto antes de cerrar.'}
function persist(options={}){
 const operation=queue.then(async()=>{const snapshot=structuredClone(state);try{
  const saved=await store.save(snapshot,options),current=state.current;state=mergeState(snapshot,state,saved);if(!options.reset)state.current=current;unsaved=JSON.stringify({...state,current:saved.current})!==JSON.stringify(saved);storageWorks=true;$('#storage-warning').hidden=true;return true;
 }catch(error){unsaved=true;showStorageError(error);return false}});
 queue=operation.then(()=>{});return operation;
}
function saveDraft(){unsaved=true;if($('#notes-status').textContent!=='Guardando…')$('#notes-status').textContent='Guardando…';clearTimeout(draftTimer);draftTimer=setTimeout(async()=>{if(await persist())$('#notes-status').textContent='Guardado en este navegador.'},600)}
$('#retry-save').onclick=async()=>{if(await persist()){renderProgress();renderAccess();$('#notes-status').textContent='Guardado en este navegador.';toast('Guardado confirmado. Si había consulta sin enviar, podés enviarla ahora.')}};
window.addEventListener('beforeunload',e=>{if(unsaved){e.preventDefault();e.returnValue=''}});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;queue.then(()=>{try{const current=state.current;state=store.sync(state);state.current=current;renderProgress();renderAccess();updateLessonControls();const note=state.notes[current]||'',draft=state.questionDrafts[current]||'';if($('#lesson-notes').value!==note)$('#lesson-notes').value=note;$('#notes-count').textContent=note.length+'/2000';if($('#question-text').value!==draft)$('#question-text').value=draft;renderQuestions();toast('Cambios de otra pestaña sincronizados.')}catch(error){showStorageError(error)}})});

const labels={active:'Membresía activa · demo',grace:'Tres días de gracia · demo',cancelled:'Cancelada · acceso vigente en demo',suspended:'Acceso suspendido · demo',expired:'Período terminado · demo'};
const rules={active:'Acceso completo a todos los cursos disponibles.',grace:'Conservás acceso durante tres días de gracia tras renovación fallida.',cancelled:'Sin nuevas renovaciones. Conservás acceso hasta terminar el período pagado.',suspended:'Terminó la gracia sin pago confirmado. Acceso al contenido suspendido.',expired:'Terminó el período pagado tras cancelación. Sin acceso al contenido.'};
const icon=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const views=[['inicio','Mi inicio','<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>'],['cursos','Mis cursos','<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3Z"/>'],['aula','Mi aula','<circle cx="5" cy="5" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h9"/>'],['encuentros','Encuentros','<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/>'],['cuenta','Mi cuenta','<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>']];
$('#navigation').innerHTML=views.map(([id,title,path])=>`<a href="#${id}" data-nav="${id}">${icon(path)}<span>${title}</span></a>`).join('');
function guard(){if(hasAccess(state.status))return true;toast('Este estado de demo no tiene acceso al contenido. Revisá cuenta.');return false}
function focusContent(el){if(!el||el.closest('[hidden]'))return;el.focus({preventScroll:true});el.scrollIntoView({block:'start',behavior:'instant'})}
function renderProgress(){
 const pct=progress(state),resume=resumeLesson(state),complete=state.completed.length===6;
 $$('[data-progress-bar]').forEach(el=>el.style.setProperty('--value',pct+'%'));$$('[role=progressbar]').forEach(el=>el.setAttribute('aria-valuenow',String(pct)));
 $$('[data-progress-label]').forEach(el=>el.textContent=state.completed.length+' de 6 etapas completadas');$$('[data-progress-percent]').forEach(el=>el.textContent=pct+'%');
 $('#welcome-progress').textContent=complete?'Buenazo. Completaste recorrido de esta demo. Podés repasar cualquier etapa.':'Para retomar: '+resume.title+'.';$('#resume-title').textContent=resume.title;
 $('#continue-button').textContent=(complete?'Repasar: ':'Retomar: ')+resume.stage;$('#continue-button').href='#aula/'+resume.id;
}
function renderAccess(){
 const access=hasAccess(state.status),date=membershipDates(state);$('#aula-lock').hidden=access;$('#aula-content').hidden=!access;$('#meeting-lock').hidden=access;$('#calendar-download').disabled=!access;
 $('#account-status').textContent=labels[state.status];$('#membership-rule').textContent=rules[state.status];$('#renewal-rule').textContent=state.renewalCancelled?'Próximas renovaciones canceladas en demo.':'Renovación automática cuando esté integrada.';
 $('#membership-date').textContent=date.label+': '+date.date+' · Perú.';$('#cancel-date').textContent=state.status==='active'?'Acceso de ejemplo hasta el 2 de diciembre de 2026.':date.label+': '+date.date+'.';
 $('#demo-status').value=state.status;$('#cancel-membership').disabled=state.renewalCancelled||['cancelled','expired'].includes(state.status);$('#reminders').checked=state.reminders;
 $('#access-notice').hidden=state.status==='active';$('#access-notice').textContent=rules[state.status]+' '+date.label+': '+date.date+'. Fecha ilustrativa.';
}
const tabs=$$('[role=tab]');function activateTab(tab,focus=false){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$('#'+t.getAttribute('aria-controls')).hidden=!active});if(focus)tab.focus()}
tabs.forEach((tab,i)=>{tab.onclick=()=>activateTab(tab);tab.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();activateTab(tabs[next],true)}}});
const currentLesson=()=>lessons.find(l=>l.id===state.current);
// Keep route buttons stable; updating progress must not remove keyboard focus or reply drafts.
lessons.forEach((item,i)=>{const b=document.createElement('button');b.className='lesson-button';b.dataset.lesson=item.id;const n=document.createElement('span');n.className='lesson-number';n.textContent=String(i+1).padStart(2,'0');const title=document.createElement('span');title.textContent=item.stage;const done=document.createElement('span');done.className='done';done.setAttribute('aria-hidden','true');b.append(n,title,done);b.onclick=()=>{if(guard())location.hash='aula/'+item.id};$('#lesson-list').append(b)});
function updateLessonControls(){
 const l=currentLesson(),done=state.completed.includes(l.id),next=lessons[lessons.findIndex(x=>x.id===l.id)+1],advance=nextLesson({...state,completed:[...new Set([...state.completed,l.id])]});
 $('#complete-lesson').textContent=done?'Desmarcar como completada':'Marcar como completada';$('#complete-lesson').setAttribute('aria-pressed',String(done));
 $('#complete-next').textContent=advance?(done?'Seguir con ':'Completar y seguir con ')+advance.stage:(done?'Ver mis cursos':'Completar recorrido');$('#next-lesson').textContent=next?'Ir a '+next.stage+' sin completar':'Volver a mis cursos';
 $('#outline-summary').textContent='Etapa '+(lessons.indexOf(l)+1)+' de 6 · '+l.stage+' · Ver recorrido';
 $$('[data-lesson]').forEach(b=>{const item=lessons.find(x=>x.id===b.dataset.lesson),completed=state.completed.includes(item.id);b.setAttribute('aria-current',String(item.id===l.id));b.setAttribute('aria-label',item.stage+(completed?', completada':''));b.querySelector('.done').textContent=completed?'✓':''});
}
function renderLesson(){
 const l=currentLesson();$('#lesson-title').textContent=l.title;$('#lesson-stage').textContent=l.stage;$('#lesson-lead').textContent=l.lead;$('#lesson-steps').replaceChildren();
 l.steps.forEach(text=>{const li=document.createElement('li');li.textContent=text;$('#lesson-steps').append(li)});$('#lesson-exercise').textContent=l.exercise;
 $('#lesson-notes').value=state.notes[l.id]||'';$('#notes-count').textContent=$('#lesson-notes').value.length+'/2000';$('#notes-status').textContent=storageWorks?'Notas guardadas solo en este navegador.':'No guardado. Conservá texto antes de cerrar.';
 $('#question-text').value=state.questionDrafts[l.id]||'';$('#question-destination').textContent='Pregunta para: '+l.title;$('#question-error').hidden=true;$('#question-text').removeAttribute('aria-invalid');$('#material-title').textContent='Guía: '+l.stage;updateLessonControls();renderQuestions();
}
function questionsForLesson(){const l=currentLesson(),id='example-'+l.id;return [state.questions.find(q=>q.id===id)||{id,lesson:l.id,text:'¿Qué parte debería probar primero en esta etapa?',replies:[{id:'seed-'+l.id,author:'Grimmy · ejemplo',text:'Empezá por ejercicio de clase y anotá qué resultado esperabas.'}]},...state.questions.filter(q=>q.lesson===l.id&&q.id!==id)]}
function renderQuestions(){
 const host=$('#questions'),qs=questionsForLesson(),ids=new Set(qs.map(q=>q.id));[...host.children].forEach(el=>{if(!ids.has(el.dataset.question))el.remove()});
 for(const q of qs){let article=[...host.children].find(el=>el.dataset.question===q.id);
  if(!article){
   article=document.createElement('article');article.className='thread';article.dataset.question=q.id;
   const name=document.createElement('strong');name.textContent=q.id.startsWith('example-')?'Alumno de ejemplo':'Vos · consulta local';const body=document.createElement('p');body.className='body';body.textContent=q.text;
   const replies=document.createElement('div');replies.className='thread-replies';const form=document.createElement('form');form.className='reply-input';form.noValidate=true;
   const label=document.createElement('label');label.className='field';label.textContent='Sumá tu respuesta';const textarea=document.createElement('textarea');textarea.className='control';textarea.rows=2;textarea.maxLength=500;textarea.placeholder='Lo que probé y me sirvió…';textarea.value=state.replyDrafts[q.id]||'';
   const error=document.createElement('span');error.className='field-error';error.hidden=true;label.append(textarea,error);const button=document.createElement('button');button.className='button secondary';button.type='submit';button.textContent='Responder · demo';form.append(label,button);article.append(name,body,replies,form);host.append(article);
   textarea.oninput=()=>{state.replyDrafts[q.id]=textarea.value;saveDraft()};
   form.onsubmit=async e=>{
    e.preventDefault();if(!guard())return;const text=textarea.value.trim();textarea.setAttribute('aria-invalid',String(!text));error.hidden=Boolean(text);if(!text){error.textContent='Escribí respuesta antes de agregarla.';textarea.focus();return}
    const stored=state.questions.find(x=>x.id===q.id);if((stored?.replies.length||q.replies.length)>=20||(!stored&&state.questions.length>=50)){error.hidden=false;error.textContent='Límite de demo alcanzado. Tu borrador se conserva.';return}
    if(!beginAction())return;const previous=structuredClone(state.questions),oldDraft=state.replyDrafts[q.id]||text,submittedValue=textarea.value;let target=stored;
    if(!target){target=structuredClone(q);state.questions.push(target)}const reply={id:crypto.randomUUID(),author:'Vos · ejemplo local',text};target.replies.push(reply);state.replyDrafts[q.id]='';button.disabled=true;
    const ok=await persist();button.disabled=false;actionBusy=false;if(!ok){state.questions=previous;state.replyDrafts[q.id]=oldDraft;error.hidden=false;error.textContent='No guardado. Tu respuesta sigue acá; reintentá.';return}
    if(textarea.value===submittedValue)textarea.value='';error.hidden=true;renderQuestions();const added=[...article.querySelector('.thread-replies').children].find(el=>el.dataset.reply===reply.id);if(article.isConnected)added?.focus({preventScroll:true});toast('Respuesta guardada en este navegador.');
   };
  }
  const replies=article.querySelector('.thread-replies');for(const r of q.replies)if(![...replies.children].some(el=>el.dataset.reply===r.id)){const div=document.createElement('div');div.className='reply';div.dataset.reply=r.id;div.tabIndex=-1;const author=document.createElement('strong');author.textContent=r.author;const p=document.createElement('p');p.textContent=r.text;div.append(author,p);replies.append(div)}
  const textarea=article.querySelector('textarea'),draft=state.replyDrafts[q.id]||'';if(textarea.value!==draft)textarea.value=draft;
 }
}
function renderAll(){renderProgress();renderAccess();renderLesson();renderCourses()}
let previousView='',previousLesson='';
async function route(){
 const parts=location.hash.slice(1).split('/'),view=views.some(([id])=>id===parts[0])?parts[0]:'inicio';
 if(view==='aula'&&lessons.some(l=>l.id===parts[1])&&parts[1]!==state.current){state.current=parts[1];persist()}
 const changedLesson=previousLesson!==state.current;$$('[data-view]').forEach(el=>el.hidden=el.dataset.view!==view);$$('[data-nav]').forEach(a=>{if(a.dataset.nav===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 document.title=views.find(([id])=>id===view)[1]+' · LOS CURSOS DE GRIMI';renderAccess();if(changedLesson){renderLesson();renderProgress();activateTab($('#tab-guide'));if(matchMedia('(max-width:800px)').matches)$('#lesson-outline').open=false}
 if(view!==previousView||changedLesson){const target=view==='aula'&&hasAccess(state.status)?$('#lesson-title'):$(`[data-view="${view}"] h1`);requestAnimationFrame(()=>focusContent(target))}previousView=view;previousLesson=state.current;
}
window.addEventListener('hashchange',route);
async function complete(andNext=false){
 if(!guard()||!beginAction())return;const id=state.current,previous=[...state.completed],wasDone=previous.includes(id);state.completed=andNext?[...new Set([...previous,id])]:wasDone?previous.filter(x=>x!==id):[...previous,id];
 $('#complete-lesson').disabled=true;$('#complete-next').disabled=true;const ok=await persist();actionBusy=false;$('#complete-lesson').disabled=false;$('#complete-next').disabled=false;
 if(!ok){state.completed=previous;updateLessonControls();return}renderProgress();updateLessonControls();toast('Progreso guardado en este navegador.');if(andNext){const target=nextLesson({...state,current:id});location.hash=target?'aula/'+target.id:'cursos'}
}
$('#complete-lesson').onclick=()=>complete();$('#complete-next').onclick=()=>complete(true);$('#next-lesson').onclick=()=>{if(!guard())return;const i=lessons.findIndex(l=>l.id===state.current);location.hash=i===lessons.length-1?'cursos':'aula/'+lessons[i+1].id;activateTab($('#tab-guide'))};
$('#lesson-notes').oninput=e=>{if(!guard())return;state.notes[state.current]=e.target.value;$('#notes-count').textContent=e.target.value.length+'/2000';saveDraft()};$('#question-text').oninput=e=>{state.questionDrafts[state.current]=e.target.value;saveDraft()};
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#download-material').onclick=()=>{if(!guard())return;const l=currentLesson();download('LOS CURSOS DE GRIMI — GUÍA DE DEMOSTRACIÓN\n\n'+l.title+'\n\n'+l.lead+'\n\n'+l.steps.map((s,i)=>(i+1)+'. '+s).join('\n')+'\n\nEJERCICIO\n'+l.exercise+'\n','grimmy-guia-'+l.id+'.txt','text/plain;charset=utf-8')};
$('#question-form').onsubmit=async e=>{
 e.preventDefault();if(!guard())return;const input=$('#question-text'),text=input.value.trim(),lesson=state.current;input.setAttribute('aria-invalid',String(!text));$('#question-error').hidden=Boolean(text);if(!text){input.focus();return}if(state.questions.length>=50){toast('Límite de 50 consultas alcanzado. Conservamos tu borrador.');return}
 if(!beginAction())return;const submittedValue=input.value,previous=structuredClone(state.questions),id=crypto.randomUUID();state.questions.push({id,lesson,text,replies:[]});state.questionDrafts[lesson]='';const button=$('#question-form button');button.disabled=true;const ok=await persist();button.disabled=false;actionBusy=false;
 if(!ok){state.questions=previous;state.questionDrafts[lesson]=text;return}if(state.current===lesson){if(input.value===submittedValue)input.value='';renderQuestions();const article=[...$('#questions').children].find(el=>el.dataset.question===id);article.tabIndex=-1;article.focus({preventScroll:true})}toast('Consulta guardada en este navegador.');
};
let courseFilter='all';const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();function renderCourses(){const q=norm($('#course-query').value);let count=0;$$('[data-course]').forEach(c=>{const show=norm(c.dataset.course).includes(q)&&(courseFilter==='all'||courseFilter===c.dataset.status);c.hidden=!show;if(show)count++});$('#course-count').textContent=count+' de 2 cursos';$('#course-empty').hidden=count>0}
$('#course-query').oninput=renderCourses;$$('[data-filter]').forEach(b=>b.onclick=()=>{courseFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCourses()});$('#reset-courses').onclick=()=>{courseFilter='all';$('#course-query').value='';$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.filter==='all')));renderCourses()};
function meetingTime(){$('#meeting-time').textContent=new Intl.DateTimeFormat('es-PE',{timeZone:$('#meeting-zone').value,day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date('2026-11-10T00:00:00Z'))+' · '+$('#meeting-zone').value}$('#meeting-zone').onchange=meetingTime;meetingTime();
$('#calendar-download').onclick=()=>{if(!guard())return;download(['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Grimi//Demo de agenda//ES','BEGIN:VEVENT','UID:grimmy-encuentro-demo-20261109','DTSTAMP:20261102T120000Z','DTSTART:20261110T000000Z','DTEND:20261110T010000Z','SUMMARY:DEMO - Encuentro de Tu primera app con AI','DESCRIPTION:Evento ilustrativo. No es una reunion confirmada.','STATUS:TENTATIVE','END:VEVENT','END:VCALENDAR',''].join('\r\n'),'grimmy-encuentro-demo.ics','text/calendar;charset=utf-8')};
$('#reminders').onchange=async e=>{if(!beginAction()){renderAccess();return}const old=state.reminders;state.reminders=e.target.checked;if(await persist())toast('Preferencia guardada. No se enviarán emails.');else state.reminders=old;actionBusy=false;renderAccess()};
$('#demo-status').onchange=async e=>{if(!beginAction()){renderAccess();return}const old={status:state.status,renewalCancelled:state.renewalCancelled};state.status=e.target.value;state.renewalCancelled=['cancelled','expired'].includes(state.status);if(await persist())toast('Estado de demo guardado: '+labels[state.status]);else Object.assign(state,old);actionBusy=false;renderAccess()};
$('#update-payment').onclick=()=>$('#payment-dialog').showModal();$('#cancel-membership').onclick=()=>$('#cancel-dialog').showModal();
$('#confirm-cancel').onclick=async()=>{if(!beginAction())return;const old={status:state.status,renewalCancelled:state.renewalCancelled};state.renewalCancelled=true;if(state.status==='active')state.status='cancelled';$('#confirm-cancel').disabled=true;const ok=await persist();$('#confirm-cancel').disabled=false;if(ok){$('#cancel-dialog').close();toast('Cancelación de ejemplo guardada. Acceso hasta fecha indicada.')}else Object.assign(state,old);actionBusy=false;renderAccess()};
$('#reset-demo').onclick=()=>$('#reset-dialog').showModal();$('#confirm-reset').onclick=async()=>{if(!beginAction())return;const resetOK=await persist({reset:true});actionBusy=false;if(resetOK){$('#reset-dialog').close();renderAll();location.hash='cuenta';route();toast('Datos de esta demo reiniciados.')}};$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
const mobile=matchMedia('(max-width:800px)');$('#lesson-outline').open=!mobile.matches;mobile.addEventListener('change',e=>$('#lesson-outline').open=!e.matches);
renderAll();route();
