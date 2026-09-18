// Technologies page: progress bars and category filter.
//
// Bars animate to their data-progress width when they enter the viewport
// (IntersectionObserver), independent of window.load, and are unobserved after
// the first trigger so off-screen bars do no work. Users with
// prefers-reduced-motion get the final widths immediately.
//
// The filter is a proper control, unlike the export's filterTech(): it exposes
// aria-pressed, hides non-matching cards, and shows an empty state. A card
// revealed by the filter was display:none and so never entered the viewport as
// far as the observers are concerned, so the first time it is shown its
// entrance reveal and its bar fill are forced explicitly. On the initial
// `all` pass nothing was hidden, so nothing is forced — the scroll reveals own
// that first paint instead of playing off-screen.
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
  const emptyEl = document.querySelector('.tech-empty');

  if (!buttons.length || !cards.length) return;

  const applyFilter = (category, activeButton) => {
    let visible = 0;

    cards.forEach((card) => {
      const match = category === 'all' || card.getAttribute('data-category') === category;
      const wasHidden = card.hidden;
      card.hidden = !match;
      if (!match) return;
      visible++;

      // Only a card this filter actually brings back (hidden before the click)
      // needs its entrance and its bar forced: it was display:none while the
      // observers were running. Cards that were never hidden are left to the
      // scroll observers, so the initial `all` pass does not pre-empt them and
      // play the stagger off-screen.
      if (wasHidden) {
        card.classList.add('in');
        const fill = card.querySelector('.tech-progress-fill');
        if (fill && fill.style.width === '') {
          fillBar(fill);
        }
      }
    });

    buttons.forEach((button) => {
      const active = button === activeButton;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('filter-btn--active', active);
    });

    if (emptyEl) {
      emptyEl.hidden = visible !== 0;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.getAttribute('data-filter'), button));
  });

  applyFilter('all', buttons[0]);
});
