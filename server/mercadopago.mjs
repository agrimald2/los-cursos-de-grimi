import {createHmac,timingSafeEqual} from 'node:crypto';

export class BillingError extends Error {
  constructor(code,status=502){super(code);this.code=code;this.status=status}
}
export const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);
export function cents(value){
  const text=String(value);
  if(!/^\d+(\.\d{1,2})?$/.test(text))throw new BillingError('invalid_amount');
  const [whole,fraction='']=text.split('.');
  const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(result)||result<1)throw new BillingError('invalid_amount');
  return result;
}
export function timestamp(value){
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT/.test(value)||!Number.isFinite(Date.parse(value)))throw new BillingError('invalid_provider_date');
  return new Date(value).toISOString();
}
export function verifySignature({signature,requestId,dataId,secret,now=Date.now()}){
  if(!secret||!validId(dataId)||typeof requestId!=='string'||!requestId||requestId.length>200||typeof signature!=='string')return false;
  const entries=signature.split(',').map(s=>s.trim().split('='));
  if(entries.some(p=>p.length!==2)||entries.filter(p=>p[0]==='ts').length!==1||entries.filter(p=>p[0]==='v1').length!==1)return false;
  const fields=Object.fromEntries(entries),ts=fields.ts,hash=fields.v1;
  if(!/^\d{10}(\d{3})?$/.test(ts)||!/^\w{64}$/.test(hash)||!/^[a-fA-F0-9]+$/.test(hash))return false;
  const milliseconds=Number(ts)*(ts.length===10?1000:1);
  if(Math.abs(now-milliseconds)>300_000)return false;
  const manifest=`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected=createHmac('sha256',secret).update(manifest).digest();
  return timingSafeEqual(expected,Buffer.from(hash,'hex'));
}
export function checkoutUrl(value){
  let url;try{url=new URL(value)}catch{throw new BillingError('invalid_checkout_url')}
  if(url.protocol!=='https:'||!['www.mercadopago.com.pe','sandbox.mercadopago.com.pe'].includes(url.hostname)||url.username||url.password||url.port)throw new BillingError('invalid_checkout_url');
  return url.href;
}

export function mercadoPago(config,fetcher=fetch){
  const {accessToken,collectorId,applicationId,planId,mode,origin}=config;
  if(!accessToken||!['test','live'].includes(mode)||!validId(collectorId)||!validId(applicationId)||!validId(planId)||origin!=='https://cursos.alonsogrimaldo.com')throw new BillingError('billing_not_configured',503);
  async function request(path,{method='GET',body,key}={}){
    let response;
    try{
      response=await fetcher('https://api.mercadopago.com'+path,{method,headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',...(key?{'X-Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(6500)});
    }catch{throw new BillingError('provider_unavailable')}
    if(!response.ok){const error=new BillingError(response.status<500?'provider_rejected':'provider_unavailable',response.status===404?404:502);error.providerStatus=response.status;throw error}
    const text=await response.text();
    if(text.length>500_000)throw new BillingError('provider_response_too_large');
    try{return JSON.parse(text)}catch{throw new BillingError('invalid_provider_response')}
  }
  const resource=async(path,id)=>{
    if(!validId(String(id)))throw new BillingError('invalid_resource',400);
    const data=await request(`${path}/${encodeURIComponent(id)}`);
    if(String(data.id).toLowerCase()!==String(id).toLowerCase())throw new BillingError('resource_mismatch');
    return data;
  };
  function validateSubscription(subscription,order){
    if(String(subscription.id)!==String(order.provider_subscription_id)||String(subscription.external_reference)!==order.id||String(subscription.collector_id)!==collectorId||String(subscription.application_id)!==applicationId)throw new BillingError('subscription_mismatch');
    const recurring=subscription.auto_recurring||{};
    if(cents(recurring.transaction_amount)!==order.amount_cents||recurring.currency_id!==order.currency||recurring.frequency!==1||recurring.frequency_type!=='months')throw new BillingError('subscription_price_mismatch');
    if(!['pending','authorized','paused','cancelled','canceled'].includes(subscription.status))throw new BillingError('unknown_subscription_status');
    return {provider_id:String(subscription.id),state:subscription.status==='canceled'?'cancelled':subscription.status,provider_updated_at:timestamp(subscription.last_modified)};
  }
  return {
    capabilities:{recurring:true,cancel:true},
    getSubscription:id=>resource('/preapproval',id),
    getInvoice:id=>resource('/authorized_payments',id),
    getPayment:id=>resource('/v1/payments',id),
    async findSubscription(reference){
      const result=await request(`/preapproval/search?external_reference=${encodeURIComponent(reference)}&limit=10`);
      const matches=(result.results||[]).filter(s=>s.external_reference===reference&&String(s.collector_id)===collectorId&&String(s.application_id)===applicationId);
      if(matches.length>1)throw new BillingError('duplicate_subscription_requires_review',409);
      return matches[0]||null;
    },
    async listInvoices(id){
      if(!validId(id))throw new BillingError('invalid_resource',400);
      const result=await request(`/authorized_payments/search?preapproval_id=${encodeURIComponent(id)}&limit=10&sort_by=debit_date&criteria=desc`);
      return (result.results||[]).filter(i=>i.preapproval_id===id).slice(0,10);
    },
    validateSubscription,
    async createSubscription(order,email){
      let attempted=false;
      try{
      const merchant=await request('/users/me');
      const testMerchant=accessToken.startsWith('TEST-')||merchant.tags?.includes('test_user')||merchant.test_user===true;
      if(String(merchant.id)!==collectorId||merchant.site_id!=='MPE'||(mode==='test')!==!!testMerchant)throw new BillingError('merchant_environment_mismatch',503);
      const plan=await resource('/preapproval_plan',planId),recurring=plan.auto_recurring||{};
      if(String(plan.collector_id)!==collectorId||recurring.frequency!==1||recurring.frequency_type!=='months'||recurring.currency_id!==order.currency||cents(recurring.transaction_amount)!==order.amount_cents||recurring.free_trial||recurring.repetitions||recurring.billing_day_proportional)throw new BillingError('plan_configuration_mismatch',503);
      attempted=true;
      const subscription=await request('/preapproval',{method:'POST',key:order.id,body:{preapproval_plan_id:planId,reason:'LOS CURSOS DE GRIMI · membresía mensual',external_reference:order.id,payer_email:email,back_url:origin+'/ingresar/?pago=regreso',status:'pending'}});
      const bound={...order,provider_subscription_id:String(subscription.id)};
      validateSubscription(subscription,bound);
      return {subscription,checkout_url:checkoutUrl(subscription.init_point)};
      }catch(error){error.creationUncertain=attempted&&![400,401,403,404,422].includes(error.providerStatus);throw error}
    },
    async cancelSubscription(order){
      const subscription=await request(`/preapproval/${encodeURIComponent(order.provider_subscription_id)}`,{method:'PUT',body:{status:'cancelled'}});
      const normalized=validateSubscription(subscription,order);
      if(normalized.state!=='cancelled')throw new BillingError('cancellation_unconfirmed');
      return normalized;
    },
    normalizeInvoice(invoice,payment,subscription,order){
      validateSubscription(subscription,order);
      if(!validId(String(invoice.id))||invoice.preapproval_id!==order.provider_subscription_id||invoice.currency_id!==order.currency||cents(invoice.transaction_amount)!==order.amount_cents)throw new BillingError('invoice_mismatch');
      let status='pending',updated=timestamp(invoice.last_modified),paymentId=null;
      if(payment){
        if(String(invoice.payment?.id)!==String(payment.id)||String(payment.collector_id)!==collectorId||payment.currency_id!==order.currency||cents(payment.transaction_amount)!==order.amount_cents||payment.live_mode!==(order.mode==='live')||(payment.external_reference&&payment.external_reference!==order.id))throw new BillingError('payment_mismatch');
        paymentId=String(payment.id);
        const paymentUpdated=timestamp(payment.date_last_updated);
        if(paymentUpdated>updated)updated=paymentUpdated;
        if(['approved','rejected','cancelled','refunded','charged_back','in_mediation'].includes(payment.status))status=payment.status;
        else if(!['pending','in_process','authorized'].includes(payment.status))throw new BillingError('unknown_payment_status');
        if(status==='approved'&&!payment.date_approved)throw new BillingError('approval_date_missing');
      }
      return {invoice_id:String(invoice.id),payment_id:paymentId,period_start:timestamp(invoice.debit_date),status,provider_updated_at:updated,amount_cents:order.amount_cents,currency:order.currency};
    }
  };
}
