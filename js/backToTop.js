// backToTop.js - shows the back-to-top button once the page is scrolled.
//
// The button and its label are rendered by the server (_includes/back-to-top.html)
// and already translated, so all that is left here is revealing it on scroll and
// scrolling back up on click.
document.addEventListener('DOMContentLoaded', function () {
    var backToTopBtn = document.querySelector('.back-to-top-btn');
    if (!backToTopBtn) return;

    // Show/hide button based on scroll position
    var toggleVisibility = function () {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    };

    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', function () {
        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? 'auto' : 'smooth'
        });
    });

    // Listen for scroll events (passive: nothing to preventDefault)
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
});
