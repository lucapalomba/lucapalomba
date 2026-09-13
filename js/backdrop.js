// Ambient backdrop: the design export's animated obsidian grid with a cyan
// mesh, three flowing energy curves, and a soft light that follows the cursor.
//
// Reimplemented from the mockups' inline canvas, with the fixes the plan
// records: DPR-aware backing store, rAF-coalesced mouse tracking (one
// `pointermove` listener, not one per card), pausing while the tab is hidden,
// and delta-timed so it does not run twice as fast on a 120Hz display.
//
// Decorative only (the canvas is aria-hidden). Under prefers-reduced-motion it
// is not started at all, so the static scrim alone is shown.
(function () {
  'use strict';

  const canvas = document.getElementById('backdrop');
  if (!canvas) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let time = 0;
  let last = 0;
  let rafId = null;
  let running = false;

  const GRID = 48;
  const MAX_DIST = 260;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (mouse.x === 0 && mouse.y === 0) {
      mouse.x = mouse.tx = width * 0.5;
      mouse.y = mouse.ty = height * 0.35;
    }
  }

  function draw() {
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, 0, width, height);

    const cols = Math.ceil(width / GRID) + 2;
    const rows = Math.ceil(height / GRID) + 2;

    // Vertical mesh, deflected by the cursor and waved by time.
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(76, 215, 246, 0.05)';
    for (let i = 0; i < cols; i++) {
      const xBase = i * GRID;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        const yBase = j * GRID;
        const dx = xBase - mouse.x;
        const dy = yBase - mouse.y;
        const dist = Math.hypot(dx, dy);
        let pushX = 0;
        let pushY = 0;
        if (dist < MAX_DIST && dist > 0) {
          const force = (1 - dist / MAX_DIST) * 22;
          pushX = (dx / dist) * force;
          pushY = (dy / dist) * force;
        }
        const wave = Math.sin(time * 0.5 + xBase * 0.004 + yBase * 0.005) * 9;
        const px = xBase + pushX;
        const py = yBase + wave + pushY;
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Horizontal mesh, every other row.
    ctx.strokeStyle = 'rgba(76, 215, 246, 0.04)';
    for (let j = 0; j < rows; j += 2) {
      const yBase = j * GRID;
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        const xBase = i * GRID;
        const dx = xBase - mouse.x;
        const dy = yBase - mouse.y;
        const dist = Math.hypot(dx, dy);
        let pushY = 0;
        if (dist < MAX_DIST && dist > 0) {
          pushY = (dy / dist) * (1 - dist / MAX_DIST) * 20;
        }
        const wave = Math.sin(time * 0.6 + xBase * 0.005 + yBase * 0.003) * 12;
        const py = yBase + wave + pushY;
        if (i === 0) ctx.moveTo(xBase, py); else ctx.lineTo(xBase, py);
      }
      ctx.stroke();
    }

    // Three flowing luminous energy curves.
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const speed = time * (0.35 + k * 0.12);
      const yOffset = height * (0.2 + k * 0.28);
      for (let x = 0; x <= width; x += 24) {
        const y = yOffset +
          Math.sin(speed + x * 0.003 + k) * 35 +
          Math.cos(speed * 0.6 + x * 0.0015) * 25;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = k === 1 ? 'rgba(78, 222, 163, 0.10)' : 'rgba(76, 215, 246, 0.12)';
      ctx.stroke();
    }

    // Soft ambient light at the cursor.
    const radial = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 350);
    radial.addColorStop(0, 'rgba(76, 215, 246, 0.08)');
    radial.addColorStop(0.5, 'rgba(6, 182, 212, 0.025)');
    radial.addColorStop(1, 'rgba(12, 14, 20, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  function tick(now) {
    if (!running) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    time += dt * 1.5;

    // Ease the cursor light toward the pointer in delta time.
    const ease = 1 - Math.pow(0.001, dt);
    mouse.x += (mouse.tx - mouse.x) * ease;
    mouse.y += (mouse.ty - mouse.y) * ease;

    draw();
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  reduced.addEventListener('change', (e) => {
    if (e.matches) { stop(); ctx.clearRect(0, 0, width, height); }
    else { resize(); start(); }
  });

  resize();
  start();
})();
