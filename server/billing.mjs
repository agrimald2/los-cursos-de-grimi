import {createClient} from '@supabase/supabase-js';
import {BillingError,mercadoPago,validId,checkoutUrl} from './mercadopago.mjs';
export const TERMS_VERSION='2026-11-03-preventa';
const origin='https://cursos.alonsogrimaldo.com';

export function send(res,status,data){
  res.setHeader('Cache-Control','no-store, private');res.setHeader('Content-Type','application/json; charset=utf-8');
  res.statusCode=status;res.end(JSON.stringify(data));
}
export function fail(res,error){
  const known=error instanceof BillingError;
  if(!known)console.error('billing_operation_failed');
  send(res,known?error.status:503,{error:known?error.code:'billing_unavailable'});
}
export async function readBody(req){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new BillingError('json_required',415);
  if(Number(req.headers['content-length']||0)>16000)throw new BillingError('body_too_large',413);
  let body=req.body;
  if(body===undefined){let text='';for await(const chunk of req){text+=chunk;if(text.length>16000)throw new BillingError('body_too_large',413)}body=text}
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{throw new BillingError('invalid_json',400)}}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>16000)throw new BillingError('invalid_body',400);
  return body;
}
export function requireOrigin(req){if(req.headers.origin!==origin)throw new BillingError('invalid_origin',403)}

