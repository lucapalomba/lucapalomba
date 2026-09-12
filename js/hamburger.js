class HamburgerMenu {
  constructor() {
    this.hamburgerBtn = document.getElementById('hamburger-toggle');
    this.mobileNav = document.getElementById('mobile-nav');
    if (this.hamburgerBtn && this.mobileNav) {
      // Closed drawer is hidden from assistive tech and keyboard nav.
      this.mobileNav.setAttribute('aria-hidden', 'true');
    }
    this.init();
  }

  init() {
    if (!this.hamburgerBtn || !this.mobileNav) return;

    // Toggle menu on hamburger click
    this.hamburgerBtn.addEventListener('click', () => this.toggleMenu());

    // Close menu when a link is clicked
    this.mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        // Only close for internal navigation, not external links
        if (!link.getAttribute('target')) {
          this.closeMenu();
        }
      });
    });

    // Close menu when Escape key is pressed (focus returns via closeMenu)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileNav.classList.contains('open')) {
        this.closeMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar') && this.mobileNav.classList.contains('open')) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.mobileNav.classList.contains('open')) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  getFirstFocusable() {
    return this.mobileNav.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  }

  openMenu() {
    this.mobileNav.classList.add('open');
    this.hamburgerBtn.classList.add('active');
    this.hamburgerBtn.setAttribute('aria-expanded', 'true');
    this.mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Move focus into the drawer so keyboard users land in the menu.
    const firstFocusable = this.getFirstFocusable();
    if (firstFocusable) firstFocusable.focus();

    // Keep Tab/Shift+Tab from escaping the drawer while it is open.
    this.trapFocus();
  }

  closeMenu() {
    const wasOpen = this.mobileNav.classList.contains('open');

    this.mobileNav.classList.remove('open');
    this.hamburgerBtn.classList.remove('active');
    this.hamburgerBtn.setAttribute('aria-expanded', 'false');
    this.mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    this.untrapFocus();

    // Return focus to the trigger on every close path (escape, outside
    // click, link click). Guarded so focus is never stolen on load.
    if (wasOpen) {
      this.hamburgerBtn.focus();
    }
  }

  trapFocus() {
    this.trapHandler = (e) => {
      if (e.key !== 'Tab') return;

      const focusables = this.mobileNav.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const focusInside = this.mobileNav.contains(document.activeElement);

      if (e.shiftKey) {
        if (document.activeElement === first || !focusInside) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !focusInside) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', this.trapHandler);
  }

  untrapFocus() {
    if (this.trapHandler) {
      document.removeEventListener('keydown', this.trapHandler);
      this.trapHandler = null;
    }
  }
}

new HamburgerMenu();
