let initializeApp, getAuth, signInAnonymously, getFirestore, doc, setDoc, onSnapshot, runTransaction, serverTimestamp, firebaseConfig;

const $ = id => document.getElementById(id);
let db = null, auth = null, roomId = null, playerId = null, room = null, unsubscribe = null, activeGame = "whot";
const shapes = ["○","△","□","☆","✕"];
const quiz = [
 ["What is your partner's favourite way to receive love?",["Words","Quality time","Gifts","Acts of service"]],
 ["What would make the perfect date?",["Cosy movie night","Food adventure","A day outdoors","A surprise plan"]],
 ["Who says 'I miss you' first?",["Bami","Oluwatosin","Both equally","Depends on the day"]],
 ["What matters most during an argument?",["Listening","An apology","A little space","A hug and reassurance"]],
 ["What would you like to do together next?",["Travel","Cook together","Try a new game","Make a memory album"]]
];
const truths = ["What was your first impression of your partner?","What little thing they do makes you smile?","What date do you want to go on together?","What is something you appreciate but don't say enough?","What helps you feel loved on a hard day?"];
const dares = ["Send a 10-second voice note saying something sweet.","Give your partner a cute new nickname.","Describe your partner using only three emojis.","Give your partner a sincere compliment.","Make up a two-line love song."];
function say(t){const e=$("globalMessage");e.textContent=t;e.classList.remove("hidden");}
function playerName(){return $("playerName").value.trim().slice(0,24)||"Player";}
function roomCode(){return Math.random().toString(36).slice(2,8).toUpperCase();}
function configOK(){return firebaseConfig.apiKey&&!firebaseConfig.apiKey.includes("PASTE_")&&firebaseConfig.projectId&&!firebaseConfig.projectId.includes("PASTE_")&&firebaseConfig.appId&&!firebaseConfig.appId.includes("PASTE_");}
function deck(){const a=[];for(let s=0;s<5;s++)for(let n=1;n<=14;n++)a.push({s,n});for(let n=1;n<=5;n++)a.push({s:5,n});for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function newWhot(){const d=deck();return {deck:d.slice(10),hands:{0:d.slice(0,5),1:d.slice(5,10)},top:d[10],turn:0,winner:"",message:"Match the shape or number."};}
function initialState(){return {ttt:{cells:Array(9).fill(""),turn:"X",winner:"",moves:0},whot:newWhot(),ludo:{positions:[0,0],turn:0,dice:null,winner:"",message:"Roll the dice and race to 20."},quiz:{index:0,answers:[],scores:[0,0]},truth:{turn:0,prompt:"Choose Truth or Dare to begin."}};}
function me(){return room?room.players.findIndex(p=>p.id===playerId):-1;}
async function init(){
  $("connectionStatus").innerHTML="Loading Firebase modules…<br>Please wait";
  $("setupMessage").textContent="Loading the connection to Firebase…";
  try {
    const [appModule, authModule, firestoreModule, configModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
      import("./firebase-config.js")
    ]);
    initializeApp = appModule.initializeApp;
    getAuth = authModule.getAuth;
    signInAnonymously = authModule.signInAnonymously;
    getFirestore = firestoreModule.getFirestore;
    doc = firestoreModule.doc;
    setDoc = firestoreModule.setDoc;
    onSnapshot = firestoreModule.onSnapshot;
    runTransaction = firestoreModule.runTransaction;
    serverTimestamp = firestoreModule.serverTimestamp;
    firebaseConfig = configModule.firebaseConfig;
    if(!configOK()){
      $("connectionStatus").innerHTML="Setup needed<br>Firebase not connected";
      $("setupMessage").textContent="Firebase settings are missing or incomplete in firebase-config.js.";
      return;
    }
    const app=initializeApp(firebaseConfig);
    auth=getAuth(app);
    db=getFirestore(app);
    await signInAnonymously(auth);
    $("connectionStatus").innerHTML="Firebase ready<br>Signed in anonymously";
    $("setupMessage").textContent="Firebase connected. Create a room and share its code with your partner.";
  } catch(e) {
    const message = e && e.message ? e.message : String(e);
    say("Firebase startup error: " + message);
    $("connectionStatus").innerHTML="Connection error<br>See message below";
    $("setupMessage").textContent="Could not start Firebase: " + message;
  }
}
async function createRoom(){if(!db||!auth?.currentUser)return say("Firebase is still connecting. Please wait a moment and try again.");$("createRoom").disabled=true;try{playerId=crypto.randomUUID();roomId=roomCode();await setDoc(doc(db,"coupleRooms",roomId),{roomId,players:[{id:playerId,name:playerName(),joinedAt:Date.now()}],state:initialState(),createdAt:serverTimestamp()});enterRoom(roomId);}catch(e){say("Could not create room: "+e.message);}finally{$("createRoom").disabled=false;}}
async function joinRoom(){if(!db||!auth?.currentUser)return say("Firebase is still connecting. Please wait a moment and try again.");const c=$("roomInput").value.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(c))return say("Enter the 6-character room code.");try{playerId=crypto.randomUUID();await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",c),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found. Check the code.");const data=snap.data();if(data.players.length>=2)throw Error("This room already has two players.");if(data.players.some(p=>p.name.toLowerCase()===playerName().toLowerCase()))throw Error("Choose a different player name.");tx.update(ref,{players:data.players.concat([{id:playerId,name:playerName(),joinedAt:Date.now()}])});});enterRoom(c);}catch(e){say(e.message);}}
function enterRoom(c){roomId=c;$("roomSection").classList.remove("hidden");$("roomCodeDisplay").textContent=c;if(unsubscribe)unsubscribe();unsubscribe=onSnapshot(doc(db,"coupleRooms",c),snap=>{if(!snap.exists())return say("Room no longer exists.");room=snap.data();renderRoom();renderGame();},e=>say("Live sync error: "+e.message));$("roomSection").scrollIntoView({behavior:"smooth",block:"start"});}
function renderRoom(){$("playerLine").textContent=room.players.map(p=>p.name).join(" ♥ ")+(room.players.length<2?" · waiting for your person":" · both players connected");document.querySelectorAll(".game").forEach(b=>b.classList.toggle("active",b.dataset.game===activeGame));}
async function change(fn){if(!room||!roomId)return;try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const data=snap.data(),state=structuredClone(data.state);fn(state,data);tx.update(ref,{state});});}catch(e){say(e.message);}}
function renderGame(){if(!room)return;const s=room.state,waiting=room.players.length<2?"Waiting for your partner to join…":"Playing with "+(room.players[1-me()]||{}).name;let h='<div class="eyebrow">NOW PLAYING</div><h2>'+({whot:"🃏 WHOT!",ludo:"🎲 Ludo Race",ttt:"⭕ Tic-Tac-Toe",quiz:"💗 Couples Quiz",truth:"🔥 Truth or Dare"}[activeGame])+'</h2><p class="muted">'+waiting+'</p>';
if(activeGame==="ttt"){const g=s.ttt;h+='<div class="center"><p>'+(g.winner?"Winner: "+g.winner:g.moves===9?"It is a draw!":"Turn: "+g.turn)+'</p><div class="board">'+g.cells.map((v,i)=>'<button class="cell" data-cell="'+i+'" '+(v||g.winner||room.players.length<2?'disabled':'')+'>'+v+'</button>').join("")+'</div><button id="resetTtt" class="secondary">New round</button></div>';}
if(activeGame==="whot"){const g=s.whot,p=me(),hand=g.hands[p]||[];h+='<div class="center"><div class="quizcard"><div class="muted">TOP CARD</div><div class="playingcard" style="margin:10px auto;width:85px"><span>'+(g.top.n===5?"WHOT":g.top.n)+'</span><span class="shape">'+(g.top.n===5?"★":shapes[g.top.s])+'</span><span>'+(g.top.n===5?"ANY SHAPE": "Shape "+(g.top.s+1))+'</span></div><p>'+g.message+'</p><p class="muted">Your cards: '+hand.length+' · Partner: '+(g.hands[1-p]||[]).length+'</p></div><div class="cards">'+hand.map((c,i)=>'<button class="playingcard" data-card="'+i+'" '+(g.turn!==p||g.winner||room.players.length<2?'disabled':'')+'><span>'+(c.n===5?"WHOT":c.n)+'</span><span class="shape">'+(c.n===5?"★":shapes[c.s])+'</span><span>'+(c.n===5?"ANY":"Shape "+(c.s+1))+'</span></button>').join("")+'</div><p>'+(g.winner?g.winner+" wins!":"Turn: "+(room.players[g.turn]||{}).name)+'</p><button id="drawCard" class="gold" '+(g.turn!==p||g.winner||room.players.length<2?'disabled':'')+'>Draw card</button> <button id="resetWhot" class="secondary">Restart WHOT</button></div>';}
if(activeGame==="ludo"){const g=s.ludo;h+='<div class="center"><div class="quizcard"><div style="font-size:38px">'+(g.dice===null?"🎲":g.dice)+'</div><p>'+g.message+'</p><p>🔴 Bami: '+g.positions[0]+'/20 · 🔵 Oluwatosin: '+g.positions[1]+'/20</p><p>Turn: '+(room.players[g.turn]||{}).name+'</p><button id="rollDice" '+(g.turn!==me()||g.winner||room.players.length<2?'disabled':'')+'>Roll dice</button> <button id="resetLudo" class="secondary">Restart</button><p class="notice">Simplified race prototype with one token per player.</p></div></div>';}
if(activeGame==="quiz"){const g=s.quiz,q=quiz[g.index%quiz.length];h+='<div class="quizcard"><div class="muted">Question '+(g.index%quiz.length+1)+' of '+quiz.length+'</div><h3>'+q[0]+'</h3><p class="muted">Choose what you think your partner would answer, then talk about it.</p><div class="answers">'+q[1].map((a,i)=>'<button data-answer="'+i+'" '+(g.answers[me()]===i?'style="outline:2px solid #ff579f"':'')+'>'+a+'</button>').join("")+'</div><p class="muted">Bami: '+g.scores[0]+' points · Oluwatosin: '+g.scores[1]+'</p><button id="nextQuiz" class="pink">Next question →</button> <button id="resetQuiz" class="secondary">Reset</button></div>';}
if(activeGame==="truth"){const turnName=(room.players[s.truth.turn]||{}).name||"Player";h+=`<div class="quizcard center"><div class="muted">${turnName}'s turn</div><h3>${s.truth.prompt}</h3><button id="truthBtn" class="pink">💗 Truth</button> <button id="dareBtn" class="gold">🔥 Dare</button><p><button id="nextTruth" class="secondary">Next turn ↻</button></p><p class="notice">Skip anything uncomfortable. Kindness first ❤️</p></div>`;}
$("gameArea").innerHTML=h;wireGame();}
function wireGame(){
document.querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ttt,i=+b.dataset.cell,mark=me()===0?"X":"O",lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];if(g.cells[i]||g.winner||g.turn!==mark)return;g.cells[i]=mark;g.moves++;if(lines.some(l=>l.every(n=>g.cells[n]===mark)))g.winner=mark;else g.turn=mark==="X"?"O":"X";}));
const rt=$("resetTtt");if(rt)rt.onclick=()=>change(s=>{s.ttt={cells:Array(9).fill(""),turn:"X",winner:"",moves:0};});
document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),i=+b.dataset.card,c=g.hands[p][i];if(g.turn!==p||!c)return;if(c.s!==g.top.s&&c.n!==g.top.n&&c.n!==5){g.message="Play a matching shape/number or WHOT.";return;}g.hands[p].splice(i,1);g.top=c;g.message=room.players[p].name+" played a card.";if(!g.hands[p].length){g.winner=room.players[p].name;return;}g.turn=1-p;}));
const dr=$("drawCard");if(dr)dr.onclick=()=>change(s=>{const g=s.whot,p=me();if(g.turn!==p)return;if(!g.deck.length){g.message="Deck empty. Restart the game.";return;}g.hands[p].push(g.deck.pop());g.message=room.players[p].name+" drew a card.";g.turn=1-p;});
const rw=$("resetWhot");if(rw)rw.onclick=()=>change(s=>{s.whot=newWhot();});
const roll=$("rollDice");if(roll)roll.onclick=()=>change(s=>{const g=s.ludo,p=me();if(g.turn!==p)return;g.dice=1+Math.floor(Math.random()*6);g.positions[p]=Math.min(20,g.positions[p]+g.dice);g.message=room.players[p].name+" rolled "+g.dice+".";if(g.positions[p]>=20){g.winner=room.players[p].name+" wins!";g.message=g.winner+" 🎉";}else g.turn=1-p;});
const rl=$("resetLudo");if(rl)rl.onclick=()=>change(s=>{s.ludo={positions:[0,0],turn:0,dice:null,winner:"",message:"Roll the dice and race to 20."};});
document.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>change(s=>{s.quiz.answers[me()]=+b.dataset.answer;}));
const nq=$("nextQuiz");if(nq)nq.onclick=()=>change(s=>{const g=s.quiz;if(g.answers[0]!==undefined&&g.answers[1]!==undefined&&g.answers[0]===g.answers[1]){g.scores[0]++;g.scores[1]++;}g.index=(g.index+1)%quiz.length;g.answers=[];});
const rq=$("resetQuiz");if(rq)rq.onclick=()=>change(s=>{s.quiz={index:0,answers:[],scores:[0,0]};});
const tb=$("truthBtn");if(tb)tb.onclick=()=>change(s=>{s.truth.prompt=truths[Math.floor(Math.random()*truths.length)];});
const dbtn=$("dareBtn");if(dbtn)dbtn.onclick=()=>change(s=>{s.truth.prompt=dares[Math.floor(Math.random()*dares.length)];});
const nt=$("nextTruth");if(nt)nt.onclick=()=>change(s=>{s.truth.turn=1-s.truth.turn;s.truth.prompt="Choose Truth or Dare to begin.";});
}
$("createRoom").onclick=createRoom;$("joinRoom").onclick=joinRoom;
document.querySelectorAll(".game").forEach(b=>b.onclick=()=>{activeGame=b.dataset.game;renderRoom();renderGame();});
$("copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(roomId);say("Room code copied: "+roomId);}catch(e){say("Share this room code: "+roomId);}};
$("leaveRoom").onclick=()=>{if(unsubscribe)unsubscribe();unsubscribe=null;roomId=null;room=null;playerId=null;$("roomSection").classList.add("hidden");$("connectionStatus").innerHTML="Firebase ready<br>Not in a room yet";window.scrollTo({top:0,behavior:"smooth"});};
init();