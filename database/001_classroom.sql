-- Apply once in the owner's Supabase SQL editor. No student records are public.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists eco_private;
revoke all on schema eco_private from public, anon, authenticated;

create table if not exists eco_private.learners (
 id text primary key,
 class_name text not null check (class_name in ('4A','4B','4C')),
 number integer not null check (number between 1 and 25),
 completed integer not null default 0 check (completed between 0 and 6),
 data jsonb not null default '{"notes":{},"answers":{}}',
 updated bigint not null,
 unique(class_name,number)
);
create table if not exists eco_private.sessions (
 hash text primary key,
 role text not null check(role in ('student','teacher')),
 learner_id text references eco_private.learners(id),
 expires timestamptz not null
);
create index if not exists eco_session_expiry on eco_private.sessions(expires);
create table if not exists eco_private.teacher_settings (
 id integer primary key check(id=1), password_hash text not null
);
create table if not exists eco_private.teacher_attempts (
 id integer primary key check(id=1), count integer not null default 0,
 expires timestamptz not null default now()
);
insert into eco_private.teacher_attempts(id) values (1) on conflict do nothing;
alter table eco_private.learners enable row level security;
alter table eco_private.sessions enable row level security;
alter table eco_private.teacher_settings enable row level security;
alter table eco_private.teacher_attempts enable row level security;
revoke all on all tables in schema eco_private from public, anon, authenticated;

create or replace function eco_private.requirements(p_stage integer,p_data jsonb)
returns text[] language plpgsql set search_path='' as $$
declare
 a jsonb := p_data->'answers'; n jsonb := p_data->'notes';
 missing text[] := '{}'; ok boolean := false; k text; needed text[];
begin
 case p_stage
 when 0 then
  if not coalesce(a->'observed' @> '["grass","grasshopper","frog","snake"]'::jsonb,false) then missing:=array_append(missing,'觀察四種生物'); end if;
  ok:=a->>'match-grasshopper'='grass' and a->>'match-frog'='grasshopper' and a->>'match-snake'='frog';
  needed:=array['observe'];
 when 1 then
  ok:=a->>'arrow-0'='right' and a->>'arrow-1'='left' and a->>'arrow-2'='right'; needed:=array['arrow'];
 when 2 then
  ok:=a#>'{build-0,slots}'='["grass","grasshopper","frog"]'::jsonb and a#>'{build-0,dirs}'='[1,1]'::jsonb
   and a#>'{build-1,slots}'='["grass","grasshopper","frog","snake"]'::jsonb and a#>'{build-1,dirs}'='[1,1,1]'::jsonb;
  needed:=array['build'];
 when 3 then
  ok:=a->'fix-0'='[1,1]'::jsonb and a->>'fix-1'='grass' and a->>'fix-2'='swap'; needed:=array['fix'];
 when 4 then
  ok:=a->>'predict-grass' in ('up','down','same') and a->>'predict-grasshopper' in ('up','down','same')
   and a->>'predict-snake' in ('up','down','same') and a->'simRevealed'='true'::jsonb; needed:=array['sim'];
 when 5 then
  ok:=a#>'{report-chain,slots}'='["grass","rabbit","fox"]'::jsonb and a#>'{report-chain,dirs}'='[1,1]'::jsonb
   and a->>'confidence' in ('我能獨立解釋','我能在提示下解釋','我還想再練習'); needed:=array['report-arrow','report-change'];
 else return array['關卡錯誤'];
 end case;
 if not coalesce(ok,false) then missing:=array_append(missing,'完成本關所有客觀操作'); end if;

 return missing;
end $$;
revoke all on function eco_private.requirements(integer,jsonb) from public,anon,authenticated;

