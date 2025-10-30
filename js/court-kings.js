// js/court-kings.js
// Court Kings - single-file game logic (requires players.js loaded first)

// sanitize presence of players.js
if (typeof SELECTED_PLAYER === 'undefined') {
  throw new Error('players.js must be included before court-kings.js and define SELECTED_PLAYER');
}

/* -------------------------
   CONSTANTS & DOM
   ------------------------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fsBtn = document.getElementById('fsBtn');
const hudScore = document.querySelector('#scoreboard');
const hudAbility = document.querySelector('#abilityIndicator');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// fullscreen
fsBtn?.addEventListener('click', () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Auto focus canvas so iPad keyboards send events
window.addEventListener('load', () => { 
  setTimeout(()=> {
    canvas.focus?.();
    try { canvas.setAttribute('tabindex', '0'); canvas.focus(); } catch(e){}
  }, 200);
});

/* -------------------------
    Assets (images + optional sounds)
   ------------------------- */
const ASSETS = {
  playerSprite: SELECTED_PLAYER.sprite || 'assets/player1.png',
  ball: 'assets/ball.png',
  hoop: 'assets/hoop.png',
  court: 'assets/court-bg.png'
};
const images = {};
function loadImages(list, cb) {
  const keys = Object.keys(list);
  let loaded = 0;
  keys.forEach(k => {
    const img = new Image();
    img.src = list[k];
    img.onload = () => {
      images[k] = img;
      loaded++; if (loaded === keys.length) cb && cb();
    };
    img.onerror = () => {
      // broken image; still continue with a placeholder
      images[k] = null;
      loaded++; if (loaded === keys.length) cb && cb();
    };
  });
}
loadImages(ASSETS, startGame);

/* -------------------------
   GAME STATE
   ------------------------- */
const SCORE = { player: 0, ai: 0 };

const BASE_STATS = {
  speed: 6,
  shootPower: 12,
  jumpPower: 14,
};

const player = {
  x: 100, y: 0,
  w: 64, h: 64,
  dx:0, dy:0,
  speed: BASE_STATS.speed,
  holding: true,
  ability: SELECTED_PLAYER.ability || null,
  abilityReady: true,
  abilityCooldown: 4000, // ms
  shieldActive: false
};

const ai = {
  x: 400, y: 0,
  w: 64, h: 64,
  dx: 2,
  holding: false,
  ability: PLAYER_LIBRARY[1]?.ability || null,
  abilityReady: true,
  shieldActive: false
};

const hoop = {
  x: 0, y: 0, w: 120, h: 10
};

const ball = {
  x: 0, y: 0, r: 16, dx:0, dy:0, heldBy: 'player' // 'player' or 'ai' or null
};

// on-screen action states for touch
const touchState = { left:false, right:false, up:false, down:false, shoot:false, ability:false };

/* -------------------------
   HELPER FUNCTIONS
   ------------------------- */

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function now(){ return (new Date()).getTime(); }

function resetBallTo(holder){
  ball.dx = 0; ball.dy = 0;
  ball.heldBy = holder;
  if(holder === 'player'){
    player.holding = true; ai.holding = false;
    ball.x = player.x + player.w/2;
    ball.y = player.y + 8;
  } else if(holder === 'ai'){
    ai.holding = true; player.holding = false;
    ball.x = ai.x + ai.w/2;
    ball.y = ai.y + 8;
  } else {
    player.holding = ai.holding = false;
  }
}

function scoreFor(side, points=2){
  if(side === 'player') SCORE.player += points;
  else SCORE.ai += points;
  // simple celebration placeholder
  // reset positions and ball
  player.x = canvas.width*0.25;
  player.y = canvas.height - 150;
  ai.x = canvas.width*0.75;
  ai.y = canvas.height - 150;
  resetBallTo('player');
  updateHUD();
}

function updateHUD(){
  hudScore.textContent = `You: ${SCORE.player} — AI: ${SCORE.ai}`;
  hudAbility.textContent = `Ability: ${player.ability || 'None'}`;
}

/* -------------------------
   ABILITIES
   - megaDunk: fly to hoop, auto-2 (works even behind 3pt)
   - shield: activate shield for short duration, blocks scoring for target
   - superAlleyOop: teleport above hoop and dunk (auto 2)
   ------------------------- */

function useAbility_who(who){ // who: 'player' or 'ai'
  const agent = (who === 'player') ? player : ai;
  if(!agent.ability || !agent.abilityReady) return false;

  agent.abilityReady = false;
  setTimeout(()=> agent.abilityReady = true, agent.abilityCooldown);

  if(agent.ability === 'megaDunk'){
    // Move agent toward the hoop and score
    agent.x = hoop.x + hoop.w/2 - agent.w/2;
    agent.y = hoop.y - agent.h - 10;
    resetBallTo(who);
    // simulate immediate dunk
    setTimeout(()=> {
      scoreFor(who, 2);
    }, 220);
    return true;
  }

  if(agent.ability === 'shield'){
    agent.shieldActive = true;
    // play sound if available
    setTimeout(()=> { agent.shieldActive = false; }, 3000);
    return true;
  }

  if(agent.ability === 'superAlleyOop'){
    // teleport above net then dunk
    agent.x = hoop.x + hoop.w/2 - agent.w/2;
    agent.y = hoop.y - agent.h - 80; // above hoop
    resetBallTo(who);
    setTimeout(()=> {
      scoreFor(who, 2);
    }, 220);
    return true;
  }

  return false;
}

