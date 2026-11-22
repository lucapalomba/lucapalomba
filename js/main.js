// Post-DOMContentLoaded init.
//
// The entry fade-in is a pure CSS animation (body-fade-in in main.css), so
// there is no JS opacity juggling that could leave the page stuck hidden.
// The particle canvas that used to be initialised here was removed with the
// Obsidian Precision revamp: neither the design spec nor any mockup includes
// it (D4 in docs/design-system-revamp.md).
document.addEventListener('DOMContentLoaded', function () {
  // Mark the transition overlay finished so any residual entry state clears.
  const overlay = document.querySelector('.transition-overlay');
  if (overlay) {
    overlay.classList.add('finished');
  }
});
