class Player {
    constructor(name, imgSrc, side, ability) {
        this.name = name;
        this.img = new Image();
        this.img.src = imgSrc;
        this.x = side === 'left' ? 100 : 700;
        this.y = 400;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4;
        this.width = 50;
        this.height = 80;
        this.side = side;
        this.hasBall = false;
        this.jumpPower = 12;
        this.onGround = true;
        this.ability = ability;
        this.abilityCooldown = 0;

        // Animation
        this.stepFrame = 0;   // For running animation
        this.stepSpeed = 0.2; // How fast legs move
        this.dribbleOffset = 0; // Ball bounce
    }

    move(direction) {
        this.vx = direction * this.speed;

        // Leg animation
        if (direction !== 0 && this.onGround) {
            this.stepFrame += this.stepSpeed;
            if (this.stepFrame > 3) this.stepFrame = 0; // 4-frame cycle
        }
    }

    jump() {
        if (this.onGround) {
            this.vy = -this.jumpPower;
            this.onGround = false;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Gravity
        this.vy += 0.5;

        // Floor collision
        if (this.y >= 400) {
            this.y = 400;
            this.vy = 0;
            this.onGround = true;
        }

        // Cooldown
        if (this.abilityCooldown > 0) this.abilityCooldown--;

        // Ball dribble animation
        if (this.hasBall && this.onGround) {
            this.dribbleOffset = Math.sin(Date.now()/200)*5;
        } else {
            this.dribbleOffset = 0;
        }
    }

    draw(ctx) {
        // Draw player
        ctx.drawImage(
            this.img,
            this.x,
            this.y,
            this.width,
            this.height
        );

        // Draw ball on player if hasBall
        if (this.hasBall) {
            ctx.drawImage(
                ballImg,
                this.x + this.width/2 - 15,
                this.y + this.height/2 + this.dribbleOffset,
                30, 30
            );
        }
    }

    shoot(ball, isPlayer=true) {
        if (!ball.isFlying && this.hasBall) {
            let distance = Math.hypot(this.x - ball.hoopX, this.y - ball.hoopY);
            let chance = distance < 200 ? 0.8 : 0.6;
            if (!isPlayer) chance = 1; // AI always shoots
            if (Math.random() <= chance) ball.flyToHoop(this.x, this.y);
            else ball.missShot(this.x, this.y);
            this.hasBall = false;
        }
    }

    useAbility(ball, opponents) {
        if (this.abilityCooldown === 0 && this.ability && this.hasBall) {
            if (this.ability === 'megaDunk') ball.megaDunk(this.x, this.y);
            else if (this.ability === 'shield') opponents.forEach(op => op.shield = 100);
            else if (this.ability === 'superAlley') ball.superAlley(this.x, this.y);

            this.hasBall = false;
            this.abilityCooldown = 300;
        }
    }
}
