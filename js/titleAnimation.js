class TitleAnimator {
  constructor() {
    this.titleElement = document.querySelector('.hero-title');
    this.INTRO_ANIMATION_DURATION = 1500; // Wait for initial page animation
    this.STEP_DELAY = 2000; // Delay between steps
    this.TYPEWRITER_SPEED = 65; // Speed of typewriter effect in ms
    this.WORD_ERASE_SPEED = 300; // Speed of erasing words in ms
    this.isAnimating = false; // Track if animation is in progress
    // Users who prefer reduced motion get a static, fully rendered title.
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Headline variants and the sound base URL are rendered by the page
    // (_layouts/home.html) from the locale dictionary, so the animator no longer
    // keeps its own copies of both languages' strings.
    const config = this.readConfig();

    this.stepIndex = 0;
    this.animationToken = 0; // Incremented to invalidate in-flight animation timers on restart
    this.steps = config.steps;

    this.init();
  }

  // Read the JSON blob the page renders (#hero-animation). A missing or
  // unparsable blob yields no steps, which makes the animation a no-op instead
  // of an exception — the page itself has already been rendered by then, so
  // nothing is lost.
  readConfig() {
    const empty = { steps: [] };
    const element = document.getElementById('hero-animation');
    if (!element) return empty;

    try {
      const config = JSON.parse(element.textContent);
      return {
        steps: Array.isArray(config.steps) ? config.steps : []
      };
    } catch (e) {
      console.warn('Hero animation config is not valid JSON:', e);
      return empty;
    }
  }

  init() {
    if (!this.titleElement || this.steps.length === 0) return;

    // Apply highlights to the initial text immediately (no typing indicator
    // for reduced-motion users: the claim stays fully rendered). The sentence
    // is already in the page's language — this only wraps the highlighted words.
    const initialConfig = this.steps[0];
    this.updateContent(this.getTextArray(initialConfig.text, initialConfig.highlights), !this.prefersReducedMotion);

    // Add click listener to restart animation
    this.titleElement.style.cursor = 'pointer';
    this.titleElement.addEventListener('click', () => {
      if (!this.isAnimating) {
        this.resetAndAnimate();
      }
    });

    // Wait for the intro animation to complete before starting the title animation
    const introToken = this.animationToken;
    setTimeout(() => {
      if (introToken !== this.animationToken) return;
      this.startSequence();
    }, this.INTRO_ANIMATION_DURATION);
  }

  // The typewriter runs silently: the keyboard audio and its mute control were
  // removed with the Obsidian Precision revamp (D6 in
  // docs/design-system-revamp.md), which retired js/soundMute.js and sounds/.

  startSequence() {
    // Reduced motion: keep the first fully rendered claim, no auto-cycling.
    if (this.prefersReducedMotion) return;
    // Already at step 0 (initial text). Schedule transition to step 1.
    this.stepIndex = 0;
    this.scheduleNextStep();
  }

  scheduleNextStep() {
    // If we have more steps, schedule the next one
    const token = this.animationToken;

    if (this.stepIndex < this.steps.length - 1) {
      setTimeout(() => {
        if (token !== this.animationToken) return;
        this.transitionToStep(this.stepIndex + 1);
      }, this.STEP_DELAY);
    }
  }

  transitionToStep(nextIndex) {
    if (!this.titleElement) return;

    if (nextIndex >= this.steps.length) return;

    const nextStepConfig = this.steps[nextIndex];

    this.eraseText(() => {
      this.stepIndex = nextIndex;
      this.typeNewText(nextStepConfig.text, nextStepConfig.highlights, () => {
        this.scheduleNextStep();
      });
    });
  }

  resetAndAnimate() {
    // Invalidate any in-flight animation timers (erase/type/schedule)
    this.animationToken++;
    const token = this.animationToken;

    // Reset to initial state
    const initialText = this.steps[0].text;

    this.titleElement.textContent = initialText;
    this.updateContent(this.getTextArray(initialText, this.steps[0].highlights), !this.prefersReducedMotion);
    this.stepIndex = 0;

    // Reduced motion: re-render statically, never replay the typewriter.
    if (this.prefersReducedMotion) return;

    setTimeout(() => {
      if (token !== this.animationToken) return;
      this.startSequence();
    }, 500);
  }

  eraseText(callback) {
    this.isAnimating = true;
    const token = this.animationToken;

    // Get current config to preserve highlights
    const currentConfig = this.steps[this.stepIndex];
    const fullText = currentConfig.text;
    const textArray = this.getTextArray(fullText, currentConfig.highlights);

    let position = textArray.length;

    const eraseInterval = setInterval(() => {
      // Bail out if the animation was restarted (e.g. language changed mid-run)
      if (token !== this.animationToken) {
        clearInterval(eraseInterval);
        return;
      }

      // Logic for word-by-word deletion
      const currentString = fullText.substring(0, position);
      const lastSpaceIndex = currentString.lastIndexOf(' ');

      if (lastSpaceIndex !== -1) {
        position = lastSpaceIndex;
      } else {
        position = 0;
      }

      // Update content using the array slice, preserving HTML structure
      this.updateContent(textArray.slice(0, position));

      if (position === 0) {
        clearInterval(eraseInterval);
        callback();
      }
    }, this.WORD_ERASE_SPEED);
  }

  typeNewText(fullText, highlights, callback) {
    let position = 0;
    const token = this.animationToken;
    const textArray = this.getTextArray(fullText, highlights);

    // Check if this is the last step
    const isLastStep = this.stepIndex === this.steps.length - 1;

    const typeInterval = setInterval(() => {
      // Bail out if the animation was restarted (e.g. language changed mid-run)
      if (token !== this.animationToken) {
        clearInterval(typeInterval);
        return;
      }

      if (position < textArray.length) {
        // Update the content with the current position
        this.updateContent(textArray.slice(0, position + 1));
        position++;
      } else {
        clearInterval(typeInterval);
        // Final update to ensure all content is displayed with proper highlighting
        // Show indicator only if NOT the last step
        this.updateContent(textArray, !isLastStep);
        this.isAnimating = false;
        if (callback) callback();
      }
    }, this.TYPEWRITER_SPEED);
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

  updateContent(textArray, showTypingIndicator = false) {
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

    if (showTypingIndicator) {
      html += '<span class="typing-dots"><span></span><span></span><span></span></span>';
    }

    this.titleElement.innerHTML = html;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  new TitleAnimator();
});
