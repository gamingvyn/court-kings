function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(courtImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(hoopImg, canvas.width - 150, 350, 100, 100);

    // Update players
    players.forEach(p => {
        if (p.side === 'left') {
            if (keys['ArrowLeft']) p.move(-1);
            else if (keys['ArrowRight']) p.move(1);
            else p.move(0);

            if (keys['ArrowUp']) p.jump();
            if (keys['x']) p.shoot(ball, true);
            if (keys['z']) p.useAbility(ball, players.filter(op => op.side !== p.side));
        }

        p.update();
        p.draw(ctx);

        // Auto release if jump without shooting
        if (!p.onGround && !keys['x'] && p.hasBall && p.vy > 0) p.shoot(ball, true);
    });

    // Update ball
    ball.update();
    if (!players.some(p => p.hasBall)) ball.draw(); // Ball drawn only if not held

    requestAnimationFrame(gameLoop);
}
