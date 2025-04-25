/* =======================================================
   GLOBAL RESET & BASE STYLES (Mobile-First)
======================================================= */
/* global firebase */
/* jshint esversion: 6 */

// =========================
// Firebase Initialization (RTDB using Compat SDK)
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyBJ4xlHJ-gw1i-njOeuoX5shRtJ6G7vg8I",
  authDomain: "memory-b0d16.firebaseapp.com",
  projectId: "memory-b0d16",
  storageBucket: "memory-b0d16.appspot.com",
  messagingSenderId: "1081029476081",
  appId: "1:1081029476081:web:0678dc8a912cd8f202b350",
  measurementId: "G-PXM46CJPCW",
  databaseURL: "https://memory-b0d16-default-rtdb.europe-west1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const dbRT = firebase.database(); // Using Realtime Database

// =========================
// DOM Elements & Global Variables
// =========================
const gameContainer   = document.getElementById('gameContainer');
const movesCountElem  = document.getElementById('movesCount');
const timeCountElem   = document.getElementById('timeCount');
const bestRecordElem  = document.getElementById('bestRecord');
const bestNameInput   = document.getElementById('bestNameInput');
const resetBtn        = document.getElementById('resetBtn');
const difficultySelect = document.getElementById('difficulty');

const easyImages = [
  'images/8-card/emoji-1.png',
  'images/8-card/emoji-2.png',
  'images/8-card/emoji-3.png',
  'images/8-card/emoji-4.png'
];

const normalImages = [
  'images/12-card/emoji-1.png',
  'images/12-card/emoji-2.png',
  'images/12-card/emoji-3.png',
  'images/12-card/emoji-4.png',
  'images/12-card/emoji-5.png',
  'images/12-card/emoji-6.png'
];

const hardImages = [
  'images/24-card/emoji-1.png',
  'images/24-card/emoji-2.png',
  'images/24-card/emoji-3.png',
  'images/24-card/emoji-4.png',
  'images/24-card/emoji-5.png',
  'images/24-card/emoji-6.png',
  'images/24-card/emoji-7.png',
  'images/24-card/emoji-8.png',
  'images/24-card/emoji-9.png',
  'images/24-card/emoji-10.png',
  'images/24-card/emoji-11.png',
  'images/24-card/emoji-12.png'
];

let movesCount   = 0;
let timer;
let timeElapsed  = 0;
let firstCard    = null;
let secondCard   = null;
let lockBoard    = false;
let matchedPairs = 0;
let totalPairs   = 0;

// =========================
// Helper: Shuffle (Fisher–Yates)
// =========================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// =========================
// Generate Cards (8, 12 or 24 total)
// =========================
function generateCards(totalCards) {
  totalPairs = totalCards / 2;
  let values = [];

  if (totalCards === 8) {
    values = easyImages.slice(0, totalPairs);
  } else if (totalCards === 12) {
    values = normalImages.slice(0, totalPairs);
  } else if (totalCards === 24) {
    values = hardImages.slice(0, totalPairs);
  } else {
    // fallback to easy
    values = easyImages.slice(0, totalPairs);
  }

  // duplicate and shuffle
  return shuffleArray([...values, ...values]);
}

// =========================
// Render & Flip Logic
// =========================
function renderCards(cardValues) {
  gameContainer.innerHTML = '';
  cardValues.forEach(value => {
    const card = document.createElement('div');
    card.classList.add('card');

    const inner = document.createElement('div');
    inner.classList.add('card-inner');

    const front = document.createElement('div');
    front.classList.add('card-front');

    const back = document.createElement('div');
    back.classList.add('card-back');
    back.style.backgroundImage = `url(${value})`;

    inner.append(front, back);
    card.append(inner);

    card.addEventListener('click', () => flipCard(card));
    gameContainer.append(card);
  });
}

function flipCard(card) {
  if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');

  if (!firstCard) {
    firstCard = card;
    return;
  }
  secondCard = card;
  movesCountElem.textContent = ++movesCount;
  checkForMatch();
}

function checkForMatch() {
  const a = firstCard.querySelector('.card-back').style.backgroundImage;
  const b = secondCard.querySelector('.card-back').style.backgroundImage;

  if (a === b) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    matchedPairs++;
    resetSelections();

    if (matchedPairs === totalPairs) {
      clearInterval(timer);
      setTimeout(() => {
        alert(`You win! Moves: ${movesCount}, Time: ${timeElapsed}s`);
        updateBestTime();
      }, 500);
    }
  } else {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetSelections();
    }, 1000);
  }
}

function resetSelections() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

// =========================
// Timer
// =========================
function startTimer() {
  clearInterval(timer);
  timeElapsed = 0;
  timeCountElem.textContent = timeElapsed;
  timer = setInterval(() => {
    timeCountElem.textContent = ++timeElapsed;
  }, 1000);
}

// =========================
// High-Score via RTDB
// =========================
function updateBestTime() {
  const difficulty = difficultySelect.value;
  const scoreRef = dbRT.ref(`highscores/${difficulty}`);

  scoreRef.once('value')
    .then(snapshot => {
      const data = snapshot.val();
      if (!data || timeElapsed < data.score) {
        bestNameInput.style.display = 'block';
        bestNameInput.value = '';
        bestNameInput.focus();
        bestNameInput.addEventListener('keydown', bestNameKeyDownHandler);
      } else {
        displayHighScore();
      }
    });
}

function bestNameKeyDownHandler(e) {
  if (e.key === 'Enter') {
    const difficulty = difficultySelect.value;
    const scoreRef = dbRT.ref(`highscores/${difficulty}`);
    scoreRef.set({
      name: bestNameInput.value,
      score: timeElapsed,
      difficulty,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(displayHighScore);

    bestNameInput.removeEventListener('keydown', bestNameKeyDownHandler);
    bestNameInput.style.display = 'none';
  }
}

function displayHighScore() {
  const difficulty = difficultySelect.value;
  const scoreRef = dbRT.ref(`highscores/${difficulty}`);
  scoreRef.once('value').then(snapshot => {
    const data = snapshot.val();
    bestRecordElem.textContent = data
      ? `Best: ${data.score}s by ${data.name}`
      : 'Best: N/A';
    bestNameInput.style.display = 'none';
  });
}

// =========================
// Desktop Layout Adjust
// =========================
function applyDesktopLayout(totalCards) {
  gameContainer.classList.remove('easy-desktop','normal-desktop','hard-desktop');
  if (window.innerWidth >= 1200) {
    if (totalCards === 8) {
      gameContainer.classList.add('easy-desktop');
    } else if (totalCards === 12) {
      gameContainer.classList.add('normal-desktop');
    } else if (totalCards === 24) {
      gameContainer.classList.add('hard-desktop');
    }
  }
}

// =========================
// Init
// =========================
function initGame() {
  movesCount   = 0;
  matchedPairs = 0;
  resetSelections();
  startTimer();
  movesCountElem.textContent = movesCount;

  displayHighScore();

  const totalCards = parseInt(difficultySelect.value, 10);
  renderCards(generateCards(totalCards));
  applyDesktopLayout(totalCards);
}

window.addEventListener('DOMContentLoaded', initGame);
window.addEventListener('resize', () => applyDesktopLayout(parseInt(difficultySelect.value,10)));
difficultySelect.addEventListener('change', initGame);
resetBtn.addEventListener('click', initGame);
