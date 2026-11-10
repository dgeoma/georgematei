/* georgematei.com · tema «Tempio di Apollo»: robot in volo e portatori */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Robot in volo: si possono fermare (WCAG 2.2.2); fuori schermo non consumano */
  var hero = document.querySelector('.hero'), pausa = document.querySelector('.volo__pausa');
  if (pausa) pausa.addEventListener('click', function () {
    var on = root.classList.toggle('robot-fermi');
    pausa.setAttribute('aria-pressed', on ? 'true' : 'false');
    pausa.setAttribute('aria-label', on ? 'Fai ripartire i robot in volo' : 'Ferma i robot in volo');
    pausa.innerHTML = on ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  });
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { hero.classList.toggle('is-fuori', !e[0].isIntersecting); }).observe(hero);
  }

  var portatori = document.querySelector('.robot-portatori');
  var scena = document.querySelector('.loghi__scena');
  if (reduce || !('IntersectionObserver' in window)) return;

  function portatoriAggiorna() {
    var r = scena.getBoundingClientRect(), k = (innerHeight - r.top) / (innerHeight + r.height);
    k = Math.max(0, Math.min(1, k));
    portatori.style.setProperty('--x', ((r.width - portatori.offsetWidth) * (0.04 + k * 0.92)).toFixed(1) + 'px');
  }

  var inVista = { p: false }, atteso = false;
  function aggiorna() {
    atteso = false;
    if (inVista.p) portatoriAggiorna();
  }
  function chiedi() { if (!atteso) { atteso = true; requestAnimationFrame(aggiorna); } }
  /* i portatori si muovono solo mentre scorri: si fermano da soli */
  var fermo;
  addEventListener('scroll', function () {
    root.classList.add('is-scorre');
    clearTimeout(fermo);
    fermo = setTimeout(function () { root.classList.remove('is-scorre'); }, 220);
  }, { passive: true });
  addEventListener('scroll', chiedi, { passive: true });
  addEventListener('resize', chiedi, { passive: true });

  var oss = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (v.target === scena) { inVista.p = v.isIntersecting; if (portatori) portatori.classList.toggle('is-fermo', !v.isIntersecting); }
    });
    chiedi();
  }, { rootMargin: '10% 0px 10% 0px' });
  if (scena && portatori) oss.observe(scena);
})();
