class PageTransition {
  constructor() {
    this.overlay = document.querySelector('.transition-overlay');
    this.TRANSITION_MS = 600; // keep previous timing
    this.init();
  }

  init() {
    // only setup link handlers — do NOT auto-reveal or finish overlay on load
    this.setupLinks();
  }

  setupLinks() {
    document.querySelectorAll('a:not([target="_blank"]):not(.skip-link)').forEach(link => {
      link.addEventListener('click', (e) => {
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

    // ensure overlay not in finished state and visible
    this.overlay.classList.remove('finished');
    this.overlay.style.visibility = 'visible';

    // force a reflow so the browser registers the change before adding 'active'
    void this.overlay.offsetWidth;

    // add active to trigger the CSS fade-in (exit transition)
    this.overlay.classList.add('active');

    // wait for the fade to complete before navigating
    setTimeout(() => {
      window.location.href = href;
    }, this.TRANSITION_MS + 60);
  }

}

new PageTransition();
