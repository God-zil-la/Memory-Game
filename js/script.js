/* global firebase */
/* jshint esversion: 6 */

/* ------------ Firebase ------------ */
firebase.initializeApp({
  apiKey: "AIzaSyBJ4xlHJ-gw1i-njOeuoX5shRtJ6G7vg8I",
  authDomain: "memory-b0d16.firebaseapp.com",
  projectId: "memory-b0d16",
  storageBucket: "memory-b0d16.appspot.com",
  messagingSenderId: "1081029476081",
  appId: "1:1081029476081:web:0678dc8a912cd8f202b350",
  databaseURL: "https://memory-b0d16-default-rtdb.europe-west1.firebasedatabase.app"
});
const dbRT = firebase.database();

/* ------------ DOM ------------ */
const gameContainer    = document.getElementById('gameContainer');
const movesCountElem   = document.getElementById('movesCount');
const timeCountElem    = document.getElementById('timeCount');
const bestRecordElem   = document.getElementById('bestRecord');
const bestNameInput    = document.getElementById('bestNameInput');
const difficultySelect = document.getElementById('difficulty');
const resetBtn         = document.getElementById('resetBtn');

/* ------------ Image paths (now ABSOLUTE for /assets) ------------ */
const easyImages = [
  'assets/images/8-card/emoji-1.png',
  'assets/images/8-card/emoji-2.png',
  'assets/images/8-card/emoji-3.png',
  'assets/images/8-card/emoji-4.png'
];
const normalImages = [
  'assets/images/12-card/emoji-1.png',
  'assets/images/12-card/emoji-2.png',
  'assets/images/12-card/emoji-3.png',
  'assets/images/12-card/emoji-4.png',
  'assets/images/12-card/emoji-5.png',
  'assets/images/12-card/emoji-6.png'
];
const hardImages = [
  'assets/images/24-card/emoji-1.png',
  'assets/images/24-card/emoji-2.png',
  'assets/images/24-card/emoji-3.png',
  'assets/images/24-card/emoji-4.png',
  'assets/images/24-card/emoji-5.png',
  'assets/images/24-card/emoji-6.png',
  'assets/images/24-card/emoji-7.png',
  'assets/images/24-card/emoji-8.png',
  'assets/images/24-card/emoji-9.png',
  'assets/images/24-card/emoji-10.png',
  'assets/images/24-card/emoji-11.png',
  'assets/images/24-card/emoji-12.png'
];

/* ------------ Helpers ------------ */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function resetPairs(){[first,second]=[null,null];lock=false;}
function startTimer(){clearInterval(timer);time=0;timeCountElem.textContent=0;timer=setInterval(()=>timeCountElem.textContent=++time,1000);}

/* ------------ State ------------ */
let moves=0,time=0,timer;
let first=null,second=null,lock=false;
let matched=0,totalPairs=0;

/* ------------ Card generation ------------ */
function makeDeck(total){
  totalPairs=total/2;
  const src=total===8?easyImages:total===12?normalImages:hardImages;
  return shuffle([...src.slice(0,totalPairs),...src.slice(0,totalPairs)]);
}

/* ------------ Render ------------ */
function render(deck){
  gameContainer.innerHTML='';
  deck.forEach(src=>{
    const card=document.createElement('div'),
          inner=document.createElement('div'),
          front=document.createElement('div'),
          back=document.createElement('div');

    card.className='card';
    inner.className='card-inner';
    front.className='card-front';
    back.className='card-back';
    back.style.backgroundImage=`url(${src})`;

    inner.append(front,back);card.append(inner);
    card.addEventListener('click',()=>flip(card));
    gameContainer.append(card);
  });
}

/* ------------ Gameplay ------------ */
function flip(card){
  if(lock||card.classList.contains('flipped')||card.classList.contains('matched'))return;
  card.classList.add('flipped');
  if(!first){first=card;return;}
  second=card;movesCountElem.textContent=++moves;
  const a=first.querySelector('.card-back').style.backgroundImage,
        b=second.querySelector('.card-back').style.backgroundImage;

  if(a===b){first.classList.add('matched');second.classList.add('matched');matched++;resetPairs();if(matched===totalPairs)win();}
  else{lock=true;setTimeout(()=>{first.classList.remove('flipped');second.classList.remove('flipped');resetPairs();},900);}
}

function win(){clearInterval(timer);alert(`You win! Moves: ${moves}  Time: ${time}s`);saveHighScore();}

/* ------------ High-score ------------ */
function saveHighScore(){
  const diff=difficultySelect.value, ref=dbRT.ref(`highscores/${diff}`);
  ref.once('value').then(snap=>{
    const d=snap.val();
    if(!d||time<d.score){
      bestNameInput.classList.remove('hidden');bestNameInput.value='';bestNameInput.focus();
      bestNameInput.onkeydown=e=>{
        if(e.key!=='Enter')return;
        ref.set({name:bestNameInput.value.trim()||'Anon',score:time}).then(showHigh);
        bestNameInput.classList.add('hidden');bestNameInput.onkeydown=null;
      };
    }else showHigh();
  });
}
function showHigh(){
  const diff=difficultySelect.value;
  dbRT.ref(`highscores/${diff}`).once('value').then(s=>{const d=s.val();bestRecordElem.textContent=d?`Best: ${d.score}s by ${d.name}`:'Best: N/A';});
}

/* ------------ Layout ------------ */
function layout(total){
  gameContainer.classList.remove('easy-desktop','normal-desktop','hard-desktop');
  if(innerWidth>=1200){
    if(total===8)  gameContainer.classList.add('easy-desktop');
    if(total===12) gameContainer.classList.add('normal-desktop');
    if(total===24) gameContainer.classList.add('hard-desktop');
  }
}

/* ------------ Init ------------ */
function init(){
  moves=0;matched=0;resetPairs();startTimer();
  movesCountElem.textContent=0;showHigh();
  const total=parseInt(difficultySelect.value,10);
  render(makeDeck(total));layout(total);
}

window.addEventListener('DOMContentLoaded',init);
window.addEventListener('resize',()=>layout(parseInt(difficultySelect.value,10)));
difficultySelect.addEventListener('change',init);
resetBtn.addEventListener('click',init);
