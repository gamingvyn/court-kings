const canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

// Load assets
const courtImg = new Image();
courtImg.src = 'assets/court.png';

const hoopImg = new Image();
hoopImg.src = 'assets/hoop.png';

const ballImg = new Image();
ballImg.src = 'assets/ball.png';

// Ball logic
class Ball {
    constructor() {
        this.x = 200;
        this.y = 400;
        this.vx = 0;
        this.vy = 0;
        this.isFlying = false;
        this.hoopX = canvas.width - 150;
        this.hoopY = 380;
    }

    flyToHoop(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.isFlying = true;
        this.vx = (this.hoopX - startX)/30;
        this.vy = (this.hoopY - startY)/30;
    }

    missShot(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.isFlying = true;
        this.vx = (Math.random()*200-100)/30;
        this.vy = -5;
    }

    megaDunk(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.isFlying = true;
        this.vx = (this.hoopX - startX)/20;
        this.vy = (this.hoopY - startY - 50)/20;
    }

    superAlley(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.isFlying = true;
        this.vx = (this.hoopX - startX)/15;
        this.vy = (this.hoopY - startY - 150)/15;
    }

    update() {
        if (this.isFlying) {
            this.x += this.vx;
            this.y += this.vy;
            if (Math.abs(this.x - this.hoopX) < 10 && Math.abs(this.y - this.hoopY) < 10) {
                this.isFlying = false;
            }
        }
    }

    draw() {
        ctx.drawImage(ballImg, this.x, this.y, 30, 30);
    }
}

const ball = new Ball();

// Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Main loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(courtImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(hoopImg, canvas.width - 150, 350, 100, 100);

    // Update players
    players.forEach(p => {
        // Player controls (for left side only)
        if (p.side === 'left') {
            if (keys['ArrowLeft']) p.move(-1);
            else if (keys['ArrowRight']) p.move(1);
            else p.move(0);

            if (keys['ArrowUp']) p.jump();
            if (keys['x']) p.shoot(ball, true);
            if (keys['z']) p.useAbility(ball, players.filter(op => op.side !== p.side));
            if (keys['ArrowDown']) {} // pump fake animation logic
        }

        p.update();
        ctx.drawImage(p.img, p.x, p.y, p.width, p.height);

        // Auto release if jumped but did not shoot
        if (!p.onGround && !keys['x'] && p.hasBall) {
            if (p.vy > 0) { // falling
                p.shoot(ball, true);
            }
        }
    });

    // Update ball
    ball.update();
    ball.draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();
