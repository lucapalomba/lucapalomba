// Progress bar animation for technologies page.
// Each bar animates to its data-progress width when it enters the
// viewport (IntersectionObserver), independent of window.load, and is
// unobserved after the first trigger so off-screen bars do no work.
// Users with prefers-reduced-motion get the final widths immediately.
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('technologies-page')) return;

  const progressBars = document.querySelectorAll('.tech-progress-fill');
  if (!progressBars.length) return;

  const fillBar = (fill) => {
    const targetProgress = fill.getAttribute('data-progress');
    if (targetProgress) {
      fill.style.width = `${targetProgress}%`;
    }
  };

  // Reduced motion: set widths instantly (no 1.5s transition).
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    progressBars.forEach((fill) => {
      fill.style.transition = 'none';
      fillBar(fill);
    });
    return;
  }

  // No IntersectionObserver (very old browsers): fill everything at once.
  if (!('IntersectionObserver' in window)) {
    progressBars.forEach(fillBar);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        fillBar(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  progressBars.forEach((fill) => observer.observe(fill));
});
