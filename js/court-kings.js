const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fsBtn = document.getElementById("fullscreenBtn");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Fullscreen toggle
fsBtn.onclick = () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen().catch(console.error);
  } else {
    document.exitFullscreen();
  }
};

// 🖼️ Load images
const imgCourt = new Image();
imgCourt.src = "assets/court.png";
const imgPlayer = new Image();
imgPlayer.src = "assets/player1.png";
const imgAI = new Image();
imgAI.src = "assets/ai.png";
const imgBall = new Image();
imgBall.src = "assets/ball.png";

// Game objects
const player = { x: 150, y: 400, w: 70, h: 70, holding: true, ability: SELECTED_PLAYER.ability, abilityReady: true };
const ai = { x: 500, y: 400, w: 70, h: 70, holding: false };
const ball = { x: 180, y: 390, r: 10, dx: 0, dy: 0, heldBy: "player" };
const hoop = { x: 600, y: 150, w: 100, h: 10 };
let score = { player: 0, ai: 0 };

// Input
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function shoot() {
  if (player.holding) {
    ball.heldBy = null;
    player.holding = false;
    ball.dx = 5;
    ball.dy = -10;
  }
}

function useAbility() {
  if (!player.abilityReady) return;
  player.abilityReady = false;
  setTimeout(() => (player.abilityReady = true), 4000);

  if (player.ability === "megaDunk") {
    player.x = hoop.x;
    player.y = hoop.y + 100;
    score.player += 2;
    resetPositions();
  } else if (player.ability === "shield") {
    ctx.fillStyle = "rgba(0,255,255,0.5)";
    ctx.fillRect(hoop.x, hoop.y - 10, hoop.w, 10);
  } else if (player.ability === "superAlleyOop") {
    player.x = hoop.x;
    player.y = hoop.y - 50;
    score.player += 2;
    resetPositions();
  }
}

function resetPositions() {
  player.x = 150; player.y = 400;
  ai.x = 500; ai.y = 400;
  ball.x = player.x + 30; ball.y = 390;
  ball.heldBy = "player";
  player.holding = true;
}

function update() {
  if (keys["arrowleft"]) player.x -= 5;
  if (keys["arrowright"]) player.x += 5;
  if (keys["arrowup"]) player.y -= 5;
  if (keys["arrowdown"]) player.y += 5;
  if (keys["x"]) shoot();
  if (keys["e"]) useAbility();

  if (ball.heldBy === "player") {
    ball.x = player.x + 25;
    ball.y = player.y;
  }

  if (!ball.heldBy) {
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dy += 0.5;
    if (ball.y + ball.r > canvas.height) {
      ball.y = canvas.height - ball.r;
      ball.dy *= -0.6;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 🏀 Draw court first (background)
  if (imgCourt.complete) {
    ctx.drawImage(imgCourt, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 🧍 Player
  if (imgPlayer.complete) {
    ctx.drawImage(imgPlayer, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = "gold";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // 🤖 AI
  if (imgAI.complete) {
    ctx.drawImage(imgAI, ai.x, ai.y, ai.w, ai.h);
  } else {
    ctx.fillStyle = "blue";
    ctx.fillRect(ai.x, ai.y, ai.w, ai.h);
  }

  // 🏀 Ball
  if (imgBall.complete) {
    ctx.drawImage(imgBall, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
  } else {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Court Kings", 20, 40);
  ctx.fillText(`Score: You ${score.player} - AI ${score.ai}`, 20, 70);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
