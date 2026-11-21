/* Deck engine: stage scaling, navigation, cinematic transitions, staggered reveals,
   HUD (progress, counter, sections), speaker notes, presenter window, overview. */
(function () {
  'use strict';
  const gsap = window.gsap;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SECTIONS = {
    opening:    { label: '', nav: null },
    prologue:   { label: 'Prologue', nav: 'Prologue' },
    p1:         { label: 'Partie I · Du constat au rêve', nav: 'I' },
    p2:         { label: 'Partie II · Un idéal ambigu', nav: 'II' },
    p3:         { label: 'Partie III · Portée et actualité', nav: 'III' },
    conclusion: { label: 'Conclusion', nav: 'Conclusion' },
    end:        { label: '', nav: null }
  };

  let slides = [], idx = -1, busy = null, prevSpeaker = null;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- setup ---------- */
  function icons(root) {
    $$('[data-i]', root).forEach(function (n) {
      n.insertAdjacentHTML('afterbegin', `<svg class="ic"><use href="#i-${n.dataset.i}"/></svg>`);
    });
  }

  function decorate(s, i) {
    const sec = s.dataset.section;
    const plain = s.classList.contains('divider') || sec === 'opening' || sec === 'end' || s.hasAttribute('data-bare');
    if (!plain) {
      const head = $('.s-head', s);
      if (head && SECTIONS[sec] && SECTIONS[sec].label) {
        head.insertAdjacentHTML('afterbegin', `<div class="kicker" data-r="fade">${SECTIONS[sec].label}</div>`);
      }
      if (s.dataset.speaker) {
        const sp = +s.dataset.speaker;
        let dots = '';
        for (let k = 1; k <= 7; k++) dots += `<i class="${k === sp ? 'on' : ''}"></i>`;
        s.insertAdjacentHTML('beforeend', `<div class="speaker">Personne ${sp}<div class="dots">${dots}</div></div>`);
      }
    }
    if (sec !== 'opening') s.insertAdjacentHTML('beforeend', `<div class="pageno">${i + 1}</div>`);
    // split letters
    $$('[data-r="letters"]', s).forEach(function (n) {
      n.innerHTML = n.textContent.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    });
  }

  function fit() {
    const W = window.innerWidth, H = window.innerHeight;
    const s = Math.min(W / 1600, H / 900);
    $('#stage').style.transform = `translate(${-800 * s}px, ${-450 * s}px) scale(${s})`;
  }

  /* ---------- reveals ---------- */
  const FROM = {
    up:     { y: 40, opacity: 0, filter: 'blur(8px)' },
    down:   { y: -40, opacity: 0, filter: 'blur(8px)' },
    left:   { x: -90, opacity: 0, filter: 'blur(8px)' },
    right:  { x: 90, opacity: 0, filter: 'blur(8px)' },
    zoom:   { scale: .7, opacity: 0, filter: 'blur(6px)' },
    pop:    { scale: 0, opacity: 0 },
    fade:   { opacity: 0 },
    blur:   { opacity: 0, scale: 1.25, filter: 'blur(24px)' },
    line:   { scaleX: 0, transformOrigin: 'left center' },
    lineY:  { scaleY: 0, transformOrigin: 'center top' },
    bar:    { scaleX: 0, transformOrigin: 'left center' },
    stamp:  { scale: 2.6, opacity: 0, rotation: -18 },
    flip:   { rotationY: 90, opacity: 0, transformPerspective: 800 }
  };
  const TO_EASE = { pop: 'back.out(2.2)', zoom: 'back.out(1.5)', bar: 'power3.inOut', line: 'power2.inOut', lineY: 'power2.inOut', stamp: 'power4.in', blur: 'power3.out', flip: 'back.out(1.4)' };

  function reveal(s, baseDelay) {
    const items = $$('[data-r]', s);
    let t = baseDelay;
    const step = +(s.dataset.step || .13);
    items.forEach(function (n) {
      const type = n.dataset.r || 'up';
      const at = n.dataset.d !== undefined ? baseDelay + +n.dataset.d : t;
      t = at + step;
      const dur = +(n.dataset.dur || (type === 'bar' ? 1.4 : type === 'line' ? 1.1 : .9));
      if (type === 'letters') {
        gsap.fromTo(n.children, { y: 70, opacity: 0, filter: 'blur(14px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, stagger: .11, ease: 'power3.out', delay: at });
        return;
      }
      if (type === 'count') {
        const target = $('.n', n) || n;
        const to = +n.dataset.to;
        const o = { v: 0 };
        gsap.fromTo(n, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .6, delay: at });
        gsap.to(o, { v: to, duration: +(n.dataset.dur || 1.8), delay: at, ease: 'power2.out', onUpdate: () => { target.textContent = Math.round(o.v); } });
        target.textContent = '0';
        return;
      }
      if (type === 'draw') {
        $$('path, circle, line, ellipse, rect, polyline', n).forEach(function (p) {
          let len = 0;
          try { len = p.getTotalLength(); } catch (e) { len = 1000; }
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur * 1.6, delay: at, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' });
        });
        gsap.fromTo(n, { opacity: 0 }, { opacity: 1, duration: .3, delay: at });
        return;
      }
      const from = FROM[type] || FROM.up;
      const to = { duration: dur, delay: at, ease: TO_EASE[type] || 'power3.out', overwrite: true };
      for (const k in from) {
        if (k === 'transformOrigin' || k === 'transformPerspective') continue;
        to[k] = k === 'filter' ? 'blur(0px)' : (k === 'opacity' || k.indexOf('scale') === 0 ? 1 : 0);
      }
      if (type === 'stamp') { to.rotation = n.dataset.rot !== undefined ? +n.dataset.rot : -4; to.onComplete = () => shake(n); }
      if (from.filter) to.clearProps = 'filter';
      gsap.fromTo(n, from, to);
    });
    runFx(s, baseDelay);
  }

  function shake(n) {
    const stage = n.closest('.slide');
    gsap.fromTo(stage, { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1.2, .3)' });
  }

  /* slide-specific effects */
  const FX = {
    cut: function (s, d) {
      const lines = $$('.cutline', s), isth = $('.isthmus', s), cont = $('.continent', s);
      gsap.set([isth, cont], { clearProps: 'all' });
      lines.forEach(function (l) { gsap.fromTo(l, { strokeDashoffset: 90, opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 1.2, delay: d + 1.2, ease: 'power2.out' }); });
      gsap.fromTo(isth, { opacity: 1 }, { opacity: .15, duration: 1.2, delay: d + 2.2 });
      gsap.fromTo(cont, { x: 0 }, { x: -46, duration: 2.4, delay: d + 2.2, ease: 'power2.inOut' });
    },
    cities: function (s, d) {
      const c = $$('.city', s);
      gsap.fromTo($('.amaurote', s), { scale: 0, transformOrigin: '-170px 0px' }, { scale: 1, duration: .8, delay: d + .5, ease: 'back.out(2)' });
      gsap.fromTo(c, { scale: 0, opacity: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' }, { scale: 1, opacity: 1, duration: .5, stagger: .035, delay: d + .9, ease: 'back.out(3)' });
    },
    venn: function (s, d) {
      gsap.fromTo($$('.vc', s), { scale: 0, opacity: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' }, { scale: 1, opacity: 1, duration: 1.2, stagger: .25, delay: d + .2, ease: 'back.out(1.4)' });
    },
    clones: function (s, d) {
      // all identical items appear at the exact same instant — conformity made visible
      gsap.fromTo($$('.clones i', s), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, delay: d + .5, ease: 'power3.out' });
    },
    movers: function (s, d) {
      $$('.mover', s).forEach(function (m, i) {
        gsap.fromTo(m, { left: '0%', opacity: 0 }, { left: '100%', opacity: 1, duration: 2.6, repeat: -1, delay: d + 1 + i * .9, ease: 'power1.inOut', keyframes: { opacity: [0, 1, 1, 0] } });
      });
    },
    ship: function (s, d) {
      const sh = $('.voyager', s);
      gsap.fromTo(sh, { left: '8%', opacity: 0 }, { left: '84%', opacity: 1, duration: 7, delay: d + .8, ease: 'sine.inOut', repeat: -1, repeatDelay: 1 });
    }
  };
  function runFx(s, d) { (s.dataset.fx || '').split(/\s+/).filter(Boolean).forEach(function (k) { FX[k] && FX[k](s, d); }); }

  /* ---------- transitions ---------- */
  function go(n, opts) {
    opts = opts || {};
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === idx) return;
    const from = slides[idx], to = slides[n];
    const dir = n > idx ? 1 : -1;
    const old = idx;
    idx = n;

    if (busy) { busy.progress(1); busy = null; }

    const sectionChange = from && from.dataset.section !== to.dataset.section;
    let type = opts.instant ? 'none' : sectionChange ? 'section' : (to.dataset.tr || 'slide');
    if (reduced && type !== 'none') type = 'fade';

    window.Atmosphere.setTheme(to.dataset.theme || 'night');
    updateHud(old);

    if (!from || type === 'none') {
      slides.forEach(sl => sl.classList.remove('active', 'leaving'));
      to.classList.add('active');
      gsap.set(to, { clearProps: 'all' });
      reveal(to, .2);
      return;
    }

    const tl = gsap.timeline({ onComplete: () => { from.classList.remove('leaving'); gsap.set(from, { clearProps: 'all' }); busy = null; } });
    busy = tl;
    from.classList.add('leaving'); from.classList.remove('active');

    if (type === 'section') {
      const c = $('#curtain');
      const halves = $$('.half', c), seam = $('.seam', c), num = $('.numeral', c);
      num.textContent = to.dataset.numeral || '';
      tl.to(halves, { scaleY: 1, duration: .55, ease: 'power3.in' })
        .to(from, { scale: .96, opacity: 0, filter: 'blur(6px)', duration: .55, ease: 'power2.in' }, 0)
        .to(seam, { scaleX: 1, opacity: 1, duration: .45, ease: 'power2.out' }, .35)
        .fromTo(num, { opacity: 0, scale: .7, filter: 'blur(20px)' }, { opacity: num.textContent ? 1 : 0, scale: 1, filter: 'blur(0px)', duration: .5 }, .5)
        .add(function () {
          from.classList.remove('leaving');
          to.classList.add('active');
          gsap.set(to, { opacity: 1, scale: 1.06, filter: 'blur(0px)' });
          reveal(to, .45);
        }, 1.05)
        .to(num, { opacity: 0, scale: 1.3, filter: 'blur(16px)', duration: .5 }, 1.05)
        .to(halves, { scaleY: 0, duration: 1.1, ease: 'power3.inOut' }, 1.15)
        .to(seam, { opacity: 0, scaleX: 1.4, duration: .9 }, 1.25)
        .to(to, { scale: 1, duration: 1.8, ease: 'power2.out' }, 1.05);
      return;
    }

    const OUT = {
      slide: { x: -dir * 160, opacity: 0, filter: 'blur(10px)' },
      fade:  { opacity: 0 },
      zoom:  { scale: 1.18, opacity: 0, filter: 'blur(12px)' },
      rise:  { y: -dir * 70, opacity: 0, filter: 'blur(8px)' }
    };
    const IN = {
      slide: { x: dir * 160, opacity: 0, filter: 'blur(10px)' },
      fade:  { opacity: 0, scale: 1.03 },
      zoom:  { scale: .88, opacity: 0, filter: 'blur(12px)' },
      rise:  { y: dir * 90, opacity: 0, filter: 'blur(8px)' }
    };
    const o = OUT[type] || OUT.slide, i = IN[type] || IN.slide;
    to.classList.add('active');
    tl.to(from, Object.assign({ duration: .6, ease: 'power2.in' }, o), 0)
      .fromTo(to, i, { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: .95, ease: 'power3.out', clearProps: 'filter' }, .3);
    reveal(to, .45);
  }

  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  /* ---------- HUD ---------- */
  function updateHud(old) {
    const s = slides[idx];
    $('.counter').innerHTML = `<b>${idx + 1}</b> / ${slides.length}`;
    $('.progress-fill').style.width = ((idx + 1) / slides.length * 100) + '%';
    $$('.secbtn').forEach(b => b.classList.toggle('on', b.dataset.sec === s.dataset.section));
    try { history.replaceState(null, '', '#' + (idx + 1)); } catch (e) { /* file:// on some browsers */ }
    // notes
    const notes = $('.notes', s);
    $('#notes h5').textContent = `Diapo ${idx + 1} · ${s.dataset.speaker ? 'Personne ' + s.dataset.speaker : 'Ensemble'} — notes`;
    $('#notes p').innerHTML = notes ? notes.innerHTML : '<em>Pas de notes.</em>';
    // speaker hand-off toast
    const sp = s.dataset.speaker || null;
    if (sp && prevSpeaker && sp !== prevSpeaker && old !== -1) toast(`Personne ${sp} prend la parole`);
    prevSpeaker = sp;
    $$('.chapters button').forEach(b => b.classList.toggle('cur', +b.dataset.go === idx));
    updatePresenter();
  }

  let toastT;
  function toast(msg) {
    const t = $('.toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function buildHud() {
    const marks = $('.progress-marks');
    const secNav = $('.secnav');
    let lastSec = null;
    slides.forEach(function (s, i) {
      const sec = s.dataset.section;
      if (sec !== lastSec) {
        if (i > 0) marks.insertAdjacentHTML('beforeend', `<span style="left:${i / slides.length * 100}%"></span>`);
        if (SECTIONS[sec] && SECTIONS[sec].nav) secNav.insertAdjacentHTML('beforeend', `<button class="secbtn" data-sec="${sec}" data-go="${i}" title="${SECTIONS[sec].label}">${SECTIONS[sec].nav}</button>`);
        lastSec = sec;
      }
    });
    $$('.secbtn').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));

    // chapter overview
    const ch = $('.chapters');
    const groups = {};
    slides.forEach(function (s, i) {
      const sec = s.dataset.section;
      const key = (sec === 'opening' ? 'prologue' : sec === 'end' ? 'conclusion' : sec);
      (groups[key] = groups[key] || []).push(i);
    });
    Object.keys(groups).forEach(function (k) {
      const items = groups[k].map(function (i) {
        const s = slides[i];
        const title = s.dataset.title || ($('.s-title', s) || {}).textContent || '';
        return `<li><button data-go="${i}"><em>${i + 1}</em>${title}<small>${s.dataset.speaker ? 'P' + s.dataset.speaker : ''}</small></button></li>`;
      }).join('');
      ch.insertAdjacentHTML('beforeend', `<section><h4>${SECTIONS[k].label || k}</h4><ol>${items}</ol></section>`);
    });
    $$('.chapters button').forEach(b => b.addEventListener('click', () => { toggle('#overview', false); go(+b.dataset.go); }));

    $('[data-act="prev"]').addEventListener('click', prev);
    $('[data-act="next"]').addEventListener('click', next);
    $('[data-act="overview"]').addEventListener('click', () => toggle('#overview'));
    $('[data-act="notes"]').addEventListener('click', () => toggleNotes());
    $('[data-act="presenter"]').addEventListener('click', openPresenter);
    $('[data-act="full"]').addEventListener('click', fullscreen);
    $('[data-act="help"]').addEventListener('click', () => toggle('#help'));
    $$('.ov-close').forEach(b => b.addEventListener('click', () => { toggle('#overview', false); toggle('#help', false); }));
  }

  function toggle(sel, force) {
    const n = $(sel);
    const open = force !== undefined ? force : !n.classList.contains('open');
    n.classList.toggle('open', open);
    if (sel === '#overview') $('[data-act="overview"]').classList.toggle('on', open);
  }
  function toggleNotes() {
    const open = $('#notes').classList.toggle('open');
    $('[data-act="notes"]').classList.toggle('on', open);
  }
  function fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  }

  /* ---------- presenter window (about:blank inherits our origin, works from file://) ---------- */
  let pw = null, pStart = 0;
  function openPresenter() {
    if (pw && !pw.closed) { pw.focus(); return; }
    pw = window.open('', 'utopia-presenter', 'width=900,height=640');
    if (!pw) { toast('Autorisez les fenêtres pop-up pour la vue présentateur'); return; }
    pStart = Date.now();
    pw.document.open();
    pw.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Utopia — vue présentateur</title>
<style>
body{margin:0;background:#081024;color:#f5ecd6;font-family:Georgia,serif;display:grid;grid-template-rows:auto 1fr auto;height:100vh}
header{display:flex;justify-content:space-between;align-items:baseline;padding:18px 26px;border-bottom:1px solid #d8b25a55}
h1{margin:0;font-weight:400;font-size:30px}.k{font:600 12px/1 sans-serif;letter-spacing:.3em;color:#d8b25a;text-transform:uppercase}
#timer{font-size:34px;color:#f3d58a;font-variant-numeric:tabular-nums}
main{padding:22px 26px;overflow:auto;font-size:22px;line-height:1.6}
footer{display:flex;gap:12px;align-items:center;padding:14px 26px;border-top:1px solid #d8b25a55;font-size:17px;color:#a9b5cc}
button{background:#d8b25a;color:#081024;border:0;border-radius:8px;padding:10px 18px;font-size:16px;cursor:pointer}
#nx{margin-left:auto}</style></head><body>
<header><div><div class="k" id="sec"></div><h1 id="ti"></h1><div id="sp" style="color:#d8b25a;font-style:italic;margin-top:4px"></div></div><div style="text-align:right"><div id="timer">00:00</div><div id="cnt" class="k"></div></div></header>
<main id="no"></main>
<footer><button id="bp">◀ Précédente</button><button id="bn">Suivante ▶</button><span id="nx"></span></footer>
</body></html>`);
    pw.document.close();
    pw.document.getElementById('bp').onclick = prev;
    pw.document.getElementById('bn').onclick = next;
    pw.document.addEventListener('keydown', onKey);
    pw.setInterval(function () {
      const sec = Math.floor((Date.now() - pStart) / 1000);
      const t = pw.document.getElementById('timer');
      if (t) t.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
    }, 1000);
    updatePresenter();
  }
  function titleOf(s) { return s ? (s.dataset.title || ($('.s-title', s) || {}).textContent || '') : '—'; }
  function updatePresenter() {
    if (!pw || pw.closed) return;
    const d = pw.document, s = slides[idx], n = slides[idx + 1];
    const g = id => d.getElementById(id);
    if (!g('ti')) return;
    g('sec').textContent = (SECTIONS[s.dataset.section] || {}).label || '';
    g('ti').textContent = titleOf(s);
    g('sp').textContent = s.dataset.speaker ? 'Personne ' + s.dataset.speaker : 'Ensemble';
    g('cnt').textContent = (idx + 1) + ' / ' + slides.length;
    g('no').innerHTML = ($('.notes', s) || { innerHTML: '' }).innerHTML;
    g('nx').textContent = n ? 'Ensuite : ' + titleOf(n) + (n.dataset.speaker ? ' (Personne ' + n.dataset.speaker + ')' : '') : 'Fin';
  }

  /* ---------- input ---------- */
  let jumpBuf = '', jumpT;
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k) && !(k === 'Enter' && jumpBuf)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'f' || k === 'F') fullscreen();
    else if (k === 'o' || k === 'O' || k === 'g' || k === 'G') toggle('#overview');
    else if (k === 'n' || k === 'N') toggleNotes();
    else if (k === 'p' || k === 'P') openPresenter();
    else if (k === '?' || k === 'h' || k === 'H') toggle('#help');
    else if (k === 'Escape') { toggle('#overview', false); toggle('#help', false); }
    else if (/^[0-9]$/.test(k)) {
      jumpBuf += k; const j = $('#jump'); j.textContent = jumpBuf; j.classList.add('show');
      clearTimeout(jumpT); jumpT = setTimeout(() => { jumpBuf = ''; j.classList.remove('show'); }, 1800);
    }
    if (k === 'Enter' && jumpBuf) { e.preventDefault(); go(+jumpBuf - 1); jumpBuf = ''; $('#jump').classList.remove('show'); }
  }

  function bindInput() {
    document.addEventListener('keydown', onKey);
    let wheelLock = 0;
    window.addEventListener('wheel', function (e) {
      if ($('#overview').classList.contains('open') || $('#notes').contains(e.target)) return;
      const now = Date.now();
      if (now - wheelLock < 900 || Math.abs(e.deltaY) < 25) return;
      wheelLock = now; e.deltaY > 0 ? next() : prev();
    }, { passive: true });
    let tx = null, ty = null;
    window.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', function (e) {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev();
      tx = null;
    });
    let uiT;
    window.addEventListener('mousemove', function () {
      document.body.classList.add('show-ui');
      clearTimeout(uiT); uiT = setTimeout(() => document.body.classList.remove('show-ui'), 2500);
    });
    window.addEventListener('resize', fit);
  }

  /* parallax inside the active slide (uses the independent CSS `translate` property so it never fights GSAP transforms) */
  function parallaxLoop() {
    const m = window.Atmosphere.mouse;
    const s = slides[idx];
    if (s) $$('[data-px]', s).forEach(function (n) {
      const k = +n.dataset.px;
      n.style.translate = `${(-m.x * k).toFixed(1)}px ${(-m.y * k * .6).toFixed(1)}px`;
    });
    requestAnimationFrame(parallaxLoop);
  }

  /* ---------- boot ---------- */
  function init() {
    slides = $$('#stage > .slide');
    icons(document);
    slides.forEach(decorate);
    window.Atmosphere.init();
    buildHud();
    bindInput();
    fit();
    const h = parseInt((location.hash || '').slice(1), 10);
    const start = h >= 1 && h <= slides.length ? h - 1 : 0;
    if (!reduced) parallaxLoop();
    let started = false;
    const done = function () {
      if (started) return;
      started = true;
      $('#loader').classList.add('done');
      go(start, { instant: true });
    };
    window.addEventListener('load', () => setTimeout(done, 300));
    setTimeout(done, 3500);
  }

  window.Deck = { go, next, prev, get index() { return idx; }, get count() { return slides.length; } };
  document.addEventListener('DOMContentLoaded', init);
})();
