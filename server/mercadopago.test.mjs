import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {cents,checkoutUrl,verifySignature,mercadoPago} from './mercadopago.mjs';
import {readBody,requireOrigin,webhookHandler} from './billing.mjs';

const now=1793660400000,ts=String(now/1000),secret='test-secret';
function signed(id='ABC123',requestId='request-1'){
  return {secret,now,dataId:id,requestId,signature:`ts=${ts},v1=${createHmac('sha256',secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex')}`};
}
test('signed notification binds resource, request, time and secret',()=>{
  const s=signed();assert.equal(verifySignature(s),true);
  for(const change of [{dataId:'another'},{requestId:'another'},{secret:'wrong'},{now:now+300001},{signature:s.signature+',ts='+ts},{dataId:null},{signature:'ts=1,v1=bad'}])assert.equal(verifySignature({...s,...change}),false);
});
test('money and redirect validation reject rounding and external redirects',()=>{
  assert.equal(cents('50.00'),5000);assert.equal(cents(50),5000);
  for(const value of [0,-1,'50.001','1e4',NaN,'90071992547409999'])assert.throws(()=>cents(value));
  assert.equal(checkoutUrl('https://www.mercadopago.com.pe/subscriptions/checkout?id=x'),'https://www.mercadopago.com.pe/subscriptions/checkout?id=x');
  for(const value of ['https://www.mercadopago.com.pe.evil.test/','http://www.mercadopago.com.pe/','https://user@www.mercadopago.com.pe/','javascript:alert(1)'])assert.throws(()=>checkoutUrl(value));
});
const config={accessToken:'APP_USR-test-only',collectorId:'123',applicationId:'456',planId:'plan',mode:'test',origin:'https://cursos.alonsogrimaldo.com'};
const order={id:'00000000-0000-0000-0000-000000000001',provider_subscription_id:'sub',amount_cents:5000,currency:'PEN',mode:'test'};
const subscription={id:'sub',external_reference:order.id,collector_id:123,application_id:456,auto_recurring:{transaction_amount:50,currency_id:'PEN',frequency:1,frequency_type:'months'},status:'authorized',last_modified:'2026-11-03T01:00:00Z'};
const invoice={id:'inv',preapproval_id:'sub',transaction_amount:50,currency_id:'PEN',debit_date:'2026-11-03T00:00:00Z',last_modified:'2026-11-03T01:00:00Z',payment:{id:789}};
const payment={id:789,collector_id:123,transaction_amount:50,currency_id:'PEN',live_mode:false,status:'approved',date_last_updated:'2026-11-03T01:00:00Z',date_approved:'2026-11-03T01:00:00Z'};
test('mandate does not prove payment; payment must match merchant, mode and amount',()=>{
  const p=mercadoPago(config);
  assert.equal(p.normalizeInvoice(invoice,null,subscription,order).status,'pending');
  assert.equal(p.normalizeInvoice(invoice,payment,subscription,order).status,'approved');
  for(const change of [{collector_id:999},{live_mode:true},{transaction_amount:49},{external_reference:'someone-else'},{id:12},{date_approved:null}])assert.throws(()=>p.normalizeInvoice(invoice,{...payment,...change},subscription,order));
  for(const change of [{application_id:999},{external_reference:'someone-else'},{status:'unknown'}])assert.throws(()=>p.validateSubscription({...subscription,...change},order));
});
test('checkout refuses real merchant in test mode before creating mandate',async()=>{
  const calls=[];
  const p=mercadoPago(config,async url=>{calls.push(url);return new Response(JSON.stringify({id:123,site_id:'MPE',tags:[]}))});
  await assert.rejects(p.createSubscription(order,'test@example.invalid'),e=>e.code==='merchant_environment_mismatch'&&e.creationUncertain===false);
  assert.equal(calls.length,1);
});
test('ambiguous creation remains reserved; definitive rejection may retry',async()=>{
  for(const status of [400,500]){
    const p=mercadoPago(config,async url=>{
      if(url.endsWith('/users/me'))return Response.json({id:123,site_id:'MPE',tags:['test_user']});
      if(url.includes('/preapproval_plan/'))return Response.json({id:'plan',collector_id:123,auto_recurring:subscription.auto_recurring});
      return new Response('{}',{status});
    });
    await assert.rejects(p.createSubscription(order,'test@example.invalid'),e=>e.creationUncertain===(status===500));
  }
});
test('request body and origin checks reject malformed requests',async()=>{
  assert.throws(()=>requireOrigin({headers:{origin:'https://evil.test'}}));
  await assert.rejects(readBody({headers:{'content-type':'text/plain'},body:{}}));
  await assert.rejects(readBody({headers:{'content-type':'application/json'},body:'{broken'}));
  await assert.rejects(readBody({headers:{'content-type':'application/json'},body:[]}));
});
test('webhook rejects unsigned request before provider or database access',async()=>{
  const previous=process.env.MERCADOPAGO_WEBHOOK_SECRET;process.env.MERCADOPAGO_WEBHOOK_SECRET=secret;
  try{
    const res={setHeader(){},end(body){this.body=JSON.parse(body)}};
    await webhookHandler({method:'POST',url:'/api/mercadopago-webhook?data.id=123',headers:{},body:{}},res);
    assert.equal(res.statusCode,401);assert.equal(res.body.error,'invalid_signature');
  }finally{if(previous===undefined)delete process.env.MERCADOPAGO_WEBHOOK_SECRET;else process.env.MERCADOPAGO_WEBHOOK_SECRET=previous}
});
