// Contact page: copy the email address with a visible, announced result.
//
// Replaces the export's copyEmail(), which had no failure path or live
// announcement. Failure is surfaced inline and via aria-live instead of a
// blocking alert().
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('copy-email');
  if (!button) return;

  const label = button.querySelector('.copy-label');
  const status = document.getElementById('copy-status');
  const address = 'luca.palomba.developer@gmail.com';
  const defaultLabel = label ? label.textContent : '';
  const copiedLabel = button.getAttribute('data-copied-label') || defaultLabel;
  const failedMessage = button.getAttribute('data-copy-failed') || 'Copy failed';

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  button.addEventListener('click', () => {
    const done = () => {
      if (label) label.textContent = copiedLabel;
      announce(copiedLabel);
      window.setTimeout(() => {
        if (label) label.textContent = defaultLabel;
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
