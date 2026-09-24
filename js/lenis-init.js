/**
 * lenis-init.js — Lenis smooth scroll integration (additive, minimal risk).
 *
 * - Desktop: smooth wheel scrolling.
 * - Mobile: smooth touch scrolling (syncTouch).
 * - Graceful degradation: if the Lenis SDK fails to load, nothing breaks
 *   (native scrolling remains as-is).
 * - Exposes the instance at window.__lenis and window.T1.lenis for debugging / future scrollTo use.
 * - Inner scroll areas (dropdowns, item tables) and the #viewer modal opt out via the
 *   `data-lenis-prevent` attribute; no per-element handling is needed here.
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
    // 同時掛到專案既有的 window.T1 命名空間，供未來 scrollTo 等進階用法取用
    window.T1 = window.T1 || {};
    window.T1.lenis = lenis;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
