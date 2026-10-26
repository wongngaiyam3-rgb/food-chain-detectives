import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {species,edges,byId,checkChain} from './data.js';
import {getNearby} from './proximity.js';
const $=s=>document.querySelector(s);let saved={};try{saved=JSON.parse(localStorage.getItem('forest-v1')||'{}')}catch{}let discovered=new Set((saved.discovered||[]).filter(id=>byId[id])),chains=Array.isArray(saved.chains)?saved.chains.filter(c=>Array.isArray(c)&&c.length>=3&&c.every(id=>byId[id])&&checkChain(c).ok):[],selection=[],mode='chain',filter='全部',panelType='',low=!!saved.low;let nearbyId=null,lastProximity=0;let scene,camera,renderer,player,ready=false,angle=0,viewDrag=null,joy={x:0,y:0},keys={},models=[],trees=[],colliders=[],labels=[],clock=new THREE.Clock(),last=0;
function persist(){try{localStorage.setItem('forest-v1',JSON.stringify({discovered:[...discovered],chains,low}))}catch{toast('瀏覽器未允許儲存，仍可繼續探索。')}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3300)}
function update(){const n=discovered.size;$('#count').textContent=`${n}/${species.length}`;$('#progressText').textContent=`${n} / ${species.length}`;$('#progressBar').style.width=`${n/species.length*100}%`;$('#chainCount').textContent=chains.length;if(n>=3){$('#missionTitle').textContent='把發現，連成一條食物鏈';$('#missionHint').textContent='打開食物鏈頁面，試試誰吃誰';}if(n===species.length){$('#missionTitle').textContent=`${species.length} 位森林鄰居，全部相遇！`;$('#missionHint').textContent='繼續找出不同的食物鏈';}labels.forEach(l=>l.el.classList.toggle('observed',discovered.has(l.id)))}
function panel(html,type){panelType=type;$('#panelContent').innerHTML=html;$('#panel').classList.remove('hidden');joy={x:0,y:0};$('#stick').style.transform='';keys={};viewDrag=null;document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));$(type==='journal'?'#journalNav':type==='chain'?'#chainNav':'#exploreNav').classList.add('active')}
function close(){panelType='';$('#panel').classList.add('hidden');document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));$('#exploreNav').classList.add('active')}
function start(){ $('#welcome').classList.add('hidden');joy={x:0,y:0};keys={};}
function observe(id){const s=byId[id];start();if(!discovered.has(id)){discovered.add(id);persist();update();toast(`新的發現：${s.name} 已加入圖鑑`)}const eaters=edges.filter(e=>e[0]===id).map(e=>byId[e[1]].name);panel(`<div class="eyebrow">森林觀察筆記 · 已發現</div><div class="species-header"><div class="species-emoji">${s.emoji}</div><div><span class="tag">${s.role}</span><h2>${s.name}</h2><div class="tiny">${s.latin}</div></div></div><p class="sub">${s.note}</p><div class="fact-grid"><div class="fact"><small>${s.role==='生產者'?'養分來源':'食性／營養方式'}</small><b>${s.diet}</b></div><div class="fact"><small>吃甚麼／如何獲取養分</small><b>${s.food}</b></div><div class="fact"><small>場景中會被誰取食</small><b>${eaters.join('、')||'本場景未列出；不表示沒有天敵或取食者'}</b></div><div class="fact"><small>觀察提示</small><b>${s.hint}</b></div></div><div class="actions"><button class="primary" id="speciesChain">放入食物鏈 →</button><button class="secondary" id="backForest">繼續探索</button></div><p class="tiny">教學簡化食物網，並非完整食譜。<a href="${s.source}" target="_blank" rel="noopener">查看參考資料 ↗</a></p>`,'species');$('#backForest').onclick=close;$('#speciesChain').onclick=()=>{mode='chain';if(!selection.includes(id))selection.push(id);showChain()}}
function refreshNearby(active){
 const card=$('#nearbyCard');
 if(!active){card.classList.add('hidden');return}
 const result=getNearby(player.position,models.map(m=>({id:m.id,x:m.g.position.x,z:m.g.position.z})),nearbyId);
 let added=false;
 result.nearby.forEach(o=>{if(!discovered.has(o.id)){discovered.add(o.id);added=true}});
 if(added){persist();update()}
 if(!result.focused){nearbyId=null;card.classList.add('hidden');return}
 const id=result.focused.id;
 if(id!==nearbyId||card.classList.contains('hidden')){
  nearbyId=id;const s=byId[id];
  $('#nearbyEmoji').textContent=s.emoji;$('#nearbyName').textContent=s.name;
  $('#nearbyType').textContent=s.role==='生產者'?'養分來源':'食性／營養方式';
  $('#nearbyDiet').textContent=s.diet;$('#nearbyFood').textContent=s.food;
  $('#nearbyDetail').onclick=()=>observe(id);card.classList.remove('hidden');
 }
}
function showJournal(f=filter){start();filter=f;const list=species.filter(s=>f==='全部'||(f==='已發現'?discovered.has(s.id):f==='生產者'?s.role==='生產者':s.role==='消費者'));panel(`<div class="eyebrow">FIELD JOURNAL · 森林觀察筆記</div><h2>每個生命，都值得認識。</h2><p class="sub">已相遇 ${discovered.size} / ${species.length} 種生物。走近生物即可自動記錄；未發現的生物可以使用線索尋找。</p><div class="filter-tabs">${['全部','已發現','生產者','消費者'].map(f=>`<button data-filter="${f}" class="${filter===f?'selected':''}">${f}</button>`).join('')}</div><div class="grid">${list.map(s=>`<button class="bio-card ${discovered.has(s.id)?'':'locked'}" data-id="${s.id}"><span class="emoji">${s.emoji}</span><b>${s.name}</b><small>${discovered.has(s.id)?s.diet+' · 已發現':'尚未發現 · 查看線索'}</small></button>`).join('')}</div><div class="tiny">示意場景參考溫帶林地及林緣生物；不是香港或特定地區的物種調查。</div>`,'journal');document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>showJournal(b.dataset.filter));document.querySelectorAll('.bio-card').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(discovered.has(id))observe(id);else{const s=byId[id];panel(`<div class="eyebrow">下一位森林鄰居</div><h2>${s.emoji} 尋找${s.name}</h2><p class="sub">${s.hint}</p><div class="hint">走近觀察點後，食性會自動顯示並加入圖鑑。你也可以自行走動尋找。</div><div class="actions"><button class="primary" id="visit">前往附近 →</button><button class="secondary" id="journalBack">返回圖鑑</button></div>`,'journal');$('#visit').onclick=()=>{const tracked=models.find(m=>m.id===s.id);teleport(tracked?tracked.g.position.x:s.pos[0],(tracked?tracked.g.position.z:s.pos[1])+2.2);close();toast(`已到達${s.name}附近，自動顯示食性`)};$('#journalBack').onclick=()=>showJournal()}})}
function showChain(){start();panel(`<div class="eyebrow">CONNECT THE FOREST · 連結生命</div><h2>你的發現，藏著甚麼關係？</h2><div class="filter-tabs"><button id="chainMode" class="${mode==='chain'?'selected':''}">取食食物鏈</button><button id="webMode" class="${mode==='web'?'selected':''}">我的食物網</button></div><div id="chainBody"></div>`,'chain');$('#chainMode').onclick=()=>{mode='chain';showChain()};$('#webMode').onclick=()=>{mode='web';showChain()};renderChain()}
function renderChain(){if(mode==='web'){const unique=new Map();chains.forEach(c=>c.slice(0,-1).forEach((id,i)=>unique.set(id+'-'+c[i+1],[id,c[i+1]])));$('#chainBody').innerHTML=`<p class="sub">你已建立 ${chains.length} 條食物鏈，發現 ${unique.size} 個不同取食連結。重複出現的生物，把各條鏈連成食物網。</p>${unique.size?`<div class="grid">${[...unique.values()].map(e=>`<div class="fact"><b>${byId[e[0]].emoji} ${byId[e[0]].name}<br>↓<br>${byId[e[1]].emoji} ${byId[e[1]].name}</b></div>`).join('')}</div>`:'<div class="hint">先建立一條食物鏈，這裡就會出現你的連結紀錄。</div>'}<h3>已完成的食物鏈</h3>${chains.map(c=>`<div class="saved-chain">${c.map(id=>byId[id].emoji+' '+byId[id].name).join(' → ')}</div>`).join('')}<p class="tiny">這些是你目前發現的部分關係，並非森林裡的全部連結。</p>`;return}
const available=species.filter(s=>discovered.has(s.id));$('#chainBody').innerHTML=`<p class="sub">從生產者開始，依次點選至少三張卡片。箭嘴表示：<b>食物 → 吃它的生物</b>。</p><div class="chain-slots">${selection.length?selection.map((id,i)=>`${i?'<span class="arrow">→</span>':''}<div class="chain-node"><span>${byId[id].emoji}</span>${byId[id].name}</div>`).join(''):'<span class="empty-chain">☀ 陽光提供能量。先放入一種植物吧。</span>'}</div><div class="actions"><button id="check" class="primary">檢查並記錄 →</button><button id="undo" class="secondary">退回一步</button><button id="clearChain" class="secondary">清空</button></div><div id="feedback" role="status"></div><h3 style="font-size:14px;margin-top:25px">從你的圖鑑選擇</h3><div class="pick-list">${available.map(s=>`<button data-pick="${s.id}" ${selection.includes(s.id)?'disabled':''}>${s.emoji} ${s.name}</button>`).join('')}</div>${available.length<3?'<div class="hint">先到森林觀察更多生物。可以試著尋找「禾草、蚱蜢、青蛙、草蛇」。</div>':''}<p class="tiny">雜食動物可能出現在不同營養階層。食物網中的合理循環不適合這個簡化的單鏈活動，因此每條鏈中的生物不重複。</p><button class="secondary" id="moreSpecies">繼續找生物 ↗</button>`;
document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selection.push(b.dataset.pick);renderChain()});$('#undo').onclick=()=>{selection.pop();renderChain()};$('#clearChain').onclick=()=>{selection=[];renderChain()};$('#moreSpecies').onclick=close;$('#check').onclick=()=>{const result=checkChain(selection);$('#feedback').className='feedback'+(result.ok?'':' bad');$('#feedback').textContent=result.text;if(result.ok){if(!chains.some(c=>c.join(',')===selection.join(','))){chains.push([...selection]);persist();update();toast('新的食物鏈已記錄！')}else $('#feedback').textContent+=' 這條鏈已記錄，試試另一個分支。'}}}
function help(){start();panel(`<div class="eyebrow">準備好，一起出發</div><h2>森林探索指南</h2><div class="help-list"><p>① 拖動左下搖桿移動；電腦可用 W A S D 或方向鍵。</p><p>② 拖動畫面左右轉向；走近生物就會自動顯示食性，並加入圖鑑。點「詳細觀察」可閱讀完整介紹。</p><p>③ 打開「生物圖鑑」，查看紀錄或使用尋找線索。</p><p>④ 在「我的食物鏈」依序選卡，箭嘴由食物指向取食者。</p><p>⑤ 使用右下角的「⌂」回到起點。iPad 建議橫向遊玩。</p></div><div class="hint">教學示意生態系：包含橡樹、禾草及八種動物，食性與行為經過簡化。生物的參考資料可在觀察卡中開啟。</div><p class="tiny">進度僅儲存於此瀏覽器，不會跨裝置同步。清除網站資料可能移除紀錄。遊戲運作不使用付費 AI API。3D 程式庫：Three.js（MIT 授權）。<a href="https://github.com/wongngaiyam3-rgb/food-chain-detectives/tree/main/forest-foodweb-explorer" target="_blank" rel="noopener">查看這個版本的網站原始碼 ↗</a></p><div class="actions"><button class="primary" id="resume">回到森林 →</button><button class="secondary" id="reset">重設探索紀錄</button></div><div id="resetConfirm"></div>`,'help');$('#resume').onclick=close;$('#reset').onclick=()=>{$('#resetConfirm').innerHTML='<div class="feedback bad">這會清除本機圖鑑和食物鏈紀錄。<button class="secondary" id="confirmReset">確定清除</button></div>';$('#confirmReset').onclick=()=>{discovered.clear();chains=[];selection=[];persist();update();close();toast('已清除探索紀錄')}}}
$('#start').onclick=start;$('#closePanel').onclick=close;$('#panel').addEventListener('click',e=>{if(e.target===$('#panel'))close()});$('#journalNav').onclick=()=>showJournal();$('#chainNav').onclick=$('#openChain').onclick=()=>showChain();$('#exploreNav').onclick=()=>{start();close()};$('#help').onclick=help;$('#missionButton').onclick=()=>discovered.size>=3?showChain():showJournal();$('.brand').onclick=e=>{e.preventDefault();close();teleport(0,14)};$('#home').onclick=()=>{teleport(0,14);toast('已回到林間空地入口')};$('#quality').onclick=()=>{low=!low;if(renderer){renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=!low}$('#quality').textContent=low?'標準畫質':'低畫質';persist();toast(low?'已切換低畫質，降低裝置負擔':'已切換標準畫質')};if(low)$('#quality').textContent='標準畫質';
function teleport(x,z){if(player){player.position.set(Math.max(-14,Math.min(14,x)),0,Math.max(-12,Math.min(18,z)));angle=0}}
const mats={};function mat(c){return mats[c]??=(new THREE.MeshStandardMaterial({color:c,roughness:.95,flatShading:true}))}
function mesh(g,c,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(c,x,y,z,sx,sy=sx,sz=sx,parent=scene){return mesh(new THREE.SphereGeometry(1,8,6),c,x,y,z,parent).scale.set(sx,sy,sz)}
function sphere(c,x,y,z,sx,sy=sx,sz=sx,p=scene){const m=mesh(new THREE.SphereGeometry(1,9,7),c,x,y,z,p);m.scale.set(sx,sy,sz);return m}
function cylinder(c,x,y,z,r,h,p=scene,rt=r){return mesh(new THREE.CylinderGeometry(rt,r,h,7),c,x,y,z,p)}
let seed=56;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function tree(x,z,size=1,special=false){trees.push({x,z,size});const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(size);scene.add(g);cylinder('#6c6650',0,1.5,0,.23,3,g,.15);for(let i=0;i<4;i++){let b=cylinder('#736f52',Math.cos(i*2)*.3,2.3+i*.22,Math.sin(i*2)*.3,.075,1.4,g,.035);b.rotation.z=i%2?.6:-.6}const shades=['#5b8450','#749553','#829e58','#466f49'];for(let i=0;i<6;i++)sphere(shades[i%4],Math.cos(i*2.4)*.85,3.2+(i%3)*.5,Math.sin(i*2.4)*.8,1.35,1.15,1.25,g);colliders.push({x,z,r:.38*size});return g}

/* Soft-shaded, detailed low-poly creature models. All bodies face local -Z. */
function plush(c,x,y,z,rx,ry,rz,g,detail=14){
 const o=mesh(new THREE.SphereGeometry(1,detail,10),c,x,y,z,g);
 o.scale.set(rx,ry,rz);return o;
}
function tip(c,x,y,z,r,h,g,rotation=0){
 const o=mesh(new THREE.ConeGeometry(r,h,9),c,x,y,z,g);
 o.rotation.z=rotation;return o;
}
function segment(c,pts,r,g){
 return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),18,r,7,false),c,0,0,0,g);
}
function faceEye(g,x,y,z,r=.062){
 plush('#fffdf2',x,y,z,r*1.23,r*1.24,r*.7,g);
 plush('#273b36',x,y+.006,z-r*.52,r*.82,r*.89,r*.38,g);
 plush('#ffffff',x-r*.23,y+r*.34,z-r*.87,r*.29,r*.3,r*.14,g);
}
function ear(g,x,y,z,outer,inner,h=.48,rz=0){
 const e=plush(outer,x,y,z,.14,h,.11,g);
 e.rotation.z=rz;
 const e2=plush(inner,x,y,z-.075,.082,h*.68,.05,g);
 e2.rotation.z=rz;return e;
}
function paws(g,color,points,r=.12){
 points.forEach(([x,y,z])=>plush(color,x,y,z,r,.09,r*1.4,g));
}
function rabbit(g){
 plush('#d3bb99',0,.42,.12,.41,.37,.58,g);
 plush('#f3e7d5',0,.36,-.28,.31,.27,.32,g);
 plush('#d8c19f',0,.76,-.40,.31,.33,.3,g);
 plush('#fff2df',0,.66,-.64,.23,.16,.12,g);
 for(const x of [-.18,.18]){ear(g,x,1.22,-.39,'#d8bb98','#e8a6aa',.45,x*.43);faceEye(g,x*.98,.85,-.648,.054)}
 plush('#e8a3a4',0,.70,-.77,.075,.052,.05,g);
 paws(g,'#f1e1cf',[[-.27,.1,-.27],[.27,.1,-.27],[-.29,.14,.47],[.29,.14,.47]],.16);
 plush('#fdf5e4',0,.43,.68,.2,.2,.22,g);
 for(const x of [-.25,.25])plush('#e3caa9',x,.26,.32,.2,.19,.26,g);
}
function fox(g){
 plush('#c97841',0,.62,.12,.37,.39,.74,g);
 plush('#f2dfbd',0,.4,-.34,.29,.24,.37,g);
 for(const x of [-.25,.25]){
  plush('#704f36',x,.25,-.44,.1,.26,.12,g);
  plush('#704f36',x,.25,.56,.1,.28,.12,g);
 }
 plush('#d98b52',0,.95,-.64,.35,.34,.4,g);
 for(const x of [-.23,.23]){
  tip('#b96b3e',x,1.34,-.63,.19,.47,g,-x*.6);
  plush('#f0c5a0',x,1.18,-.78,.083,.21,.05,g);
  faceEye(g,x*.75,1.01,-.975,.058);
 }
 plush('#fff0d4',0,.79,-.91,.28,.18,.36,g);
 plush('#363b32',0,.87,-1.22,.085,.07,.09,g);
 const tail=new THREE.Group();tail.position.set(.16,.65,.79);g.add(tail);
 const t=plush('#bc703e',0,.08,.36,.24,.27,.61,tail);t.rotation.x=.18;
 plush('#f6e9cb',0,.17,.85,.20,.22,.26,tail);
 g.userData.tail=tail;
}
function mouse(g){
 plush('#998772',0,.29,.08,.27,.24,.4,g);
 plush('#d9c8ad',0,.22,-.21,.23,.13,.24,g);
 plush('#b6a08a',0,.45,-.3,.24,.23,.25,g);
 for(const x of [-.18,.18]){
  plush('#bda88f',x,.64,-.22,.15,.16,.075,g);
  plush('#d69ba0',x,.65,-.28,.10,.105,.036,g);
  faceEye(g,x*.83,.49,-.535,.052);
 }
 plush('#df9ba0',0,.39,-.55,.054,.05,.054,g);
 for(const side of [-1,1])for(let k=0;k<2;k++)
  segment('#e0d4bf',[[side*.07,.35,-.52],[side*.28,.36+k*.05,-.58],[side*.42,.33+k*.08,-.55]],.011,g);
 segment('#bd9691',[[0,.19,.38],[.24,.19,.67],[.56,.22,.89],[.76,.2,.93]],.035,g);
 paws(g,'#ad927c',[[-.18,.10,-.23],[.18,.10,-.23],[-.2,.1,.34],[.2,.1,.34]],.095);
}
function robin(g){
 plush('#7f735d',0,.48,0,.25,.35,.36,g);
 plush('#d47445',0,.49,-.24,.23,.29,.19,g);
 plush('#eee2c6',0,.31,-.28,.14,.13,.12,g);
 plush('#95836b',0,.83,-.14,.20,.21,.21,g);
 for(const x of [-.16,.16]){
  faceEye(g,x*.85,.85,-.335,.041);
  const wing=plush('#685f50',x*1.45,.54,.1,.13,.22,.26,g);wing.rotation.z=x*.5;
  segment('#7b664c',[[x,.25,.05],[x,.07,.01],[x*1.35,.065,-.11]],.023,g);
 }
 tip('#9e824d',0,.76,-.41,.075,.18,g,Math.PI/2);
 const tail=plush('#675e4e',0,.4,.37,.13,.1,.37,g);tail.rotation.x=.32;
}
function owl(g){
 const torso=plush('#8c795e',0,.61,.02,.42,.51,.4,g);
 plush('#e1c99e',0,.52,-.32,.31,.38,.14,g);
 plush('#a38a6b',0,1.14,-.21,.40,.43,.36,g);
 for(const x of [-.20,.20]){
  plush('#d9c8a4',x,1.20,-.53,.21,.22,.085,g);
  plush('#bf9c65',x,1.22,-.605,.14,.15,.035,g);
  faceEye(g,x,1.23,-.64,.091);
  const tuft=tip('#867051',x*1.5,1.54,-.16,.145,.32,g,-x*.7);
  tuft.rotation.x=-.1;
  for(let k=0;k<2;k++){
   segment('#795f44',[[x*.7,.25,.01],[x*.7,.1,-.06],[x*.9+(k?-.06:.06),.08,-.16]],.02,g);
  }
 }
 const beak=tip('#e5ab51',0,1.055,-.63,.075,.19,g,Math.PI/2);
 const wings=[];
 for(const side of [-1,1]){
  const wing=new THREE.Group();wing.position.set(side*.34,.97,.05);g.add(wing);
  const feather=plush('#78694e',side*.29,-.11,.07,.34,.13,.48,wing);feather.rotation.z=side*.23;
  for(let j=0;j<3;j++)plush('#a89472',side*(.24+j*.12),-.15,.22+j*.07,.17,.09,.23,wing);
  wings.push({wing,side});
 }
 g.userData.wings=wings;
 for(let j=0;j<3;j++)plush('#73644d',(j-1)*.13,.4,.40,.11,.1,.35,g);
}
function frog(g){
 plush('#4f9d67',0,.31,.08,.40,.26,.42,g);
 plush('#acd9a1',0,.25,-.28,.31,.13,.31,g);
 plush('#72b979',0,.43,-.3,.32,.25,.28,g);
 for(const x of [-.20,.20]){
  plush('#67ae70',x,.61,-.44,.16,.16,.14,g);
  faceEye(g,x,.63,-.56,.085);
  plush('#477f4d',x*.94,.40,-.11,.06,.025,.11,g);
  plush('#3c9c60',x*1.65,.22,.28,.21,.14,.27,g);
  plush('#7cc37a',x*1.2,.12,-.47,.14,.075,.18,g);
  for(let k=0;k<3;k++)plush('#78b979',x*1.2+(k-1)*.09,.09,-.57,.045,.045,.13,g);
 }
 segment('#38764b',[[-.10,.36,-.59],[0,.35,-.61],[.1,.36,-.59]],.013,g);
}
function snake(g){
 const points=[];
 for(let i=0;i<=30;i++){const u=i/30;points.push([(u-.5)*2.15,.17+u*.1,Math.sin(u*Math.PI*3.6)*.25]);}
 segment('#548c62',points,.15,g);
 const head=plush('#77b084',1.18,.29,.08,.27,.16,.20,g);
 plush('#c5dfab',1.28,.21,-.015,.16,.065,.15,g);
 for(const z of [-.07,.21])faceEye(g,1.25,.38,z,.037);
 for(let j=0;j<9;j++){
  const u=(j+.5)/10,p=points[Math.floor(u*30)];
  plush('#a5bd78',p[0],p[1]+.12,p[2],.062,.041,.062,g);
 }
 segment('#b86062',[[1.42,.25,.01],[1.57,.23,.0],[1.66,.22,-.06]],.018,g);
}
function squirrel(g){
 plush('#bc7543',0,.48,.05,.32,.41,.42,g);
 plush('#f2d9ae',0,.45,-.32,.24,.31,.15,g);
 plush('#c88a53',0,.93,-.30,.30,.29,.28,g);
 plush('#f9e5c4',0,.83,-.54,.23,.14,.12,g);
 for(const x of [-.24,.24]){
  ear(g,x,1.20,-.24,'#bc7344','#e8b29f',.20,-x*.9);
  faceEye(g,x*.82,1.00,-.54,.062);
  plush('#b87544',x*.92,.46,-.42,.11,.22,.11,g);
  plush('#d6a071',x*.87,.14,-.22,.13,.09,.22,g);
 }
 plush('#4b4438',0,.88,-.65,.052,.043,.07,g);
 const tail=new THREE.Group();tail.position.set(.10,.42,.34);g.add(tail);
 segment('#a96339',[[0,0,0],[.27,.12,.29],[.42,.50,.45],[.30,.85,.48],[.13,1,.41]],.21,tail);
 plush('#cf9259',.12,.98,.41,.2,.21,.19,tail);
 g.userData.tail=tail;
 const acorn=plush('#9b633e',0,.43,-.57,.11,.13,.10,g);
 plush('#6c7040',0,.55,-.56,.13,.055,.12,g);
}
function snail(g){
 plush('#9abd74',0,.13,0,.26,.12,.56,g);
 plush('#b8d68c',0,.20,-.36,.22,.20,.20,g);
 plush('#c7df9e',0,.25,-.49,.15,.17,.15,g);
 for(const x of [-.13,.13]){
  segment('#89b667',[[x,.28,-.47],[x,.45,-.50],[x*1.1,.54,-.53]],.025,g);
  plush('#f5f0d4',x*1.1,.55,-.53,.065,.068,.055,g);
  plush('#36453b',x*1.1,.56,-.58,.034,.039,.024,g);
 }
 plush('#9b714b',0,.42,.13,.38,.40,.42,g);
 plush('#cfaa78',0,.45,.13,.34,.35,.34,g);
 plush('#aa7b4d',0,.52,.14,.30,.31,.31,g);
 for(const side of [-1,1]){
  const pts=[];
  for(let j=0;j<=28;j++){
   const t=j/28,ang=t*Math.PI*3.6,rad=(.23-t*.20);
   pts.push([side*.305+side*.014,t*.02+.46+Math.cos(ang)*rad,.16+Math.sin(ang)*rad]);
  }
  segment('#6e543f',pts,.032,g);
 }
}
function caterpillar(g){
 for(let j=0;j<8;j++){
  const z=-.45+j*.16;
  plush(j%2?'#78ad61':'#93c76e',0,.22+Math.sin(j*.52)*.03,z,.19,.19,.15,g);
  for(const x of [-.11,.11]){
   plush('#5d9452',x,.09,z,.045,.11,.07,g);
   if(j>0&&j<7)plush('#dceaa4',x,.31,z,.043,.044,.045,g);
  }
 }
 plush('#afd480',0,.27,-.58,.22,.20,.21,g);
 for(const x of [-.11,.11])faceEye(g,x,.30,-.765,.048);
 for(const x of [-.12,.12])segment('#659e5a',[[x,.42,-.62],[x*1.1,.56,-.65]],.02,g);
}
function grasshopper(g){
 plush('#79ad5c',0,.29,.05,.17,.15,.49,g);
 plush('#a0cf79',0,.40,-.35,.20,.19,.20,g);
 plush('#b9dd8f',0,.33,-.56,.16,.12,.16,g);
 for(const x of [-.15,.15]){
  faceEye(g,x,.48,-.48,.055);
  const wing=plush('#badb8a',x*.9,.42,.18,.10,.075,.47,g);
  wing.rotation.z=x*.28;
  segment('#608c55',[[x,.20,.28],[x*2.5,.48,.46],[x*2.5,.06,.57]],.043,g);
  segment('#658952',[[x,.30,-.2],[x*1.6,.06,-.48]],.029,g);
  segment('#719a5c',[[x,.33,-.5],[x*1.0,.73,-.78]],.015,g);
 }
 for(let j=0;j<5;j++)plush('#609249',0,.26,-.04+j*.14,.155,.09,.022,g);
}