export function context(){
  const e=process.env;
  if(!e.PUBLIC_SUPABASE_URL||!e.SUPABASE_SERVICE_ROLE_KEY||!e.PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new BillingError('billing_not_configured',503);
  const options={auth:{autoRefreshToken:false,persistSession:false}};
  const service=createClient(e.PUBLIC_SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY,options);
  const auth=createClient(e.PUBLIC_SUPABASE_URL,e.PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
  const config={accessToken:e.MERCADOPAGO_ACCESS_TOKEN,collectorId:e.MERCADOPAGO_COLLECTOR_ID,applicationId:e.MERCADOPAGO_APPLICATION_ID,
    planId:e.MERCADOPAGO_PLAN_ID,mode:e.MERCADOPAGO_MODE,origin};
  const provider=mercadoPago(config);
  async function rpc(name,args){const {data,error}=await service.rpc(name,args);if(error)throw new BillingError('billing_storage_failed',503);return data}
  return {provider,config,rpc,
    async user(req){
      const header=req.headers.authorization;
      if(typeof header!=='string'||!header.startsWith('Bearer '))throw new BillingError('authentication_required',401);
      const {data,error}=await auth.auth.getUser(header.slice(7));
      if(error||!data.user?.id||!data.user.email_confirmed_at)throw new BillingError('authentication_required',401);
      return data.user;
    },
    async find(args){return rpc('billing_find',{p_id:null,p_provider_id:null,p_payment_id:null,...args})},
    async summary(userId){return rpc('billing_summary',{p_user:userId,p_mode:config.mode})},
    async save(order,subscription,checkout_url){
      const normalized=provider.validateSubscription(subscription,order);
      await rpc('billing_save_subscription',{p_id:order.id,p_data:{...normalized,...(checkout_url?{checkout_url:checkoutUrl(checkout_url)}:{})}});
    }
  };
}

async function bindSubscription(ctx,subscription){
  let order=await ctx.find({p_provider_id:String(subscription.id)});
  if(!order&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(subscription.external_reference)))order=await ctx.find({p_id:subscription.external_reference});
  if(!order||order.mode!==ctx.config.mode)return null;
  const bound={...order,provider_subscription_id:order.provider_subscription_id||String(subscription.id)};
  await ctx.save(bound,subscription,subscription.init_point);
  return bound;
}
export async function reconcileInvoice(ctx,invoice,knownOrder){
  const subscription=await ctx.provider.getSubscription(invoice.preapproval_id);
  const order=knownOrder||await bindSubscription(ctx,subscription);
  if(!order||order.mode!==ctx.config.mode)return;
  const payment=invoice.payment?.id?await ctx.provider.getPayment(String(invoice.payment.id)):null;
  const normalized=ctx.provider.normalizeInvoice(invoice,payment,subscription,order);
  await ctx.rpc('billing_record_invoice',{p_id:order.id,p_data:normalized});
  await ctx.save(order,subscription);
}

export async function refreshOrder(ctx,order){
  if(!order||order.mode!==ctx.config.mode)return;
  let subscription;
  if(order.provider_subscription_id)subscription=await ctx.provider.getSubscription(order.provider_subscription_id);
  else{
    subscription=await ctx.provider.findSubscription(order.id);
    if(!subscription)return;
    order={...order,provider_subscription_id:String(subscription.id)};
  }
  await ctx.save(order,subscription,subscription.init_point);
  if(order.cancellation_requested&&!['cancelled','canceled'].includes(subscription.status)){
    const cancelled=await ctx.provider.cancelSubscription(order);
    await ctx.rpc('billing_save_subscription',{p_id:order.id,p_data:cancelled});
  }
  const invoices=await ctx.provider.listInvoices(order.provider_subscription_id);
  // Refresh recent invoices only; webhook events reconcile each older invoice independently.
  for(const invoice of invoices.slice(0,3))await reconcileInvoice(ctx,invoice,order);
}

export async function billingHandler(req,res){
  try{
    if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');throw new BillingError('method_not_allowed',405)}
    const ctx=context(),user=await ctx.user(req);
    let summary=await ctx.summary(user.id);
    if(req.method==='POST'){
      requireOrigin(req);
      const body=await readBody(req);
      if(body.action==='subscribe'){
        if(ctx.config.mode==='test'&&!summary.is_admin)throw new BillingError('test_access_restricted',403);
        if(ctx.config.mode==='live'&&process.env.BILLING_ENABLED!=='true')throw new BillingError('sales_not_open',409);
        if(body.terms_version!==TERMS_VERSION)throw new BillingError('accept_terms_required',400);
        await ctx.rpc('billing_accept_terms',{p_user:user.id,p_version:TERMS_VERSION});
        const email=ctx.config.mode==='test'?process.env.MERCADOPAGO_TEST_BUYER_EMAIL:user.email;
        if(!email)throw new BillingError('test_buyer_not_configured',503);
        const reserved=await ctx.rpc('billing_reserve',{p_user:user.id,p_mode:ctx.config.mode});
        let order=reserved.subscription;
        if(reserved.created){
          let created;
          try{created=await ctx.provider.createSubscription(order,email)}catch(error){
            if(error.creationUncertain===false)await ctx.rpc('billing_fail_attempt',{p_id:order.id});
            throw error;
          }
          order={...order,provider_subscription_id:String(created.subscription.id)};
          await ctx.save(order,created.subscription,created.checkout_url);
        }else await refreshOrder(ctx,order);
      }else if(body.action==='cancel'){
        const id=summary.subscription?.id;
        if(!id)throw new BillingError('subscription_not_found',404);
        const order=await ctx.rpc('billing_request_cancel',{p_user:user.id,p_id:id});
        if(order.state==='cancelled'){}
        else if(!order.provider_subscription_id){await refreshOrder(ctx,order)}
        else{
          const cancelled=await ctx.provider.cancelSubscription(order);
          await ctx.rpc('billing_save_subscription',{p_id:order.id,p_data:cancelled});
        }
      }else if(body.action==='refresh'){
        if(summary.subscription?.id)await refreshOrder(ctx,await ctx.find({p_id:summary.subscription.id}));
      }else throw new BillingError('invalid_action',400);
      summary=await ctx.summary(user.id);
    }
    send(res,200,{...summary,mode:ctx.config.mode,sales_open:ctx.config.mode==='live'&&process.env.BILLING_ENABLED==='true',terms_version:TERMS_VERSION});
  }catch(error){fail(res,error)}
}

export async function webhookHandler(req,res){
  try{
    if(req.method!=='POST')throw new BillingError('method_not_allowed',405);
    const secret=process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if(!secret)throw new BillingError('webhook_not_configured',503);
    const url=new URL(req.url,origin),id=url.searchParams.get('data.id');
    const {verifySignature}=await import('./mercadopago.mjs');
    if(!verifySignature({signature:req.headers['x-signature'],requestId:req.headers['x-request-id'],dataId:id,secret}))throw new BillingError('invalid_signature',401);
    const body=await readBody(req);
    if(String(body.data?.id).toLowerCase()!==id.toLowerCase())throw new BillingError('resource_mismatch',400);
    const ctx=context();
    if(body.type==='subscription_authorized_payment'){
      await reconcileInvoice(ctx,await ctx.provider.getInvoice(id));
    }else if(body.type==='subscription_preapproval'){
      const subscription=await ctx.provider.getSubscription(id);
      if(!validId(String(subscription.id))||String(subscription.id).toLowerCase()!==id.toLowerCase())throw new BillingError('resource_mismatch',400);
      const order=await bindSubscription(ctx,subscription);
      if(order&&order.cancellation_requested&&!['cancelled','canceled'].includes(subscription.status)){
        const cancelled=await ctx.provider.cancelSubscription(order);
        await ctx.rpc('billing_save_subscription',{p_id:order.id,p_data:cancelled});
      }
    }else if(body.type==='payment'){
      const order=await ctx.find({p_payment_id:id});
      if(order){
        const invoice=order.linked_invoice_id?await ctx.provider.getInvoice(order.linked_invoice_id):null;
        if(invoice)await reconcileInvoice(ctx,invoice,order);
      }
    }
    send(res,200,{received:true});
  }catch(error){fail(res,error)}
}
