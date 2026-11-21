/* Procedural SVG illustrations: island seascapes, compass rose, map of Utopia.
   Everything is drawn in code so the presentation works offline and stays crisp at any size. */
(function () {
  'use strict';

  // Seeded RNG so every scene is identical on each load
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  /* ---------------- Island seascape ----------------
     Scene box = stage (1600x900) extended by 500px left/right, 300 top, 400 bottom → 2600x1600.
     Options are expressed in STAGE coordinates and offset here. */
  const OX = 500, OY = 300;
  const PRESETS = {
    moon:       { horizon: 540, x0: 860, x1: 1540, city: [1080, 1330], light: { type: 'moon', x: 1180, y: 170 }, cityScale: .7, sea: ['#1b2c55', '#070d1c'], hill: '#16213d', city_c: '#1a2747', seed: 3 },
    sunset:     { horizon: 540, x0: 870, x1: 1440, city: [1040, 1330], light: { type: 'sun', x: 1180, y: 520 }, sea: ['#3a3550', '#0b0d1a'], hill: '#1c1820', city_c: '#120f16', seed: 7 },
    moonCenter: { horizon: 450, x0: 520, x1: 1340, city: [780, 1110], cityScale: .8, light: { type: 'moon', x: 905, y: 130 }, sea: ['#26375e', '#070d1c'], hill: '#1d2a48', city_c: '#1a2645', seed: 11 },
    lighthouse: { horizon: 556, x0: 730, x1: 1390, city: null, lighthouse: 1165, light: { type: 'sun', x: 1100, y: 540, tint: 'amber' }, sea: ['#1b3a33', '#040d0a'], hill: '#14201a', seed: 5 },
    duskFaint:  { horizon: 540, x0: 760, x1: 1430, city: [1040, 1340], light: { type: 'sun', x: 1180, y: 500, faint: true }, sea: ['#1c1d30', '#08090f'], hill: '#18161f', city_c: '#121019', seed: 9 },
    merci:      { horizon: 540, x0: 760, x1: 1430, city: [1040, 1340], light: { type: 'sun', x: 1200, y: 520 }, sea: ['#3a3855', '#0b0c18'], hill: '#221c22', city_c: '#120e14', seed: 13, boat: true, spires: true }
  };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildIsland(kind) {
    const p = PRESETS[kind] || PRESETS.moon;
    const R = rng(p.seed * 97);
    const id = 'sc' + (++uid);
    const H = p.horizon + OY;
    const svg = el('svg', { viewBox: '0 0 2600 1600', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const defs = el('defs', {}, svg);

    // gradients
    const sea = el('linearGradient', { id: id + 'sea', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': p.sea[0], 'stop-opacity': '.92' }, sea);
    el('stop', { offset: '1', 'stop-color': p.sea[1], 'stop-opacity': '1' }, sea);
    const glow = el('radialGradient', { id: id + 'glow' }, defs);
    const warm = p.light.type === 'sun';
    const gc = warm ? (p.light.tint === 'amber' ? '#f4cf8a' : '#ffd79a') : '#c9d6f2';
    el('stop', { offset: '0', 'stop-color': gc, 'stop-opacity': p.light.faint ? '.35' : '.75' }, glow);
    el('stop', { offset: '.35', 'stop-color': gc, 'stop-opacity': p.light.faint ? '.12' : '.25' }, glow);
    el('stop', { offset: '1', 'stop-color': gc, 'stop-opacity': '0' }, glow);
    const fade = el('linearGradient', { id: id + 'fade', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '.55' }, fade);
    el('stop', { offset: '.6', 'stop-color': '#fff', 'stop-opacity': '0' }, fade);
    const mask = el('mask', { id: id + 'mask' }, defs);
    el('rect', { x: 0, y: H, width: 2600, height: 1600 - H, fill: 'url(#' + id + 'fade)' }, mask);
    // water distortion for reflections
    const filt = el('filter', { id: id + 'wave', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    const turb = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.004 0.09', numOctaves: '2', seed: p.seed, result: 'n' }, filt);
    el('animate', { attributeName: 'baseFrequency', dur: '9s', values: '0.004 0.09;0.006 0.12;0.004 0.09', repeatCount: 'indefinite' }, turb);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '14' }, filt);
    const blur = el('filter', { id: id + 'blur', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: '3' }, blur);

    // light source
    const lx = p.light.x + OX, ly = p.light.y + OY;
    const glowR = warm ? 700 : 520;
    el('ellipse', { class: 'moonglow', cx: lx, cy: ly, rx: glowR * (warm ? 1.4 : 1), ry: glowR * (warm ? .55 : 1), fill: 'url(#' + id + 'glow)' }, svg);
    if (p.light.type === 'moon') {
      el('circle', { cx: lx, cy: ly, r: 30, fill: '#efe6cc' }, svg);
      el('circle', { cx: lx - 8, cy: ly - 6, r: 6, fill: '#ddd2b2', opacity: '.6' }, svg);
      el('circle', { cx: lx + 9, cy: ly + 8, r: 4, fill: '#ddd2b2', opacity: '.5' }, svg);
    }

    // island + city group (reused for reflection)
    const land = el('g', { id: id + 'land' }, svg);
    const x0 = p.x0 + OX, x1 = p.x1 + OX, w = x1 - x0;
    const peak = 70 + R() * 25;
    const d = `M${x0},${H} C${x0 + w * .18},${H - peak * .35} ${x0 + w * .3},${H - peak} ${x0 + w * .45},${H - peak * .85}` +
      ` S${x0 + w * .7},${H - peak * .6} ${x0 + w * .78},${H - peak * .7} S${x1 - w * .06},${H - peak * .25} ${x1},${H} Z`;
    el('path', { d, fill: p.hill }, land);

    const lights = el('g', {}, svg); // windows drawn on top (not reflected via <use>)
    if (p.city) {
      const cx0 = p.city[0] + OX, cx1 = p.city[1] + OX;
      let x = cx0;
      while (x < cx1) {
        const bw = 14 + R() * 26;
        const mid = 1 - Math.abs(((x - cx0) / (cx1 - cx0)) - .5) * 1.6;
        const bh = (40 + R() * 70) * (.55 + mid * .8) * (p.spires ? 1.25 : 1) * (p.cityScale || 1);
        const base = H - peak * .55 * (.6 + mid * .5);
        const top = base - bh;
        el('rect', { x, y: top, width: bw, height: base - top + 30, fill: p.city_c }, land);
        const roof = R();
        if (roof < .35 || (p.spires && roof < .6)) {
          el('path', { d: `M${x - 2},${top} L${x + bw / 2},${top - bw * (p.spires ? 2.4 : 1.4)} L${x + bw + 2},${top} Z`, fill: p.city_c }, land);
        } else if (roof < .6) {
          el('circle', { cx: x + bw / 2, cy: top, r: bw / 2, fill: p.city_c }, land);
          el('rect', { x: x + bw / 2 - .8, y: top - bw / 2 - 12, width: 1.6, height: 12, fill: p.city_c }, land);
        } else if (roof < .85) {
          for (let c = 0; c < bw - 4; c += 7) el('rect', { x: x + c, y: top - 6, width: 4, height: 6, fill: p.city_c }, land);
        }
        // windows
        const nwin = Math.floor(bh / 22);
        for (let i = 0; i < nwin; i++) {
          if (R() < .55) {
            const c = el('circle', {
              cx: x + 4 + R() * (bw - 8), cy: top + 10 + i * 20 + R() * 6, r: 1.6 + R() * 1.2,
              fill: warm ? '#ffd27a' : '#f3d58a', class: 'lightflick'
            }, lights);
            c.style.animationDelay = (-R() * 3).toFixed(2) + 's';
            c.style.animationDuration = (2 + R() * 4).toFixed(2) + 's';
          }
        }
        x += bw + R() * 4;
      }
    }

    if (p.lighthouse) {
      const tx = p.lighthouse + OX, base = H - peak * .5, th = 95;
      el('path', { d: `M${tx - 12},${base} L${tx - 7},${base - th} L${tx + 7},${base - th} L${tx + 12},${base} Z`, fill: '#1d2a24' }, land);
      el('path', { d: `M${tx - 10},${base - th} L${tx},${base - th - 16} L${tx + 10},${base - th} Z`, fill: '#1d2a24' }, land);
      const ly2 = base - th - 4;
      el('polygon', { class: 'beam l', points: `${tx},${ly2 - 3} ${tx - 1100},${ly2 - 120} ${tx - 1100},${ly2 + 60} ${tx},${ly2 + 3}`, fill: 'rgba(255,236,180,.22)', filter: 'url(#' + id + 'blur)' }, svg);
      el('polygon', { class: 'beam r', points: `${tx},${ly2 - 3} ${tx + 1100},${ly2 - 140} ${tx + 1100},${ly2 + 40} ${tx},${ly2 + 3}`, fill: 'rgba(255,236,180,.22)', filter: 'url(#' + id + 'blur)' }, svg);
      el('circle', { cx: tx, cy: ly2, r: 22, fill: 'url(#' + id + 'glow)' }, svg);
      el('circle', { cx: tx, cy: ly2, r: 4, fill: '#fff6dc' }, svg);
    }

    // sea
    el('rect', { x: 0, y: H, width: 2600, height: 1600 - H, fill: 'url(#' + id + 'sea)' }, svg);
    el('rect', { x: 0, y: H - .5, width: 2600, height: 1.2, fill: warm ? '#f0c98a' : '#9fb3dc', opacity: '.45' }, svg);

    // reflection of land (flipped around horizon, distorted)
    const refl = el('g', { mask: 'url(#' + id + 'mask)', opacity: '.55' }, svg);
    const ref2 = el('g', { filter: 'url(#' + id + 'wave)' }, refl);
    el('use', { href: '#' + id + 'land', transform: `translate(0 ${2 * H}) scale(1 -1)` }, ref2);
    const lightsRef = lights.cloneNode(true);
    lightsRef.setAttribute('transform', `translate(0 ${2 * H}) scale(1 -1)`);
    lightsRef.setAttribute('opacity', '.6');
    ref2.appendChild(lightsRef);

    svg.appendChild(lights);

    // shimmer path under the light
    const sh = el('g', {}, svg);
    for (let i = 0; i < 90; i++) {
      const depth = Math.pow(R(), 1.3);
      const y = H + 6 + depth * 520;
      const spread = 30 + depth * 260;
      const len = 10 + depth * 70 * R();
      const x = lx + (R() - .5) * 2 * spread;
      const r = el('rect', { class: 'shimmer', x, y, width: len, height: 1.4 + depth * 1.6, rx: 1, fill: warm ? '#ffe2a8' : '#dfe8ff' }, sh);
      r.style.animationDelay = (-R() * 4).toFixed(2) + 's';
      r.style.animationDuration = (2.5 + R() * 3.5).toFixed(2) + 's';
    }

    if (p.boat) {
      const g = el('g', { class: 'boat' }, svg);
      const bx = 380 + OX, by = H + 112;
      const b = el('g', { class: 'bob' }, g);
      el('path', { d: `M${bx - 36},${by} L${bx + 36},${by} L${bx + 26},${by + 10} L${bx - 26},${by + 10} Z`, fill: '#121522' }, b);
      el('path', { d: `M${bx},${by - 4} L${bx},${by - 78} L${bx + 30},${by - 6} Z`, fill: '#121522' }, b);
      el('path', { d: `M${bx - 3},${by - 6} L${bx - 3},${by - 64} L${bx - 28},${by - 8} Z`, fill: '#161a2a' }, b);
      el('path', { d: `M${bx},${by - 78} l12,4 -12,4 z`, fill: '#121522' }, b);
      const br = el('g', { opacity: '.3', transform: `translate(0 ${2 * (by + 10)}) scale(1 -1)`, filter: 'url(#' + id + 'wave)' }, g);
      br.appendChild(b.cloneNode(true));
    }
    return svg;
  }

  /* ---------------- Compass rose ---------------- */
  function roseSVG(opts) {
    opts = opts || {};
    const s = el('svg', { viewBox: '-200 -200 400 400', 'aria-hidden': 'true' });
    const g = el('g', { fill: 'none', stroke: 'currentColor' }, s);
    el('circle', { r: 190, 'stroke-width': 1.2 }, g);
    el('circle', { r: 178, 'stroke-width': .6 }, g);
    el('circle', { r: 150, 'stroke-width': .6 }, g);
    for (let i = 0; i < 360; i += 3) {
      const a = i * Math.PI / 180, r1 = i % 15 === 0 ? 166 : 172;
      el('line', { x1: Math.cos(a) * r1, y1: Math.sin(a) * r1, x2: Math.cos(a) * 178, y2: Math.sin(a) * 178, 'stroke-width': .6 }, g);
    }
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI / 16;
      el('line', { x1: 0, y1: 0, x2: Math.cos(a) * 150, y2: Math.sin(a) * 150, 'stroke-width': .3 }, g);
    }
    const star = el('g', {}, s);
    function point(angle, len, wid, fillA, fillB) {
      const a = angle * Math.PI / 180, p = a + Math.PI / 2;
      const tip = [Math.cos(a) * len, Math.sin(a) * len];
      const l = [Math.cos(p) * wid, Math.sin(p) * wid], r = [-l[0], -l[1]];
      el('path', { d: `M0,0 L${l[0]},${l[1]} L${tip[0]},${tip[1]} Z`, fill: fillA }, star);
      el('path', { d: `M0,0 L${r[0]},${r[1]} L${tip[0]},${tip[1]} Z`, fill: fillB }, star);
    }
    const A = opts.solid ? '#d8b25a' : 'currentColor', B = opts.solid ? '#8a6420' : 'currentColor';
    for (let i = 0; i < 16; i++) if (i % 2) point(i * 22.5 - 90, 95, 9, A, B);
    for (let i = 0; i < 8; i += 2) point(i * 45 + 45 - 90, 130, 14, A, B);
    for (let i = 0; i < 4; i++) point(i * 90 - 90, 185, 20, opts.solid ? '#f3d58a' : A, B);
    el('circle', { r: 12, fill: opts.solid ? '#2a1d08' : 'none', stroke: 'currentColor', 'stroke-width': 2 }, s);
    el('circle', { r: 4, fill: 'currentColor' }, s);
    if (!opts.solid) star.setAttribute('opacity', '.9');
    return s;
  }

  function rhumbsSVG() {
    const s = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    const g = el('g', { stroke: 'currentColor', 'stroke-width': .7, fill: 'none' }, s);
    [[260, 160], [1350, 700], [900, 420]].forEach(function (c) {
      for (let i = 0; i < 32; i++) {
        const a = i * Math.PI / 16;
        el('line', { x1: c[0], y1: c[1], x2: c[0] + Math.cos(a) * 2200, y2: c[1] + Math.sin(a) * 2200 }, g);
      }
    });
    return s;
  }

  /* ---------------- Map of Utopia (crescent) ---------------- */
  // Crescent = outer circle (r=250 at 0,0) minus inner circle (r=200 at 110,0). Opening faces east.
  const CRESCENT = 'M157.3,-194.3 A250,250 0 1 0 157.3,194.3 A200,200 0 1 1 157.3,-194.3 Z';
  function inCrescent(x, y, margin) {
    return Math.hypot(x, y) < 250 - margin && Math.hypot(x - 110, y) > 200 + margin;
  }
  function mapSVG(mode) {
    const s = el('svg', { viewBox: '-430 -270 860 540', 'aria-hidden': 'true' });
    const defs = el('defs', {}, s);
    const lg = el('radialGradient', { id: 'landg' + (++uid), cx: '30%', cy: '50%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#efcf8f' }, lg);
    el('stop', { offset: '1', 'stop-color': '#dcb877' }, lg);
    // water hatching rings
    const water = el('g', { fill: 'none', stroke: '#8a7d63', 'stroke-width': .6, opacity: '.55' }, s);
    for (let k = 1; k <= 7; k++) {
      el('path', { d: CRESCENT, transform: `scale(${1 + k * .028}) translate(${-k * 2},0)`, opacity: (1 - k / 8).toFixed(2) }, water);
    }
    // continent
    const cont = el('g', { class: 'continent' }, s);
    el('path', { d: 'M-430,-270 L-330,-270 C-318,-200 -342,-150 -326,-80 C-312,-20 -340,40 -322,110 C-308,170 -336,220 -326,270 L-430,270 Z', fill: '#cbbf9f', stroke: '#5a4a32', 'stroke-width': 1.5 }, cont);
    const ct = el('text', { x: -372, y: 0, transform: 'rotate(-90 -372 0)', 'text-anchor': 'middle', 'font-family': 'Cormorant Garamond, serif', 'font-style': 'italic', 'font-size': 26, fill: '#5a4a32' }, cont);
    ct.textContent = 'continent';
    // isthmus
    const isth = el('path', { class: 'isthmus', d: 'M-330,-34 C-300,-30 -270,-28 -246,-30 L-246,30 C-270,28 -300,30 -330,34 Z', fill: '#e2c283', stroke: '#5a4a32', 'stroke-width': 1.5 }, s);
    // island
    el('path', { d: CRESCENT, fill: 'url(#' + lg.id + ')', stroke: '#4a3a24', 'stroke-width': 2 }, s);
    // river Anydre (dry, appropriately)
    el('path', { d: 'M-205,-60 L-175,-75 L-150,-62 L-118,-80', fill: 'none', stroke: '#4d6b7a', 'stroke-width': 1.4 }, s);
    // mountains
    const R = rng(42);
    const mt = el('g', { fill: 'none', stroke: '#6b5634', 'stroke-width': 1 }, s);
    for (let i = 0; i < 24; i++) {
      let x, y, tries = 0;
      do { x = -250 + R() * 400; y = -240 + R() * 480; tries++; } while (!inCrescent(x, y, 18) && tries < 200);
      el('path', { d: `M${x - 6},${y + 3} L${x},${y - 4} L${x + 6},${y + 3}` }, mt);
    }
    // labels
    const bay = el('text', { x: 205, y: 0, 'text-anchor': 'middle', 'font-family': 'Cormorant Garamond, serif', 'font-style': 'italic', 'font-size': 26, fill: '#3d5a6b' }, s);
    bay.textContent = 'baie intérieure';
    // Amaurote (capital, centre)
    const am = el('g', { class: 'amaurote' }, s);
    el('path', { d: 'M-170,-14 l4.1,8.6 9.4,1.2 -6.9,6.5 1.8,9.3 -8.4,-4.5 -8.4,4.5 1.8,-9.3 -6.9,-6.5 9.4,-1.2z', fill: '#d8a32a', stroke: '#7a5410', 'stroke-width': 1 }, am);
    const amt = el('text', { x: -170, y: 36, 'text-anchor': 'middle', 'font-family': 'Cormorant Garamond, serif', 'font-weight': 700, 'font-size': 26, fill: '#2d2416' }, am);
    amt.textContent = 'Amaurote';

    if (mode === 'cut') {
      const cut = el('g', { class: 'cut' }, s);
      el('path', { class: 'cutline', d: 'M-330,-22 L-246,-22', stroke: '#9b3a2c', 'stroke-width': 2, 'stroke-dasharray': '7 5', fill: 'none' }, cut);
      el('path', { class: 'cutline', d: 'M-330,22 L-246,22', stroke: '#9b3a2c', 'stroke-width': 2, 'stroke-dasharray': '7 5', fill: 'none' }, cut);
      const t = el('text', { x: -288, y: 62, 'text-anchor': 'middle', 'font-family': 'Cormorant Garamond, serif', 'font-style': 'italic', 'font-weight': 600, 'font-size': 23, fill: '#8f3a2e' }, cut);
      t.textContent = 'isthme creusé';
    }
    if (mode === 'cities') {
      // 54 cities, evenly spaced (Poisson-like sampling)
      const R2 = rng(54), pts = [];
      let guard = 0;
      while (pts.length < 53 && guard++ < 20000) {
        const x = -250 + R2() * 410, y = -250 + R2() * 500;
        if (!inCrescent(x, y, 9)) continue;
        if (Math.hypot(x + 170, y) < 30) continue;
        if (pts.some(function (q) { return Math.hypot(q[0] - x, q[1] - y) < 25; })) continue;
        pts.push([x, y]);
      }
      // sort by distance from capital so they "spread" outward when revealed
      pts.sort(function (a, b) { return Math.hypot(a[0] + 170, a[1]) - Math.hypot(b[0] + 170, b[1]); });
      const g = el('g', { class: 'cities' }, s);
      pts.forEach(function (q) {
        el('path', { class: 'city', d: `M${q[0] - 4},${q[1] + 4} L${q[0] - 4},${q[1] - 1} L${q[0]},${q[1] - 5} L${q[0] + 4},${q[1] - 1} L${q[0] + 4},${q[1] + 4} Z`, fill: '#1f4e3d' }, g);
      });
      isth.setAttribute('opacity', '0');
      cont.setAttribute('opacity', '.0');
    }
    // cartouche
    const c = el('g', {}, s);
    el('rect', { x: 250, y: 185, width: 150, height: 52, rx: 6, fill: '#f5ecd6', stroke: '#8a6420', 'stroke-width': 2 }, c);
    const ct2 = el('text', { x: 325, y: 222, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-weight': 700, 'font-size': 26, fill: '#1b2236' }, c);
    ct2.textContent = 'UTOPIE';
    // mini compass
    const mini = roseSVG({ solid: true });
    mini.setAttribute('x', 300); mini.setAttribute('y', -255); mini.setAttribute('width', 110); mini.setAttribute('height', 110);
    mini.setAttribute('viewBox', '-200 -200 400 400');
    mini.style.color = '#6b5634';
    s.appendChild(mini);
    return s;
  }

  window.Scenes = { buildIsland, roseSVG, rhumbsSVG, mapSVG };

  // auto-mount
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-scene]').forEach(function (n) { n.appendChild(buildIsland(n.dataset.scene)); });
    document.querySelectorAll('[data-rose]').forEach(function (n) { n.appendChild(roseSVG({ solid: n.dataset.rose === 'solid' })); });
    document.querySelectorAll('[data-rhumbs]').forEach(function (n) { n.appendChild(rhumbsSVG()); });
    document.querySelectorAll('[data-map]').forEach(function (n) { n.appendChild(mapSVG(n.dataset.map)); });
  });
})();
