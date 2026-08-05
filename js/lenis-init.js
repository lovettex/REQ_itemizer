/**
 * lenis-init.js — Lenis smooth scroll integration (additive, minimal risk).
 *
 * - Desktop: smooth wheel scrolling.
 * - Mobile: smooth touch scrolling (syncTouch).
 * - Graceful degradation: if the Lenis SDK fails to load, nothing breaks
 *   (native scrolling remains as-is).
 * - Exposes the instance at window.__lenis for debugging / future scrollTo use.
 */
(function () {
  'use strict';

  function init() {
    if (typeof Lenis === 'undefined') return; // SDK not loaded → skip silently
    if (window.__lenis) return;               // already initialized
    var lenis = new Lenis({
      autoRaf: true,        // requestAnimationFrame loop handled internally
      lerp: 0.1,            // easing
      smoothWheel: true,    // desktop wheel smoothing
      syncTouch: true,      // mobile touch smoothing
      touchMultiplier: 1.2
    });
    window.__lenis = lenis;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
