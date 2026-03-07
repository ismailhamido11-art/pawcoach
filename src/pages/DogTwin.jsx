import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Utensils, Brain, Activity, Sparkles, ChevronUp, Zap, Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TwinIA from "../components/dogtwin/TwinIA";
import TwinMemoire from "../components/dogtwin/TwinMemoire";
import TwinVoix from "../components/dogtwin/TwinVoix";

const ZONES = [
  { id: "heart",    label: "Vitalité",    icon: Heart,    color: "#ff6b8a", score: 87, detail: "Rythme cardiaque stable · Énergie excellente", emoji: "❤️" },
  { id: "food",     label: "Nutrition",   icon: Utensils, color: "#f59e0b", score: 74, detail: "Appétit légèrement réduit depuis 2 jours", emoji: "🍗" },
  { id: "brain",    label: "Mental",      icon: Brain,    color: "#a78bfa", score: 92, detail: "Très stimulé · Comportement équilibré", emoji: "🧠" },
  { id: "activity", label: "Activité",    icon: Activity, color: "#34d399", score: 81, detail: "3 balades cette semaine · Objectif presque atteint", emoji: "🏃" },
];

const VITALITY = Math.round(ZONES.reduce((s, z) => s + z.score, 0) / ZONES.length);

const STATUS = VITALITY >= 85 ? { label: "En pleine forme", color: "#34d399", glow: "#34d39944" }
             : VITALITY >= 65 ? { label: "Bien mais surveiller", color: "#f59e0b", glow: "#f59e0b44" }
             : { label: "Attention requise", color: "#ff6b8a", glow: "#ff6b8a44" };

