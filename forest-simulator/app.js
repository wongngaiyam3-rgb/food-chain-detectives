
const BASE = {grass:72,bug:45,frog:32,snake:18};
const KINDS = ["grass","bug","frog","snake"];
const NAMES = {grass:"青草",bug:"蚱蜢",frog:"青蛙",snake:"蛇"};
const COLORS = {grass:"#6ebc6c",bug:"#edb24e",frog:"#4ca9a4",snake:"#a887de"};
const $ = (id) => document.getElementById(id);
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const clone = (obj) => ({...obj});
let state=clone(BASE),reference=clone(BASE),pressure={grass:0,bug:0,frog:0,snake:0};
let month=0,history=[],nextSample=.4,playing=true,speed=1,scenario="",prediction="",lastDataUpdate=0;
let scene,camera,renderer,THREE,terrain,grassMesh,grassDummies=[],animalGroups={grass:[],bug:[],frog:[],snake:[]},movingObjects=[],raycaster,pointer,worldContainer;
let orbit={azimuth:.74,elevation:.66,distance:25},drag=null,lastTime=0;
let rngSeed=17125;
function random(){rngSeed=(rngSeed*1664525+1013904223)>>>0;return rngSeed/4294967296}
function rand(a,b){return a+(b-a)*random()}
function format(n){return Math.round(n).toString()}
function record(){history.push({t:month,value:clone(state),ref:clone(reference)});if(history.length>1000)history.shift()}
function evolve(pop,forces,dt){
  const g=pop.grass,b=pop.bug,f=pop.frog,s=pop.snake;
  const goal={
    grass:clamp(72-.74*(b-45)+forces.grass,5,125),
    bug:clamp(45+.65*(g-72)-.88*(f-32)+forces.bug,3,130),
    frog:clamp(32+.47*(b-45)-.47*(s-18)+forces.frog,2,95),
    snake:clamp(18+.55*(f-32)+forces.snake,2,75)
  };
  pop.grass=clamp(g+(goal.grass-g)*.19*dt,2,130);
  pop.bug=clamp(b+(goal.bug-b)*.18*dt,1,130);
  pop.frog=clamp(f+(goal.frog-f)*.14*dt,1,100);
  pop.snake=clamp(s+(goal.snake-s)*.13*dt,1,90);
}
function advance(amount){
  if(amount<=0)return;
  let remaining=Math.min(amount,120);
  while(remaining>0.00001){
    const dt=Math.min(.08,remaining);
    evolve(state,pressure,dt);
    evolve(reference,{grass:0,bug:0,frog:0,snake:0},dt);
    month+=dt;remaining-=dt;
    if(month+1e-5>=nextSample){record();nextSample=month+.4}
  }
  updateData();drawChart();
}
function resetSimulation(preservePrediction=false){
  state=clone(BASE);reference=clone(BASE);pressure={grass:0,bug:0,frog:0,snake:0};month=0;
  history=[];nextSample=.4;scenario="";playing=true;speed=1;
  document.querySelectorAll(".speed-btn").forEach(btn=>{const isOne=btn.dataset.speed==="1";btn.classList.toggle("selected",isOne);btn.setAttribute("aria-pressed",String(isOne))});
  if(!preservePrediction){prediction="";document.querySelectorAll(".predict-btn").forEach(b=>{b.classList.remove("selected");b.setAttribute("aria-pressed","false")});$("predictionStatus").textContent="請先選一個預測，再開始實驗！";$("predictionStatus").className="prediction-status"}
  $("experimentStatus").textContent="森林目前處於自然平衡狀態。";
  $("togglePlay").textContent="⏸ 暫停";
  record();updateData();drawChart();
}
function startScenario(kind){
  resetSimulation(true);
  scenario=kind;
  if(kind==="frog"){state.frog*=.5;pressure.frog=-14;$("experimentStatus").textContent="🐸 青蛙減少了 50%！觀察蚱蜢、青草和蛇接下來的變化。"}
  else if(kind==="bug"){state.bug*=1.65;pressure.bug=13;$("experimentStatus").textContent="🦗 蚱蜢增加了！青草有可能受到甚麼影響？"}
  else if(kind==="grass"){state.grass*=.55;pressure.grass=-18;$("experimentStatus").textContent="🌱 青草減少了！食物不足會影響哪些生物？"}
  else if(kind==="snake"){state.snake*=.4;pressure.snake=-8;$("experimentStatus").textContent="🐍 蛇減少了！青蛙有可能變多嗎？"}
  history=[];record();updateData();drawChart();
  $("insightText").textContent="實驗已開始！把時間向前推進幾個月，觀察圖表中不同顏色的線。";
}
function updateData(){
  $("monthDisplay").textContent=month.toFixed(1);
  for(const kind of KINDS){
    const cap=kind[0].toUpperCase()+kind.slice(1);
    $( "value"+cap).textContent=format(state[kind]);
    const diff=state[kind]-reference[kind];
    const delta=$("delta"+cap);
    delta.className="tile-delta"+(diff>1?" up":diff< -1?" down":"");
    delta.textContent=Math.abs(diff)<1?"與對照相近":(diff>0?"▲ +":"▼ −")+Math.round(Math.abs(diff));
  }
  updateAnimalVisibility();
  if(scenario==="frog" && month>=4.5){
    const status=$("predictionStatus");
    if(prediction){
      status.className="prediction-status "+(prediction==="up"?"good":"bad");
      status.textContent=prediction==="up"?"✅ 預測正確！青蛙變少，蚱蜢被捕食的機會減少。":"🔍 再看圖表！青蛙變少後，蚱蜢通常先增加，因為天敵變少。";
    }else{
      status.className="prediction-status";
      status.textContent="💡 青蛙變少後，蚱蜢通常先增加。現在可以再作出預測。";
    }
  }else if(prediction){$("predictionStatus").className="prediction-status";$("predictionStatus").textContent="已記下你的預測！請讓森林時間前進，看看結果。"}
  if(scenario && month>2){
    const sorted=KINDS.map(k=>({name:NAMES[k],delta:state[k]-reference[k]})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    const focus=sorted.filter(x=>Math.abs(x.delta)>2 && x.name!==(NAMES[scenario]||""))[0]||sorted[0];
    if(scenario==="frog" && month>5){
      $("insightText").textContent="青蛙減少 → 蚱蜢較少被吃 → 蚱蜢增多、青草減少；而蛇因食物減少，數量也可能下降。留意各種生物變化的時間並不相同。";
    }else{
      $("insightText").textContent="觀察發現："+focus.name+"相對對照組"+(focus.delta>0?"增加":"減少")+"。食物鏈中的生物互相影響，但反應可能需要一段時間。";
    }
  }else if(!scenario){$("insightText").textContent="先作出預測，然後按「青蛙減少一半」。試着找出最先發生變化的生物。"}
}
function setupEvents(){
  document.querySelectorAll(".predict-btn").forEach(btn=>{
    btn.setAttribute("aria-pressed","false");
    btn.addEventListener("click",()=>{
      prediction=btn.dataset.answer;
      document.querySelectorAll(".predict-btn").forEach(b=>{const sel=b===btn;b.classList.toggle("selected",sel);b.setAttribute("aria-pressed",String(sel))});
      updateData();
    });
  });
  $("frogEvent").addEventListener("click",()=>startScenario("frog"));
  $("bugEvent").addEventListener("click",()=>startScenario("bug"));
  $("grassEvent").addEventListener("click",()=>startScenario("grass"));
  $("snakeEvent").addEventListener("click",()=>startScenario("snake"));
  $("togglePlay").addEventListener("click",()=>{playing=!playing;$("togglePlay").textContent=playing?"⏸ 暫停":"▶ 繼續"});
  $("stepTime").addEventListener("click",()=>{playing=false;$("togglePlay").textContent="▶ 繼續";advance(1)});
  $("resetSim").addEventListener("click",()=>resetSimulation(false));
  document.querySelectorAll(".speed-btn").forEach(btn=>btn.addEventListener("click",()=>{
    speed=Number(btn.dataset.speed);
    document.querySelectorAll(".speed-btn").forEach(b=>{const chosen=b===btn;b.classList.toggle("selected",chosen);b.setAttribute("aria-pressed",String(chosen))});
  }));
  $("showReference").addEventListener("change",drawChart);
  $("cameraReset").addEventListener("click",()=>{orbit={azimuth:.74,elevation:.66,distance:25};applyCamera()});
  window.addEventListener("resize",drawChart);
}
function drawChart(){
  const canvas=$("populationChart"),rect=canvas.getBoundingClientRect();
  if(rect.width<20||rect.height<20)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=rect.width,h=rect.height;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const left=36,right=14,top=13,bottom=28,pw=w-left-right,ph=h-top-bottom;
  const maxT=Math.max(12,Math.ceil(month/6)*6),minT=Math.max(0,maxT-36);
  const ymax=130;
  const x=t=>left+(t-minT)/(maxT-minT)*pw;
  const y=v=>top+ph-(v/ymax)*ph;
  ctx.strokeStyle="#edf2e9";ctx.lineWidth=1;ctx.font="11px system-ui";ctx.textAlign="right";ctx.fillStyle="#a3b2a2";
  for(const tick of [0,30,60,90,120]){
    const yy=y(tick);ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();ctx.fillText(String(tick),left-9,yy+4);
  }
  ctx.textAlign="center";ctx.fillStyle="#91a591";
  const ticks=6;
  for(let i=0;i<=ticks;i++){const t=minT+(maxT-minT)*i/ticks;ctx.fillText(Math.round(t)+"月",x(t),h-7)}
  function line(kind,source,dashed){
    const points=history.filter(e=>e.t>=minT-.01);
    if(!points.length)return;
    ctx.save();ctx.strokeStyle=COLORS[kind];ctx.globalAlpha=dashed?.38:1;ctx.lineWidth=dashed?1.75:2.7;ctx.lineJoin="round";ctx.lineCap="round";ctx.setLineDash(dashed?[5,5]:[]);
    ctx.beginPath();points.forEach((point,i)=>{const xx=x(point.t),yy=y(point[source][kind]);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();
    if(!dashed){const last=points[points.length-1];ctx.fillStyle=COLORS[kind];ctx.setLineDash([]);ctx.beginPath();ctx.arc(x(last.t),y(last[source][kind]),3.6,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
  if($("showReference").checked)KINDS.forEach(kind=>line(kind,"ref",true));
  KINDS.forEach(kind=>line(kind,"value",false));
  if(!scenario){ctx.textAlign="center";ctx.font="12px system-ui";ctx.fillStyle="#a2b3a1";ctx.fillText("啟動實驗後，這裏會顯示森林的變化趨勢",left+pw/2,top+ph/2)}
}
function basicMaterial(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0,...opts})}
function mesh(geom,mat,x=0,y=0,z=0,parent=scene){
  const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;
}
function sphere(parent,color,x,y,z,sx,sy,sz,detail=10){
  const m=mesh(new THREE.SphereGeometry(1,detail,8),basicMaterial(color),x,y,z,parent);
  m.scale.set(sx,sy,sz);return m;
}
function randomPosition(minR=1,maxR=8){
  const a=rand(0,Math.PI*2),r=Math.sqrt(rand(minR*minR,maxR*maxR));
  return {x:Math.cos(a)*r,z:Math.sin(a)*r};
}
function makeTree(x,z,size,variation){
  const group=new THREE.Group();group.position.set(x,.7,z);
  mesh(new THREE.CylinderGeometry(.19*size,.25*size,1.55*size,7),basicMaterial("#a77a59"),0,.71*size,0,group);
  const palette=["#75b77d","#559d74","#a5c66e","#83bb90","#50956f"];
  if(variation===0){
    for(let j=0;j<3;j++){
      const radius=(1.03-j*.19)*size;
      mesh(new THREE.ConeGeometry(radius,1.9*size,7),basicMaterial(palette[Math.floor(rand(0,palette.length))]),0,(1.55+j*.62)*size,0,group)
    }
  }else{
    sphere(group,palette[Math.floor(rand(0,palette.length))],0,1.85*size,0,1.05*size,.9*size,1.0*size,9);
    sphere(group,"#83c38c",-.36*size,2.12*size,.09*size,.65*size,.75*size,.65*size,9);
    sphere(group,"#98c981",.48*size,1.9*size,.1*size,.68*size,.70*size,.75*size,9)
  }
  scene.add(group);
}
function makeFlower(x,z,col){
  const g=new THREE.Group();g.position.set(x,.76,z);
  mesh(new THREE.CylinderGeometry(.022,.027,.28,5),basicMaterial("#48864f"),0,.14,0,g);
  for(let a=0;a<5;a++){const theta=a*Math.PI*2/5;sphere(g,col,Math.cos(theta)*.105,.32,Math.sin(theta)*.105,.11,.06,.11,6)}
  sphere(g,"#f3ca58",0,.33,0,.07,.075,.07,7);
  scene.add(g)
}
function createIsland(){
  const dirt=basicMaterial("#c49a71"),dirt2=basicMaterial("#e6c79a"),top=basicMaterial("#9bd28a");
  mesh(new THREE.CylinderGeometry(9.15,8.55,1.16,64),dirt,0,-.09,0);
  mesh(new THREE.CylinderGeometry(9.22,9.15,.22,64),dirt2,0,.52,0);
  mesh(new THREE.CylinderGeometry(9.32,9.27,.17,64),top,0,.68,0);
  mesh(new THREE.CylinderGeometry(2.5,2.55,.035,48),basicMaterial("#78cdd2",{transparent:true,opacity:.8}),-3.65,.774,2.2).scale.z=.65;
  mesh(new THREE.TorusGeometry(2.52,.095,5,42),basicMaterial("#c4d9a1"),-3.65,.79,2.2).rotation.x=Math.PI/2;
  for(let i=0;i<13;i++){
    const a=i*Math.PI*2/13;
    const pos={x:Math.cos(a)*rand(6.7,8.6),z:Math.sin(a)*rand(6.7,8.6)};
    makeTree(pos.x,pos.z,rand(.69,1.15),i%3?0:1)
  }
  for(let i=0;i<26;i++){
    const p=randomPosition(3,8.4),s=rand(.17,.40);
    sphere(scene,i%2?"#5daa75":"#8bbb6a",p.x,.8,p.z,s*1.45,s,s*1.2,8)
  }
  for(let i=0;i<17;i++){
    const p=randomPosition(2.4,8.15);
    makeFlower(p.x,p.z,i%3?"#ffced8":"#fff3aa");
  }
  for(let i=0;i<16;i++){
    const p=randomPosition(2.5,8.5);
    const rock=sphere(scene,i%2?"#a6b8a7":"#becdc1",p.x,.80,p.z,rand(.15,.28),rand(.14,.22),rand(.18,.28),7);
    rock.rotation.y=rand(0,6)
  }
  const dummy=new THREE.Object3D();
  grassMesh=new THREE.InstancedMesh(new THREE.ConeGeometry(.11,.54,4),basicMaterial("#4fad67",{side:THREE.DoubleSide}),180);
  grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<180;i++){
    const p=randomPosition(.35,8.3);
    dummy.position.set(p.x,.93,p.z);dummy.rotation.y=rand(0,Math.PI*2);
    dummy.scale.set(rand(.7,1.25),rand(.65,1.25),rand(.7,1.2));dummy.updateMatrix();
    grassDummies.push(dummy.matrix.clone())
  }
  grassMesh.frustumCulled=false;scene.add(grassMesh)
}
function makeBug(){
  const g=new THREE.Group();
  sphere(g,"#83b95b",0,.23,0,.29,.14,.17);
  sphere(g,"#a5cf71",.19,.29,0,.13,.13,.13);
  sphere(g,"#313b34",.24,.35,-.09,.024,.028,.023,7);
  sphere(g,"#313b34",.24,.35,.09,.024,.028,.023,7);
  for(let s of [-1,1]){
    const leg=mesh(new THREE.CylinderGeometry(.025,.02,.38,5),basicMaterial("#548b4a"),-.13,.1,s*.22,g);
    leg.rotation.x=s*.85;
  }
  return g;
}
function makeFrog(){
  const g=new THREE.Group();
  sphere(g,"#67c48b",0,.2,0,.34,.21,.3);
  sphere(g,"#a5dd94",.21,.27,0,.17,.16,.19);
  for(let z of [-.16,.16]){
    sphere(g,"#eef7d3",.25,.41,z,.105,.105,.105,9);
    sphere(g,"#202f30",.3,.43,z,.042,.052,.04,9);
  }
  for(let z of [-.28,.28])sphere(g,"#61ad79",-.22,.10,z,.2,.08,.14);
  return g;
}
function makeSnake(){
  const g=new THREE.Group();
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.75,.15,-.16),new THREE.Vector3(-.35,.13,.17),new THREE.Vector3(.05,.13,-.13),new THREE.Vector3(.42,.14,.18),new THREE.Vector3(.63,.21,.09)
  ]);
  mesh(new THREE.TubeGeometry(curve,24,.105,7,false),basicMaterial("#b48acc"),0,0,0,g);
  sphere(g,"#a883be",.66,.20,.09,.20,.13,.155,9);
  sphere(g,"#272c3d",.75,.25,-.002,.022,.027,.02,7);
  sphere(g,"#272c3d",.75,.25,.18,.022,.027,.02,7);
  return g;
}
function createAnimals(){
  const defs=[
    ["bug",20,makeBug,.52],
    ["frog",14,makeFrog,.67],
    ["snake",12,makeSnake,.72]
  ];
  for(const [kind,count,factory,scale] of defs){
    for(let i=0;i<count;i++){
      const group=factory();
      const p=randomPosition(kind==="frog"?.9:1.2,kind==="snake"?6.9:7.0);
      if(kind==="frog"){p.x=-3.4+rand(-1.4,3);p.z=2.0+rand(-1.5,1.9);if(Math.hypot(p.x,p.z)>8){p.x/=1.4;p.z/=1.4}}
      group.position.set(p.x,.82,p.z);group.rotation.y=rand(0,6.28);
      group.scale.setScalar(scale*rand(.85,1.2));
      group.userData.kind=kind;group.userData.baseY=group.position.y;
      group.userData.phase=rand(0,6.28);group.userData.seed=rand(0,6.28);
      scene.add(group);animalGroups[kind].push(group);movingObjects.push(group)
    }
  }
  updateAnimalVisibility()
}
function updateAnimalVisibility(){
  if(!THREE||!grassMesh)return;
  const matrix=new THREE.Matrix4(),zero=new THREE.Matrix4().makeScale(0,0,0);
  const visibleGrass=Math.round(clamp(state.grass/120,0,1)*180);
  for(let i=0;i<180;i++){grassMesh.setMatrixAt(i,i<visibleGrass?grassDummies[i]:zero)}
  grassMesh.instanceMatrix.needsUpdate=true;
  for(const kind of ["bug","frog","snake"]){
    const list=animalGroups[kind];
    const denom={bug:92,frog:65,snake:52}[kind];
    const count=clamp(Math.round(state[kind]/denom*list.length),1,list.length);
    list.forEach((item,i)=>item.visible=i<count)
  }
}
function applyCamera(){
  if(!camera)return;
  const r=orbit.distance,phi=orbit.elevation,theta=orbit.azimuth;
  camera.position.set(r*Math.cos(phi)*Math.sin(theta),r*Math.sin(phi),r*Math.cos(phi)*Math.cos(theta));
  camera.lookAt(0,.6,0)
}
function selectAnimal(e){
  if(!raycaster||!renderer)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(movingObjects.filter(x=>x.visible),true);
  if(!hits.length)return;
  let obj=hits[0].object;while(obj&&!obj.userData.kind)obj=obj.parent;
  if(obj){
    const kind=obj.userData.kind;
    const lines={bug:"🦗 蚱蜢吃青草，也會被青蛙捕食。",frog:"🐸 青蛙會捕食蚱蜢，也是蛇的食物。",snake:"🐍 蛇會捕食青蛙，青蛙減少時牠們可能缺乏食物。"};
    $("experimentStatus").textContent=lines[kind]
  }
}
function bindCameraControls(){
  const elem=renderer.domElement;
  elem.addEventListener("pointerdown",e=>{
    drag={x:e.clientX,y:e.clientY,moved:false};elem.setPointerCapture(e.pointerId);
    worldContainer.classList.add("dragging")
  });
  elem.addEventListener("pointermove",e=>{
    if(!drag)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
    orbit.azimuth-=dx*.007;orbit.elevation=clamp(orbit.elevation+dy*.0055,.23,1.38);
    drag.x=e.clientX;drag.y=e.clientY;applyCamera()
  });
  elem.addEventListener("pointerup",e=>{
    if(drag&&!drag.moved)selectAnimal(e);
    drag=null;worldContainer.classList.remove("dragging");
    if(elem.hasPointerCapture(e.pointerId))elem.releasePointerCapture(e.pointerId)
  });
  elem.addEventListener("pointercancel",()=>{drag=null;worldContainer.classList.remove("dragging")});
  elem.addEventListener("wheel",e=>{e.preventDefault();orbit.distance=clamp(orbit.distance+e.deltaY*.016,14,35);applyCamera()},{passive:false})
}
function setup3D(){
  worldContainer=$("world");
  scene=new THREE.Scene();scene.fog=new THREE.Fog("#e9f5e8",30,63);
  camera=new THREE.PerspectiveCamera(36,1,.1,110);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  worldContainer.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight("#ffffff","#86ac79",2.2));
  const sun=new THREE.DirectionalLight("#fff5d6",3.2);sun.position.set(-8,18,14);scene.add(sun);
  const fill=new THREE.DirectionalLight("#c7f4e0",1.5);fill.position.set(10,8,-9);scene.add(fill);
  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
  createIsland();createAnimals();applyCamera();bindCameraControls();
  function resize(){
    const w=worldContainer.clientWidth,h=worldContainer.clientHeight;
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)
  }
  new ResizeObserver(resize).observe(worldContainer);resize();
  $("loading").remove()
}
function animate(now){
  requestAnimationFrame(animate);
  const dt=lastTime?Math.min((now-lastTime)/1000,.06):0;
  lastTime=now;
  if(playing&&dt&&month<120)advanceSilently(dt*1.6*speed);
  if(month>=120&&playing){playing=false;$("togglePlay").textContent="▶ 繼續";$("experimentStatus").textContent="⏳ 已到達 120 個月模擬上限。可按「重設」重新進行實驗。"}
  if(now-lastDataUpdate>160){lastDataUpdate=now;updateData();drawChart()}
  const t=now*.001;
  for(const obj of movingObjects){
    if(!obj.visible)continue;
    obj.position.y=obj.userData.baseY+Math.sin(t*(obj.userData.kind==="frog"?2:1.8)+obj.userData.phase)*.035;
    obj.rotation.y+=Math.sin(t*.7+obj.userData.seed)*.0003
  }
  renderer.render(scene,camera)
}
function advanceSilently(amount){
  let remaining=Math.min(amount,120-month);
  while(remaining>.00001){
    const dt=Math.min(.09,remaining);
    evolve(state,pressure,dt);evolve(reference,{grass:0,bug:0,frog:0,snake:0},dt);
    month+=dt;remaining-=dt;
    if(month+1e-5>=nextSample){record();nextSample=month+.4}
  }
}
setupEvents();resetSimulation();
try{
  THREE=await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
  setup3D();
  requestAnimationFrame(animate);
}catch(error){
  console.error("Forest 3D failed:",error);
  $("loading").innerHTML='<div class="loading-leaf">🌧️</div><strong>3D 森林暫時無法載入</strong><small>請確認瀏覽器支援 WebGL，並容許載入 Three.js。<br>實驗操作及圖表仍可使用。</small>';
}
