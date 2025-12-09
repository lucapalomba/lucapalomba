class TitleAnimator {
  constructor() {
    this.titleElement = document.querySelector('.hero-title');
    this.INTRO_ANIMATION_DURATION = 1500; // Wait for initial page animation
    this.STEP_DELAY = 2000; // Delay between steps
    this.TYPEWRITER_SPEED = 50; // Speed of typewriter effect in ms
    this.ERASE_SPEED = 30; // Speed of erasing in ms
    this.isAnimating = false; // Track if animation is in progress
    this.currentLanguage = document.documentElement.lang || 'en';
    this.soundPool = [];
    this.soundPoolIndex = 0;
    this.SOUND_POOL_SIZE = 5; // Pre-allocate 5 audio instances

    this.stepIndex = 0;
    this.steps = {
      en: [
        { text: "I build things for the web.", highlights: ["things", "web"] },
        { text: "I build teams for Companies.", highlights: ["teams", "Companies"] },
        { text: "I lead teams for goals.", highlights: ["teams", "goals"] }
      ],
      it: [
        { text: "Costruisco cose per il web.", highlights: ["cose", "web"] },
        { text: "Costruisco team per le aziende.", highlights: ["team", "aziende"] },
        { text: "Guido team per gli obiettivi.", highlights: ["Guido", "team", "obiettivi"] }
      ]
    };

    this.init();
  }

  init() {
    if (!this.titleElement) return;

    // Remove data-i18n attribute to prevent i18n.js from overwriting our highlighted HTML
    this.titleElement.removeAttribute('data-i18n');

    // Robust language detection (since i18n might not have set html lang yet)
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.toLowerCase().startsWith('it')) {
      this.currentLanguage = 'it';
    } else {
      this.currentLanguage = 'en';
    }

    // Apply highlights to the initial text immediately
    const currentLangSteps = this.steps[this.currentLanguage] || this.steps['en'];
    const initialConfig = currentLangSteps[0];
    this.updateContent(this.getTextArray(initialConfig.text, initialConfig.highlights));

    // Pre-create audio pool for better performance
    this.initSoundPool();

    // Add click listener to restart animation
    this.titleElement.style.cursor = 'pointer';
    this.titleElement.addEventListener('click', () => {
      if (!this.isAnimating) {
        this.resetAndAnimate();
      }
    });

    // Wait for the intro animation to complete before starting the title animation
    setTimeout(() => {
      this.startSequence();
    }, this.INTRO_ANIMATION_DURATION);
  }

  initSoundPool() {
    try {
      for (let i = 0; i < this.SOUND_POOL_SIZE; i++) {
        const audio = new Audio('sounds/keyboard-click.mp3');
        audio.preload = 'auto';
        audio.volume = 0.2;
        this.soundPool.push(audio);
      }
    } catch (e) {
      console.debug('Could not initialize sound pool:', e.message);
    }
  }

  startSequence() {
    // Already at step 0 (initial text). Schedule transition to step 1.
    this.stepIndex = 0;
    this.scheduleNextStep();
  }

  scheduleNextStep() {
    // If we have more steps, schedule the next one
    const currentLangSteps = this.steps[this.currentLanguage] || this.steps['en'];

    if (this.stepIndex < currentLangSteps.length - 1) {
      setTimeout(() => {
        this.transitionToStep(this.stepIndex + 1);
      }, this.STEP_DELAY);
    }
  }

  transitionToStep(nextIndex) {
    if (!this.titleElement) return;
    this.currentLanguage = document.documentElement.lang || 'en';
    const currentLangSteps = this.steps[this.currentLanguage] || this.steps['en'];

    if (nextIndex >= currentLangSteps.length) return;

    const nextStepConfig = currentLangSteps[nextIndex];

    this.eraseText(() => {
      this.stepIndex = nextIndex;
      this.typeNewText(nextStepConfig.text, nextStepConfig.highlights, () => {
        this.scheduleNextStep();
      });
    });
  }

  resetAndAnimate() {
    this.currentLanguage = document.documentElement.lang || 'en';
    const currentLangSteps = this.steps[this.currentLanguage] || this.steps['en'];
    const initialText = currentLangSteps[0].text;

    // Reset to initial state visually
    // Note: We don't type it out, just reset immediately to start over or we could type it.
    // Given "reset", simply setting text is coarser but effective.
    // Optionally we could start the sequence from 0.

    this.titleElement.textContent = initialText;
    this.updateContent(this.getTextArray(initialText, currentLangSteps[0].highlights));
    this.stepIndex = 0;

    setTimeout(() => {
      this.scheduleNextStep();
    }, this.INTRO_ANIMATION_DURATION);
  }

  eraseText(callback) {
    this.isAnimating = true;
    const originalText = this.titleElement.textContent;
    let position = originalText.length;

    const eraseInterval = setInterval(() => {
      position--;
      this.titleElement.textContent = originalText.substring(0, position);

      // Play keyboard sound while erasing
      if (originalText[position] !== ' ' && this.soundPool.length > 0) {
        this.playKeySound();
      }

      if (position === 0) {
        clearInterval(eraseInterval);
        callback();
      }
    }, this.ERASE_SPEED);
  }

  typeNewText(fullText, highlights, callback) {
    let position = 0;
    const textArray = this.getTextArray(fullText, highlights);

    const typeInterval = setInterval(() => {
      if (position < textArray.length) {
        // Play keyboard sound for each character (except spaces)
        if (textArray[position].char !== ' ' && this.soundPool.length > 0) {
          this.playKeySound();
        }
        // Update the content with the current position
        this.updateContent(textArray.slice(0, position + 1));
        position++;
      } else {
        clearInterval(typeInterval);
        // Final update to ensure all content is displayed with proper highlighting
        this.updateContent(textArray);
        this.isAnimating = false;
        if (callback) callback();
      }
    }, this.TYPEWRITER_SPEED);
  }

  playKeySound() {
    try {
      if (this.soundPool.length === 0) return;

      // Get the next sound from the pool (cycling through)
      const sound = this.soundPool[this.soundPoolIndex];
      this.soundPoolIndex = (this.soundPoolIndex + 1) % this.soundPool.length;

      // Reset and play
      sound.currentTime = 0;
      sound.volume = 0.2;

      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.debug('Could not play keyboard sound:', err.message);
        });
      }
    } catch (e) {
      console.debug('Error playing keyboard sound:', e.message);
    }
  }

  getTextArray(text, highlights) {
    const result = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let isHighlighted = false;

      // Check if current position is within a highlighted word
      for (const word of highlights) {
        const wordIndex = text.indexOf(word);
        // Important: check if the word at this position matches (simple check)
        // Note: indexOf finds first occurrence. For multiple same words we might need regex, 
        // but for these specific sentences it's fine.
        if (wordIndex !== -1 && i >= wordIndex && i < wordIndex + word.length) {
          isHighlighted = true;
          break;
        }
      }

      result.push({ char, isHighlighted });
    }

    return result;
  }

  updateContent(textArray) {
    let html = '';
    let currentHighlight = false;
    let buffer = '';

    for (let i = 0; i < textArray.length; i++) {
      const item = textArray[i];
      // Simple optimization: just wrap spans

      if (item.isHighlighted && !currentHighlight) {
        if (buffer) { html += buffer; buffer = ''; }
        html += '<span class="highlight">' + item.char;
        currentHighlight = true;
      } else if (!item.isHighlighted && currentHighlight) {
        html += '</span>' + item.char;
        currentHighlight = false;
      } else if (item.isHighlighted && currentHighlight) {
        html += item.char;
      } else {
        buffer += item.char;
      }
    }

    if (buffer) html += buffer;
    if (currentHighlight) html += '</span>';

    this.titleElement.innerHTML = html;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  new TitleAnimator();
});
