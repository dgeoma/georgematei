// Calendario disegnato dal sito: orari liberi letti da HighLevel (window.__slots, avviato nel <head>),
// prenotazione tramite la funzione Vercel georgematei-api. Se qualcosa non va, torna il widget HighLevel.
(function () {
  var API = 'https://georgematei-api.vercel.app/api/prenota';
  var WIDGET = 'https://api.leadconnectorhq.com/widget/booking/cPICakRP00QYGUi5Wyoi';
  var S = window.__slots, root = document.getElementById('bk'), body = document.getElementById('bk-body');
  var status = document.getElementById('bk-status');
  var days = {}, months = [], mi = 0, selDay = null, selSlot = null, busy = false;
  var SLOT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  function fallback() {
    root.classList.add('bk--frame');
    root.innerHTML = '<iframe src="' + WIDGET + '" title="Calendario prenotazioni di George Matei" id="cPICakRP00QYGUi5Wyoi_calendario" scrolling="no"></iframe>';
    var sc = document.createElement('script'); sc.src = 'https://link.msgsndr.com/js/form_embed.js'; document.body.appendChild(sc);
  }
  if (!S || !S.p || !window.Intl) return fallback();
  var DOW = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  var fmtDay = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: S.tz });
  var fmtTime = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: S.tz });
  var fmtMonth = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function addData(list) {
    list.forEach(function (d) {
      Object.keys(d || {}).forEach(function (k) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !d[k] || !Array.isArray(d[k].slots)) return;
        var ok = d[k].slots.filter(function (x) { return typeof x === 'string' && SLOT_RE.test(x) && Date.parse(x) > Date.now(); });
        if (!ok.length) return;
        var all = (days[k] || []).concat(ok).filter(function (x, i, a) { return a.indexOf(x) === i; });
        all.sort(function (a, b) { return Date.parse(a) - Date.parse(b); });
        days[k] = all;
      });
    });
    var keys = Object.keys(days).sort();
    months = [];
    keys.forEach(function (k) { var m = k.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
    if (mi > months.length - 1) mi = Math.max(0, months.length - 1);
  }

  function renderCalendar(focus) {
    if (!months.length) { body.className = 'bk__load'; body.innerHTML = '<p class="bk__empty">Al momento non ci sono orari liberi nelle prossime settimane. Scrivimi a <a href="mailto:d.georgematei@gmail.com">d.georgematei@gmail.com</a>.</p>'; return; }
    if (!selDay) selDay = Object.keys(days).sort()[0];
    var m = months[mi], y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1;
    var first = new Date(Date.UTC(y, mo, 1)), n = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    var lead = (first.getUTCDay() + 6) % 7;
    var g = '<div class="bk__month"><button type="button" class="bk__nav" data-m="-1" aria-label="Mese precedente"' + (mi === 0 ? ' disabled' : '') + '>‹</button><b>' + fmtMonth.format(first) + '</b><button type="button" class="bk__nav" data-m="1" aria-label="Mese successivo"' + (mi >= months.length - 1 ? ' disabled' : '') + '>›</button></div><div class="bk__days">';
    DOW.forEach(function (d) { g += '<div class="bk__dow">' + d + '</div>'; });
    for (var i = 0; i < lead; i++) g += '<span></span>';
    for (var d = 1; d <= n; d++) {
      var k = m + '-' + (d < 10 ? '0' : '') + d, on = !!days[k];
      g += on ? '<button type="button" class="bk__day bk__day--on' + (k === selDay ? ' bk__day--sel' : '') + '" data-d="' + k + '" aria-pressed="' + (k === selDay) + '" aria-label="' + fmtDay.format(new Date(days[k][0])) + '">' + d + '</button>' : '<span class="bk__day">' + d + '</span>';
    }
    g += '</div>';
    var side = '';
    if (selDay && days[selDay]) {
      side = '<h3>' + fmtDay.format(new Date(days[selDay][0])) + '</h3><p class="bk__tz">Orari nel tuo fuso: ' + esc(S.tz.replace('_', ' ')) + '</p><div class="bk__slots">';
      days[selDay].forEach(function (s) { side += '<button type="button" class="bk__slot" data-s="' + esc(s) + '" aria-label="Ore ' + fmtTime.format(new Date(s)) + '">' + fmtTime.format(new Date(s)) + '</button>'; });
      side += '</div>';
    }
    body.className = 'bk__grid';
    body.innerHTML = '<div>' + g + '</div><div class="bk__side" id="bk-side">' + side + '</div>';
    if (focus) { var f = body.querySelector(focus); if (f) f.focus({ preventScroll: true }); }
  }

  function renderForm() {
    var when = fmtDay.format(new Date(selSlot)) + ', ore ' + fmtTime.format(new Date(selSlot));
    body.className = 'bk__form';
    body.innerHTML =
      '<div class="bk__chosen"><span>' + when + '</span><button type="button" data-back>Cambia</button></div>' +
      '<form id="bk-form" novalidate>' +
      '<div class="bk__row"><label>Nome<input name="nome" autocomplete="given-name" required></label><label>Cognome<input name="cognome" autocomplete="family-name" required></label></div>' +
      '<div class="bk__row"><label>Email<input name="email" type="email" autocomplete="email" inputmode="email" required></label><label>Telefono<input name="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder="+39 333 123 4567" required></label></div>' +
      '<p class="bk__small" style="margin:-6px 0 14px">Telefono con il prefisso del paese, per esempio +39 o +971.</p>' +
      '<label>Di cosa vuoi parlare? <span style="font-weight:400;color:var(--muted)">(facoltativo)</span><textarea name="note" maxlength="1500"></textarea></label>' +
      '<div class="bk__trap" aria-hidden="true"><input name="hp_k7" tabindex="-1" autocomplete="off"></div>' +
      '<p class="bk__err" id="bk-err" role="alert"></p>' +
      '<button class="btn" type="submit">Conferma la chiamata</button>' +
      '<p class="bk__small">Ti arriva la conferma via email con il link Zoom. <a href="/privacy/">Come tratto i tuoi dati</a>.</p>' +
      '</form>';
    var f = document.getElementById('bk-form');
    if (matchMedia('(min-width: 761px)').matches) f.nome.focus();
    root.scrollIntoView({ block: 'start', behavior: 'smooth' });
    f.addEventListener('submit', submit);
  }

  function phone(v) {
    v = v.replace(/[^\d+]/g, '');
    if (v.indexOf('00') === 0) v = '+' + v.slice(2);
    if (v && v[0] !== '+' && /^3\d{8,9}$/.test(v)) v = '+39' + v; // solo cellulari italiani
    return v;
  }

  function lock(on) {
    busy = on;
    Array.prototype.forEach.call(body.querySelectorAll('button, input, textarea'), function (x) { x.disabled = on; });
  }

  function submit(e) {
    e.preventDefault();
    if (busy) return;
    var f = e.target, err = document.getElementById('bk-err'), btn = f.querySelector('button[type=submit]');
    var slot = selSlot;
    var data = { nome: f.nome.value.trim(), cognome: f.cognome.value.trim(), email: f.email.value.trim(), telefono: phone(f.telefono.value), note: f.note.value.trim(), hp_k7: f.hp_k7.value, start: slot, tz: S.tz };
    if (!data.nome || !data.cognome) { err.textContent = 'Scrivi nome e cognome.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) { err.textContent = "Controlla l'email."; return; }
    if (!/^\+[1-9]\d{6,14}$/.test(data.telefono)) { err.textContent = 'Scrivi il telefono con il prefisso del paese, per esempio +39 o +971.'; return; }
    err.textContent = ''; lock(true); btn.textContent = 'Prenoto…'; status.textContent = 'Prenotazione in corso';
    var ctrl = window.AbortController ? new AbortController() : null, to = ctrl && setTimeout(function () { ctrl.abort(); }, 25000);
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.text().then(function (t) { var j = {}; try { j = JSON.parse(t); } catch (x) {} return { s: r.status, j: j }; }); })
      .then(function (r) {
        clearTimeout(to);
        if (r.s === 200 && r.j.ok) {
          var when = fmtDay.format(new Date(slot)) + ' alle ' + fmtTime.format(new Date(slot));
          body.className = 'bk__done';
          body.innerHTML = '<b tabindex="-1">Fatto, ci vediamo ' + esc(when) + '.</b><p>Ti ho mandato la conferma a ' + esc(data.email) + ' con il link Zoom. Se non la trovi, guarda nello spam.</p><p>Per spostare o annullare usa il link nella mail, oppure scrivimi.</p>';
          body.querySelector('b').focus();
          status.textContent = 'Prenotazione confermata';
          return;
        }
        if (r.s === 409) {
          var k = slot.slice(0, 10);
          if (days[k]) { days[k] = days[k].filter(function (x) { return x !== slot; }); if (!days[k].length) delete days[k]; }
          addData([]);
          if (!days[selDay]) selDay = null;
          selSlot = null; busy = false;
          renderCalendar('.bk__slot, .bk__day--on');
          var side = document.getElementById('bk-side');
          if (side) side.insertAdjacentHTML('afterbegin', '<p class="bk__err" role="alert">' + esc(r.j.error || "Quell'orario è stato appena preso. Scegline un altro.") + '</p>');
          return;
        }
        throw new Error(r.j.error || '');
      })
      .catch(function (x) {
        clearTimeout(to);
        lock(false); btn.textContent = 'Conferma la chiamata'; status.textContent = '';
        var msg = x && x.name === 'AbortError' ? 'Il server non ha risposto in tempo. Controlla la tua email prima di riprovare: la prenotazione potrebbe essere già arrivata.'
          : (x && x.message && x.message.length < 160 && !/fetch|network|load|json|token/i.test(x.message) ? x.message : 'Prenotazione non riuscita.');
        err.innerHTML = esc(msg) + ' Se il problema resta, <a href="' + WIDGET + '" target="_blank" rel="noopener">prenota da qui</a> o scrivimi a <a href="mailto:d.georgematei@gmail.com">d.georgematei@gmail.com</a>.';
      });
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || busy) return;
    if (t.dataset.m) { mi = Math.max(0, Math.min(months.length - 1, mi + +t.dataset.m)); var fm = Object.keys(days).sort().filter(function (k) { return k.indexOf(months[mi]) === 0; })[0]; if (fm) selDay = fm; renderCalendar('.bk__nav[data-m="' + t.dataset.m + '"]:not(:disabled), .bk__day--sel'); }
    else if (t.dataset.d) { selDay = t.dataset.d; renderCalendar('.bk__slot'); if (!matchMedia('(min-width: 761px)').matches) document.getElementById('bk-side').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    else if (t.dataset.s) { selSlot = t.dataset.s; renderForm(); }
    else if (t.hasAttribute('data-back')) { var back = selSlot; selSlot = null; renderCalendar('.bk__slot[data-s="' + back + '"], .bk__day--sel'); }
  });

  var timer = setTimeout(fallback, 8000), done = false;
  S.p.then(function (list) { if (done) return; clearTimeout(timer); done = true; addData(list); renderCalendar(); })
    .catch(function () { if (done) return; clearTimeout(timer); done = true; fallback(); });
})();
