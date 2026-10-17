let initializeApp, getAuth, signInAnonymously, getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction, serverTimestamp, firebaseConfig;
const $ = id => document.getElementById(id);
let db = null, auth = null, roomId = null, playerId = null, room = null, unsubscribe = null, activeGame = "whot", gameOpen = false, gameLaunchId = null, roomSnapshotInitialized = false;
const shapeNames = ["Circle","Triangle","Cross","Square","Star"];
const shapeGlyphs = ["○","△","×","□","☆"];
const whotNumbers = [1,2,3,4,5,7,8,10,11,12,13,14];
const whotSuitNumbers = [[1,2,3,4,5,7,8,10,11,12,13,14],[1,2,3,4,5,7,8,10,11,12,13,14],[1,2,3,5,7,10,11,13,14],[1,2,3,5,7,10,11,13,14],[1,2,3,4,5,7,8]];
const quiz = [
 ["What is your partner's favourite way to receive love?",["Words","Quality time","Gifts","Acts of service"]],
 ["What would make the perfect date?",["Cosy movie night","Food adventure","A day outdoors","A surprise plan"]],
 ["Who says 'I miss you' first?",["Bami","Oluwatosin","Both equally","Depends on the day"]],
 ["What matters most during an argument?",["Listening","An apology","A little space","A hug and reassurance"]],
 ["What would you like to do together next?",["Travel","Cook together","Try a new game","Make a memory album"]],
 ["Which small thing makes a day better?",["A thoughtful message","A call","A hug","A funny video"]],
 ["What is the best way to make up after a disagreement?",["Talk calmly","Give space first","Apologise sincerely","Do something thoughtful"]],
 ["Which date sounds most fun?",["Beach day","Game night","Dinner date","Road trip"]]
];
const truths = ["What was your first impression of your partner?","What little thing they do makes you smile?","What date do you want to go on together?","What is something you appreciate but don't say enough?","What helps you feel loved on a hard day?","What is a memory of us you never want to forget?","What is one thing you want us to try together?","What is something cute you were shy to tell me?"];
const dares = ["Send a 10-second voice note saying something sweet.","Give your partner a cute new nickname.","Describe your partner using only three emojis.","Give your partner a sincere compliment.","Make up a two-line love song.","Send your best dramatic 'I miss you' message.","Name three things you find attractive about your partner.","Recreate your partner's favourite emoji with your face."];
const LUDO_PATH = (() => {
 const p=[];
 for(let c=1;c<=5;c++)p.push([6,c]);
 for(let r=5;r>=0;r--)p.push([r,6]);
 p.push([0,7],[0,8]);
 for(let r=1;r<=5;r++)p.push([r,8]);
 for(let c=9;c<=14;c++)p.push([6,c]);
 p.push([7,14],[8,14]);
 for(let c=13;c>=9;c--)p.push([8,c]);
 for(let r=9;r<=14;r++)p.push([r,8]);
 p.push([14,7],[14,6]);
 for(let r=13;r>=9;r--)p.push([r,6]);
 for(let c=5;c>=0;c--)p.push([8,c]);
 p.push([7,0],[6,0]);
 return p;
})();
const LUDO_SAFE = new Set([0,8,13,21,26,34,39,47]);
const LUDO_START = [0,13,39,26]; // Red, green, yellow, blue aligned with their home lanes
const LUDO_COLOURS = [{name:"RED",css:"red",owner:0},{name:"GREEN",css:"green",owner:0},{name:"YELLOW",css:"yellow",owner:1},{name:"BLUE",css:"blue",owner:1}];
function say(t){const e=$("globalMessage");e.textContent=t;e.classList.remove("hidden");}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function playerName(){return $("playerName").value.trim().slice(0,24)||"Player";}
const SESSION_KEY="bamiCouplesSessionV1";
function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null");}catch{return null;}}
function saveSession(extra={}){try{const old=readSession()||{};localStorage.setItem(SESSION_KEY,JSON.stringify({...old,...extra}));}catch{}}
function roomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
function configOK(){return firebaseConfig.apiKey&&!firebaseConfig.apiKey.includes("PASTE_")&&firebaseConfig.projectId&&!firebaseConfig.projectId.includes("PASTE_")&&firebaseConfig.appId&&!firebaseConfig.appId.includes("PASTE_");}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeWhotDeck(){const a=[];whotSuitNumbers.forEach((numbers,s)=>numbers.forEach(n=>a.push({s,n})));for(let n=0;n<5;n++)a.push({s:5,n:20});return shuffle(a);}

function newAyo(){return {pits:Array(12).fill(4),captured:[0,0],turn:0,winner:"",message:"Choose one of your six pits to sow. Capture seeds by ending a move with 2 or 3 in an opponent pit."};}
function ayoSide(i,p){return p===0?i>=6:i<6;}
function ayoMoveSim(pits,pit){const next=pits.slice();let seeds=next[pit],pos=pit;if(!seeds)return null;next[pit]=0;while(seeds>0){pos=(pos+1)%12;if(pos===pit)continue;next[pos]++;seeds--;}return {pits:next,last:pos};}
function ayoLegalMoves(g,player){const side=player===0?[6,7,8,9,10,11]:[0,1,2,3,4,5],moves=side.filter(i=>g.pits[i]>0),fed=moves.filter(i=>{const r=ayoMoveSim(g.pits,i);return r&&r.pits.some((n,j)=>!ayoSide(j,player)&&n>0);});return fed.length?fed:moves;}
function ayoFinish(g){const empty0=g.pits.slice(6).every(n=>n===0),empty1=g.pits.slice(0,6).every(n=>n===0);if(!empty0&&!empty1)return;g.captured[0]+=g.pits.slice(6).reduce((a,b)=>a+b,0);g.captured[1]+=g.pits.slice(0,6).reduce((a,b)=>a+b,0);g.pits=Array(12).fill(0);if(g.captured[0]===g.captured[1])g.winner="DRAW";else g.winner=room.players[g.captured[0]>g.captured[1]?0:1].name;g.message=g.winner==="DRAW"?"Ayo ends in a draw!":"Game over — "+g.winner+" wins with "+Math.max(...g.captured)+" seeds!";}
function playAyo(g,pit,player){if(g.winner||g.turn!==player||!ayoLegalMoves(g,player).includes(pit))return;const moved=ayoMoveSim(g.pits,pit);if(!moved)return;g.pits=moved.pits;let pos=moved.last,captured=0;while(!ayoSide(pos,player)&&(g.pits[pos]===2||g.pits[pos]===3)){captured+=g.pits[pos];g.pits[pos]=0;pos=(pos+11)%12;}g.captured[player]+=captured;g.message=captured?room.players[player].name+" captured "+captured+" seeds!":room.players[player].name+" sowed the seeds.";ayoFinish(g);if(!g.winner){g.turn=1-player;if(!ayoLegalMoves(g,g.turn).length)ayoFinish(g);else if(!g.winner)g.message+=" "+room.players[g.turn].name+"'s turn.";}}
function ayoSeedMarkup(n,pit){let out="";for(let i=0;i<Math.min(n,12);i++){const a=(i*37+pit*19)%100;out+='<i style="--sr:'+((a%50)-25)+'deg"></i>';}return out;}
function renderAyo(g){if(!g||!Array.isArray(g.pits)||g.pits.length!==12)g=newAyo();const p=me(),legal=ayoLegalMoves(g,p),names=[myName(0),myName(1)];let h='<div class="ayo-game"><div class="ayo-topline"><div><small>TRADITIONAL STRATEGY</small><h2>🇳🇬 AYO</h2></div><div class="ayo-turn '+(g.turn===p?'mine':'')+'">'+(g.winner?'GAME OVER':g.turn===p?'YOUR TURN':esc(names[g.turn]+"'S TURN"))+'</div></div>';h+='<div class="ayo-score-row"><div class="ayo-score"><small>'+names[1]+' · TOP</small><b>'+g.captured[1]+'</b><span>captured seeds</span></div><div class="ayo-total">48 seeds</div><div class="ayo-score"><small>'+names[0]+' · BOTTOM</small><b>'+g.captured[0]+'</b><span>captured seeds</span></div></div>';h+='<div class="ayo-wood"><div class="ayo-player-label">'+names[1]+' <span>← sow this row</span></div><div class="ayo-pits ayo-opponent">';for(let i=0;i<6;i++){const n=g.pits[i];h+='<button class="ayo-pit" data-ayo-pit="'+i+'" '+(p===1&&g.turn===p&&legal.includes(i)&&!g.winner&&room.players.length===2?'':'disabled')+' aria-label="Opponent pit '+(i+1)+', '+n+' seeds"><span class="ayo-pit-number">'+(i+1)+'</span><span class="ayo-seeds">'+ayoSeedMarkup(n,i)+'</span><b>'+n+'</b></button>';}h+='</div><div class="ayo-middle"><span>●</span><b>OWARE BOARD</b><span>●</span></div><div class="ayo-pits ayo-player">';for(let i=11;i>=6;i--){const n=g.pits[i];h+='<button class="ayo-pit '+(legal.includes(i)&&p===0&&g.turn===p?'legal':'')+'" data-ayo-pit="'+i+'" '+(p===0&&g.turn===p&&legal.includes(i)&&!g.winner&&room.players.length===2?'':'disabled')+' aria-label="Your pit '+(i-5)+', '+n+' seeds"><span class="ayo-pit-number">'+(i-5)+'</span><span class="ayo-seeds">'+ayoSeedMarkup(n,i)+'</span><b>'+n+'</b></button>';}h+='</div><div class="ayo-player-label">'+names[0]+' <span>sow right → left</span></div></div><div class="ayo-message">'+esc(g.message||'')+'</div><div class="ayo-footer"><span>Tap a pit on your row. Capture 2 or 3 seeds on your final sow.</span><button id="resetAyo" class="secondary">↻ New game</button></div></div>';return h;}


