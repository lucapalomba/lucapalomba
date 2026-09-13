// Ambient backdrop cursor light.
//
// The animated grid and curves are pure CSS (see .backdrop in styles/main.css):
// a tiled gradient and two elements moved with `transform`, both on the
// compositor. This script only tracks the pointer and writes a transform on the
// light layer — no canvas, no requestAnimationFrame loop, no per-frame layout.
//
// That matters: the earlier canvas version redrew a mesh every frame and cost
// ~117s of main-thread work across a throttled mobile Lighthouse run (TBT 5.7s,
// performance 0.35). This is rAF-coalesced and writes one style property.
//
// Decorative; does nothing when the visitor prefers reduced motion (the CSS
// freezes the light too).
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const light = document.getElementById('backdrop-light');
  if (!light) return;

  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let scheduled = false;

  function frame() {
    scheduled = false;
    // Ease toward the pointer; only transform is written, so this stays off the
    // layout/paint path.
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    light.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
      schedule();
    }
  }

  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(frame);
    }
  }

  function setTarget(clientX, clientY) {
    tx = clientX - 175;
    ty = clientY - 175;
    schedule();
  }

  // Start centred on the first pointer move; until then the CSS keeps it at its
  // default position (top centre) so the page is never without it.
  window.addEventListener('pointermove', (e) => setTarget(e.clientX, e.clientY), { passive: true });
})();
