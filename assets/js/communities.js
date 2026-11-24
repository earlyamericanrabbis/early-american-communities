/* Early American Communities: the map, search, the rabbanim from Early American Rabbis, and the photo viewer. */
(function () {
  var STATE_NAMES = window.STATE_NAMES || {};
  var RABBIS_SITE = (window.RABBIS_SITE || '').replace(/\/$/, '');
  var RABBIS_ORIGIN = RABBIS_SITE ? new URL(RABBIS_SITE).origin : '';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function normPlace(s) { return String(s || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim(); }
  function normName(s) { return String(s || '').toLowerCase().replace(/^(rabbi|rav|rev\.?|reverend|dr\.?|harav)\s+/g, '').replace(/[^a-z֐-׿]+/g, ' ').trim(); }
  function abs(u) { return !u ? '' : /^https?:/.test(u) ? u : RABBIS_ORIGIN + u; }

  /* ---------- rabbis from Early American Rabbis ---------- */
  var rabbisP = null;
  function loadRabbis() {
    if (!rabbisP) rabbisP = RABBIS_SITE ? fetch(RABBIS_SITE + '/rabbis.json').then(function (r) { return r.json(); }).catch(function () { return []; }) : Promise.resolve([]);
    return rabbisP;
  }
  function rabbisFor(list, places) {
    var want = places.map(normPlace);
    return list.filter(function (r) { return String(r.places || '').split(';').some(function (p) { return want.indexOf(normPlace(p)) > -1; }); });
  }

  /* ---------- map ---------- */
  function setupMap(frame, opts) {
    var svg = frame.querySelector('svg.us-map');
    if (!svg || !window.d3) return null;
    var proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    var z = document.createElementNS(SVGNS, 'g'); z.setAttribute('class', 'zoomer');
    while (svg.firstChild) z.appendChild(svg.firstChild);
    svg.appendChild(z);
    var pinsG = document.createElementNS(SVGNS, 'g'); pinsG.setAttribute('class', 'pins'); z.appendChild(pinsG);
    svg.querySelectorAll('.state').forEach(function (p) { p.classList.remove('has'); });
    var k = 1, pins = [], tip = frame.querySelector('.map-tip');

    function restyle() {
      var cw = svg.clientWidth || 975, sc = Math.min(2.6, Math.max(0.85, 975 / cw)), u = sc / k, placed = [];
      pins.forEach(function (p) {
        p.c.setAttribute('r', (opts.r || 6) * u); p.c.setAttribute('stroke-width', 2 * u);
        p.t.setAttribute('font-size', 14 * u); p.t.setAttribute('x', p.xy[0] + 10 * u); p.t.setAttribute('y', p.xy[1] + 5 * u); p.t.setAttribute('stroke-width', 3.5 * u);
        var x = p.xy[0] * k, y = p.xy[1] * k, w = (p.d.name.length * 7.6 + 14) * sc, b = [x, y - 9 * sc, x + w, y + 9 * sc];
        var hit = placed.some(function (q) { return b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]; });
        p.t.style.display = hit ? 'none' : ''; if (!hit) placed.push(b);
      });
    }
    function setPins(list) {
      pinsG.innerHTML = ''; pins = [];
      list.slice().sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); }).forEach(function (d) {
        if (d.lat == null || d.lon == null) return;
        var xy = proj([+d.lon, +d.lat]); if (!xy) return;
        var g = document.createElementNS(SVGNS, d.url ? 'a' : 'g');
        if (d.url) g.setAttribute('href', d.url);
        g.setAttribute('class', 'pin'); g.setAttribute('data-id', d.id || '');
        g.setAttribute('aria-label', d.name);
        var c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', xy[0]); c.setAttribute('cy', xy[1]);
        var t = document.createElementNS(SVGNS, 'text'); t.textContent = d.name;
        g.appendChild(c); g.appendChild(t); pinsG.appendChild(g);
        if (tip && opts.tip) {
          g.addEventListener('mouseenter', function () {
            tip.innerHTML = opts.tip(d); var fb = frame.getBoundingClientRect(), cb = c.getBoundingClientRect();
            tip.style.left = (cb.left + cb.width / 2 - fb.left) + 'px'; tip.style.top = (cb.top - fb.top) + 'px'; tip.hidden = false;
            g.classList.add('hot'); opts.onHover && opts.onHover(d.id);
          });
          g.addEventListener('mouseleave', function () { tip.hidden = true; g.classList.remove('hot'); opts.onHover && opts.onHover(null); });
        }
        pins.push({ d: d, xy: xy, c: c, t: t, g: g });
      });
      restyle();
    }
    var api = { setPins: setPins, highlight: function (id) { pins.forEach(function (p) { p.g.classList.toggle('hot', p.d.id === id); }); } };
    if (opts.zoom) {
      var sel = d3.select(svg), zoom = d3.zoom().scaleExtent([1, 16]).translateExtent([[-40, -40], [1015, 650]])
        .on('zoom', function (e) { z.setAttribute('transform', e.transform); k = e.transform.k; restyle(); });
      sel.call(zoom);
      var ctl = frame.querySelector('.zoomctl');
      if (ctl) ctl.addEventListener('click', function (e) {
        var a = e.target.getAttribute('data-z');
        if (a === 'in') sel.transition().duration(300).call(zoom.scaleBy, 1.8);
        if (a === 'out') sel.transition().duration(300).call(zoom.scaleBy, 1 / 1.8);
        if (a === 'reset') sel.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
      });
    }
    if (opts.focus) {
      var f = proj([+opts.focus[1], +opts.focus[0]]);
      if (f) { k = opts.focusK || 2.6; var tx = 487.5 - f[0] * k, ty = 305 - f[1] * k; tx = Math.min(0, Math.max(975 - 975 * k, tx)); ty = Math.min(0, Math.max(610 - 610 * k, ty)); z.setAttribute('transform', 'translate(' + tx + ',' + ty + ') scale(' + k + ')'); }
    }
    if (window.ResizeObserver) new ResizeObserver(restyle).observe(frame);
    return api;
  }

  function counts(c, extra) {
    var n = c.counts || {}, parts = [], r = (n.rabbanim || 0) + (extra || 0);
    if (r) parts.push(r + (r === 1 ? ' rav' : ' rabbanim'));
    if (n.shuls) parts.push(n.shuls + (n.shuls === 1 ? ' shul' : ' shuls'));
    if (n.mikvaos) parts.push(n.mikvaos + (n.mikvaos === 1 ? ' mikvah' : ' mikvaos'));
    if (n.chinuch) parts.push(n.chinuch + ' chinuch');
    if (n.news) parts.push(n.news + ' news');
    return parts.join(' · ') || 'Entries coming soon';
  }

  /* ---------- home page ---------- */
  function home() {
    var frame = document.getElementById('home-map'); if (!frame) return;
    var list = window.COMMUNITIES || [], extra = {};
    var items = document.querySelectorAll('#clist li');
    var map = setupMap(frame, {
      zoom: true,
      tip: function (d) { return '<b>' + esc(d.name) + '</b>' + esc(STATE_NAMES[d.state] || d.state) + (d.era ? ' · ' + esc(d.era) : '') + '<br><span class="meta">' + esc(counts(d, extra[d.id])) + '</span>'; },
      onHover: function (id) { items.forEach(function (li) { li.classList.toggle('hot', li.getAttribute('data-id') === id); }); }
    });
    if (map) {
      map.setPins(list.map(function (c) { var n = c.counts; return { id: c.id, name: c.name, state: c.state, era: c.era, lat: c.lat, lon: c.lon, url: c.url, counts: n, weight: n.rabbanim + n.shuls + n.mikvaos + n.chinuch + n.news }; }));
      items.forEach(function (li) { li.addEventListener('mouseenter', function () { map.highlight(li.getAttribute('data-id')); }); li.addEventListener('mouseleave', function () { map.highlight(null); }); });
    }
    filter(document.getElementById('cq'), items, document.getElementById('cnone'));
    loadRabbis().then(function (rs) { list.forEach(function (c) { extra[c.id] = rabbisFor(rs, [c.name + ', ' + c.state]).length; }); });
  }

  function filter(input, nodes, none) {
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), shown = 0;
      nodes.forEach(function (n) { var ok = !q || (n.getAttribute('data-hay') || '').indexOf(q) > -1; n.hidden = !ok; if (ok) shown++; });
      document.querySelectorAll('[data-group]').forEach(function (g) { g.hidden = !g.querySelector('[data-hay]:not([hidden])'); });
      if (none) none.hidden = shown > 0 || !nodes.length;
    });
  }

  /* ---------- community page ---------- */
  function community() {
    var loc = document.querySelector('.map-frame.locator');
    if (loc) {
      var lat = loc.getAttribute('data-lat'), lon = loc.getAttribute('data-lon');
      var m = setupMap(loc, { r: 7, focus: [lat, lon], focusK: 2.6 });
      if (m) m.setPins([{ id: 'here', name: loc.getAttribute('data-name'), lat: lat, lon: lon }]);
    }
    var grid = document.getElementById('rabbanim-grid'); if (!grid) return;
    var empty = document.getElementById('rabbanim-empty');
    var places = (grid.getAttribute('data-places') || '').split('|').filter(Boolean);
    var have = {}; grid.querySelectorAll('[data-name]').forEach(function (t) { have[normName(t.getAttribute('data-name'))] = t; });
    loadRabbis().then(function (rs) {
      rabbisFor(rs, places).forEach(function (r) {
        var key = normName(r.name), yrs = (r.born || r.died) ? (r.born || '?') + ' – ' + (r.died || '?') : '';
        var old = have[key];
        if (old) { if (old.tagName !== 'A') { var a = document.createElement('a'); a.className = old.className; a.href = abs(r.url); a.innerHTML = old.innerHTML; old.replaceWith(a); } return; }
        var a2 = document.createElement('a'); a2.className = 'rabbi-tile'; a2.href = abs(r.url);
        a2.innerHTML = '<img src="' + esc(abs(r.portrait) || (document.documentElement.getAttribute('data-base') || '') + '/assets/images/portrait-placeholder.svg') + '" alt="" loading="lazy"><span class="rt-body"><strong>' + esc(r.name) + '</strong>' +
          (r.hebrew ? '<span class="he">' + esc(r.hebrew) + '</span>' : '') + (yrs ? '<span class="dates">' + esc(yrs) + '</span>' : '') + '<span class="meta rt-src">Early American Rabbis ›</span></span>';
        grid.appendChild(a2);
      });
      var n = grid.children.length;
      if (empty) { empty.hidden = n > 0; empty.textContent = 'No rabbanim have been added for this community yet.'; }
      var nav = document.querySelector('.c-secnav a[href="#rabbanim"]'); if (nav) nav.innerHTML = 'Rabbanim That Served Here <b>' + n + '</b>';
    });
  }

  /* ---------- photo viewer ---------- */
  function lightbox() {
    var links = Array.prototype.slice.call(document.querySelectorAll('a.lb')); if (!links.length) return;
    var box = document.createElement('div'); box.className = 'lbox'; box.hidden = true;
    box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><div class="lbox-ctl"><button type="button" data-a="prev">‹ Previous</button><button type="button" data-a="close">Close</button><button type="button" data-a="next">Next ›</button></div>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), cap = box.querySelector('figcaption'), ix = 0;
    function show(i) { ix = (i + links.length) % links.length; var a = links[ix]; img.src = a.href; img.alt = a.getAttribute('data-caption') || ''; cap.textContent = a.getAttribute('data-caption') || ''; box.hidden = false; document.body.style.overflow = 'hidden'; }
    function close() { box.hidden = true; document.body.style.overflow = ''; }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
    box.addEventListener('click', function (e) { var a = e.target.getAttribute('data-a'); if (a === 'prev') show(ix - 1); else if (a === 'next') show(ix + 1); else if (a === 'close' || e.target === box) close(); });
    document.addEventListener('keydown', function (e) { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(ix - 1); if (e.key === 'ArrowRight') show(ix + 1); });
  }

  function start() {
    home(); community(); lightbox();
    filter(document.getElementById('cq2'), document.querySelectorAll('.c-card'), null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