function poolRack(){const balls=[{id:0,x:.24,y:.5,vx:0,vy:0,r:.018,colour:"#fff",kind:"cue",pocketed:false}],cols=["#f4cf36","#2878e8","#df3156","#5d3b9c","#f28c28","#2eaa70","#7a4a2a"];let id=1;for(let row=0;row<5;row++)for(let col=0;col<=row;col++){const stripe=id%2===0;balls.push({id,x:.72+row*.033,y:.5+(col-row/2)*.038,vx:0,vy:0,r:.018,colour:cols[(id-1)%cols.length],kind:id===8?"eight":stripe?"stripe":"solid",pocketed:false});id++;}return balls;}
function newPool(){return {balls:poolRack(),turn:0,winner:"",message:"Break shot: drag backwards from the cue ball and release to shoot.",shots:0,groups:["OPEN","OPEN"],phase:"ready",ballInHand:false};}
function ensurePool(g){if(!g||!Array.isArray(g.balls)||!g.balls.length)Object.assign(g,newPool());if(!Array.isArray(g.groups))g.groups=["OPEN","OPEN"];if(!g.phase)g.phase="ready";}
function renderPool(g){ensurePool(g);const p=me(),canShoot=g.turn===p&&!g.winner&&room.players.length===2&&g.phase==="ready";let h='<div class="pool-game"><div class="pool-top"><div><small>8-BALL · TWO-PLAYER</small><h2>🎱 8-BALL POOL</h2></div><div class="pool-turn '+(canShoot?'mine':'')+'">'+(g.winner?'GAME OVER':canShoot?'YOUR SHOT':esc(myName(g.turn).toUpperCase())+"'S SHOT")+'</div></div>';h+='<div class="pool-score"><span>'+myName(0)+' <b>'+esc(g.groups[0]||"OPEN")+'</b></span><strong>'+g.shots+' SHOTS</strong><span>'+myName(1)+' <b>'+esc(g.groups[1]||"OPEN")+'</b></span></div>';h+='<div class="pool-table-wrap"><canvas id="poolCanvas" width="1000" height="560" aria-label="Interactive eight ball pool table"></canvas><div class="pool-canvas-hint">Drag away from the cue ball to aim and shoot. Tap the table to place cue ball after a foul.</div></div>';h+='<div class="pool-message">'+esc(g.message||"")+'</div><div class="pool-footer"><span>Solids vs stripes · pocket the 8 ball last.</span><button id="resetPool" class="secondary">↻ Rack again</button></div></div>';return h;}
function shootPool(g,dx,dy){ensurePool(g);if(g.winner||g.turn!==me()||g.phase!=="ready")return;const cue=g.balls.find(b=>b.id===0&&!b.pocketed);if(!cue)return;const len=Math.hypot(dx,dy)||1,speed=Math.min(.09,Math.max(.012,len*.00018));cue.vx=dx/len*speed;cue.vy=dy/len*speed;g.phase="rolling";g.shots++;g.ballInHand=false;g.message=room.players[me()].name+" takes the shot.";}
function settlePool(g){if(g.phase!=="rolling")return;const pocketed=g.balls.filter(b=>b.pocketed),objects=pocketed.filter(b=>b.id!==0&&b.id!==8),cue=g.balls.find(b=>b.id===0);if(g.groups[0]==="OPEN"&&objects.length){const first=objects[0],grp=first.kind==="stripe"?"STRIPES":"SOLIDS";g.groups[g.turn]=grp;g.groups[1-g.turn]=grp==="SOLIDS"?"STRIPES":"SOLIDS";}if(cue?.pocketed){cue.pocketed=false;cue.x=.24;cue.y=.5;cue.vx=cue.vy=0;g.ballInHand=true;g.message="Foul: cue ball scratched. Your opponent gets ball in hand.";g.turn=1-g.turn;}const eight=g.balls.find(b=>b.id===8);if(eight?.pocketed){const grp=g.groups[g.turn],left=g.balls.some(b=>!b.pocketed&&b.id!==0&&b.id!==8&&grp!=="OPEN"&&(grp==="SOLIDS"?b.kind==="solid":b.kind==="stripe"));g.winner=grp!=="OPEN"&&!left?room.players[g.turn].name:room.players[1-g.turn].name;g.message=g.winner===room.players[g.turn].name?"Eight ball legally pocketed — "+g.winner+" wins!":"Eight ball pocketed too early — "+g.winner+" wins!";}else if(!g.winner){const grp=g.groups[g.turn],scored=objects.some(b=>grp==="OPEN"||(grp==="SOLIDS"?b.kind==="solid":b.kind==="stripe"));if(!scored&&!g.ballInHand)g.turn=1-g.turn;g.message+=(scored&&!g.ballInHand?" Ball pocketed — shoot again!":" Turn passes to "+room.players[g.turn].name+".");}g.phase="ready";}
function initPoolCanvas(initial){
 const canvas=$("poolCanvas");if(!canvas)return;const ctx=canvas.getContext("2d"),W=1000,H=560,m=44,tw=W-2*m,th=H-2*m,pockets=[[0,0],[.5,0],[1,0],[0,1],[.5,1],[1,1]],local=JSON.parse(JSON.stringify(initial));
 const draw=()=>{ctx.clearRect(0,0,W,H);ctx.fillStyle="#4b2919";ctx.fillRect(0,0,W,H);ctx.fillStyle="#075b3d";ctx.fillRect(m,m,tw,th);ctx.strokeStyle="#d6b06c";ctx.lineWidth=6;ctx.strokeRect(m,m,tw,th);pockets.forEach(([x,y])=>{ctx.beginPath();ctx.arc(m+x*tw,m+y*th,25,0,Math.PI*2);ctx.fillStyle="#07090c";ctx.fill();ctx.strokeStyle="#b98a4e";ctx.lineWidth=3;ctx.stroke();});local.balls.forEach(b=>{if(b.pocketed)return;const x=m+b.x*tw,y=m+b.y*th,r=b.r*tw;ctx.beginPath();ctx.arc(x+2,y+3,r,0,Math.PI*2);ctx.fillStyle="#0019";ctx.fill();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=b.kind==="eight"?"#101010":b.colour;ctx.fill();ctx.strokeStyle="#fff9";ctx.lineWidth=2;ctx.stroke();if(b.kind==="stripe"){ctx.beginPath();ctx.ellipse(x,y,r*.9,r*.45,0,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();}ctx.beginPath();ctx.arc(x,y,r*.36,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.fillStyle="#111";ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(b.id),x,y);});if(local.aiming){const cue=local.balls.find(b=>b.id===0&&!b.pocketed);if(cue){ctx.beginPath();ctx.moveTo(m+cue.x*tw,m+cue.y*th);ctx.lineTo(local.px,local.py);ctx.setLineDash([8,8]);ctx.strokeStyle="#fff9";ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);}}};
 const collide=(a,b)=>{if(a.pocketed||b.pocketed)return;const dx=b.x-a.x,dy=(b.y-a.y)*th/tw,d=Math.hypot(dx,dy),min=a.r+b.r;if(!d||d>=min)return;const nx=dx/d,ny=dy/d,overlap=min-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5*tw/th;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5*tw/th;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny*th/tw;if(rel<0){a.vx+=rel*nx*.96;a.vy+=rel*ny*.96*tw/th;b.vx-=rel*nx*.96;b.vy-=rel*ny*.96*tw/th;}};
 const step=()=>{let moving=false;for(const b of local.balls){if(b.pocketed)continue;b.x+=b.vx;b.y+=b.vy;b.vx*=.986;b.vy*=.986;if(Math.abs(b.vx)+Math.abs(b.vy)>.0008)moving=true;else b.vx=b.vy=0;if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.86;}if(b.x>1-b.r){b.x=1-b.r;b.vx=-Math.abs(b.vx)*.86;}if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy)*.86;}if(b.y>1-b.r){b.y=1-b.r;b.vy=-Math.abs(b.vy)*.86;}for(const [px,py] of pockets){if(Math.hypot((b.x-px),(b.y-py)*th/tw)<.033){b.pocketed=true;b.vx=b.vy=0;break;}}}for(let i=0;i<local.balls.length;i++)for(let j=i+1;j<local.balls.length;j++)collide(local.balls[i],local.balls[j]);return moving||local.balls.some(b=>Math.abs(b.vx)+Math.abs(b.vy)>.0008);};
 canvas.onpointerdown=e=>{if(initial.turn!==me()||initial.winner||initial.phase!=="ready")return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H,cue=local.balls.find(b=>b.id===0&&!b.pocketed);if(!cue)return;if(initial.ballInHand){cue.x=Math.max(.04,Math.min(.96,(x-m)/tw));cue.y=Math.max(.04,Math.min(.96,(y-m)/th));local.placed=true;}local.aiming=true;local.px=x;local.py=y;canvas.setPointerCapture(e.pointerId);draw();};
 canvas.onpointermove=e=>{if(!local.aiming)return;const r=canvas.getBoundingClientRect();local.px=(e.clientX-r.left)/r.width*W;local.py=(e.clientY-r.top)/r.height*H;draw();};
 canvas.onpointerup=e=>{if(!local.aiming)return;local.aiming=false;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H,cue=local.balls.find(b=>b.id===0&&!b.pocketed);if(!cue)return;if(local.placed){change(s=>{if(s.pool.turn===me()&&s.pool.phase==="ready"){const c=s.pool.balls.find(b=>b.id===0);if(c){c.x=cue.x;c.y=cue.y;s.pool.ballInHand=false;}}});local.placed=false;}change(s=>shootPool(s.pool,m+cue.x*tw-x,m+cue.y*th-y));};
 if(initial.phase==="rolling"){let frames=0;const tick=()=>{const moving=step();draw();frames++;if(moving&&frames<1400){requestAnimationFrame(tick);return;}change(s=>{if(s.pool.phase!=="rolling")return;s.pool.balls=local.balls.map(b=>({...b,vx:0,vy:0}));settlePool(s.pool);});};requestAnimationFrame(tick);}else draw();
}

