/* georgematei.com · menu «Risorse»: apertura al clic/tocco (Safari e iPad non danno il focus ai pulsanti),
   stato per i lettori di schermo, Esc e clic fuori chiudono. Senza questo file il menu si apre comunque al passaggio del mouse. */
(function () {
  document.querySelectorAll('.nav__menu').forEach(function (m) {
    var b = m.querySelector('.nav__more');
    if (!b) return;
    b.setAttribute('aria-expanded', 'false');
    function metti(on) { if (on) m.classList.remove('is-chiuso'); m.classList.toggle('is-open', on); b.setAttribute('aria-expanded', String(on)); }
    b.addEventListener('click', function (e) { e.stopPropagation(); metti(!m.classList.contains('is-open')); if (!m.classList.contains('is-open')) b.blur(); });
    m.addEventListener('mouseleave', function () { if (m.classList.contains('is-open')) { metti(false); b.blur(); } });
    document.addEventListener('click', function (e) { if (!m.contains(e.target)) metti(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (m.classList.contains('is-open') || m.contains(document.activeElement))) { metti(false); b.focus(); m.classList.add('is-chiuso'); }
    });
    m.addEventListener('focusin', function () { m.classList.remove('is-chiuso'); });
    m.addEventListener('mouseenter', function () { m.classList.remove('is-chiuso'); });
  });
})();
