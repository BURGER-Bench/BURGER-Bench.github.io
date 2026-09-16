/* BURGER project page — lazy video loading, hover/tap playback, nav highlighting.
   Vanilla JS, no dependencies. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- data
  // 32 single-object classes rendered in simulation (assets/videos/gal_*.mp4)
  var GALLERY = [
    'apple', 'backpack', 'bicycle', 'birthday_cake', 'book', 'butterfly',
    'camera', 'car', 'cat', 'chair', 'cup', 'elephant', 'fish', 'flower',
    'guitar', 'horse', 'house', 'moon', 'mug', 'owl', 'palm_tree', 'piano',
    'pineapple', 'rabbit', 'sailboat', 'shoe', 'snowman', 'sun',
    'television', 'train', 'umbrella', 'vase'
  ];

  // Real-robot rollouts on the Franka Panda (assets/videos/real_*.mp4)
  var REAL = [
    'burger', 'bicycle', 'cup', 'birthday_cake', 'train',
    'horse', 'guitar', 'backpack', 'alarm_clock', 'elephant'
  ];

  var STROKE_GIFS = 10; // hamburger_generated_01..10.gif

  function label(slug) {
    return slug.replace(/_/g, ' ');
  }

  // ------------------------------------------------------- grid building
  function videoFigure(src, poster, caption, alt) {
    var fig = document.createElement('figure');
    var v = document.createElement('video');
    v.setAttribute('data-lazy', src);
    v.poster = poster;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    v.setAttribute('aria-label', alt);
    var cap = document.createElement('figcaption');
    cap.textContent = caption;
    fig.appendChild(v);
    fig.appendChild(cap);
    return fig;
  }

  function fillGrid(id, slugs, prefix, captionFn) {
    var host = document.getElementById(id);
    if (!host) return;
    var frag = document.createDocumentFragment();
    slugs.forEach(function (s) {
      frag.appendChild(videoFigure(
        'assets/videos/' + prefix + s + '.mp4',
        'assets/posters/' + prefix + s + '.jpg',
        captionFn(s),
        'Robot drawing a ' + label(s)
      ));
    });
    host.appendChild(frag);
  }

  fillGrid('galleryGrid', GALLERY, 'gal_', function (s) { return '“draw a ' + label(s) + '”'; });
  fillGrid('realGrid', REAL, 'real_', function (s) { return label(s); });

  // stroke-order GIF grid
  (function () {
    var host = document.getElementById('strokeGrid');
    if (!host) return;
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= STROKE_GIFS; i++) {
      var n = String(i).padStart(2, '0');
      var img = document.createElement('img');
      img.src = 'assets/images/hamburger_generated_' + n + '.gif';
      img.loading = 'lazy';
      img.alt = 'Stroke-order animation for generated hamburger sketch ' + i;
      frag.appendChild(img);
    }
    host.appendChild(frag);
  })();

  // --------------------------------------------------- lazy source attach
  // Nothing downloads until a video is near the viewport. Posters carry the
  // first frame, so the grids look complete before any video bytes move.
  var attach = function (v) {
    if (v.dataset.loaded) return;
    var src = v.getAttribute('data-lazy');
    if (!src) return;
    var s = document.createElement('source');
    s.src = src;
    s.type = 'video/mp4';
    v.appendChild(s);
    v.dataset.loaded = '1';
    v.load();
  };

  var lazyVideos = function () {
    return Array.prototype.slice.call(document.querySelectorAll('video[data-lazy]'));
  };

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          attach(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '300px 0px' });
    lazyVideos().forEach(function (v) { io.observe(v); });
  } else {
    lazyVideos().forEach(attach);
  }

  // ------------------------------------------- hover / tap to play
  // Desktop: play on pointer enter, pause and rewind on leave.
  // Touch: tap toggles, since there is no hover.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('pointerenter', function (e) {
    var v = e.target;
    if (!canHover || reduced || !v.matches || !v.matches('video[data-lazy]')) return;
    attach(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }, true);

  document.addEventListener('pointerleave', function (e) {
    var v = e.target;
    if (!canHover || !v.matches || !v.matches('video[data-lazy]')) return;
    v.pause();
    v.currentTime = 0;
  }, true);

  document.addEventListener('click', function (e) {
    var v = e.target.closest ? e.target.closest('video[data-lazy]') : null;
    if (!v || canHover) return;
    attach(v);
    if (v.paused) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      v.pause();
    }
  });

  // Free decoder resources: pause anything that scrolls well out of view.
  if ('IntersectionObserver' in window) {
    var pauser = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting && !e.target.paused) e.target.pause();
      });
    }, { rootMargin: '150px 0px' });
    lazyVideos().forEach(function (v) { pauser.observe(v); });
  }

  // The hero autoplays; pause it when scrolled past so it costs nothing.
  var hero = document.querySelector('.hero-video');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var p = hero.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          hero.pause();
        }
      });
    }, { threshold: 0.1 }).observe(hero);
  }

  // ------------------------------------------------- nav section highlight
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-52px 0px -70% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
