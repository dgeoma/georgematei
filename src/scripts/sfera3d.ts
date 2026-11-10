import { WebGLRenderer, Scene, PerspectiveCamera, Vector3, Euler, BufferGeometry, BufferAttribute, ShaderMaterial, Points } from 'three';
const THREE = { WebGLRenderer, Scene, PerspectiveCamera, Vector3, Euler, BufferGeometry, BufferAttribute, ShaderMaterial, Points };

// Sfera armillare d'oro: vedi src/components/SferaArmillare.astro per quando si accende.
export function avvia(canvas: HTMLCanvasElement) {
    const hero = document.querySelector('.hero');
    const pausa = document.querySelector('.volo__pausa');

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 7.2);

    // Anelli della sfera: equatore, due tropici, due coluri, eclittica inclinata, orizzonte.
    const R = 1.55;
    const anelli: { r: number; rot: [number, number, number]; y?: number; n: number }[] = [
      { r: R, rot: [Math.PI / 2, 0, 0], n: 260 },
      { r: R * 0.92, rot: [Math.PI / 2, 0, 0], y: R * 0.39, n: 200 },
      { r: R * 0.92, rot: [Math.PI / 2, 0, 0], y: -R * 0.39, n: 200 },
      { r: R, rot: [0, 0, 0], n: 260 },
      { r: R, rot: [0, Math.PI / 2, 0], n: 260 },
      { r: R * 1.04, rot: [Math.PI / 2 - 0.41, 0, 0], n: 300 },
      { r: R * 1.22, rot: [Math.PI / 2, 0, 0.12], n: 320 },
    ];
    const target: number[] = [];
    const v = new THREE.Vector3();
    for (const a of anelli) {
      const e = new THREE.Euler(...a.rot);
      for (let i = 0; i < a.n; i++) {
        const t = (i / a.n) * Math.PI * 2;
        v.set(Math.cos(t) * a.r, Math.sin(t) * a.r, 0).applyEuler(e);
        if (a.y) v.y += a.y;
        target.push(v.x, v.y, v.z);
      }
    }
    // Asse polare e sole al centro.
    for (let i = 0; i < 90; i++) { const y = -R * 1.45 + (i / 89) * R * 2.9; target.push(0, y, 0); }
    for (let i = 0; i < 70; i++) { v.randomDirection().multiplyScalar(0.16 * Math.cbrt(Math.random())); target.push(v.x, v.y, v.z); }

    const n = target.length / 3;
    const start = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      v.randomDirection().multiplyScalar(2.2 + Math.random() * 3.2);
      start.set([v.x * 1.4, v.y, v.z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(target), 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    const ritardo = new Float32Array(n);
    for (let i = 0; i < n; i++) ritardo[i] = Math.random() * 0.35;
    geo.setAttribute('aRitardo', new THREE.BufferAttribute(ritardo, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uT: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        attribute vec3 aStart; attribute float aRitardo;
        uniform float uT; uniform float uPx;
        varying float vProf;
        void main() {
          float k = clamp((uT - aRitardo) / 0.65, 0.0, 1.0);
          k = 1.0 - pow(1.0 - k, 3.0);
          vec3 p = mix(aStart, position, k);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vProf = clamp((-mv.z - 5.0) / 4.0, 0.0, 1.0);
          gl_PointSize = uPx * mix(5.2, 2.6, vProf) * (7.2 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vProf;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.1, d);
          vec3 oro = mix(vec3(0.62, 0.45, 0.16), vec3(0.80, 0.62, 0.28), 1.0 - vProf);
          gl_FragColor = vec4(oro, a * mix(0.95, 0.35, vProf));
        }`,
    });
    const sfera = new THREE.Points(geo, mat);
    sfera.rotation.set(0.32, 0, -0.2);
    scene.add(sfera);

    const misura = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    misura();
    addEventListener('resize', misura, { passive: true });

    // Se il visitatore ha già fermato i robot prima che la sfera parta, resta ferma anche lei.
    let visibile = true, fermo = pausa?.getAttribute('aria-pressed') === 'true', t0 = performance.now(), ultimo = t0, giro = 0;
    // Il CSS la nasconde sotto i 981px o con «Riduci movimento» attivato dopo il caricamento: allora niente disegno.
    const mq = [matchMedia('(min-width: 981px)'), matchMedia('(prefers-reduced-motion: reduce)')];
    let ammessa = mq[0].matches && !mq[1].matches;
    mq.forEach((m) => m.addEventListener('change', () => { ammessa = mq[0].matches && !mq[1].matches; if (ammessa) { misura(); loop(); } }));
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visibile = e.isIntersecting; if (visibile) loop(); }).observe(hero);
    }
    pausa?.addEventListener('click', () => { fermo = pausa.getAttribute('aria-pressed') === 'true'; if (!fermo) loop(); });

    let attivo = false;
    const frame = (ora: number) => {
      const dt = Math.min((ora - ultimo) / 1000, 0.05); ultimo = ora;
      const t = (ora - t0) / 1000;
      mat.uniforms.uT.value = Math.min(t / 2.4, 1.2);
      giro += dt * 0.12;
      sfera.rotation.y = giro + scrollY * 0.0022;
      renderer.render(scene, camera);
      if (visibile && ammessa && !fermo && !document.hidden) requestAnimationFrame(frame); else attivo = false;
    };
    const loop = () => { if (attivo || fermo || !ammessa) return; attivo = true; ultimo = performance.now(); requestAnimationFrame(frame); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

    canvas.classList.add('is-pronta');
    // Se è stata fermata prima di partire, si disegna una volta la sfera già composta.
    if (fermo) { mat.uniforms.uT.value = 1.2; renderer.render(scene, camera); }
    loop();
  }
