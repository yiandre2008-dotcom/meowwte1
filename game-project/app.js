const startBtn = document.getElementById("start-btn");
const menuScreen = document.getElementById("menu-screen");
const basket = document.getElementById("basket");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const highscoreEl = document.getElementById("highscore");
const gameArea = document.getElementById("game-area");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");
const gameOverTitle = document.getElementById("game-over-title");
const promoCodeEl = document.getElementById("promo-code");

let score = 0;
let lives = 3;
let highscore = parseInt(localStorage.getItem("highscore")) || 0;
highscoreEl.textContent = highscore;
let gameInterval;
let spawnInterval;
let gameRunning = false;

// --- Audio ---
const bgm = new Audio("audio/bgm.wav");
bgm.loop = true;
bgm.volume = 0.5;

const beanSound = new Audio("audio/bean.wav");
const cabeSound = new Audio("audio/cabe.wav");
const gameoverSound = new Audio("audio/gameover.wav");
const winSound = new Audio("audio/win.wav");

// --- Event Listener ---
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  startGame();
});
menuBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  menuScreen.style.display = "flex";
});


promoCodeEl.addEventListener("click", () => {
  if (promoCodeEl.textContent) {
    const code = promoCodeEl.textContent.replace("🎁 Kode Promo: ", "").trim();
    navigator.clipboard.writeText(code).then(() => {
      alert("Kode promo berhasil disalin: " + code);
    });
  }
});

function generatePromoCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MEOW-";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function startGame() {
  score = 0;
  lives = 3;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  menuScreen.style.display = "none";
  gameArea.style.display = "block";
  gameRunning = true;

 
  bgm.currentTime = 0;
  bgm.play();

  gameInterval = setInterval(updateGame, 50);
  spawnInterval = setInterval(spawnObject, 1500);

  // reset pesan di layar game over
  gameOverTitle.textContent = "Game Over";
  promoCodeEl.textContent = "";
}

function endGame() {
  gameRunning = false;
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  bgm.pause();
  gameoverSound.play();

  if (score > highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore);
    highscoreEl.textContent = highscore;
  }

  gameArea.style.display = "none";
  gameOverScreen.style.display = "flex";
  finalScoreEl.textContent = score;

  gameOverTitle.textContent = "Game Over";
  promoCodeEl.textContent = "";
}

function winGame() {
  gameRunning = false;
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  bgm.pause();
  winSound.play();

  if (score > highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore);
    highscoreEl.textContent = highscore;
  }

  gameArea.style.display = "none";
  gameOverScreen.style.display = "flex";
  finalScoreEl.textContent = score;

  gameOverTitle.textContent = "🎉 Kamu Menang! 🎉";
  promoCodeEl.textContent = "🎁 Kode Promo: " + generatePromoCode();
}

function spawnObject() {
  if (!gameRunning) return;

  const isCabe = Math.random() < 0.2;
  const obj = document.createElement("img");
  obj.src = isCabe ? "img/cabe.png" : "img/bean.png";
  obj.className = "falling";

  const size = 40;
  obj.style.width = size + "px";
  obj.style.top = "-50px";

  const maxX = gameArea.clientWidth - size;
  obj.style.left = Math.random() * maxX + "px";

  const fallDuration = 2 + Math.random() * 2;
  obj.style.animationDuration = fallDuration + "s";

  gameArea.appendChild(obj);

  obj.addEventListener("animationend", () => {
    if (gameArea.contains(obj)) {
      obj.remove();
      if (!isCabe) {
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) endGame();
      }
    }
  });
}

function updateGame() {
  const objects = document.querySelectorAll(".falling");
  const basketRect = basket.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();

  objects.forEach(obj => {
    const objRect = obj.getBoundingClientRect();

    if (
      objRect.bottom >= basketRect.top &&
      objRect.left < basketRect.right &&
      objRect.right > basketRect.left &&
      objRect.bottom <= gameRect.bottom
    ) {
      const isCabe = obj.src.includes("cabe.png");
      if (isCabe) {
        obj.classList.add("explode");
        obj.addEventListener("animationend", () => obj.remove());
        cabeSound.play();

        if (score > 0) {
          score = 0;
          scoreEl.textContent = score;
        } else {
          lives = 0;
          livesEl.textContent = lives;
          endGame();
        }
      } else {
        score++;
        scoreEl.textContent = score;
        beanSound.play();
        obj.remove();
        if (score >= 10) winGame();
      }
    }
  });
}


const videoElement = document.createElement("video");
videoElement.style.display = "none";
document.body.appendChild(videoElement);

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

function onResults(results) {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    const nose = landmarks[4]; 
    let x = (1 - nose.x) * gameArea.clientWidth;
    x = Math.max(0, Math.min(x, gameArea.clientWidth - basket.offsetWidth));
    basket.style.left = x + "px";
  }
}
