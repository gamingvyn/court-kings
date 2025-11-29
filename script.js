const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.getElementById("scoreValue");
let score = 0;

// Load sounds
const swishSound = document.getElementById("swishSound");
const rimSound = document.getElementById("rimSound");

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    radius: 20,
    vx: 0,
    vy: 0,
    gravity: 0.4,
    isShooting: false
};

// Hoop
const hoop = {
    x: canvas.width - 300,
    y: canvas.height / 3,
    width: 120,
    height: 10,
    rimLeft: 0,
    rimRight: 0
};

hoop.rimLeft = hoop.x + 10;
hoop.rimRight = hoop.x + hoop.width - 10;

// Shooting logic
window.addEventListener("click", () => {
    if (!ball.isShooting) {
        ball.isShooting = true;
        const power = 15;

        // Curved arc
        ball.vx = (hoop.x - ball.x) * 0.015;
        ball.vy = (hoop.y - ball.y) * 0.03 - power;
    }
});

function update() {
    if (ball.isShooting) {
        ball.vy += ball.gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Rim scoring detection
        if (
            ball.y < hoop.y + hoop.height &&
            ball.x > hoop.rimLeft &&
            ball.x < hoop.rimRight
        ) {
            swishSound.play();
            score++;
            scoreEl.textContent = score;
            resetBall();
        }

        // Missed or out of bounds
        if (ball.y <= 0 || ball.y > canvas.height) {
            rimSound.play();
            resetBall();
        }
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hoop
    ctx.fillStyle = "orange";
    ctx.fillRect(hoop.x, hoop.y, hoop.width, hoop.height);

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8c00";
    ctx.fill();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 80;
    ball.vx = 0;
    ball.vy = 0;
    ball.isShooting = false;
}

update();