function newWhot(){
 return {deck:[],discard:[],hands:{"0":[],"1":[]},top:null,calledShape:null,turn:0,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,pendingPenalty:null,pendingGeneralMarket:null,dealt:false,readyPlayers:[],message:"Both players tap the deck to deal your cards."};
}
function dealWhot(g){
 const d=makeWhotDeck(),hands={"0":d.slice(0,6),"1":d.slice(6,12)};
 let rest=d.slice(12),topIndex=rest.findIndex(c=>c.s!==5);if(topIndex<0)topIndex=0;
 const top=rest.splice(topIndex,1)[0],turn=Math.floor(Math.random()*2);
 Object.assign(g,{deck:rest,discard:[],hands,top,calledShape:null,turn,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,pendingPenalty:null,pendingGeneralMarket:null,dealt:true,readyPlayers:[],message:"Cards dealt randomly! "+room.players[turn].name+" starts."});
}
function newSnakes(){return {positions:[0,0],turn:0,dice:null,winner:"",message:"Tap the dice to start your race to 100."};}
function newLudo(){return {tokens:{"0":[-1,-1,-1,-1],"1":[-1,-1,-1,-1],"2":[-1,-1,-1,-1],"3":[-1,-1,-1,-1]},turn:0,dice:null,roll:null,rolls:null,usedDice:[false,false],selectedDie:null,lastRoll:null,sixStreak:0,hasCaptured:{"0":false,"1":false},winner:"",message:"Tap the dice in the centre to roll. Choose one number, then tap a seed to move it."};}
function initialState(){return {scores:[0,0],gameScores:{whot:[0,0],ludo:[0,0],ttt:[0,0],snakes:[0,0],ayo:[0,0]},snakes:newSnakes(),ayo:newAyo(),pool:newPool(),ttt:{cells:Array(9).fill(""),turn:"X",winner:"",moves:0},whot:newWhot(),ludo:newLudo(),quiz:{index:0,answers:{},scores:[0,0]},truth:{turn:0,prompt:"Choose Truth or Dare to begin."}};}
function me(){return room?room.players.findIndex(p=>p.id===playerId):-1;}
function myName(p){return esc((room.players[p]||{}).name||("Player "+(p+1)));}
async function init(){
 $("connectionStatus").innerHTML="Loading Firebase modules…<br>Please wait";
 $("setupMessage").textContent="Loading the connection to Firebase…";
 try{
  const [am,au,fs,cf]=await Promise.all([
   import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
   import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
   import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
   import("./firebase-config.js")
  ]);
  initializeApp=am.initializeApp;getAuth=au.getAuth;signInAnonymously=au.signInAnonymously;getFirestore=fs.getFirestore;doc=fs.doc;setDoc=fs.setDoc;getDoc=fs.getDoc;onSnapshot=fs.onSnapshot;runTransaction=fs.runTransaction;serverTimestamp=fs.serverTimestamp;firebaseConfig=cf.firebaseConfig;
  if(!configOK()){$("connectionStatus").innerHTML="Setup needed<br>Firebase not connected";$("setupMessage").textContent="Firebase settings are missing or incomplete in firebase-config.js.";return;}
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);if(!auth.currentUser)await signInAnonymously(auth);
  $("connectionStatus").innerHTML="Firebase ready<br>Signed in anonymously";$("setupMessage").textContent="Firebase connected. Create a room and share the code with your partner.";
  const saved=readSession();
  if(saved?.roomId&&saved?.playerId&&saved.autoResume!==false){try{const prior=await getDoc(doc(db,"coupleRooms",saved.roomId));if(prior.exists()&&prior.data().players.some(p=>p.id===saved.playerId)){playerId=saved.playerId;enterRoom(saved.roomId);$("setupMessage").textContent="Reconnected to your saved room.";return;}}catch(e){console.warn("Could not restore saved room",e);}}
 }catch(e){const message=e&&e.message?e.message:String(e);say("Firebase startup error: "+message);$("connectionStatus").innerHTML="Connection error<br>See message below";$("setupMessage").textContent="Could not start Firebase: "+message;}
}
async function createRoom(){
 if(!db||!auth?.currentUser)return say("Firebase is still connecting. Please wait a moment and try again.");
 $("createRoom").disabled=true;
 try{playerId=crypto.randomUUID();roomId=roomCode();await setDoc(doc(db,"coupleRooms",roomId),{roomId,activeGame:"whot",players:[{id:playerId,name:playerName(),joinedAt:Date.now()}],state:initialState(),createdAt:serverTimestamp()});saveSession({roomId,playerId,name:playerName(),autoResume:true});enterRoom(roomId);}
 catch(e){say("Could not create room: "+e.message);}finally{$("createRoom").disabled=false;}
}
async function joinRoom(){
 if(!db||!auth?.currentUser)return say("Firebase is still connecting. Please wait a moment and try again.");
 const c=$("roomInput").value.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(c))return say("Enter the 6-character room code.");
 try{const wantedName=playerName();playerId=crypto.randomUUID();await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",c),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found. Check the code.");const data=snap.data(),players=Array.isArray(data.players)?data.players:[];const sameSeat=players.findIndex(p=>String(p.name||"").trim().toLowerCase()===wantedName.toLowerCase());if(sameSeat>=0){const updated=players.slice();updated[sameSeat]={...updated[sameSeat],id:playerId,name:wantedName,lastReconnectedAt:Date.now()};tx.update(ref,{players:updated});return;}if(players.length>=2)throw Error("This room already has two players. To return to your own seat, enter the exact name you used before.");tx.update(ref,{players:players.concat([{id:playerId,name:wantedName,joinedAt:Date.now()}])});});saveSession({roomId:c,playerId,name:wantedName,autoResume:true});enterRoom(c);}
 catch(e){say(e.message);}
}
function enterRoom(c){
 roomId=c;saveSession({roomId:c,playerId,name:playerName(),autoResume:true});gameOpen=false;gameLaunchId=null;roomSnapshotInitialized=false;$("setupPanel").classList.add("hidden");$("roomSection").classList.remove("hidden");$("roomCodeDisplay").textContent=c;document.querySelector(".games").classList.remove("hidden");$("gameArea").classList.add("hidden");if(unsubscribe)unsubscribe();
 unsubscribe=onSnapshot(doc(db,"coupleRooms",c),snap=>{if(!snap.exists())return say("Room no longer exists.");room=snap.data();activeGame=room.activeGame||"whot";renderRoom();const launch=room.gameLaunchId||null;if(!roomSnapshotInitialized){gameLaunchId=launch;roomSnapshotInitialized=true;if(launch){gameOpen=true;document.querySelector(".games").classList.add("hidden");$("gameArea").classList.remove("hidden");}}else if(launch&&launch!==gameLaunchId){gameLaunchId=launch;gameOpen=true;document.querySelector(".games").classList.add("hidden");$("gameArea").classList.remove("hidden");renderGame();}if(gameOpen)renderGame();},e=>say("Live sync error: "+e.message));
 $("roomSection").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderRoom(){
 $("playerLine").textContent=room.players.map(p=>p.name).join(" ♥ ")+(room.players.length<2?" · waiting for your person":" · both players connected");
 document.querySelectorAll(".game").forEach(b=>b.classList.toggle("active",b.dataset.game===activeGame));
}
async function change(fn){
 if(!room||!roomId)return;
 try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const data=snap.data(),oldState=structuredClone(data.state),state=structuredClone(data.state);fn(state,data);state.scores=Array.isArray(state.scores)?state.scores:[0,0];state.gameScores=state.gameScores&&typeof state.gameScores==="object"?state.gameScores:{whot:[0,0],ludo:[0,0],ttt:[0,0]};for(const key of ["whot","ludo","ttt"]){const oldWinner=oldState[key]?.winner,newWinner=state[key]?.winner;if(!oldWinner&&newWinner){const winnerIndex=data.players.findIndex(p=>p.name===newWinner);if(winnerIndex>=0){if(key==="whot"||key==="ludo"||key==="ayo"||key==="pool"){state.gameScores[key]=Array.isArray(state.gameScores[key])?state.gameScores[key]:[0,0];state.gameScores[key][winnerIndex]=(state.gameScores[key][winnerIndex]||0)+1;}else state.scores[winnerIndex]=(state.scores[winnerIndex]||0)+1;}}}tx.update(ref,{state});});}
 catch(e){say(e.message);}
}
function cardLabel(c){return c.s===5?"20":String(c.n);}
function cardShape(c){return c.s===5?"★":shapeGlyphs[c.s];}
function whotFace(c,caption){
 const n=cardLabel(c),special=c.s===5;
 return '<span class="card-corner top">'+esc(n)+'</span><span class="shape">'+esc(cardShape(c))+'</span><span class="card-caption">'+esc(special?"WHOT!":caption||shapeNames[c.s])+'</span><span class="card-corner bottom">'+esc(n)+'</span>';
}
function drawWhotCard(g){
 if(!g.deck.length&&g.discard.length){g.deck=shuffle(g.discard);g.discard=[];}
 return g.deck.length?g.deck.pop():null;
}
function whotCanPlay(c,g){
 if(!c||!g||!g.top)return !!c;
 if(g.pendingPenalty)return c.s!==5&&c.n===g.pendingPenalty.type;
 if(c.s===5)return true;
 if(g.top.s===5)return c.s===g.calledShape;
 return c.s===g.top.s||c.n===g.top.n;
}
function playWhotCard(g,p,i,chosenShape){
 const hand=g.hands[p]||[],c=hand[i];if(!c)return false;
 if(c.s===5&&chosenShape===undefined){g.pendingShapeIndex=i;g.pendingShapePlayer=p;g.message="Choose the shape you want to call with WHOT 20.";return false;}
 if(c.s===5&&(!Number.isInteger(chosenShape)||chosenShape<0||chosenShape>4))return false;
 const oldPenalty=g.pendingPenalty?{...g.pendingPenalty}:null;
 hand.splice(i,1);g.discard.push(g.top);g.top=c;g.calledShape=c.s===5?chosenShape:null;g.pendingShapeIndex=null;g.pendingShapePlayer=null;g.pendingPenalty=null;
 if(!hand.length){g.winner=room.players[p].name;g.message=g.winner+" wins Naija WHOT! 🎉";return true;}
 const opponent=1-p;
 if(oldPenalty){
  if(c.n===oldPenalty.type){
   g.pendingPenalty=null;g.turn=opponent;
   g.message=room.players[p].name+" blocked the Pick "+(oldPenalty.type===2?"Two":"Three")+"! Penalty cancelled.";
  }else{
   g.pendingPenalty={type:oldPenalty.type,amount:oldPenalty.amount,player:opponent};g.turn=opponent;
   g.message=room.players[p].name+" did not block the penalty. Pick "+oldPenalty.amount+" remains for the next player.";
  }
 }else if(c.n===2&&c.s!==5){
  g.pendingPenalty={type:2,amount:2,player:opponent};g.turn=opponent;g.message="Pick Two! "+room.players[opponent].name+" can defend with another 2 or draw 2 cards.";
 }else if(c.n===5&&c.s!==5){
  g.pendingPenalty={type:5,amount:3,player:opponent};g.turn=opponent;g.message="Pick Three! "+room.players[opponent].name+" can defend with another 5 or draw 3 cards.";
 }else if(c.n===8&&c.s!==5){g.turn=p;g.message="Suspension! "+room.players[opponent].name+" misses a turn.";}
 else if(c.n===1&&c.s!==5){g.turn=p;g.message="Hold On! "+room.players[p].name+" plays again.";}
 else if(c.n===14&&c.s!==5){g.pendingGeneralMarket=opponent;g.turn=opponent;g.message="General Market! "+room.players[opponent].name+" must tap the Market to pick one card.";}
 else{g.turn=opponent;g.message=room.players[p].name+" played "+(c.s===5?"WHOT 20 and called "+shapeNames[chosenShape]:cardLabel(c)+" "+shapeNames[c.s])+".";}
 return true;
}
function ludoCanMove(pos,dice){if(dice===null||dice===undefined)return false;if(pos===-1)return dice===6;if(pos===57)return false;return pos+dice<=57;}
function ensureLudoState(g){if(!g.tokens)g.tokens={};if(!Array.isArray(g.tokens["2"])&&!Array.isArray(g.tokens["3"])&&Array.isArray(g.tokens["1"])){g.tokens["3"]=g.tokens["1"].slice();g.tokens["1"]=[-1,-1,-1,-1];}for(let col=0;col<4;col++)if(!Array.isArray(g.tokens[String(col)]))g.tokens[String(col)]=[-1,-1,-1,-1];if(!Array.isArray(g.roll))g.roll=null;if(!Array.isArray(g.rolls))g.rolls=null;if(!Array.isArray(g.usedDice)||g.usedDice.length!==2)g.usedDice=[false,false];if(g.selectedDie===undefined)g.selectedDie=null;if(typeof g.hasCaptured!=="object"||!g.hasCaptured)g.hasCaptured={"0":false,"1":false};}
function ludoOwner(colour){return colour<2?0:1;}
function ludoGlobal(colour,pos){return (LUDO_START[colour]+pos)%52;}
function ludoNext(pos,dice){return pos===-1?0:pos+dice;}
function ludoIsPath(pos){return pos>=0&&pos<=51;}
function ludoOwnAt(g,colour,pos,exclude){return (g.tokens[String(colour)]||[]).some((v,i)=>i!==exclude&&v>=0&&v<=51&&ludoGlobal(colour,v)===pos);}
function ludoCanLand(g,colour,pos,dice){
 ensureLudoState(g);if(!ludoCanMove(pos,dice))return false;
 if(pos===-1)return dice===6;
 if(pos<=51&&ludoPathBlocked(g,colour,pos,dice))return false;
 const next=pos+dice;if(next>57)return false;
 if(next>=52)return !!g.hasCaptured[String(ludoOwner(colour))];
 const landing=ludoGlobal(colour,next),owner=ludoOwner(colour);
 for(let col=0;col<4;col++){
  const same=(g.tokens[String(col)]||[]).filter(v=>v>=0&&v<=51&&ludoGlobal(col,v)===landing).length;
  if(col===colour&&same>=2)return false;
  if(ludoOwner(col)!==owner&&same>=2&&!LUDO_SAFE.has(landing))return false;
 }
 if(LUDO_SAFE.has(landing))return true;
 const enemyCount=[];for(let col=0;col<4;col++)if(ludoOwner(col)!==owner)(g.tokens[String(col)]||[]).forEach(v=>{if(v>=0&&v<=51&&ludoGlobal(col,v)===landing)enemyCount.push(v);});
 return enemyCount.length<2;
}
function ludoPathBlocked(g,colour,from,dice){
 if(from<0||from>51)return false;
 const owner=ludoOwner(colour);
 for(let step=1;step<dice;step++){
  const progress=from+step;if(progress>51)break;
  const square=ludoGlobal(colour,progress);
  for(let col=0;col<4;col++)if(ludoOwner(col)!==owner){
   const count=(g.tokens[String(col)]||[]).filter(v=>v>=0&&v<=51&&ludoGlobal(col,v)===square).length;
   if(count>=2)return true;
  }
 }
 return false;
}
function ludoLegalTokens(g,p){ensureLudoState(g);const out=[];for(let colour=0;colour<4;colour++)if(ludoOwner(colour)===p)(g.tokens[String(colour)]||[]).forEach((pos,i)=>{if(ludoCanLand(g,colour,pos,g.dice))out.push({colour,token:i});});return out;}
function moveLudo(g,p,colour,tokenIndex){
 ensureLudoState(g);const own=g.tokens[String(colour)],pos=own[tokenIndex],dice=g.dice,dieIndex=g.selectedDie;
 if(ludoOwner(colour)!==p||g.turn!==p||dieIndex===null||dieIndex===undefined||!ludoCanLand(g,colour,pos,dice))return;
 if(pos===-1&&dice!==6)return;
 const before=pos,next=pos===-1?0:pos+dice,landing=ludoIsPath(next)?ludoGlobal(colour,next):null;
 if(landing!==null&&!LUDO_SAFE.has(landing)){
  for(let col=0;col<4;col++)if(ludoOwner(col)!==p){
   const enemies=(g.tokens[String(col)]||[]).map((v,i)=>({v,i})).filter(x=>x.v>=0&&x.v<=51&&ludoGlobal(col,x.v)===landing);
   if(enemies.length>=2){g.message="That square is blockaded. You cannot land there.";return;}
  }
 }
 own[tokenIndex]=next;let captured=false;
 if(landing!==null&&!LUDO_SAFE.has(landing)){
  for(let col=0;col<4;col++)if(ludoOwner(col)!==p){
   const enemies=(g.tokens[String(col)]||[]).map((v,i)=>({v,i})).filter(x=>x.v>=0&&x.v<=51&&ludoGlobal(col,x.v)===landing);
   if(enemies.length===1){g.tokens[String(col)][enemies[0].i]=-1;captured=true;own[tokenIndex]=57;}
  }
 }
 if(captured)g.hasCaptured[String(p)]=true;
 const finished=own[tokenIndex]===57,allColours=p===0?[0,1]:[2,3],allHome=allColours.every(col=>g.tokens[String(col)].every(v=>v===57));
 const colName=LUDO_COLOURS[colour].name.toLowerCase();
 if(allHome){g.winner=room.players[p].name;g.message=g.winner+" wins Naija Ludo! 🏆";}
 else if(captured)g.message=room.players[p].name+" captured an opponent seed! Their seed returned to base and your attacking seed is Home!";
 else if(finished)g.message=room.players[p].name+" brought a "+colName+" seed Home!";
 else if(before===-1)g.message=room.players[p].name+" brought a "+colName+" seed out of the yard.";
 else g.message=room.players[p].name+" moved a "+colName+" seed by "+dice+".";
 g.usedDice[dieIndex]=true;g.dice=null;g.selectedDie=null;
 if(g.winner){g.roll=null;g.rolls=null;g.usedDice=[false,false];return;}
 let remaining=false;
 for(let i=0;i<2;i++)if(!g.usedDice[i]&&Array.isArray(g.rolls)){
  g.dice=g.rolls[i];if(ludoLegalTokens(g,p).length)remaining=true;else g.usedDice[i]=true;
 }
 g.dice=null;
 if(remaining){g.message+=(captured?" Bonus move!":"")+" Choose the other dice number, then tap a seed.";return;}
 const extra=Array.isArray(g.rolls)&&g.rolls[0]===6&&g.rolls[1]===6;
 g.roll=null;g.rolls=null;g.usedDice=[false,false];
 if(!g.winner&&!extra)g.turn=1-p;
 else if(!g.winner)g.message+=(captured?" Capture bonus!":"")+" Roll again!";
}
function renderWhot(g){
 const p=me(),hand=g.hands[p]||[],opponent=1-p,opponentHand=g.hands[opponent]||[],top=g.top,dealt=!!top;
 const scores=(room.state.gameScores&&Array.isArray(room.state.gameScores.whot))?room.state.gameScores.whot:[0,0];
 const playable=dealt&&hand.some(c=>whotCanPlay(c,g)),ready=(g.readyPlayers||[]).includes(p),mustPickMarket=g.pendingGeneralMarket===p;
 let h='<div class="naija-whot-table">';
  h+='<div class="whot-opponent"><div class="opponent-hand">'+(dealt?opponentHand.map(()=>'<span class="card-back"><i>W</i></span>').join(''):'')+'</div></div>';
  h+='<div class="whot-turn-strip '+(g.winner?'game-over':g.turn===p?'your-turn':'not-your-turn')+'">'+(g.winner?'GAME OVER':g.turn===p?'YOUR TURN':'NOT YOUR TURN')+(g.pendingShapePlayer!==null?' · CHOOSING SHAPE':'')+'</div>';
  h+='<div class="game-score-strip whot-score-strip"><span>WHOT WINS</span><b>'+myName(0)+' <strong>'+(scores[0]||0)+'</strong></b><i>—</i><b>'+myName(1)+' <strong>'+(scores[1]||0)+'</strong></b></div>';
  h+='<div class="whot-arena"><div class="whot-pile"><button id="drawPile" class="playingcard card-back market-card" aria-label="'+(mustPickMarket?'Pick General Market card':'Draw card')+'" '+(!dealt||g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null?'disabled':'')+'><i>W</i></button><small>'+(mustPickMarket?'PICK CARD':'MARKET')+'</small></div><div class="whot-pile discard-pile">'+(top?'<div class="playingcard top-playing-card '+(top.s===5?"whot-card":"suit-"+top.s)+'">'+whotFace(top,top.s===5?(g.calledShape===null?"CALL A SHAPE":shapeNames[g.calledShape]):shapeNames[top.s])+'</div>':'<button id="dealPile" class="playingcard market-card deal-pile" aria-label="Tap cards to deal"><i>W</i></button>')+'<small>PLAYED CARD</small></div></div>';
  if(dealt&&g.calledShape!==null)h+='<div class="whot-called-shape">SHAPE TO MATCH: <b>'+shapeGlyphs[g.calledShape]+' '+shapeNames[g.calledShape].toUpperCase()+'</b></div>';
 if(!dealt){
   h+='<div class="whot-deal-panel"><button id="dealWhot" class="gold deal-button" '+(room.players.length<2||ready?'disabled':'')+'>TAP TO PLAY</button></div>';
 }else{
   h+='';
   h+='';
   if(g.pendingShapePlayer===p&&g.pendingShapeIndex!==null)h+='<div class="shape-picker"><div class="shape-options">'+shapeNames.map((n,i)=>'<button class="shape-choice" data-shape="'+i+'" aria-label="'+n+'"><span>'+shapeGlyphs[i]+'</span></button>').join("")+'</div></div>';
   else if(g.pendingShapePlayer!==null)h+='';
   h+='<div class="cards whot-hand">'+hand.map((c,i)=>'<button class="playingcard '+(c.s===5?"whot-card":"suit-"+c.s)+'" data-card="'+i+'" aria-label="'+esc(cardLabel(c)+" "+(c.s===5?"WHOT":shapeNames[c.s]))+'" '+(g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null||g.pendingGeneralMarket!==null?'disabled':'')+'>'+whotFace(c,c.s===5?"WHOT":shapeNames[c.s])+'</button>').join("")+'</div>';
  h+='<div class="whot-status-message">'+esc(g.message||"")+'</div>';
 }
 h+='</div>';return h;
}
function ludoDieFace(n){return n===null||n===undefined?"🎲":(["","⚀","⚁","⚂","⚃","⚄","⚅"][n]||"🎲");}
function renderLudo(g){
 ensureLudoState(g);
 const p=me(),scores=(room.state.gameScores&&Array.isArray(room.state.gameScores.ludo))?room.state.gameScores.ludo:[0,0];
 const status=g.winner?"GAME OVER":g.turn===p?"YOUR TURN":"NOT YOUR TURN";
 return '<div class="ludo-game-status '+(g.winner?"game-over":g.turn===p?"your-turn":"not-your-turn")+'">'+status+'</div><div class="game-score-strip ludo-score-strip"><span>LUDO WINS</span><b>'+myName(0)+' <strong>'+(scores[0]||0)+'</strong></b><i>—</i><b>'+myName(1)+' <strong>'+(scores[1]||0)+'</strong></b></div><div class="ludo-wrap"><div class="ludo-board-frame">'+renderLudoBoard(g)+'</div></div>';
}
function ludoPosLabel(v){if(v===-1)return "Yard";if(v===57)return "Home";if(v>=52)return "Home lane "+(v-51);return "Track "+(v+1);}
function renderLudoBoard(g){
 ensureLudoState(g);
 const pathMap={};LUDO_PATH.forEach((rc,i)=>pathMap[rc[0]+","+rc[1]]=i);
 const homeMap={};
 for(let i=0;i<5;i++){homeMap["7,"+(i+1)]={colour:0,step:i};homeMap["7,"+(13-i)]={colour:3,step:i};homeMap[(i+1)+",7"]={colour:1,step:i};homeMap[(13-i)+",7"]={colour:2,step:i};}
 const yardMap={},yardDefs=[{colour:0,cells:[[2,2],[2,4],[4,2],[4,4]]},{colour:1,cells:[[2,10],[2,12],[4,10],[4,12]]},{colour:2,cells:[[10,2],[10,4],[12,2],[12,4]]},{colour:3,cells:[[10,10],[10,12],[12,10],[12,12]]}];
 yardDefs.forEach(d=>d.cells.forEach((rc,i)=>yardMap[rc.join(",")]={colour:d.colour,i}));
 let out='<div class="ludo-board player-view-'+me()+'" role="group" aria-label="Four-colour Nigerian Ludo board with two dice">';
 for(let r=0;r<15;r++)for(let c=0;c<15;c++){
  const key=r+","+c,trackIndex=pathMap[key],lane=homeMap[key];let cls="ludo-cell",content="";
  if(trackIndex!==undefined){
   cls+=" track-cell";if(LUDO_SAFE.has(trackIndex))cls+=" safe-cell";
    const pieces=[];for(let colour=0;colour<4;colour++)g.tokens[String(colour)].forEach((pos,i)=>{if(pos>=0&&pos<=51&&ludoGlobal(colour,pos)===trackIndex){const col=LUDO_COLOURS[colour],eligible=me()===col.owner&&g.turn===me()&&g.selectedDie!==null&&g.dice!==null&&ludoCanLand(g,colour,pos,g.dice)&&!g.winner&&room.players.length>=2;pieces.push({colour,token:i,owner:col.owner,eligible,html:'<button class="board-token board-token-button '+col.css+'-token-bg'+(eligible?' ludo-move-hint':'')+'" data-token-owner="'+col.owner+'" data-token-colour="'+colour+'" data-token="'+i+'" aria-label="Move '+col.name.toLowerCase()+' seed '+(i+1)+(eligible?', available to move':'')+'" '+(eligible?'':'disabled')+'>'+(i+1)+'</button>'});}});
    const eligiblePieces=pieces.filter(x=>x.eligible);content=(LUDO_SAFE.has(trackIndex)?'<span class="safe-star">★</span>':"")+(eligiblePieces.length>1?'<button type="button" class="ludo-stack-trigger" data-ludo-stack="'+esc(JSON.stringify(eligiblePieces.map(x=>({colour:x.colour,token:x.token}))))+'" aria-label="Choose which seed to move">'+eligiblePieces.map(x=>'<span class="stack-dot '+LUDO_COLOURS[x.colour].css+'-token-bg">'+(x.token+1)+'</span>').join("")+'</button>':pieces.map(x=>x.html).join(""));
   if(trackIndex===LUDO_START[0])cls+=" red-start";if(trackIndex===LUDO_START[1])cls+=" green-start";if(trackIndex===LUDO_START[2])cls+=" yellow-start";if(trackIndex===LUDO_START[3])cls+=" blue-start";
  }else if(lane){
   const col=LUDO_COLOURS[lane.colour];cls+=" home-lane "+col.css+"-lane";
   const pos=52+lane.step,pieces=[];g.tokens[String(lane.colour)].forEach((v,i)=>{if(v===pos){const eligible=me()===col.owner&&g.turn===me()&&g.selectedDie!==null&&g.dice!==null&&ludoCanLand(g,lane.colour,v,g.dice)&&!g.winner&&room.players.length>=2;pieces.push('<button class="board-token board-token-button '+col.css+'-token-bg'+(eligible?' ludo-move-hint':'')+'" data-token-owner="'+col.owner+'" data-token-colour="'+lane.colour+'" data-token="'+i+'" aria-label="Move '+col.name.toLowerCase()+' seed '+(i+1)+' home" '+(eligible?'':'disabled')+' >'.replace(' >','>')+(i+1)+'</button>');}});content=pieces.join("")||(lane.step===4?"◆":"");
  }else if(r<=5&&c<=5){cls+=" base-red";}
  else if(r<=5&&c>=9){cls+=" base-green";}
  else if(r>=9&&c<=5){cls+=" base-yellow";}
  else if(r>=9&&c>=9){cls+=" base-blue";}
  if(r>=6&&r<=8&&c>=6&&c<=8){cls+=" center-home";if(r===7&&c===7){const active=me(),canRoll=g.turn===active&&!Array.isArray(g.rolls)&&!g.winner&&room.players.length>=2;if(!Array.isArray(g.rolls)){content='<button id="rollDice" class="center-dice-button '+(canRoll?'ready':'')+'" aria-label="Tap the central dice to roll" '+(canRoll?'':'disabled')+'><span class="initial-dice-emoji" aria-hidden="true">🎲</span><small>'+(canRoll?'TAP TO ROLL':'WAIT')+'</small></button>';}else{content='<div class="center-dice-select"><div class="center-dice-pair">'+g.rolls.map((n,i)=>'<button type="button" class="ludo-die die-choice '+(g.selectedDie===i?'selected':'')+(g.usedDice[i]?' used':'')+'" data-ludo-die="'+i+'" aria-label="Use dice result '+n+'" '+(g.usedDice[i]||g.turn!==active||g.winner?'disabled':'')+'><span>'+ludoDieFace(n)+'</span><b>'+n+'</b></button>').join('')+'</div></div>';}}else if(r===6&&c===6)cls+=" center-red";else if(r===6&&c===8)cls+=" center-green";else if(r===8&&c===6)cls+=" center-yellow";else if(r===8&&c===8)cls+=" center-blue";}
  const yard=yardMap[key];
  if(yard){const colour=yard.colour,col=LUDO_COLOURS[colour],tokenIndex=yard.i,pos=g.tokens[String(colour)][tokenIndex],isEligible=me()===col.owner&&g.turn===me()&&g.selectedDie!==null&&g.dice===6&&pos===-1&&!g.winner&&room.players.length>=2;cls+=" yard-cell yard-"+col.css;content=pos===-1?'<button class="yard-token '+col.css+'-token-bg'+(isEligible?' ludo-move-hint':'')+'" data-token-owner="'+col.owner+'" data-token-colour="'+colour+'" data-token="'+tokenIndex+'" aria-label="Move '+col.name.toLowerCase()+' seed '+(tokenIndex+1)+' out of yard'+(isEligible?', available to move':'')+'" '+(isEligible?'':'disabled')+'>'+(tokenIndex+1)+'</button>':"";}
  if((r<=5&&c<=5)||(r<=5&&c>=9)||(r>=9&&c<=5)||(r>=9&&c>=9)){const quad=(r<=5?(c<=5?"red":"green"):(c<=5?"yellow":"blue"));cls+=" base-"+quad;const inHome=(r>=1&&r<=4&&(c>=1&&c<=4||c>=10&&c<=13))||(r>=10&&r<=13&&(c>=1&&c<=4||c>=10&&c<=13));if(inHome)cls+=" base-home";if((r===2||r===4)&&(c===2||c===4)||(r===2||r===4)&&(c===10||c===12)||(r===10||r===12)&&(c===2||c===4)||(r===10||r===12)&&(c===10||c===12))cls+=" base-home-dot";}
  out+='<div class="'+cls+'">'+content+'</div>';
 }
 return out+'</div>';
}
const SNAKE_LADDERS={4:14,9:31,20:38,28:84,40:59,51:67,63:81,71:91,17:7,54:34,62:19,64:60,87:24,93:73,95:75,99:78};
function renderSnakes(g){
 if(!g||!Array.isArray(g.positions))g=newSnakes();
 const names=[myName(0),myName(1)],cols=["#ff579f","#63e6ff"];
 let h='<div class="snakes-wrap"><div class="snakes-score"><div><span class="snake-dot" style="background:'+cols[0]+'"></span><b>'+names[0]+'</b><strong>'+g.positions[0]+'/100</strong></div><div><span class="snake-dot" style="background:'+cols[1]+'"></span><b>'+names[1]+'</b><strong>'+g.positions[1]+'/100</strong></div></div>';
 h+='<div class="snakes-dice-panel"><button id="snakesRoll" class="snakes-roll" '+(g.turn!==me()||g.winner||room.players.length<2?'disabled':'')+'><span>'+(g.dice?ludoDieFace(g.dice):'🎲')+'</span><b>'+(g.dice||'ROLL')+'</b></button><div class="snakes-turn">'+(g.winner?esc(g.winner)+' wins! 🎉':room.players.length<2?'Waiting for your partner…':g.turn===me()?'Your turn — roll the dice':'Waiting for '+names[g.turn]+' to roll')+'<small>'+esc(g.message||'')+'</small></div></div>';
 h+='<div class="snakes-board" aria-label="Snake and Ladder board from 1 to 100">';
 for(let row=9;row>=0;row--)for(let col=0;col<10;col++){
  const n=row%2===1?row*10+(10-col):row*10+col+1;
  let cls='snake-square';if(n===100)cls+=' snake-finish';if(SNAKE_LADDERS[n])cls+=SNAKE_LADDERS[n]>n?' ladder-start':' snake-start';
  let marks=SNAKE_LADDERS[n]?'<small class="snake-link">'+(SNAKE_LADDERS[n]>n?'🪜 '+SNAKE_LADDERS[n]:'🐍 '+SNAKE_LADDERS[n])+'</small>':'';
  const tokens=g.positions.map((p,i)=>p===n?'<span class="snake-piece" style="background:'+cols[i]+'">'+(i===0?'B':'O')+'</span>':'').join('');
  h+='<div class="'+cls+'"><b>'+n+'</b>'+marks+(tokens?'<div class="snake-pieces">'+tokens+'</div>':'')+'</div>';
 }
 return h+'</div><div class="snakes-bottom"><span>🪜 Ladders take you up</span><span>🐍 Snakes slide you down</span></div></div>';
}

