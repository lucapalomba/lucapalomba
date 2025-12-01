class TitleAnimator {
  constructor() {
    this.titleElement = document.querySelector('.hero-title');
    this.INTRO_ANIMATION_DURATION = 2000; // Wait for initial page animation
    this.SWAP_DELAY = 500; // Delay before starting the first swap
    this.TYPEWRITER_SPEED = 100; // Speed of typewriter effect in ms
    this.ERASE_SPEED = 60; // Speed of erasing in ms
    this.isAnimating = false; // Track if animation is in progress
    this.currentLanguage = document.documentElement.lang || 'en';
    this.keySound = null;
    this.init();
  }

  init() {
    if (!this.titleElement) return;

    // Load keyboard sound
    this.keySound = new Audio('sounds/keyboard-click.mp3');
    this.keySound.preload = 'auto';
    this.keySound.volume = 0.2;

    // Add click listener to restart animation
    this.titleElement.style.cursor = 'pointer';
    this.titleElement.addEventListener('click', () => {
      if (!this.isAnimating) {
        this.resetAndAnimate();
      }
    });

    // Wait for the intro animation to complete before starting the title animation
    setTimeout(() => {
      this.startAnimation();
    }, this.INTRO_ANIMATION_DURATION);
  }

  startAnimation() {
    // Perform the swap after a delay
    setTimeout(() => {
      this.swapTitle();
    }, this.SWAP_DELAY);
  }

  resetAndAnimate() {
    const originalText = this.getOriginalText(this.currentLanguage);
    this.titleElement.textContent = originalText;
    
    // Wait with the same intro animation duration before starting the swap
    setTimeout(() => {
      this.startAnimation();
    }, this.INTRO_ANIMATION_DURATION);
  }

  swapTitle() {
    if (!this.titleElement) return;

    this.currentLanguage = document.documentElement.lang || 'en';
    let originalText, newText;

    // Get the appropriate text based on language
    if (this.currentLanguage === 'en') {
      originalText = 'I build things for the web.';
      newText = 'I build teams for Companies.';
    } else if (this.currentLanguage === 'it') {
      originalText = 'Costruisco cose per il web.';
      newText = 'Costruisco team per le Aziende.';
    } else {
      return;
    }

    // Check if current text matches the original text
    if (this.titleElement.textContent.trim() !== originalText) {
      return;
    }

    // Start the typewriter animation: erase then type new text
    this.eraseText(() => {
      this.typeNewText(newText, this.currentLanguage);
    });
  }

  getOriginalText(language) {
    if (language === 'en') {
      return 'I build things for the web.';
    } else if (language === 'it') {
      return 'Costruisco cose per il web.';
    }
    return 'I build things for the web.';
  }

  eraseText(callback) {
    this.isAnimating = true;
    const originalText = this.titleElement.textContent;
    let position = originalText.length;

    const eraseInterval = setInterval(() => {
      position--;
      this.titleElement.textContent = originalText.substring(0, position);
      
      // Play keyboard sound while erasing
      if (originalText[position] !== ' ') {
        this.playKeySound();
      }

      if (position === 0) {
        clearInterval(eraseInterval);
        callback();
      }
    }, this.ERASE_SPEED);
  }

  typeNewText(fullText, language) {
    let position = 0;
    const textArray = this.getTextArray(fullText, language);

    const typeInterval = setInterval(() => {
      if (position < textArray.length) {
        // Play keyboard sound for each character (except spaces)
        if (textArray[position].char !== ' ' && this.keySound) {
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
      }
    }, this.TYPEWRITER_SPEED);
  }

  playKeySound() {
    try {
      if (!this.keySound) return;
      
      // Create a clone to allow overlapping sounds for rapid typing
      const sound = this.keySound.cloneNode();
      sound.currentTime = 0;
      sound.volume = 0.4;
      
      // Play the sound
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

  getTextArray(text, language) {
    // This will be used to build the text character by character
    // We'll store information about which characters are highlighted
    const highlightedWords = this.getHighlightedWords(language);
    const result = [];
    let charIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let isHighlighted = false;

      // Check if current position is within a highlighted word
      for (const word of highlightedWords) {
        const wordIndex = text.indexOf(word);
        if (wordIndex !== -1 && i >= wordIndex && i < wordIndex + word.length) {
          isHighlighted = true;
          break;
        }
      }

      result.push({ char, isHighlighted });
    }

    return result;
  }

  getHighlightedWords(language) {
    if (language === 'en') {
      return ['teams', 'Companies'];
    } else if (language === 'it') {
      return ['team', 'Aziende'];
    }
    return [];
  }

  updateContent(textArray) {
    let html = '';
    let currentHighlight = false;
    let buffer = '';

    for (let i = 0; i < textArray.length; i++) {
      const item = textArray[i];
      const nextItem = textArray[i + 1];
      const isNextHighlighted = nextItem ? nextItem.isHighlighted : false;

      if (item.isHighlighted && !currentHighlight) {
        // Start highlighting
        if (buffer) {
          html += buffer;
          buffer = '';
        }
        html += '<span class="highlight">' + item.char;
        currentHighlight = true;
      } else if (!item.isHighlighted && currentHighlight) {
        // End highlighting
        html += '</span>' + item.char;
        currentHighlight = false;
      } else if (item.isHighlighted && currentHighlight) {
        // Continue highlighting
        html += item.char;
      } else {
        // Regular character
        buffer += item.char;
      }
    }

    if (buffer) {
      html += buffer;
    }

    if (currentHighlight) {
      html += '</span>';
    }

    this.titleElement.innerHTML = html;
  }
}

// Initialize the animator when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  new TitleAnimator();
});