const ANIMAL_MOTION={
 rabbit:{speed:.78,range:2.05},fox:{speed:.65,range:2.65},
 mouse:{speed:.65,range:1.85},robin:{speed:.72,range:2.1},
 frog:{speed:.55,range:1.6},snake:{speed:.43,range:2},
 caterpillar:{speed:.16,range:.95},grasshopper:{speed:.86,range:1.55},
 squirrel:{speed:1.12,range:2.1},snail:{speed:.11,range:1.15},
 owl:{speed:.73,range:2.6}
};
/** Select an achievable nearby waypoint without walking through large tree trunks or water. */
function chooseAnimalGoal(m){
 const ai=m.ai;
 for(let n=0;n<16;n++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand())*ai.range;
  const x=m.base.x+Math.cos(a)*r,z=m.base.z+Math.sin(a)*r;
  if(x < -13.5||x>13.5||z < -11.5||z>17.5)continue;
  if(colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.32))continue;
  ai.goal={x,z};return;
 }
 ai.goal=null;ai.rest=1+rand()*2;
}
function moveForestAnimals(dt,t){
 for(const m of models){
  if(!m.ai)continue;
  const ai=m.ai,kind=m.id;
  let moving=false;
  if(ai.rest>0){
   ai.rest=Math.max(0,ai.rest-dt);
  }else{
   if(!ai.goal)chooseAnimalGoal(m);
   if(ai.goal){
    const dx=ai.goal.x-m.g.position.x,dz=ai.goal.z-m.g.position.z;
    const distance=Math.hypot(dx,dz);
    if(distance < .11){
     ai.goal=null;ai.rest=.25+rand()*(kind==='snail'?.5:1.5);
    }else{
     const vx=dx/distance,vz=dz/distance;
     const amount=Math.min(distance,ai.speed*dt);
     const newX=m.g.position.x+vx*amount,newZ=m.g.position.z+vz*amount;
     if(colliders.some(c=>Math.hypot(newX-c.x,newZ-c.z)<c.r+.18)){
      ai.goal=null;ai.rest=.2+rand()*.8;
     }else{
      m.g.position.x=newX;
      m.g.position.z=newZ;
      const desired=Math.atan2(-vx,-vz);
      const diff=Math.atan2(Math.sin(desired-ai.heading),Math.cos(desired-ai.heading));
      ai.heading+=diff*Math.min(1,dt*4.5);
      m.g.rotation.y=ai.heading;
      moving=true;
     }
    }
   }
  }
  const stride=t*(kind==='snail'?2:kind==='caterpillar'?4:8)+m.phase;
  const activity=moving?1:.15;
  if(kind==='rabbit')m.g.position.y=m.base.y+Math.max(0,Math.sin(stride*.75))*.15*activity;
  else if(kind==='frog')m.g.position.y=m.base.y+Math.pow(Math.max(0,Math.sin(stride*.58)),1.6)*.36*activity;
  else if(kind==='grasshopper')m.g.position.y=m.base.y+Math.pow(Math.max(0,Math.sin(stride*.77)),2)*.37*activity;
  else if(kind==='robin')m.g.position.y=m.base.y+Math.max(0,Math.sin(stride*.7))*.16*activity;
  else if(kind==='owl')m.g.position.y=m.base.y+Math.sin(t*2.7+m.phase)*.2;
  else if(kind==='squirrel')m.g.position.y=m.base.y+Math.abs(Math.sin(stride*.62))*.065*activity;
  else if(kind==='mouse'||kind==='fox')m.g.position.y=m.base.y+Math.abs(Math.sin(stride*.75))*.045*activity;
  else if(kind==='caterpillar')m.g.position.y=m.base.y+Math.sin(stride*.5)*.03*activity;
  else m.g.position.y=m.base.y+Math.sin(stride*.2)*.014;
  m.g.rotation.z=kind==='snake'?Math.sin(t*4+m.phase)*.05:
    kind==='snail'?Math.sin(t*.8+m.phase)*.024:0;
  if(m.g.userData.tail){
    m.g.userData.tail.rotation.y=Math.sin(t*3.1+m.phase)*(kind==='squirrel'?.22:.18);
    m.g.userData.tail.rotation.x=Math.sin(t*2+m.phase)*.07;
  }
  if(m.g.userData.wings){
   m.g.userData.wings.forEach(({wing,side})=>{
    wing.rotation.z=side*(.26+Math.sin(t*5.5+m.phase)*.65);
    wing.rotation.x=side*Math.sin(t*5.5+m.phase)*.15;
   });
  }
 }
}
function model(s){
 const g=new THREE.Group();
 g.position.set(s.pos[0],0,s.pos[1]);
 scene.add(g);
 switch(s.id){
  case 'oak':tree(...s.pos,1.3,true);break;
  case 'grass':{
   for(let i=0;i<30;i++){
    const x=(rand()-.5)*1.45,z=(rand()-.5)*1.45;
    const blade=mesh(new THREE.ConeGeometry(.062,.34+rand()*.5,5),i%3?'#83ad57':'#b3c878',x,.25,z,g);
    blade.rotation.z=(rand()-.5)*.3;
   }break;
  }
  case 'rabbit':rabbit(g);break;
  case 'fox':fox(g);break;
  case 'mouse':mouse(g);g.scale.setScalar(1.20);break;
  case 'robin':robin(g);g.scale.setScalar(1.2);g.position.y=.27;break;
  case 'frog':frog(g);g.scale.setScalar(1.13);break;
  case 'snake':snake(g);g.scale.setScalar(1.05);break;
  case 'caterpillar':caterpillar(g);g.scale.setScalar(1.30);break;
  case 'grasshopper':grasshopper(g);g.scale.setScalar(1.30);break;
  case 'squirrel':squirrel(g);g.scale.setScalar(1.12);break;
  case 'snail':snail(g);g.scale.setScalar(1.2);break;
  case 'owl':owl(g);g.scale.setScalar(1.05);g.position.y=2.5;break;
 }
 const moving=s.role==='消費者';
 const config=ANIMAL_MOTION[s.id];
 const creature={
  id:s.id,g,base:g.position.clone(),phase:rand()*Math.PI*2,
  ai:moving?{
   range:config.range,speed:config.speed,rest:.1+rand()*.28,goal:null,
   motion:0,heading:rand()*Math.PI*2
  }:null
 };
 models.push(creature);
 const el=document.createElement('button');
 el.className='species-label';
 el.innerHTML=`<span class="dot" style="background:#bc9559"></span>undefined <span style="opacity:.5">＋</span>`;
 el.setAttribute('aria-label',`觀察undefined`);
 el.onclick=()=>observe(s.id);
 $('#labels').append(el);
 const height=s.id==='oak'?4.8:s.id==='grass'?1.5:s.id==='owl'?1.5:
              s.id==='fox'?1.8:s.id==='squirrel'?1.7:s.id==='rabbit'?1.7:1.2;
 labels.push({el,id:s.id,g,height});
}
function softwareRenderer(){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');let w=innerWidth,h=innerHeight;const proj=(x,y,z)=>{const v=new THREE.Vector3(x,y,z).project(camera);return {x:(v.x*.5+.5)*w,y:(-v.y*.5+.5)*h,z:v.z}};
 const ellipse=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2);ctx.fill()};
 const poly=(pts,color)=>{if(pts.some(p=>p.z>1))return;ctx.fillStyle=color;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill()};
 return {domElement:canvas,shadowMap:{enabled:false},setPixelRatio(){},setSize(a,b){w=a;h=b;canvas.width=w;canvas.height=h},render(){
 const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#d8e3ca');grad.addColorStop(.45,'#b7c99c');grad.addColorStop(1,'#9cac73');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 for(let z=-32;z<30;z+=2){const x=Math.sin(z*.11)*2,nx=Math.sin((z+2)*.11)*2;poly([proj(x-2.7,0,z),proj(x+2.7,0,z),proj(nx+2.7,0,z+2),proj(nx-2.7,0,z+2)],'#c9c19a')}
 const items=[...trees.map(t=>({...t,kind:'tree'})),...models.filter(m=>m.id!=='oak').map(m=>({x:m.g.position.x,z:m.g.position.z,kind:m.id,model:m})),{x:player.position.x,z:player.position.z,kind:'player'}].sort((a,b)=>proj(b.x,0,b.z).z-proj(a.x,0,a.z).z);
 items.forEach(o=>{const p=proj(o.x,0,o.z),top=proj(o.x,1,o.z),scale=Math.abs(top.y-p.y);if(p.z>1||p.z<0||p.x< -220||p.x>w+220||scale<1)return;ctx.globalAlpha=Math.min(1,Math.max(.2,scale/22));ellipse(p.x,p.y,scale*.65,scale*.16,'#546f4830');if(o.kind==='tree'){const sz=o.size,tip=proj(o.x,4.3*sz,o.z);ctx.strokeStyle='#776c50';ctx.lineWidth=Math.max(2,scale*.2*sz);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,tip.y+scale*.8);ctx.stroke();const col=['#577a4a','#6e8b4e','#839b58'];for(let j=0;j<4;j++){ellipse(tip.x+Math.sin(j*2.2)*scale*.62*sz,tip.y+scale*(j%2)*.5,scale*(1.0+(j%2)*.22)*sz,scale*.85*sz,col[j%3]);}}
 else if(o.kind==='player'){ctx.strokeStyle='#4e6550';ctx.lineWidth=scale*.15;for(const x of [-.11,.11]){ctx.beginPath();ctx.moveTo(p.x+x*scale,p.y);ctx.lineTo(p.x+x*scale,p.y-scale*.65);ctx.stroke()}ellipse(p.x,p.y-scale*.93,scale*.24,scale*.38,'#5c8062');ellipse(p.x,p.y-scale*1.39,scale*.22,scale*.24,'#d9b88d');ellipse(p.x,p.y-scale*1.6,scale*.36,scale*.09,'#cbb77d');ellipse(p.x,p.y-scale*1.64,scale*.22,scale*.15,'#cbb77d');}
 else if(o.kind==='grass'){for(let j=0;j<9;j++){ctx.strokeStyle=j%2?'#63854a':'#7d9854';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+(j-4)*scale*.13,p.y);ctx.lineTo(p.x+(j-4)*scale*.19,p.y-scale*(.4+(j%3)*.12));ctx.stroke()}}
 else{ctx.globalAlpha=1;const s=byId[o.kind];ctx.font=`${Math.max(15,Math.min(90,scale*(o.kind==='fox'?1.5:1.1)))}px serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(s.emoji,p.x,p.y+3)}ctx.globalAlpha=1});
 }};
}
function init(){scene=new THREE.Scene();scene.background=new THREE.Color('#d3dec1');scene.fog=new THREE.FogExp2('#cbd8b6',.018);camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,110);try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'})}catch{renderer=softwareRenderer();$('.location small').textContent='相容模式 · 教學示意生態系';}renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=!low;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;$('#world').append(renderer.domElement);scene.add(new THREE.HemisphereLight('#fff8d9','#687b4e',2.4));const sun=new THREE.DirectionalLight('#fff1cb',3.2);sun.position.set(-12,24,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25});sun.shadow.bias=-.002;scene.add(sun);const ground=mesh(new THREE.PlaneGeometry(160,160),'#a7b77a',0,-.03,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
// A meandering clearing, layers of foliage, scattered stones and patches of meadow.
for(let i=0;i<20;i++){const z=i*2-22,x=Math.sin(z*.11)*2;const path=mesh(new THREE.CircleGeometry(2.9+Math.sin(i)*.3,12),'#c2bd90',x,.006,z);path.rotation.x=-Math.PI/2;path.castShadow=false;}for(let i=0;i<100;i++){let x=(rand()-.5)*75,z=(rand()-.5)*70;if(Math.abs(x)<12&&z>-13&&z<21)continue;tree(x,z,.75+rand()*.85)}for(let i=0;i<95;i++){const x=(rand()-.5)*52,z=(rand()-.5)*47;if(Math.abs(x-Math.sin(z*.11)*2)<3)continue;const col=['#8fa563','#9cae6c','#78965a'][i%3];const patch=mesh(new THREE.CircleGeometry(.3+rand()*1.2,7),col,x,.012,z);patch.rotation.x=-Math.PI/2;patch.castShadow=false;if(i%5===0)sphere('#939780',x,.12,z,.3,.2,.4)}for(let i=0;i<85;i++){const x=(rand()-.5)*42,z=(rand()-.5)*38;if(Math.abs(x)<3)continue;for(let j=0;j<3;j++)mesh(new THREE.ConeGeometry(.04,.25+rand()*.3,3),'#759452',x+j*.12,.2,z,scene)}for(let i=0;i<24;i++){const x=(rand()-.5)*22,z=(rand()-.5)*22;for(let j=0;j<3;j++)sphere(i%2?'#ece4af':'#c6c99a',x+j*.12,.25,z+j*.1,.06,.06,.06)}
// A modest pond outside the walking area.
const pond=mesh(new THREE.CircleGeometry(4,24),'#7ca6a0',16,.02,5);pond.rotation.x=-Math.PI/2;pond.scale.set(1,1.5,1);colliders.push({x:16,z:5,r:4.2});for(let i=0;i<12;i++)sphere('#9a9e83',16+Math.cos(i*.52)*4.1,.12,5+Math.sin(i*.52)*5.9,.5,.25,.4);
player=new THREE.Group();scene.add(player);cylinder('#5f8061',0,.85,0,.21,.65,player);sphere('#dbb98d',0,1.35,0,.22,.24,.22,player);cylinder('#cbb77d',0,1.59,0,.34,.08,player);sphere('#cbb77d',0,1.62,0,.22,.14,.22,player);sphere('#b38a57',0,.9,.22,.18,.25,.12,player);for(let x of [-.13,.13])cylinder('#566650',x,.36,0,.075,.6,player);for(let x of [-.29,.29])cylinder('#c3af86',x,.86,0,.065,.5,player);player.position.set(0,0,14);species.forEach(model);update();camera.position.set(0,7,25);ready=true;bindWorld();animate();}
function bindWorld(){const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{if(panelType||!$('#welcome').classList.contains('hidden'))return;viewDrag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(viewDrag?.id===e.pointerId){angle-=(e.clientX-viewDrag.x)*.006;viewDrag.x=e.clientX;viewDrag.y=e.clientY}});const stop=e=>{if(viewDrag?.id===e.pointerId)viewDrag=null};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop)}
const joystick=$('#joystick');joystick.addEventListener('pointerdown',e=>{if(panelType)return;joystick.setPointerCapture(e.pointerId);moveJoy(e)});joystick.addEventListener('pointermove',e=>{if(joystick.hasPointerCapture(e.pointerId))moveJoy(e)});function moveJoy(e){const r=joystick.getBoundingClientRect();let x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),len=Math.hypot(x,y),max=r.width*.3;if(len>max){x=x/len*max;y=y/len*max}joy={x:x/max,y:y/max};$('#stick').style.transform=`translate(${x}px,${y}px)`}for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,()=>{joy={x:0,y:0};$('#stick').style.transform=''});document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key==='Escape'){close();start()}});document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{keys={};joy={x:0,y:0};viewDrag=null;$('#stick').style.transform=''});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};joy={x:0,y:0};viewDrag=null}});
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const p=new THREE.Vector3(),target=new THREE.Vector3(),desired=new THREE.Vector3();function animate(){requestAnimationFrame(animate);if(document.hidden){clock.getDelta();return}const rawDt=clock.getDelta();const dt=Math.min(rawDt,.04),animalDt=Math.min(rawDt,.25);last+=animalDt;const active=!panelType&&$('#welcome').classList.contains('hidden');if(active){let dx=joy.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dz=joy.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);const len=Math.hypot(dx,dz);if(len>.08){if(len>1){dx/=len;dz/=len}const vx=dx*Math.cos(angle)+dz*Math.sin(angle),vz=-dx*Math.sin(angle)+dz*Math.cos(angle);let nx=Math.max(-14,Math.min(14,player.position.x+vx*dt*3.7)),nz=Math.max(-12,Math.min(18,player.position.z+vz*dt*3.7));if(!colliders.some(c=>Math.hypot(nx-c.x,nz-c.z)<c.r+.25)){player.position.x=nx;player.position.z=nz}player.rotation.y=Math.atan2(vx,vz)+Math.PI;player.position.y=Math.abs(Math.sin(last*9))*.045}else player.position.y=0;}
target.copy(player.position);target.y=1;desired.set(player.position.x+Math.sin(angle)*10,7,player.position.z+Math.cos(angle)*10);camera.position.lerp(desired,1-Math.exp(-dt*5));camera.lookAt(target);moveForestAnimals(animalDt,last);camera.updateMatrixWorld();if(!active||last-lastProximity>.12){refreshNearby(active);lastProximity=last}labels.forEach(l=>{p.copy(l.g.position);p.y+=l.height;p.project(camera);const x=(p.x*.5+.5)*innerWidth,y=(-p.y*.5+.5)*innerHeight;const rect=$('.mission').getBoundingClientRect();const underMission=x>rect.left-45&&x<rect.right+45&&y>rect.top-10&&y<rect.bottom+25;const visible=!underMission&&p.z<1&&p.z>-1&&x>10&&x<innerWidth-10&&y>115&&y<innerHeight-75;l.el.style.display=visible?'flex':'none';if(visible){l.el.style.left=x+'px';l.el.style.top=y+'px';l.el.style.zIndex=Math.round((1-p.z)*100)}});renderer.render(scene,camera)}
update();try{init()}catch(e){console.error(e);$('#welcome').classList.add('hidden');$('#error').classList.remove('hidden')}
