let initializeApp, getAuth, signInAnonymously, getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction, serverTimestamp, firebaseConfig;
const $ = id => document.getElementById(id);
let db = null, auth = null, roomId = null, playerId = null, room = null, unsubscribe = null, activeGame = "whot", gameOpen = false, gameLaunchId = null, roomSnapshotInitialized = false, botThinking = false;
let lastWhotMoveSeen = null, lastWhotDrawSeen = null, pendingWhotMoveAnimation = null, pendingWhotDrawAnimation = null, whotAnimatedMoveIds = new Set(), whotAnimatedDrawIds = new Set();
let lastWhotReactionSeen = null;
const whotReactions = [{emoji:"😍",label:"Love"},{emoji:"😂",label:"LOL"},{emoji:"😈",label:"Naughty"},{emoji:"👏",label:"Nice"},{emoji:"😭",label:"Ouch"},{emoji:"🔥",label:"Fire"}];
const shapeNames = ["Circle","Triangle","Cross","Square","Star"];
const whotWinnerChallenges = ["Give your partner three sincere compliments.","Tell your partner your favourite memory together.","Send a 10-second voice note saying why you love them.","Give your partner a cute new nickname and explain it.","Name one thing your partner does that always makes you smile.","Plan a tiny date you can do together this week.","Say one thing you appreciate but don't say often enough.","Describe your partner using only three emojis.","Tell your partner one thing you want to experience together.","Sing or type two lines of a love song for your partner.","Share the first thing you noticed about your partner.","Send your best dramatic 'I miss you' message.","Tell the story of how you first started liking your partner.","Describe your partner in five kind words.","Tell your partner one small thing they do that makes you feel loved.","Share a moment when your partner made you proud.","Say what you think is your partner's cutest habit.","Tell your partner what you would do for a perfect day together.","Send a message as if you were meeting your partner for the first time.","Make up a two-line poem about your partner.","Give your partner a silly but affectionate award.","Tell your partner which outfit or look of theirs you love most.","Say what song reminds you of your partner and why.","Describe your relationship as a movie title.","Write a one-sentence love story starring both of you.","Do your best impression of how your partner says a common phrase.","Make your partner laugh in 20 seconds.","Send three emojis that describe your mood when your partner texts.","Invent a funny couple handshake using words or gestures.","Give your partner a ridiculous superhero name.","Describe your partner as a food and explain why.","Make up a funny headline about your relationship.","Talk like a news reporter announcing your partner's arrival.","Create a new couple slogan together.","Send a voice note saying your partner's name in five dramatic ways.","Try to make a heart using your hands and send a photo if comfortable.","Tell a harmless embarrassing story about yourself.","Use only emojis to say 'you are my favourite person'.","Make up a secret code word for a hug or cuddle.","Give your partner a playful challenge for the next round.","Ask your partner one question you've always been curious about.","Share a childhood memory that shaped you.","Tell your partner one dream you hope to achieve.","Describe what a peaceful future together could look like.","Share one thing that helps you feel understood.","Tell your partner how you prefer to be comforted on a hard day.","Name one boundary that helps you feel safe and respected.","Share something you have learned about love recently.","Tell your partner one thing you want you both to improve together.","Describe what trust means to you in one minute.","Tell your partner about a time they helped you without realising it.","Share one fear you feel comfortable talking about.","Say what makes you feel most appreciated in a relationship.","Tell your partner how you like to resolve disagreements.","Share one personal goal you would like support with.","Describe one way you can be a better listener.","Name a small tradition you would like to start together.","Tell your partner what makes you feel emotionally safe.","Share one thing you want more of in your relationship.","Ask your partner what makes them feel cared for.","Send a good-morning message as if tomorrow were a special day.","Write a tiny invitation for your next date.","Give your partner a virtual forehead kiss using words or emojis.","Send a 15-second appreciation voice note.","Make a three-song mini playlist for your partner.","Write a six-word love message.","Plan a date using only things that cost nothing.","Send a message describing your ideal reunion.","Write a sweet caption for a photo of you two.","Tell your partner one thing you are looking forward to doing together.","Name three things you would pack for a trip with your partner.","Choose a fictional couple that reminds you of your relationship.","Describe your perfect lazy day together.","Pick a shared hobby you would like to try.","Invent a couple nickname by combining your names.","Choose one meal you would love to cook or eat together.","Say which fictional world you would visit together.","Plan a mini adventure for your next free day.","Pick a board game or mobile game to play together next.","Describe your dream home vibe in three words.","Tell your partner one thing you admire about their mind.","Thank your partner for something specific they did recently.","Share one way your partner inspires you.","Tell your partner when you feel closest to them.","Say one kind thing about your partner's character.","Describe a quality you hope you both keep nurturing.","Tell your partner what you respect about them.","Share one thing your partner has taught you.","Name a moment you felt lucky to have your partner.","Tell your partner what makes them different from everyone else to you.","Send a playful fake award acceptance speech thanking your partner.","Try to flirt using the most formal language possible.","Describe your partner like a football commentator describing a star player.","Create a three-word slogan for your partner.","Tell a joke and let your partner rate it out of ten.","Make up a short theme song for your partner.","Give your partner a compliment without using the words beautiful, cute, or lovely.","Describe your partner as a weather forecast.","Send a dramatic movie-trailer line about missing your partner.","Invent a harmless rumour about how ridiculously sweet your partner is.","Tell your partner one thing you want to celebrate with them.","Share a little win from this week.","Say how your partner can encourage you when you doubt yourself.","Tell your partner one thing you are grateful for today.","Share one habit that could help you make more quality time.","Ask your partner what kind of surprise they enjoy most.","Tell your partner how you prefer to receive apologies.","Name one thing you can do this week to make your partner smile.","Share one relationship memory you want to recreate.","Tell your partner one promise you can realistically keep.","Send a voice note saying three things you like about your partner.","Write a message that would cheer your partner up after a tiring day.","Tell your partner what you would put in a tiny care package for them.","Describe your partner's smile without using the word smile.","Share a favourite conversation you have had together.","Tell your partner one thing you hope they never doubt about your feelings.","Make a top-three list of your favourite things to do together.","Tell your partner what you would name a pet you adopted together.","Invent a special celebration day for your relationship.","Finish the sentence: 'I feel lucky with you because…'","Ask your partner to choose a song for your next call.","Tell your partner which little moment with them you replay in your head.","Describe your relationship using a colour and explain why.","Share one thing you want to learn about your partner.","Tell your partner a compliment you were shy to say before.","Write a tiny thank-you note for being in your life.","Say what you think makes your connection special.","Choose a shared photo or memory and explain why it matters.","Tell your partner one way you can make long-distance moments feel closer.","End with a sincere sentence that makes your partner feel chosen."];
const shapeGlyphs = ["○","△","×","□","☆"];
const whotNumbers = [1,2,3,4,5,7,8,10,11,12,13,14];
const whotSuitNumbers = [[1,2,3,4,5,7,8,10,11,12,13,14],[1,2,3,4,5,7,8,10,11,12,13,14],[1,2,3,5,7,10,11,13,14],[1,2,3,5,7,10,11,13,14],[1,2,3,4,5,7,8]];
const quiz = [
 ["What kind of message makes you smile fastest?",["A sweet paragraph","A silly meme","A simple check-in","A voice note"]],
 ["When you have a rough day, what helps most?",["Being listened to","Getting advice","Having space","Being cheered up"]],
 ["Which meal could you happily eat again and again?",["Rice dish","Pasta or noodles","Swallow and soup","Snacks and small chops"]],
 ["What is your ideal free afternoon?",["Sleep and recharge","Watch something","Go out somewhere","Talk with someone I love"]],
 ["Which weather feels most comforting?",["Rainy and cosy","Bright and sunny","Cool and breezy","Thunderstorm from indoors"]],
 ["What do you usually do first after waking up?",["Check my phone","Go back to sleep","Freshen up","Think about the day"]],
 ["Which gift would mean the most?",["Something handmade","Something I mentioned wanting","A surprise outing","A heartfelt letter"]],
 ["What is your favourite kind of humour?",["Dry jokes","Silly nonsense","Sarcasm","Funny stories"]],
 ["If we had a whole day together, what would you choose?",["Stay in and cuddle","Explore somewhere new","Eat and play games","Do a bit of everything"]],
 ["Which kind of music do you reach for most?",["Afrobeats","R&B or soul","Gospel","Pop or rap"]],
 ["What is most likely to make you laugh unexpectedly?",["A ridiculous video","A friend's story","A clever comeback","Something random"]],
 ["What do you value most in a close relationship?",["Trust","Effort","Honesty","Peace and understanding"]],
 ["When making a big decision, what do you rely on most?",["Logic","My feelings","Advice from trusted people","A mix of everything"]],
 ["Which describes your social battery?",["I love being around people","I need lots of alone time","It depends on the people","I switch between both"]],
 ["What would you most like to learn?",["A practical skill","A creative skill","A new language","Something about technology"]],
 ["Which trip sounds best?",["Beach getaway","Busy city adventure","Quiet nature retreat","Visiting a new country"]],
 ["What is your most tempting treat?",["Chocolate or sweets","Ice cream","Spicy food","A cold drink"]],
 ["How do you prefer to celebrate good news?",["Tell my favourite person","Eat something nice","Go out and have fun","Enjoy a quiet moment"]],
 ["Which task do you postpone most?",["Cleaning or tidying","Replying to messages","School or work tasks","Making difficult calls"]],
 ["What makes you feel appreciated?",["Someone notices my effort","Someone makes time for me","Someone says it clearly","Someone helps without asking"]],
 ["Which role do you take in a group?",["The planner","The funny one","The quiet observer","The person who solves problems"]],
 ["What is your usual response when embarrassed?",["Laugh it off","Go quiet","Change the subject","Pretend nothing happened"]],
 ["Which would you rather have more of?",["Time","Money","Energy","Confidence"]],
 ["What is your dream home atmosphere?",["Cosy and peaceful","Modern and stylish","Full of friends and family","Simple and practical"]],
 ["What do you usually do when you cannot sleep?",["Scroll my phone","Listen to something","Think about everything","Try to force myself to sleep"]],
 ["Which is more your style?",["Plan everything early","Decide at the last minute","Have a plan but stay flexible","Let someone else plan"]],
 ["What do you notice first about a person?",["Their smile","Their confidence","How they speak","How they treat others"]],
 ["Which superpower would you pick?",["Teleportation","Read minds","Time travel","Heal people"]],
 ["What is your biggest everyday pet peeve?",["Being ignored","Loud unnecessary noise","People being late","Mess and disorganisation"]],
 ["Which would you choose for a lazy day?",["Movies and snacks","Long sleep","Music and daydreaming","Talking for hours"]],
 ["What type of compliment stays with you longest?",["About my character","About my looks","About my intelligence","About my effort"]],
 ["How do you prefer to solve a misunderstanding?",["Talk immediately","Cool off then talk","Text my thoughts first","Need reassurance before talking"]],
 ["What helps you trust someone?",["Consistency","Honesty even when hard","Respecting boundaries","Actions matching words"]],
 ["When you are excited about something, what do you do?",["Tell everyone","Tell one close person","Post about it","Keep it to myself for a while"]],
 ["Which skill would you like to be known for?",["Communication","Creativity","Leadership","Problem-solving"]],
 ["What kind of surprise do you enjoy most?",["A thoughtful message","An unexpected visit","A useful gift","A spontaneous plan"]],
 ["Which sounds like your ideal weekend?",["Rest at home","Go somewhere fun","Catch up with people","Finish tasks then relax"]],
 ["What is more important to you in a disagreement?",["Being understood","Finding a solution","Keeping things respectful","Repairing the connection"]],
 ["Which thing do you lose most often?",["My phone or charger","Small personal items","Track of time","My train of thought"]],
 ["What would you pick for a quick snack?",["Fruit","Biscuits or pastries","Something savoury","Whatever is nearby"]],
 ["Which time of day feels most like you?",["Early morning","Afternoon","Evening","Late night"]],
 ["What makes a place feel comfortable?",["Quiet and privacy","Friendly people","Familiar things","Good food and music"]],
 ["If you could instantly improve one thing, what would it be?",["My confidence","My finances","My skills","My daily routine"]],
 ["What kind of story do you enjoy most?",["Romance","Comedy","Mystery or thriller","Action or adventure"]],
 ["What do you do when a plan changes suddenly?",["Adapt quickly","Feel annoyed first","Look for another option","Need a moment to process"]],
 ["Which is the best way to spend a little extra money?",["Save it","Buy something useful","Treat someone I love","Enjoy a small experience"]],
 ["What do you appreciate most about your friends?",["Loyalty","Honesty","Good humour","Showing up when it matters"]],
 ["Which phone feature do you use most?",["Messaging and calls","Social media","Music and videos","Games and apps"]],
 ["What would you most like us to try together?",["Cook a new meal","Have a themed date","Learn something together","Take more photos and videos"]],
 ["Which memory would you most like to preserve?",["A really happy day","A funny embarrassing moment","A meaningful conversation","A small everyday moment"]],
 ["What makes you feel close to someone even from far away?",["Regular calls","Thoughtful messages","Sharing everyday updates","Doing an activity together"]],
 ["What would you rather receive after a stressful day?",["A comforting call","A funny distraction","Encouraging words","Quiet company"]],
 ["What is your ideal way to spend a celebration?",["A small private moment","A meal together","An outing or adventure","A surprise with loved ones"]],
 ["Which future goal excites you most?",["Career or business growth","A peaceful home","Travel and experiences","Helping family and loved ones"]],
 ["What does a good apology need most?",["Taking responsibility","Understanding the hurt","Changing the behaviour","All of these together"]],
 ["How do you prefer someone to show they remember you?",["Recall small details","Check on something important","Bring up a shared memory","Do something thoughtful"]],
 ["Which conversation could keep you talking for hours?",["Dreams and the future","Funny life stories","Music, films or sports","Deep personal topics"]],
 ["What is your preferred way to be encouraged?",["A direct pep talk","Gentle reassurance","Practical help","Someone believing in me"]],
 ["What do you do when you are proud of yourself?",["Celebrate openly","Tell someone close","Set another goal","Quietly enjoy it"]],
 ["Which would you pick for a spontaneous date?",["Street food adventure","A walk and long talk","Games and friendly competition","A cosy film night"]],
 ["What is most likely to make you feel understood?",["Someone listens without interrupting","Someone remembers what matters","Someone asks thoughtful questions","Someone respects my need for space"]],
 ["What is a habit you would like to build?",["Reading or learning","Exercise and movement","Saving money","Better sleep routine"]],
 ["Which describes your ideal conversation?",["Funny and unserious","Honest and deep","A mix of both","Quiet, comfortable and natural"]],
 ["What do you usually do when you miss someone?",["Text them","Call them","Look at photos or chats","Keep busy until we talk"]],
 ["Which quality would you most like to strengthen?",["Patience","Discipline","Courage","Consistency"]],
 ["What makes a date feel special even without spending much?",["Attention and effort","A thoughtful plan","Laughing together","Feeling safe and relaxed"]],
 ["Which would you choose to revisit?",["A childhood memory","A favourite holiday","A turning point in life","A simple day with someone special"]],
 ["How do you prefer to receive feedback?",["Gently and privately","Directly and clearly","After I have calmed down","With examples and a solution"]],
 ["What is most likely to motivate you?",["A clear goal","Someone cheering me on","Seeing progress","Knowing who it helps"]],
 ["Which little act feels especially thoughtful?",["Remembering my order","Checking that I got home safely","Sending something that reminded you of me","Helping with a task"]],
 ["What would you most like to get better at as a couple?",["Communicating clearly","Making time for each other","Handling disagreements","Creating more memories"]],
 ["What is your favourite kind of quality time?",["Long conversations","Doing an activity side by side","Going out together","Being quiet together"]],
 ["If we made a shared playlist, what should it include most?",["Love songs","Songs that make us laugh","Our current favourites","Songs linked to memories"]],
 ["What is the best way to handle a busy week together?",["Short check-ins every day","Plan a longer call","Send little updates when possible","Arrange time ahead"]],
 ["Which small achievement would make you happiest?",["Finishing a difficult task","Saving toward a goal","Learning something new","Keeping a promise to myself"]],
 ["What kind of photo do you like taking most?",["Selfies","Scenery and places","Funny candid moments","Photos with loved ones"]],
 ["Which would you rather do on a rainy day together?",["Watch a film","Talk with snacks","Play games","Listen to music"]],
 ["What do you most want people to remember about you?",["That I was kind","That I was dependable","That I made them laugh","That I kept growing"]],
 ["When you feel overwhelmed, what helps you regain control?",["Make a small plan","Talk it out","Take a break","Handle one thing at a time"]],
 ["What kind of shared tradition would you enjoy?",["Weekly date night","A special monthly check-in","A yearly trip or celebration","A private joke or ritual"]],
 ["What is your strongest sign that you care about someone?",["Making time","Remembering details","Offering help","Being honest and present"]],
 ["What is the most exciting thing about getting older?",["More independence","More opportunities","Building a stable life","Understanding myself better"]],
 ["Which kind of challenge sounds fun?",["A quiz or trivia battle","A creative task","A physical activity","A silly dare"]],
 ["What should we do when we disagree about plans?",["Take turns choosing","Find a compromise","Alternate who decides","Choose based on what matters most"]],
 ["Which kind of message would you save?",["A heartfelt paragraph","A funny conversation","A message from a hard day","A message celebrating a win"]],
 ["What makes you feel respected?",["Being heard","Being given honest answers","Having my boundaries honoured","Being treated consistently"]],
 ["Which new experience would you pick?",["Try a new cuisine","Visit somewhere unfamiliar","Attend a live event","Learn a new hobby"]],
 ["What is your favourite way to unwind with someone?",["Chat without rushing","Watch something together","Play a game","Share music"]],
 ["Which part of a relationship deserves the most attention?",["Communication","Trust","Affection","Shared effort"]],
 ["What is something you hope your future self thanks you for?",["Taking a chance","Staying disciplined","Protecting my peace","Being kind to myself"]],
 ["What kind of date detail would you remember longest?",["A thoughtful conversation","A funny moment","A small surprise","How comfortable I felt"]],
 ["What do you value most when someone is busy?",["A quick honest update","A planned time to talk","A little message when possible","Knowing they will follow through"]],
 ["Which would you rather create together?",["A memory scrapbook","A shared playlist","A bucket list","A photo album"]],
 ["What kind of win feels best?",["Achieving a personal goal","Making someone proud","Overcoming a fear","Doing something together"]],
 ["What do you think makes a couple a strong team?",["Trusting each other","Communicating openly","Supporting each other's goals","All three together"]]
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


function poolRack(){const balls=[{id:0,x:.24,y:.5,vx:0,vy:0,r:.0175,colour:"#fff",kind:"cue",pocketed:false}],cols={1:"#f4cf36",2:"#2878e8",3:"#df3156",4:"#5d3b9c",5:"#f28c28",6:"#2eaa70",7:"#7a4a2a",8:"#111318",9:"#f4cf36",10:"#2878e8",11:"#df3156",12:"#5d3b9c",13:"#f28c28",14:"#2eaa70",15:"#7a4a2a"},rackIds=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let n=0;for(let row=0;row<5;row++)for(let col=0;col<=row;col++){const id=rackIds[n++];balls.push({id,x:.72+row*.034,y:.5+(col-row/2)*.039,vx:0,vy:0,r:.0175,colour:cols[id],kind:id===8?"eight":id<=7?"solid":"stripe",pocketed:false});}return balls;}
function newPool(){return {balls:poolRack(),turn:0,winner:"",message:"Break shot: drag backwards from the cue ball and release to shoot.",shots:0,groups:["OPEN","OPEN"],phase:"ready",ballInHand:false};}
function ensurePool(g){if(!g||typeof g!=="object"||!Array.isArray(g.balls)||!g.balls.length)return newPool();if(!Array.isArray(g.groups))g.groups=["OPEN","OPEN"];if(!g.phase)g.phase="ready";return g;}
function renderPool(g){g=ensurePool(g);const p=me(),canShoot=g.turn===p&&!g.winner&&room.players.length===2&&g.phase==="ready";let h='<div class="pool-game"><div class="pool-top"><div><small>8-BALL · TWO-PLAYER</small><h2>🎱 8-BALL POOL</h2></div><div class="pool-turn '+(canShoot?'mine':'')+'">'+(g.winner?'GAME OVER':canShoot?'YOUR SHOT':esc(myName(g.turn).toUpperCase())+"'S SHOT")+'</div></div>';h+='<div class="pool-score"><span>'+myName(0)+' <b>'+esc(g.groups[0]||"OPEN")+'</b></span><strong>'+g.shots+' SHOTS</strong><span>'+myName(1)+' <b>'+esc(g.groups[1]||"OPEN")+'</b></span></div>';h+='<div class="pool-table-wrap"><canvas id="poolCanvas" width="1000" height="560" aria-label="Interactive eight ball pool table"></canvas><div class="pool-canvas-hint">'+(g.ballInHand?'Tap the table to place the cue ball.':'Drag near the cue ball to aim, or pull back from it and release to shoot.')+'</div></div>';h+='<div class="pool-controls"><div class="pool-control-block power-only"><div class="pool-control-heading"><label for="poolPower">SHOT POWER</label><output id="poolPowerValue">45%</output></div><input id="poolPower" class="pool-range power-range" type="range" min="5" max="100" step="1" value="45" aria-label="Shot power" '+(canShoot?'':'disabled')+'><button id="poolShoot" class="primary pool-shoot-button" type="button" '+(canShoot&&!g.ballInHand?'':'disabled')+'>🎱 SHOOT</button></div></div>';h+='<div class="pool-message">'+esc(g.message||"")+'</div><div class="pool-footer"><span>Solids vs stripes · pocket the 8 ball last.</span></div></div>';return h;}
function shootPool(g,dx,dy,desiredSpeed){g=ensurePool(g);if(g.winner||g.turn!==me()||g.phase!=="ready")return;const cue=g.balls.find(b=>b.id===0&&!b.pocketed);if(!cue)return;const len=Math.hypot(dx,dy)||1,speed=Number.isFinite(desiredSpeed)?Math.min(.045,Math.max(.006,desiredSpeed)):Math.min(.045,Math.max(.006,len*.00008));cue.vx=dx/len*speed;cue.vy=dy/len*speed;g.phase="rolling";g.shots++;g.firstHit=null;g.shotPocketed=g.balls.filter(b=>b.pocketed).map(b=>b.id);g.ballInHand=false;g.message=room.players[me()].name+" takes the shot.";}
function settlePool(g){if(g.phase!=="rolling")return;const shooter=g.turn,previous=g.shotPocketed||[],pocketed=g.balls.filter(b=>b.pocketed&&!previous.includes(b.id)),objects=pocketed.filter(b=>b.id!==0&&b.id!==8),cue=g.balls.find(b=>b.id===0),eight=g.balls.find(b=>b.id===8),scratched=!!cue?.pocketed,firstHit=g.firstHit;let foul=scratched||firstHit==null;const group=g.groups[shooter]||"OPEN";if(firstHit===8)foul=true;if(group!=="OPEN"){const ownLeft=g.balls.some(b=>!b.pocketed&&b.id!==0&&b.id!==8&&(group==="SOLIDS"?b.kind==="solid":b.kind==="stripe"));if(ownLeft&&firstHit!=null&&firstHit!==0){const hit=g.balls.find(b=>b.id===firstHit);if(hit&&(group==="SOLIDS"?hit.kind!=="solid":hit.kind!=="stripe"))foul=true;}}if(eight?.pocketed){const ownLeft=g.balls.some(b=>!b.pocketed&&b.id!==0&&b.id!==8&&(group==="SOLIDS"?b.kind==="solid":group==="STRIPES"?b.kind==="stripe":true));const legal=!foul&&group!=="OPEN"&&!ownLeft&&!scratched;g.winner=room.players[legal?shooter:1-shooter].name;g.message=legal?"Eight ball legally pocketed — "+g.winner+" wins!":"Foul or early 8-ball pocket — "+g.winner+" wins!";}else if(foul){if(scratched&&cue){cue.pocketed=false;cue.x=.24;cue.y=.5;cue.vx=cue.vy=0;}g.turn=1-shooter;g.ballInHand=true;g.message="Foul — "+room.players[g.turn].name+" gets ball in hand.";}else{if(group==="OPEN"&&objects.length){const first=objects[0],grp=first.kind==="stripe"?"STRIPES":"SOLIDS";g.groups[shooter]=grp;g.groups[1-shooter]=grp==="SOLIDS"?"STRIPES":"SOLIDS";}const assigned=g.groups[shooter],scored=objects.some(b=>assigned==="OPEN"||(assigned==="SOLIDS"?b.kind==="solid":b.kind==="stripe"));if(!scored)g.turn=1-shooter;g.message=scored?"Ball pocketed — "+room.players[shooter].name+" shoots again!":"No ball pocketed — turn passes to "+room.players[g.turn].name+".";}g.firstHit=null;g.shotPocketed=[];g.phase="ready";}
function initPoolCanvas(initial){
 const canvas=$("poolCanvas");if(!canvas)return;initial=ensurePool(initial);const ctx=canvas.getContext("2d");if(!ctx)return;const W=1000,H=560,m=44,tw=W-2*m,th=H-2*m,pockets=[[0,0],[.5,0],[1,0],[0,1],[.5,1],[1,1]],local=JSON.parse(JSON.stringify(initial));local.aimDx=1;local.aimDy=0;local.angleDeg=0;local.power=.45;local.aiming=false;local.placed=false;local.firstHit=null;
 const draw=()=>{
 ctx.clearRect(0,0,W,H);
 // Dark premium cabinet and burgundy wooden rails, inspired by the reference table.
 const cabinet=ctx.createLinearGradient(0,0,W,H);cabinet.addColorStop(0,"#080d19");cabinet.addColorStop(.5,"#263044");cabinet.addColorStop(1,"#050914");
 ctx.fillStyle=cabinet;ctx.fillRect(0,0,W,H);
 const wood=ctx.createLinearGradient(0,0,W,H);wood.addColorStop(0,"#210e17");wood.addColorStop(.18,"#8c2932");wood.addColorStop(.38,"#4b111c");wood.addColorStop(.62,"#a33a40");wood.addColorStop(.82,"#47111b");wood.addColorStop(1,"#160b13");
 ctx.fillStyle=wood;ctx.fillRect(8,8,W-16,H-16);
 ctx.strokeStyle="#d18c79";ctx.lineWidth=3;ctx.strokeRect(12,12,W-24,H-24);
 // Rails and polished inner cushion.
 ctx.fillStyle="#260d17";ctx.fillRect(27,27,W-54,H-54);
 const felt=ctx.createRadialGradient(W*.5,H*.5,40,W*.5,H*.5,W*.72);
 felt.addColorStop(0,"#48c7d8");felt.addColorStop(.58,"#168ba8");felt.addColorStop(1,"#07506d");
 ctx.fillStyle=felt;ctx.fillRect(m,m,tw,th);
 const cushion=ctx.createLinearGradient(0,m,0,H-m);cushion.addColorStop(0,"#081e2d");cushion.addColorStop(.18,"#1a6074");cushion.addColorStop(.5,"#0a3449");cushion.addColorStop(.82,"#185a70");cushion.addColorStop(1,"#061b2a");
 ctx.fillStyle=cushion;ctx.fillRect(m-9,m-7,tw+18,th+14);
 ctx.fillStyle=felt;ctx.fillRect(m,m,tw,th);
 ctx.strokeStyle="#07121d";ctx.lineWidth=3;ctx.strokeRect(m,m,tw,th);
 // Six deep pockets with chrome-like rims.
 pockets.forEach(([px,py])=>{
  const x=m+px*tw,y=m+py*th;
  const rim=ctx.createRadialGradient(x-5,y-6,2,x,y,29);rim.addColorStop(0,"#f4f6f7");rim.addColorStop(.3,"#778895");rim.addColorStop(.65,"#d8e1e5");rim.addColorStop(1,"#243544");
  ctx.beginPath();ctx.arc(x,y,27,0,Math.PI*2);ctx.fillStyle=rim;ctx.fill();
  ctx.beginPath();ctx.arc(x,y,21,0,Math.PI*2);ctx.fillStyle="#02050a";ctx.fill();
  ctx.beginPath();ctx.arc(x-5,y-6,13,0,Math.PI*2);ctx.fillStyle="#000";ctx.fill();
 });
 // Diamond sights along the rails.
 for(let i=1;i<8;i++){const x=m+tw*i/8;ctx.save();ctx.translate(x,m-18);ctx.rotate(Math.PI/4);ctx.fillStyle="#d9dce0";ctx.fillRect(-3,-3,6,6);ctx.restore();ctx.save();ctx.translate(x,H-m+18);ctx.rotate(Math.PI/4);ctx.fillStyle="#d9dce0";ctx.fillRect(-3,-3,6,6);ctx.restore();}
 for(let i=1;i<4;i++){const y=m+th*i/4;ctx.save();ctx.translate(m-18,y);ctx.rotate(Math.PI/4);ctx.fillStyle="#d9dce0";ctx.fillRect(-3,-3,6,6);ctx.restore();ctx.save();ctx.translate(W-m+18,y);ctx.rotate(Math.PI/4);ctx.fillStyle="#d9dce0";ctx.fillRect(-3,-3,6,6);ctx.restore();}
 local.balls.forEach(b=>{
  if(b.pocketed)return;
  const x=m+b.x*tw,y=m+b.y*th,r=b.r*tw;
  ctx.beginPath();ctx.arc(x+2,y+4,r*1.08,0,Math.PI*2);ctx.fillStyle="#00101c88";ctx.fill();
  const ball=ctx.createRadialGradient(x-r*.38,y-r*.48,r*.04,x,y,r*1.15);
  if(b.kind==="eight"){ball.addColorStop(0,"#565b64");ball.addColorStop(.3,"#17191e");ball.addColorStop(1,"#020306");}
  else {ball.addColorStop(0,"#ffffff");ball.addColorStop(.18,b.colour);ball.addColorStop(.76,b.colour);ball.addColorStop(1,"#111923");}
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=ball;ctx.fill();
  if(b.kind==="stripe"){ctx.save();ctx.beginPath();ctx.arc(x,y,r*.91,0,Math.PI*2);ctx.clip();ctx.fillStyle="#f7f8f8";ctx.fillRect(x-r,y-r*.38,r*2,r*.76);ctx.restore();}
  ctx.strokeStyle="#ffffffaa";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r*.94,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(x,y,r*.43,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
  ctx.fillStyle="#111827";ctx.font="bold "+Math.max(9,Math.round(r*.82))+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(b.id),x,y+.5);
 });
 {
  const cue=local.balls.find(b=>b.id===0&&!b.pocketed);
  const canAim=!initial.winner&&initial.phase==="ready";
  if(cue&&(local.aiming||canAim)){
   const cx=m+cue.x*tw,cy=m+cue.y*th;
   // Keep a usable cue stick visible before the player touches the table.
   // While aiming, the pointer defines the shot direction; otherwise aim at the rack.
   const angle=local.angleDeg*Math.PI/180,ux=Math.cos(angle),uy=Math.sin(angle);local.aimDx=ux;local.aimDy=uy;
   // Predict the cue ball's path to the first object ball or cushion.
   let rayLen=420,hitBall=null,hitDistance=Infinity,hitImpactX=0,hitImpactY=0;
   for(const b of local.balls){if(b.id===0||b.pocketed)continue;const bx0=m+b.x*tw,by0=m+b.y*th,rx=bx0-cx,ry=by0-cy,proj=rx*ux+ry*uy,perp=rx*uy-ry*ux,combined=(b.r+cue.r)*tw,disc=combined*combined-perp*perp;if(proj>0&&disc>=0){const contact=proj-Math.sqrt(disc);if(contact>=0&&contact<hitDistance){hitDistance=contact;rayLen=contact;hitBall=b;hitImpactX=cx+ux*contact;hitImpactY=cy+uy*contact;}}}
   const edgeX=ux>0?(W-m-cx)/ux:ux<0?(m-cx)/ux:Infinity,edgeY=uy>0?(H-m-cy)/uy:uy<0?(m-cy)/uy:Infinity;
   const edge=Math.min(edgeX>0?edgeX:Infinity,edgeY>0?edgeY:Infinity);if(Number.isFinite(edge))rayLen=Math.min(rayLen,edge);
   ctx.save();ctx.setLineDash([10,7]);ctx.lineWidth=3;ctx.strokeStyle="#ffffffdd";ctx.beginPath();ctx.moveTo(cx+ux*(cue.r*tw+3),cy+uy*(cue.r*tw+3));ctx.lineTo(cx+ux*rayLen,cy+uy*rayLen);ctx.stroke();ctx.restore();
   if(hitBall){
    const hx=m+hitBall.x*tw,hy=m+hitBall.y*th,hr=hitBall.r*tw;
    // Show the exact first-contact point and the cue ball's likely path.
    ctx.beginPath();ctx.arc(hx,hy,hr+5,0,Math.PI*2);ctx.strokeStyle="#fff7a8";ctx.lineWidth=3;ctx.stroke();
    ctx.save();ctx.setLineDash([5,7]);ctx.strokeStyle="#ffffffaa";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx+ux*(cue.r*tw+3),cy+uy*(cue.r*tw+3));ctx.lineTo(hitImpactX,hitImpactY);ctx.stroke();ctx.restore();
    // Object-ball direction follows the centre-to-centre collision normal,
    // giving a useful cut-shot guide rather than simply extending the cue line.
    const ox=hx-hitImpactX,oy=hy-hitImpactY,olen=Math.hypot(ox,oy)||1,txu=ox/olen,tyu=oy/olen;
    const startX=hx+txu*(hr+2),startY=hy+tyu*(hr+2);
    let travel=360;
    const ex=txu>0?(W-m-hx)/txu:txu<0?(m-hx)/txu:Infinity;
    const ey=tyu>0?(H-m-hy)/tyu:tyu<0?(m-hy)/tyu:Infinity;
    const edgeDist=Math.min(ex>0?ex:Infinity,ey>0?ey:Infinity);
    if(Number.isFinite(edgeDist))travel=Math.min(travel,edgeDist);
    // Prefer a pocket whose centre is closest to the projected object-ball line.
    let pocketTarget=null,pocketScore=Infinity;
    pockets.forEach(([px,py])=>{const qx=m+px*tw,qy=m+py*th,rx=qx-hx,ry=qy-hy,along=rx*txu+ry*tyu,side=Math.abs(rx*tyu-ry*txu);if(along>hr&&side<pocketScore){pocketScore=side;pocketTarget={x:qx,y:qy,along};}});
    if(pocketTarget&&pocketScore<Math.max(34,hr*2.4))travel=Math.min(travel,pocketTarget.along);
    ctx.save();ctx.lineCap="round";ctx.strokeStyle="#ffe27a";ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(startX,startY);ctx.lineTo(hx+txu*travel,hy+tyu*travel);ctx.stroke();
    const tx=hx+txu*travel,ty=hy+tyu*travel,targetAngle=Math.atan2(tyu,txu);
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-15*Math.cos(targetAngle-.55),ty-15*Math.sin(targetAngle-.55));ctx.moveTo(tx,ty);ctx.lineTo(tx-15*Math.cos(targetAngle+.55),ty-15*Math.sin(targetAngle+.55));ctx.stroke();
    if(pocketTarget&&pocketScore<Math.max(34,hr*2.4)){ctx.beginPath();ctx.arc(pocketTarget.x,pocketTarget.y,16,0,Math.PI*2);ctx.strokeStyle="#ffe27a";ctx.lineWidth=3;ctx.stroke();}
    // A translucent ghost ball shows where the cue ball must contact the target.
    ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(hitImpactX-ux*(cue.r*tw),hitImpactY-uy*(cue.r*tw),cue.r*tw,0,Math.PI*2);ctx.fillStyle="#d9f6ff";ctx.fill();ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.stroke();ctx.restore();
   }
   // Cue stick points opposite the aim direction; pull-back amount follows selected power.
   const pull=local.power*85;
   const tipX=cx-ux*(cue.r*tw+4),tipY=cy-uy*(cue.r*tw+4),bx=tipX-ux*(34+pull),by=tipY-uy*(34+pull),ex=tipX-ux*(235+pull),ey=tipY-uy*(235+pull);
   ctx.lineCap="round";ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(ex,ey);ctx.strokeStyle="#111722";ctx.lineWidth=12;ctx.stroke();
   ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tipX,tipY);ctx.strokeStyle="#d9b77b";ctx.lineWidth=7;ctx.stroke();
   ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.lineTo(tipX-ux*13,tipY-uy*13);ctx.strokeStyle="#7a3522";ctx.lineWidth=7;ctx.stroke();
   ctx.beginPath();ctx.arc(cx,cy,16,0,Math.PI*2);ctx.strokeStyle="#ffffff88";ctx.lineWidth=2;ctx.stroke();

  }
 }
 };
 const collide=(a,b)=>{if(a.pocketed||b.pocketed)return;const dx=b.x-a.x,dy=(b.y-a.y)*th/tw,d=Math.hypot(dx,dy),min=a.r+b.r;if(!d||d>=min)return;const nx=dx/d,ny=dy/d,overlap=min-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5*tw/th;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5*tw/th;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny*th/tw;if(rel<0){if(local.firstHit==null&&(a.id===0||b.id===0))local.firstHit=a.id===0?b.id:a.id;a.vx+=rel*nx*.96;a.vy+=rel*ny*.96*tw/th;b.vx-=rel*nx*.96;b.vy-=rel*ny*.96*tw/th;}};
 const step=()=>{let moving=false;for(const b of local.balls){if(b.pocketed)continue;b.x+=b.vx;b.y+=b.vy;b.vx*=.986;b.vy*=.986;if(Math.abs(b.vx)+Math.abs(b.vy)>.0008)moving=true;else b.vx=b.vy=0;if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.86;}if(b.x>1-b.r){b.x=1-b.r;b.vx=-Math.abs(b.vx)*.86;}if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy)*.86;}if(b.y>1-b.r){b.y=1-b.r;b.vy=-Math.abs(b.vy)*.86;}for(const [px,py] of pockets){if(Math.hypot((b.x-px),(b.y-py)*th/tw)<.033){b.pocketed=true;b.vx=b.vy=0;break;}}}for(let i=0;i<local.balls.length;i++)for(let j=i+1;j<local.balls.length;j++)collide(local.balls[i],local.balls[j]);return moving||local.balls.some(b=>Math.abs(b.vx)+Math.abs(b.vy)>.0008);};
 canvas.style.touchAction="none";
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};};
 const powerSlider=$("poolPower"),powerValue=$("poolPowerValue");
 if(powerSlider){
  powerSlider.value=String(Math.round(local.power*100));
  if(powerValue)powerValue.textContent=Math.round(local.power*100)+"%";
  powerSlider.oninput=()=>{local.power=Math.max(.05,Math.min(1,+powerSlider.value/100));if(powerValue)powerValue.textContent=Math.round(local.power*100)+"%";draw();};
  // The power slider only changes strength; shooting requires a separate tap.
  const shootButton=$("poolShoot");
  if(shootButton)shootButton.onclick=()=>{
   const current=room?.state?.pool||initial;
   if(current.turn!==me()||current.winner||current.phase!=="ready"||current.ballInHand||room.players.length<2)return;
   const angle=local.angleDeg*Math.PI/180,power=Math.max(.05,Math.min(1,local.power));
   const shotSpeed=.003+Math.pow(power,1.45)*.042,dx=Math.cos(angle)*th,dy=Math.sin(angle)*tw;
   change(s=>{const g=s.pool;if(g.turn!==me()||g.winner||g.phase!=="ready"||g.ballInHand||room.players.length<2)return;shootPool(g,dx,dy,shotSpeed);});
  };
 }
 const cuePosition=()=>{const cue=local.balls.find(b=>b.id===0&&!b.pocketed);return cue?{cue,x:m+cue.x*tw,y:m+cue.y*th}:null;};
 const updateAimFromPoint=e=>{const p=point(e),pos=cuePosition();if(!pos)return;const dx=p.x-pos.x,dy=p.y-pos.y;if(Math.hypot(dx,dy)<8)return;local.angleDeg=Math.atan2(dy,dx)*180/Math.PI;local.aimDx=Math.cos(local.angleDeg*Math.PI/180);local.aimDy=Math.sin(local.angleDeg*Math.PI/180);local.aiming=true;draw();};
 // Familiar 8 Ball Pool control: pull back from the cue ball, aim opposite
 // the pull direction, and release to shoot. Pull distance sets power.
 let cuePulling=false;
 canvas.onpointerdown=e=>{
  const current=room?.state?.pool||initial;
  if(current.turn!==me()||current.winner||current.phase!=="ready"||room.players.length<2)return;
  e.preventDefault();const p=point(e);
  if(current.ballInHand){const cue=local.balls.find(b=>b.id===0&&!b.pocketed);if(!cue)return;cue.x=Math.max(.04,Math.min(.96,(p.x-m)/tw));cue.y=Math.max(.04,Math.min(.96,(p.y-m)/th));draw();const x=cue.x,y=cue.y;change(s=>{const g=s.pool;if(g.turn!==me()||!g.ballInHand||g.phase!=="ready")return;const c=g.balls.find(b=>b.id===0);if(c){c.x=x;c.y=y;c.vx=0;c.vy=0;g.ballInHand=false;g.message="Cue ball placed. Pull back from the cue ball and release to shoot.";}});return;}
  const pos=cuePosition();if(!pos)return;
  if(Math.hypot(p.x-pos.x,p.y-pos.y)>Math.max(48,pos.cue.r*tw*3.5)){updateAimFromPoint(e);local.dragAiming=true;try{canvas.setPointerCapture(e.pointerId);}catch(_){}return;}
  cuePulling=true;local.dragAiming=false;local.pullPower=0;try{canvas.setPointerCapture(e.pointerId);}catch(_){} 
 };
 canvas.onpointermove=e=>{
  if(cuePulling){const p=point(e),pos=cuePosition();if(!pos)return;const dx=p.x-pos.x,dy=p.y-pos.y,dist=Math.hypot(dx,dy);if(dist>8){local.angleDeg=Math.atan2(-dy,-dx)*180/Math.PI;local.aimDx=Math.cos(local.angleDeg*Math.PI/180);local.aimDy=Math.sin(local.angleDeg*Math.PI/180);local.aiming=true;local.pullPower=Math.max(.05,Math.min(1,dist/190));local.power=local.pullPower;const slider=$("poolPower"),out=$("poolPowerValue");if(slider)slider.value=String(Math.round(local.power*100));if(out)out.textContent=Math.round(local.power*100)+"%";draw();}return;}
  if(local.dragAiming)updateAimFromPoint(e);
 };
 canvas.onpointerup=e=>{
  if(cuePulling){cuePulling=false;try{canvas.releasePointerCapture(e.pointerId);}catch(_){}const current=room?.state?.pool||initial,power=local.pullPower||0;if(power>.07&&current.turn===me()&&!current.winner&&current.phase==="ready"&&!current.ballInHand&&room.players.length===2){const angle=local.angleDeg*Math.PI/180,shotSpeed=.003+Math.pow(power,1.45)*.042,dx=Math.cos(angle)*th,dy=Math.sin(angle)*tw;change(s=>{const g=s.pool;if(g.turn!==me()||g.winner||g.phase!=="ready"||g.ballInHand||room.players.length!==2)return;shootPool(g,dx,dy,shotSpeed);});}else draw();local.pullPower=0;return;}
  if(local.dragAiming){local.dragAiming=false;try{canvas.releasePointerCapture(e.pointerId);}catch(_){}draw();}
 };
 canvas.onpointercancel=()=>{cuePulling=false;local.dragAiming=false;local.pullPower=0;draw();};
   if(initial.phase==="rolling"){let frames=0;const tick=()=>{const moving=step();draw();frames++;if(moving&&frames<1400){requestAnimationFrame(tick);return;}change(s=>{if(s.pool.phase!=="rolling")return;s.pool.balls=local.balls.map(b=>({...b,vx:0,vy:0}));s.pool.firstHit=local.firstHit;settlePool(s.pool);});};requestAnimationFrame(tick);}else draw();
}

