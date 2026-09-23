/**
 * Community page interactions
 *
 * 1. Participant logo marquee pause/play toggle (WCAG 2.2.2: auto-moving
 *    content lasting more than 5s needs a control to pause it).
 * 2. "Community in action" photo carousel: pages through photos three at a
 *    time on desktop, two on tablet, one on mobile. Prev/next buttons and a
 *    "current / total" status are the only controls; there is no auto-scroll.
 */

(function () {
  'use strict';

  // Participant logo marquee pause/play toggle -----------------------------
  function initLogoMarquee() {
    var track = document.getElementById('communityLogoTrack');
    var button = document.getElementById('communityLogoPause');
    if (!track || !button) return;

    button.addEventListener('click', function () {
      var paused = track.classList.toggle('is-paused');
      button.setAttribute('aria-pressed', paused ? 'true' : 'false');
      button.textContent = paused ? 'Play' : 'Pause';
    });
  }

  function init() {
    initLogoMarquee();

    var track = document.getElementById('communityPhotoTrack');
    var prev = document.getElementById('communityPhotoPrev');
    var next = document.getElementById('communityPhotoNext');
    var status = document.getElementById('communityPhotoStatus');
    if (!track || !prev || !next || !status) return;

    var viewport = track.parentElement;
    var photos = track.querySelectorAll('figure');
    var total = photos.length;
    var page = 0;

    function perPage() {
      var width = window.innerWidth;
      if (width <= 640) return 1;
      if (width <= 1024) return 2;
      return 3;
    }

    function gap() {
      var value = window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap;
      var parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    function pageCount() {
      return Math.max(1, Math.ceil(total / perPage()));
    }

    function update() {
      var n = perPage();
      var pages = pageCount();
      if (page > pages - 1) page = pages - 1;
      if (page < 0) page = 0;

      var g = gap();
      var cardWidth = (viewport.clientWidth - g * (n - 1)) / n;
      // Never scroll past the last photo: the final page may be partial.
      var startIndex = Math.min(page * n, Math.max(0, total - n));
      track.style.transform = 'translateX(-' + (startIndex * (cardWidth + g)) + 'px)';

      status.textContent = (page + 1) + ' / ' + pages;
      prev.disabled = page === 0;
      next.disabled = page === pages - 1;
    }

    prev.addEventListener('click', function () { page -= 1; update(); });
    next.addEventListener('click', function () { page += 1; update(); });

    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(update, 100);
    });

    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
