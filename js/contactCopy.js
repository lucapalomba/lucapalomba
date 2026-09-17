// Contact page: copy the email address with a visible, announced result.
//
// Replaces the export's copyEmail(), which had no failure path or live
// announcement. Failure is surfaced inline and via aria-live instead of a
// blocking alert(). The button glyph swaps to a check while the confirmation
// is showing, and its accessible name is updated with it.
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('copy-email');
  if (!button) return;

  const label = button.querySelector('.copy-label');
  const status = document.getElementById('copy-status');
  const iconCopied = button.querySelector('.icon-check');
  const address = 'luca.palomba.developer@gmail.com';
  const defaultLabel = label ? label.textContent : '';
  const copiedLabel = button.getAttribute('data-copied-label') || defaultLabel;
  const failedMessage = button.getAttribute('data-copy-failed') || 'Copy failed';

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const showCopied = (copied) => {
    button.classList.toggle('is-copied', copied);
    if (iconCopied) iconCopied.hidden = !copied;
    if (label) label.textContent = copied ? copiedLabel : defaultLabel;
    button.setAttribute('aria-label', copied ? copiedLabel : defaultLabel);
  };

  button.addEventListener('click', () => {
    const done = () => {
      announce(copiedLabel);
      showCopied(true);
      window.setTimeout(() => {
        showCopied(false);
        announce('');
      }, 2000);
    };

    const fail = () => {
      announce(failedMessage);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(done).catch(fail);
      return;
    }

    // Fallback for browsers without the async clipboard API.
    try {
      const field = document.createElement('textarea');
      field.value = address;
      field.setAttribute('readonly', '');
      field.style.position = 'absolute';
      field.style.left = '-9999px';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      ok ? done() : fail();
    } catch (e) {
      fail();
    }
  });
});