function finishedGameInfo(s){
 const key=activeGame==="whot"?"whot":activeGame==="ludo"?"ludo":activeGame==="snakes"?"snakes":activeGame==="ttt"?"ttt":activeGame==="ayo"?"ayo":activeGame==="pool"?"pool":null;
 if(!key)return null;
 const g=s[key];if(!g)return null;
 if(g.winner)return {key,winner:g.winner,draw:false};
 if(key==="ttt"&&g.moves>=9)return {key,winner:"",draw:true};
 return null;
}
function resetFinishedGame(s,key){
 if(key==="whot")s.whot=newWhot();
 else if(key==="ludo")s.ludo=newLudo();
 else if(key==="ttt")s.ttt={cells:Array(9).fill(""),turn:"X",winner:"",moves:0};
 else if(key==="snakes")s.snakes=newSnakes();
 else if(key==="ayo")s.ayo=newAyo();
 else if(key==="pool")s.pool=newPool();
 s.rematchVotes=[];
}
function renderGame(){
 if(!room)return;const s=room.state,waiting=room.players.length<2?"Waiting for your partner to join…":"Playing with "+(room.players[1-me()]||{}).name;
 let h=(activeGame==="whot"||activeGame==="ludo"||activeGame==="snakes"||activeGame==="ayo"||activeGame==="pool")?'<div class="whot-screen-header"><button id="backToGames" class="whot-back">← Games</button><div class="whot-brandline"><span>'+(activeGame==="whot"?"🃏":activeGame==="ludo"?"🎲":activeGame==="snakes"?"🐍":activeGame==="ayo"?"🫘":"🎱")+'</span><span><b>'+(activeGame==="whot"?"NAIJA WHOT":activeGame==="ludo"?"NAIJA LUDO":activeGame==="snakes"?"SNAKE & LADDER":activeGame==="ayo"?"AYO OWARE":"8-BALL POOL")+'</b><small>BAMI ♥ OLUWATOSIN</small></span></div><div class="whot-online">'+(room.players.length<2?'WAITING…':'● 2 PLAYERS')+'</div></div>':'<div class="actions"><button id="backToGames" class="secondary">← All games</button></div><div class="eyebrow">NOW PLAYING</div><h2>'+({whot:"🃏 WHOT!",ludo:"🎲 Ludo",ttt:"⭕ Tic-Tac-Toe",quiz:"💗 Couples Quiz",truth:"🔥 Truth or Dare"}[activeGame])+'</h2><p class="muted">'+esc(waiting)+'</p>';
 const scores=Array.isArray(s.scores)?s.scores:[0,0];if(activeGame!=="whot"&&activeGame!=="ludo")h+='<div class="overall-scoreboard"><span>🏆 MATCH SCORE</span><b>'+myName(0)+' '+(scores[0]||0)+'</b><i>—</i><b>'+myName(1)+' '+(scores[1]||0)+'</b></div>';
 if(activeGame==="ttt"){
  const g=s.ttt,turnIndex=g.turn==="X"?0:1,turnName=myName(turnIndex),done=!!g.winner||g.moves>=9;
  h+='<div class="ttt-screen"><div class="ttt-topbar"><button id="tttBackToGames" class="secondary ttt-back" type="button">← Games</button><div class="ttt-title"><span>⭕</span><div><b>TIC-TAC-TOE</b><small>BAMI ♥ OLUWATOSIN</small></div></div><span class="ttt-live">'+(room.players.length>=2?'● 2 PLAYERS':'WAITING…')+'</span></div>';
  h+='<div class="ttt-score-row"><div class="ttt-player-card '+(!done&&g.turn==="X"?'active':'')+'"><span class="ttt-mark x-mark">X</span><div><small>PLAYER 1</small><b>'+esc(myName(0))+'</b></div><strong>'+(scores[0]||0)+'</strong></div><div class="ttt-score-divider">VS</div><div class="ttt-player-card '+(!done&&g.turn==="O"?'active':'')+'"><span class="ttt-mark o-mark">O</span><div><small>PLAYER 2</small><b>'+esc(myName(1))+'</b></div><strong>'+(scores[1]||0)+'</strong></div></div>';
  h+='<div class="ttt-turn-banner '+(done?'finished':'')+'"><span class="ttt-turn-dot"></span><div><small>'+(g.winner?'ROUND WINNER':g.moves>=9?'ROUND RESULT':'CURRENT TURN')+'</small><b>'+(g.winner?esc(g.winner)+' wins!':g.moves>=9?'Draw — nobody won':esc(turnName)+(g.turn==="X"?' · X':' · O')+' to play')+'</b></div></div>';
  h+='<div class="ttt-board" role="group" aria-label="Tic-Tac-Toe board">'+g.cells.map((v,i)=>'<button class="ttt-cell '+(v?(v==="X"?'x-cell':'o-cell'):'')+'" data-cell="'+i+'" aria-label="Square '+(i+1)+(v?', '+v:' empty')+'" '+(v||done||room.players.length<2||g.turn!==(me()===0?"X":"O")?'disabled':'')+'>'+esc(v)+'</button>').join("")+'</div>';
  h+='<div class="ttt-bottom"><span>'+(room.players.length<2?'Waiting for your partner to join…':done?'Play another round together ❤️':'Tap any empty square on your turn')+'</span><button id="resetTtt" class="pink">↻ New round</button></div></div>';
 }
 if(activeGame==="whot")h+=renderWhot(s.whot);
 if(activeGame==="ludo")h+=renderLudo(s.ludo);
 if(activeGame==="snakes")h+=renderSnakes(s.snakes);
 if(activeGame==="ayo")h+=renderAyo(s.ayo);
 if(activeGame==="pool")h+=renderPool(s.pool);
 if(activeGame==="pool")setTimeout(()=>initPoolCanvas(room?.state?.pool||s.pool),0);
 if(activeGame==="quiz"){
  const g=s.quiz,q=quiz[g.index%quiz.length];h+='<div class="quizcard"><div class="muted">Question '+(g.index%quiz.length+1)+' of '+quiz.length+'</div><h3>'+esc(q[0])+'</h3><p class="muted">Choose what you think your partner would answer, then talk about it.</p><div class="answers">'+q[1].map((a,i)=>'<button data-answer="'+i+'" '+(g.answers[me()]===i?'style="outline:2px solid #ff579f"':'')+' '+(room.players.length<2?'disabled':'')+'>'+esc(a)+'</button>').join("")+'</div><p class="muted">'+myName(0)+': '+g.scores[0]+' points · '+myName(1)+': '+g.scores[1]+' points</p><button id="nextQuiz" class="pink" '+((g.answers[0]===undefined||g.answers[1]===undefined||room.players.length<2)?'disabled':'')+'>Next question →</button> <button id="resetQuiz" class="secondary">Reset</button></div>';
 }
 if(activeGame==="truth"){
  const turnName=myName(s.truth.turn);h+='<div class="quizcard center"><div class="muted">'+turnName+'’s turn</div><h3>'+esc(s.truth.prompt)+'</h3><button id="truthBtn" class="pink" '+(s.truth.turn!==me()||room.players.length<2?'disabled':'')+'>💗 Truth</button> <button id="dareBtn" class="gold" '+(s.truth.turn!==me()||room.players.length<2?'disabled':'')+'>🔥 Dare</button><p><button id="nextTruth" class="secondary" '+(s.truth.turn!==me()||room.players.length<2?'disabled':'')+'>Next turn ↻</button></p><p class="notice">Skip anything uncomfortable. Kindness first ❤️</p></div>';
 }
 const finished=finishedGameInfo(s);
 if(finished){
  const p=me(),votes=Array.isArray(s.rematchVotes)?s.rematchVotes:[],alreadyVoted=votes.includes(p);
  const isWinner=!finished.draw&&room.players[p]?.name===finished.winner;
  const result=finished.draw?"GAME OVER! 🤝 IT’S A DRAW":isWinner?"GAME OVER! 🎉 YOU WIN!":"GAME OVER! ❌ YOU LOST";
  h+='<div class="rematch-overlay" role="dialog" aria-modal="true" aria-label="Game over"><div class="rematch-panel"><div class="rematch-result">'+result+'</div><p>'+(finished.draw?'Nobody won this round. Play again?':esc(finished.winner)+' won the match!')+'</p><button id="rematchButton" class="pink" '+(alreadyVoted?'disabled':'')+'>'+(alreadyVoted?'✓ Rematch requested':'↻ Rematch')+'</button><div class="rematch-waiting">'+votes.length+' of 2 players ready'+(alreadyVoted?' · Waiting for your partner…':' · Both players must press Rematch')+'</div></div></div>';
 }
 $("gameArea").innerHTML=h;wireGame();
}
function wireGame(){
 const rematch=$( "rematchButton" );
 if(rematch)rematch.onclick=()=>change(s=>{
  const finished=finishedGameInfo(s);if(!finished)return;
  const votes=Array.isArray(s.rematchVotes)?s.rematchVotes:[];
  if(!votes.includes(me()))votes.push(me());
  s.rematchVotes=votes;
  if(s.rematchVotes.includes(0)&&s.rematchVotes.includes(1))resetFinishedGame(s,finished.key);
 });
 document.querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ttt,i=+b.dataset.cell,mark=me()===0?"X":"O",lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];if(g.cells[i]||g.winner||g.turn!==mark||room.players.length<2)return;g.cells[i]=mark;g.moves++;if(lines.some(l=>l.every(n=>g.cells[n]===mark)))g.winner=room.players[me()].name;else g.turn=mark==="X"?"O":"X";}));
 const backButtons=document.querySelectorAll("#backToGames, #tttBackToGames");backButtons.forEach(back=>{back.type="button";back.onclick=ev=>{ev.preventDefault();ev.stopPropagation();gameOpen=false;const picker=document.querySelector(".games"),area=$("gameArea"),section=$("roomSection");if(area){area.innerHTML='<div class="center muted">Choose a game to start.</div>';area.classList.add("hidden");area.style.display="none";}if(picker){picker.classList.remove("hidden");picker.style.display="grid";}if(section)section.classList.remove("hidden");document.body.style.overflow="";document.documentElement.style.overflow="";window.scrollTo(0,0);if(picker)picker.scrollIntoView({behavior:"auto",block:"start"});};});
 const rt=$("resetTtt");if(rt)rt.onclick=()=>change(s=>{s.ttt={cells:Array(9).fill(""),turn:"X",winner:"",moves:0};});
 const dealWhotBtn=$("dealWhot"),dealPile=$("dealPile");const tapToDeal=()=>change(s=>{const g=s.whot;if(g.dealt||g.top||room.players.length<2)return;const ready=Array.isArray(g.readyPlayers)?g.readyPlayers:[];if(ready.includes(me()))return;g.readyPlayers=ready.concat(me());if(g.readyPlayers.length>=2)dealWhot(g);else g.message=room.players[me()].name+" is ready. Waiting for the other player to tap the deck.";});if(dealWhotBtn)dealWhotBtn.onclick=tapToDeal;if(dealPile)dealPile.onclick=tapToDeal;
  document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),i=+b.dataset.card,c=(g.hands[p]||[])[i];if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2||!c||!whotCanPlay(c,g))return;if(c.s===5){g.pendingShapeIndex=i;g.pendingShapePlayer=p;g.message="Choose the shape to call.";return;}playWhotCard(g,p,i);}));
 document.querySelectorAll("[data-shape]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),shape=+b.dataset.shape;if(g.pendingShapePlayer!==p||g.pendingShapeIndex===null)return;playWhotCard(g,p,g.pendingShapeIndex,shape);}));
 const drawFromMarket=()=>change(s=>{const g=s.whot,p=me();if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2)return;if(g.pendingGeneralMarket===p){const c=drawWhotCard(g);if(!c){g.message="No cards remain in the Market.";return;}g.hands[p].push(c);g.pendingGeneralMarket=null;g.turn=1-p;g.message=room.players[p].name+" picked one card from General Market. Turn passes.";}else if(g.pendingPenalty){const amount=g.pendingPenalty.amount;for(let n=0;n<amount;n++){const c=drawWhotCard(g);if(c)g.hands[p].push(c);}g.pendingPenalty=null;g.turn=1-p;g.message=room.players[p].name+" picked "+amount+" card(s) from the Market. Turn passes.";}else{const c=drawWhotCard(g);if(!c){g.message="No cards remain to draw. Restart the game.";return;}g.hands[p].push(c);g.turn=1-p;g.message=room.players[p].name+" picked a card from the Market. Turn passes.";}});const dr=$("drawCard");if(dr)dr.onclick=drawFromMarket;const pile=$("drawPile");if(pile)pile.onclick=drawFromMarket;
 const rw=$("resetWhot");if(rw)rw.onclick=()=>change(s=>{s.whot=newWhot();});
 const snakeRoll=$("snakesRoll");if(snakeRoll)snakeRoll.onclick=()=>change(s=>{if(!s.snakes)s.snakes=newSnakes();const g=s.snakes;if(g.turn!==me()||g.winner||room.players.length<2)return;const roll=1+Math.floor(Math.random()*6);g.dice=roll;let next=g.positions[me()];if(next+roll>100){g.message="Need an exact roll to reach 100.";g.turn=1-me();return;}next+=roll;if(SNAKE_LADDERS[next]){const target=SNAKE_LADDERS[next];g.message=target>next?"Ladder! Climb from "+next+" to "+target+"!":"Snake! Slide from "+next+" to "+target+"!";next=target;}else g.message=room.players[me()].name+" moved to square "+next+".";g.positions[me()]=next;if(next===100){g.winner=room.players[me()].name;g.message=g.winner+" wins Snake and Ladder!";return;}if(roll===6)g.message+=" Six! Roll again.";else g.turn=1-me();});
  const roll=$("rollDice");if(roll)roll.onclick=async()=>{if(roll.disabled||roll.dataset.rolling==="1")return;roll.dataset.rolling="1";roll.classList.add("is-rolling");try{await change(s=>{const g=s.ludo,p=me();ensureLudoState(g);if(g.turn!==p||Array.isArray(g.rolls)||g.winner||room.players.length<2)return;const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),rolls=[a,b];g.roll=rolls;g.rolls=rolls;g.usedDice=[false,false];g.selectedDie=null;g.dice=null;g.lastRoll=rolls;g.sixStreak=0;let any=false;for(let i=0;i<2;i++){g.dice=rolls[i];if(ludoLegalTokens(g,p).length)any=true;else g.usedDice[i]=true;}g.dice=null;if(!any){const bonus=a===6&&b===6;g.message=room.players[p].name+" rolled "+a+" and "+b+" but has no legal move. "+(bonus?"Double six: roll again!":"Turn passes.");g.roll=null;g.rolls=null;g.usedDice=[false,false];g.sixStreak=0;if(!bonus)g.turn=1-p;}else g.message="";});}finally{const current=$("rollDice");if(current){current.dataset.rolling="";current.classList.remove("is-rolling");}}};
