-- Expedition schema snapshot. Applied separately from the original six-mission course.
create table eco_private.expeditions (
 learner_id text primary key references eco_private.learners(id),
 completed integer not null default 0 check(completed between 0 and 16),
 records jsonb not null default '{}', feedback jsonb not null default '{}', updated bigint not null
);
alter table eco_private.expeditions enable row level security;
revoke all on eco_private.expeditions from public,anon,authenticated;
create policy deny_direct_access on eco_private.expeditions for all to anon,authenticated using(false) with check(false);
create or replace function eco_private.eco_expedition(p_action text,p_payload jsonb default '{}',p_token text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s eco_private.sessions%rowtype; r eco_private.expeditions%rowtype; st integer; entry jsonb; d jsonb; ok boolean; msg text; ms bigint:=floor(extract(epoch from clock_timestamp())*1000); result jsonb; who text; mode integer;
begin
 if jsonb_typeof(p_payload) is distinct from 'object' or length(p_payload::text)>25000 then return jsonb_build_object('error','提交內容格式錯誤或太長'); end if;
 if p_token is null or length(p_token)<>64 then return jsonb_build_object('error','請先登入'); end if;
 select * into s from eco_private.sessions where hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires>now();
 if not found then return jsonb_build_object('error','登入已過期，請重新登入'); end if;
 if s.role='teacher' then
  if p_action='overview' then
   select coalesce(jsonb_agg(to_jsonb(x) order by x.class_name,x.number),'[]') into result from
    (select l.id,l.class_name,l.number,e.completed,e.updated,e.records,e.feedback from eco_private.expeditions e join eco_private.learners l on l.id=e.learner_id) x;
   return jsonb_build_object('students',result);
  end if;
  if p_action='feedback' then
   who:=p_payload->>'id';
   if not coalesce(p_payload->>'stage' ~ '^(1[0-5]|[0-9])$',false) or jsonb_typeof(p_payload->'stage') is distinct from 'number' then return jsonb_build_object('error','關卡錯誤'); end if;
   st:=(p_payload->>'stage')::integer;
   if jsonb_typeof(p_payload->'text') is distinct from 'string' or length(p_payload->>'text')>1000 then return jsonb_build_object('error','留言須為1000字內文字'); end if;
   select * into r from eco_private.expeditions where learner_id=who for update;
   if not found or st>r.completed then return jsonb_build_object('error','這位學生尚未進入此任務'); end if;
   update eco_private.expeditions set feedback=jsonb_set(feedback,array[st::text],to_jsonb(p_payload->>'text'),true) where learner_id=who;
   return '{"ok":true}'::jsonb;
  end if;
  return jsonb_build_object('error','沒有權限執行這項操作');
 end if;
 if s.role<>'student' then return jsonb_build_object('error','請先登入'); end if;
 insert into eco_private.expeditions(learner_id,updated) values(s.learner_id,ms) on conflict do nothing;
 select * into r from eco_private.expeditions where learner_id=s.learner_id for update;
 if p_action='progress' then return to_jsonb(r); end if;
 if p_action not in ('save','submit','hint') then return jsonb_build_object('error','找不到這個操作'); end if;
 if jsonb_typeof(p_payload->'stage') is distinct from 'number' or not coalesce(p_payload->>'stage' ~ '^(1[0-5]|[0-9])$',false) then return jsonb_build_object('error','關卡錯誤'); end if;
 st:=(p_payload->>'stage')::integer;
 if st>r.completed then return jsonb_build_object('error','完成上一個任務，才可解鎖。'); end if;
 entry:=coalesce(r.records->st::text,'{"attempts":0,"hints":0}');
 if p_action='hint' then
  if st=15 then return jsonb_build_object('error','研究館是獨立應用，請參考自己的研究手帳。'); end if;
  entry:=jsonb_set(entry,'{hints}',to_jsonb(coalesce((entry->>'hints')::integer,0)+1));
 else
  d:=p_payload->'data';
  if jsonb_typeof(d) is distinct from 'object' then return jsonb_build_object('error','作答格式錯誤'); end if;
  entry:=jsonb_set(entry,'{data}',d,true);
  if p_action='submit' then
   entry:=jsonb_set(entry,'{attempts}',to_jsonb(coalesce((entry->>'attempts')::integer,0)+1));
   if not(entry ? 'first_data') then entry:=jsonb_set(entry,'{first_data}',d,true); end if;
   mode:=st%5;
   if st=15 then
    ok:=jsonb_typeof(d->'biome')='number' and d->>'biome' in ('0','1','2') and d->'order'='[0,1,2,3]'::jsonb and d->'dirs'='[1,1,1]'::jsonb
     and d->>'confidence' in ('我能獨立解釋','我能在提示下解釋','我還想再練習');
    msg:='請完成正確食物鏈及自我檢視。';
   elsif mode=0 then
    ok:=d->'observed' @> '[0,1,2,3]'::jsonb; msg:='請先點選並觀察四種生物。';
   elsif mode=1 then
    ok:=d->'prey'='[0,1,2]'::jsonb; msg:='食物配對尚未全部正確，請參考食性資料卡再試。';
   elsif mode=2 then
    ok:=d->'order'='[0,1,2,3]'::jsonb and d->'dirs'='[1,1,1]'::jsonb;
    msg:='請核對四種生物的次序及三個箭頭。';
   elsif mode=3 then
    ok:=d->'fixDirs'='[1,1,1]'::jsonb and d->>'reason'='energy'; msg:='請修正三個箭頭，並選出能量傳遞的理由。';
   else
    ok:=jsonb_typeof(d->'prediction')='array' and jsonb_array_length(case when jsonb_typeof(d->'prediction')='array' then d->'prediction' else '[]'::jsonb end)=2
     and d#>>'{prediction,0}' in ('up','down','same','unknown') and d#>>'{prediction,1}' in ('up','down','same','unknown')
     and d->'revealed'='true'::jsonb;
    msg:='請為兩種生物作預測，並查看模型。';
   end if;
   entry:=jsonb_set(entry,'{last_correct}',to_jsonb(coalesce(ok,false)),true);
   if not(entry ? 'first_correct') then entry:=jsonb_set(entry,'{first_correct}',to_jsonb(coalesce(ok,false)),true); end if;
   if coalesce(ok,false) then
    entry:=jsonb_set(entry,'{passed}', 'true',true);
    if st=r.completed then r.completed:=r.completed+1; end if;
   end if;
  end if;
 end if;
 r.records:=jsonb_set(r.records,array[st::text],entry,true);
 update eco_private.expeditions set records=r.records,completed=r.completed,updated=ms where learner_id=s.learner_id returning * into r;
 if p_action='submit' and not coalesce(ok,false) then return jsonb_build_object('error',msg,'progress',to_jsonb(r)); end if;
 return to_jsonb(r);
end $$;
revoke all on function eco_private.eco_expedition(text,jsonb,text) from public;
grant execute on function eco_private.eco_expedition(text,jsonb,text) to anon,authenticated;
create or replace function public.eco_expedition(p_action text,p_payload jsonb default '{}',p_token text default null)
returns jsonb language sql security invoker set search_path='' as $$ select eco_private.eco_expedition(p_action,p_payload,p_token); $$;
revoke all on function public.eco_expedition(text,jsonb,text) from public;
grant execute on function public.eco_expedition(text,jsonb,text) to anon,authenticated;
notify pgrst,'reload schema';
