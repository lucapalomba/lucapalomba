class PageTransition {
  constructor() {
    this.overlay = document.querySelector('.transition-overlay');
    this.init();
  }

  init() {
    // only setup link handlers — do NOT auto-reveal or finish overlay on load
    this.setupLinks();
  }

  // Read the exit-fade duration from the stylesheet (single source of truth,
  // --transition-duration in transitions.css) instead of a magic number that
  // can drift from the CSS.
  getExitDurationMs() {
    if (!this.overlay) return 0;
    const duration = getComputedStyle(this.overlay).transitionDuration;
    const match = duration.match(/([\d.]+)s/);
    return match ? Math.round(parseFloat(match[1]) * 1000) : 0;
  }

  setupLinks() {
    document.querySelectorAll('a:not([target="_blank"]):not(.skip-link)').forEach(link => {
      link.addEventListener('click', (e) => {
        // Let modifier-key / middle-click open in a new tab natively.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        // Same-page anchor: let the browser scroll natively, no transition.
        if (link.pathname === window.location.pathname && link.hash) return;
        if (link.hostname === window.location.hostname) {
          e.preventDefault();
          this.transitionToPage(link.href);
        }
      });
    });
  }

  transitionToPage(href) {
    if (!this.overlay) {
      window.location.href = href;
      return;
    }

    // Reduced-motion users: navigate immediately, no overlay.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location.href = href;
      return;
    }

    // ensure overlay not in finished state and visible
    this.overlay.classList.remove('finished');
    this.overlay.style.visibility = 'visible';

    // force a reflow so the browser registers the change before adding 'active'
    void this.overlay.offsetWidth;

    // add active to trigger the CSS fade-in (exit transition)
    this.overlay.classList.add('active');

    // wait for the fade to complete before navigating
    const durationMs = this.getExitDurationMs();
    setTimeout(() => {
      window.location.href = href;
    }, durationMs + 30);
  }

}

new PageTransition();