document.querySelectorAll("[data-ludo-die]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ludo,p=me(),i=+b.dataset.ludoDie;ensureLudoState(g);if(g.turn!==p||!Array.isArray(g.rolls)||g.usedDice[i]||g.winner||room.players.length<2)return;g.dice=g.rolls[i];g.selectedDie=i;if(!ludoLegalTokens(g,p).length){g.usedDice[i]=true;g.dice=null;g.selectedDie=null;g.message="No seed can use "+g.rolls[i]+". Choose the other number.";if(g.usedDice.every(Boolean)){const bonus=g.rolls[0]===6&&g.rolls[1]===6;g.roll=null;g.rolls=null;g.usedDice=[false,false];if(!bonus)g.turn=1-p;g.message+=bonus?" Double six: roll again!":" Turn passes."}return;}g.message="Selected "+g.rolls[i]+". Now tap one of your movable seeds."; }));
  document.querySelectorAll("[data-ludo-stack]").forEach(b=>b.onclick=()=>{const choices=JSON.parse(b.dataset.ludoStack),area=$("gameArea");if(!area)return;const overlay=document.createElement("div");overlay.className="ludo-seed-picker-overlay";overlay.innerHTML='<div class="ludo-seed-picker" role="dialog" aria-modal="true"><b>Which seed do you want to move?</b><div class="ludo-seed-picker-options">'+choices.map(x=>'<button type="button" class="ludo-seed-option '+LUDO_COLOURS[x.colour].css+'-token-bg" data-pick-colour="'+x.colour+'" data-pick-token="'+x.token+'">'+LUDO_COLOURS[x.colour].name+' seed '+(x.token+1)+'</button>').join("")+'</div><button type="button" class="secondary ludo-seed-cancel">Cancel</button></div>';area.appendChild(overlay);overlay.querySelector(".ludo-seed-cancel").onclick=()=>overlay.remove();overlay.querySelectorAll("[data-pick-colour]").forEach(opt=>opt.onclick=()=>{const colour=+opt.dataset.pickColour,token=+opt.dataset.pickToken;overlay.remove();change(s=>{const g=s.ludo,p=me();if(g.turn!==p||g.winner||room.players.length<2||g.selectedDie===null||g.dice===null)return;moveLudo(g,p,colour,token);});});});
 document.querySelectorAll("[data-token-owner]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ludo,p=me(),owner=+b.dataset.tokenOwner,colour=+b.dataset.tokenColour,token=+b.dataset.token;if(owner!==p||g.turn!==p||g.winner||room.players.length<2)return;moveLudo(g,p,colour,token);}));
 const rl=$("resetLudo");if(rl)rl.onclick=()=>change(s=>{s.ludo=newLudo();});
 document.querySelectorAll("[data-ayo-pit]").forEach(b=>b.onclick=()=>change(s=>{if(room.players.length<2)return;playAyo(s.ayo,+b.dataset.ayoPit,me());}));
 const resetAyoBtn=$("resetAyo");if(resetAyoBtn)resetAyoBtn.onclick=()=>change(s=>{s.ayo=newAyo();});
 const resetPoolBtn=$("resetPool");if(resetPoolBtn)resetPoolBtn.onclick=()=>change(s=>{s.pool=newPool();});
 document.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>change(s=>{if(room.players.length<2)return;if(Array.isArray(s.quiz.answers))s.quiz.answers={};s.quiz.answers[me()]=+b.dataset.answer;}));
 const nq=$("nextQuiz");if(nq)nq.onclick=()=>change(s=>{const g=s.quiz;if(g.answers[0]===undefined||g.answers[1]===undefined)return;if(g.answers[0]===g.answers[1]){g.scores[0]++;g.scores[1]++;}g.index=(g.index+1)%quiz.length;g.answers={};});
 const rq=$("resetQuiz");if(rq)rq.onclick=()=>change(s=>{s.quiz={index:0,answers:{},scores:[0,0]};});
 const tb=$("truthBtn");if(tb)tb.onclick=()=>change(s=>{if(s.truth.turn!==me())return;s.truth.prompt=truths[Math.floor(Math.random()*truths.length)];});
 const dbtn=$("dareBtn");if(dbtn)dbtn.onclick=()=>change(s=>{if(s.truth.turn!==me())return;s.truth.prompt=dares[Math.floor(Math.random()*dares.length)];});
 const nt=$("nextTruth");if(nt)nt.onclick=()=>change(s=>{if(s.truth.turn!==me())return;s.truth.turn=1-s.truth.turn;s.truth.prompt="Choose Truth or Dare to begin.";});
}
$("createRoom").onclick=createRoom;$("joinRoom").onclick=joinRoom;
function returnToGamePicker(ev){
 if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
 gameOpen=false;
 const area=$("gameArea"),picker=document.querySelector(".games"),section=$("roomSection");
 if(area){area.innerHTML='<div class="center muted">Choose a game to start.</div>';area.classList.add("hidden");area.style.display="none";}
 if(picker){picker.classList.remove("hidden");picker.style.display="grid";}
 if(section)section.classList.remove("hidden");
 document.body.style.overflow="";document.documentElement.style.overflow="";
 window.scrollTo(0,0);
 if(picker)picker.scrollIntoView({behavior:"auto",block:"start"});
}
document.addEventListener("click",function(ev){
 const back=ev.target&&ev.target.closest?ev.target.closest("#tttBackToGames, #backToGames"):null;
 if(back){returnToGamePicker(ev);}
},true);
document.querySelectorAll(".game").forEach(b=>b.onclick=async()=>{if(!roomId||!db)return say("Create or join a room before choosing a game.");try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");tx.update(ref,{activeGame:b.dataset.game,gameLaunchId:Date.now()+"-"+Math.random().toString(36).slice(2)});});activeGame=b.dataset.game;gameOpen=true;document.querySelector(".games").classList.add("hidden");const area=$("gameArea");area.style.display="";area.classList.remove("hidden");renderGame();area.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){say("Could not switch game: "+e.message);}});
$("copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(roomId);say("Room code copied: "+roomId);}catch(e){say("Share this room code: "+roomId);}};
$("leaveRoom").onclick=()=>{saveSession({autoResume:false});if(unsubscribe)unsubscribe();unsubscribe=null;roomId=null;room=null;playerId=null;gameOpen=false;gameLaunchId=null;roomSnapshotInitialized=false;$("gameArea").classList.add("hidden");document.querySelector(".games").classList.remove("hidden");$("roomSection").classList.add("hidden");$("setupPanel").classList.remove("hidden");$("connectionStatus").innerHTML="Firebase ready<br>Not in a room yet";window.scrollTo({top:0,behavior:"smooth"});};
init();