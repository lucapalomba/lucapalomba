// Technologies page: progress bars and category filter.
//
// Bars animate to their data-progress width when they enter the viewport
// (IntersectionObserver), independent of window.load, and are unobserved after
// the first trigger so off-screen bars do no work. Users with
// prefers-reduced-motion get the final widths immediately.
//
// The filter is a proper control, unlike the export's filterTech(): it keeps a
// live count, announces results, exposes aria-pressed, and shows an empty
// state. It also keeps the bars of newly revealed cards filled, since those
// cards were display:none (and therefore never observed) while hidden.
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('technologies-page')) return;

  const progressBars = Array.from(document.querySelectorAll('.tech-progress-fill'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fillBar = (fill) => {
    const targetProgress = fill.getAttribute('data-progress');
    if (targetProgress) {
      fill.style.width = `${targetProgress}%`;
    }
  };

  if (progressBars.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      progressBars.forEach((fill) => {
        fill.style.transition = 'none';
        fillBar(fill);
      });
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fillBar(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      progressBars.forEach((fill) => observer.observe(fill));
    }
  }

  // --- Filter -------------------------------------------------------------
  const buttons = Array.from(document.querySelectorAll('.filter-btn'));
  const cards = Array.from(document.querySelectorAll('.tech-card'));
  const countEl = document.querySelector('.tech-count');
  const emptyEl = document.querySelector('.tech-empty');
  const countTemplate = countEl ? countEl.getAttribute('data-count-template') : '';

  if (!buttons.length || !cards.length) return;

  const applyFilter = (category, activeButton) => {
    let visible = 0;

    cards.forEach((card) => {
      const match = category === 'all' || card.getAttribute('data-category') === category;
      card.hidden = !match;
      if (match) visible++;
    });

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', button === activeButton ? 'true' : 'false');
    });

    if (countEl) {
      countEl.textContent = countTemplate.replace('{count}', String(visible));
    }
    if (emptyEl) {
      emptyEl.hidden = visible !== 0;
    }

    // A card revealed by the filter was display:none and never observed, so
    // fill it now (instantly if the visitor prefers reduced motion).
    cards.forEach((card) => {
      if (!card.hidden) {
        card.classList.add('in');
        const fill = card.querySelector('.tech-progress-fill');
        if (fill && fill.style.width === '') {
          fillBar(fill);
        }
      }
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.getAttribute('data-filter'), button));
  });

  applyFilter('all', buttons[0]);
});