/* -------------------------
   INPUT (keyboard + touch)
   ------------------------- */
const keys = {};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  // X shoot/slap
  if(k === 'x') handleShoot('player');

  // E ability
  if(k === 'e') useAbility_who('player');

  // keep canvas focused
  canvas.focus && canvas.focus();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// touch buttons
function wireTouchBtn(id, downCb, upCb){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); downCb(); }, {passive:false});
  el.addEventListener('touchend', e => { e.preventDefault(); upCb(); }, {passive:false});
}
wireTouchBtn('btnLeft', ()=> touchState.left = true, ()=> touchState.left = false);
wireTouchBtn('btnRight', ()=> touchState.right = true, ()=> touchState.right = false);
wireTouchBtn('btnUp', ()=> touchState.up = true, ()=> touchState.up = false);
wireTouchBtn('btnDown', ()=> touchState.down = true, ()=> touchState.down = false);
wireTouchBtn('btnShoot', ()=> { touchState.shoot = true; handleShoot('player'); }, ()=> touchState.shoot = false);
wireTouchBtn('btnAbility', ()=> { touchState.ability = true; useAbility_who('player'); }, ()=> touchState.ability = false);

/* -------------------------
   CORE GAME LOGIC
   ------------------------- */

function handleShoot(who){
  if(who === 'player'){
    if(player.holding){
      // launch ball
      const power = BASE_STATS.shootPower;
      ball.heldBy = null; player.holding = false;
      ball.dx = (keys['arrowright']|| touchState.right ? 2 : keys['arrowleft']||touchState.left ? -2 : 0);
      ball.dy = -power;
    } else {
      // optionally slap attempt if close to ball
      // not implemented as separate action here
    }
  } else if(who === 'ai'){
    // ai shoots with some randomness
    if(ai.holding){
      ball.heldBy = null; ai.holding = false;
      ball.dx = (Math.random()*4 - 2);
      ball.dy = - (BASE_STATS.shootPower - 2);
    }
  }
}

function aiLogic(dt){
  // basic ai: move randomly, attempt shots occasionally, use ability sometimes
  // ai will move left/right near player randomly
  const dir = Math.sign(player.x - ai.x);
  ai.x += dir * 1.4; // slight chase

  // random shoot: if ai holds and close to hoop horizontally, shoot
  if(ai.holding && Math.abs((ai.x + ai.w/2) - (hoop.x + hoop.w/2)) < 120){
    if(Math.random() < 0.008) handleShoot('ai');
    // try ability rarely
    if(ai.ability && ai.abilityReady && Math.random() < 0.005) useAbility_who('ai');
  }
}

/* -------------------------
   PHYSICS & COLLISIONS
   ------------------------- */

function updatePhysics(dt){
  // player movement - keyboard / touch
  let vx=0, vy=0;
  if(keys['arrowleft'] || touchState.left) vx -= player.speed;
  if(keys['arrowright']|| touchState.right) vx += player.speed;
  if(keys['arrowup']   || touchState.up) vy -= player.speed;
  if(keys['arrowdown'] || touchState.down) vy += player.speed;
  player.x = clamp(player.x + vx, 0, canvas.width - player.w);
  player.y = clamp(player.y + vy, 0, canvas.height - player.h);

  // ai clamp
  ai.x = clamp(ai.x, 0, canvas.width - ai.w);
  ai.y = clamp(ai.y, 0, canvas.height - ai.h);

  // ball physics if free
  if(ball.heldBy === null){
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dy += 0.5; // gravity
    // bounce floor
    if(ball.y + ball.r > canvas.height){
      ball.y = canvas.height - ball.r;
      ball.dy *= -0.6;
      // friction
      ball.dx *= 0.96;
    }
    // walls
    if(ball.x - ball.r < 0){ ball.x = ball.r; ball.dx *= -1; }
    if(ball.x + ball.r > canvas.width){ ball.x = canvas.width - ball.r; ball.dx *= -1; }

    // check hoop scoring zone (simple rectangle over hoop)
    const hx = hoop.x, hy = hoop.y, hw = hoop.w, hh = 40;
    if(ball.x > hx && ball.x < hx+hw && ball.y - ball.r < hy + hh && ball.dy > -6){
      // check shield
      const blocked = (player.shieldActive && ball.heldBy === 'ai') || (ai.shieldActive && ball.heldBy === 'player');
      if(!blocked){
        // if ball was last touched by player or ai, give score to them (simplified)
        // If ball was free we attribute score to nearest agent
        const scorer = (ball.lastTouch === 'player') ? 'player' : (ball.lastTouch === 'ai' ? 'ai' : (Math.abs(ball.x - (player.x+player.w/2)) < Math.abs(ball.x - (ai.x+ai.w/2)) ? 'player' : 'ai'));
        scoreFor(scorer, 2);
      } else {
        // bounce off shield
        ball.dx = -ball.dx; ball.dy = -6;
      }
    }

    // pickup: if player near ball and ball slow, pick up
    if(ball.heldBy === null){
      const toPlayer = Math.hypot(ball.x - (player.x+player.w/2), ball.y - (player.y+player.h/2));
      const toAi     = Math.hypot(ball.x - (ai.x+ai.w/2), ball.y - (ai.y+ai.h/2));
      if(toPlayer < 40 && Math.abs(ball.dy) < 6){
        resetBallTo('player'); ball.lastTouch = 'player';
      } else if(toAi < 40 && Math.abs(ball.dy) < 6){
        resetBallTo('ai'); ball.lastTouch = 'ai';
      }
    }
  } else {
    // ball follows holder
    if(ball.heldBy === 'player'){
      ball.x = player.x + player.w/2;
      ball.y = player.y + 8;
      ball.lastTouch = 'player';
    } else if(ball.heldBy === 'ai'){
      ball.x = ai.x + ai.w/2;
      ball.y = ai.y + 8;
      ball.lastTouch = 'ai';
    }
  }

  // cooldown effects end
  // nothing to update here besides timers (abilityReady toggled elsewhere)
}

