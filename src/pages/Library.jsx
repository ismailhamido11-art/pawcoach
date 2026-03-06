import { useState, useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { ArrowLeft, Bookmark, Search, Trash2, MessageCircle, Salad, Dumbbell, Video, BarChart2, Clock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import Illustration from "../components/illustrations/Illustration";

const SOURCE_LABELS = {
  chat: { label: "Chat IA", icon: MessageCircle, color: "#8b5cf6", bg: "bg-violet-50" },
  nutrition: { label: "NutriCoach", icon: Salad, color: "#10b981", bg: "bg-emerald-50" },
  training: { label: "Dressage", icon: Dumbbell, color: "#7c3aed", bg: "bg-purple-50" },
  video: { label: "Video", icon: Video, color: "#9333ea", bg: "bg-purple-50" },
  compare: { label: "Comparaison", icon: BarChart2, color: "#3b82f6", bg: "bg-blue-50" },
};

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "chat", label: "Chat IA" },
  { id: "nutrition", label: "Nutrition" },
  { id: "training", label: "Dressage" },
  { id: "video", label: "Video" },
  { id: "compare", label: "Comparaison" },
];

export default function Library() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const u = await base44.auth.me();
        const bks = await base44.entities.Bookmark.filter({ owner: u.email }, "-created_at");
        setBookmarks(bks || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id) => {
    try {
      await base44.entities.Bookmark.delete(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      if (expanded === id) setExpanded(null);
      toast.success("Conseil supprimé");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filtered = bookmarks.filter(b => {
    const matchFilter = filter === "all" || b.source === filter;
    const matchSearch = !search || (b.title || b.content || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary pt-14 pb-6 px-5 relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="relative z-20 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="relative z-10 flex items-end gap-3 mb-4">
          <div className="flex-1 pb-1">
            <h1 className="text-white font-black text-xl leading-tight">Ma Bibliothèque</h1>
            <p className="text-white/70 text-xs mt-0.5">{bookmarks.length} conseil{bookmarks.length !== 1 ? "s" : ""} sauvegardé{bookmarks.length !== 1 ? "s" : ""}</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 flex-shrink-0"
          >
            <Illustration name="qualityTime" alt="Bibliothèque" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative z-10 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm outline-none"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pt-4 pb-2 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.id
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pt-2 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-28 h-28 mx-auto mb-4"
            >
              <Illustration name="adoptAPet" alt="Aucun bookmark" className="w-full h-full drop-shadow-lg opacity-80" />
            </motion.div>
            <p className="font-bold text-foreground">
              {search ? "Aucun résultat" : "Aucun bookmark"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Essaie un autre mot-cle" : "Sauvegarde des conseils depuis le Chat, NutriCoach, dressage ou comparaisons"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((b) => {
              const src = SOURCE_LABELS[b.source] || SOURCE_LABELS.chat;
              const SrcIcon = src.icon;
              const isOpen = expanded === b.id;
              // Try parsing JSON for training bookmarks
              let trainingData = null;
              if (b.source === "training") {
                try { trainingData = JSON.parse(b.content); } catch {}
              }
              const preview = trainingData
                ? (trainingData.summary || trainingData.program_title || "Programme d'entrainement")
                : (b.content || "").replace(/[#*_`]/g, "").slice(0, 120);

              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden"
                >
                  <button
                    className="w-full text-left p-4"
                    onClick={() => setExpanded(isOpen ? null : b.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl ${src.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <SrcIcon className="w-4 h-4" style={{ color: src.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {b.title && (
                          <p className="font-bold text-sm text-foreground leading-tight truncate">{b.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {preview}{b.content?.length > 120 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-semibold" style={{ color: src.color }}>{src.label}</span>
                          {b.created_at && (
                            <span className="text-[10px] text-muted-foreground">
                              · {new Date(b.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-border/30">
                          <div className="pt-3">
                            {trainingData ? (
                              <div className="space-y-3">
                                {trainingData.difficulty && (
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">{trainingData.difficulty}</span>
                                    <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{trainingData.duration_weeks || 4} semaines</span>
                                    {trainingData.weekly_goal_minutes && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">~{trainingData.weekly_goal_minutes} min/sem</span>}
                                  </div>
                                )}
                                {trainingData.weeks?.map((week, wi) => (
                                  <div key={wi} className="bg-muted/30 rounded-xl p-3">
                                    <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                      <Target className="w-3 h-3 text-primary" />
                                      Semaine {week.week} — {week.theme}
                                    </p>
                                    <div className="space-y-1">
                                      {week.daily_sessions?.slice(0, 3).map((s, si) => (
                                        <div key={si} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                          <span>{s.day}</span>
                                          <span className="text-foreground/70">{s.activity?.slice(0, 50)}</span>
                                          <span className="ml-auto text-[10px] font-medium flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{s.duration_min}m</span>
                                        </div>
                                      ))}
                                      {(week.daily_sessions?.length || 0) > 3 && (
                                        <p className="text-[10px] text-muted-foreground italic">+{week.daily_sessions.length - 3} autres sessions</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ReactMarkdown
                                className="prose prose-sm max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                  p: ({ children }) => <p className="my-1 leading-relaxed text-sm">{children}</p>,
                                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                                  li: ({ children }) => <li className="my-0.5 text-sm">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                }}
                              >
                                {b.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <BottomNav currentPage="Library" />
    </div>
  );
}