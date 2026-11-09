/* georgematei.com · Catalogo Utilizzi AI
   I dati arrivano da dati.js (window.CATALOGO), generato da uno script: qui non si scrive a mano nessuna scheda.
   Filtri: tipo, area, ruolo, livello, per chi, settore + ricerca. #<id> apre una scheda (link condivisibile). */
(function () {
  'use strict';
  var D = window.CATALOGO;
  var grid = document.querySelector('.cat__grid');
  if (!D || !grid) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TIPI = [['agente-ai', 'Agenti AI'], ['automazione', 'Automazioni'], ['app', 'App e software'], ['formazione', 'Formazione'], ['consulenza', 'Consulenza']];
  var TIPO = {}; TIPI.forEach(function (t) { TIPO[t[0]] = t[1]; });
  var LIV = { base: 'Base', intermedio: 'Intermedio', avanzato: 'Avanzato' };
  var PER = [['azienda', 'Aziende'], ['freelance', 'Freelance']];
  var schede = D.schede.map(function (x) {
    x._t = norm([TIPO[x.categoria], x.titolo, x.promessa, x.problema, x.soluzione, (x.include || []).join(' '), (x.settori || []).join(' '), (x.ruoli || []).join(' '), (x.aree || []).join(' '), (x.strumenti || []).join(' ')].join(' '));
    x._peso = (x.livello === 'base' ? 2 : x.livello === 'intermedio' ? 1 : 0) + (x.categoria === 'agente-ai' || x.categoria === 'automazione' ? 1 : 0);
    return x;
  });

  // stato dei filtri: insiemi (più valori dello stesso gruppo = OR; gruppi diversi = AND)
  var F = { tipo: new Set(), area: new Set(), ruolo: new Set(), livello: new Set(), per: new Set(), settore: new Set() };
  var q = '', ord = 'evidenza';
  var GRUPPI = [
    ['tipo', 'Cosa', function () { return TIPI.map(function (t) { return [t[0], t[1]]; }); }, function (x) { return [x.categoria]; }],
    ['area', 'Area', function () { return D.aree.map(function (a) { return [a, a]; }); }, function (x) { return x.aree || []; }],
    ['ruolo', 'Per il ruolo', function () { return D.ruoli.map(function (a) { return [a, a]; }); }, function (x) { return x.ruoli || []; }],
    ['livello', 'Impegno', function () { return Object.keys(LIV).map(function (k) { return [k, LIV[k]]; }); }, function (x) { return [x.livello]; }],
    ['per', 'Per chi', function () { return PER; }, function (x) { return x.per || []; }],
    ['settore', 'Settore', function () {
      var c = {}; schede.forEach(function (x) { (x.settori || []).forEach(function (s) { c[s] = (c[s] || 0) + 1; }); });
      return Object.keys(c).sort(function (a, b) { return a === 'Trasversale' ? -1 : b === 'Trasversale' ? 1 : c[b] - c[a] || a.localeCompare(b, 'it'); }).map(function (s) { return [s, s]; });
    }, function (x) { return x.settori || []; }],
  ];
  var VALORI = {}; GRUPPI.forEach(function (g) { VALORI[g[0]] = g[3]; });

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function passa(x, salta) {
    for (var k in F) {
      if (k === salta || !F[k].size) continue;
      var v = VALORI[k](x), ok = false;
      for (var i = 0; i < v.length; i++) if (F[k].has(v[i])) { ok = true; break; }
      if (!ok) return false;
    }
    if (q) { var p = norm(q).split(/\s+/); for (var j = 0; j < p.length; j++) if (p[j] && x._t.indexOf(p[j]) < 0) return false; }
    return true;
  }
  function risultati() {
    var l = schede.filter(function (x) { return passa(x); });
    var cmp = {
      evidenza: function (a, b) { return b._peso - a._peso || a.titolo.localeCompare(b.titolo, 'it'); },
      facili: function (a, b) { return lv(a) - lv(b) || a.titolo.localeCompare(b.titolo, 'it'); },
      az: function (a, b) { return a.titolo.localeCompare(b.titolo, 'it'); },
    }[ord];
    return l.sort(cmp);
  }
  function lv(x) { return { base: 1, intermedio: 2, avanzato: 3 }[x.livello] || 2; }
  // conteggio di un valore tenendo fermi gli altri gruppi
  function conta(k, v) {
    var n = 0;
    schede.forEach(function (x) { if (passa(x, k) && VALORI[k](x).indexOf(v) >= 0) n++; });
    return n;
  }

  /* ---------- disegno ---------- */
  var filtriEl = document.getElementById('filtri');
  var aperti = { tipo: true, livello: true, ruolo: true };
  function disegnaFiltri() {
    // chi usa la tastiera non perde il punto in cui era: si ricorda la casella col fuoco e la si rimette dopo il ridisegno
    var a = document.activeElement, fuoco = a && filtriEl.contains(a) && a.dataset && a.dataset.k ? [a.dataset.k, a.value] : null;
    var fuocoSum = a && a.tagName === 'SUMMARY' && filtriEl.contains(a) ? a.parentNode.dataset.k : null;
    filtriEl.innerHTML = GRUPPI.map(function (g) {
      var k = g[0], voci = g[2]();
      var righe = voci.map(function (v) {
        var n = conta(k, v[0]), on = F[k].has(v[0]);
        return '<label class="fv' + (n || on ? '' : ' is-zero') + '"><input type="checkbox" data-k="' + k + '" value="' + esc(v[0]) + '"' + (on ? ' checked' : '') + (n || on ? '' : ' disabled') + '>' +
          (k === 'livello' ? '<i class="dot" data-lvl="' + v[0] + '"></i>' : '') + '<span>' + esc(v[1]) + '</span><b>' + n + '</b></label>';
      }).join('');
      var attivi = F[k].size ? ' <em>' + F[k].size + '</em>' : '';
      return '<details class="fg" data-k="' + k + '"' + (aperti[k] || F[k].size ? ' open' : '') + '><summary>' + g[1] + attivi + '</summary><div class="fg__list">' + righe + '</div></details>';
    }).join('');
    if (fuoco) {
      var el = filtriEl.querySelectorAll('input[data-k="' + fuoco[0] + '"]');
      for (var i = 0; i < el.length; i++) if (el[i].value === fuoco[1]) { el[i].focus({ preventScroll: true }); break; }
    } else if (fuocoSum) { var sm = filtriEl.querySelector('details[data-k="' + fuocoSum + '"] summary'); if (sm) sm.focus({ preventScroll: true }); }
  }

  function img(x, cls) {
    return '<img class="' + cls + '" src="/catalogo-use-case-ai/img/' + esc(x.immagine || 'automazione-flusso') + '.svg" alt="" loading="lazy" decoding="async" width="480" height="300">';
  }
  function cardHTML(x, i) {
    return '<article class="pc" style="--i:' + Math.min(i, 11) + '">' +
      '<a class="pc__link" href="#' + esc(x.id) + '" data-id="' + esc(x.id) + '">' +
      '<div class="pc__img">' + img(x, '') + '<span class="lvl-t" data-lvl="' + x.livello + '"><span class="sr-only">Impegno: </span>' + LIV[x.livello] + '</span>' +
      '<span class="pc__type" data-cat="' + esc(x.categoria) + '">' + esc(TIPO[x.categoria] || '') + '</span></div>' +
      '<div class="pc__body"><h3>' + esc(x.titolo) + '</h3><p class="pc__p">' + esc(x.promessa) + '</p></div>' +
      '</a></article>';
  }
  function attiviHTML() {
    var chip = [];
    Object.keys(F).forEach(function (k) {
      F[k].forEach(function (v) { chip.push('<button type="button" class="chip-f" data-k="' + k + '" data-v="' + esc(v) + '">' + esc(k === 'tipo' ? TIPO[v] : k === 'livello' ? LIV[v] : k === 'per' ? (v === 'azienda' ? 'Aziende' : 'Freelance') : v) + '<span aria-hidden="true">×</span><span class="sr-only"> (togli filtro)</span></button>'); });
    });
    if (q) chip.push('<button type="button" class="chip-f" data-k="q">«' + esc(q) + '»<span aria-hidden="true">×</span><span class="sr-only"> (togli ricerca)</span></button>');
    return chip.length ? chip.join('') + '<button type="button" class="chip-reset">Azzera tutto</button>' : '';
  }

  var primoGiro = true;
  function disegna() {
    var l = risultati();
    grid.classList.toggle('is-first', primoGiro && !reduce);
    grid.innerHTML = l.length ? l.map(cardHTML).join('') :
      '<div class="cat__empty"><h3>Nessun risultato con questi filtri</h3><p>Togli un filtro o cerca un\'altra parola. Se il tuo caso non c\'è, <a href="/calendario/">raccontamelo in 30 minuti</a>.</p></div>';
    document.querySelector('.cat__count').textContent = l.length === schede.length ? schede.length + ' soluzioni' : l.length + ' di ' + schede.length + ' soluzioni';
    document.querySelector('.cat__active').innerHTML = attiviHTML();
    var n = 0; for (var k in F) n += F[k].size;
    var fn = document.querySelector('.cat__fn'); fn.hidden = !n; fn.textContent = n;
    document.querySelectorAll('.lvl').forEach(function (b) { b.setAttribute('aria-pressed', String(F.livello.has(b.dataset.lvl))); });
    disegnaFiltri();
    if (primoGiro && !reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
      grid.querySelectorAll('.pc').forEach(function (c) { io.observe(c); });
    } else grid.querySelectorAll('.pc').forEach(function (c) { c.classList.add('is-in'); });
    primoGiro = false;
  }

  /* ---------- scheda ---------- */
  var dlg = document.getElementById('scheda'), box = dlg.querySelector('.sheet__box'), tornaA = null;
  var spinta = false, tChiudi = null;   // spinta: la scheda ha aggiunto una voce alla cronologia (chiudere = tornare indietro)
  var TITOLO = document.title;
  function schedaHTML(x) {
    var sez = function (t, h) { return h ? '<section><h3>' + t + '</h3>' + h + '</section>' : ''; };
    var inc = (x.include || []).length ? '<ul class="ticks">' + x.include.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '';
    var meta = [
      ['Impegno', '<span class="lvl-t" data-lvl="' + x.livello + '">' + LIV[x.livello] + '</span>'],
      [x.tempo && x.tempo.tipo === 'durata' ? 'Durata' : 'Tempo per realizzarlo', esc(x.tempo && x.tempo.testo)],
      ['Per', esc((x.per || []).map(function (p) { return p === 'azienda' ? 'Aziende' : 'Freelance'; }).join(' · '))],
      ['Ruoli', esc((x.ruoli || []).join(' · '))],
      ['Settori', esc((x.settori || []).join(' · '))],
    ].filter(function (r) { return r[1]; }).map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
    var simili = schede.filter(function (y) { return y.id !== x.id && ((y.aree || []).some(function (a) { return (x.aree || []).indexOf(a) >= 0; })); }).slice(0, 3);
    return '<button type="button" class="sheet__x" aria-label="Chiudi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' +
      '<div class="sheet__img">' + img(x, '') + '</div>' +
      '<div class="sheet__body">' +
      '<p class="eyebrow">' + esc(TIPO[x.categoria] || '') + '</p>' +
      '<h2 id="scheda-t">' + esc(x.titolo) + '</h2>' +
      '<p class="sheet__lead">' + esc(x.promessa) + '</p>' +
      '<dl class="sheet__meta">' + meta + '</dl>' +
      sez('Il problema', x.problema ? '<p>' + esc(x.problema) + '</p>' : '') +
      sez('Cosa si costruisce', x.soluzione ? '<p>' + esc(x.soluzione) + '</p>' : '') +
      sez('Cosa comprende', inc) +
      sez('Risultato', x.risultato ? '<p>' + esc(x.risultato) + '</p>' : '') +
      sez('Strumenti', (x.strumenti || []).length ? '<p class="tools">' + x.strumenti.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</p>' : '') +
      '<div class="sheet__cta"><a class="btn" href="/calendario/">Ne parliamo in 30 minuti</a><button type="button" class="link-arrow sheet__copy" data-id="' + esc(x.id) + '">Copia il link</button></div>' +
      (simili.length ? '<section class="sheet__sim"><h3>Va bene insieme a</h3>' + simili.map(function (y) { return '<a href="#' + esc(y.id) + '" data-id="' + esc(y.id) + '">' + img(y, '') + '<span>' + esc(y.titolo) + '</span></a>'; }).join('') + '</section>' : '') +
      '</div>';
  }
  function apri(id, registra) {
    var x = schede.filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    clearTimeout(tChiudi); dlg.classList.remove('is-closing');
    if (!dlg.open) tornaA = document.activeElement;
    box.innerHTML = schedaHTML(x);
    box.scrollTop = 0; dlg.scrollTop = 0;
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); document.documentElement.classList.add('sheet-open'); }
    box.querySelector('.sheet__x').focus({ preventScroll: true });
    if (registra !== false && location.hash !== '#' + id) {
      if (spinta) history.replaceState(null, '', '#' + id); else { history.pushState(null, '', '#' + id); spinta = true; }
    }
    document.title = x.titolo + ' · Catalogo Utilizzi AI';
  }
  function chiudi(storia) {
    if (!dlg.open) return;
    dlg.classList.add('is-closing');
    clearTimeout(tChiudi);
    tChiudi = setTimeout(function () {
      dlg.classList.remove('is-closing');
      if (dlg.open) { if (dlg.close) dlg.close(); else { dlg.removeAttribute('open'); pulisci(); } }
    }, reduce ? 0 : 180);
    if (storia !== false && location.hash) {
      if (spinta) { spinta = false; history.back(); }
      else history.replaceState(null, '', location.pathname + location.search);
    }
  }
  // la pulizia sta sull'evento close: vale anche quando il browser chiude il dialog da solo
  function pulisci() {
    document.documentElement.classList.remove('sheet-open');
    document.title = TITOLO;
    if (tornaA && tornaA.focus) tornaA.focus({ preventScroll: true });
  }
  dlg.addEventListener('close', function () {
    pulisci();
    if (location.hash) { if (spinta) { spinta = false; history.back(); } else history.replaceState(null, '', location.pathname + location.search); }
  });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); chiudi(); });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) { chiudi(); return; }
    if (e.target.closest('.sheet__x')) { chiudi(); return; }
    var a = e.target.closest('a[data-id]'); if (a) { e.preventDefault(); apri(a.dataset.id); return; }
    var c = e.target.closest('.sheet__copy');
    if (c) {
      var url = location.origin + location.pathname + '#' + c.dataset.id;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { c.textContent = 'Link copiato'; c.setAttribute('aria-live', 'polite'); }, function () { var i = document.createElement('input'); i.value = url; i.readOnly = true; i.className = 'sheet__url'; i.setAttribute('aria-label', 'Link della scheda'); c.replaceWith(i); i.select(); });
    }
  });
  addEventListener('popstate', function () {
    var id = location.hash.slice(1);
    spinta = false;
    if (id) apri(decodeURIComponent(id), false); else chiudi(false);
  });

  /* ---------- eventi ---------- */
  grid.addEventListener('click', function (e) { var a = e.target.closest('a[data-id]'); if (a) { e.preventDefault(); apri(a.dataset.id); } });
  filtriEl.addEventListener('change', function (e) {
    var i = e.target; if (!i.dataset.k) return;
    if (i.checked) F[i.dataset.k].add(i.value); else F[i.dataset.k].delete(i.value);
    disegna();
  });
  filtriEl.addEventListener('toggle', function (e) { var d = e.target; if (d.dataset && d.dataset.k) aperti[d.dataset.k] = d.open; }, true);
  document.querySelector('.cat__levels').addEventListener('click', function (e) {
    var b = e.target.closest('.lvl'); if (!b) return;
    var v = b.dataset.lvl; if (F.livello.has(v)) F.livello.delete(v); else F.livello.add(v);
    disegna();
  });
  document.querySelector('.cat__active').addEventListener('click', function (e) {
    if (e.target.closest('.chip-reset')) { for (var k in F) F[k].clear(); q = ''; document.getElementById('q').value = ''; disegna(); return; }
    var c = e.target.closest('.chip-f'); if (!c) return;
    if (c.dataset.k === 'q') { q = ''; document.getElementById('q').value = ''; } else F[c.dataset.k].delete(c.dataset.v);
    disegna();
  });
  var t = null;
  document.getElementById('q').addEventListener('input', function (e) { clearTimeout(t); t = setTimeout(function () { q = e.target.value.trim(); disegna(); }, 140); });
  document.getElementById('ord').addEventListener('change', function (e) { ord = e.target.value; disegna(); });
  // griglia o lista: la scelta resta per le visite successive (solo su questo browser)
  var vista = 'griglia';
  try { vista = localStorage.getItem('catalogo.vista') === 'lista' ? 'lista' : 'griglia'; } catch (e) {}
  function mettiVista(v) {
    vista = v;
    grid.classList.toggle('is-list', v === 'lista');
    document.querySelectorAll('.cat__view button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.vista === v)); });
    try { localStorage.setItem('catalogo.vista', v); } catch (e) {}
  }
  document.querySelector('.cat__view').addEventListener('click', function (e) { var b = e.target.closest('button[data-vista]'); if (b) mettiVista(b.dataset.vista); });
  mettiVista(vista);
  var ftog = document.querySelector('.cat__ftog');
  ftog.addEventListener('click', function () {
    var on = !document.body.classList.contains('filters-open');
    document.body.classList.toggle('filters-open', on);
    ftog.setAttribute('aria-expanded', String(on));
  });

  disegna();
  if (location.hash.length > 1) apri(decodeURIComponent(location.hash.slice(1)), false);
})();
