document.addEventListener('DOMContentLoaded', () => {
    // Page order for arrow-key and swipe navigation (matches the navbar order).
    // The current page comes from `data-page` on <body>, which the server sets
    // from the page's `i18n_key`. It used to be guessed from the URL, which broke
    // on the Italian pages: "/it/" matched neither `endsWith('/')` nor
    // "index.html", so arrow keys and swipes did nothing there.
    const pages = [
        { name: 'index', url: 'index.html' },
        { name: 'experiences', url: 'experiences.html' },
        { name: 'technologies', url: 'technologies.html' },
        { name: 'contact', url: 'contact.html' }
    ];

    const currentPage = document.body.dataset.page;
    const currentPageIndex = pages.findIndex(page => page.name === currentPage);

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (currentPageIndex === -1) return;

        // Don't hijack arrow keys while the user is typing in a form field
        if (e.target.matches('input, textarea, select, [contenteditable="true"]')) return;

        if (e.key === 'ArrowRight') {
            // Navigate to next page (circular)
            const nextIndex = (currentPageIndex + 1) % pages.length;
            navigateTo(pages[nextIndex].url);
        } else if (e.key === 'ArrowLeft') {
            // Navigate to previous page (circular)
            const prevIndex = (currentPageIndex - 1 + pages.length) % pages.length;
            navigateTo(pages[prevIndex].url);
        }
    });

    // Touch Navigation (Swipe)
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 100; // Increased from 50 to reduce sensitivity

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (currentPageIndex === -1) return;

        const distanceX = touchEndX - touchStartX;
        const distanceY = touchEndY - touchStartY;

        // Check if horizontal swipe distance meets minimum threshold
        if (Math.abs(distanceX) < minSwipeDistance) return;

        // Ensure it's a horizontal swipe (horizontal movement > 1.5x vertical movement)
        // This prevents triggering navigation when scrolling vertically
        if (Math.abs(distanceX) < Math.abs(distanceY) * 1.5) return;

        if (distanceX > 0) {
            // Swipe Right (go to previous page)
            const prevIndex = (currentPageIndex - 1 + pages.length) % pages.length;
            navigateTo(pages[prevIndex].url);
        } else {
            // Swipe Left (go to next page)
            const nextIndex = (currentPageIndex + 1) % pages.length;
            navigateTo(pages[nextIndex].url);
        }
    }

    // Relative on purpose: the same link resolves inside whichever language
    // directory the visitor is currently in.
    function navigateTo(url) {
        window.location.href = url;
    }

    // Navigation Hint Logic — the hint text (both variants) is rendered by the
    // server and picked by CSS, so this only reveals it, then dismisses it.
    const navHint = document.getElementById('navigation-hint');
    if (navHint) {
        // Show at most once per session. sessionStorage can throw in
        // restrictive/privacy contexts, so guard every access.
        let alreadyShown = false;
        try {
            alreadyShown = sessionStorage.getItem('navHintShown') === '1';
        } catch (e) { /* ignore */ }

        if (alreadyShown) {
            // The element is hidden via aria-hidden, but removing it keeps the
            // DOM identical to the "dismissed" state either way.
            navHint.remove();
        } else {
            try { sessionStorage.setItem('navHintShown', '1'); } catch (e) { /* ignore */ }

            // Show the hint
            navHint.setAttribute('aria-hidden', 'false');

            // Dismiss on click/tap
            navHint.addEventListener('click', () => navHint.remove());

            // Fade out and remove after 5 seconds
            setTimeout(() => {
                navHint.classList.add('fade-out');

                // Remove from DOM after transition (1s)
                setTimeout(() => {
                    navHint.remove();
                }, 1000);
            }, 5000);
        }
    }
});
