/* georgematei.com · 05/11/2026 sera
   Metodo: tre slide, una per ogni scorrimento. Le prove. Sistema passivo contro proattivo.
   Ogni scena si anima una volta sola; chi torna indietro la trova finita. */
(function () {
  var root = document.documentElement;
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)');
  var hoIO = 'IntersectionObserver' in window;

  function quando(el, soglia, fn) {
    if (!el) return;
    if (!hoIO) return fn();
    var o = new IntersectionObserver(function (v) {
      if (v[0].isIntersecting) { o.disconnect(); fn(); }
    }, { threshold: soglia });
    o.observe(el);
  }

  /* ---------- il modellino 3D ---------- */
  var MARMO = '#efe6d2', MARMO_L = '#fffdf8', MARMO_S = '#d8cbb0', MARMO_O = '#b5a78b', ORO = '#d6b05b', ORO_S = '#a9832f', NOTTE = '#0f1e3a';
  function faccia(w, h, tr, col, extra) {
    var f = document.createElement('div');
    f.className = 'm3d__f';
    f.style.cssText = 'width:' + w + 'px;height:' + h + 'px;background:' + col + ';transform:' + tr + ';' + (extra || '');
    return f;
  }
  function cubo(g, x, y, z, w, h, d, c) {
    /* (x,z) centro in pianta, y quota di base */
    c = c || [MARMO_L, MARMO, MARMO_S, MARMO_O];
    var t = 'translate3d(' + x + 'px,' + (-y) + 'px,' + z + 'px) ';
    g.appendChild(faccia(w, d, t + 'translate3d(' + (-w / 2) + 'px,' + (-h - d / 2) + 'px,0) rotateX(90deg)', c[0]));
    g.appendChild(faccia(w, h, t + 'translate3d(' + (-w / 2) + 'px,' + (-h) + 'px,' + (d / 2) + 'px)', c[1]));
    g.appendChild(faccia(w, h, t + 'translate3d(' + (-w / 2) + 'px,' + (-h) + 'px,' + (-d / 2) + 'px) rotateY(180deg)', c[3]));
    g.appendChild(faccia(d, h, t + 'translate3d(' + (w / 2 - d / 2) + 'px,' + (-h) + 'px,0) rotateY(90deg)', c[2]));
    g.appendChild(faccia(d, h, t + 'translate3d(' + (-w / 2 - d / 2) + 'px,' + (-h) + 'px,0) rotateY(-90deg)', c[3]));
  }
  function colonna(g, x, y, z, r, h) {
    var n = 10, fw = 2 * r * Math.tan(Math.PI / n) + 0.4;
    for (var i = 0; i < n; i++) {
      var a = i * 360 / n;
      /* luce da destra-davanti: tono secondo l'angolo */
      var l = Math.cos((a - 50) * Math.PI / 180);
      var col = l > 0.45 ? MARMO_L : l > -0.1 ? MARMO : l > -0.6 ? MARMO_S : MARMO_O;
      g.appendChild(faccia(fw, h, 'translate3d(' + (x - fw / 2) + 'px,' + (-y - h) + 'px,' + z + 'px) rotateY(' + a + 'deg) translateZ(' + r + 'px)', col));
    }
    cubo(g, x, y + h, z, r * 2.7, 6, r * 2.7, [ORO, ORO, ORO_S, ORO_S]);
  }
  function pezzo(mondo) {
    var p = document.createElement('div'), g = document.createElement('div');
    p.className = 'm3d__p'; g.className = 'm3d__giu';
    p.appendChild(g); mondo.appendChild(p);
    return g;
  }
  function costruisci(mondo) {
    var W = 196, D = 306, passo = 9, H = 86, r = 11;
    /* il piano del tavolo */
    var tav = document.createElement('div');
    tav.className = 'm3d__f';
    tav.style.cssText = 'width:470px;height:470px;border-radius:50%;background:radial-gradient(circle,#22396a 0,#0f1e3a 66%,#0b1733 100%);box-shadow:0 0 0 2px rgba(226,194,122,.6);transform:translate3d(-235px,-235px,0) rotateX(90deg)';
    mondo.appendChild(tav);
    var i, g;
    for (i = 0; i < 3; i++) cubo(pezzo(mondo), 0, i * passo, 0, W + 44 - i * 22, passo, D + 44 - i * 22);
    var base = 3 * passo, top = base + H + 6;
    var xs = [-1, -0.5, 0, 0.5, 1].map(function (k) { return k * (W / 2 - r); });
    var zs = [-1, -0.6, -0.2, 0.2, 0.6, 1].map(function (k) { return k * (D / 2 - r); });
    /* prima le colonne di dietro, poi quelle che si vedono meglio */
    var pos = [];
    zs.forEach(function (z) { xs.forEach(function (x, ix) { if (ix === 0 || ix === 4 || z === zs[0] || z === zs[5]) pos.push([x, z]); }); });
    pos.sort(function (a, b) { return (a[1] - a[0]) - (b[1] - b[0]); });
    pos.forEach(function (c) { colonna(pezzo(mondo), c[0], base, c[1], r, H); });
    /* la cella: il muro scuro dietro le colonne, così si leggono una a una */
    cubo(pezzo(mondo), 0, base, 0, W - 62, H + 6, D - 62, ['#6f6653', '#6b604c', '#584f3e', '#4d4535']);
    cubo(pezzo(mondo), 0, top, 0, W + 4, 12, D + 4);
    cubo(pezzo(mondo), 0, top + 12, 0, W + 4, 12, D + 4, [NOTTE, NOTTE, '#0b1733', '#0b1733']);
    cubo(pezzo(mondo), 0, top + 24, 0, W + 14, 5, D + 14, [ORO, ORO, ORO_S, ORO_S]);
    /* il tetto */
    var y0 = top + 29, W2 = W + 14, D2 = D + 14, alt = 44, s = Math.sqrt(W2 * W2 / 4 + alt * alt), ang = Math.atan2(alt, W2 / 2) * 180 / Math.PI;
    g = pezzo(mondo);
    var tegole = 'repeating-linear-gradient(90deg,#e7d9b7 0 7px,#f6f0e2 7px 9px)';
    g.appendChild(faccia(s, D2, 'translate3d(' + (W2 / 4 - s / 2) + 'px,' + (-y0 - alt / 2 - D2 / 2) + 'px,0) rotateZ(' + ang + 'deg) rotateX(90deg)', '#ded0ae', 'background-image:' + tegole));
    g.appendChild(faccia(s, D2, 'translate3d(' + (-W2 / 4 - s / 2) + 'px,' + (-y0 - alt / 2 - D2 / 2) + 'px,0) rotateZ(' + (-ang) + 'deg) rotateX(90deg)', '#ded0ae', 'background-image:' + tegole));
    g.appendChild(faccia(W2, alt, 'translate3d(' + (-W2 / 2) + 'px,' + (-y0 - alt) + 'px,' + (D2 / 2) + 'px)', MARMO_L, 'clip-path:polygon(50% 0,100% 100%,0 100%)'));
    g.appendChild(faccia(W2, alt, 'translate3d(' + (-W2 / 2) + 'px,' + (-y0 - alt) + 'px,' + (-D2 / 2) + 'px) rotateY(180deg)', MARMO_S, 'clip-path:polygon(50% 0,100% 100%,0 100%)'));
    /* la fiamma d'oro in cima, sul fronte */
    g = pezzo(mondo);
    g.appendChild(faccia(20, 26, 'translate3d(-10px,' + (-y0 - alt - 25) + 'px,' + (D2 / 2) + 'px)', ORO, 'clip-path:polygon(50% 0,92% 60%,50% 100%,8% 60%)'));
    return [].slice.call(mondo.querySelectorAll('.m3d__p'));
  }

  /* ---------- le tre scene ---------- */
  var timers = [];
  function dopo(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function animaTempo(out, ms) {
    var t0 = performance.now();
    (function tick(n) {
      if (fermate) return;
      var k = Math.min(1, (n - t0) / ms), m = Math.floor(k * 30), sec = Math.floor(k * 1800) % 60;
      out.textContent = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  var pezzi = [], modello = document.querySelector('.scena--modello');
  function montaModello() {
    var mondo = modello && modello.querySelector('.m3d__mondo');
    if (!mondo || pezzi.length) return;
    pezzi = costruisci(mondo);
    pezzi.forEach(function (p) { p.classList.add('on'); });
  }
  function giocaModello() {
    var q = modello.querySelector('.quadro'), bots = modello.querySelectorAll('.mod__bot');
    pezzi.forEach(function (p) { p.classList.remove('on'); });
    var i = 0, inizio = 1900, passo = 200;
    function portaRobot(p, b) {
      /* le facce hanno la posizione vera, il gruppo è un punto: il blocco appeso arriva sopra il pezzo */
      var qr = q.getBoundingClientRect(), s = qr.width / 640 || 1, facce = p.querySelectorAll('.m3d__f'), su = Infinity, sx = Infinity, dx = -Infinity;
      for (var k = 0; k < facce.length; k++) { var r = facce[k].getBoundingClientRect(); su = Math.min(su, r.top); sx = Math.min(sx, r.left); dx = Math.max(dx, r.right); }
      var x = ((sx + dx) / 2 - qr.left) / s - 30, y = Math.max(-10, (su - qr.top) / s - 72);
      b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    }
    if (bots[0]) { bots[0].style.transform = 'translate(290px,-20px)'; bots[1].style.transform = 'translate(560px,-40px)'; }
    function metti() {
      if (i >= pezzi.length) {
        dopo(500, function () { modello.classList.add('is-fine'); });
        return;
      }
      var p = pezzi[i], b = bots[i % 2];
      if (b) portaRobot(p, b);
      dopo(180, function () { p.classList.add('on'); });
      i++;
      dopo(passo, metti);
    }
    dopo(inizio, metti);
  }

  /* ---------- il palco ---------- */
  var sezione = document.getElementById('metodo');
  var pista = sezione && sezione.querySelector('.metodo__pista');
  var palco = sezione && sezione.querySelector('.metodo__palco');
  var slide = sezione ? [].slice.call(sezione.querySelectorAll('.m-slide')) : [];
  var numeri = sezione ? [].slice.call(sezione.querySelectorAll('.metodo__num')) : [];
  var nav = sezione && sezione.querySelector('.metodo__nav');
  var viva = false, idx = 0, giocate = [false, false, false], palcoVisto = false, fermate = false;

  function gioca(i) {
    if (giocate[i] || !viva || !palcoVisto) return;
    giocate[i] = true;
    var sc = slide[i].querySelector('.scena');
    sc.classList.add('is-go');
    if (i === 0) animaTempo(sc.querySelector('.call__tempo'), 5400);
    if (i === 1) giocaModello();
  }

  function mostra(i) {
    idx = i;
    slide.forEach(function (s, k) {
      s.classList.toggle('is-att', k === i);
      s.classList.toggle('is-prima', k < i);
    });
    numeri.forEach(function (b, k) {
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('is-fatto', k < i);
    });
    if (nav) nav.style.setProperty('--avanzo', i / 2);
    gioca(i);
  }

  function misure() {
    var navH = document.querySelector('.nav').offsetHeight;
    var inizio = scrollY + pista.getBoundingClientRect().top - navH;
    var corsa = pista.offsetHeight - palco.offsetHeight;
    return { inizio: inizio, passo: corsa / 2, fine: inizio + corsa };
  }
  function vai(i) {
    var m = misure();
    window.scrollTo({ top: m.inizio + i * m.passo, behavior: 'instant' });
    mostra(i);
  }
  function suScroll() {
    if (!viva) return;
    var m = misure(), k = m.passo > 0 ? (scrollY - m.inizio) / m.passo : 0;
    var i = Math.max(0, Math.min(2, Math.round(k)));
    if (i !== idx) mostra(i);
  }

  /* Una rotella, una slide: il blocco assorbe l'inerzia del trackpad */
  var blocco = false, ultimoT = 0, ultimoD = 0, sblocco = 0, massimo = 0, eraDentro = false;
  function suRotella(e) {
    if (!viva || e.ctrlKey || !e.deltaY) return;
    var m = misure(), y = scrollY, ora = performance.now();
    var dentro = y >= m.inizio - 2 && y <= m.fine + 2;
    /* entrando da sopra con un colpo solo: si ferma sulla prima slide */
    var d = e.deltaY, dir = d > 0 ? 1 : -1, abs = Math.abs(d);
    var calmo = ora - ultimoT > 170, piuForte = abs > ultimoD * 1.7 + 10 && ora > sblocco;
    ultimoT = ora; ultimoD = abs;
    /* poco sopra il palco (arrivi dal menu): il primo colpo aggancia la prima slide */
    if (!dentro && dir > 0 && y >= m.inizio - 170 && y < m.inizio) {
      e.preventDefault();
      window.scrollTo({ top: m.inizio, behavior: 'instant' });
      eraDentro = true; blocco = true; sblocco = ora + 420; massimo = ora + 1500;
      return;
    }
    if (!dentro) { eraDentro = false; return; }
    if (!eraDentro) {
      eraDentro = true;
      if (!calmo) { blocco = true; sblocco = ora + 420; massimo = ora + 1100; e.preventDefault(); return; }
    }
    if (blocco) {
      if ((ora > massimo && abs > 30) || (ora > sblocco && (calmo || piuForte))) blocco = false;
      else { e.preventDefault(); return; }
    }
    var dopoI = idx + dir;
    if (dopoI < 0 || dopoI > 2) return;              /* dalle estremità si esce scorrendo normalmente */
    e.preventDefault();
    vai(dopoI);
    blocco = true; sblocco = ora + 620; massimo = ora + 2200;
  }

  /* PagGiù, PagSu e Spazio: una slide per tasto, come la rotella */
  function suTasto(e) {
    if (!viva || e.altKey || e.ctrlKey || e.metaKey) return;
    var giu = e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey), su = e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
    if (!giu && !su) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || (t && t.isContentEditable)) return;
    var m = misure(), y = scrollY;
    if (y < m.inizio - 2 || y > m.fine + 2) return;
    var i = idx + (giu ? 1 : -1);
    if (i < 0 || i > 2) return;
    e.preventDefault();
    vai(i);
  }

  /* Il comando per fermare tutto: le scene si mostrano finite (WCAG 2.2.2) */
  function fermaScene() {
    timers.forEach(clearTimeout); timers = [];
    fermate = true;
    root.classList.add('anim-ferme');
    pezzi.forEach(function (p) { p.classList.add('on'); });
    slide.forEach(function (s, k) { giocate[k] = true; s.querySelector('.scena').classList.add('is-go', 'is-fine'); });
    var tempo = sezione.querySelector('.call__tempo'); if (tempo) tempo.textContent = '30:00';
    var fb = sezione.querySelector('.metodo__ferma'); if (fb) fb.hidden = true;
  }

  function aggiornaModo() {
    var si = !ridotto.matches && hoIO && matchMedia('(min-height: 600px)').matches;
    if (si === viva) return;
    viva = si;
    root.classList.toggle('metodo--viva', viva);
    if (viva) suScroll();
    else slide.forEach(function (s) {
      s.classList.remove('is-prima');
      s.querySelector('.scena').classList.add('is-go');
      s.querySelector('.scena').classList.remove('is-fine');
    });
    misuraQuadri();
  }

  var scene = sezione ? [].slice.call(sezione.querySelectorAll('.scena')) : [];
  function misuraQuadri() {
    scene.forEach(function (s) {
      var w = s.clientWidth;
      if (w) s.querySelector('.quadro').style.setProperty('--s', (w / 640).toFixed(4));
    });
  }

  if (sezione) {
    montaModello();
    aggiornaModo();
    misuraQuadri();
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(misuraQuadri); scene.forEach(function (s) { ro.observe(s); }); }
    addEventListener('resize', function () { aggiornaModo(); misuraQuadri(); suScroll(); }, { passive: true });
    addEventListener('scroll', suScroll, { passive: true });
    addEventListener('wheel', suRotella, { passive: false });
    addEventListener('keydown', suTasto);
    var fb = sezione.querySelector('.metodo__ferma'); if (fb) fb.addEventListener('click', fermaScene);
    numeri.forEach(function (b) { b.addEventListener('click', function () { vai(+b.getAttribute('data-vai')); }); });
    quando(palco, 0.45, function () { palcoVisto = true; gioca(idx); });
    /* il modellino segue un po' il mouse: lo tocchi con mano */
    if (modello && matchMedia('(hover: hover)').matches && !ridotto.matches) {
      var mondo = modello.querySelector('.m3d__mondo');
      modello.addEventListener('pointermove', function (e) {
        var r = modello.getBoundingClientRect();
        mondo.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 34 + 'deg');
      });
      modello.addEventListener('pointerleave', function () { mondo.style.setProperty('--ry', '0deg'); });
    }
  }

  /* ---------- le prove: il muro degli 80 ---------- */
  var muro = document.querySelector('.muro');
  if (muro) {
    var html = '';
    for (var b = 0; b < 80; b++) html += '<i style="--i:' + b + '"></i>';
    muro.innerHTML = html;
    if (!ridotto.matches && hoIO) {
      muro.classList.add('is-attesa');
      quando(muro, 0.3, function () { muro.classList.remove('is-attesa'); });
    }
  }

  /* ---------- da passivo a proattivo: la stessa settimana, due sistemi ---------- */
  var ORE = ['Martedì, 21:40', 'Mercoledì, 9:00', 'Venerdì, 17:00', 'Lunedì, 8:00'];
  var STORIA = {
    vecchio: { sospesi: [3, 4, 6, 7], piede: null, righe: [
      [['Messaggio non letto', ''], ['Nessuno ha risposto', ''], ['Richiamato: tardi', ''], ['Ha chiamato un altro', 'ko']],
      [['Inviato', ''], ['Nessun promemoria', ''], ['Nessuno se n\'è accorto', ''], ['Laura ha scelto un altro', 'ko']],
      [['Da fare', ''], ['Da fare', ''], ['Da ricopiare su Excel', ''], ['La mattina di qualcuno', 'ko']]
    ] },
    vivo: { sospesi: [3, 2, 1, 0], piede: ['Sta lavorando il sistema.', 'Sta lavorando il sistema.', 'Tocca a te: richiama Laura.', 'A te arriva solo quello che tocca a te.'], righe: [
      [['Risposto subito', 'lavora'], ['Appuntamento fissato', 'ok'], ['Appuntamento fissato', 'ok'], ['Appuntamento fissato', 'ok']],
      [['Inviato', 'lavora'], ['Promemoria a Laura', 'lavora'], ['Laura chiede le rate: avvisato Marco', 'lavora'], ['Accettato', 'ok']],
      [['Legge Excel e WhatsApp', 'lavora'], ['Mette insieme i dati', 'lavora'], ['Controlla i numeri', 'lavora'], ['Pronto alle 8', 'ok']]
    ] }
  };
  var pannelli = [].slice.call(document.querySelectorAll('.sis'));
  var rivedi = document.querySelector('.sis-rivedi');
  var finali = pannelli.map(function (p) {
    return { p: p, st: [].slice.call(p.querySelectorAll('.sis__stato')).map(function (s) { return s.textContent; }) };
  });
  function posa(p, g) {
    var st = STORIA[p.getAttribute('data-sis')], righe = p.querySelectorAll('.sis__riga');
    p.querySelector('.sis__orario').textContent = ORE[g];
    p.querySelector('.sis__clock').style.setProperty('--g', g);
    p.querySelector('.sis__sospesi b').textContent = st.sospesi[g];
    st.righe.forEach(function (riga, r) {
      righe[r].querySelector('.sis__stato').textContent = riga[g][0];
      righe[r].setAttribute('data-stato', riga[g][1]);
    });
    var av = p.querySelector('.sis__avviso');
    if (av && st.piede) av.textContent = st.piede[g];
  }
  var inCorsa = [], finiti = 0, saltata = false;
  function etichetta() {
    if (!rivedi) return;
    rivedi.hidden = false;
    rivedi.textContent = finiti >= pannelli.length ? 'Rivedi la settimana' : 'Salta alla fine';
  }
  function chiudi(p) { posa(p, 3); p.classList.remove('is-corre', 'is-attesa'); }
  function corri(p) {
    if (saltata) return;
    p.classList.add('is-attesa');
    posa(p, 0);
    p.classList.add('is-corre');
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.remove('is-attesa'); }); });
    etichetta();
    [1, 2, 3].forEach(function (g) {
      inCorsa.push(setTimeout(function () {
        posa(p, g);
        if (g === 3) { p.classList.remove('is-corre'); finiti++; etichetta(); }
      }, g * 2300));
    });
  }
  if (pannelli.length && !ridotto.matches && hoIO) {
    pannelli.forEach(function (p) { p.classList.add('is-attesa'); posa(p, 0); quando(p, 0.45, function () { corri(p); }); });
    if (rivedi) rivedi.addEventListener('click', function () {
      inCorsa.forEach(clearTimeout); inCorsa = [];
      if (finiti >= pannelli.length) { finiti = 0; saltata = false; pannelli.forEach(corri); return; }
      saltata = true; finiti = pannelli.length;
      pannelli.forEach(chiudi);
      etichetta();
    });
  }
})();