export default function DogTwin() {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const dogRef = useRef(null);
  const frameRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const dragRef = useRef({ active: false, prevX: 0, prevY: 0, targetRotY: 0, targetRotX: 0, rotY: 0, rotX: 0 });

  const [selectedZone, setSelectedZone] = useState(null);
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // 0 = Corps, 1 = Cerveau IA, 2 = Mémoire, 3 = Voix
  const [activeLayer, setActiveLayer] = useState(0);

  const buildDog = useCallback((scene) => {
    const g = new THREE.Group();

    const fur   = new THREE.MeshStandardMaterial({ color: 0xc4956a, roughness: 0.85, metalness: 0.0 });
    const dark  = new THREE.MeshStandardMaterial({ color: 0x7a4a28, roughness: 0.9 });
    const light = new THREE.MeshStandardMaterial({ color: 0xe8cfa0, roughness: 0.85 });
    const nose  = new THREE.MeshStandardMaterial({ color: 0x1a0d06, roughness: 0.4, metalness: 0.1 });
    const eye   = new THREE.MeshStandardMaterial({ color: 0x0d0600, roughness: 0.1, metalness: 0.3 });
    const shine = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.0, emissive: 0xffffff, emissiveIntensity: 0.8 });
    const collar = new THREE.MeshStandardMaterial({ color: 0x2d9f82, roughness: 0.3, metalness: 0.6 });
    const tag   = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9 });

    const add = (geo, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0, sx=1, sy=1, sz=1) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.scale.set(sx, sy, sz);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };

    // === BODY ===
    add(new THREE.SphereGeometry(0.52, 32, 24), fur,   0, 0.72, 0,  0,0,0, 1, 0.88, 1.25);
    // belly patch
    add(new THREE.SphereGeometry(0.28, 16, 16), light, 0, 0.62, 0.42, 0,0,0, 1, 0.8, 0.6);

    // === NECK ===
    add(new THREE.CylinderGeometry(0.2, 0.25, 0.28, 20), fur, 0, 1.06, 0.18, 0.35,0,0);

    // === HEAD ===
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.28, 0.28);
    g.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 24), fur);
    headMesh.scale.set(1, 0.95, 1.02);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // skull dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), fur);
    dome.scale.set(1, 0.7, 0.8);
    dome.position.set(0, 0.22, -0.06);
    headGroup.add(dome);

    // MUZZLE
    const muzzleGroup = new THREE.Group();
    muzzleGroup.position.set(0, -0.06, 0.32);
    headGroup.add(muzzleGroup);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), light);
    muzzle.scale.set(1, 0.72, 1.1);
    muzzle.castShadow = true;
    muzzleGroup.add(muzzle);

    // nose tip
    const noseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), nose);
    noseMesh.scale.set(1.15, 0.75, 0.9);
    noseMesh.position.set(0, 0.04, 0.17);
    muzzleGroup.add(noseMesh);

    // nose nostrils
    [-0.035, 0.035].forEach(x => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), nose);
      n.position.set(x, 0.0, 0.22);
      n.scale.set(1, 0.5, 0.8);
      muzzleGroup.add(n);
    });

    // mouth line
    const mouthGeo = new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, dark);
    mouth.position.set(0, -0.045, 0.18);
    mouth.rotation.set(0.1, 0, 0);
    muzzleGroup.add(mouth);

    // EYES
    [-0.135, 0.135].forEach(x => {
      const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.057, 16, 16), eye);
      eyeMesh.position.set(x, 0.1, 0.29);
      headGroup.add(eyeMesh);
      // iris
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), new THREE.MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.2 }));
      iris.position.set(x, 0.1, 0.335);
      headGroup.add(iris);
      // shine
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), shine);
      sh.position.set(x + 0.02, 0.12, 0.348);
      headGroup.add(sh);
      // brow ridge
      const brow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), fur);
      brow.scale.set(1.1, 0.5, 0.6);
      brow.position.set(x, 0.17, 0.24);
      headGroup.add(brow);
    });

    // EARS (floppy labrador style)
    [-0.3, 0.3].forEach((x, i) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(x, 0.15, -0.08);
      earGroup.rotation.z = i === 0 ? 0.25 : -0.25;

      const earTop = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), dark);
      earTop.scale.set(0.65, 0.5, 0.38);
      earGroup.add(earTop);

      const earFlap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), dark);
      earFlap.scale.set(0.6, 1.1, 0.3);
      earFlap.position.set(0, -0.18, 0.02);
      earGroup.add(earFlap);

      headGroup.add(earGroup);
    });

    // COLLAR
    const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.042, 10, 36), collar);
    collarMesh.position.set(0, 0.96, 0.14);
    collarMesh.rotation.x = Math.PI / 2.8;
    g.add(collarMesh);

    // TAG
    const tagMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16), tag);
    tagMesh.position.set(0, 0.86, 0.32);
    tagMesh.rotation.x = Math.PI / 2;
    g.add(tagMesh);

    // LEGS
    const legPositions = [
      [-0.27, 0.3, -0.38], [0.27, 0.3, -0.38],
      [-0.25, 0.3, 0.28],  [0.25, 0.3, 0.28],
    ];
    legPositions.forEach(([x, y, z]) => {
      // upper leg
      add(new THREE.CylinderGeometry(0.1, 0.085, 0.38, 14), fur, x, y, z);
      // lower leg
      add(new THREE.CylinderGeometry(0.08, 0.075, 0.28, 12), fur, x, y - 0.32, z);
      // paw
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), dark);
      paw.scale.set(1.05, 0.55, 1.15);
      paw.position.set(x, y - 0.49, z + 0.02);
      paw.castShadow = true;
      g.add(paw);
    });

    // TAIL
    const pts = [
      new THREE.Vector3(0,   0.88, -0.52),
      new THREE.Vector3(0.1, 1.08, -0.7),
      new THREE.Vector3(0.22, 1.3, -0.65),
      new THREE.Vector3(0.3,  1.5, -0.48),
      new THREE.Vector3(0.28, 1.65,-0.3),
    ];
    const tailGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.065, 10, false);
    add(tailGeo, dark);

    // tail tip lighter
    const tipGeo = new THREE.SphereGeometry(0.075, 10, 10);
    add(tipGeo, light, 0.28, 1.65, -0.3);

    scene.add(g);
    dogRef.current = g;
    return g;
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;

    // Detect dark mode
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Adapt fog and background based on dark mode
    const fogColor = isDark ? 0x0a1a14 : 0x1a2f26;
    const bgColor = isDark ? 0x081510 : 0x0f2820;
    scene.fog = new THREE.FogExp2(fogColor, 0.18);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50);
    camera.position.set(0, 1.3, 4.2);
    camera.lookAt(0, 0.9, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === LIGHTS — adapted for dark/light mode ===
    const ambientIntensity = isDark ? 0.4 : 0.35;
    const ambientColor = isDark ? 0xfff0e0 : 0xffebdb;
    scene.add(new THREE.AmbientLight(ambientColor, ambientIntensity));

    const keyIntensity = isDark ? 2.2 : 2.5;
    const keyColor = isDark ? 0xfff5e8 : 0xfffbf5;
    const key = new THREE.DirectionalLight(keyColor, keyIntensity);
    key.position.set(2.5, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.002;
    scene.add(key);

    const fillColor = isDark ? 0xc8e8ff : 0xb8deff;
    const fillIntensity = isDark ? 0.6 : 0.5;
    const fill = new THREE.DirectionalLight(fillColor, fillIntensity);
    fill.position.set(-3, 2, 1);
    scene.add(fill);

    const back = new THREE.PointLight(0x2d9f82, 1.4, 12);
    back.position.set(0, 3.5, -3.5);
    scene.add(back);

    const bottom = new THREE.PointLight(0x0a3a28, 0.8, 6);
    bottom.position.set(0, -1, 0);
    scene.add(bottom);

    // === GROUND — adapted for dark/light mode ===
    const groundGeo = new THREE.CircleGeometry(2.5, 80);
    const groundColor = isDark ? 0x0d2218 : 0x164a37;
    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Glow rings
    [1.05, 0.75, 0.45].forEach((r, i) => {
      const rGeo = new THREE.RingGeometry(r - 0.04, r, 80);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0x2d9f82,
        transparent: true,
        opacity: 0.07 - i * 0.015,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      ring.userData.baseOpacity = 0.07 - i * 0.015;
      ring.userData.phase = i * 0.5;
      scene.add(ring);
    });

    // === PARTICLES ===
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const pData = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 1.4;
      const y = 0.1 + Math.random() * 2.2;
      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      pData.push({ angle, radius, speed: 0.002 + Math.random() * 0.004, yBase: y, yAmp: 0.06 + Math.random() * 0.1, yFreq: 0.5 + Math.random() * 1.0 });
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x2d9f82, size: 0.022, transparent: true, opacity: 0.55, sizeAttenuation: true });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // === DOG ===
    buildDog(scene);
    setReady(true);

    // === ANIMATION ===
    const dr = dragRef.current;
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      t += delta;

      // Smooth drag rotation
      dr.rotY += (dr.targetRotY - dr.rotY) * 0.1;
      dr.rotX += (dr.targetRotX - dr.rotX) * 0.1;

      const dog = dogRef.current;
      if (dog) {
        dog.rotation.y = dr.rotY;
        dog.rotation.x = Math.max(-0.25, Math.min(0.2, dr.rotX));
        // breathing
        dog.position.y = Math.sin(t * 1.1) * 0.028;
        dog.children.forEach(c => {
          if (c.geometry instanceof THREE.SphereGeometry && c.position.y > 0.5 && c.position.y < 0.9) {
            c.scale.z = 1.25 + Math.sin(t * 1.1) * 0.025;
            c.scale.y = 0.88 + Math.sin(t * 1.1) * 0.018;
          }
        });
        // tail wag
        dog.children.forEach(c => {
          if (c.geometry instanceof THREE.TubeGeometry) {
            c.rotation.y = Math.sin(t * 3.5) * 0.35;
          }
        });
      }

      // Particles
      const pos = pGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const d = pData[i];
        d.angle += d.speed;
        pos[i * 3]     = Math.cos(d.angle) * d.radius;
        pos[i * 3 + 1] = d.yBase + Math.sin(t * d.yFreq) * d.yAmp;
        pos[i * 3 + 2] = Math.sin(d.angle) * d.radius;
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = 0.35 + Math.sin(t * 0.8) * 0.2;

      // Rings pulse
      scene.children.forEach(c => {
        if (c.userData.baseOpacity !== undefined) {
          c.material.opacity = c.userData.baseOpacity + Math.sin(t * 1.5 + c.userData.phase) * 0.03;
        }
      });

      // Rim light color breathing
      back.intensity = 1.2 + Math.sin(t * 0.9) * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    // Touch / mouse drag
    const onStart = e => {
      dr.active = true;
      dr.prevX = e.touches ? e.touches[0].clientX : e.clientX;
      dr.prevY = e.touches ? e.touches[0].clientY : e.clientY;
    };
    const onEnd = () => { dr.active = false; };
    const onMove = e => {
      if (!dr.active) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      dr.targetRotY += (x - dr.prevX) * 0.011;
      dr.targetRotX += (y - dr.prevY) * 0.007;
      dr.prevX = x;
      dr.prevY = y;
    };

    el.addEventListener("mousedown", onStart);
    el.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    const handleResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      el.removeEventListener("mousedown", onStart);
      el.removeEventListener("touchstart", onStart);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [buildDog]);

  const scoreColor = s => s >= 85 ? "#34d399" : s >= 65 ? "#f59e0b" : "#ff6b8a";

  return (
    <div className="fixed inset-0 bg-[#081510] flex flex-col overflow-hidden" style={{ touchAction: "none" }}>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 safe-pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Jumeau Digital</span>
          </div>
          <p className="text-white font-black text-lg tracking-tight">Max</p>
        </div>

        {/* Vitality ring */}
        <div className="pointer-events-auto relative">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="#ffffff10" strokeWidth="4" />
            <circle
              cx="26" cy="26" r="22"
              fill="none"
              stroke={scoreColor(VITALITY)}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(VITALITY / 100) * 138.2} 138.2`}
              strokeDashoffset="34.6"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor(VITALITY)})` }}
              transform="rotate(-90 26 26)"
            />
            <text x="26" y="30" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">{VITALITY}</text>
          </svg>
        </div>
      </div>

      {/* Status badge */}
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 z-20"
          >
            <div
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full backdrop-blur-md border"
              style={{ background: STATUS.glow, borderColor: STATUS.color + "55" }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: STATUS.color }} />
              <span className="text-xs font-bold" style={{ color: STATUS.color }}>{STATUS.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Drag hint */}
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute bottom-52 left-0 right-0 flex justify-center pointer-events-none z-10"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-white/35 text-[10px] tracking-wider">Fais pivoter Max</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet — 4 layers */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Sheet handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-pointer"
          onClick={() => setSheetOpen(o => !o)}
        >
          <motion.div
            animate={{ rotate: sheetOpen ? 180 : 0 }}
            className="bg-white/20 backdrop-blur-md rounded-full px-5 py-1.5 flex items-center gap-2 border border-white/10"
          >
            <ChevronUp className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-[11px] font-semibold">Jumeau Digital</span>
          </motion.div>
        </div>

        <motion.div
          animate={{ height: sheetOpen ? 420 : 108 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="bg-black/70 backdrop-blur-2xl border-t border-white/10 flex flex-col" style={{ height: 420 }}>
            {/* Layer tabs */}
            <div className="flex gap-1.5 px-4 pt-3 pb-2 flex-shrink-0">
              {[
                { label: "Corps", icon: "🐾", id: 0 },
                { label: "Cerveau", icon: "🧠", id: 1 },
                { label: "Mémoire", icon: "📖", id: 2 },
                { label: "Voix", icon: "💬", id: 3 },
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setActiveLayer(tab.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all"
                  style={{
                    background: activeLayer === tab.id ? "rgba(45,159,130,0.25)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${activeLayer === tab.id ? "rgba(45,159,130,0.5)" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: activeLayer === tab.id ? "0 0 12px rgba(45,159,130,0.2)" : "none",
                  }}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="text-[9px] font-bold" style={{ color: activeLayer === tab.id ? "#2d9f82" : "rgba(255,255,255,0.4)" }}>
                    {tab.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Layer content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLayer}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto"
                >
                  {activeLayer === 0 && (
                    <div className="px-4 pt-3 pb-8 space-y-3">
                      {/* Zone pills */}
                      <div className="grid grid-cols-4 gap-2">
                        {ZONES.map((z) => {
                          const c = scoreColor(z.score);
                          const active = selectedZone?.id === z.id;
                          return (
                            <motion.button
                              key={z.id}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setSelectedZone(active ? null : z)}
                              className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border transition-all"
                              style={{
                                background: active ? z.color + "22" : "rgba(255,255,255,0.05)",
                                borderColor: active ? z.color + "66" : "rgba(255,255,255,0.08)",
                                boxShadow: active ? `0 0 16px ${z.color}33` : "none",
                              }}
                            >
                              <span className="text-lg">{z.emoji}</span>
                              <span className="text-[9px] text-white/50 font-semibold">{z.label}</span>
                              <span className="text-xs font-black" style={{ color: c }}>{z.score}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                      <AnimatePresence mode="wait">
                        {selectedZone ? (
                          <motion.div
                            key={selectedZone.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="rounded-2xl p-4 flex items-center gap-4"
                            style={{ background: selectedZone.color + "18", border: `1px solid ${selectedZone.color}33` }}
                          >
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ background: selectedZone.color + "25" }}>
                              {selectedZone.emoji}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold text-sm">{selectedZone.label}</p>
                              <p className="text-white/55 text-xs mt-0.5 leading-relaxed">{selectedZone.detail}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black" style={{ color: scoreColor(selectedZone.score) }}>{selectedZone.score}</p>
                              <p className="text-white/30 text-[10px]">/100</p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center text-white/25 text-xs py-2">
                            Appuie sur une zone pour voir les détails
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {activeLayer === 1 && <TwinIA />}
                  {activeLayer === 2 && <TwinMemoire />}
                  {activeLayer === 3 && <TwinVoix />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}