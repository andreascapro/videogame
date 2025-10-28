// Space Dodger — semplice gioco canvas
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('startButton');
  const message = document.getElementById('message');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  let running = false;
  let score = 0;
  let best = Number(localStorage.getItem('sd_best') || 0);
  bestEl.textContent = 'Best: ' + best;

  // player
  const player = {
    w: 40,
    h: 16,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 60,
    speed: 6,
    vx: 0
  };

  // obstacles (asteroids)
  let asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 60; // frames

  function reset() {
    running = false;
    score = 0;
    scoreEl.textContent = score;
    player.x = WIDTH / 2 - player.w / 2;
    player.vx = 0;
    asteroids = [];
    spawnTimer = 0;
    spawnInterval = 60;
    overlay.style.pointerEvents = 'auto';
    overlay.style.display = 'flex';
    message.textContent = 'Premi Inizia per giocare';
  }

  function startGame() {
    running = true;
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    score = 0;
    spawnTimer = 0;
    spawnInterval = 60;
    asteroids = [];
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    overlay.style.pointerEvents = 'auto';
    overlay.style.display = 'flex';
    message.textContent = `Hai perso! Score: ${score}`;
    if (score > best) {
      best = score;
      localStorage.setItem('sd_best', String(best));
      bestEl.textContent = 'Best: ' + best;
    }
    startButton.textContent = 'Riprova';
  }

  function spawnAsteroid() {
    const size = 18 + Math.random() * 36;
    const x = Math.random() * (WIDTH - size);
    const speed = 1.2 + Math.random() * 2.2 + Math.min(score / 200, 2);
    asteroids.push({ x, y: -size, size, speed });
  }

  function update() {
    // player movement
    player.x += player.vx;
    // clamp
    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

    // spawn control
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnAsteroid();
      // gradually increase difficulty
      spawnInterval = Math.max(18, spawnInterval - 0.5);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove if offscreen
      if (a.y - a.size > HEIGHT) {
        asteroids.splice(i, 1);
        score += 10;
        scoreEl.textContent = score;
      } else {
        // collision with player (simple AABB)
        const px = player.x, py = player.y, pw = player.w, ph = player.h;
        const ax = a.x, ay = a.y, as = a.size;
        if (px < ax + as && px + pw > ax && py < ay + as && py + ph > ay) {
          endGame();
        }
      }
    }
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // stars background (simple)
    for (let i = 0; i < 60; i++) {
      const t = (i * 9301 + 12345) % 1;
      // static simple star pattern could be added, but keep perf low
    }

    // draw player (ship)
    ctx.fillStyle = '#00ffd5';
    roundRect(ctx, player.x, player.y, player.w, player.h, 4, true, false);
    // small nose
    ctx.fillStyle = '#e6ffff';
    ctx.fillRect(player.x + player.w / 2 - 2, player.y - 6, 4, 6);

    // draw asteroids
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.size / 2, a.y + a.size / 2, a.size * 0.1, a.x + a.size / 2, a.y + a.size / 2, a.size);
      grad.addColorStop(0, '#f5b395');
      grad.addColorStop(1, '#6b2f2f');
      ctx.fillStyle = grad;
      // draw as irregular circle using many small arcs
      ctx.beginPath();
      ctx.ellipse(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, a.size * 0.45, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD overlay small
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(6, 6, 110, 28);
    ctx.fillStyle = '#00ffd5';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Score: ' + score, 12, 26);
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // helpers
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // input
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft') player.vx = -player.speed;
    if (e.key === 'ArrowRight') player.vx = player.speed;
    if (e.key === ' ' && !running) startGame();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (!keys['ArrowLeft'] && !keys['ArrowRight']) player.vx = 0;
    if (keys['ArrowLeft']) player.vx = -player.speed;
    if (keys['ArrowRight']) player.vx = player.speed;
  });

  // mouse and touch to move player
  function pointerMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    // center player on pointer x
    player.x = Math.max(0, Math.min(WIDTH - player.w, (x / rect.width) * WIDTH - player.w / 2));
  }
  canvas.addEventListener('mousemove', (e) => pointerMove(e.clientX));
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length) pointerMove(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });

  // start button
  startButton.addEventListener('click', () => {
    startButton.textContent = 'Inizia / Riavvia';
    startGame();
  });

  // initialize
  reset();
})();
