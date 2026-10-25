import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
const db=new PGlite({extensions:{pgcrypto}});await db.exec('create role anon;create role authenticated;');await db.exec(await readFile(new URL('../database/001_classroom.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../database/expedition-schema.sql',import.meta.url),'utf8'));await db.query("insert into eco_private.teacher_settings values(1,extensions.crypt($1,extensions.gen_salt('bf')))",['test-only-password']);
const auth=async(a,p={})=>(await db.query('select public.eco_classroom($1,$2::jsonb) as r',[a,JSON.stringify(p)])).rows[0].r;
const rpc=async(a,p={},t=null)=>(await db.query('select public.eco_expedition($1,$2::jsonb,$3) as r',[a,JSON.stringify(p),t])).rows[0].r;
const fixtures=[{observed:[0,1,2,3]},{prey:[0,1,2]},{order:[0,1,2,3],dirs:[1,1,1]},{fixDirs:[1,1,1],reason:'energy'},{prediction:['up','unknown'],revealed:true}];
test('15 sequential missions, museum, retries, hints, first answers and role isolation',async()=>{const t=(await auth('student-login',{className:'4C',number:25})).token,teacher=(await auth('teacher-login',{password:'test-only-password'})).token;
 assert.ok((await rpc('overview',{},t)).error);assert.ok((await rpc('progress')).error);assert.ok((await rpc('progress',{},teacher)).error);
 await rpc('progress',{},t);assert.ok((await rpc('submit',{stage:5,data:fixtures[0]},t)).error);
 for(let st=0;st<15;st++){if(st===1){await rpc('hint',{stage:st},t);const wrong=await rpc('submit',{stage:st,data:{prey:[3,3,3]}},t);assert.equal(wrong.progress.records['1'].first_correct,false);assert.equal(wrong.progress.completed,1);}
 const result=await rpc('submit',{stage:st,data:fixtures[st%5]},t);assert.equal(result.completed,st+1,JSON.stringify(result));}
 const work={biome:2,order:[0,1,2,3],dirs:[1,1,1],confidence:'我能獨立解釋'};
 assert.ok((await rpc('submit',{stage:15,data:{}},t)).error);let r=await rpc('submit',{stage:15,data:work},t);assert.equal(r.completed,16);assert.equal(r.records['1'].attempts,2);assert.equal(r.records['1'].hints,1);assert.deepEqual(r.records['1'].first_data.prey,[3,3,3]);
 const t2=(await auth('student-login',{className:'4C',number:25})).token;assert.equal((await rpc('progress',{},t2)).completed,16);
 const other=(await auth('student-login',{className:'4A',number:1})).token;assert.equal((await rpc('progress',{},other)).completed,0);
 await rpc('feedback',{id:'4C-25',stage:15,text:'你的解釋很清楚。'},teacher);assert.equal((await rpc('progress',{},t)).feedback['15'],'你的解釋很清楚。');assert.ok((await rpc('feedback',{id:'4C-25',stage:15,text:'偽造'},other)).error);
 const overview=await rpc('overview',{},teacher);assert.equal(overview.students.find(s=>s.id==='4C-25').completed,16);assert.equal((await rpc('submit',{stage:15,data:work},t)).completed,16);
 await db.exec('set role anon');assert.ok((await rpc('overview',{},t)).error);await assert.rejects(db.query('select * from eco_private.expeditions'),/permission denied/);await db.exec('reset role');
});
