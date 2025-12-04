// Progress bar animation for technologies page
window.addEventListener('load', () => {
    if (document.body.classList.contains('technologies-page')) {
        const progressBars = document.querySelectorAll('.tech-progress-fill');

        // Animate all progress bars after a short delay
        setTimeout(() => {
            progressBars.forEach(progressFill => {
                const targetProgress = progressFill.getAttribute('data-progress');
                progressFill.style.width = `${targetProgress}%`;
            });
        }, 100); // Small delay to ensure page is fully rendered
    }
});
