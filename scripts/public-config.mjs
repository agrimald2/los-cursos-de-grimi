export function publicConfig(env){
  const url=env.PUBLIC_SUPABASE_URL||'';
  const key=env.PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
  if(!url&&!key)return {supabaseUrl:null,supabasePublishableKey:null};
  if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url))throw new Error('Invalid public Supabase URL');
  let publishable=key.startsWith('sb_publishable_');
  if(key.split('.').length===3){
    try{publishable=JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='anon'}catch{}
  }
  if(!publishable)throw new Error('Only a publishable or anon key may be bundled for browsers');
  return {supabaseUrl:url,supabasePublishableKey:key};
}
