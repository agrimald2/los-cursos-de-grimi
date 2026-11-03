(() => {
  let deferredInstall,registration,reloadRequested=false;
  let offlineCopy=!!document.querySelector('meta[name="grimi-offline"]');
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const status=document.createElement('aside');
  status.className='pwa-status';status.hidden=true;status.setAttribute('aria-label','Estado de la aplicación');
  const message=document.createElement('span');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const update=document.createElement('button');update.type='button';update.textContent='Actualizar';update.hidden=true;
  status.append(message,update);document.body.append(status);
  const sync=()=>{
    const waiting=!!registration?.waiting&&!!navigator.serviceWorker?.controller;
    const disconnected=!navigator.onLine||offlineCopy;
    status.hidden=!disconnected&&!waiting;
    message.textContent=disconnected?'Sin conexión. Cuenta y pagos necesitan internet.':waiting?'Hay una nueva versión lista. Actualizá cuando termines lo que estás haciendo.':'';
    update.hidden=!waiting||!navigator.onLine;
    document.querySelectorAll('[data-pwa-install]').forEach(button=>button.hidden=!deferredInstall||standalone());
  };
  window.addEventListener('offline',sync);window.addEventListener('online',()=>{offlineCopy=false;sync()});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;sync()});
  window.addEventListener('appinstalled',()=>{deferredInstall=null;sync()});
  document.addEventListener('click',async event=>{
    if(!event.target.closest('[data-pwa-install]')||!deferredInstall)return;
    const prompt=deferredInstall;deferredInstall=null;sync();
    try{await prompt.prompt();await prompt.userChoice}catch{/* Installation remains available through browser controls. */}
  });
  update.onclick=()=>{if(registration?.waiting){reloadRequested=true;registration.waiting.postMessage({type:'SKIP_WAITING'})}};
  if('serviceWorker' in navigator&&isSecureContext){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadRequested)location.reload()});
    navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(reg=>{
      registration=reg;sync();
      reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed')sync()})});
      window.addEventListener('focus',()=>reg.update().catch(()=>{}));
    }).catch(()=>{/* Account access remains available if this browser cannot install the app. */});
  }
  sync();
})();
