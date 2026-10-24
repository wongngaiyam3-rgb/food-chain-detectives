'use strict';
window.CloudStore={
 config(){
  const c=window.ECO_DATABASE||{};
  if(!c.url||!c.publishableKey)throw Error('新資料庫尚未接通，請老師完成資料庫設定。');
  const u=new URL(c.url);
  if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('資料庫網址設定不正確。');
  const key=c.publishableKey;
  if(key.startsWith('sb_secret_'))throw Error('網站不可使用資料庫管理密鑰。');
  if(!key.startsWith('sb_publishable_'))throw Error('請使用 Supabase publishable key。');
  return {url:u.origin,key};
 },
 async request(path,body,token){
  const c=this.config(),[route,search]=path.split('?');
  const actions={'/api/student/login':'student-login','/api/student/complete':'student-complete','/api/teacher/login':'teacher-login','/api/teacher/overview':'teacher-overview','/api/teacher/student':'teacher-student','/api/teacher/logout':'teacher-logout','/api/health':'health'};
  const action=route==='/api/student/progress'?(body===undefined?'student-progress':'student-save'):actions[route];
  if(!action)throw Error('找不到這個操作。');
  const payload=route==='/api/teacher/student'?{id:new URLSearchParams(search).get('id')}:body||{};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(c.url+'/rest/v1/rpc/eco_classroom',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_payload:payload,p_token:token||null}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
   let r;try{r=await response.json();}catch{throw Error('資料庫回應未完成，請稍後重試。');}
   if(!response.ok)throw Error('資料庫連線未完成，請老師檢查資料庫設定。');
   if(!r||typeof r!=='object'||Array.isArray(r))throw Error('資料庫回應格式錯誤。');
   if(r.error)throw Error(Array.isArray(r.missing)?r.missing.join('、'):r.error);
   return r;
  }catch(e){
   if(e.name==='AbortError')throw Error('資料庫連線逾時，請重試；已填文字仍保留在這部裝置。');
   if(e instanceof TypeError)throw Error('暫時無法連接資料庫，請檢查網絡後重試。');
   throw e;
  }finally{clearTimeout(timer);}
 }
};
