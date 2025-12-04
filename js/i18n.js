// i18n.js - Internationalization handler
class I18n {
  constructor() {
    this.translations = null;
    this.currentLang = this.detectLanguage();
    this.init();
  }

  // Detect browser language
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    // Check if browser language starts with 'it' (it, it-IT, it-CH, etc.)
    return browserLang.toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  // Initialize i18n
  async init() {
    await this.loadLanguage(this.currentLang);
  }

  // Load a specific language file
  async loadLanguage(lang) {
    try {
      const response = await fetch(`translations/${lang}.json`);
      this.translations = await response.json();
      this.translate();
      this.updateHtmlLang();
      this.logConsoleEasterEgg();
    } catch (error) {
      console.error(`Failed to load ${lang} translations:`, error);
    }
  }

  // Log console easter egg
  logConsoleEasterEgg() {
    const message = this.t('consoleEasterEgg');
    if (message && message !== 'consoleEasterEgg') {
      console.log(`%c${message}`, 'font-size: 14px; font-family: monospace; color: #6e48aa; padding: 10px; border: 2px solid #6e48aa; border-radius: 5px;');
    }
  }

  // Update HTML lang attribute
  updateHtmlLang() {
    document.documentElement.lang = this.currentLang;
  }

  // Get translation by key path (e.g., 'nav.experiences')
  t(key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return value || key;
  }

  // Translate all elements with data-i18n attribute
  translate() {
    if (!this.translations) return;

    // Update title and meta description
    this.updateMetaTags();

    // Translate simple text elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (translation && translation !== key) {
        element.textContent = translation;
      }
    });

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      const translation = this.t(key);

      if (translation && translation !== key) {
        element.setAttribute('aria-label', translation);
      }
    });

    // Handle experiences page timeline
    this.translateExperiences();
  }

  // Update page meta tags
  updateMetaTags() {
    let page = 'index';
    if (document.body.classList.contains('experiences-page')) {
      page = 'experiences';
    } else if (document.body.classList.contains('technologies-page')) {
      page = 'technologies';
    } else if (document.body.classList.contains('contact-page')) {
      page = 'contact';
    }

    // Update title
    const titleElement = document.querySelector('title');
    if (titleElement) {
      const titleKey = (page === 'index') ? 'title' : 'pageTitle';
      titleElement.textContent = this.t(`${page}.${titleKey}`);
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', this.t(`${page}.description`));
    }
  }

  // Translate experiences timeline
  translateExperiences() {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    const jobs = this.t('experiences.jobs');
    if (!Array.isArray(jobs)) return;

    const timelineItems = timeline.querySelectorAll('.timeline-item');

    timelineItems.forEach((item, index) => {
      if (jobs[index]) {
        const job = jobs[index];

        // Update date
        const dateEl = item.querySelector('.date');
        if (dateEl) dateEl.textContent = job.date;

        // Update title (handle "Role @ Company" format)
        const titleEl = item.querySelector('h3');
        if (titleEl) {
          // Split title into role and company parts
          const titleParts = job.title.split(' — ');
          if (titleParts.length === 2) {
            const [role, company] = titleParts;
            titleEl.innerHTML = `${role} <span class="company">@ ${company}</span>`;
          } else {
            titleEl.innerHTML = job.title;
          }
        }

        // Update job description (convert to bullet points)
        const descriptionList = item.querySelector('.job-description');
        if (descriptionList && job.description) {
          // Split description by sentences or line breaks
          const bullets = job.description
            .split(/\.\s+/)
            .filter(text => text.trim().length > 0)
            .map(text => text.trim() + (text.endsWith('.') ? '' : '.'));

          descriptionList.innerHTML = bullets
            .map(bullet => `<li>${bullet}</li>`)
            .join('');
        }

        // Update key project if exists
        const keyProjectEl = item.querySelector('.key-project');
        if (job.keyProject) {
          if (!keyProjectEl) {
            // Create key project element if it doesn't exist
            const kpDiv = document.createElement('div');
            kpDiv.className = 'key-project';
            kpDiv.innerHTML = `<span class="kp-label">${this.t('experiences.keyProject')}</span> ${job.keyProject}`;

            // Insert before tech-stack
            const techStack = item.querySelector('.tech-stack');
            if (techStack) {
              techStack.parentNode.insertBefore(kpDiv, techStack);
            } else {
              item.querySelector('.timeline-content').appendChild(kpDiv);
            }
          } else {
            // Update existing key project - clear and rebuild to ensure proper order
            keyProjectEl.innerHTML = `<span class="kp-label">${this.t('experiences.keyProject')}</span> ${job.keyProject}`;
          }
        } else if (keyProjectEl) {
          // Remove key project if job doesn't have one
          keyProjectEl.remove();
        }
      }
    });
  }

  // Switch language manually (optional feature)
  async switchLanguage(lang) {
    this.currentLang = lang;
    await this.loadLanguage(lang);
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Initialize i18n when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
  });
} else {
  window.i18n = new I18n();
}
