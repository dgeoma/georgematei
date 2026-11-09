/* georgematei.com · questionario «Da dove partiamo» (09/11/2026)
   Al posto del calendario aperto. Prima chi hai davanti (freelance, imprenditore, dipendente, PA, studente),
   poi domande adattate a quel profilo, poi cosa gli interessa.
   Esito: calendario della call conoscitiva SOLO se l'esigenza si risolve con consulenza, formazione,
   automazioni o software, c'è disponibilità a investire e non si sta solo esplorando.
   Altrimenti: Catalogo Utilizzi AI in una nuova finestra, con i filtri già scelti.
   Ispirato alla selezione Funkylancers di Iacopo Pelagatti (sfida principale, disponibilità a investire). */
(function () {
  'use strict';
  var root = document.getElementById('quiz');
  if (!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CAL = 'https://api.leadconnectorhq.com/widget/booking/zxAZSoKOYjuvrf698mJJ';

  var PROFILI = [
    ['freelance', 'Sono freelance o consulente', 'Lavoro in proprio, anche con aziende'],
    ['imprenditore', 'Ho un\'azienda', 'Sono titolare o socio'],
    ['dipendente', 'Lavoro in un\'azienda', 'Dipendente, responsabile o manager'],
    ['pa', 'Lavoro nella pubblica amministrazione', 'Comune, ente, scuola, sanità…'],
    ['studente', 'Sono studente', 'Università, master, corso']
  ];

  /* Domande di approfondimento, diverse per profilo */
  var RAMI = {
    freelance: [
      { id: 'servizi', t: 'Che servizi vendi?', o: [['marketing', 'Marketing e comunicazione'], ['consulenza', 'Consulenza o coaching'], ['creativi', 'Video, grafica o copy'], ['tecnici', 'Sviluppo, IT o dati'], ['altro', 'Altro']] },
      { id: 'fatturato', t: 'Quanto fatturi al mese, in media?', o: [['<2k', 'Meno di 2.000 €'], ['2-5k', '2.000 – 5.000 €'], ['5-10k', '5.000 – 10.000 €'], ['>10k', 'Più di 10.000 €'], ['nd', 'Preferisco non dirlo']] },
      { id: 'clienti', t: 'Con chi lavori di più?', o: [['strutturate', 'Aziende strutturate, con reparti e team'], ['piccole', 'Piccole attività e professionisti'], ['privati', 'Privati']] }
    ],
    imprenditore: [
      { id: 'team', t: 'Quante persone lavorano con te?', o: [['1', 'Solo io'], ['2-10', 'Da 2 a 10'], ['11-50', 'Da 11 a 50'], ['50+', 'Più di 50']] },
      { id: 'settore', t: 'In che settore?', o: [['servizi', 'Servizi'], ['commercio', 'Commercio'], ['produzione', 'Produzione'], ['salute', 'Salute e benessere'], ['formazione', 'Formazione'], ['immobiliare', 'Immobiliare'], ['altro', 'Altro']] }
    ],
    dipendente: [
      { id: 'ruolo', t: 'Che ruolo hai?', o: [['direzione', 'Dirigo l\'azienda o un reparto'], ['team', 'Guido un team'], ['membro', 'Faccio parte di un team']] },
      { id: 'decide', t: 'Chi decide su un investimento così?', o: [['io', 'Io'], ['propongo', 'Lo propongo io a chi decide'], ['mio', 'Per ora è un interesse mio']] }
    ],
    pa: [
      { id: 'ruolo', t: 'Che ruolo hai nell\'ente?', o: [['dirigente', 'Dirigente'], ['funzionario', 'Funzionario o responsabile di ufficio'], ['altro', 'Altro']] },
      { id: 'budget', t: 'C\'è già un budget o un capitolato per AI o formazione?', o: [['si', 'Sì'], ['valuta', 'Si sta valutando'], ['no', 'No, non ancora']] }
    ],
    studente: [
      { id: 'cerca', t: 'Cosa cerchi?', o: [['imparare', 'Imparare a usare l\'AI'], ['tesi', 'Un progetto o una tesi'], ['lavoro', 'Capire come lavorare in questo campo']] }
    ]
  };

  /* Cosa interessa. «per» dice a quali profili si propone; tipo = filtro del catalogo */
  var INTERESSI = [
    { id: 'consulenza', t: 'Una consulenza', s: 'Capire da dove partire e cosa conviene fare', tipo: ['consulenza'], per: ['freelance', 'imprenditore', 'dipendente', 'pa'] },
    { id: 'form-persona', t: 'Formazione per me', s: 'Imparare a usare l\'AI nel mio lavoro', tipo: ['formazione'], per: ['freelance', 'imprenditore', 'dipendente', 'pa', 'studente'] },
    { id: 'form-reparto', t: 'Formazione per un reparto', s: 'Un team o un ufficio che impara a usarla', tipo: ['formazione'], per: ['freelance', 'imprenditore', 'dipendente', 'pa'] },
    { id: 'form-azienda', t: 'Formazione per tutta l\'azienda', s: 'Tutte le persone, con un percorso unico', tipo: ['formazione'], per: ['freelance', 'imprenditore', 'dipendente', 'pa'] },
    { id: 'automazioni', t: 'Installare automazioni e agenti AI', s: 'Che rispondono, ricordano e preparano al posto vostro', tipo: ['automazione', 'agente-ai'], per: ['freelance', 'imprenditore', 'dipendente', 'pa'] },
    { id: 'software', t: 'Un software su misura', s: 'Costruito sul vostro modo di lavorare', tipo: ['app'], per: ['freelance', 'imprenditore', 'dipendente', 'pa'] },
    { id: 'nonso', t: 'Non lo so ancora', s: 'Voglio prima vedere cosa si può fare', tipo: [], per: ['freelance', 'imprenditore', 'dipendente', 'pa', 'studente'] }
  ];
  var INT = {}; INTERESSI.forEach(function (i) { INT[i.id] = i; });

  var A = {};       // risposte
  var storia = [];  // passi già fatti, per «Indietro»

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Per chi lavora con aziende o le guida, la formazione di reparto/azienda ha senso; per gli altri no */
  function interessiPer() {
    var p = A.profilo;
    return INTERESSI.filter(function (i) {
      if (i.per.indexOf(p) < 0) return false;
      if (i.id === 'form-reparto' || i.id === 'form-azienda') {
        if (p === 'imprenditore' && A.team === '1') return false;
        if (p === 'freelance' && A.clienti === 'privati') return false;
        if (p === 'dipendente' && i.id === 'form-azienda' && A.ruolo === 'membro') return false;
      }
      return true;
    });
  }
  function etichettaInteresse(i) {
    if (A.profilo === 'freelance' && (i.id === 'form-reparto' || i.id === 'form-azienda')) return { t: i.t + ' cliente', s: 'Da portare ai tuoi clienti, insieme a te' };
    if (A.profilo === 'freelance' && i.id === 'automazioni') return { t: i.t, s: 'Per il tuo lavoro o da portare ai tuoi clienti' };
    return { t: i.t, s: i.s };
  }

  /* ---------- i passi ---------- */
  function passi() {
    var l = ['profilo'];
    if (A.profilo) (RAMI[A.profilo] || []).forEach(function (q) { l.push('ramo:' + q.id); });
    l.push('interessi', 'sfida', 'investire', 'quando');
    if (A.interessi && A.interessi.length === 1 && A.interessi[0] === 'nonso') l = l.filter(function (x) { return x !== 'investire' && x !== 'quando'; });
    return l;
  }
  var passo = 'profilo';

  function barra() {
    var l = passi(), i = l.indexOf(passo), n = l.length;
    return '<div class="quiz__top"><div class="quiz__bar" role="progressbar" aria-label="Avanzamento" aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="' + (i + 1) + '"><i style="width:' + Math.round((i + 1) / n * 100) + '%"></i></div>' +
      '<span class="quiz__n">' + (i + 1) + ' di ' + n + '</span></div>';
  }
  function indietro() { return storia.length ? '<button type="button" class="quiz__back">← Indietro</button>' : ''; }

  function scelte(name, opts, multi, sel) {
    sel = sel || [];
    return '<div class="quiz__opts' + (multi ? ' quiz__opts--multi' : '') + '" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="quiz-q">' + opts.map(function (o) {
      var on = sel.indexOf(o[0]) >= 0;
      return '<button type="button" class="quiz__opt" data-v="' + esc(o[0]) + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '"><b>' + esc(o[1]) + '</b>' + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function disegna(focus) {
    var h = barra(), q;
    if (passo === 'profilo') {
      h += '<h3 id="quiz-q" tabindex="-1">Chi sei?</h3>' + scelte('profilo', PROFILI, false, [A.profilo]);
    } else if (passo.indexOf('ramo:') === 0) {
      var id = passo.slice(5);
      q = RAMI[A.profilo].filter(function (x) { return x.id === id; })[0];
      h += '<h3 id="quiz-q" tabindex="-1">' + esc(q.t) + '</h3>' + scelte(id, q.o, false, [A[id]]);
    } else if (passo === 'interessi') {
      var disp = interessiPer().map(function (i) { return i.id; });
      A.interessi = (A.interessi || []).filter(function (id) { return disp.indexOf(id) >= 0; });
      var ops = interessiPer().map(function (i) { var e = etichettaInteresse(i); return [i.id, e.t, e.s]; });
      h += '<h3 id="quiz-q" tabindex="-1">Cosa ti interessa di più?</h3><p class="quiz__hint">Puoi sceglierne più di uno.</p>' + scelte('interessi', ops, true, A.interessi) +
        '<button type="button" class="btn quiz__next"' + (A.interessi && A.interessi.length ? '' : ' disabled') + '>Avanti</button>';
    } else if (passo === 'sfida') {
      var ph = {
        freelance: 'Es.: passo metà settimana a rispondere ai messaggi e a fare preventivi, e non ho tempo per i clienti nuovi.',
        imprenditore: 'Es.: i contatti che arrivano la sera li richiamiamo dopo due giorni e intanto scelgono un altro.',
        dipendente: 'Es.: il mio reparto ricopia ogni settimana gli stessi dati in tre posti diversi.',
        pa: 'Es.: lo sportello riceve sempre le stesse domande e il personale non riesce a stare dietro alle pratiche.',
        studente: 'Es.: voglio imparare a usare l\'AI per la tesi e per il primo lavoro.'
      }[A.profilo];
      h += '<h3 id="quiz-q" tabindex="-1">Qual è la sfida principale che vuoi risolvere nei prossimi mesi?</h3>' +
        '<label class="sr-only" for="quiz-sfida">La tua sfida principale</label><textarea id="quiz-sfida" class="quiz__text" rows="4" maxlength="600" placeholder="' + esc(ph) + '">' + esc(A.sfida || '') + '</textarea>' +
        '<p class="quiz__hint">Due righe bastano. Più è concreta, più la chiamata ti è utile.</p>' +
        '<button type="button" class="btn quiz__next"' + ((A.sfida || '').trim().length >= 10 ? '' : ' disabled') + '>Avanti</button>';
    } else if (passo === 'investire') {
      h += '<h3 id="quiz-q" tabindex="-1">Sei disposto a investire per risolverla?</h3>' + scelte('investire', [['budget', 'Sì, ho già un budget'], ['conti', 'Sì, se i conti tornano', 'Prima voglio vedere quanto rende'], ['no', 'Non ora', 'Cerco prima qualcosa di gratuito']], false, [A.investire]);
    } else if (passo === 'quando') {
      h += '<h3 id="quiz-q" tabindex="-1">Quando vorresti partire?</h3>' + scelte('quando', [['subito', 'Entro un mese'], ['3mesi', 'Nei prossimi tre mesi'], ['esploro', 'Sto solo esplorando']], false, [A.quando]);
    }
    root.innerHTML = '<div class="quiz__step">' + h + '<div class="quiz__foot">' + indietro() + '</div></div>';
    if (focus) { var t = root.querySelector('#quiz-q'); if (t) t.focus({ preventScroll: true }); }
  }

  var attendo = false;
  function avanti() {
    attendo = false;
    if (passo === 'esito') return;
    var l = passi(), i = l.indexOf(passo);
    storia.push(passo);
    if (i + 1 >= l.length) { esito(); return; }
    passo = l[i + 1];
    disegna(true);
    porta();
  }
  function porta() {
    var r = root.getBoundingClientRect();
    if (r.top < 60 || r.top > innerHeight * 0.6) root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- esito ---------- */
  function catalogoURL() {
    var tipi = {};
    (A.interessi || []).forEach(function (id) { (INT[id].tipo || []).forEach(function (t) { tipi[t] = 1; }); });
    var p = new URLSearchParams();
    var k = Object.keys(tipi); if (k.length) p.set('tipo', k.join(','));
    if (A.profilo === 'freelance') p.set('per', 'freelance');
    else if (A.profilo === 'imprenditore' || A.profilo === 'dipendente') p.set('per', 'azienda');
    var s = p.toString();
    return '/catalogo-use-case-ai/' + (s ? '?' + s : '');
  }
  function riassunto() {
    var P = {}; PROFILI.forEach(function (x) { P[x[0]] = x[1]; });
    var r = [P[A.profilo]];
    (RAMI[A.profilo] || []).forEach(function (q) {
      var o = q.o.filter(function (x) { return x[0] === A[q.id]; })[0];
      if (o) r.push(q.t.replace(/\?$/, '') + ': ' + o[1]);
    });
    r.push('Interessi: ' + (A.interessi || []).map(function (id) { return etichettaInteresse(INT[id]).t; }).join(', '));
    return r;
  }
  function qualificato() {
    var utili = (A.interessi || []).filter(function (id) { return id !== 'nonso'; });
    if (!utili.length) return false;
    if (A.investire === 'no') return false;
    if (A.quando === 'esploro') return false;
    if (A.profilo === 'studente') return A.investire === 'budget';   // uno studente con budget per formarsi va bene
    if (A.profilo === 'dipendente' && A.decide === 'mio' && A.interessi.indexOf('form-persona') < 0) return false;
    return true;
  }

  function esito() {
    passo = 'esito';
    var cat = catalogoURL();
    var h;
    if (qualificato()) {
      var src = CAL;
      h = '<div class="quiz__esito quiz__esito--ok"><p class="quiz__badge">Posso aiutarti</p>' +
        '<h3 id="quiz-q" tabindex="-1">Bene: parliamone in videochiamata.</h3>' +
        '<p>Trenta minuti, gratis. Mi racconti la tua sfida e alla fine sai da dove partire. Scegli giorno e ora qui sotto.</p>' +
        '<ul class="quiz__sum">' + riassunto().map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<div class="cal-top__widget quiz__cal" id="calendario"><p class="cal-top__wait" aria-hidden="true">Carico le date libere…</p>' +
        '<iframe src="' + esc(src) + '" title="Calendario prenotazioni di George Matei" id="zxAZSoKOYjuvrf698mJJ_1793121711485" scrolling="no" allow="payment" style="width:100%;border:none;overflow:hidden;min-height:620px"></iframe></div>' +
        '<p class="quiz__hint">Nel modulo di prenotazione riscrivi in una riga la tua sfida: così arrivo preparato. Vuoi prima farti un\'idea? <a href="' + esc(cat) + '" target="_blank" rel="noopener">Guarda il catalogo con le soluzioni per te</a>. Non vedi il calendario? Scrivimi a <a href="mailto:d.georgematei@gmail.com">d.georgematei@gmail.com</a>.</p></div>';
    } else {
      var motivo = A.investire === 'no' ? 'Per ora la cosa più utile è partire dalle soluzioni che puoi valutare da solo.'
        : A.quando === 'esploro' || (A.interessi || []).indexOf('nonso') >= 0 ? 'Se stai ancora esplorando, la cosa più utile è vedere cosa si può fare, con esempi concreti.'
        : 'Per quello che mi hai raccontato, la cosa più utile è partire dagli esempi concreti.';
      h = '<div class="quiz__esito"><p class="quiz__badge quiz__badge--soft">Il passo giusto adesso</p>' +
        '<h3 id="quiz-q" tabindex="-1">Parti dal Catalogo Utilizzi AI.</h3>' +
        '<p>' + esc(motivo) + (cat.indexOf('?') > 0 ? ' Ho già scelto i filtri in base alle tue risposte: segnati le schede che vorresti nella tua attività.' : ' Trovi esempi concreti, divisi per tipo, ruolo e settore: segnati quelli che ti interessano.') + '</p>' +
        '<a class="btn" href="' + esc(cat) + '" target="_blank" rel="noopener">Apri il catalogo<span class="sr-only"> (si apre in una nuova finestra)</span></a>' +
        '<p class="quiz__hint">Quando hai scelto cosa ti serve, torna qui e rifai il questionario: se posso aiutarti, ti si apre il calendario.</p></div>';
    }
    root.innerHTML = h + '<div class="quiz__foot"><button type="button" class="quiz__back">← Cambia le risposte</button><button type="button" class="quiz__reset">Ricomincia</button></div>';
    var t = root.querySelector('#quiz-q'); if (t) t.focus({ preventScroll: true });
    porta();
    var f = root.querySelector('iframe');
    if (f) {
      var box = root.querySelector('.quiz__cal');
      f.addEventListener('load', function () { setTimeout(function () { box.classList.add('is-ready'); }, 2500); });
      setTimeout(function () { box.classList.add('is-ready'); }, 10000);
      if (!document.querySelector('script[src*="form_embed.js"]')) { var s = document.createElement('script'); s.src = 'https://link.msgsndr.com/js/form_embed.js'; s.async = true; document.body.appendChild(s); }
    }
  }

  /* ---------- eventi ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled || attendo) return;
    if (b.classList.contains('quiz__reset')) { A = {}; storia = []; passo = 'profilo'; disegna(true); return; }
    if (b.classList.contains('quiz__back')) { passo = storia.pop() || 'profilo'; disegna(true); return; }
    if (b.classList.contains('quiz__next')) {
      if (passo === 'sfida') A.sfida = root.querySelector('#quiz-sfida').value.trim();
      avanti(); return;
    }
    if (!b.classList.contains('quiz__opt')) return;
    var v = b.getAttribute('data-v');
    if (passo === 'interessi') {
      var l = A.interessi = A.interessi || [];
      var i = l.indexOf(v);
      if (i >= 0) l.splice(i, 1);
      else if (v === 'nonso') l.length = 0, l.push(v);
      else { var k = l.indexOf('nonso'); if (k >= 0) l.splice(k, 1); l.push(v); }
      root.querySelectorAll('.quiz__opt').forEach(function (o) { o.setAttribute('aria-checked', String(l.indexOf(o.getAttribute('data-v')) >= 0)); });
      root.querySelector('.quiz__next').disabled = !l.length;
      return;
    }
    var chiave = passo === 'profilo' ? 'profilo' : passo.indexOf('ramo:') === 0 ? passo.slice(5) : passo;
    if (chiave === 'profilo' && A.profilo !== v) { A = {}; }   // cambia profilo: le altre risposte non valgono più
    A[chiave] = v;
    root.querySelectorAll('.quiz__opt').forEach(function (o) { o.setAttribute('aria-checked', String(o === b)); });
    attendo = true;
    setTimeout(avanti, reduce ? 0 : 180);
  });
  root.addEventListener('input', function (e) {
    if (e.target.id === 'quiz-sfida') { A.sfida = e.target.value; root.querySelector('.quiz__next').disabled = e.target.value.trim().length < 10; }
  });

  disegna(false);
})();
