/* BURGER project page — vanilla JS, no dependencies.
   1. video tiles: lazy source attach, hover/tap playback, off-screen pause
   2. trajectory explorer (LIBERO vs BURGER, real data behind the paper's Fig. 2)
   3. k-sweep chart, 4. pipeline stroke-order animation, 5. tabs / nav / copy */
(function () {
  'use strict';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var V = 'assets/videos/', P = 'assets/posters/';

  // ------------------------------------------------------------------ data
  var GALLERY = ['apple', 'backpack', 'bicycle', 'birthday_cake', 'book', 'butterfly', 'camera', 'car',
    'cat', 'chair', 'cup', 'elephant', 'fish', 'flower', 'guitar', 'horse', 'house', 'moon', 'mug', 'owl',
    'palm_tree', 'piano', 'pineapple', 'rabbit', 'sailboat', 'shoe', 'snowman', 'sun', 'television',
    'train', 'umbrella', 'vase'];
  var PIPE = ['bicycle', 'cat', 'owl', 'sailboat', 'birthday_cake', 'elephant', 'guitar', 'house'];
  var COMP = [['comp_leaf_moon', 'a leaf left of a moon', 'seen pair'], ['comp_apple_berry', 'an apple left of a blueberry', 'unseen pair']];
  var CIRC = [['circ_openvla', 'OpenVLA', 'autoregressive'], ['circ_oft1', 'OpenVLA-OFT', 'chunk 1'],
    ['circ_oft8', 'OpenVLA-OFT', 'chunk 8'], ['circ_fast', 'π0-FAST', 'FAST tokens'],
    ['circ_pi05', 'π0.5', 'flow matching']];
  var SIMS = [['sim_sapien', 'SAPIEN (ManiSkill)'], ['sim_mujoco', 'MuJoCo'], ['sim_isaac', 'Isaac Sim']];
  var KSWEEP = [  // data_dist_analysis robustness sweep (same codebook procedure, k varied)
    { k: 8, lib: 1.055, bur: 3.633 }, { k: 12, lib: 1.099, bur: 5.124 }, { k: 16, lib: 1.088, bur: 5.999 },
    { k: 24, lib: 1.085, bur: 7.130 }, { k: 32, lib: 1.056, bur: 7.858 }, { k: 48, lib: 1.053, bur: 9.224 }];

  // ------------------------------------------------------------------ video tiles
  var ICONS = '<svg class="i-play" viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg>' +
              '<svg class="i-pause" viewBox="0 0 10 10"><path d="M2 1h2v8H2zM6 1h2v8H6z"/></svg>';
  function tile(name, caption, opts) {
    opts = opts || {};
    var f = document.createElement('figure'); f.className = 'tile';
    var fr = document.createElement('div'); fr.className = 'frame';
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', '');
    v.preload = 'none'; v.poster = P + name + '.jpg'; v.dataset.src = V + name + '.mp4';
    v.setAttribute('aria-label', opts.label || caption || name);
    if (opts.auto) v.dataset.auto = '1';
    fr.appendChild(v);
    var b = document.createElement('span'); b.className = 'badge'; b.dataset.k = name; b.dataset.pre = opts.real ? 'real · ' : '';
    b.hidden = true; fr.appendChild(b);
    var btn = document.createElement('button'); btn.className = 'play'; btn.type = 'button';
    btn.setAttribute('aria-label', 'Play ' + (caption || name)); btn.innerHTML = ICONS; fr.appendChild(btn);
    f.appendChild(fr);
    if (caption != null) { var c = document.createElement('figcaption'); c.innerHTML = caption; f.appendChild(c); }
    return f;
  }
  function attach(v) { if (v.dataset.src && !v.src) { v.src = v.dataset.src; v.load(); } }
  function play(v) { attach(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function setPlaying(v, on) { var t = v.closest('.tile'); if (t) t.classList.toggle('playing', on); }

  function wireTiles(root) {
    $$('.tile', root).forEach(function (t) {
      if (t.dataset.wired) return; t.dataset.wired = '1';
      var v = $('video', t), btn = $('.play', t);
      v.addEventListener('play', function () { setPlaying(v, true); });
      v.addEventListener('pause', function () { setPlaying(v, false); });
      var toggle = function (e) { e.preventDefault(); if (v.paused) play(v); else v.pause(); };
      btn.addEventListener('click', toggle);
      if (HOVER && !v.dataset.auto) {
        t.addEventListener('mouseenter', function () { play(v); });
        t.addEventListener('mouseleave', function () { v.pause(); });
      } else {
        $('.frame', t).addEventListener('click', function (e) { if (e.target !== btn && !btn.contains(e.target)) toggle(e); });
      }
    });
  }
  // near the viewport -> attach source (and autoplay "auto" tiles); far away -> pause
  var near = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { attach(v); if (v.dataset.auto && !REDUCED) play(v); }
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '250px 0px' }) : null;
  function observe(root) { $$('video[data-src]', root).forEach(function (v) { near ? near.observe(v) : attach(v); }); }

  function fill(id, list, mk) { var el = document.getElementById(id); if (!el) return; list.forEach(function (x, i) { el.appendChild(mk(x, i)); }); }
  fill('gallery', GALLERY, function (c) { return tile('g_' + c, c.replace(/_/g, ' '), { label: 'Demonstration: draw a ' + c.replace(/_/g, ' ') }); });
  fill('same-helmet', [0, 1, 2, 3, 4, 5, 6, 7], function (i) { return tile('same_helmet_' + i, null, { auto: true, label: 'Helmet demonstration ' + (i + 1) }); });
  fill('sims', SIMS, function (s) { return tile(s[0], s[1], { auto: true }); });
  fill('comp-videos', COMP, function (c) { return tile(c[0], '<q>draw ' + c[1] + '</q> <span class="hint">· ' + c[2] + '</span>'); });
  fill('circ', CIRC, function (c) { return tile(c[0], c[1] + '<span>' + c[2] + '</span>', { auto: true, label: c[1] + ' ' + c[2] + ' drawing a circle' }); });
  $$('[data-clips]').forEach(function (el) {
    el.dataset.clips.split('|').forEach(function (s) {
      var kv = s.split(':');   // every clip in these rows is real hardware footage
      el.appendChild(tile(kv[0], kv[1], { real: true }));
    });
  });
  wireTiles(document); observe(document);
  // speed badges: measured playback speed vs. real (or simulated) time, see build/speeds.py
  fetch('assets/data/speeds.json').then(function (r) { return r.json(); }).then(function (sp) {
    $$('.badge[data-k]').forEach(function (b) {
      var v = sp[b.dataset.k]; if (!v) return;
      b.textContent = b.dataset.pre + (v < 1.5 ? '1×' : (v >= 10 ? Math.round(v) : v.toFixed(v % 1 ? 1 : 0)) + '×');
      b.hidden = false;
    });
  });
  // details: load sources only when opened
  $$('details').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) observe(d); }); });

  // hero: stop decoding when scrolled away
  var hero = document.getElementById('hero-video');
  if (hero) {
    if (REDUCED) { hero.removeAttribute('autoplay'); hero.pause(); }
    if (near) new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.isIntersecting) { if (!REDUCED) play(hero); } else hero.pause(); }); }).observe(hero);
  }
  // ------------------------------------------------------------------ shared tooltip
  var tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add('on');
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)) + 'px';
    tip.style.top = (y - h - 12 < 8 ? y + 16 : y - h - 12) + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  // ------------------------------------------------------------------ trajectory explorer
  var EX = $('#explorer');
  if (EX) {
    var D = null, sel = { libero: 0, burger: 0 };
    var cLib = $('#ex-lib'), cBur = $('#ex-bur');
    var optColor = $('#ex-color'), optMean = $('#ex-mean');

    var start = function () {
      fetch('assets/data/modes.json').then(function (r) { return r.json(); }).then(function (d) {
        D = d;
        // default pair: each dataset's own median instruction (not its best case)
        ['libero', 'burger'].forEach(function (s) { sel[s] = medianIndex(D[s]); });
        drawStrip(); render();
      });
    };
    if ('IntersectionObserver' in window) {
      var once = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { once.disconnect(); start(); } }, { rootMargin: '400px 0px' });
      once.observe(EX);
    } else start();

    function medianIndex(rows) {
      var idx = rows.map(function (r, i) { return i; }).sort(function (a, b) { return rows[a].eff_modes - rows[b].eff_modes; });
      return idx[Math.floor(idx.length / 2)];
    }
    function render() {
      draw(cLib, D.libero[sel.libero], css('--lib'));
      draw(cBur, D.burger[sel.burger], css('--bur'));
      $('#ex-lib-name').textContent = D.libero[sel.libero].instruction;
      $('#ex-bur-name').textContent = D.burger[sel.burger].instruction;
      $('#ex-lib-modes').textContent = D.libero[sel.libero].eff_modes.toFixed(2);
      $('#ex-bur-modes').textContent = D.burger[sel.burger].eff_modes.toFixed(2);
      $('#ex-lib-n').textContent = D.libero[sel.libero].xy.length;
      $('#ex-bur-n').textContent = D.burger[sel.burger].xy.length;
      $$('#strip circle').forEach(function (c) { c.classList.toggle('sel', +c.dataset.i === sel[c.dataset.s]); });
    }
    // world -> canvas: image-right = +y, image-down = +x, so drawings appear as on the canvas camera
    function draw(cv, row, hue) {
      var ctx = cv.getContext('2d'), W = cv.width, H = cv.height, pad = 42;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.dataset.dpr != dpr) { cv.width = 520 * dpr; cv.height = 520 * dpr; cv.dataset.dpr = dpr; W = cv.width; H = cv.height; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.scale(dpr, dpr); W /= dpr; H /= dpr;
      var T = row.xy.map(function (f) { var p = []; for (var i = 0; i < f.length; i += 2) p.push([f[i + 1], f[i]]); return p; });
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      T.forEach(function (p) { p.forEach(function (q) { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); }); });
      var span = Math.max(maxx - minx, maxy - miny, 40), s = (W - 2 * pad) / span;
      var ox = pad + ((W - 2 * pad) - (maxx - minx) * s) / 2 - minx * s, oy = pad + ((H - 2 * pad) - (maxy - miny) * s) / 2 - miny * s;
      var X = function (q) { return [ox + q[0] * s, oy + q[1] * s]; };
      // rank this instruction's clusters by size; top three get categorical hues, the rest grey
      var cnt = {}; row.codes.forEach(function (c) { cnt[c] = (cnt[c] || 0) + 1; });
      var rank = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      var pal = [css('--c1'), css('--c2'), css('--c3')], other = css('--c-other');
      var colorOf = function (i) { if (!optColor.checked) return hue; var r = rank.indexOf(String(row.codes[i])); return r < 3 ? pal[r] : other; };
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      var order = T.map(function (p, i) { return i; });
      if (optColor.checked) order.sort(function (a, b) { return rank.indexOf(String(row.codes[b])) - rank.indexOf(String(row.codes[a])); });
      order.forEach(function (i) {
        ctx.strokeStyle = colorOf(i); ctx.globalAlpha = optColor.checked ? 0.62 : 0.42; ctx.lineWidth = 1.6;
        ctx.beginPath(); T[i].forEach(function (q, j) { var p = X(q); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (optMean.checked) {   // pointwise mean of the arc-length-resampled paths
        var m = T[0].map(function (_, j) { var a = 0, b = 0; T.forEach(function (p) { a += p[j][0]; b += p[j][1]; }); return [a / T.length, b / T.length]; });
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
        ctx.beginPath(); m.forEach(function (q, j) { var p = X(q); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
        ctx.strokeStyle = css('--ink'); ctx.lineWidth = 2.6; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      var o = X([0, 0]);        // shared start point
      ctx.fillStyle = css('--ink'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o[0], o[1], 5, 0, 7); ctx.fill(); ctx.stroke();
      // scale bar: 5 cm (or 2 cm when the paths are small)
      var cm = span > 120 ? 50 : 20, L = cm * s;
      ctx.strokeStyle = css('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W - 18 - L, H - 18); ctx.lineTo(W - 18, H - 18); ctx.stroke();
      ctx.fillStyle = css('--muted'); ctx.font = '12px Inter, system-ui, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText((cm / 10) + ' cm', W - 18, H - 26);
    }
    optColor.addEventListener('change', render); optMean.addEventListener('change', render);
    $('#ex-shuffle').addEventListener('click', function () {
      if (!D) return;
      sel.libero = Math.floor(Math.random() * D.libero.length); sel.burger = Math.floor(Math.random() * D.burger.length); render();
    });
    var resizeT; window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { if (D) render(); }, 150); });

    // dot strip: every instruction of both datasets on one effective-modes axis
    function drawStrip() {
      var svg = $('#strip'); svg.innerHTML = '';
      var W = svg.clientWidth || 900, H = 190, L = W < 520 ? 66 : 78, R = 14, rows = { libero: 50, burger: 122 };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var xmax = 12, X = function (v) { return L + (v - 1) / (xmax - 1) * (W - L - R); };
      var ax = el('g', { 'class': 'axis' }, svg);
      for (var t = 1; t <= xmax; t++) {
        if (W < 520 && t % 2 === 0 && t !== 12) continue;
        el('line', { x1: X(t), x2: X(t), y1: 14, y2: 156 }, ax);
        var tx = el('text', { x: X(t), y: 172, 'text-anchor': 'middle' }, ax); tx.textContent = t;
      }
      var cap = el('text', { x: L, y: 188, 'class': 'xcap' }, svg); cap.textContent = 'effective trajectory modes per instruction →';
      [['libero', 'LIBERO'], ['burger', 'BURGER']].forEach(function (r) {
        var lb = el('text', { x: 0, y: rows[r[0]] + 4, 'class': 'lbl' }, svg); lb.textContent = r[1];
        var placed = [];
        D[r[0]].map(function (row, i) { return { v: row.eff_modes, i: i }; }).sort(function (a, b) { return a.v - b.v; })
          .forEach(function (d) {
            // deterministic beeswarm: stack overlapping dots
            // centred dot grid: try rows 0,±1,±2,±3 then columns 0,±1,… around the true value, so
            // tied values (31 LIBERO instructions at exactly 1.00) stay visible and centred on it
            var g = W < 520 ? 5.6 : 8.5, x0 = X(d.v), y0 = rows[r[0]], x = x0, y = y0, found = false;
            var free = function (px, py) { return !placed.some(function (p) { return Math.abs(p[0] - px) < g && Math.abs(p[1] - py) < g; }); };
            for (var ci = 0; ci < 15 && !found; ci++) {
              var col = (ci % 2 ? 1 : -1) * Math.ceil(ci / 2);
              for (var ri = 0; ri < (W < 520 ? 9 : 7) && !found; ri++) {
                var row = (ri % 2 ? 1 : -1) * Math.ceil(ri / 2);
                if (free(x0 + col * g, y0 + row * g)) { x = x0 + col * g; y = y0 + row * g; found = true; }
              }
            }
            placed.push([x, y]);
            var c = el('circle', { cx: x, cy: y, r: W < 520 ? 3 : 4.6, fill: r[0] === 'libero' ? css('--lib') : css('--bur'), tabindex: 0,
              'data-s': r[0], 'data-i': d.i, role: 'button', 'aria-label': D[r[0]][d.i].instruction + ', ' + d.v.toFixed(2) + ' modes' }, svg);
            var pick = function () { sel[r[0]] = d.i; render(); };
            c.addEventListener('click', pick);
            c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
            c.addEventListener('mouseenter', function (e) { showTip('<b>' + D[r[0]][d.i].instruction + '</b><br>' + d.v.toFixed(2) + ' effective modes', e.clientX, e.clientY); });
            c.addEventListener('mousemove', function (e) { showTip(tip.innerHTML, e.clientX, e.clientY); });
            c.addEventListener('mouseleave', hideTip);
          });
        // mean marker sits above the swarm, label never overlaps dots
        // label sits beside the line, on the side away from the dense end of the swarm
        var mean = D[r[0] + '_mean'], top = rows[r[0]] - 30, left = r[0] === 'libero';
        el('line', { x1: X(mean), x2: X(mean), y1: top - 6, y2: rows[r[0]] + 30, stroke: css('--ink'), 'stroke-width': 1.25, 'stroke-dasharray': '2 3' }, svg);
        var mt = el('text', { x: X(mean) + (left ? 22 : 0), y: top - 2, 'class': 'meanlbl', 'text-anchor': left ? 'start' : 'middle' }, svg);
        mt.textContent = 'mean ' + mean.toFixed(2);
      });
    }
    var stripT; window.addEventListener('resize', function () { clearTimeout(stripT); stripT = setTimeout(function () { if (D) { drawStrip(); render(); } }, 200); });
  }
  // ------------------------------------------------------------------ k-sweep (small line chart)
  var ks = $('#ksweep');
  if (ks) {
    var drawK = function () {
      ks.innerHTML = '';
      var W = ks.clientWidth || 320, H = 170, L = 26, R = 60, T = 10, B = 26;
      ks.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var kx = function (k) { return L + (Math.log(k) - Math.log(8)) / (Math.log(48) - Math.log(8)) * (W - L - R); };
      var vy = function (v) { return T + (1 - v / 10) * (H - T - B); };
      var g = el('g', { 'class': 'grid' }, ks);
      [0, 5, 10].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: vy(v), y2: vy(v) }, g);
        var t = el('text', { x: L - 6, y: vy(v) + 4, 'text-anchor': 'end' }, ks); t.textContent = v;
      });
      KSWEEP.forEach(function (d) { var t = el('text', { x: kx(d.k), y: H - 8, 'text-anchor': 'middle' }, ks); t.textContent = d.k; });
      var kl = el('text', { x: W - R + 8, y: H - 8 }, ks); kl.textContent = 'k';
      [['lib', 'LIBERO'], ['bur', 'BURGER']].forEach(function (s) {
        var d = KSWEEP.map(function (p, i) { return (i ? 'L' : 'M') + kx(p.k).toFixed(1) + ' ' + vy(p[s[0]]).toFixed(1); }).join(' ');
        el('path', { d: d, fill: 'none', 'class': 'l-' + s[0], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, ks);
        KSWEEP.forEach(function (p) {
          var c = el('circle', { cx: kx(p.k), cy: vy(p[s[0]]), r: p.k === 24 ? 4.5 : 3.2, 'class': 'd-' + s[0], stroke: '#fff', 'stroke-width': 1.6 }, ks);
          c.addEventListener('mouseenter', function (e) { showTip('<b>' + s[1] + '</b>, k = ' + p.k + '<br>' + p[s[0]].toFixed(2) + ' effective modes', e.clientX, e.clientY); });
          c.addEventListener('mouseleave', hideTip);
        });
        var last = KSWEEP[KSWEEP.length - 1];
        var t = el('text', { x: kx(last.k) + 8, y: vy(last[s[0]]) + 4, 'class': 'end' }, ks); t.textContent = s[1];
      });
    };
    drawK(); var kT; window.addEventListener('resize', function () { clearTimeout(kT); kT = setTimeout(drawK, 150); });
  }

  // ------------------------------------------------------------------ pipeline stage switcher + stroke animation
  var pick = $('#pipe-pick');
  if (pick) {
    var cv = $('#pipe-svg'), ctx2 = cv.getContext('2d'), raf = 0, strokesCache = {};
    var pv = $('#pipe-video');
    PIPE.forEach(function (c, i) {
      var b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === 0 ? 'true' : 'false'); b.textContent = c.replace(/_/g, ' '); b.dataset.c = c;
      b.addEventListener('click', function () { choose(c); }); pick.appendChild(b);
    });
    var choose = function (c) {
      $$('.chip', pick).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.c === c ? 'true' : 'false'); });
      var nm = c.replace(/_/g, ' ');
      $('#pipe-prompt').textContent = 'draw ' + (/^[aeiou]/.test(nm) ? 'an ' : 'a ') + nm;
      $('#pipe-sketch').src = 'assets/images/sketch/' + c + '.webp';
      $('#pipe-skel').src = 'assets/images/skeleton/' + c + '.webp';
      pv.poster = P + 'g_' + c + '.jpg'; pv.dataset.src = V + 'g_' + c + '.mp4'; pv.removeAttribute('src');
      if (pipeVisible) { play(pv); }
      (strokesCache[c] ? Promise.resolve(strokesCache[c]) : fetch('assets/data/strokes/' + c + '.json').then(function (r) { return r.json(); }))
        .then(function (s) { strokesCache[c] = s; animate(s); });
    };
    // stroke order shown by brightness, like the paper's Fig. 1: early strokes light, late strokes dark
    var animate = function (s) {
      cancelAnimationFrame(raf);
      var dpr = Math.min(2, window.devicePixelRatio || 1), N = 512;
      cv.width = N * dpr; cv.height = N * dpr; ctx2.setTransform(dpr * N / s.w, 0, 0, dpr * N / s.h, 0, 0);
      var paths = s.paths.map(function (f) { var p = []; for (var i = 0; i < f.length; i += 2) p.push([f[i], f[i + 1]]); return p; });
      var lens = paths.map(function (p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; });
      var total = lens.reduce(function (a, b) { return a + b; }, 0) || 1;
      var colorAt = function (i) { var t = paths.length > 1 ? i / (paths.length - 1) : 1; var l = Math.round(78 - 58 * t); return 'hsl(214 62% ' + l + '%)'; };
      var drawUpTo = function (dist) {
        ctx2.clearRect(0, 0, s.w, s.h); ctx2.lineCap = 'round'; ctx2.lineJoin = 'round'; ctx2.lineWidth = 9;
        var acc = 0;
        for (var i = 0; i < paths.length; i++) {
          if (acc >= dist) break;
          var p = paths[i], left = dist - acc; ctx2.strokeStyle = colorAt(i); ctx2.beginPath(); ctx2.moveTo(p[0][0], p[0][1]);
          for (var j = 1; j < p.length; j++) {
            var seg = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]);
            if (seg > left) { var r = left / seg; ctx2.lineTo(p[j - 1][0] + (p[j][0] - p[j - 1][0]) * r, p[j - 1][1] + (p[j][1] - p[j - 1][1]) * r); break; }
            ctx2.lineTo(p[j][0], p[j][1]); left -= seg;
          }
          ctx2.stroke(); acc += lens[i];
        }
      };
      if (REDUCED) { drawUpTo(total); return; }
      var dur = 4200, hold = 1400, t0 = performance.now();
      var step = function (now) {
        var t = (now - t0) % (dur + hold);
        drawUpTo(Math.min(1, t / dur) * total);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    var pipeVisible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        pipeVisible = es[0].isIntersecting;
        if (pipeVisible) { if (!REDUCED) play(pv); } else { pv.pause(); }
      }, { rootMargin: '100px 0px' }).observe($('#pipe'));
    }
    choose(PIPE[0]);
  }

  // ------------------------------------------------------------------ fig. 6 model switch
  var seg = $('#fig6-seg');
  if (seg) $$('button', seg).forEach(function (b) {
    b.addEventListener('click', function () {
      $$('button', seg).forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
      $('#fig6-img').src = 'assets/figures/fig6_' + b.dataset.k + '.webp';
    });
  });

  // ------------------------------------------------------------------ tabs (WAI-ARIA pattern)
  $$('.tabs').forEach(function (tabs) {
    var list = $$('[role="tab"]', tabs);
    var activate = function (t, focus) {
      list.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
      observe(document.getElementById(t.getAttribute('aria-controls')));
    };
    list.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : null;
        if (j === null) return; e.preventDefault(); activate(list[(j + list.length) % list.length], true);
      });
    });
  });

  // ------------------------------------------------------------------ nav: scrolled state, active section, mobile menu
  var bar = $('#topbar'), links = $$('#navlist a'), menu = $('#navlist'), tg = $('.nav-toggle');
  var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && map[e.target.id]) { links.forEach(function (a) { a.classList.remove('active'); }); map[e.target.id].classList.add('active'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }
  if (tg) {
    tg.addEventListener('click', function () { var o = menu.classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
    links.forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { menu.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); tg.focus(); } });
  }

  // ------------------------------------------------------------------ copy BibTeX
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = $(b.dataset.copy).innerText;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { b.textContent = 'Select & copy'; });
      else b.textContent = 'Select & copy';
    });
  });
})();
