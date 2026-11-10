// Robot volanti in 3D vero (Three.js) nell'apertura della home, al posto delle due immagini piatte
// che per girarsi venivano schiacciate e specchiate. Stessi tratti del dipinto: testa avorio lucida,
// visiera blu notte con occhi sorridenti, orecchio e rotore d'oro, sciarpa, blocco di marmo appeso.
// Si accende solo da RobotVolanti.astro (desktop, niente «Riduci movimento», WebGL2).
import {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry,
  TorusGeometry, BoxGeometry, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, PMREMGenerator,
  DirectionalLight, HemisphereLight, CatmullRomCurve3, Vector3, MathUtils, ACESFilmicToneMapping, SRGBColorSpace,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const avorio = () => new MeshPhysicalMaterial({ color: 0xf4ede1, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
const oro = () => new MeshPhysicalMaterial({ color: 0xc9973a, metalness: 1, roughness: 0.3 });
const notte = () => new MeshPhysicalMaterial({ color: 0x0c1428, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
const blu = () => new MeshStandardMaterial({ color: 0x1b2d57, roughness: 0.5 });

function corda(a: Vector3, b: Vector3, mat: MeshStandardMaterial) {
  const l = a.distanceTo(b);
  const m = new Mesh(new CylinderGeometry(0.025, 0.025, l, 6), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/** Un robot alto circa 4 unità (dalla punta del rotore al fondo del blocco), centrato sulla testa. */
export function creaRobot() {
  const robot = new Group();     // posizione e dondolio
  const corpo = new Group();     // rotazione (si gira verso dove va)
  robot.add(corpo);

  // Testa
  const testa = new Mesh(new SphereGeometry(1, 48, 32), avorio());
  testa.scale.set(1.12, 0.96, 1);
  corpo.add(testa);
  const visiera = new Mesh(new SphereGeometry(1, 48, 32), notte());
  visiera.scale.set(0.8, 0.52, 0.42);
  visiera.position.set(0, -0.06, 0.66);
  corpo.add(visiera);
  // Occhi a mezzaluna (sorridono): archi luminosi sulla visiera
  const luce = new MeshBasicMaterial({ color: 0xffe9b8 });
  for (const x of [-0.3, 0.3]) {
    const occhio = new Mesh(new TorusGeometry(0.15, 0.04, 10, 24, Math.PI), luce);
    occhio.position.set(x, -0.02, 1.07);
    corpo.add(occhio);
  }
  // Orecchie d'oro
  for (const s of [-1, 1]) {
    const orecchio = new Mesh(new CylinderGeometry(0.22, 0.22, 0.12, 36), oro());
    orecchio.rotation.z = Math.PI / 2;
    orecchio.position.set(s * 1.08, 0.04, 0);
    corpo.add(orecchio);
    const anello = new Mesh(new TorusGeometry(0.22, 0.045, 10, 36), oro());
    anello.rotation.y = Math.PI / 2;
    anello.position.set(s * 1.14, 0.04, 0);
    corpo.add(anello);
  }
  // Rotore: asta, mozzo e due pale che girano
  const asta = new Mesh(new CylinderGeometry(0.07, 0.09, 0.62, 16), oro());
  asta.position.y = 1.18;
  corpo.add(asta);
  const mozzo = new Mesh(new CylinderGeometry(0.14, 0.14, 0.1, 20), oro());
  mozzo.position.y = 1.5;
  corpo.add(mozzo);
  const elica = new Group();
  elica.position.y = 1.53;
  for (const r of [0, Math.PI]) {
    const pala = new Mesh(new BoxGeometry(1.25, 0.03, 0.22), oro());

    pala.rotation.x = 0.18;
    const p = new Group(); p.rotation.y = r; p.add(pala); pala.position.x = 0.66;
    elica.add(p);
  }
  corpo.add(elica);

  // Corpo in volo, piegato in avanti, con cinghie blu e sciarpa d'oro
  const busto = new Group();
  busto.position.set(-0.15, -1.15, -0.2);
  busto.rotation.z = 0.35;
  corpo.add(busto);
  const torso = new Mesh(new CapsuleGeometry(0.42, 0.42, 8, 24), avorio());
  busto.add(torso);
  const cinghia = new Mesh(new TorusGeometry(0.44, 0.06, 10, 32), blu());
  cinghia.rotation.x = Math.PI / 2;
  cinghia.position.y = 0.05;
  busto.add(cinghia);
  const sciarpa = new Mesh(new TorusGeometry(0.42, 0.09, 12, 32), oro());
  sciarpa.rotation.x = Math.PI / 2 - 0.2;
  sciarpa.position.set(0, 0.55, 0);
  busto.add(sciarpa);
  // Due lembi di sciarpa al vento, dietro la schiena
  for (const [y, z, rz, l] of [[0.5, -0.15, 0.55, 0.7], [0.38, -0.05, 0.85, 0.55]]) {
    const lembo = new Mesh(new BoxGeometry(l, 0.025, 0.2), oro());
    lembo.geometry.translate(-l / 2, 0, 0);
    lembo.position.set(-0.3, y, z);
    lembo.rotation.set(0.3, 0.2, rz);
    busto.add(lembo);
  }
  // Gambe che penzolano
  for (const [x, z] of [[-0.22, 0.12], [0.2, -0.1]]) {
    const gamba = new Mesh(new CapsuleGeometry(0.15, 0.3, 6, 12), avorio());
    gamba.position.set(x - 0.15, -0.75, z);
    gamba.rotation.z = 0.5;
    busto.add(gamba);
  }
  // Braccio teso che regge la corda
  const braccio = new Mesh(new CapsuleGeometry(0.13, 0.55, 6, 12), avorio());
  braccio.position.set(0.62, -0.05, 0.25);
  braccio.rotation.z = 1.25;
  busto.add(braccio);
  const mano = new Mesh(new SphereGeometry(0.17, 20, 14), blu());
  mano.position.set(1.0, -0.2, 0.25);
  busto.add(mano);

  // Blocco di marmo appeso alla mano
  const marmo = new MeshPhysicalMaterial({ color: 0xe8decb, roughness: 0.6, clearcoat: 0.2 });
  const blocco = new Mesh(new RoundedBoxGeometry(1.15, 0.55, 0.7, 4, 0.07), marmo);
  blocco.position.set(0.85, -2.35, 0.15);
  blocco.rotation.y = 0.25;
  corpo.add(blocco);
  const fune = new MeshStandardMaterial({ color: 0xa8843f, roughness: 0.8 });
  const manoMondo = new Vector3(0.75, -1.25, 0.05);
  for (const [dx, dz] of [[-0.5, 0.3], [0.5, 0.3], [-0.5, -0.3], [0.5, -0.3]]) {
    const angolo = new Vector3(dx, 0.28, dz).applyAxisAngle(new Vector3(0, 1, 0), 0.25).add(blocco.position);
    corpo.add(corda(manoMondo, angolo, fune));
  }

  return { robot, corpo, elica };
}

// Le stesse rotte delle animazioni CSS (percentuali della zona di cielo), chiuse e ammorbidite.
const ROTTE = [
  [[6, 15], [30, 3], [84, 14], [74, 44], [28, 58], [4, 36]],
  [[86, 58], [44, 9], [6, 8], [38, 50]],
];
const DURATE = [44, 58];
const RITARDI = [0, 21];

export function avvia(canvas: HTMLCanvasElement, cielo: HTMLElement, hero: Element | null, pausa: Element | null) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
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
    return { ...r, curva, durata: DURATE[i], ritardo: RITARDI[i], yaw: 0.6, fase: Math.random() * 6 };
  });

  let W = 1, H = 1;
  const misura = () => {
    W = cielo.clientWidth; H = cielo.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H;
    camera.updateProjectionMatrix();
  };
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
      const scala = largo / 2.6;
      const u = (((tempo + r.ritardo) / r.durata) % 1 + 1) % 1;
      r.curva.getPointAt(u, p);
      r.curva.getPointAt((u + 0.004) % 1, q);
      const dx = (q.x - p.x) * W;
      // la rotta CSS muoveva l'angolo in alto a sinistra dell'immagine: la testa stava a circa 0,45 larghezze in basso a destra
      r.robot.position.set(p.x * W + largo * 0.45, -(p.y * H + largo * 0.45) - Math.sin(tempo * 2.4 + r.fase) * largo * 0.05, 0);
      r.robot.scale.setScalar(scala);
      // Si gira davvero: di tre quarti verso la direzione di volo, passando dal fronte.
      const meta = MathUtils.clamp(dx * 0.9, -1, 1) * 0.65;
      r.yaw = MathUtils.damp(r.yaw, meta, 2.2, dt);
      r.corpo.rotation.set(0.12, r.yaw, Math.sin(tempo * 2.4 + r.fase) * 0.05 - r.yaw * 0.12);
      r.elica.rotation.y += dt * 28;
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

  disegna(0); // primo fotogramma subito, anche se in pausa
  hero?.classList.add('robot-3d');
  loop();
}

