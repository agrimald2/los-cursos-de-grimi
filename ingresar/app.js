import {createClient} from '@supabase/supabase-js';
import {showBilling} from './billing.js';
const $=id=>document.getElementById(id);
let client;
let renderVersion=0;
const callbackUrl=new URL(location.href);
const cancelled=callbackUrl.searchParams.has('error')||new URLSearchParams(callbackUrl.hash.slice(1)).has('error');
if(cancelled){callbackUrl.search='';callbackUrl.hash='';history.replaceState(null,'',callbackUrl.href)}
function message(text){$('message').textContent=text}
async function render(session){
  const version=++renderVersion;
  $('signed-in').hidden=!session;
  $('signed-out').hidden=!!session;
  void showBilling(client,session);
  if(!session){
    $('identity').textContent='';$('access').textContent='';
    const response=await fetch(`${client.supabaseUrl}/auth/v1/settings`,{headers:{apikey:client.supabaseKey}});
    if(!response.ok)throw new Error('settings');
    const settings=await response.json();
    if(version!==renderVersion)return;
    const ready=settings.external?.google===true;
    $('google').disabled=!ready;
    message(ready?(cancelled?'No se completó el acceso. Podés reintentar con Google.':'Usá tu cuenta de Google para entrar.'):'Estamos preparando el acceso con Google. Volvé en unos minutos.');
    return;
  }
  $('identity').textContent=session.user.email||'Sesión iniciada';
  message('Cuenta conectada. Revisando tu acceso…');
  const {data,error}=await client.rpc('my_access');
  if(version!==renderVersion)return;
  if(error){message('Tu sesión está activa. No pudimos revisar tu membresía; recargá para reintentar.');return}
  message('Tu cuenta está conectada de forma segura.');
  $('access').textContent=data.is_admin
    ?'Cuenta de administración verificada. El panel conectado está en preparación.'
    :data.has_access
      ?'Membresía vigente. Preventa: el primer curso se habilita el viernes 6 de noviembre de 2026. La demo está disponible por separado.'
      :'Tu cuenta está creada. La membresía todavía no está activa. Podés revisar la preventa abajo.';
}
async function start(){
  const response=await fetch('../assets/config.json',{cache:'no-store'});
  if(!response.ok)throw new Error('configuration');
  const {supabaseUrl,supabasePublishableKey}=await response.json();
  if(!supabaseUrl||!supabasePublishableKey)throw new Error('configuration');
  client=createClient(supabaseUrl,supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
  $('google').onclick=async()=>{
    $('google').disabled=true;message('Te llevamos a Google…');
    try{
      const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('/ingresar/',location.origin).href}});
      if(error)throw error;
    }catch{message('No pudimos abrir Google. Reintentá en unos minutos.');$('google').disabled=false}
  };
  $('logout').onclick=async()=>{
    $('logout').disabled=true;
    const {error}=await client.auth.signOut({scope:'local'});
    $('logout').disabled=false;
    if(error){message('No pudimos cerrar sesión. Reintentá.');return}
    await render(null);
  };
  client.auth.onAuthStateChange((event,session)=>{
    if(['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED'].includes(event))setTimeout(()=>render(session).catch(fail),0);
  });
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  await render(data.session);
}
function fail(){message('No pudimos conectar tu cuenta. Recargá para reintentar.');$('google').disabled=true}
start().catch(fail);