/* -------------------------
    HOOP PLACEMENT & INIT
   ------------------------- */
function placeHoop() {
  // put hoop near top-center
  hoop.w = Math.floor(canvas.width * 0.18);
  hoop.x = Math.floor((canvas.width - hoop.w) / 2);
  hoop.y = Math.floor(canvas.height * 0.18);
}
placeHoop();

/* -------------------------
   RENDER
   ------------------------- */
function draw(){
  // background
  if(images.court) {
    ctx.drawImage(images.court, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#222'; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // hoop (simple)
  ctx.fillStyle = '#333';
  ctx.fillRect(hoop.x, hoop.y, hoop.w, 6);
  // rim indicator
  ctx.fillStyle = '#ff8c00';
  ctx.fillRect(hoop.x + hoop.w/2 - 6, hoop.y+4, 12, 6);

  // players (draw simple or sprite)
  if(images.playerSprite){
    ctx.drawImage(images.playerSprite, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  if(images.playerSprite){
    ctx.drawImage(images.playerSprite, ai.x, ai.y, ai.w, ai.h);
  } else {
    ctx.fillStyle = '#00ADEF';
    ctx.fillRect(ai.x, ai.y, ai.w, ai.h);
  }

  // ball
  if(images.ball){
    ctx.drawImage(images.ball, ball.x - ball.r, ball.y - ball.r, ball.r*2, ball.r*2);
  } else {
    ctx.beginPath(); ctx.fillStyle = '#FF4500'; ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
  }

  // ability indicators (shield)
  if(player.shieldActive){
    ctx.strokeStyle = 'rgba(0,200,255,0.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(player.x-6, player.y-6, player.w+12, player.h+12);
  }
  if(ai.shieldActive){
    ctx.strokeStyle = 'rgba(0,200,255,0.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(ai.x-6, ai.y-6, ai.w+12, ai.h+12);
  }
}

/* -------------------------
   GAME LOOP
   ------------------------- */
let lastT = now();
function startGame(){
  // initial positions
  player.x = canvas.width*0.22; player.y = canvas.height - 150;
  ai.x = canvas.width*0.72; ai.y = canvas.height - 150;
  resetBallTo('player');
  updateHUD();

  // ai ability auto timers
  setInterval(()=> {
    if(ai.ability && ai.abilityReady && Math.random() < 0.04) useAbility_who('ai');
  }, 800);

  requestAnimationFrame(loop);
}

function loop(){
  const t = now();
  const dt = t - lastT;
  lastT = t;

  // AI logic
  aiLogic(dt);

  // physics & input
  updatePhysics(dt);

  // simple update for ability durations (shield expire)
  // (shield timers are handled by setTimeout in useAbility_who)

  // draw
  draw();

  requestAnimationFrame(loop);
}

/* -------------------------
   START: called after assets loaded
   ------------------------- */
function startGame(){
  placeHoop();
  player.w = player.h = Math.floor(canvas.height * 0.12);
  ai.w = ai.h = player.w;
  player.x = Math.floor(canvas.width*0.15);
  ai.x = Math.floor(canvas.width*0.75);
  player.y = ai.y = Math.floor(canvas.height*0.72);
  resetBallTo('player');
  updateHUD();
  lastT = now();
  requestAnimationFrame(loop);
}