function newWhot(){
 return {deck:[],discard:[],hands:{"0":[],"1":[]},top:null,calledShape:null,turn:0,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,pendingPenalty:null,pendingGeneralMarket:null,challenge:null,challengeHistory:[],dealt:false,readyPlayers:[],message:"Both players tap the deck to deal your cards."};
}
function dealWhot(g){
 const d=makeWhotDeck(),hands={"0":d.slice(0,6),"1":d.slice(6,12)};
 let rest=d.slice(12),topIndex=rest.findIndex(c=>c.s!==5);if(topIndex<0)topIndex=0;
 const top=rest.splice(topIndex,1)[0],turn=Math.floor(Math.random()*2);
 Object.assign(g,{deck:rest,discard:[],hands,top,calledShape:null,turn,winner:"",pendingShapeIndex:null,pendingShapePlayer:null,pendingPenalty:null,pendingGeneralMarket:null,dealt:true,readyPlayers:[],message:"Cards dealt randomly! "+room.players[turn].name+" starts."});
}
function newSnakes(){return {positions:[0,0],turn:0,dice:null,winner:"",message:"Tap the dice to start your race to 100."};}
function newLudo(){return {tokens:{"0":[-1,-1,-1,-1],"1":[-1,-1,-1,-1],"2":[-1,-1,-1,-1],"3":[-1,-1,-1,-1]},turn:0,dice:null,roll:null,rolls:null,usedDice:[false,false],selectedDie:null,lastRoll:null,sixStreak:0,hasCaptured:{"0":false,"1":false},winner:"",message:"Tap the dice in the centre to roll. Choose one number, then tap a seed to move it."};}
function initialState(){return {scores:[0,0],gameScores:{whot:[0,0],ludo:[0,0],ttt:[0,0],snakes:[0,0],ayo:[0,0]},snakes:newSnakes(),ayo:newAyo(),pool:newPool(),ttt:{cells:Array(9).fill(""),turn:"X",winner:"",moves:0},whot:newWhot(),ludo:newLudo(),quiz:{index:0,answers:{},scores:[0,0]},truth:{turn:0,prompt:"Choose Truth or Dare to begin."},couplesChallenge:{category:"sweet",promptIndex:-1,turn:0,completed:0,lastIndex:-1,started:false}};}
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
 try{const wantedName=playerName();playerId=crypto.randomUUID();await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",c),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found. Check the code.");const data=snap.data(),players=Array.isArray(data.players)?data.players:[];if(players.length===2&&players[1]?.isBot){tx.update(ref,{players:[players[0],{id:playerId,name:wantedName,joinedAt:Date.now()}]});return;}const sameSeat=players.findIndex(p=>String(p.name||"").trim().toLowerCase()===wantedName.toLowerCase());if(sameSeat>=0){const updated=players.slice();updated[sameSeat]={...updated[sameSeat],id:playerId,name:wantedName,lastReconnectedAt:Date.now()};tx.update(ref,{players:updated});return;}if(players.length>=2)throw Error("This room already has two players. To return to your own seat, enter the exact name you used before.");tx.update(ref,{players:players.concat([{id:playerId,name:wantedName,joinedAt:Date.now()}])});});saveSession({roomId:c,playerId,name:wantedName,autoResume:true});enterRoom(c);}
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
async function change(fn,optimistic=false){
 if(!room||!roomId)return;
 const startingRoom=room,startingRoomId=roomId;
 let optimisticState=null;
 if(optimistic&&startingRoom.state){
  try{
   optimisticState=structuredClone(startingRoom.state);
   fn(optimisticState,startingRoom);
   optimisticState.scores=Array.isArray(optimisticState.scores)?optimisticState.scores:[0,0];
   optimisticState.gameScores=optimisticState.gameScores&&typeof optimisticState.gameScores==="object"?optimisticState.gameScores:{whot:[0,0],ludo:[0,0],ttt:[0,0]};
   room={...startingRoom,state:optimisticState};
   renderGame();
  }catch(e){optimisticState=null;room=startingRoom;}
 }
 try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",startingRoomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const data=snap.data(),oldState=structuredClone(data.state),state=structuredClone(data.state);fn(state,data);if(optimisticState&&optimisticState.whot&&state.whot){for(const key of ["lastMove","lastDraw"]){const a=optimisticState.whot[key],b=state.whot[key];if(a&&b&&a.card&&b.card&&a.player===b.player&&a.card.s===b.card.s&&a.card.n===b.card.n&&(key!=="lastMove"||a.index===b.index)){b.id=a.id;}}}state.scores=Array.isArray(state.scores)?state.scores:[0,0];state.gameScores=state.gameScores&&typeof state.gameScores==="object"?state.gameScores:{whot:[0,0],ludo:[0,0],ttt:[0,0]};for(const key of ["whot","ludo","ttt","ayo","pool"]){const oldWinner=oldState[key]?.winner,newWinner=state[key]?.winner;if(!oldWinner&&newWinner){const winnerIndex=data.players.findIndex(p=>p.name===newWinner);if(winnerIndex>=0){if(key==="whot"||key==="ludo"||key==="ayo"||key==="pool"){state.gameScores[key]=Array.isArray(state.gameScores[key])?state.gameScores[key]:[0,0];state.gameScores[key][winnerIndex]=(state.gameScores[key][winnerIndex]||0)+1;}else state.scores[winnerIndex]=(state.scores[winnerIndex]||0)+1;}}}tx.update(ref,{state});});}
 catch(e){if(optimisticState&&roomId===startingRoomId&&room?.state===optimisticState){room=startingRoom;say(e.message);if(gameOpen)renderGame();}else say(e.message);}
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
function recordWhotDraw(g,card,player){if(card)g.lastDraw={id:String(Date.now())+"-"+Math.random().toString(36).slice(2),card:{...card},player};}
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
 hand.splice(i,1);g.discard.push(g.top);g.top=c;g.lastMove={id:String(Date.now())+"-"+Math.random().toString(36).slice(2),card:{...c},player:p,index:i};g.calledShape=c.s===5?chosenShape:null;g.pendingShapeIndex=null;g.pendingShapePlayer=null;g.pendingPenalty=null;
 if(!hand.length){g.winner=room.players[p].name;g.winnerIndex=p;const seen=Array.isArray(g.challengeHistory)?g.challengeHistory:[];let available=whotWinnerChallenges.filter(item=>!seen.includes(item));if(available.length<3){g.challengeHistory=[];available=whotWinnerChallenges.slice();}const options=shuffle(available).slice(0,3);g.challengeHistory=[...g.challengeHistory||[],...options];g.challenge={winnerIndex:p,loserIndex:1-p,options,selected:null,completed:false};g.message=g.winner+" wins Naija WHOT! 🎉 Choose a challenge for your partner!";return true;}
 const opponent=1-p;
 if(oldPenalty){
  if(c.n===oldPenalty.type){
   // Defending cancels the penalty; the player who started it gets the next turn.
   const firstPlayer=Number.isInteger(oldPenalty.origin)?oldPenalty.origin:opponent;
   g.pendingPenalty=null;g.turn=firstPlayer;
   g.message=room.players[p].name+" defended the Pick "+(oldPenalty.type===2?"Two":"Three")+"! Penalty cancelled. "+room.players[firstPlayer].name+" plays again.";
  }else{
   g.pendingPenalty={type:oldPenalty.type,amount:oldPenalty.amount,player:opponent,origin:oldPenalty.origin};g.turn=opponent;
   g.message=room.players[p].name+" must defend the Pick "+(oldPenalty.type===2?"Two":"Three")+" or pick "+oldPenalty.amount+" cards.";
  }
 }else if(c.n===2&&c.s!==5){
  g.pendingPenalty={type:2,amount:2,player:opponent,origin:p};g.turn=opponent;g.message="Pick Two! "+room.players[opponent].name+" can defend with another 2. If defended, "+room.players[p].name+" plays again; otherwise pick 2 cards.";
 }else if(c.n===5&&c.s!==5){
  g.pendingPenalty={type:5,amount:3,player:opponent,origin:p};g.turn=opponent;g.message="Pick Three! "+room.players[opponent].name+" can defend with another 5. If defended, "+room.players[p].name+" plays again; otherwise pick 3 cards.";
 }else if(c.n===8&&c.s!==5){g.turn=p;g.message="Suspension! "+room.players[opponent].name+" misses a turn.";}
 else if(c.n===1&&c.s!==5){g.turn=p;g.message="Hold On! "+room.players[p].name+" plays again.";}
 else if(c.n===14&&c.s!==5){g.pendingGeneralMarket=opponent;g.turn=opponent;const target=room.players[opponent]?.isBot?"Computer":room.players[opponent].name;g.message="General Market! "+target+" must pick one card from the Market.";}
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

function whotRectCenter(el){
 if(!el)return null;const r=el.getBoundingClientRect();
 if(!r.width||!r.height)return null;
 return {left:r.left,top:r.top,width:r.width,height:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2};
}
function whotAnimationRect(selector,preferredIndex){
 const root=$("gameArea");if(!root)return null;
 const el=root.querySelector(selector);if(!el)return null;
 if(Number.isInteger(preferredIndex)&&el.children?.length){
  const child=el.children[Math.max(0,Math.min(preferredIndex,el.children.length-1))];
  if(child){const r=whotRectCenter(child);if(r)return r;}
 }
 return whotRectCenter(el);
}
let whotFlightBusy=false;
function launchWhotFlight(event,kind){
 if(whotFlightBusy||!event?.card||!$("gameArea"))return;
 const localPlayer=me(),isLocal=event.player===localPlayer;
 let from,to,face;
 if(kind==="play"){
  from=isLocal?whotAnimationRect(".whot-hand",event.index):whotAnimationRect(".opponent-hand");
  to=whotAnimationRect(".discard-pile .top-playing-card");
  face=whotFace(event.card,event.card.s===5?"WHOT":shapeNames[event.card.s]);
 }else{
  from=whotAnimationRect("#drawPile");
  to=isLocal?whotAnimationRect(".whot-hand",Math.max(0,(room?.state?.whot?.hands?.[localPlayer]||[]).length-1)):whotAnimationRect(".opponent-hand");
  face=isLocal?whotFace(event.card,event.card.s===5?"WHOT":shapeNames[event.card.s]):'<span class="card-back-flight-mark">W</span>';
 }
 if(!from||!to)return;
 whotFlightBusy=true;
 const card=document.createElement("div");
 card.className="playingcard whot-flight-overlay "+(kind==="draw"&&!isLocal?"card-back-flight":event.card.s===5?"whot-card":"suit-"+event.card.s);
 card.setAttribute("aria-hidden","true");card.innerHTML=face;
 Object.assign(card.style,{left:from.left+"px",top:from.top+"px",width:from.width+"px",height:from.height+"px"});
 document.body.appendChild(card);
 const dx=to.cx-from.cx,dy=to.cy-from.cy,sx=Math.max(.35,to.width/from.width),sy=Math.max(.35,to.height/from.height);
 card.style.setProperty("--whot-fly-x",dx+"px");card.style.setProperty("--whot-fly-y",dy+"px");
 card.style.setProperty("--whot-fly-sx",String(sx));card.style.setProperty("--whot-fly-sy",String(sy));
 card.classList.add("whot-flight-running");
 const cleanup=()=>{card.remove();whotFlightBusy=false;};
 card.addEventListener("animationend",cleanup,{once:true});
 setTimeout(cleanup,400);
}
function playPendingWhotAnimations(){
 const move=pendingWhotMoveAnimation,draw=pendingWhotDrawAnimation;
 pendingWhotMoveAnimation=null;pendingWhotDrawAnimation=null;
 if(move)requestAnimationFrame(()=>launchWhotFlight(move,"play"));
 else if(draw)requestAnimationFrame(()=>launchWhotFlight(draw,"draw"));
}
function launchWhotSpecialEffect(move){
 if(!move?.card)return;
 const effects={1:["✨","HOLD ON!"],2:["💥","PICK TWO!"],5:["💥","PICK THREE!"],8:["⚡","SUSPENSION!"],14:["🛍️","GENERAL MARKET!"],20:["🌟","WHOT 20!"]};
 const effect=move.card.s===5?effects[20]:effects[move.card.n];if(!effect)return;
 const bubble=document.createElement("div");bubble.className="whot-special-float";bubble.textContent=effect[0]+" "+effect[1];bubble.setAttribute("aria-hidden","true");document.body.appendChild(bubble);
 const remove=()=>bubble.remove();bubble.addEventListener("animationend",remove,{once:true});setTimeout(remove,1050);
}
function launchWhotReaction(reaction){
 if(!reaction||!reaction.id||!reaction.emoji||reaction.id===lastWhotReactionSeen)return;
 lastWhotReactionSeen=reaction.id;
 const bubble=document.createElement("div");bubble.className="whot-reaction-float";bubble.textContent=reaction.emoji+"  "+(reaction.playerName||"Player");bubble.setAttribute("aria-live","polite");bubble.style.left=reaction.player===me()?"58%":"42%";document.body.appendChild(bubble);
 const remove=()=>bubble.remove();bubble.addEventListener("animationend",remove,{once:true});setTimeout(remove,1550);
}
function renderWhot(g){
 if(g.lastReaction?.id&&g.lastReaction.id!==lastWhotReactionSeen)requestAnimationFrame(()=>launchWhotReaction(g.lastReaction));
 if(g.lastMove?.id&&g.lastMove.id!==lastWhotMoveSeen){lastWhotMoveSeen=g.lastMove.id;if(!whotAnimatedMoveIds.has(g.lastMove.id)){whotAnimatedMoveIds.add(g.lastMove.id);if(whotAnimatedMoveIds.size>40)whotAnimatedMoveIds.delete(whotAnimatedMoveIds.values().next().value);pendingWhotMoveAnimation={...g.lastMove};launchWhotSpecialEffect(g.lastMove);}}
 if(g.lastDraw?.id&&g.lastDraw.id!==lastWhotDrawSeen){lastWhotDrawSeen=g.lastDraw.id;if(!whotAnimatedDrawIds.has(g.lastDraw.id)){whotAnimatedDrawIds.add(g.lastDraw.id);if(whotAnimatedDrawIds.size>40)whotAnimatedDrawIds.delete(whotAnimatedDrawIds.values().next().value);pendingWhotDrawAnimation={...g.lastDraw};}}
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
   h+='<div class="cards whot-hand">'+hand.map((c,i)=>'<button class="playingcard '+(c.s===5?"whot-card":"suit-"+c.s)+'" data-card="'+i+'" aria-label="'+esc(cardLabel(c)+" "+(c.s===5?"WHOT":shapeNames[c.s]))+'" '+(g.turn!==p||g.winner||room.players.length<2||g.pendingShapePlayer!==null||g.pendingGeneralMarket===p?'disabled':'')+'>'+whotFace(c,c.s===5?"WHOT":shapeNames[c.s])+'</button>').join("")+'</div>';
  h+='<div class="whot-status-message">'+esc(g.message||"")+'</div>';
  if(g.winner&&g.challenge){
   const ch=g.challenge,won=ch.winnerIndex===p,loser=ch.loserIndex===p;
   h+='<section class="whot-challenge-panel"><div class="whot-challenge-kicker">🏆 WHOT WINNER CHALLENGE</div><h3>'+(ch.completed?'Challenge completed! 💗':ch.selected?'Your challenge is on! 💞':'Winner chooses, loser does it!')+'</h3><p>'+esc(room.players[ch.winnerIndex]?.name||'Winner')+' won the round'+(ch.completed?'':ch.selected?' and picked a challenge for '+esc(room.players[ch.loserIndex]?.name||'the loser')+'.':'.')+'</p>';
   if(!ch.selected&&won&&!ch.completed){h+='<div class="whot-challenge-options">'+ch.options.map((opt,i)=>'<button class="whot-challenge-option" data-whot-challenge="'+i+'">'+esc(opt)+'</button>').join('')+'</div><small>Pick one challenge for your partner.</small>';}
   else if(!ch.selected&&!won){h+='<div class="whot-challenge-wait">Waiting for '+esc(room.players[ch.winnerIndex]?.name||'the winner')+' to choose your challenge…</div>';}
   else if(ch.selected){h+='<div class="whot-challenge-picked"><span>YOUR CHALLENGE</span><b>'+esc(ch.selected)+'</b></div>';if(loser&&!ch.completed)h+='<button class="whot-challenge-done" id="whotChallengeDone">💗 I did it!</button>';if(won&&!ch.completed)h+='<div class="whot-challenge-wait">Waiting for your partner to complete the challenge.</div>';if(ch.completed)h+='<div class="whot-challenge-done-note">Both of you can start another round whenever you’re ready.</div>';}
   h+='</section>';
  }
  h+='<div class="whot-reaction-bar" aria-label="Send a reaction">'+whotReactions.map(r=>'<button type="button" class="whot-reaction-button" data-whot-reaction="'+r.emoji+'" aria-label="Send reaction '+r.label+'" title="'+r.label+'">'+r.emoji+'</button>').join('')+'</div>';
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
 if(g.winner==="DRAW")return {key,winner:"",draw:true};
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
const couplesChallengePrompts={
 sweet:[
 "Look at your partner and name three little things you adore about them.",
 "Give your partner a 20-second appreciation speech.",
 "Describe your favourite memory together in a way that makes it sound like a movie.",
 "Send your partner a voice note saying one thing you cannot wait to do together.",
 "Give your partner a genuine compliment you have never said out loud.",
 "Choose a song that reminds you of your relationship and explain why.",
 "Tell your partner one small thing they do that makes you feel loved.",
 "Plan a tiny surprise for your partner that costs nothing."
 ],
 fun:[
 "Both do your best impression of how the other person texts.",
 "Invent a ridiculous couple nickname for the two of you.",
 "Describe your first impression of each other in only five words.",
 "Take turns making each other laugh without touching your phone.",
 "Create a two-line theme song for your relationship.",
 "Let your partner choose a harmless funny pose for your next selfie.",
 "Tell the story of how you met as if you are a sports commentator.",
 "Each of you must name one food the other could never give up."
 ],
 deep:[
 "What helps you feel safe and understood when you are upset?",
 "What is one dream you would love for us to work toward together?",
 "When do you feel closest to me, even if we are apart?",
 "What is one thing we could do to communicate better?",
 "What does a healthy apology look like to you?",
 "What is one fear about the future you would like your partner to understand?",
 "Name one boundary that helps you feel respected in a relationship.",
 "What is one way we can support each other's personal growth?"
 ]
};
const couplesChallengeCategories={sweet:{label:"Sweet & Romantic",emoji:"💗",description:"Little moments of love and appreciation"},fun:{label:"Silly & Fun",emoji:"😂",description:"Laugh together and be a little ridiculous"},deep:{label:"Deep Connection",emoji:"🌙",description:"Thoughtful questions for a closer bond"}};
function renderCouplesChallenge(s){
 const g=s.couplesChallenge||(s.couplesChallenge={category:"sweet",promptIndex:-1,turn:0,completed:0,lastIndex:-1,started:false});
 const category=couplesChallengeCategories[g.category]||couplesChallengeCategories.sweet;
 const prompts=couplesChallengePrompts[g.category]||couplesChallengePrompts.sweet;
 const waiting=room.players.length<2;
 let out='<div class="couples-challenge"><div class="cc-hero"><div class="cc-heart">💞</div><div class="eyebrow">JUST YOU TWO</div><h2>Couples Challenge</h2><p>Little challenges to laugh, connect and learn more about each other.</p></div>';
 out+='<div class="cc-categories">'+Object.keys(couplesChallengeCategories).map(key=>{const c=couplesChallengeCategories[key];return '<button class="cc-category '+(g.category===key?'selected':'')+'" data-cc-category="'+key+'" '+(waiting?'disabled':'')+'><span>'+c.emoji+'</span><b>'+c.label+'</b><small>'+c.description+'</small></button>';}).join("")+'</div>';
 out+='<div class="cc-progress"><span>💞 Challenges completed together</span><b>'+Number(g.completed||0)+'</b></div>';
 if(!g.started||g.promptIndex<0)out+='<div class="cc-prompt cc-empty"><span>'+category.emoji+'</span><h3>Ready for a little us-time?</h3><p>Choose a vibe above, then start your first challenge.</p><button id="ccStart" class="pink" '+(waiting?'disabled':'')+'>Start our challenge ✨</button></div>';
 else out+='<div class="cc-prompt"><div class="cc-prompt-kicker">'+category.emoji+' '+category.label.toUpperCase()+'</div><div class="cc-turn"> '+(g.turn===me()?'YOUR TURN':esc((room.players[g.turn]||{}).name||"Partner")+"’S TURN")+'</div><h3>'+esc(prompts[g.promptIndex]||prompts[0])+'</h3><p class="cc-nudge">'+(g.turn===me()?"Take your time — there’s no wrong answer.":"Let your partner have the spotlight. 💗")+'</p><button id="ccComplete" class="pink" '+(waiting||g.turn!==me()?'disabled':'')+'>Done — pass the turn 💞</button></div>';
 out+='<p class="cc-footnote">'+(waiting?'Waiting for your partner to join before starting.':'No points, no pressure — skip anything that doesn’t feel right.')+'</p></div>';
 return out;
}
function renderGame(){
 if(!room)return;const s=room.state,waiting=room.players.length<2?"Waiting for your partner to join…":"Playing with "+(room.players[1-me()]||{}).name;
 let h=(activeGame==="whot"||activeGame==="ludo"||activeGame==="snakes"||activeGame==="ayo"||activeGame==="pool")?'<div class="whot-screen-header"><button id="backToGames" class="whot-back">← Games</button><div class="whot-brandline"><span>'+(activeGame==="whot"?"🃏":activeGame==="ludo"?"🎲":activeGame==="snakes"?"🐍":activeGame==="ayo"?"🫘":"🎱")+'</span><span><b>'+(activeGame==="whot"?"NAIJA WHOT":activeGame==="ludo"?"NAIJA LUDO":activeGame==="snakes"?"SNAKE & LADDER":activeGame==="ayo"?"AYO OWARE":"8-BALL POOL")+'</b><small>BAMI ♥ OLUWATOSIN</small></span></div><div class="whot-online">'+(room.players.length<2?'WAITING…':'● 2 PLAYERS')+'</div></div>':'<div class="actions"><button id="backToGames" class="secondary">← All games</button></div><div class="eyebrow">NOW PLAYING</div><h2>'+({whot:"🃏 WHOT!",ludo:"🎲 Ludo",ttt:"⭕ Tic-Tac-Toe",quiz:"💗 Couples Quiz",truth:"🔥 Truth or Dare"}[activeGame])+'</h2><p class="muted">'+esc(waiting)+'</p>';
 if(activeGame==="couples"){h+=renderCouplesChallenge(s);$("gameArea").innerHTML=h;wireCouplesChallenge();wireGame();return;}
 const scores=Array.isArray(s.scores)?s.scores:[0,0];if(activeGame!=="whot"&&activeGame!=="ludo")h+='<div class="overall-scoreboard"><span>🏆 MATCH SCORE</span><b>'+myName(0)+' '+(scores[0]||0)+'</b><i>—</i><b>'+myName(1)+' '+(scores[1]||0)+'</b></div>';
 if(activeGame==="ttt"){
  const g=s.ttt,turnIndex=g.turn==="X"?0:1,turnName=myName(turnIndex),done=!!g.winner||g.moves>=9;
  h+='<div class="ttt-screen"><div class="ttt-topbar"><button id="tttBackToGames" class="secondary ttt-back" type="button">← Games</button><div class="ttt-title"><span>⭕</span><div><b>TIC-TAC-TOE</b><small>BAMI ♥ OLUWATOSIN</small></div></div><span class="ttt-live">'+(room.players.length>=2?'● 2 PLAYERS':'WAITING…')+'</span></div>';
  h+='<div class="ttt-score-row"><div class="ttt-player-card '+(!done&&g.turn==="X"?'active':'')+'"><span class="ttt-mark x-mark">X</span><div><small>PLAYER 1</small><b>'+esc(myName(0))+'</b></div><strong>'+(scores[0]||0)+'</strong></div><div class="ttt-score-divider">VS</div><div class="ttt-player-card '+(!done&&g.turn==="O"?'active':'')+'"><span class="ttt-mark o-mark">O</span><div><small>PLAYER 2</small><b>'+esc(myName(1))+'</b></div><strong>'+(scores[1]||0)+'</strong></div></div>';
  h+='<div class="ttt-turn-banner '+(done?'finished':'')+'"><span class="ttt-turn-dot"></span><div><small>'+(g.winner?'ROUND WINNER':g.moves>=9?'ROUND RESULT':'CURRENT TURN')+'</small><b>'+(g.winner?esc(g.winner)+' wins!':g.moves>=9?'Draw — nobody won':esc(turnName)+(g.turn==="X"?' · X':' · O')+' to play')+'</b></div></div>';
  h+='<div class="ttt-board" role="group" aria-label="Tic-Tac-Toe board">'+g.cells.map((v,i)=>'<button class="ttt-cell '+(v?(v==="X"?'x-cell':'o-cell'):'')+'" data-cell="'+i+'" aria-label="Square '+(i+1)+(v?', '+v:' empty')+'" '+(v||done||(room.players.length<2&&!room.players[1]?.isBot)||g.turn!==(me()===0?"X":"O")?'disabled':'')+'>'+esc(v)+'</button>').join("")+'</div>';
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
 $("gameArea").innerHTML=h;if(activeGame==="whot")playPendingWhotAnimations();wireGame();scheduleComputerTurn();
}
function wireCouplesChallenge(){
 document.querySelectorAll("[data-cc-category]").forEach(button=>button.onclick=()=>change(s=>{const g=s.couplesChallenge||(s.couplesChallenge={category:"sweet",promptIndex:-1,turn:0,completed:0,lastIndex:-1,started:false});if(room.players.length<2)return;g.category=button.dataset.ccCategory;g.started=false;g.promptIndex=-1;}));
 const start=$("ccStart");if(start)start.onclick=()=>change(s=>{if(room.players.length<2)return;const g=s.couplesChallenge||(s.couplesChallenge={category:"sweet",promptIndex:-1,turn:0,completed:0,lastIndex:-1,started:false});const list=couplesChallengePrompts[g.category]||couplesChallengePrompts.sweet;let next=Math.floor(Math.random()*list.length);if(list.length>1&&next===g.lastIndex)next=(next+1)%list.length;g.promptIndex=next;g.lastIndex=next;g.turn=me();g.started=true;});
 const done=$("ccComplete");if(done)done.onclick=()=>change(s=>{const g=s.couplesChallenge;if(!g||!g.started||g.turn!==me()||room.players.length<2)return;g.completed=(g.completed||0)+1;const list=couplesChallengePrompts[g.category]||couplesChallengePrompts.sweet;let next=Math.floor(Math.random()*list.length);if(list.length>1&&next===g.lastIndex)next=(next+1)%list.length;g.promptIndex=next;g.lastIndex=next;g.turn=1-me();});
}
function wireGame(){
 const rematch=$( "rematchButton" );
 if(rematch)rematch.onclick=()=>change(s=>{
  const finished=finishedGameInfo(s);if(!finished)return;
  const votes=Array.isArray(s.rematchVotes)?s.rematchVotes:[];
  if(!votes.includes(me()))votes.push(me());
  // The computer accepts rematches automatically.
  if(room?.players?.[1]?.isBot&&!votes.includes(1))votes.push(1);
  s.rematchVotes=votes;
  if(s.rematchVotes.includes(0)&&s.rematchVotes.includes(1))resetFinishedGame(s,finished.key);
 });
 document.querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>change(s=>{const g=s.ttt,i=+b.dataset.cell,mark=me()===0?"X":"O",lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];if(g.cells[i]||g.winner||g.turn!==mark||(room.players.length<2&&!room.players[1]?.isBot))return;g.cells[i]=mark;g.moves++;if(lines.some(l=>l.every(n=>g.cells[n]===mark)))g.winner=room.players[me()].name;else g.turn=mark==="X"?"O":"X";}));
 const backButtons=document.querySelectorAll("#backToGames, #tttBackToGames");backButtons.forEach(back=>{back.type="button";back.onclick=ev=>{ev.preventDefault();ev.stopPropagation();gameOpen=false;const picker=document.querySelector(".games"),area=$("gameArea"),section=$("roomSection");if(area){area.innerHTML='<div class="center muted">Choose a game to start.</div>';area.classList.add("hidden");area.style.display="none";}if(picker){picker.classList.remove("hidden");picker.style.display="grid";}if(section)section.classList.remove("hidden");document.body.style.overflow="";document.documentElement.style.overflow="";window.scrollTo(0,0);if(picker)picker.scrollIntoView({behavior:"auto",block:"start"});};});
 const rt=$("resetTtt");if(rt)rt.onclick=()=>change(s=>{s.ttt={cells:Array(9).fill(""),turn:"X",winner:"",moves:0};});
 const dealWhotBtn=$("dealWhot"),dealPile=$("dealPile");const tapToDeal=()=>change(s=>{const g=s.whot;if(g.dealt||g.top||room.players.length<2)return;const ready=Array.isArray(g.readyPlayers)?g.readyPlayers:[];if(ready.includes(me()))return;g.readyPlayers=ready.concat(me());if(g.readyPlayers.length>=2)dealWhot(g);else g.message=room.players[me()].name+" is ready. Waiting for the other player to tap the deck.";});if(dealWhotBtn)dealWhotBtn.onclick=tapToDeal;if(dealPile)dealPile.onclick=tapToDeal;
  document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),i=+b.dataset.card,c=(g.hands[p]||[])[i];if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||g.pendingGeneralMarket===p||room.players.length<2||!c||!whotCanPlay(c,g))return;if(c.s===5){g.pendingShapeIndex=i;g.pendingShapePlayer=p;g.message="Choose the shape to call.";return;}playWhotCard(g,p,i);},true));
 document.querySelectorAll("[data-shape]").forEach(b=>b.onclick=()=>change(s=>{const g=s.whot,p=me(),shape=+b.dataset.shape;if(g.pendingShapePlayer!==p||g.pendingShapeIndex===null)return;playWhotCard(g,p,g.pendingShapeIndex,shape);}));
 const drawFromMarket=()=>change(s=>{const g=s.whot,p=me();if(g.turn!==p||g.winner||g.pendingShapePlayer!==null||room.players.length<2)return;if(g.pendingGeneralMarket!==null&&g.pendingGeneralMarket!==p){g.message=(g.pendingGeneralMarket===1?"Computer":"Your opponent")+" must pick the General Market card first.";return;}if(g.pendingGeneralMarket===p){const c=drawWhotCard(g);if(!c){g.message="No cards remain in the Market.";return;}g.hands[p].push(c);recordWhotDraw(g,c,p);g.pendingGeneralMarket=null;g.turn=1-p;g.message=room.players[p].name+" picked one card from General Market. Turn passes back to "+room.players[g.turn].name+".";}else if(g.pendingPenalty){if(g.pendingPenalty.player!==undefined&&g.pendingPenalty.player!==p){g.message="The Pick "+(g.pendingPenalty.type===2?"Two":"Three")+" is for "+room.players[g.pendingPenalty.player].name+". It is not your turn to pick.";return;}const amount=g.pendingPenalty.amount;for(let n=0;n<amount;n++){const c=drawWhotCard(g);if(c){g.hands[p].push(c);recordWhotDraw(g,c,p);}}g.pendingPenalty=null;g.turn=1-p;g.message=room.players[p].name+" picked "+amount+" card(s) for the penalty. Turn passes back to "+room.players[g.turn].name+".";}else{const c=drawWhotCard(g);if(!c){g.message="No cards remain to draw. Restart the game.";return;}g.hands[p].push(c);recordWhotDraw(g,c,p);g.turn=1-p;g.message=room.players[p].name+" picked a card from the Market. Turn passes.";}},true);const dr=$("drawCard");if(dr)dr.onclick=drawFromMarket;const pile=$("drawPile");if(pile)pile.onclick=drawFromMarket;
 document.querySelectorAll("[data-whot-challenge]").forEach(b=>b.onclick=()=>{const index=Number(b.dataset.whotChallenge);change(s=>{const g=s.whot,ch=g?.challenge;if(!g?.winner||!ch||ch.winnerIndex!==me()||ch.selected||!Number.isInteger(index)||!ch.options[index])return;ch.selected=ch.options[index];ch.selectedAt=Date.now();g.message=room.players[ch.winnerIndex].name+" chose a challenge for "+room.players[ch.loserIndex].name+"!";});});
 const whotChallengeDone=$("whotChallengeDone");if(whotChallengeDone)whotChallengeDone.onclick=()=>change(s=>{const ch=s.whot?.challenge;if(!ch||ch.loserIndex!==me()||!ch.selected||ch.completed)return;ch.completed=true;ch.completedAt=Date.now();s.whot.message=room.players[ch.loserIndex].name+" completed the winner's challenge! 💗";});
 document.querySelectorAll("[data-whot-reaction]").forEach(b=>b.onclick=()=>{const emoji=b.dataset.whotReaction;change(s=>{if(!s.whot||s.whot.winner)return;s.whot.lastReaction={id:String(Date.now())+"-"+Math.random().toString(36).slice(2),emoji,player:me(),playerName:room.players[me()]?.name||"Player",at:Date.now()};});});
 const rw=$("resetWhot");if(rw)rw.onclick=()=>change(s=>{const history=Array.isArray(s.whot?.challengeHistory)?s.whot.challengeHistory:[];s.whot=newWhot();s.whot.challengeHistory=history;});
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

