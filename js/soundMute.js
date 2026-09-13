/**
 * soundMute.js — persisted mute state for the typewriter's keyboard sounds.
 *
 * The state has to be readable by titleAnimation.js *before* it builds its
 * audio pool, and writable from the navbar toggle, so it lives in its own
 * module with a small API instead of inside the animator. Load this file
 * before titleAnimation.js (see `page_scripts` in index.html).
 *
 * Storage follows the same defensive idiom as js/langPref.js: localStorage
 * throws in restrictive contexts, and a missing or unexpected value just means
 * "not muted".
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'soundMuted';

    const readStored = () => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (e) {
            return false;
        }
    };

    const writeStored = (muted) => {
        try {
            localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
        } catch (e) {
            // The preference simply will not survive a reload; the toggle
            // still works for this page view.
        }
    };

    let muted = readStored();

    // Both wordings are rendered server-side into the button
    // (data-label-mute / data-label-unmute, from the locale dictionary), so the
    // correct one can just be picked here: the label depends on the mute state,
    // not on the language, and the page already arrived in the right language.
    // Nothing has to wait for a translation pass or react to a language change —
    // the old window.i18n lookup went away with the client-side i18n layer.
    const applyLabels = () => {
        document.querySelectorAll('.sound-toggle').forEach((button) => {
            button.setAttribute('aria-pressed', muted ? 'true' : 'false');
            const label = muted ? button.dataset.labelUnmute : button.dataset.labelMute;
            if (label) {
                button.setAttribute('aria-label', label);
            }
        });
    };

    const setMuted = (next) => {
        muted = !!next;
        writeStored(muted);
        applyLabels();
        document.dispatchEvent(new CustomEvent('sound:muteChanged', { detail: { muted: muted } }));
    };

    window.soundMute = {
        isMuted: () => muted,
        setMuted: setMuted,
        toggle: () => setMuted(!muted)
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.sound-toggle').forEach((button) => {
            button.addEventListener('click', () => window.soundMute.toggle());
        });

        applyLabels();
    });
})();
