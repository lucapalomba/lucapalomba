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
    try {
      const response = await fetch('translations.json');
      this.translations = await response.json();
      this.translate();
      this.updateHtmlLang();
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  // Update HTML lang attribute
  updateHtmlLang() {
    document.documentElement.lang = this.currentLang;
  }

  // Get translation by key path (e.g., 'nav.experiences')
  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
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
    const page = document.body.classList.contains('experiences-page') ? 'experiences' : 'index';
    
    // Update title
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleElement.textContent = this.t(`${page}.${page === 'experiences' ? 'pageTitle' : 'title'}`);
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
        
        // Update title
        const titleEl = item.querySelector('h3');
        if (titleEl) titleEl.innerHTML = job.title;
        
        // Update description
        const descEl = item.querySelector('p:not(.key-project)');
        if (descEl) descEl.innerHTML = job.description;
        
        // Update key project if exists
        const keyProjectEl = item.querySelector('.key-project');
        if (keyProjectEl && job.keyProject) {
          const labelEl = keyProjectEl.querySelector('.kp-label');
          if (labelEl) labelEl.textContent = this.t('experiences.keyProject');
          
          // Update the text after the label
          const textNode = Array.from(keyProjectEl.childNodes).find(
            node => node.nodeType === Node.TEXT_NODE
          );
          if (textNode) {
            textNode.textContent = ' ' + job.keyProject;
          }
        } else if (keyProjectEl && !job.keyProject) {
          keyProjectEl.remove();
        }
      }
    });
  }

  // Switch language manually (optional feature)
  switchLanguage(lang) {
    if (this.translations && this.translations[lang]) {
      this.currentLang = lang;
      this.translate();
      this.updateHtmlLang();
      // Store preference in localStorage
      localStorage.setItem('preferredLanguage', lang);
    }
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