async function addComputer(){
 if(!db||!roomId||!room||room.players.length!==1)return;
 try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const d=snap.data(),players=Array.isArray(d.players)?d.players:[];if(players.length!==1)throw Error("Someone has already joined this room.");tx.update(ref,{players:players.concat([{id:"computer-opponent",name:"Computer",isBot:true,joinedAt:Date.now()}])});});say("Computer opponent added. Your partner can still join using this room code.");}
 catch(e){say("Could not add computer: "+e.message);}
}
function scheduleComputerTurn(){
 if(botThinking||!room||!room.players[1]?.isBot||me()!==0||!gameOpen)return;
 const s=room.state;if(!s)return;
 // Recover an already-finished computer match where the human tapped Rematch before the bot auto-accept fix deployed.
 const finishedNow=finishedGameInfo(s),votesNow=Array.isArray(s.rematchVotes)?s.rematchVotes:[];
 if(finishedNow&&votesNow.includes(0)&&!votesNow.includes(1)){
  botThinking=true;
  setTimeout(async()=>{try{await change(st=>{const f=finishedGameInfo(st),v=Array.isArray(st.rematchVotes)?st.rematchVotes:[];if(f&&v.includes(0)){if(!v.includes(1))v.push(1);st.rematchVotes=v;resetFinishedGame(st,f.key);}});}finally{botThinking=false;}},0);
  return;
 }
 let should=false;
 if(activeGame==="ttt")should=!s.ttt.winner&&s.ttt.moves<9&&s.ttt.turn==="O";
 else if(activeGame==="snakes")should=!s.snakes.winner&&s.snakes.turn===1;
 else if(activeGame==="ayo")should=!s.ayo.winner&&s.ayo.turn===1;
 else if(activeGame==="pool")should=!s.pool.winner&&s.pool.turn===1&&s.pool.phase==="ready";
 else if(activeGame==="whot")should=!s.whot.winner&&(s.whot.turn===1||!s.whot.dealt||s.whot.pendingShapePlayer===1);
 else if(activeGame==="ludo")should=!s.ludo.winner&&s.ludo.turn===1;
 else if(activeGame==="quiz")should=s.quiz.answers[0]!==undefined&&s.quiz.answers[1]===undefined;
 else if(activeGame==="truth")should=s.truth.turn===1;
 if(!should)return;botThinking=true;
 setTimeout(async()=>{
  try{await change(st=>{
   const pick=a=>a[Math.floor(Math.random()*a.length)];
   if(activeGame==="ttt"){
    const g=st.ttt;if(!g||g.turn!=="O"||g.winner||g.moves>=9)return;const mark="O",lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let choice=-1;for(const m of ["O","X"]){for(let i=0;i<9;i++)if(!g.cells[i]){g.cells[i]=m;const wins=lines.some(l=>l.every(n=>g.cells[n]===m));g.cells[i]="";if(wins){choice=i;break;}}if(choice>=0)break;}
    if(choice<0){const empty=g.cells.map((v,i)=>v? -1:i).filter(i=>i>=0);choice=pick(empty);}if(choice>=0){g.cells[choice]=mark;g.moves++;if(lines.some(l=>l.every(n=>g.cells[n]===mark)))g.winner="Computer";else g.turn="X";}
   }else if(activeGame==="snakes"){
    const g=st.snakes,roll=1+Math.floor(Math.random()*6);g.dice=roll;let next=g.positions[1];if(next+roll>100){g.message="Computer needs an exact roll to reach 100.";g.turn=0;return;}next+=roll;if(SNAKE_LADDERS[next])next=SNAKE_LADDERS[next];g.positions[1]=next;if(next===100){g.winner="Computer";g.message="Computer wins Snake and Ladder!";}else if(roll!==6)g.turn=0;g.message="Computer rolled "+roll+" and moved to "+next+".";
   }else if(activeGame==="ayo"){
    const g=st.ayo,moves=ayoLegalMoves(g,1);if(moves.length)playAyo(g,pick(moves),1);
   }else if(activeGame==="pool"){
    const g=st.pool,cue=g.balls.find(b=>b.id===0&&!b.pocketed);if(!cue)return;const angle=Math.random()*Math.PI*2,speed=.012+Math.random()*.025;cue.vx=Math.cos(angle)*speed;cue.vy=Math.sin(angle)*speed;g.phase="rolling";g.shots++;g.shotPocketed=g.balls.filter(b=>b.pocketed).map(b=>b.id);g.message="Computer takes the shot.";
   }else if(activeGame==="whot"){
    const g=st.whot;if(!g.dealt){dealWhot(g);return;}if(g.pendingGeneralMarket===1){if(g.turn!==1)return;const hand=g.hands["1"]||[];const card=drawWhotCard(g);if(card){hand.push(card);recordWhotDraw(g,card,1);}g.pendingGeneralMarket=null;g.pendingPenalty=null;g.turn=0;g.message="Computer picked one card from General Market. Your turn.";return;}if(g.pendingShapePlayer===1&&g.pendingShapeIndex!==null){playWhotCard(g,1,g.pendingShapeIndex,Math.floor(Math.random()*5));return;}if(g.turn!==1)return;
    const hand=g.hands["1"]||[];
    const idx=hand.findIndex(c=>whotCanPlay(c,g));if(idx>=0){if(hand[idx].s===5){playWhotCard(g,1,idx,Math.floor(Math.random()*5));}else playWhotCard(g,1,idx);}else if(g.pendingPenalty){const amount=g.pendingPenalty.amount;for(let n=0;n<amount;n++){const card=drawWhotCard(g);if(card){hand.push(card);recordWhotDraw(g,card,1);}}g.pendingPenalty=null;g.turn=0;g.message="Computer picked "+amount+" cards for the penalty. Your turn."; }else{const card=drawWhotCard(g);if(card){hand.push(card);recordWhotDraw(g,card,1);}g.pendingGeneralMarket=null;g.turn=0;g.message="Computer picked a card. Your turn.";}
   }else if(activeGame==="ludo"){
    const g=st.ludo;ensureLudoState(g);if(!Array.isArray(g.rolls)){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);g.rolls=[a,b];g.roll=g.rolls;g.usedDice=[false,false];g.lastRoll=g.rolls;g.selectedDie=null;g.dice=null;}
    let moved=false;for(let i=0;i<2&&!moved;i++){if(g.usedDice[i])continue;g.dice=g.rolls[i];const legal=ludoLegalTokens(g,1);if(legal.length){const mv=pick(legal);g.selectedDie=i;moveLudo(g,1,mv.colour,mv.token);moved=true;}else g.usedDice[i]=true;}
    if(!moved){const extra=g.rolls[0]===6&&g.rolls[1]===6;g.roll=null;g.rolls=null;g.usedDice=[false,false];g.dice=null;if(!extra)g.turn=0;else g.message="Computer rolled double six and rolls again.";}
   }else if(activeGame==="quiz"){st.quiz.answers[1]=Math.floor(Math.random()*4);}
   else if(activeGame==="truth"){st.truth.prompt=pick(truths.concat(dares));st.truth.turn=0;}
  });}finally{botThinking=false;scheduleComputerTurn();setTimeout(scheduleComputerTurn,350);}
 },650);
}

