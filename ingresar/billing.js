const $=id=>document.getElementById(id);
let authClient,accountId,version=0,busy=false,summary;
const errors={sales_not_open:'Todavía no abrimos las inscripciones.',test_access_restricted:'Las pruebas de pago están reservadas para administración.',authentication_required:'Tu sesión venció. Volvé a ingresar.',accept_terms_required:'Aceptá las condiciones antes de continuar.',provider_unavailable:'Mercado Pago no respondió. Revisá el estado antes de volver a intentar.',cancellation_unconfirmed:'Mercado Pago todavía no confirmó la cancelación. Reintentá la verificación.',duplicate_subscription_requires_review:'Encontramos más de una suscripción. Contactá a administración antes de pagar.'};
function feedback(text){$('billing-message').textContent=text}
function lock(value){busy=value;$('billing').setAttribute('aria-busy',String(value));for(const id of ['subscribe','refresh-payment','cancel-payment','confirm-cancel'])$(id).disabled=value;$('subscribe').disabled=value||!$('payment-terms').checked}
async function request(action){
  const {data}=await authClient.auth.getSession();
  if(!data.session||data.session.user.id!==accountId)throw new Error('authentication_required');
  const response=await fetch('/api/billing',{method:action?'POST':'GET',headers:{Authorization:`Bearer ${data.session.access_token}`,...(action?{'Content-Type':'application/json'}:{})},...(action?{body:JSON.stringify({action,terms_version:summary?.terms_version})}:{}),cache:'no-store'});
  let payload;try{payload=await response.json()}catch{throw new Error('billing_unavailable')}
  if(!response.ok)throw new Error(payload.error||'billing_unavailable');
  return payload;
}
function draw(data){
  summary=data;const sub=data.subscription,member=data.membership,isTest=data.mode==='test';
  $('billing-mode').textContent=isTest?'PRUEBAS · SIN DINERO REAL':'TU MEMBRESÍA';
  $('billing-price').textContent=new Intl.NumberFormat('es-PE',{style:'currency',currency:data.offer.currency}).format(data.offer.amount_cents/100);
  $('billing-notice').textContent=isTest?'Solo administración. Usá cuenta compradora y tarjeta de prueba. Esta prueba no activa acceso a cursos.':'Preventa: primer curso el viernes 6 de noviembre de 2026. S/50 al confirmar y renovación automática mensual. Podés cancelar futuras renovaciones y solicitar devolución según condiciones.';
  const date=member?.paid_until?new Intl.DateTimeFormat('es-PE',{dateStyle:'long',timeZone:'America/Lima'}).format(new Date(member.paid_until)):null;
  let status='Sin suscripción';
  if(sub){
    status=({creating:'Preparando suscripción',pending:'Pendiente de autorización',authorized:'Autorizada · verificando cobro',paused:'Suscripción pausada',cancelled:'Renovación cancelada',failed:'No se pudo iniciar'})[sub.state]||'Verificando suscripción';
    if(sub.latest_invoice?.status==='approved')status=isTest?'Pago de prueba aprobado':`Pago aprobado${date?' · acceso hasta '+date:''}`;
    if(['refunded','charged_back','in_mediation'].includes(sub.latest_invoice?.status))status='Pago devuelto o en revisión';
    if(sub.state==='cancelled')status=`Renovación cancelada${date?' · acceso hasta '+date:''}`;
    else if(sub.cancellation_requested)status='Cancelación solicitada · falta confirmación de Mercado Pago';
  }
  $('billing-status').textContent=status;
  const open=data.sales_open||(isTest&&data.is_admin),canSubscribe=open&&(!sub||['failed','cancelled'].includes(sub.state));
  $('payment-consent').hidden=!canSubscribe;
  $('subscribe').hidden=!canSubscribe;
  $('resume-payment').hidden=!(open&&sub?.state==='pending'&&sub.checkout_url&&!sub.cancellation_requested);
  if(!$('resume-payment').hidden){
    try{const url=new URL(sub.checkout_url);if(url.protocol!=='https:'||!['www.mercadopago.com.pe','sandbox.mercadopago.com.pe'].includes(url.hostname)||url.username||url.password||url.port)throw new Error();$('resume-payment').href=url.href}catch{$('resume-payment').hidden=true}
  }
  $('refresh-payment').hidden=!sub;
  $('cancel-payment').hidden=!sub||['cancelled','failed'].includes(sub.state);
  $('cancel-confirmation').hidden=true;
  if(!open)feedback('Inscripciones todavía cerradas. Crear tu cuenta no genera cobros.');
  lock(false);
}
async function act(action){
  if(busy)return;
  lock(true);feedback(action==='cancel'?'Pidiendo cancelación a Mercado Pago…':'Verificando con Mercado Pago…');
  try{
    const current=version,data=await request(action);if(current!==version)return;
    draw(data);
    if(action==='subscribe'&&data.subscription?.state==='pending'&&!$('resume-payment').hidden){location.assign($('resume-payment').href);return}
    feedback(action==='cancel'?(data.subscription?.state==='cancelled'?'Cancelación confirmada. No habrá nuevas renovaciones.':'Solicitud guardada. Falta confirmar cancelación; volvé a verificar.'):'Estado actualizado. Solo un pago aprobado confirma el cobro.');
  }catch(error){feedback(errors[error.message]||'No pudimos verificar tu membresía. Reintentá; no inicies otro pago mientras revisamos el anterior.')}
  finally{lock(false)}
}
export async function showBilling(client,session){
  authClient=client;accountId=session?.user.id;const current=++version;
  $('billing').hidden=!session;
  if(!session){summary=null;$('payment-terms').checked=false;return}
  $('billing-status').textContent='Revisando membresía…';
  for(const id of ['payment-consent','subscribe','resume-payment','refresh-payment','cancel-payment','cancel-confirmation'])$(id).hidden=true;
  feedback('Conectando con tu cuenta…');
  try{const data=await request();if(current!==version)return;draw(data)}catch{if(current===version)feedback('Pagos en preparación. Tu cuenta está creada; todavía no se realizará ningún cobro.')}
}
$('payment-terms').onchange=()=>{$('subscribe').disabled=busy||!$('payment-terms').checked};
$('subscribe').onclick=()=>act('subscribe');
$('refresh-payment').onclick=()=>act('refresh');
$('cancel-payment').onclick=()=>{$('cancel-confirmation').hidden=false;$('confirm-cancel').focus()};
$('keep-payment').onclick=()=>{$('cancel-confirmation').hidden=true;$('cancel-payment').focus()};
$('confirm-cancel').onclick=()=>act('cancel');
