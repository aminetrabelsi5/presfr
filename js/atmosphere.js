/* Living background: theme skies, starfield, glowing dust (back + front canvases),
   floating historical symbols and mouse parallax. Exposes window.Atmosphere.setTheme(name). */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const THEMES = {
    //            dust rgb          star alpha  dust count factor  dust blend
    night:     { dust: [243, 213, 138], stars: 1,   amount: 1 },
    parchment: { dust: [150, 105, 40],  stars: 0,   amount: .7 },
    emerald:   { dust: [235, 210, 140], stars: .55, amount: 1 },
    dusk:      { dust: [255, 205, 150], stars: .8,  amount: .9 }
  };

  let theme = 'night';
  const cur = { dust: THEMES.night.dust.slice(), stars: 1, amount: 1 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext('2d');
    return { c, ctx };
  }

  let back, front, W = 0, H = 0, DPR = 1;
  let stars = [], dustBack = [], dustFront = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    [back, front].forEach(function (k) {
      k.c.width = W * DPR; k.c.height = H * DPR;
      k.c.style.width = W + 'px'; k.c.style.height = H + 'px';
      k.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    });
    seed();
  }

  function seed() {
    const area = W * H / (1440 * 900);
    stars = [];
    for (let i = 0; i < 260 * area; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H * .75, r: Math.random() * 1.2 + .2, p: Math.random() * Math.PI * 2, s: .5 + Math.random() * 2, d: .2 + Math.random() * .6 });
    }
    dustBack = []; dustFront = [];
    for (let i = 0; i < 90 * area; i++) dustBack.push(mote(false));
    for (let i = 0; i < 26 * area; i++) dustFront.push(mote(true));
  }
  function mote(front) {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: front ? 1.2 + Math.random() * 2.4 : .6 + Math.random() * 1.8,
      vy: -(.08 + Math.random() * .25) * (front ? 1.6 : 1),
      vx: (Math.random() - .5) * .12,
      ph: Math.random() * Math.PI * 2, sw: .2 + Math.random() * .6,
      a: front ? .25 + Math.random() * .35 : .2 + Math.random() * .5,
      d: front ? 1.4 + Math.random() : .4 + Math.random() * .6,
      life: Math.random()
    };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  let t0 = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - t0); t0 = now;
    const tgt = THEMES[theme];
    const k = 1 - Math.pow(.997, dt);
    for (let i = 0; i < 3; i++) cur.dust[i] = lerp(cur.dust[i], tgt.dust[i], k);
    cur.stars = lerp(cur.stars, tgt.stars, k);
    cur.amount = lerp(cur.amount, tgt.amount, k);
    mouse.x = lerp(mouse.x, mouse.tx, .04); mouse.y = lerp(mouse.y, mouse.ty, .04);

    const time = now / 1000;
    const bc = back.ctx, fc = front.ctx;
    bc.clearRect(0, 0, W, H); fc.clearRect(0, 0, W, H);
    const [r, g, b] = cur.dust.map(Math.round);

    // stars
    if (cur.stars > .02) {
      for (const s of stars) {
        const tw = .45 + .55 * Math.sin(time * s.s + s.p);
        bc.globalAlpha = cur.stars * tw * .9;
        bc.fillStyle = '#eef2ff';
        bc.beginPath();
        bc.arc(s.x - mouse.x * 12 * s.d, s.y - mouse.y * 8 * s.d, s.r, 0, 6.283);
        bc.fill();
      }
    }
    // dust
    function drawDust(ctx, list, glow) {
      const n = Math.floor(list.length * cur.amount);
      for (let i = 0; i < n; i++) {
        const m = list[i];
        m.y += m.vy * dt * .06; m.x += (m.vx + Math.sin(time * m.sw + m.ph) * .15) * dt * .06;
        m.life += dt * .00008;
        if (m.y < -20) { m.y = H + 20; m.x = Math.random() * W; }
        if (m.x < -20) m.x = W + 20; if (m.x > W + 20) m.x = -20;
        const flick = .6 + .4 * Math.sin(time * 1.5 + m.ph);
        const x = m.x - mouse.x * 30 * m.d, y = m.y - mouse.y * 20 * m.d;
        ctx.globalAlpha = m.a * flick;
        if (glow) {
          const gr = ctx.createRadialGradient(x, y, 0, x, y, m.r * 4);
          gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
          gr.addColorStop(.3, `rgba(${r},${g},${b},.35)`);
          gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(x, y, m.r * 4, 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath(); ctx.arc(x, y, m.r, 0, 6.283); ctx.fill();
        }
      }
    }
    drawDust(bc, dustBack, false);
    drawDust(fc, dustFront, theme !== 'parchment');
    bc.globalAlpha = 1; fc.globalAlpha = 1;

    // parallax on decorative layers
    parallax.forEach(function (p) {
      p.el.style.transform = `translate3d(${-mouse.x * p.d}px, ${-mouse.y * p.d * .7}px, 0)`;
    });
    if (!reduced) requestAnimationFrame(frame);
  }

  const parallax = [];

  function buildFloaters() {
    const host = document.querySelector('.floaters');
    if (!host) return;
    const icons = ['feather', 'compass', 'scale', 'crown', 'book-open', 'scroll-text', 'castle', 'sailboat', 'landmark', 'hourglass'];
    const spots = [[6, 18], [88, 12], [14, 78], [80, 72], [48, 8], [30, 48], [70, 40], [92, 46], [4, 50], [58, 86]];
    icons.forEach(function (name, i) {
      const d = document.createElement('div');
      d.className = 'floater';
      const size = 40 + (i * 37) % 70;
      d.style.cssText = `left:${spots[i][0]}%;top:${spots[i][1]}%;width:${size}px;height:${size}px;animation-delay:${-i * 3.1}s;animation-duration:${22 + (i * 7) % 18}s`;
      d.innerHTML = `<svg><use href="#i-${name}"/></svg>`;
      host.appendChild(d);
    });
  }

  function init() {
    back = setupCanvas('dust-back');
    front = setupCanvas('dust-front');
    buildFloaters();
    document.querySelectorAll('[data-depth]').forEach(function (n) { parallax.push({ el: n, d: +n.dataset.depth }); });
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth - .5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - .5) * 2;
    });
    resize();
    requestAnimationFrame(frame);
  }

  function setTheme(name) {
    if (!THEMES[name]) name = 'night';
    theme = name;
    document.body.dataset.theme = name;
    document.querySelectorAll('.sky').forEach(function (s) { s.classList.toggle('on', s.dataset.sky === name); });
  }

  window.Atmosphere = { init, setTheme, mouse };
})();
