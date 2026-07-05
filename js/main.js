document.addEventListener('DOMContentLoaded', function () {
  // V2 Kinetic design — particles removed in favour of CSS speed-lines

  // Mark transition overlay as finished after entry
  // (CSS animation in transitions.css handles the body fade-in)
  const overlay = document.querySelector('.transition-overlay');
  if (overlay) {
    overlay.classList.add('finished');
  }
});
