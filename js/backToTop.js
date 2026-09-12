document.addEventListener('DOMContentLoaded', function () {
    // Create the button element
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = `
    <span class="btn-text" data-i18n="backToTop">Go to Top</span>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  `;
    backToTopBtn.className = 'back-to-top-btn';
    // aria-label is translated; keep an English fallback until i18n loads.
    backToTopBtn.setAttribute('data-i18n-aria', 'backToTop');
    backToTopBtn.setAttribute('aria-label', 'Go to top');
    document.body.appendChild(backToTopBtn);

    // Translate text + aria-label at creation AND on every language event.
    // i18n:ready may already have fired before this handler runs (translations
    // load async), so the immediate call covers the initial load.
    const applyTranslation = () => {
        if (!window.i18n || !window.i18n.translations) return;
        const textSpan = backToTopBtn.querySelector('[data-i18n]');
        if (textSpan) {
            const translation = window.i18n.t('backToTop');
            if (translation && translation !== 'backToTop') {
                textSpan.textContent = translation;
            }
        }
        const aria = window.i18n.t('backToTop');
        if (aria && aria !== 'backToTop') {
            backToTopBtn.setAttribute('aria-label', aria);
        }
    };
    applyTranslation();
    document.addEventListener('i18n:ready', applyTranslation);
    document.addEventListener('i18n:languageChanged', applyTranslation);

    // Show/hide button based on scroll position
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    };

    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? 'auto' : 'smooth'
        });
    });

    // Listen for scroll events (passive: nothing to preventDefault)
    window.addEventListener('scroll', toggleVisibility, { passive: true });
});
