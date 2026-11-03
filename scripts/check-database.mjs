import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const name=`grimi-rls-${randomUUID().slice(0,8)}`;
function docker(args,input){const r=spawnSync('docker',args,{input,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout||'Docker unavailable');return r.stdout}
try{
  docker(['run','-d','--rm','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17']);
  let ready=false;
  for(let i=0;i<40;i++){
    const r=spawnSync('docker',['exec',name,'pg_isready','-U','postgres'],{stdio:'ignore'});
    if(r.status===0){ready=true;break}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!ready)throw new Error('Test Postgres did not become ready');
  const bootstrap=`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;`;
  docker(['exec','-i',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],bootstrap);
  for(const file of ['supabase/migrations/20261103000100_academy.sql','supabase/tests/security.sql']){
    docker(['exec','-i',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],readFileSync(file,'utf8'));
  }
  console.log('Postgres RLS: privacy, paid access, drafts, moderation and privilege escalation checks passed.');
}finally{
  spawnSync('docker',['stop',name],{stdio:'ignore'});
}
