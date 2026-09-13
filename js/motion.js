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
  const targets = document.querySelectorAll('.reveal, .sparkline-draw, .timeline-fill');
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
});
