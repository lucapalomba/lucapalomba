document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const isIndex = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('lucapalomba/');
    const isExperiences = path.endsWith('experiences.html');

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (isIndex && e.key === 'ArrowRight') {
            navigateTo('experiences.html');
        } else if (isExperiences && e.key === 'ArrowLeft') {
            navigateTo('index.html');
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
        const distance = touchEndX - touchStartX;

        if (Math.abs(distance) < minSwipeDistance) return;

        if (distance > 0) {
            // Swipe Right (Left to Right)
            if (isExperiences) {
                navigateTo('index.html');
            }
        } else {
            // Swipe Left (Right to Left)
            if (isIndex) {
                navigateTo('experiences.html');
            }
        }
    }

    function navigateTo(url) {
        // Add a small delay or transition effect if needed, but for now direct navigation
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
