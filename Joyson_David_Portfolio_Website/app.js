(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll progress ---------- */
  var bar = document.getElementById('progress');
  function progress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', progress, { passive: true });
  progress();

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Active chapter ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { if (s) navObs.observe(s); });
  }

  /* ---------- Content work from manifest ---------- */
  var CATS = ['Movie Promotions', 'Cinema Campaigns', 'Media & OTT', 'Brand Advertising', 'Character & Animation'];
  var data = window.PORTFOLIO || [];
  var root = document.getElementById('contentRoot');

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDur(d) { if (!d) return ''; var s = Math.round(d); return s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's'; }

  function videoTile(item, project) {
    var vertical = item.o !== 'horizontal';
    var t = el('button', 'tile' + (vertical ? '' : ' h') + (item.poster ? '' : ' typo') + (/-ep\d\d\.jpg/.test(item.poster || '') ? ' card' : ''));
    t.type = 'button';
    t.setAttribute('aria-label', 'Play ' + item.title);
    t.dataset.url = item.url;
    t.dataset.title = project + ' — ' + item.title;
    t.dataset.o = vertical ? 'v' : 'h';
    if (item.poster) {
      var psrc = item.poster.indexOf('b64:') === 0 ? ((window.POSTERS || {})[item.poster.slice(4)] || '') : item.poster;
      t.innerHTML = '<img src="' + psrc + '" alt="' + esc(item.title) + '" loading="lazy">' +
        '<span class="shade"></span><span class="play"></span>' +
        '<span class="label"><span>' + esc(item.title) + '</span><span>' + fmtDur(item.dur) + '</span></span>';
    } else {
      t.innerHTML = '<span class="label"><span class="meta">' + esc(project) + '</span></span>' +
        '<span class="ep">' + esc(item.title) + '<span class="dot">.</span></span>' +
        '<span class="play"></span>';
    }
    t.addEventListener('click', function () {
      if (t.classList.contains('playing')) return;
      playInline(t);
    });
    return t;
  }

  function imageTile(src, project, i) {
    var vertical = /phantom/.test(src);
    var t = el('button', 'tile img' + (vertical ? '' : ' h'));
    t.type = 'button';
    t.setAttribute('aria-label', 'Open image ' + (i + 1));
    t.innerHTML = '<img src="' + src + '" alt="' + esc(project) + ' key art ' + (i + 1) + '" loading="lazy"><span class="shade"></span>' +
      '<span class="label"><span>' + esc(project) + '</span><span>' + String(i + 1).padStart(2, '0') + '</span></span>';
    t.addEventListener('click', function () { openModal({ img: src, title: project + ' — key art ' + (i + 1), o: vertical ? 'v' : 'h' }); });
    return t;
  }

  function playInline(tile) {
    tile.classList.add('playing');
    var frame = document.createElement('iframe');
    frame.src = tile.dataset.url;
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('loading', 'lazy');
    frame.title = tile.dataset.title;
    tile.innerHTML = '';
    tile.appendChild(frame);
    var ex = el('span', 'expand', '⤢');
    ex.title = 'Open larger';
    ex.addEventListener('click', function (e) { e.stopPropagation(); openModal({ url: tile.dataset.url, title: tile.dataset.title, o: tile.dataset.o }); });
    tile.appendChild(ex);
  }

  /* ---------- Modal ---------- */
  var modal = document.getElementById('modal');
  var modalFrame = document.getElementById('modalFrame');
  var modalTitle = document.getElementById('modalTitle');
  function openModal(opts) {
    modalTitle.textContent = opts.title || '';
    modalFrame.className = 'modal-frame ' + (opts.o === 'v' ? 'v' : 'h');
    modalFrame.innerHTML = '';
    if (opts.img) {
      var im = document.createElement('img'); im.src = opts.img; im.alt = opts.title || ''; modalFrame.appendChild(im);
    } else {
      var f = document.createElement('iframe'); f.src = opts.url; f.setAttribute('allow', 'autoplay; fullscreen'); f.setAttribute('allowfullscreen', ''); f.title = opts.title || 'Video';
      modalFrame.appendChild(f);
    }
    modal.hidden = false; modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open'); modal.hidden = true; modalFrame.innerHTML = '';
    document.body.style.overflow = '';
  }
  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  /* ---------- Render ---------- */
  CATS.forEach(function (cat, ci) {
    var projects = data.filter(function (p) { return p.cat === cat; });
    if (!projects.length) return;
    var total = projects.reduce(function (a, p) { return a + p.count; }, 0);
    var head = el('div', 'cat-head reveal',
      '<span class="meta"><span class="num">' + String(ci + 1).padStart(2, '0') + ' /</span></span>' +
      '<h3>' + esc(cat) + '<span class="dot">.</span></h3>' +
      '<span class="meta count">' + total + ' files</span>');
    root.appendChild(head);

    projects.forEach(function (p) {
      var row = el('article', 'project reveal');
      row.id = 'p-' + p.slug;
      var info = el('div', 'project-info');
      var videos = p.items.length;
      var kindLabel = videos ? videos + ' video' + (videos === 1 ? '' : 's') : p.count + ' images';
      if (p.slug === 'sweet60') kindLabel = '24 animations · 42 stills';
      if (p.slug === 'nikron') kindLabel = '14 posters';
      if (p.slug === 'owl') kindLabel = '7 clips · 1 key image';
      info.innerHTML =
        '<span class="meta"><span class="num">' + esc(p.client) + '</span> · ' + esc(p.year) + '</span>' +
        '<h4>' + esc(p.title) + '<span class="dot">.</span></h4>' +
        '<p class="body">' + esc(p.desc) + '</p>' +
        '<div class="chips">' + p.tools.map(function (t) { return '<span class="chip sm">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<span class="meta">' + kindLabel + '</span>';
      row.appendChild(info);

      var tiles = el('div', 'tiles');
      var horizontalOnly = p.items.length && p.items.every(function (i) { return i.o === 'horizontal'; });
      var mixed = p.items.some(function (i) { return i.o === 'horizontal'; }) && !horizontalOnly;
      if (horizontalOnly) tiles.classList.add('wide');
      if (!p.items.length && p.gallery.length) tiles.classList.add('gallery');

      var featN = p.nfeat || Math.min(3, p.items.length);
      var shown = 0;
      if (p.hero) { var ht = imageTile(p.hero, p.title, 0); ht.classList.add('feat'); tiles.appendChild(ht); }
      p.items.forEach(function (item, i) {
        var t = videoTile(item, p.title);
        if (mixed && item.o === 'horizontal') t.classList.add('landscape-row');
        if (i >= featN) t.classList.add('hidden'); else t.classList.add('feat');
        tiles.appendChild(t);
        shown++;
      });
      if (!p.items.length) {
        p.gallery.forEach(function (g, i) { var gt = imageTile(g, p.title, i); gt.classList.add('feat'); tiles.appendChild(gt); });
      } else if (p.gallery.length) {
        p.gallery.forEach(function (g, i) { var t = imageTile(g, p.title, i); t.classList.add('hidden'); tiles.appendChild(t); });
      }
      row.appendChild(tiles);

      var hiddenCount = tiles.querySelectorAll('.hidden').length;
      var totalTiles = tiles.children.length;
      if (hiddenCount) {
        var label = function (open) {
          return open ? 'Show featured only' : 'View all ' + totalTiles + ' <span class="muted">· +' + hiddenCount + ' more</span>';
        };
        var tg = el('button', 'toggle more', label(false));
        tg.type = 'button'; tg.setAttribute('aria-expanded', 'false');
        tg.addEventListener('click', function () {
          var open = tg.getAttribute('aria-expanded') === 'true';
          tiles.querySelectorAll('.tile:not(.feat)').forEach(function (t) { t.classList.toggle('hidden', open); });
          tg.setAttribute('aria-expanded', String(!open));
          tg.innerHTML = label(!open);
        });
        info.appendChild(tg);
      }
      if (p.count > totalTiles) {
        var note = el('span', 'meta more', '+' + (p.count - totalTiles) + ' more on Drive');
        info.appendChild(note);
      }
      root.appendChild(row);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (r) { r.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
  }
})();
