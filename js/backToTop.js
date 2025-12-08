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
    backToTopBtn.setAttribute('aria-label', 'Go to top');
    document.body.appendChild(backToTopBtn);

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
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Listen for scroll events
    window.addEventListener('scroll', toggleVisibility);

    // Trigger translation if i18n is available
    if (window.i18n) {
        const textSpan = backToTopBtn.querySelector('[data-i18n]');
        if (textSpan) {
            const translation = window.i18n.t('backToTop');
            if (translation && translation !== 'backToTop') {
                textSpan.textContent = translation;
            }
        }
    }
});
