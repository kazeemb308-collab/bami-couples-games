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
const LUDO_START = [0,26];
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
function newWhot(){
 return {deck:[],discard:[],hands:{"0":[],"1":[]},top:null,calledShape:null,turn:0,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,pendingPenalty:null,dealt:false,readyPlayers:[],message:"Both players tap the deck to deal your cards."};
}
function dealWhot(g){
 const d=makeWhotDeck(),hands={"0":d.slice(0,6),"1":d.slice(6,12)};
 let rest=d.slice(12),topIndex=rest.findIndex(c=>c.s!==5);if(topIndex<0)topIndex=0;
 const top=rest.splice(topIndex,1)[0],turn=Math.floor(Math.random()*2);
 Object.assign(g,{deck:rest,discard:[],hands,top,calledShape:null,turn,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,pendingPenalty:null,dealt:true,readyPlayers:[],message:"Cards dealt randomly! "+room.players[turn].name+" starts."});
}
function newLudo(){return {tokens:{"0":[-1,-1,-1,-1],"1":[-1,-1,-1,-1]},turn:0,dice:null,sixStreak:0,winner:"",message:"Roll a 6 to bring a token out. Capture opponents, use safe squares, and reach Home with an exact roll."};}
function initialState(){return {scores:[0,0],ttt:{cells:Array(9).fill(""),turn:"X",winner:"",moves:0},whot:newWhot(),ludo:newLudo(),quiz:{index:0,answers:{},scores:[0,0]},truth:{turn:0,prompt:"Choose Truth or Dare to begin."}};}
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
 try{const saved=readSession();playerId=saved?.roomId===c&&saved?.playerId?saved.playerId:crypto.randomUUID();await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",c),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found. Check the code.");const data=snap.data();if(data.players.some(p=>p.id===playerId))return;if(data.players.length>=2)throw Error("This room already has two players.");if(data.players.some(p=>p.name.toLowerCase()===playerName().toLowerCase()))throw Error("Choose a different player name.");tx.update(ref,{players:data.players.concat([{id:playerId,name:playerName(),joinedAt:Date.now()}])});});saveSession({roomId:c,playerId,name:playerName(),autoResume:true});enterRoom(c);}
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
 try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const data=snap.data(),oldState=structuredClone(data.state),state=structuredClone(data.state);fn(state,data);state.scores=Array.isArray(state.scores)?state.scores:[0,0];for(const key of ["whot","ludo","ttt"]){const oldWinner=oldState[key]?.winner,newWinner=state[key]?.winner;if(!oldWinner&&newWinner){const winnerIndex=data.players.findIndex(p=>p.name===newWinner);if(winnerIndex>=0)state.scores[winnerIndex]=(state.scores[winnerIndex]||0)+1;}}tx.update(ref,{state});});}
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
 else if(c.n===14&&c.s!==5){const drawn=drawWhotCard(g);if(drawn)g.hands[opponent].push(drawn);g.turn=opponent;g.message="General Market! "+room.players[opponent].name+" picks one card.";}
 else{g.turn=opponent;g.message=room.players[p].name+" played "+(c.s===5?"WHOT 20 and called "+shapeNames[chosenShape]:cardLabel(c)+" "+shapeNames[c.s])+".";}
 return true;
}
function ludoCanMove(pos,dice){if(dice===null||dice===undefined)return false;if(pos===-1)return dice===6;if(pos===57)return false;return pos+dice<=57;}
function ludoGlobal(p,pos){return (LUDO_START[p]+pos)%52;}
function ludoCanLand(g,p,pos,dice){
 if(!ludoCanMove(pos,dice))return false;
 const next=pos===-1?0:pos+dice;
 if(next<0||next>51)return true;
 const landing=ludoGlobal(p,next),opponents=g.tokens[String(1-p)]||[];
 const stacked=opponents.filter(v=>v>=0&&v<=51&&ludoGlobal(1-p,v)===landing).length;
 return LUDO_SAFE.has(landing)||stacked<2;
}
function ludoLegalTokens(g,p){return (g.tokens[String(p)]||[]).map((pos,i)=>ludoCanLand(g,p,pos,g.dice)?i:-1).filter(i=>i>=0);}
function moveLudo(g,p,tokenIndex){
 const own=g.tokens[String(p)],pos=own[tokenIndex],dice=g.dice;if(g.turn!==p||!ludoCanLand(g,p,pos,dice))return;
 const before=pos;own[tokenIndex]=pos===-1?0:pos+dice;let captured=false,blocked=false;
 if(own[tokenIndex]>=0&&own[tokenIndex]<=51){
  const landing=ludoGlobal(p,own[tokenIndex]),opp=g.tokens[String(1-p)];
  const enemies=opp.map((v,i)=>({v,i})).filter(x=>x.v>=0&&x.v<=51&&ludoGlobal(1-p,x.v)===landing);
  if(!LUDO_SAFE.has(landing)&&enemies.length===1){opp[enemies[0].i]=-1;captured=true;}
  else if(!LUDO_SAFE.has(landing)&&enemies.length>=2){own[tokenIndex]=before;g.message="That square is blocked by two opponent tokens. Choose another token.";return;}
 }
 const finished=own[tokenIndex]===57;
 if(own.every(v=>v===57)){g.winner=room.players[p].name;g.message=g.winner+" wins Ludo! 🏆";}
 else if(finished){g.message=room.players[p].name+" brought token "+(tokenIndex+1)+" Home!";}
 else if(captured){g.message=room.players[p].name+" captured an opponent token! Back to the yard!";}
 else if(before===-1){g.message=room.players[p].name+" brought token "+(tokenIndex+1)+" out of the yard." ;}
 else{g.message=room.players[p].name+" moved token "+(tokenIndex+1)+" by "+dice+".";}
 const extra=dice===6||captured||finished;g.dice=null;if(dice!==6)g.sixStreak=0;if(!g.winner&&!extra)g.turn=1-p;
}
function renderWhot(g){
 const p=me(),hand=g.hands[p]||[],opponent=1-p,opponentHand=g.hands[opponent]||[],top=g.top,dealt=!!top;
 const playable=dealt&&hand.some(c=>whotCanPlay(c,g)),ready=(g.readyPlayers||[]).includes(p);
 let h='<div class="naija-whot-table">';
  h+='<div class="whot-opponent"><div class="opponent-hand">'+(dealt?opponentHand.map(()=>'<span class="card-back"><i>W</i></span>').join(''):'')+'</div></div>';
  h+='<div class="whot-turn-strip '+(g.turn===p?'your-turn':'not-your-turn')+'">'+(g.winner?'GAME OVER':g.turn===p?'YOUR TURN':'NOT YOUR TURN')+(g.pendingShapePlayer!==null?' · CHOOSING SHAPE':'')+'</div>';
  h+='<div class="whot-arena"><div class="whot-pile"><button id="drawPile" class="playingcard card-back market-card" aria-label="Draw card" '+(!dealt||g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null?'disabled':'')+'><i>W</i></button><small>MARKET</small></div><div class="whot-pile discard-pile">'+(top?'<div class="playingcard top-playing-card '+(top.s===5?"whot-card":"suit-"+top.s)+'">'+whotFace(top,top.s===5?(g.calledShape===null?"CALL A SHAPE":shapeNames[g.calledShape]):shapeNames[top.s])+'</div>':'<button id="dealPile" class="playingcard market-card deal-pile" aria-label="Tap cards to deal"><i>W</i></button>')+'<small>PLAYED CARD</small></div></div>';
  if(dealt&&g.calledShape!==null)h+='<div class="whot-called-shape">SHAPE TO MATCH: <b>'+shapeGlyphs[g.calledShape]+' '+shapeNames[g.calledShape].toUpperCase()+'</b></div>';
 if(!dealt){
   h+='<div class="whot-deal-panel"><button id="dealWhot" class="gold deal-button" '+(room.players.length<2||ready?'disabled':'')+'>TAP TO PLAY</button></div>';
 }else{
   h+='';
   h+='';
   if(g.pendingShapePlayer===p&&g.pendingShapeIndex!==null)h+='<div class="shape-picker"><div class="shape-options">'+shapeNames.map((n,i)=>'<button class="shape-choice" data-shape="'+i+'" aria-label="'+n+'"><span>'+shapeGlyphs[i]+'</span></button>').join("")+'</div></div>';
   else if(g.pendingShapePlayer!==null)h+='';
   h+='<div class="cards whot-hand">'+hand.map((c,i)=>'<button class="playingcard '+(c.s===5?"whot-card":"suit-"+c.s)+'" data-card="'+i+'" aria-label="'+esc(cardLabel(c)+" "+(c.s===5?"WHOT":shapeNames[c.s]))+'" '+(g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null?'disabled':'')+'>'+whotFace(c,c.s===5?"WHOT":shapeNames[c.s])+'</button>').join("")+'</div>';
  h+='<div class="whot-status-message">'+esc(g.message||"")+'</div>';
 }
 h+='</div>';return h;
}
function ludoDieFace(n){return n===null||n===undefined?"🎲":(["","⚀","⚁","⚂","⚃","⚄","⚅"][n]||"🎲");}
function renderLudo(g){
 const p=me(),dice=g.dice;
 const tokenButtons=player=>g.tokens[String(player)].map((v,i)=>'<button class="token-pick '+(player===0?'red-token':'blue-token')+'" data-token-player="'+player+'" data-token="'+i+'" '+(p!==player||g.dice===null||!ludoCanLand(g,player,v,g.dice)||g.winner||room.players.length<2?'disabled':'')+'><span class="token-mini">● '+(i+1)+'</span><small>'+ludoPosLabel(v)+'</small></button>').join("");
 let h='<div class="ludo-wrap"><div class="ludo-head"><button id="rollDice" class="dice-card dice-roll-button" aria-label="Tap to roll the dice" '+(g.turn!==p||dice!==null||g.winner||room.players.length<2?'disabled':'')+'><div class="muted">TAP TO ROLL</div><div class="ludo-dice '+(dice!==null?'has-result':'')+'">'+ludoDieFace(dice===null?(g.lastRoll??null):dice)+'</div><small class="dice-tap-label">'+(dice===null?(g.lastRoll?'LAST: '+g.lastRoll:'ROLL DICE'):'RESULT: '+dice)+'</small></button><div class="ludo-message"><b>'+esc(g.message)+'</b><p class="muted">Turn: '+myName(g.turn)+(g.sixStreak?' · Six streak: '+g.sixStreak+'/3':'')+'</p></div><div class="ludo-match-badge">'+(room.players.length<2?'WAITING FOR PLAYER':'RED 🔴 VS BLUE 🔵')+'</div></div>';
 h+='<div class="ludo-board-frame"><div class="ludo-board-title"><b>NAIJA LUDO</b><span>RED vs BLUE</span></div>'+renderLudoBoard(g)+'</div>';
 h+='<div class="ludo-player red-player"><h3><span class="player-colour-dot red-dot"></span>'+myName(0)+' <span class="muted">· '+g.tokens["0"].filter(v=>v===57).length+'/4 HOME</span></h3><div class="token-tray">'+tokenButtons(0)+'</div></div>';
 h+='<div class="ludo-player blue-player"><h3><span class="player-colour-dot blue-dot"></span>'+myName(1)+' <span class="muted">· '+g.tokens["1"].filter(v=>v===57).length+'/4 HOME</span></h3><div class="token-tray">'+tokenButtons(1)+'</div></div>';
 h+='<div class="ludo-rules"><b>HOW TO WIN</b><span>Roll a 6 to leave the yard · Capture single enemy tokens · Two tokens block a square · Safe stars protect tokens · Exact roll to finish · Three sixes in a row loses your turn</span></div></div>';
 return h;
}
function ludoPosLabel(v){if(v===-1)return "Yard";if(v===57)return "Home";if(v>=52)return "Home lane "+(v-51);return "Track "+(v+1);}
function renderLudoBoard(g){
 const pathMap={};LUDO_PATH.forEach((rc,i)=>pathMap[rc[0]+","+rc[1]]=i);
 const homeMap={};
 for(let i=0;i<5;i++){homeMap["7,"+(i+1)]={p:0,step:i};homeMap["7,"+(13-i)]={p:1,step:i};homeMap[(i+1)+",7"]={p:2,step:i};homeMap[(13-i)+",7"]={p:3,step:i};}
 const yardMap={},yardDefs=[{p:0,cells:[[2,2],[2,4],[4,2],[4,4]]},{p:1,cells:[[10,10],[10,12],[12,10],[12,12]]}];
 yardDefs.forEach(d=>d.cells.forEach((rc,i)=>yardMap[rc.join(",")]={p:d.p,i}));
 let out='<div class="ludo-board" role="group" aria-label="Four-colour Nigerian Ludo board">';
 for(let r=0;r<15;r++)for(let c=0;c<15;c++){
  const key=r+","+c,trackIndex=pathMap[key],lane=homeMap[key];let cls="ludo-cell",content="";
  if(trackIndex!==undefined){
   cls+=" track-cell";if(LUDO_SAFE.has(trackIndex))cls+=" safe-cell";
   const pieces=[];for(let p=0;p<2;p++)g.tokens[String(p)].forEach((pos,i)=>{if(pos>=0&&pos<=51&&ludoGlobal(p,pos)===trackIndex)pieces.push('<button class="board-token board-token-button '+(p===0?"red-token-bg":"blue-token-bg")+'" data-token-player="'+p+'" data-token="'+i+'" aria-label="Move '+(p===0?"red":"blue")+' token '+(i+1)+'" '+(me()!==p||g.dice===null||!ludoCanLand(g,p,pos,g.dice)||g.winner||room.players.length<2?'disabled':'')+'>'+(i+1)+'</button>');});
   content=(LUDO_SAFE.has(trackIndex)?'<span class="safe-star">★</span>':"")+pieces.join("");
   if(trackIndex===LUDO_START[0])cls+=" red-start";if(trackIndex===LUDO_START[1])cls+=" blue-start";
  }else if(lane){
   cls+=" home-lane "+["red-lane","blue-lane","green-lane","yellow-lane"][lane.p];
   if(lane.p<2){const pos=52+lane.step;const pieces=[];g.tokens[String(lane.p)].forEach((v,i)=>{if(v===pos)pieces.push('<button class="board-token board-token-button '+(lane.p===0?"red-token-bg":"blue-token-bg")+'" data-token-player="'+lane.p+'" data-token="'+i+'" aria-label="Move token '+(i+1)+' home" '+(me()!==lane.p||g.dice===null||!ludoCanLand(g,lane.p,v,g.dice)||g.winner||room.players.length<2?'disabled':'')+'>'+(i+1)+'</button>');});content=pieces.join("")||(lane.step===4?"◆":"");}
   else content=lane.step===4?"◆":"";
  }else if(r<=5&&c<=5){cls+=" base-red";}
  else if(r<=5&&c>=9){cls+=" base-green";}
  else if(r>=9&&c<=5){cls+=" base-yellow";}
  else if(r>=9&&c>=9){cls+=" base-blue";}
  if(r>=6&&r<=8&&c>=6&&c<=8){cls+=" center-home";if(r===7&&c===7)content='<span class="center-heart">♥</span>';else if(r===6&&c===6)cls+=" center-red";else if(r===6&&c===8)cls+=" center-green";else if(r===8&&c===6)cls+=" center-yellow";else if(r===8&&c===8)cls+=" center-blue";}
  const yard=yardMap[key];
  if(yard){const p=yard.p,tokenIndex=yard.i,pos=g.tokens[String(p)][tokenIndex];cls+=" yard-cell "+(p===0?"yard-red":"yard-blue");content=pos===-1?'<button class="yard-token '+(p===0?"red-token-bg":"blue-token-bg")+'" data-token-player="'+p+'" data-token="'+tokenIndex+'" aria-label="Move token '+(tokenIndex+1)+' out of yard" '+(me()!==p||g.dice!==6||g.winner||room.players.length<2?'disabled':'')+'>'+(tokenIndex+1)+'</button>':"";}
  if((r<=5&&c<=5)||(r<=5&&c>=9)||(r>=9&&c<=5)||(r>=9&&c>=9)){const quad=(r<=5?(c<=5?"red":"green"):(c<=5?"yellow":"blue"));cls+=" base-"+quad;const inHome=(r>=1&&r<=4&&(c>=1&&c<=4||c>=10&&c<=13))||(r>=10&&r<=13&&(c>=1&&c<=4||c>=10&&c<=13));if(inHome)cls+=" base-home";if((r===2||r===4)&&(c===2||c===4)||(r===2||r===4)&&(c===10||c===12)||(r===10||r===12)&&(c===2||c===4)||(r===10||r===12)&&(c===10||c===12))cls+=" base-home-dot";}
  out+='<div class="'+cls+'">'+content+'</div>';
 }
 return out+'</div>';
}
function finishedGameInfo(s){
 const key=activeGame==="whot"?"whot":activeGame==="ludo"?"ludo":activeGame==="ttt"?"ttt":null;
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
 s.rematchVotes=[];
}
function renderGame(){
 if(!room)return;const s=room.state,waiting=room.players.length<2?"Waiting for your partner to join…":"Playing with "+(room.players[1-me()]||{}).name;
 let h=(activeGame==="whot"||activeGame==="ludo")?'<div class="whot-screen-header"><button id="backToGames" class="whot-back">← Games</button><div class="whot-brandline"><span>'+(activeGame==="whot"?"🃏":"🎲")+'</span><span><b>'+(activeGame==="whot"?"NAIJA WHOT":"NAIJA LUDO")+'</b><small>BAMI ♥ OLUWATOSIN</small></span></div><div class="whot-online">'+(room.players.length<2?'WAITING…':'● 2 PLAYERS')+'</div></div>':'<div class="actions"><button id="backToGames" class="secondary">← All games</button></div><div class="eyebrow">NOW PLAYING</div><h2>'+({whot:"🃏 WHOT!",ludo:"🎲 Ludo",ttt:"⭕ Tic-Tac-Toe",quiz:"💗 Couples Quiz",truth:"🔥 Truth or Dare"}[activeGame])+'</h2><p class="muted">'+esc(waiting)+'</p>';
 const scores=Array.isArray(s.scores)?s.scores:[0,0];h+='<div class="overall-scoreboard"><span>🏆 MATCH SCORE</span><b>'+myName(0)+' '+(scores[0]||0)+'</b><i>—</i><b>'+myName(1)+' '+(scores[1]||0)+'</b></div>';
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
 const back=$("backToGames");if(back)back.onclick=()=>{gameOpen=false;const picker=document.querySelector(".games"),area=$("gameArea");picker.classList.remove("hidden");area.classList.add("hidden");picker.scrollIntoView({behavior:"smooth",block:"start"});};
 const rt=$("resetTtt");if(rt)rt.onclick=()=>change(s=>{s.ttt={cells:Array(9).fill(""),turn:"X",winner:"",moves:0};});
 const dealWhotBtn=$("dealWhot"),dealPile=$("dealPile");const tapToDeal=()=>change(s=>{const g=s.whot;if(g.dealt||g.top||room.players.length<2)return;const ready=Array.isArray(g.readyPlayers)?g.readyPlayers:[];if(ready.includes(me()))return;g.readyPlayers=ready.concat(me());if(g.readyPlayers.length>=2)dealWhot(g);else g.message=room.players[me()].name+" is ready. Waiting for the other player to tap the deck.";});if(dealWhotBtn)dealWhotBtn.onclick=tapToDeal;if(dealPile)dealPile.onclick=tapToDeal;
  document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),i=+b.dataset.card,c=(g.hands[p]||[])[i];if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2||!c||!whotCanPlay(c,g))return;if(c.s===5){g.pendingShapeIndex=i;g.pendingShapePlayer=p;g.message="Choose the shape to call.";return;}playWhotCard(g,p,i);}));
 document.querySelectorAll("[data-shape]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),shape=+b.dataset.shape;if(g.pendingShapePlayer!==p||g.pendingShapeIndex===null)return;playWhotCard(g,p,g.pendingShapeIndex,shape);}));
 const drawFromMarket=()=>change(s=>{const g=s.whot,p=me();if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2)return;if(g.pendingPenalty){const amount=g.pendingPenalty.amount;for(let n=0;n<amount;n++){const c=drawWhotCard(g);if(c)g.hands[p].push(c);}g.pendingPenalty=null;g.turn=1-p;g.message=room.players[p].name+" picked "+amount+" card(s) from the Market. Turn passes.";}else{const c=drawWhotCard(g);if(!c){g.message="No cards remain to draw. Restart the game.";return;}g.hands[p].push(c);g.turn=1-p;g.message=room.players[p].name+" picked a card from the Market. Turn passes.";}});const dr=$("drawCard");if(dr)dr.onclick=drawFromMarket;const pile=$("drawPile");if(pile)pile.onclick=drawFromMarket;
 const rw=$("resetWhot");if(rw)rw.onclick=()=>change(s=>{s.whot=newWhot();});
 const roll=$("rollDice");if(roll)roll.onclick=()=>{if(roll.disabled||roll.dataset.rolling==="1")return;roll.dataset.rolling="1";roll.disabled=true;roll.classList.add("is-rolling");roll.querySelector(".ludo-dice").textContent="🎲";setTimeout(()=>{change(s=>{const g=s.ludo,p=me();if(g.turn!==p||g.dice!==null||g.winner||room.players.length<2)return;const rolled=1+Math.floor(Math.random()*6);g.lastRoll=rolled;g.dice=rolled;if(rolled===6){g.sixStreak=(g.sixStreak||0)+1;if(g.sixStreak>=3){g.message=room.players[p].name+" rolled three sixes in a row! Turn forfeited.";g.turn=1-p;g.dice=null;g.sixStreak=0;return;}}else g.sixStreak=0;const legal=ludoLegalTokens(g,p);if(!legal.length){g.message=room.players[p].name+" rolled "+rolled+" but has no legal move. Turn passes.";g.turn=1-p;g.dice=null;g.sixStreak=0;}else g.message=room.players[p].name+" rolled "+rolled+". Tap one of your movable tokens on the board or below.";}).finally(()=>{const current=$("rollDice");if(current){current.dataset.rolling="";current.classList.remove("is-rolling");}});},720);};
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
document.querySelectorAll(".game").forEach(b=>b.onclick=async()=>{if(!roomId||!db)return say("Create or join a room before choosing a game.");try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");tx.update(ref,{activeGame:b.dataset.game,gameLaunchId:Date.now()+"-"+Math.random().toString(36).slice(2)});});activeGame=b.dataset.game;gameOpen=true;document.querySelector(".games").classList.add("hidden");$("gameArea").classList.remove("hidden");renderGame();$("gameArea").scrollIntoView({behavior:"smooth",block:"start"});}catch(e){say("Could not switch game: "+e.message);}});
$("copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(roomId);say("Room code copied: "+roomId);}catch(e){say("Share this room code: "+roomId);}};
$("leaveRoom").onclick=()=>{saveSession({autoResume:false});if(unsubscribe)unsubscribe();unsubscribe=null;roomId=null;room=null;playerId=null;gameOpen=false;gameLaunchId=null;roomSnapshotInitialized=false;$("gameArea").classList.add("hidden");document.querySelector(".games").classList.remove("hidden");$("roomSection").classList.add("hidden");$("setupPanel").classList.remove("hidden");$("connectionStatus").innerHTML="Firebase ready<br>Not in a room yet";window.scrollTo({top:0,behavior:"smooth"});};
init();