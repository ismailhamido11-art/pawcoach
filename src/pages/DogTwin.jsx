import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Zap, Utensils, Brain, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const HEALTH_ZONES = [
  { id: "heart", label: "Cœur & Énergie", icon: Heart, color: "#ef4444", score: 87, detail: "Rythme cardiaque stable, bonne vitalité générale", position: { x: 0.15, y: 0.55 } },
  { id: "food", label: "Nutrition", icon: Utensils, color: "#f59e0b", score: 74, detail: "Appétit légèrement réduit depuis 2 jours", position: { x: -0.25, y: 0.3 } },
  { id: "brain", label: "Mental & Comportement", icon: Brain, color: "#8b5cf6", score: 92, detail: "Très actif mentalement, bien stimulé", position: { x: 0.0, y: 0.9 } },
  { id: "activity", label: "Activité physique", icon: Activity, color: "#10b981", score: 81, detail: "3 balades cette semaine, objectif presque atteint", position: { x: -0.15, y: 0.1 } },
];

function VitalityOrb({ score }) {
  const color = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 314} 314`}
          strokeDashoffset="78.5"
          style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}88)` }}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>{score}</text>
        <text x="60" y="72" textAnchor="middle" fontSize="11" fill="#9ca3af">/100</text>
      </svg>
      <span className="text-xs font-semibold text-muted-foreground mt-1">Score Vitalité</span>
    </div>
  );
}

