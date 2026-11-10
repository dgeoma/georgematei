/* georgematei.com · chat di Hermes (widget HighLevel) in italiano.
   HighLevel non ha l'italiano fra le lingue del widget: i testi scritti da noi sono già in italiano,
   ma alcune scritte fisse restano in inglese. Qui si traducono dentro lo shadow DOM del widget
   (è aperto), osservando i cambiamenti. Se HighLevel cambia struttura, il peggio che succede è
   che quelle scritte tornano in inglese: la chat continua a funzionare. */
(function () {
  'use strict';
  var TESTI = {
    'Type a message': 'Scrivi un messaggio',
    'CLICK HERE': 'CLICCA QUI',
    'Click here': 'Clicca qui',
    'Feedback': 'Valutazione',
    'Name': 'Nome',
    'Name *': 'Nome *',
    'E-mail *': 'Email *',
    'Email *': 'Email *',
    'Phone *': 'Telefono *',
    'Send': 'Invia',
    'Submit': 'Invia',
    'Today': 'Oggi',
    'Yesterday': 'Ieri',
    'Powered by': 'Offerto da',
    'Thank you!': 'Grazie!',
    'Please enter a valid email': 'Inserisci un indirizzo email valido',
    'This field is required': 'Campo obbligatorio',
    'Start new chat': 'Nuova chat',
    'New chat': 'Nuova chat'
  };
  var MESI = { Jan: 'gen', Feb: 'feb', Mar: 'mar', Apr: 'apr', May: 'mag', Jun: 'giu', Jul: 'lug', Aug: 'ago', Sep: 'set', Oct: 'ott', Nov: 'nov', Dec: 'dic' };
  // «Nov 9, 02:16 am» → «9 nov, 02:16»
  var DATA = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{1,2}):(\d{2}) ?(am|pm)$/i;
  function ora(h, m, ap) {
    h = +h; ap = ap.toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return (h < 10 ? '0' : '') + h + ':' + m;
  }
  function traduci(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) {
      var t = n.nodeValue, s = t.trim();
      if (!s) continue;
      if (TESTI[s]) { n.nodeValue = t.replace(s, TESTI[s]); continue; }
      var d = s.match(DATA);
      if (d) n.nodeValue = t.replace(s, d[2] + ' ' + MESI[d[1]] + ', ' + ora(d[3], d[4], d[5]));
    }
    root.querySelectorAll('[placeholder]').forEach(function (e) {
      var p = e.getAttribute('placeholder');
      if (TESTI[p]) e.setAttribute('placeholder', TESTI[p]);
    });
    root.querySelectorAll('*').forEach(function (e) { if (e.shadowRoot) guarda(e.shadowRoot); });
  }
  var visti = typeof WeakSet === 'function' ? new WeakSet() : null;
  function guarda(root) {
    if (visti) { if (visti.has(root)) return; visti.add(root); }
    traduci(root);
    var t = null;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () { traduci(root); }, 60);
    }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
  }
  // il widget compare dopo il caricamento (e, con «carica all'interazione», solo dopo il primo gesto)
  function cerca() {
    var w = document.querySelector('chat-widget');
    if (w && w.shadowRoot) { guarda(w.shadowRoot); return true; }
    return false;
  }
  if (!cerca()) {
    var o = new MutationObserver(function () { if (cerca()) o.disconnect(); });
    o.observe(document.documentElement, { childList: true, subtree: true });
    // il nodo può esserci già ma con lo shadow DOM aperto un attimo dopo
    var giri = 0, iv = setInterval(function () { if (cerca() || ++giri > 20) { clearInterval(iv); if (giri <= 20) o.disconnect(); } }, 500);
  }
})();
