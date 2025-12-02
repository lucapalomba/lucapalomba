document.addEventListener('DOMContentLoaded', () => {
    // Define page order for navigation (matches navigation bar order)
    const pages = [
        { name: 'index', url: 'index.html', check: (path) => path.endsWith('index.html') || path.endsWith('/') || path.endsWith('lucapalomba/') },
        { name: 'experiences', url: 'experiences.html', check: (path) => path.endsWith('experiences.html') },
        { name: 'contact', url: 'contact.html', check: (path) => path.endsWith('contact.html') }
    ];

    const path = window.location.pathname;
    const currentPageIndex = pages.findIndex(page => page.check(path));

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (currentPageIndex === -1) return;

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
    const minSwipeDistance = 50;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (currentPageIndex === -1) return;

        const distance = touchEndX - touchStartX;

        if (Math.abs(distance) < minSwipeDistance) return;

        if (distance > 0) {
            // Swipe Right (go to previous page)
            const prevIndex = (currentPageIndex - 1 + pages.length) % pages.length;
            navigateTo(pages[prevIndex].url);
        } else {
            // Swipe Left (go to next page)
            const nextIndex = (currentPageIndex + 1) % pages.length;
            navigateTo(pages[nextIndex].url);
        }
    }

    function navigateTo(url) {
        window.location.href = url;
    }

    // Navigation Hint Logic
    const navHint = document.getElementById('navigation-hint');
    if (navHint) {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouch) {
            navHint.innerHTML = 'Swipe <kbd>←</kbd> <kbd>→</kbd> to navigate';
        } else {
            navHint.innerHTML = 'Use keyboard arrows <kbd>←</kbd> <kbd>→</kbd> to navigate';
        }

        // Show the hint
        navHint.setAttribute('aria-hidden', 'false');

        // Fade out and remove after 5 seconds
        setTimeout(() => {
            navHint.classList.add('fade-out');

            // Remove from DOM after transition (1s)
            setTimeout(() => {
                navHint.remove();
            }, 1000);
        }, 5000);
    }
});
