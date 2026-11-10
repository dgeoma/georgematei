// Robot volanti in 3D vero (Three.js) nell'apertura della home, al posto delle due immagini piatte
// che per girarsi venivano schiacciate e specchiate. Ricalca la posa del dipinto
// (public/assets/funkylancers-robot-volante.webp): vola di tre quarti, testa avanti, corpo e gambe
// che seguono dietro in diagonale, sciarpa al vento, braccio teso con la corda e il blocco di marmo
// sotto, davanti. Quando cambia direzione gira tutto il corpo, passando di fronte.
// Si accende solo da RobotVolanti.astro (desktop, niente «Riduci movimento», WebGL2).
import {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry,
  TorusGeometry, BoxGeometry, PlaneGeometry, CircleGeometry, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial,
  PMREMGenerator, DirectionalLight, HemisphereLight, CatmullRomCurve3, Vector3, MathUtils, ACESFilmicToneMapping,
  SRGBColorSpace, DoubleSide, BufferAttribute, CanvasTexture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Texture disegnate al volo: venature del marmo e righe blu della sciarpa (niente file da scaricare).
function tela(w: number, h: number, disegna: (c: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  disegna(c.getContext('2d')!);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const venature = () => tela(256, 128, (g) => {
  g.fillStyle = '#ece3d1'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(140,122,95,.75)'; g.lineWidth = 2;
  let seme = 7; const rnd = () => ((seme = (seme * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9; i++) {
    g.beginPath(); let x = rnd() * 256, y = rnd() * 128; g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (rnd() - 0.3) * 60; y += (rnd() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
});
const righe = () => tela(128, 32, (g) => {
  g.fillStyle = '#c9973d'; g.fillRect(0, 0, 128, 32);
  g.fillStyle = '#1a2c58'; g.fillRect(0, 3, 128, 4); g.fillRect(0, 25, 128, 4);
});

const avorio = () => new MeshPhysicalMaterial({ color: 0xeee2cf, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.15 });
const oro = () => new MeshPhysicalMaterial({ color: 0xc8963c, metalness: 1, roughness: 0.28 });
const notte = () => new MeshPhysicalMaterial({ color: 0x0b1326, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 });
const blu = () => new MeshStandardMaterial({ color: 0x1a2c58, roughness: 0.45 });

function cilindroFra(a: Vector3, b: Vector3, r: number, mat: MeshStandardMaterial | MeshPhysicalMaterial) {
  const m = new Mesh(new CylinderGeometry(r, r, a.distanceTo(b), 8), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
function capsulaFra(a: Vector3, b: Vector3, r: number, mat: MeshPhysicalMaterial | MeshStandardMaterial) {
  const l = Math.max(a.distanceTo(b) - 2 * r, 0.01);
  const m = new Mesh(new CapsuleGeometry(r, l, 8, 16), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/** Lembo di sciarpa: nastro d'oro che parte dal collo e va indietro (-x); ondeggia in sventola(). */
function lembo(lungo: number, largo: number) {
  const g = new PlaneGeometry(lungo, largo, 24, 1);
  g.translate(-lungo / 2, 0, 0);
  const base = Float32Array.from(g.attributes.position.array as Float32Array);
  const m = new Mesh(g, new MeshPhysicalMaterial({ map: righe(), metalness: 0.7, roughness: 0.38, side: DoubleSide }));
  const sventola = (t: number, fase: number) => {
    const pos = g.attributes.position as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], k = -x / lungo; // 0 al collo, 1 in punta
      pos.setY(i, base[i * 3 + 1] + Math.sin(t * 7 + fase + k * 5) * 0.16 * k - k * k * 0.25);
      pos.setZ(i, Math.cos(t * 6 + fase + k * 4) * 0.12 * k);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  };
  return { m, sventola };
}

/**
 * Un robot. Unità: raggio della testa = 1. Il robot guarda verso +x (direzione di volo);
 * la testa sta all'origine, il corpo dietro e sotto, il blocco davanti e sotto.
 */
export function creaRobot() {
  const robot = new Group();     // posizione e dondolio
  const corpo = new Group();     // orientamento (si gira verso dove va)
  robot.add(corpo);
  const assetto = new Group();   // inclinazione in avanti, come nel dipinto
  assetto.rotation.z = -0.06;
  corpo.add(assetto);

  // Testa con rotore: inclinata come nel dipinto (il rotore pende in avanti)
  const capo = new Group();
  capo.rotation.z = -0.1;
  assetto.add(capo);
  // Testa: grande, un po' a uovo, avorio lucido
  const testa = new Mesh(new SphereGeometry(1, 56, 40), avorio());
  testa.scale.set(1.02, 0.9, 1.06);
  capo.add(testa);
  // Visiera blu notte sul davanti (+x), larga e bassa come nel dipinto
  const visiera = new Mesh(new SphereGeometry(1, 56, 40), notte());
  visiera.scale.set(0.44, 0.6, 0.88);
  visiera.position.set(0.68, -0.08, 0);
  capo.add(visiera);
  // Occhi a mezzaluna ∩ ∩, luce calda
  const luce = new MeshBasicMaterial({ color: 0xffe3a6 });
  for (const z of [-0.3, 0.3]) {
    const occhio = new Mesh(new TorusGeometry(0.15, 0.045, 10, 24, Math.PI), luce);
    occhio.rotation.y = Math.PI / 2;
    occhio.position.set(1.095, -0.04, z);
    capo.add(occhio);
  }
  // Orecchie: dischi d'oro con bordo, sui due lati
  for (const s of [-1, 1]) {
    const disco = new Mesh(new CylinderGeometry(0.34, 0.34, 0.16, 40), oro());
    disco.rotation.x = Math.PI / 2;
    disco.position.set(-0.08, 0.02, s * 1.04);
    capo.add(disco);
    const centro = new Mesh(new CylinderGeometry(0.2, 0.2, 0.2, 32), new MeshPhysicalMaterial({ color: 0xe9cf8e, metalness: 1, roughness: 0.2 }));
    centro.rotation.x = Math.PI / 2;
    centro.position.set(-0.08, 0.02, s * 1.07);
    capo.add(centro);
  }
  // Rotore: asta d'oro a segmenti, mozzo e pale; disco trasparente per l'effetto della rotazione veloce
  const asta = new Mesh(new CylinderGeometry(0.1, 0.12, 0.55, 20), oro());
  asta.position.y = 1.12;
  capo.add(asta);
  const ghiera = new Mesh(new TorusGeometry(0.12, 0.035, 8, 20), oro());
  ghiera.rotation.x = Math.PI / 2;
  ghiera.position.y = 1.05;
  capo.add(ghiera);
  const elica = new Group();
  elica.position.y = 1.42;
  capo.add(elica);
  elica.add(new Mesh(new CylinderGeometry(0.16, 0.16, 0.1, 24), oro()));
  for (const r of [0, Math.PI]) {
    const braccio = new Group(); braccio.rotation.y = r;
    const pala = new Mesh(new BoxGeometry(1.5, 0.035, 0.24), oro());
    pala.position.x = 0.8; pala.rotation.x = 0.22;
    braccio.add(pala);
    elica.add(braccio);
  }
  const alone = new Mesh(new CircleGeometry(1.6, 48), new MeshBasicMaterial({ color: 0xe8c77a, transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }));
  alone.rotation.x = -Math.PI / 2;
  alone.position.y = 1.44;
  capo.add(alone);

  // Corpo: piccolo, dietro e sotto la testa, in diagonale come chi vola in avanti
  const busto = new Group();
  busto.position.set(-1.0, -1.15, 0);
  busto.rotation.z = 0.9;            // quasi orizzontale: spalle verso la testa, bacino indietro
  assetto.add(busto);
  busto.add(new Mesh(new CapsuleGeometry(0.6, 0.45, 10, 24), avorio()));
  // Imbracatura blu: cintura e due bretelle incrociate
  const cintura = new Mesh(new TorusGeometry(0.61, 0.08, 10, 32), blu());
  cintura.rotation.x = Math.PI / 2; cintura.position.y = -0.12;
  busto.add(cintura);
  for (const s of [-1, 1]) {
    const bretella = new Mesh(new TorusGeometry(0.62, 0.065, 8, 32, Math.PI), blu());
    bretella.rotation.set(0, s * 0.5, Math.PI / 2);
    bretella.position.y = 0.12;
    busto.add(bretella);
  }
  // Collo con la sciarpa d'oro e due lembi al vento
  const collo = new Mesh(new TorusGeometry(0.42, 0.13, 12, 32), new MeshPhysicalMaterial({ map: righe(), metalness: 0.7, roughness: 0.38 }));
  collo.position.set(-0.5, -0.86, 0);
  collo.rotation.set(Math.PI / 2, 0, 0.9);
  assetto.add(collo);
  const lembi = [lembo(2.0, 0.42), lembo(1.6, 0.34)];
  lembi[0].m.position.set(-0.8, -0.78, 0.3);
  lembi[0].m.rotation.set(0.5, 0, 0.12);
  lembi[1].m.position.set(-0.85, -0.92, -0.25);
  lembi[1].m.rotation.set(-0.4, 0, -0.05);
  lembi.forEach((l) => assetto.add(l.m));

  // Gambe: tirate indietro, piedi blu
  const anca = new Vector3(-1.45, -1.4, 0);
  for (const [z, ginocchio, piede] of [
    [0.26, new Vector3(-1.85, -1.6, 0.3), new Vector3(-2.2, -1.32, 0.3)],
    [-0.26, new Vector3(-1.75, -1.82, -0.28), new Vector3(-2.15, -1.8, -0.28)],
  ] as [number, Vector3, Vector3][]) {
    const a = anca.clone(); a.z = z;
    assetto.add(capsulaFra(a, ginocchio, 0.19, avorio()));
    assetto.add(capsulaFra(ginocchio, piede, 0.17, avorio()));
    const scarpa = new Mesh(new SphereGeometry(0.21, 20, 14), blu());
    scarpa.scale.set(1.3, 0.85, 0.9);
    scarpa.position.copy(piede);
    assetto.add(scarpa);
  }
  // Braccia: una tesa in avanti e in basso che regge la corda, l'altra indietro
  const spalla = new Vector3(-0.7, -0.98, 0.5);
  const mano = new Vector3(-0.15, -1.35, 0.72);
  assetto.add(capsulaFra(spalla, mano, 0.16, avorio()));
  const pugno = new Mesh(new SphereGeometry(0.22, 20, 14), blu());
  pugno.position.copy(mano);
  assetto.add(pugno);
  const spalla2 = new Vector3(-0.85, -0.95, -0.5);
  assetto.add(capsulaFra(spalla2, new Vector3(-1.45, -1.2, -0.62), 0.15, avorio()));

  // Blocco di marmo appeso, davanti e sotto, con quattro corde che salgono alla mano
  const marmo = new MeshPhysicalMaterial({ map: venature(), roughness: 0.6, clearcoat: 0.15 });
  const blocco = new Mesh(new RoundedBoxGeometry(2.3, 1.0, 1.2, 4, 0.1), marmo);
  blocco.position.set(0.5, -3.05, 0.2);
  blocco.rotation.y = 0.15;
  assetto.add(blocco);
  const fune = new MeshStandardMaterial({ color: 0x9b7638, roughness: 0.85 });
  const nodo = mano.clone().add(new Vector3(0, -0.12, 0));
  for (const [dx, dz] of [[-1.05, 0.55], [1.05, 0.55], [-1.05, -0.55], [1.05, -0.55]]) {
    const angolo = new Vector3(dx, 0.5, dz).applyAxisAngle(new Vector3(0, 1, 0), 0.15).add(blocco.position);
    assetto.add(cilindroFra(nodo, angolo, 0.028, fune));
  }
  // fascia di corda attorno al blocco
  const fascia = new Mesh(new BoxGeometry(0.07, 1.02, 1.22), fune);
  fascia.position.copy(blocco.position); fascia.rotation.y = 0.15;
  assetto.add(fascia);

  const sventola = (t: number, fase: number) => lembi.forEach((l, i) => l.sventola(t, fase + i * 1.7));
  return { robot, corpo, elica, sventola };
}

// Gli stessi punti delle rotte CSS (percentuali della zona di cielo). Qui la curva è ammorbidita e la velocità
// costante, quindi i robot passano dagli stessi punti ma non negli stessi istanti delle animazioni CSS.
const ROTTE = [
  [[6, 15], [30, 3], [84, 14], [74, 44], [28, 58], [4, 36]],
  [[86, 58], [44, 9], [6, 8], [38, 50]],
];
const DURATE = [44, 58];
const RITARDI = [0, 21];
// Orientamento (rotazione attorno all'asse verticale): -0,6 = verso destra di tre quarti come nel dipinto, -π+0,6 = verso sinistra.
// Fra i due il robot passa di fronte (-π/2): si gira tutto il corpo, non solo la testa.
const DESTRA = -0.6, SINISTRA = -Math.PI + 0.6;

export function avvia(canvas: HTMLCanvasElement, cielo: HTMLElement, hero: Element | null, pausa: Element | null) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  pmrem.dispose();
  scene.add(new HemisphereLight(0xfff4dd, 0x6b7a99, 0.6));
  const sole = new DirectionalLight(0xffe7b8, 1.6);
  sole.position.set(-3, 5, 6);
  scene.add(sole);

  // Camera ortografica in pixel: x verso destra, y verso il basso come nel CSS.
  const camera = new OrthographicCamera(0, 1, 0, -1, -100, 100);
  camera.position.z = 50;

  const robots = ROTTE.map((rotta, i) => {
    const r = creaRobot();
    scene.add(r.robot);
    const curva = new CatmullRomCurve3(rotta.map(([x, y]) => new Vector3(x / 100, y / 100, 0)), true, 'centripetal');
    return { ...r, curva, durata: DURATE[i], ritardo: RITARDI[i], yaw: DESTRA, verso: DESTRA, fase: Math.random() * 6 };
  });

  let W = 1, H = 1;
  const misura = () => {
    W = cielo.clientWidth; H = cielo.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H;
    camera.updateProjectionMatrix();
    if (pronto) disegna(0);   // setSize svuota il canvas: ridisegna anche in pausa
  };
  let pronto = false;
  misura();
  addEventListener('resize', misura, { passive: true });

  // Stati che fermano il disegno: fuori schermo, pausa dei robot, scheda nascosta, CSS che li nasconde.
  let visibile = true, fermo = pausa?.getAttribute('aria-pressed') === 'true';
  const mq = [matchMedia('(min-width: 981px)'), matchMedia('(prefers-reduced-motion: reduce)')];
  let ammessa = mq[0].matches && !mq[1].matches;
  mq.forEach((m) => m.addEventListener('change', () => { ammessa = mq[0].matches && !mq[1].matches; if (ammessa) { misura(); loop(); } }));
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visibile = e.isIntersecting; if (visibile) loop(); }).observe(hero);
  }
  pausa?.addEventListener('click', () => { fermo = pausa.getAttribute('aria-pressed') === 'true'; if (!fermo) loop(); });

  const p = new Vector3(), q = new Vector3();
  let tempo = 0, ultimo = performance.now(), attivo = false;
  const disegna = (dt: number) => {
    tempo += dt;
    for (const r of robots) {
      // Dimensione come nel CSS: clamp(62px, 6.4vw, 104px) di larghezza per il robot grande, ~60% il piccolo.
      const largo = MathUtils.clamp(innerWidth * 0.064, 62, 104) * (r === robots[1] ? 0.58 : 1);
      const scala = largo / 3.64;  // nel dipinto la larghezza dell'immagine vale circa 3,6 raggi della testa
      const u = (((tempo + r.ritardo) / r.durata) % 1 + 1) % 1;
      r.curva.getPointAt(u, p);
      r.curva.getPointAt((u + 0.004) % 1, q);
      const dx = (q.x - p.x) * W;
      // la rotta CSS muoveva l'angolo in alto a sinistra dell'immagine: la testa stava a circa 0,45 larghezze in basso a destra
      r.robot.position.set(p.x * W + largo * 0.56, -(p.y * H + largo * 0.46) - Math.sin(tempo * 2.4 + r.fase) * largo * 0.05, 0);
      r.robot.scale.setScalar(scala);
      // Si gira davvero: di tre quarti verso la direzione di volo, passando dal fronte.
      // Verso dove va: destra o sinistra di tre quarti. Sotto una soglia di velocità orizzontale tiene l'ultimo verso.
      if (Math.abs(dx) > 0.15) r.verso = dx > 0 ? DESTRA : SINISTRA;
      r.yaw = MathUtils.damp(r.yaw, r.verso, 2.4, dt);
      const dondolio = Math.sin(tempo * 2.4 + r.fase);
      r.corpo.rotation.set(0, r.yaw, 0);
      r.robot.rotation.z = dondolio * 0.045;
      r.elica.rotation.y += dt * 30;
      r.sventola(tempo, r.fase);
    }
    renderer.render(scene, camera);
  };
  const frame = (ora: number) => {
    const dt = Math.min((ora - ultimo) / 1000, 0.05); ultimo = ora;
    disegna(dt);
    if (visibile && ammessa && !fermo && !document.hidden) requestAnimationFrame(frame); else attivo = false;
  };
  const loop = () => { if (attivo || fermo || !ammessa) return; attivo = true; ultimo = performance.now(); requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  pronto = true;
  disegna(0); // primo fotogramma subito, anche se in pausa
  // Se la scheda grafica perde il contesto, tornano le immagini di sempre.
  canvas.addEventListener('webglcontextlost', () => { hero?.classList.remove('robot-3d'); fermo = true; });
  hero?.classList.add('robot-3d');
  loop();
}