$("createRoom").onclick=createRoom;$("joinRoom").onclick=joinRoom;const playComputer=$("playComputer");if(playComputer)playComputer.onclick=addComputer;
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
document.querySelectorAll(".game").forEach(b=>b.onclick=async()=>{if(!roomId||!db)return say("Create or join a room before choosing a game.");try{await runTransaction(db,async tx=>{const ref=doc(db,"coupleRooms",roomId),snap=await tx.get(ref);if(!snap.exists())throw Error("Room not found.");const data=snap.data();const updates={activeGame:b.dataset.game,gameLaunchId:Date.now()+"-"+Math.random().toString(36).slice(2)};if(b.dataset.game==="pool"&&(!data.state||!data.state.pool))updates["state.pool"]=newPool();if(b.dataset.game==="ayo"&&(!data.state||!data.state.ayo))updates["state.ayo"]=newAyo();tx.update(ref,updates);});activeGame=b.dataset.game;gameOpen=true;document.querySelector(".games").classList.add("hidden");const area=$("gameArea");area.style.display="";area.classList.remove("hidden");renderGame();area.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){say("Could not switch game: "+e.message);}});
$("copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(roomId);say("Room code copied: "+roomId);}catch(e){say("Share this room code: "+roomId);}};
$("leaveRoom").onclick=()=>{saveSession({autoResume:false});if(unsubscribe)unsubscribe();unsubscribe=null;roomId=null;room=null;playerId=null;gameOpen=false;gameLaunchId=null;roomSnapshotInitialized=false;$("gameArea").classList.add("hidden");document.querySelector(".games").classList.remove("hidden");$("roomSection").classList.add("hidden");$("setupPanel").classList.remove("hidden");$("connectionStatus").innerHTML="Firebase ready<br>Not in a room yet";window.scrollTo({top:0,behavior:"smooth"});};
init();