let initializeApp, getAuth, signInAnonymously, getFirestore, doc, setDoc, onSnapshot, runTransaction, serverTimestamp, firebaseConfig;
const $ = id => document.getElementById(id);
let db = null, auth = null, roomId = null, playerId = null, room = null, unsubscribe = null, activeGame = "whot";
const shapeNames = ["Circle","Triangle","Cross","Square","Star"];
const shapeGlyphs = ["○","△","×","□","☆"];
const whotNumbers = [1,2,3,4,5,7,8,10,11,12,13,14];
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
 for(let c=0;c<=5;c++)p.push([6,c]);
 for(let r=5;r>=0;r--)p.push([r,6]);
 p.push([0,7],[0,8]);
 for(let r=1;r<=5;r++)p.push([r,8]);
 for(let c=9;c<=14;c++)p.push([6,c]);
 p.push([7,14]);
 for(let c=13;c>=8;c--)p.push([8,c]);
 for(let r=9;r<=14;r++)p.push([r,8]);
 p.push([14,7],[14,6]);
 for(let r=13;r>=9;r--)p.push([r,6]);
 for(let c=5;c>=0;c--)p.push([8,c]);
 p.push([7,0]);
 return p;
})();
const LUDO_SAFE = new Set([0,8,13,21,26,34,39,47]);
const LUDO_START = [0,26];
function say(t){const e=$("globalMessage");e.textContent=t;e.classList.remove("hidden");}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function playerName(){return $("playerName").value.trim().slice(0,24)||"Player";}
function roomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
function configOK(){return firebaseConfig.apiKey&&!firebaseConfig.apiKey.includes("PASTE_")&&firebaseConfig.projectId&&!firebaseConfig.projectId.includes("PASTE_")&&firebaseConfig.appId&&!firebaseConfig.appId.includes("PASTE_");}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeWhotDeck(){const a=[];for(let s=0;s<5;s++)for(const n of whotNumbers)a.push({s,n});for(let n=0;n<5;n++)a.push({s:5,n:5});return shuffle(a);}
function newWhot(){
 const d=makeWhotDeck(),hands={"0":d.slice(0,6),"1":d.slice(6,12)};
 let rest=d.slice(12),topIndex=rest.findIndex(c=>c.s!==5);if(topIndex<0)topIndex=0;
 const top=rest.splice(topIndex,1)[0];
 return {deck:rest,discard:[],hands,top,calledShape:null,turn:0,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,message:"Match the shape or number. Special cards: 1 Hold On, 2 Pick Two, 5 WHOT, 8 Suspension, 14 General Market."};
}
function newLudo(){return {tokens:{"0":[-1,-1,-1,-1],"1":[-1,-1,-1,-1]},turn:0,dice:null,winner:"",message:"Roll a 6 to bring a token out of the yard. Reach Home with an exact roll."};}
function initialState(){return {ttt:{cells:Array(9).fill(""),turn:"X",winner:"",moves:0},whot:newWhot(),ludo:newLudo(),quiz:{index:0,answers:{},scores:[0,0]},truth:{turn:0,prompt:"Choose Truth or Dare to begin."}};}
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
  initializeApp=am.initializeApp;getAuth=au.getAuth;signInAnonymously=au.signInAnonymously;getFirestore=fs.getFirestore;doc=fs.doc;setDoc=fs.setDoc;onSnapshot=fs.onSnapshot;runTransaction=fs.runTransaction;serverTimestamp=fs.serverTimestamp;firebaseConfig=cf.firebaseConfig;
  if(!configOK()){$("connectionStatus").innerHTML="Setup needed<br>Firebase not connected";$("setupMessage").textContent="Firebase settings are missing or incomplete in firebase-config.js.";return;}
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);await signInAnonymously(auth);
  $("connectionStatus").innerHTML="Firebase ready<br>Signed in anonymously";$("setupMessage").textContent="Firebase connected. Create a room and share the code with your partner.";
 }catch(e){const message=e&&e.message?e.message:String(e);say("Firebase startup error: "+message);$("connectionStatus").innerHTML="Connection error<br>See message below";$("setupMessage").textContent="Could not start Firebase: "+message;}
}
async function createRoom(){
 if(!db||!auth?.currentUser)return say("Firebase is still connecting. Please wait a moment and try again.");
 $("createRoom").disabled=true;
 try{playerId=crypto.randomUUID();roomId=roomCode();await setDoc(doc(db,"coupleRooms",roomId),{roomId,activeGame:"whot",players:[{id:playerId,name:playerName(),joinedAt:Date.now()}],state:initialState(),createdAt:serverTimestamp()});enterRoom(roomId);}
 catch(e){say("Could not create room: "+e.message);}finally{$("createRoom").disabled=false;}
}
async function joinRoom(){
 if(!db||!auth?.currentUser)return say("Firebase is still connecting. Please wait a moment and try again.");
 const c=$("roomInput").value.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(c))return say("Enter the 6-character room code.");
 try{playerId=crypto.randomUUID();await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",c),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found. Check the code.");const data=snap.data();if(data.players.length>=2)throw Error("This room already has two players.");if(data.players.some(p=>p.name.toLowerCase()===playerName().toLowerCase()))throw Error("Choose a different player name.");tx.update(ref,{players:data.players.concat([{id:playerId,name:playerName(),joinedAt:Date.now()}])});});enterRoom(c);}
 catch(e){say(e.message);}
}
function enterRoom(c){
 roomId=c;$("roomSection").classList.remove("hidden");$("roomCodeDisplay").textContent=c;if(unsubscribe)unsubscribe();
 unsubscribe=onSnapshot(doc(db,"coupleRooms",c),snap=>{if(!snap.exists())return say("Room no longer exists.");room=snap.data();activeGame=room.activeGame||"whot";renderRoom();renderGame();},e=>say("Live sync error: "+e.message));
 $("roomSection").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderRoom(){
 $("playerLine").textContent=room.players.map(p=>p.name).join(" ♥ ")+(room.players.length<2?" · waiting for your person":" · both players connected");
 document.querySelectorAll(".game").forEach(b=>b.classList.toggle("active",b.dataset.game===activeGame));
}
async function change(fn){
 if(!room||!roomId)return;
 try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const data=snap.data(),state=structuredClone(data.state);fn(state,data);tx.update(ref,{state});});}
 catch(e){say(e.message);}
}
function cardLabel(c){return c.s===5?"WHOT":String(c.n);}
function cardShape(c){return c.s===5?"★":shapeGlyphs[c.s];}
function drawWhotCard(g){
 if(!g.deck.length&&g.discard.length){g.deck=shuffle(g.discard);g.discard=[];}
 return g.deck.length?g.deck.pop():null;
}
function whotCanPlay(c,g){const activeShape=g.top.s===5?g.calledShape:g.top.s;return c.s===5||c.s===activeShape||c.n===g.top.n;}
function playWhotCard(g,p,i,chosenShape){
 const hand=g.hands[p]||[],c=hand[i];if(!c)return false;
 if(c.s===5&&chosenShape===undefined){g.pendingShapeIndex=i;g.pendingShapePlayer=p;g.message="Choose a shape for your WHOT card.";return false;}
 if(!whotCanPlay(c,g)){g.message="That card cannot be played. Match the shape or number, or use WHOT.";return false;}
 if(c.s===5&&(!Number.isInteger(chosenShape)||chosenShape<0||chosenShape>4))return false;
 hand.splice(i,1);g.discard.push(g.top);g.top=c;g.calledShape=c.s===5?chosenShape:null;g.pendingShapeIndex=null;g.pendingShapePlayer=null;
 if(!hand.length){g.winner=room.players[p].name;g.message=g.winner+" wins WHOT! 🎉";return true;}
 const opponent=1-p;
 if(c.n===2&&c.s!==5){for(let n=0;n<2;n++){const drawn=drawWhotCard(g);if(drawn)g.hands[opponent].push(drawn);}g.turn=p;g.message=room.players[p].name+" played Pick Two. "+room.players[opponent].name+" draws two and misses the turn.";}
 else if(c.n===8){g.turn=p;g.message=room.players[p].name+" played Suspension. They play again.";}
 else if(c.n===1){g.turn=p;g.message="Hold On! "+room.players[p].name+" plays again.";}
 else if(c.n===14){const drawn=drawWhotCard(g);if(drawn)g.hands[opponent].push(drawn);g.turn=p;g.message="General Market! "+room.players[opponent].name+" picks a card; "+room.players[p].name+" plays again.";}
 else{g.turn=opponent;g.message=room.players[p].name+" played "+cardLabel(c)+(c.s===5?" and called "+shapeNames[chosenShape]:"")+".";}
 return true;
}
function ludoCanMove(pos,dice){if(dice===null||dice===undefined)return false;if(pos===-1)return dice===6;if(pos===57)return false;return pos+dice<=57;}
function ludoLegalTokens(g,p){return (g.tokens[String(p)]||[]).map((pos,i)=>ludoCanMove(pos,g.dice)?i:-1).filter(i=>i>=0);}
function ludoGlobal(p,pos){return (LUDO_START[p]+pos)%52;}
function moveLudo(g,p,tokenIndex){
 const own=g.tokens[String(p)],pos=own[tokenIndex],dice=g.dice;if(g.turn!==p||!ludoCanMove(pos,dice))return;
 const before=pos;own[tokenIndex]=pos===-1?0:pos+dice;let captured=false;
 if(own[tokenIndex]>=0&&own[tokenIndex]<=51){
  const landing=ludoGlobal(p,own[tokenIndex]);
  if(!LUDO_SAFE.has(landing)){
   const opp=g.tokens[String(1-p)];
   for(let i=0;i<opp.length;i++){if(opp[i]>=0&&opp[i]<=51&&ludoGlobal(1-p,opp[i])===landing){opp[i]=-1;captured=true;}}
  }
 }
 const finished=own[tokenIndex]===57;
 if(own.every(v=>v===57)){g.winner=room.players[p].name;g.message=g.winner+" wins Ludo! 🏆";}
 else if(finished){g.message=room.players[p].name+" brought token "+(tokenIndex+1)+" Home!";}
 else if(captured){g.message=room.players[p].name+" captured an opponent token!";}
 else if(before===-1){g.message=room.players[p].name+" brought token "+(tokenIndex+1)+" out of the yard.";}
 else{g.message=room.players[p].name+" moved token "+(tokenIndex+1)+" by "+dice+".";}
 const extra=dice===6||captured||finished;g.dice=null;if(!g.winner&&!extra)g.turn=1-p;
}
function renderWhot(g){
 const p=me(),hand=g.hands[p]||[],top=g.top;
 let h='<div class="center"><div class="whot-status"><div class="muted">TOP CARD</div><div class="playingcard top-playing-card"><span>'+esc(cardLabel(top))+'</span><span class="shape">'+esc(cardShape(top))+'</span><span>'+esc(top.s===5?(g.calledShape===null?"Choose a shape":shapeNames[g.calledShape]):shapeNames[top.s])+'</span></div><p>'+esc(g.message)+'</p><p class="muted">Your cards: '+hand.length+' · Partner: '+((g.hands[1-p]||[]).length)+'</p><p class="muted">Turn: '+myName(g.turn)+'</p></div>';
 if(g.pendingShapePlayer===p&&g.pendingShapeIndex!==null){h+='<div class="shape-picker"><b>Choose the shape</b><div class="shape-options">'+shapeNames.map((n,i)=>'<button class="shape-choice" data-shape="'+i+'">'+shapeGlyphs[i]+'<small>'+n+'</small></button>').join("")+'</div></div>';}
 else if(g.pendingShapePlayer!==null){h+='<p class="notice">Your partner is choosing a shape…</p>';}
 h+='<div class="cards whot-hand">'+hand.map((c,i)=>'<button class="playingcard '+(c.s===5?"whot-card":"")+'" data-card="'+i+'" '+(g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null?'disabled':'')+'><span>'+esc(cardLabel(c))+'</span><span class="shape">'+esc(cardShape(c))+'</span><span>'+(c.s===5?"CALL A SHAPE":esc(shapeNames[c.s]))+'</span></button>').join("")+'</div>';
 h+='<div class="actions center-actions"><button id="drawCard" class="gold" '+(g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null?'disabled':'')+'>Draw card</button><button id="resetWhot" class="secondary">Restart WHOT</button></div><p class="notice">Rules used: 1 Hold On · 2 Pick Two · 5 WHOT (choose a shape) · 8 Suspension · 14 General Market. Rules vary by household.</p></div>';
 return h;
}
function renderLudo(g){
 const p=me(),dice=g.dice,legal=ludoLegalTokens(g,p);
 let h='<div class="ludo-wrap"><div class="ludo-head"><div><div class="muted">DICE</div><div class="ludo-dice">'+(dice===null?"⚄":dice)+'</div></div><div class="ludo-message">'+esc(g.message)+'<p class="muted">Turn: '+myName(g.turn)+'</p></div><button id="rollDice" '+(g.turn!==p||dice!==null||g.winner||room.players.length<2?'disabled':'')+'>Roll dice</button></div>';
 h+=renderLudoBoard(g);
 h+='<div class="ludo-player red-player"><h3>🔴 '+myName(0)+' <span class="muted">· '+g.tokens["0"].filter(v=>v===57).length+'/4 home</span></h3><div class="token-tray">'+g.tokens["0"].map((v,i)=>'<button class="token-pick red-token" data-token-player="0" data-token="'+i+'" '+(p!==0||g.dice===null||!ludoCanMove(v,g.dice)||g.winner||room.players.length<2?'disabled':'')+'>● '+(i+1)+' <small>'+ludoPosLabel(v)+'</small></button>').join("")+'</div></div>';
 h+='<div class="ludo-player blue-player"><h3>🔵 '+myName(1)+' <span class="muted">· '+g.tokens["1"].filter(v=>v===57).length+'/4 home</span></h3><div class="token-tray">'+g.tokens["1"].map((v,i)=>'<button class="token-pick blue-token" data-token-player="1" data-token="'+i+'" '+(p!==1||g.dice===null||!ludoCanMove(v,g.dice)||g.winner||room.players.length<2?'disabled':'')+'>● '+(i+1)+' <small>'+ludoPosLabel(v)+'</small></button>').join("")+'</div></div>';
 h+='<div class="actions center-actions"><button id="resetLudo" class="secondary">Restart Ludo</button></div><p class="notice">Two-player Ludo: four tokens each, six to leave the yard, captures send tokens back, safe squares protect tokens, and you need an exact roll to reach Home. A 6, capture, or reaching Home earns another turn.</p></div>';
 return h;
}
function ludoPosLabel(v){if(v===-1)return "Yard";if(v===57)return "Home";if(v>=52)return "Home lane "+(v-51);return "Track "+(v+1);}
function renderLudoBoard(g){
 const pathMap={};LUDO_PATH.forEach((rc,i)=>pathMap[rc[0]+","+rc[1]]=i);
 const homeMap={};for(let i=0;i<5;i++){homeMap["7,"+(i+1)]={p:0,step:i};homeMap["7,"+(13-i)]={p:1,step:i};}
 let out='<div class="ludo-board" role="img" aria-label="Ludo board with two players and four tokens each">';
 for(let r=0;r<15;r++)for(let c=0;c<15;c++){
  const key=r+","+c,trackIndex=pathMap[key],lane=homeMap[key];let cls="ludo-cell",content="";
  if(trackIndex!==undefined){
   cls+=" track-cell";if(LUDO_SAFE.has(trackIndex))cls+=" safe-cell";
   const pieces=[];
   for(let p=0;p<2;p++)g.tokens[String(p)].forEach((pos,i)=>{if(pos>=0&&pos<=51&&ludoGlobal(p,pos)===trackIndex)pieces.push('<span class="board-token '+(p===0?"red-token-bg":"blue-token-bg")+'">'+(i+1)+'</span>');});
   content=(LUDO_SAFE.has(trackIndex)?"★":"")+pieces.join("");
   if(trackIndex===LUDO_START[0])cls+=" red-start";if(trackIndex===LUDO_START[1])cls+=" blue-start";
  }else if(lane){
   cls+=" home-lane "+(lane.p===0?"red-lane":"blue-lane");
   const pos=52+lane.step;const pieces=[];g.tokens[String(lane.p)].forEach((v,i)=>{if(v===pos)pieces.push('<span class="board-token '+(lane.p===0?"red-token-bg":"blue-token-bg")+'">'+(i+1)+'</span>');});
   content=pieces.join("")||(lane.step===4?"◆":"");
  }else if(r<=5&&c<=5){cls+=" base-red";if(r===2&&c===2)content="YARD";}
  else if(r<=5&&c>=9){cls+=" base-blue";if(r===2&&c===12)content="YARD";}
  else if(r>=9&&c<=5){cls+=" base-blue";}
  else if(r>=9&&c>=9){cls+=" base-red";if(r===12&&c===12)content="YARD";}
  if(r===7&&c===6) {cls+=" center-red";content="";}if(r===7&&c===7){cls+=" center-home";content="♥";}if(r===7&&c===8){cls+=" center-blue";content="";}
  out+='<div class="'+cls+'">'+content+'</div>';
 }
 return out+'</div>';
}
function renderGame(){
 if(!room)return;const s=room.state,waiting=room.players.length<2?"Waiting for your partner to join…":"Playing with "+(room.players[1-me()]||{}).name;
 let h='<div class="eyebrow">NOW PLAYING</div><h2>'+({whot:"🃏 WHOT!",ludo:"🎲 Ludo",ttt:"⭕ Tic-Tac-Toe",quiz:"💗 Couples Quiz",truth:"🔥 Truth or Dare"}[activeGame])+'</h2><p class="muted">'+esc(waiting)+'</p>';
 if(activeGame==="ttt"){
  const g=s.ttt;h+='<div class="center"><p>'+(g.winner?"Winner: "+esc(g.winner):g.moves===9?"It is a draw!":"Turn: "+g.turn)+'</p><div class="board">'+g.cells.map((v,i)=>'<button class="cell" data-cell="'+i+'" '+(v||g.winner||room.players.length<2?'disabled':'')+'>'+esc(v)+'</button>').join("")+'</div><button id="resetTtt" class="secondary">New round</button></div>';
 }
 if(activeGame==="whot")h+=renderWhot(s.whot);
 if(activeGame==="ludo")h+=renderLudo(s.ludo);
 if(activeGame==="quiz"){
  const g=s.quiz,q=quiz[g.index%quiz.length];h+='<div class="quizcard"><div class="muted">Question '+(g.index%quiz.length+1)+' of '+quiz.length+'</div><h3>'+esc(q[0])+'</h3><p class="muted">Choose what you think your partner would answer, then talk about it.</p><div class="answers">'+q[1].map((a,i)=>'<button data-answer="'+i+'" '+(g.answers[me()]===i?'style="outline:2px solid #ff579f"':'')+' '+(room.players.length<2?'disabled':'')+'>'+esc(a)+'</button>').join("")+'</div><p class="muted">'+myName(0)+': '+g.scores[0]+' points · '+myName(1)+': '+g.scores[1]+' points</p><button id="nextQuiz" class="pink" '+((g.answers[0]===undefined||g.answers[1]===undefined||room.players.length<2)?'disabled':'')+'>Next question →</button> <button id="resetQuiz" class="secondary">Reset</button></div>';
 }
 if(activeGame==="truth"){
  const turnName=myName(s.truth.turn);h+='<div class="quizcard center"><div class="muted">'+turnName+'’s turn</div><h3>'+esc(s.truth.prompt)+'</h3><button id="truthBtn" class="pink" '+(s.truth.turn!==me()||room.players.length<2?'disabled':'')+'>💗 Truth</button> <button id="dareBtn" class="gold" '+(s.truth.turn!==me()||room.players.length<2?'disabled':'')+'>🔥 Dare</button><p><button id="nextTruth" class="secondary" '+(s.truth.turn!==me()||room.players.length<2?'disabled':'')+'>Next turn ↻</button></p><p class="notice">Skip anything uncomfortable. Kindness first ❤️</p></div>';
 }
 $("gameArea").innerHTML=h;wireGame();
}
function wireGame(){
 document.querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ttt,i=+b.dataset.cell,mark=me()===0?"X":"O",lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];if(g.cells[i]||g.winner||g.turn!==mark||room.players.length<2)return;g.cells[i]=mark;g.moves++;if(lines.some(l=>l.every(n=>g.cells[n]===mark)))g.winner=room.players[me()].name;else g.turn=mark==="X"?"O":"X";}));
 const rt=$("resetTtt");if(rt)rt.onclick=()=>change(s=>{s.ttt={cells:Array(9).fill(""),turn:"X",winner:"",moves:0};});
 document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),i=+b.dataset.card,c=(g.hands[p]||[])[i];if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2||!c)return;if(c.s===5){g.pendingShapeIndex=i;g.pendingShapePlayer=p;g.message="Choose the shape to call.";return;}playWhotCard(g,p,i);}));
 document.querySelectorAll("[data-shape]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),shape=+b.dataset.shape;if(g.pendingShapePlayer!==p||g.pendingShapeIndex===null)return;playWhotCard(g,p,g.pendingShapeIndex,shape);}));
 const dr=$("drawCard");if(dr)dr.onclick=()=>change(s=>{const g=s.whot,p=me();if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2)return;const c=drawWhotCard(g);if(!c){g.message="No cards remain to draw. Restart the game.";return;}g.hands[p].push(c);g.turn=1-p;g.message=room.players[p].name+" drew a card. Turn passes."});
 const rw=$("resetWhot");if(rw)rw.onclick=()=>change(s=>{s.whot=newWhot();});
 const roll=$("rollDice");if(roll)roll.onclick=()=>change(s=>{const g=s.ludo,p=me();if(g.turn!==p||g.dice!==null||g.winner||room.players.length<2)return;g.dice=1+Math.floor(Math.random()*6);const legal=ludoLegalTokens(g,p);if(!legal.length){g.message=room.players[p].name+" rolled "+g.dice+" but has no legal move. Turn passes.";g.turn=1-p;g.dice=null;}else g.message=room.players[p].name+" rolled "+g.dice+". Choose a highlighted token below.";});
 document.querySelectorAll("[data-token-player]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ludo,p=me(),tokenPlayer=+b.dataset.tokenPlayer,token=+b.dataset.token;if(tokenPlayer!==p||g.turn!==p||g.winner||room.players.length<2)return;moveLudo(g,p,token);}));
 const rl=$("resetLudo");if(rl)rl.onclick=()=>change(s=>{s.ludo=newLudo();});
 document.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>change(s=>{if(room.players.length<2)return;if(Array.isArray(s.quiz.answers))s.quiz.answers={};s.quiz.answers[me()]=+b.dataset.answer;}));
 const nq=$("nextQuiz");if(nq)nq.onclick=()=>change(s=>{const g=s.quiz;if(g.answers[0]===undefined||g.answers[1]===undefined)return;if(g.answers[0]===g.answers[1]){g.scores[0]++;g.scores[1]++;}g.index=(g.index+1)%quiz.length;g.answers={};});
 const rq=$("resetQuiz");if(rq)rq.onclick=()=>change(s=>{s.quiz={index:0,answers:{},scores:[0,0]};});
 const tb=$("truthBtn");if(tb)tb.onclick=()=>change(s=>{if(s.truth.turn!==me())return;s.truth.prompt=truths[Math.floor(Math.random()*truths.length)];});
 const dbtn=$("dareBtn");if(dbtn)dbtn.onclick=()=>change(s=>{if(s.truth.turn!==me())return;s.truth.prompt=dares[Math.floor(Math.random()*dares.length)];});
 const nt=$("nextTruth");if(nt)nt.onclick=()=>change(s=>{if(s.truth.turn!==me())return;s.truth.turn=1-s.truth.turn;s.truth.prompt="Choose Truth or Dare to begin.";});
}
$("createRoom").onclick=createRoom;$("joinRoom").onclick=joinRoom;
document.querySelectorAll(".game").forEach(b=>b.onclick=async()=>{if(!roomId||!db)return;try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");tx.update(ref,{activeGame:b.dataset.game});});}catch(e){say("Could not switch game: "+e.message);}});
$("copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(roomId);say("Room code copied: "+roomId);}catch(e){say("Share this room code: "+roomId);}};
$("leaveRoom").onclick=()=>{if(unsubscribe)unsubscribe();unsubscribe=null;roomId=null;room=null;playerId=null;$("roomSection").classList.add("hidden");$("connectionStatus").innerHTML="Firebase ready<br>Not in a room yet";window.scrollTo({top:0,behavior:"smooth"});};
init();