// Scroll-triggered entrance reveals for the Obsidian Precision motion layer.
//
// Every animated element starts hidden (`.reveal`, `.sparkline-draw`,
// `.timeline-fill` in styles/motion.css) and gets `.in` the first time it
// enters the viewport, then is unobserved — the same pattern js/techProgress.js
// already uses, so nothing runs before it is seen and nothing runs twice.
//
// Users with prefers-reduced-motion are served the final, fully visible state
// by CSS; this script also skips observing entirely so no work is done.
document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('.reveal, .sparkline-draw, .timeline-fill, [data-spectrum]');
  if (!targets.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const show = (el) => el.classList.add('in');

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach((el) => observer.observe(el));

  // Count-up animation for the telemetry stats, one shot when the element
  // enters the viewport (the export ran it at parse time, so it finished
  // off-screen). Values come from data-* attributes; reduced-motion users keep
  // the server-rendered final value.
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && !reduced) {
    const runCounter = (el) => {
      const target = parseFloat(el.getAttribute('data-counter'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const duration = 1500;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${prefix}${(eased * target).toFixed(decimals)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach((el) => counterObserver.observe(el));
  }
});