function ZoneBadge({ zone, onClick, active }) {
  const Icon = zone.icon;
  const color = zone.score >= 85 ? "#10b981" : zone.score >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => onClick(zone)}
      className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
        active ? "border-primary bg-primary/10 shadow-md" : "border-border bg-white"
      }`}
    >
      <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: zone.color + "20" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: zone.color }} />
      </div>
      <div className="text-left">
        <p className="text-[10px] text-muted-foreground leading-none">{zone.label}</p>
        <p className="text-xs font-bold" style={{ color }}>{zone.score}/100</p>
      </div>
    </motion.button>
  );
}

export default function DogTwin() {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const dogRef = useRef(null);
  const frameRef = useRef(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const vitalityScore = Math.round(HEALTH_ZONES.reduce((sum, z) => sum + z.score, 0) / HEALTH_ZONES.length);

  useEffect(() => {
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);
    camera.lookAt(0, 0.8, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    dirLight.position.set(3, 5, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.4);
    fillLight.position.set(-3, 2, -1);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x2d9f82, 0.8, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Ground
    const groundGeo = new THREE.CircleGeometry(2, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground glow ring
    const ringGeo = new THREE.RingGeometry(0.9, 1.1, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2d9f82, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // === BUILD THE DOG ===
    const dogGroup = new THREE.Group();
    dogRef.current = dogGroup;

    const furColor = 0xc8a882;
    const darkFur = 0x8b6347;
    const noseColor = 0x2d1a0e;

    const mat = (color, roughness = 0.7) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.55, 32, 32);
    bodyGeo.scale(1, 0.85, 1.3);
    const body = new THREE.Mesh(bodyGeo, mat(furColor));
    body.position.set(0, 0.72, 0);
    body.castShadow = true;
    dogGroup.add(body);

    // Chest lighter patch
    const chestGeo = new THREE.SphereGeometry(0.3, 16, 16);
    chestGeo.scale(1, 0.9, 0.6);
    const chest = new THREE.Mesh(chestGeo, mat(0xe8d0b0));
    chest.position.set(0, 0.65, 0.38);
    dogGroup.add(chest);

    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
    headGeo.scale(1, 0.95, 1);
    const head = new THREE.Mesh(headGeo, mat(furColor));
    head.position.set(0, 1.32, 0.25);
    head.castShadow = true;
    dogGroup.add(head);

    // Snout
    const snoutGeo = new THREE.SphereGeometry(0.2, 16, 16);
    snoutGeo.scale(1, 0.7, 1.1);
    const snout = new THREE.Mesh(snoutGeo, mat(0xd4a96a));
    snout.position.set(0, 1.22, 0.52);
    dogGroup.add(snout);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.07, 16, 16);
    noseGeo.scale(1.2, 0.8, 0.9);
    const nose = new THREE.Mesh(noseGeo, mat(noseColor, 0.3));
    nose.position.set(0, 1.26, 0.7);
    dogGroup.add(nose);

    // Eyes
    [-0.14, 0.14].forEach(x => {
      const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const eye = new THREE.Mesh(eyeGeo, mat(0x1a0a00, 0.1));
      eye.position.set(x, 1.38, 0.58);
      dogGroup.add(eye);

      // Eye shine
      const shineGeo = new THREE.SphereGeometry(0.02, 8, 8);
      const shine = new THREE.Mesh(shineGeo, mat(0xffffff, 0.0));
      shine.position.set(x + 0.02, 1.41, 0.63);
      dogGroup.add(shine);
    });

    // Ears (floppy)
    [-0.33, 0.33].forEach((x, i) => {
      const earGeo = new THREE.SphereGeometry(0.18, 16, 16);
      earGeo.scale(0.7, 1.3, 0.4);
      const ear = new THREE.Mesh(earGeo, mat(darkFur));
      ear.position.set(x, 1.32, 0.05);
      ear.rotation.z = i === 0 ? -0.3 : 0.3;
      ear.castShadow = true;
      dogGroup.add(ear);
    });

    // Legs (4)
    [[-0.28, -0.45], [0.28, -0.45], [-0.22, 0.35], [0.22, 0.35]].forEach(([x, z]) => {
      const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.52, 12);
      const leg = new THREE.Mesh(legGeo, mat(furColor));
      leg.position.set(x, 0.28, z);
      leg.castShadow = true;
      dogGroup.add(leg);

      // Paw
      const pawGeo = new THREE.SphereGeometry(0.11, 12, 12);
      pawGeo.scale(1, 0.6, 1.1);
      const paw = new THREE.Mesh(pawGeo, mat(darkFur));
      paw.position.set(x, 0.02, z);
      dogGroup.add(paw);
    });

    // Tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.85, -0.55),
      new THREE.Vector3(0.15, 1.1, -0.75),
      new THREE.Vector3(0.25, 1.35, -0.6),
      new THREE.Vector3(0.2, 1.5, -0.4),
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 12, 0.07, 8, false);
    const tail = new THREE.Mesh(tailGeo, mat(darkFur));
    tail.castShadow = true;
    dogGroup.add(tail);

    // Collar
    const collarGeo = new THREE.TorusGeometry(0.25, 0.04, 8, 32);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x2d9f82, roughness: 0.3, metalness: 0.4 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 1.05, 0.22);
    collar.rotation.x = Math.PI / 2.5;
    dogGroup.add(collar);

    scene.add(dogGroup);
    dogGroup.position.y = 0;

    setLoaded(true);

    // Floating particles
    const particles = [];
    for (let i = 0; i < 18; i++) {
      const geo = new THREE.SphereGeometry(0.015 + Math.random() * 0.02, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: [0x2d9f82, 0x10b981, 0x34d399, 0x6ee7b7][Math.floor(Math.random() * 4)],
        transparent: true,
        opacity: 0.5 + Math.random() * 0.4,
      });
      const p = new THREE.Mesh(geo, pMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.8;
      p.position.set(
        Math.cos(angle) * radius,
        0.3 + Math.random() * 1.8,
        Math.sin(angle) * radius
      );
      p.userData = { angle, radius, speed: 0.003 + Math.random() * 0.004, ySpeed: 0.008 + Math.random() * 0.006, yBase: p.position.y };
      scene.add(p);
      particles.push(p);
    }

    // Animation loop
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;

      // Dog idle breathing
      if (dogGroup) {
        dogGroup.rotation.y = Math.sin(t * 0.4) * 0.12;
        dogGroup.position.y = Math.sin(t * 1.2) * 0.025;
        body.scale.y = 1 + Math.sin(t * 1.8) * 0.018;
      }

      // Particles orbit
      particles.forEach(p => {
        p.userData.angle += p.userData.speed;
        p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
        p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
        p.position.y = p.userData.yBase + Math.sin(t * p.userData.ySpeed * 40) * 0.12;
        p.material.opacity = 0.3 + Math.abs(Math.sin(t * p.userData.ySpeed * 20)) * 0.5;
      });

      // Ring pulse
      ring.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.07;

      renderer.render(scene, camera);
    };
    animate();

    // Touch/mouse drag
    let isDragging = false;
    let prevX = 0;
    const onDown = e => { isDragging = true; prevX = e.touches ? e.touches[0].clientX : e.clientX; };
    const onUp = () => { isDragging = false; };
    const onMove = e => {
      if (!isDragging) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = x - prevX;
      dogGroup.rotation.y += dx * 0.012;
      prevX = x;
    };

    const el = mountRef.current;
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1f1a] via-[#0f2820] to-[#0a1a15] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="text-center">
          <p className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">Jumeau Digital</p>
          <p className="text-white font-bold text-base">Max</p>
        </div>
        <VitalityOrb score={vitalityScore} />
      </div>

      {/* 3D Canvas */}
      <div
        ref={mountRef}
        className="flex-1 w-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: 320, maxHeight: 380 }}
      />

      {/* Drag hint */}
      <AnimatePresence>
        {loaded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-center text-white/30 text-[10px] -mt-4 mb-2 tracking-wider"
          >
            ↔ Fais glisser pour tourner
          </motion.p>
        )}
      </AnimatePresence>

      {/* Zone detail popup */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-5 mb-3 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: selectedZone.color + "22", border: `1px solid ${selectedZone.color}44` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: selectedZone.color + "30" }}>
              <selectedZone.icon className="w-5 h-5" style={{ color: selectedZone.color }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{selectedZone.label}</p>
              <p className="text-white/60 text-xs mt-0.5">{selectedZone.detail}</p>
            </div>
            <span className="text-2xl font-black" style={{ color: selectedZone.color }}>{selectedZone.score}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Zones Grid */}
      <div className="px-5 pb-10 grid grid-cols-2 gap-2">
        {HEALTH_ZONES.map(zone => (
          <ZoneBadge
            key={zone.id}
            zone={zone}
            active={selectedZone?.id === zone.id}
            onClick={z => setSelectedZone(selectedZone?.id === z.id ? null : z)}
          />
        ))}
      </div>
    </div>
  );
}