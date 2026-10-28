/* georgematei.com · esempi da toccare con mano (simulazioni, nessun dato inviato) */
(function () {
  var root = document.getElementById('prova');
  if (!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ---------- schede ---------- */
  var tabs = root.querySelectorAll('[role="tab"]');
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); select(n); n.focus(); }
    });
  });

  document.querySelectorAll('[data-open-tab]').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = document.getElementById(a.getAttribute('data-open-tab'));
      if (t) select(t);
    });
  });

  /* ---------- 1 · l'agente risponde ---------- */
  var chat = root.querySelector('.phone__chat');
  var replies = root.querySelector('.phone__replies');
  var chips = root.querySelectorAll('[data-scenario]');
  var busy = false;

  var clock = 0;
  function now() {
    var m = 21 * 60 + 40 + clock;
    return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2);
  }
  function bubble(who, text) {
    var b = el('p', 'bubble bubble--' + who);
    var sr = el('span', 'sr-only', who === 'in' ? 'Cliente: ' : 'Assistente AI: ');
    b.appendChild(sr);
    b.appendChild(document.createTextNode(text));
    b.appendChild(el('span', 'bubble__time', now()));
    if (who === 'in') clock += 1;
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
    return b;
  }
  function notice(title, sub) {
    var n = el('div', 'notice');
    n.appendChild(el('b', null, title));
    n.appendChild(el('span', null, sub));
    chat.appendChild(n);
    chat.scrollTop = chat.scrollHeight;
  }
  async function typing(ms) {
    var t = el('p', 'bubble bubble--out bubble--typing');
    t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<i></i><i></i><i></i>';
    chat.appendChild(t);
    chat.scrollTop = chat.scrollHeight;
    await wait(ms || 900);
    t.remove();
  }
  function ask(options) {
    return new Promise(function (resolve) {
      replies.replaceChildren();
      options.forEach(function (o) {
        var b = el('button', 'reply', o);
        b.type = 'button';
        b.addEventListener('click', function () {
          var hadFocus = document.activeElement === b;
          if (hadFocus) chat.focus({ preventScroll: true });
          replies.replaceChildren();
          resolve(o);
        });
        replies.appendChild(b);
      });
      var first = replies.querySelector('button');
      var a = document.activeElement;
      if (first && (a === document.body || a === chat || root.contains(a))) first.focus({ preventScroll: true });
    });
  }
  var scenari = {
    preventivo: async function () {
      bubble('in', 'Buonasera, vorrei un preventivo.');
      await typing(1000);
      bubble('out', 'Buonasera! Sono l\'assistente AI dello studio. Per prepararle un preventivo preciso mi servono due informazioni. Il lavoro è per una casa, un ufficio o un negozio?');
      var tipo = await ask(['Una casa', 'Un ufficio', 'Un negozio']);
      bubble('in', tipo + '.');
      await typing(900);
      bubble('out', 'Perfetto. E quando vorrebbe iniziare?');
      var quando = await ask(['Entro un mese', 'Più avanti', 'Non lo so ancora']);
      bubble('in', quando + '.');
      await typing(1100);
      bubble('out', 'Chiaro. Le propongo una chiamata di 15 minuti con Marco, che segue i preventivi: domani alle 9:30 le va bene?');
      var ok = await ask(['Sì, va bene', 'Preferisco il pomeriggio']);
      bubble('in', ok + '.');
      await typing(900);
      if (ok === 'Sì, va bene') {
        bubble('out', 'Fatto: domani alle 9:30 la chiama Marco. Le ho mandato un promemoria.');
        notice('Appuntamento in agenda', 'Domani 9:30 · chiamata con Marco · scheda cliente già compilata');
      } else {
        bubble('out', 'Nessun problema: domani alle 15:00 le va bene? La chiama sempre Marco, che segue i preventivi.');
        await ask(['Sì, perfetto']);
        bubble('in', 'Sì, perfetto.');
        await typing(700);
        bubble('out', 'Fatto: domani alle 15:00 la chiama Marco.');
        notice('Appuntamento in agenda', 'Domani 15:00 · chiamata con Marco · scheda cliente già compilata');
      }
    },
    sabato: async function () {
      bubble('in', 'Siete aperti sabato?');
      await typing(900);
      bubble('out', 'Buonasera, sono l\'assistente AI dello studio. Sì, sabato siamo aperti dalle 9 alle 13. Vuole che le fissi un appuntamento?');
      var r = await ask(['Sì, alle 10', 'No, grazie']);
      bubble('in', r + '.');
      await typing(800);
      if (r === 'Sì, alle 10') {
        bubble('out', 'Fatto: sabato alle 10 la aspettiamo. Le ho mandato l\'indirizzo e un promemoria per venerdì sera.');
        notice('Appuntamento in agenda', 'Sabato 10:00 · promemoria venerdì sera');
      } else {
        bubble('out', 'Va bene. Se le serve, scriva pure qui a qualsiasi ora.');
      }
    },
    persona: async function () {
      bubble('in', 'Posso parlare con una persona?');
      await typing(900);
      bubble('out', 'Certo. Sono l\'assistente AI dello studio: le passo Giulia, che le risponde appena libera. A lei ho già mandato il riassunto, così non deve ripetere niente.');
      notice('Passaggio a una persona', 'Giulia riceve la chat con il riassunto');
    }
  };
  async function run(name) {
    if (busy) return;
    busy = true;
    chips.forEach(function (c) { c.setAttribute('aria-disabled', 'true'); });
    clock = 0;
    chat.replaceChildren(el('p', 'phone__day', 'Oggi'));
    replies.replaceChildren();
    var phone = root.querySelector('.phone');
    var r = phone.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight) phone.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    try { await scenari[name](); } finally {
      busy = false;
      chips.forEach(function (c) { c.removeAttribute('aria-disabled'); });
      var after = root.querySelector('.try__after');
      if (after) {
        after.classList.add('is-on'); after.removeAttribute('aria-hidden');
        var ae = document.activeElement;
        if (ae === chat || ae === document.body) { var l = after.querySelector('a'); if (l) l.focus({ preventScroll: true }); }
      }
    }
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { if (c.getAttribute('aria-disabled') !== 'true') run(c.getAttribute('data-scenario')); }); });

  /* ---------- 2 · preventivi: senza e con l'AI ---------- */
  var slider = root.querySelector('.timeline-range');
  var out = root.querySelector('.timeline-day');
  var modes = root.querySelectorAll('.seg [data-mode]');
  var items = root.querySelectorAll('.tl li');
  var playBtn = root.querySelector('.tl-play');
  var mode = 'senza';
  function paint() {
    var d = +slider.value;
    out.textContent = d === 0 ? 'il giorno dell\'invio' : d === 1 ? 'dopo 1 giorno' : 'dopo ' + d + ' giorni';
    slider.setAttribute('aria-valuetext', out.textContent);
    items.forEach(function (li) {
      var show = li.getAttribute('data-mode') === mode && +li.getAttribute('data-day') <= d;
      li.classList.toggle('is-on', show);
      li.hidden = li.getAttribute('data-mode') !== mode;
    });
    root.querySelector('.quote').setAttribute('data-state', (function () {
      var last = [].filter.call(items, function (li) { return li.getAttribute('data-mode') === mode && +li.getAttribute('data-day') <= d; }).pop();
      return last ? last.getAttribute('data-state') || '' : '';
    })());
  }
  if (slider) {
    slider.addEventListener('input', paint);
    modes.forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        modes.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        paint();
      });
    });
    var playing = false;
    playBtn.addEventListener('click', async function () {
      if (playing) return;
      playing = true; playBtn.setAttribute('aria-disabled', 'true');
      for (var d = 0; d <= +slider.max; d++) { slider.value = d; paint(); await wait(650); }
      playing = false; playBtn.removeAttribute('aria-disabled');
    });
    paint();
  }

  /* ---------- 3 · il report del lunedì ---------- */
  var go = root.querySelector('.report-go');
  var src = root.querySelectorAll('.src');
  var res = root.querySelector('.report__out');
  var making = false;
  if (go) go.addEventListener('click', async function () {
    if (making) return;
    making = true; go.setAttribute('aria-disabled', 'true');
    res.hidden = true;
    res.classList.remove('is-in');
    for (var i = 0; i < src.length; i++) { src[i].classList.add('is-read'); await wait(550); }
    res.hidden = false;
    await wait(30);
    res.classList.add('is-in');
    src.forEach(function (s) { s.classList.remove('is-read'); s.classList.add('is-done'); });
    go.textContent = 'Rifallo';
    making = false; go.removeAttribute('aria-disabled');
    var rr = res.getBoundingClientRect();
    if (rr.bottom > innerHeight) res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
})();
