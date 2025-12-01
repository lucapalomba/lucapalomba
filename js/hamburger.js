class HamburgerMenu {
  constructor() {
    this.hamburgerBtn = document.getElementById('hamburger-toggle');
    this.mobileNav = document.getElementById('mobile-nav');
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

    // Close menu when Escape key is pressed
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileNav.classList.contains('open')) {
        this.closeMenu();
        this.hamburgerBtn.focus();
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

  openMenu() {
    this.mobileNav.classList.add('open');
    this.hamburgerBtn.classList.add('active');
    this.hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  closeMenu() {
    this.mobileNav.classList.remove('open');
    this.hamburgerBtn.classList.remove('active');
    this.hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

new HamburgerMenu();
