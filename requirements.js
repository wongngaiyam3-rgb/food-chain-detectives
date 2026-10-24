const limits=[{answers:['observed','match-grasshopper','match-frog','match-snake'],notes:['observe']},{answers:['arrow-0','arrow-1','arrow-2'],notes:['arrow']},{answers:['build-0','build-1'],notes:['build']},{answers:['fix-0','fix-1','fix-2'],notes:['fix']},{answers:['predict-grass','predict-grasshopper','predict-snake','simRevealed'],notes:['sim']},{answers:['report-chain','confidence'],notes:['report-arrow','report-change']}];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const chain=(a,s)=>!!a&&eq(a.slots,s)&&eq(a.dirs,s.slice(1).map(()=>1));
function requirements(stage,data){const a=data.answers||{},n=data.notes||{},missing=[];const add=(v,s)=>{if(!v)missing.push(s)};
 if(stage===0){add(['grass','grasshopper','frog','snake'].every(x=>(a.observed||[]).includes(x)),'觀察四種生物');add(a['match-grasshopper']==='grass'&&a['match-frog']==='grasshopper'&&a['match-snake']==='frog','正確完成三項食物配對');}
 if(stage===1)add(a['arrow-0']==='right'&&a['arrow-1']==='left'&&a['arrow-2']==='right','完成三組箭頭方向');
 if(stage===2){add(chain(a['build-0'],['grass','grasshopper','frog']),'完成三環節食物鏈');add(chain(a['build-1'],['grass','grasshopper','frog','snake']),'完成四環節食物鏈');}
 if(stage===3)add(eq(a['fix-0'],[1,1])&&a['fix-1']==='grass'&&a['fix-2']==='swap','完成三項錯誤修正');
 if(stage===4){add(['grass','grasshopper','snake'].every(x=>['up','down','same'].includes(a['predict-'+x])),'完成三項數量預測');add(a.simRevealed===true,'觀察模型結果');}
 if(stage===5){add(chain(a['report-chain'],['grass','rabbit','fox']),'完成新情境食物鏈');add(['我能獨立解釋','我能在提示下解釋','我還想再練習'].includes(a.confidence),'完成自我檢視');}
 for(const k of limits[stage].notes)add(typeof n[k]==='string'&&n[k].trim().length>=2,'填寫'+({observe:'觀察發現',arrow:'箭頭解釋',build:'排列理由',fix:'修正理由',sim:'生態變化原因','report-arrow':'報告箭頭解釋','report-change':'報告變化原因'}[k]));return missing;}
