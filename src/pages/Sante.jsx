import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import ChatFAB from "../components/ChatFAB";
import WellnessBanner from "../components/WellnessBanner";
import Illustration from "../components/illustrations/Illustration";
import { motion } from "framer-motion";
import {
  BookHeart, Camera, Stethoscope, Cpu,
  ChevronRight, Shield, Syringe, Weight, FileText, MapPin
} from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const SECTIONS = [
  {
    id: "notebook",
    icon: BookHeart,
    color: "#2d9f82",
    bg: "bg-emerald-50",
    title: "Carnet de santé",
    desc: "Vaccins, poids, visites véto, médicaments",
    page: "Notebook",
    illustration: "goodDoggy",
  },
  {
    id: "healthimport",
    icon: Camera,
    color: "#8b5cf6",
    bg: "bg-violet-50",
    title: "Import IA",
    desc: "Photo, PDF, email vétérinaire → données extraites auto",
    page: "HealthImport",
    illustration: null,
  },
  {
    id: "diagnosis",
    icon: Stethoscope,
    color: "#ef4444",
    bg: "bg-red-50",
    title: "Mon chien est malade ?",
    desc: "Pré-diagnostic IA & orientation urgence",
    page: "Notebook",
    pageParams: "?diag=1",
    illustration: null,
  },
  {
    id: "findvet",
    icon: MapPin,
    color: "#3b82f6",
    bg: "bg-blue-50",
    title: "Trouver un vétérinaire",
    desc: "Cliniques vétérinaires proches de toi",
    page: "FindVet",
    illustration: "veterinary",
  },
  {
    id: "dogtwin",
    icon: Cpu,
    color: "#f59e0b",
    bg: "bg-amber-50",
    title: "Jumeau Digital 3D",
    desc: "Visualise la vitalité de ton chien en temps réel",
    page: "DogTwin",
    illustration: null,
    isPremium: false,
    badge: "WOW",
  },
];

export default function Sante() {
  const [dog, setDog] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = await base44.auth.me();
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs.length > 0) {
          const d = getActiveDog(dogs);
          setDog(d);
          const recs = await base44.entities.HealthRecord.filter({ dog_id: d.id });
          setRecords(recs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const vaccineCount = records.filter(r => r.type === "vaccine").length;
  const vetCount = records.filter(r => r.type === "vet_visit").length;
  const weightRecords = records.filter(r => r.type === "weight");

  return (
    <div className="min-h-screen bg-background pb-28">
      <WellnessBanner />

      {/* Hero */}
      <div className="gradient-primary px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="relative z-10 flex items-end gap-3">
          <div className="flex-1 pb-2">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl">Santé</h1>
            {dog && (
              <p className="text-white/70 text-xs mt-0.5">
                Suivi complet de {dog.name}
              </p>
            )}
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 flex-shrink-0"
          >
            <Illustration name="goodDoggy" alt="Santé" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Quick stats */}
        {!loading && records.length > 0 && (
          <div className="relative z-10 flex gap-2 mt-3">
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <p className="text-white font-black text-lg leading-none">{vaccineCount}</p>
              <p className="text-white/70 text-[10px] mt-0.5">Vaccins</p>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <p className="text-white font-black text-lg leading-none">{vetCount}</p>
              <p className="text-white/70 text-[10px] mt-0.5">Visites</p>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <p className="text-white font-black text-lg leading-none">{weightRecords.length}</p>
              <p className="text-white/70 text-[10px] mt-0.5">Pesées</p>
            </div>
          </div>
        )}

        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Section cards */}
      <div className="px-4 mt-5 space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const to = createPageUrl(section.page) + (section.pageParams || "");
          return (
            <motion.div key={section.id} whileTap={{ scale: 0.98 }} transition={spring}>
              <Link to={to}>
                <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-2xl ${section.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" style={{ color: section.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground">{section.title}</p>
                      {section.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{section.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <ChatFAB />
      <BottomNav currentPage="Sante" />
    </div>
  );
}