-- Only this validated function is exposed to browsers. No service-role key is used.
create or replace function eco_private.eco_classroom(
 p_action text,p_payload jsonb default '{}'::jsonb,p_token text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 c text; no integer; learner text; t text; role_name text;
 s eco_private.sessions%rowtype; r eco_private.learners%rowtype;
 attempts eco_private.teacher_attempts%rowtype; password_hash text;
 stage integer; next_completed integer; old jsonb; incoming jsonb; k text;
 required jsonb := '[{"answers":["observed","match-grasshopper","match-frog","match-snake"],"notes":["observe"]},{"answers":["arrow-0","arrow-1","arrow-2"],"notes":["arrow"]},{"answers":["build-0","build-1"],"notes":["build"]},{"answers":["fix-0","fix-1","fix-2"],"notes":["fix"]},{"answers":["predict-grass","predict-grasshopper","predict-snake","simRevealed"],"notes":["sim"]},{"answers":["report-chain","confidence"],"notes":["report-arrow","report-change"]}]';
 missing text[]; ms bigint := floor(extract(epoch from clock_timestamp())*1000);
 result jsonb;
begin
 if jsonb_typeof(p_payload) is distinct from 'object' or length(p_payload::text)>40000 then
  return jsonb_build_object('error','提交內容格式錯誤或太長');
 end if;
 if p_action='health' then return '{"ok":true,"database":"supabase","version":1}'::jsonb; end if;
 if p_action in ('student-login','teacher-login') then
  delete from eco_private.sessions where expires < now();
  if p_action='student-login' then
   c:=upper(p_payload->>'className');
   if c is null or c not in ('4A','4B','4C') or jsonb_typeof(p_payload->'number') is distinct from 'number'
    or not coalesce(p_payload->>'number' ~ '^([1-9]|1[0-9]|2[0-5])$',false) then
    return jsonb_build_object('error','請選擇4A–4C及1–25號');
   end if;
   no:=(p_payload->>'number')::integer; learner:=c||'-'||no; role_name:='student';
   insert into eco_private.learners(id,class_name,number,updated) values(learner,c,no,ms) on conflict do nothing;
   select * into r from eco_private.learners where id=learner;
  else
   select * into attempts from eco_private.teacher_attempts where id=1 for update;
   if attempts.expires>now() and attempts.count>=8 then return jsonb_build_object('error','嘗試次數過多，請15分鐘後再試'); end if;
   select ts.password_hash into password_hash from eco_private.teacher_settings ts where id=1;
   if password_hash is null then return jsonb_build_object('error','教師密碼尚未設定'); end if;
   if length(coalesce(p_payload->>'password',''))>100 then return jsonb_build_object('error','教師密碼不正確'); end if;
   if extensions.crypt(coalesce(p_payload->>'password',''),password_hash) is distinct from password_hash then
    update eco_private.teacher_attempts set count=case when expires<=now() then 1 else count+1 end,
      expires=case when expires<=now() then now()+interval '15 minutes' else expires end where id=1;
    return jsonb_build_object('error','教師密碼不正確');
   end if;
   update eco_private.teacher_attempts set count=0,expires=now() where id=1;
   role_name:='teacher';
  end if;
  t:=encode(extensions.gen_random_bytes(32),'hex');
  insert into eco_private.sessions(hash,role,learner_id,expires)
   values(encode(extensions.digest(t,'sha256'),'hex'),role_name,learner,now()+case when role_name='teacher' then interval '8 hours' else interval '48 hours' end);
  if role_name='teacher' then return jsonb_build_object('token',t); end if;
  return jsonb_build_object('token',t,'student',jsonb_build_object('className',c,'number',no),'completed',r.completed,'data',r.data);
 end if;
 if p_token is null or length(p_token)<>64 then return jsonb_build_object('error','請先登入'); end if;
 select * into s from eco_private.sessions where hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires>now();
 if not found then return jsonb_build_object('error','登入已過期，請重新登入'); end if;
 if p_action like 'student-%' and s.role='student' then
  select * into r from eco_private.learners where id=s.learner_id for update;
  if p_action='student-progress' then return jsonb_build_object('student',jsonb_build_object('className',r.class_name,'number',r.number),'completed',r.completed,'data',r.data); end if;
  if p_action in ('student-save','student-complete') then
   if jsonb_typeof(p_payload->'stage') is distinct from 'number' or not coalesce(p_payload->>'stage' ~ '^[0-5]$',false) then return jsonb_build_object('error','關卡錯誤'); end if;
   stage:=(p_payload->>'stage')::integer;
   if stage>r.completed then return jsonb_build_object('error','請先完成上一關'); end if;
   incoming:=p_payload->'data';
   if jsonb_typeof(incoming) is distinct from 'object' then return jsonb_build_object('error','作答格式錯誤'); end if;
   old:=r.data;
   for k in select jsonb_array_elements_text(required->stage->'notes') loop
    if jsonb_typeof(incoming#>array['notes',k])='string' then
     old:=jsonb_set(old,array['notes',k],to_jsonb(left(incoming#>>array['notes',k],3000)),true);
    end if;
   end loop;
   for k in select jsonb_array_elements_text(required->stage->'answers') loop
    if coalesce(incoming->'answers' ? k,false) then old:=jsonb_set(old,array['answers',k],incoming#>array['answers',k],true); end if;
   end loop;
   next_completed:=r.completed;
   if p_action='student-complete' then
    missing:=eco_private.requirements(stage,old);
    if cardinality(missing)>0 then return jsonb_build_object('error','尚有項目未完成','missing',to_jsonb(missing)); end if;
    if stage=r.completed then next_completed:=r.completed+1; end if;
   end if;
   update eco_private.learners set data=old,completed=next_completed,updated=ms where id=r.id;
   return jsonb_build_object('ok',true,'completed',next_completed,'updated',ms);
  end if;
 end if;
 if p_action like 'teacher-%' and s.role='teacher' then
  if p_action='teacher-logout' then delete from eco_private.sessions where hash=s.hash; return '{"ok":true}'::jsonb; end if;
  if p_action='teacher-overview' then
   select coalesce(jsonb_agg(to_jsonb(q) order by q.class_name,q.number),'[]'::jsonb) into result
    from (select class_name,number,completed,updated from eco_private.learners) q;
   return jsonb_build_object('students',result);
  end if;
  if p_action='teacher-student' then
   select * into r from eco_private.learners where id=p_payload->>'id';
   if not found then return jsonb_build_object('error','這位學生尚未登入'); end if;
   return jsonb_build_object('student',jsonb_build_object('className',r.class_name,'number',r.number),'completed',r.completed,'data',r.data,'updated',r.updated);
  end if;
 end if;
 return jsonb_build_object('error','沒有權限執行這項操作');
end $$;
revoke all on function eco_private.eco_classroom(text,jsonb,text) from public;
grant usage on schema eco_private to anon,authenticated;
grant execute on function eco_private.eco_classroom(text,jsonb,text) to anon,authenticated;
create or replace function public.eco_classroom(p_action text,p_payload jsonb default '{}'::jsonb,p_token text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select eco_private.eco_classroom(p_action,p_payload,p_token);
$$;
revoke all on function public.eco_classroom(text,jsonb,text) from public;
grant execute on function public.eco_classroom(text,jsonb,text) to anon,authenticated;
create policy deny_direct_access on eco_private.learners for all to anon,authenticated using(false) with check(false);
create policy deny_direct_access on eco_private.sessions for all to anon,authenticated using(false) with check(false);
create policy deny_direct_access on eco_private.teacher_settings for all to anon,authenticated using(false) with check(false);
create policy deny_direct_access on eco_private.teacher_attempts for all to anon,authenticated using(false) with check(false);
create index if not exists eco_sessions_learner on eco_private.sessions(learner_id);
notify pgrst,'reload schema';
