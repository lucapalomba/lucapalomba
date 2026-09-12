/**
 * soundMute.js — persisted mute state for the typewriter's keyboard sounds.
 *
 * The state has to be readable by titleAnimation.js *before* it builds its
 * audio pool, and writable from the navbar toggle, so it lives in its own
 * module with a small API instead of inside the animator. Load this file
 * before titleAnimation.js (see `page_scripts` in index.html).
 *
 * Storage follows the js/i18n.js idiom: localStorage throws in restrictive
 * contexts, and a missing or unexpected value just means "not muted".
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

    // The label is state dependent, so it is resolved here rather than left
    // to the button's data-i18n-aria attribute: that attribute only carries
    // the initial wording, and i18n.js would otherwise overwrite it with the
    // same string on every language change.
    const applyLabels = () => {
        document.querySelectorAll('.sound-toggle').forEach((button) => {
            button.setAttribute('aria-pressed', muted ? 'true' : 'false');
            if (!window.i18n || !window.i18n.translations) return;
            const key = muted ? 'sound.unmute' : 'sound.mute';
            const label = window.i18n.t(key);
            if (label && label !== key) {
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

        // i18n.js runs its own translate() before dispatching these, and it
        // dispatches from an async fetch that may already have resolved, so
        // apply once immediately and again on both events.
        applyLabels();
        document.addEventListener('i18n:ready', applyLabels);
        document.addEventListener('i18n:languageChanged', applyLabels);
    });
})();
