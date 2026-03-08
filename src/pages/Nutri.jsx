import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getActiveDog, createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import ChatFAB from "../components/ChatFAB";
import WellnessBanner from "../components/WellnessBanner";
import NutritionMealPlan from "../components/nutrition/NutritionMealPlan";
import FoodComparator from "../components/nutrition/FoodComparator";
import DietPreferencesPanel from "../components/nutrition/DietPreferencesPanel";
// SavedPlansPanel merged into NutritionMealPlan

import { Button } from "@/components/ui/button";
import { Send, Salad, Bookmark, BookmarkCheck, ScanLine, Settings2, ChevronDown, Copy, RotateCcw } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import { isUserPremium } from "@/utils/premium";
import { initCredits } from "@/utils/ai-credits";
import IconBadge from "@/components/ui/IconBadge";
import { InlineIcon } from "@/components/ui/IconBadge";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const tabVariants = {
  enter: (d) => ({ opacity: 0, x: d * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -60 }),
};
const msgAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 120, damping: 20 }
};

const mdComponents = {
  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

// --- Helpers ---
function getDateLabel(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function shouldShowDateSeparator(messages, index) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].timestamp);
  const curr = new Date(messages[index].timestamp);
  return prev.toDateString() !== curr.toDateString();
}

function getTimeStr(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const TABS = [
  { id: "coach",    label: "NutriCoach", emoji: "\u{1F957}", bg: "from-emerald-500 to-emerald-700" },
  { id: "mealplan", label: "Plan repas",  emoji: "\u{1F4C5}", bg: "from-amber-500 to-amber-600" },
  { id: "prefs",    label: "Préférences", emoji: "\u2699\uFE0F", bg: "from-slate-500 to-slate-700" },
  { id: "compare",  label: "Comparer",   emoji: "\u2696\uFE0F", bg: "from-blue-500 to-indigo-600" },
  { id: "scan",     label: "Scanner",    emoji: "\u{1F4F7}", bg: "from-violet-500 to-purple-600" },
];

export default function Nutri() {
   const navigate = useNavigate();
   const [dog, setDog] = useState(null);
   const [user, setUser] = useState(null);
   const [recentScans, setRecentScans] = useState([]);
   const [messages, setMessages] = useState([]);
   const [input, setInput] = useState("");
   const [loading, setLoading] = useState(false);
   const [initializing, setInitializing] = useState(true);

   // URL-based tab navigation (enables back button between sub-tabs)
   const [searchParams, setSearchParams] = useSearchParams();
   const urlTab = searchParams.get("tab");
   // Priority: URL param > sessionStorage > default
   const activeTab = (urlTab && TABS.some(t => t.id === urlTab)) ? urlTab
     : (() => { const s = sessionStorage.getItem("tab_Nutri"); return (s && TABS.some(t => t.id === s)) ? s : "coach"; })();
   // On mount without URL param, sync URL with preserved tab (replace, not push)
   const initRef = useRef(false);
   useEffect(() => {
     if (!initRef.current) { initRef.current = true; if (!urlTab && activeTab !== "coach") setSearchParams({ tab: activeTab }, { replace: true }); }
   }, []);
   useEffect(() => { sessionStorage.setItem("tab_Nutri", activeTab); }, [activeTab]);
   const changeTab = (tabId) => { sessionStorage.setItem("tab_Nutri", tabId); setSearchParams({ tab: tabId }); };

  // Track direction for native-like horizontal slide
  const tabIndex = TABS.findIndex(t => t.id === activeTab);
  const prevTabIdx = useRef(tabIndex);
  const tabDir = tabIndex >= prevTabIdx.current ? 1 : -1;
  useEffect(() => { prevTabIdx.current = tabIndex; }, [tabIndex]);

  const [messagesRemaining, setMessagesRemaining] = useState(null);
  const [bookmarked, setBookmarked] = useState({});
  const [dietPrefs, setDietPrefs] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [monthlyPlanCount, setMonthlyPlanCount] = useState(0);
  const [allPlans, setAllPlans] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Typewriter streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const streamingRef = useRef({ fullText: "", words: [], wordIndex: 0, timer: null, timestamp: "" });

  // Scroll-to-bottom
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Retry
  const [lastFailedInput, setLastFailedInput] = useState(null);

  // --- Typewriter ---
  const startStreaming = useCallback((fullText, timestamp) => {
    const words = fullText.split(/(\s+)/);
    streamingRef.current = { fullText, words, wordIndex: 0, timer: null, timestamp };
    setIsStreaming(true);
    setStreamingText("");
    const timer = setInterval(() => {
      const data = streamingRef.current;
      data.wordIndex += 2;
      if (data.wordIndex >= data.words.length) {
        clearInterval(timer);
        const finalText = data.fullText;
        const finalTs = data.timestamp;
        streamingRef.current = { fullText: "", words: [], wordIndex: 0, timer: null, timestamp: "" };
        setIsStreaming(false);
        setStreamingText("");
        setMessages(prev => [...prev, { role: "assistant", content: finalText, timestamp: finalTs }]);
        return;
      }
      setStreamingText(data.words.slice(0, data.wordIndex).join(""));
    }, 30);
    streamingRef.current.timer = timer;
  }, []);

  useEffect(() => {
    return () => {
      if (streamingRef.current.timer) clearInterval(streamingRef.current.timer);
    };
  }, []);

  // --- Scroll detection ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(dist > 200);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showScrollBtn) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingText]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  const handleBookmark = async (msg) => {
    if (!dog || !user || bookmarked[msg.timestamp]) return;
    const title = msg.content.replace(/[#*_`]/g, "").split("\n")[0].slice(0, 60);
    try {
      await base44.entities.Bookmark.create({
        dog_id: dog.id,
        owner: user.email,
        content: msg.content,
        source: "nutrition",
        title,
        created_at: new Date().toISOString(),
      });
      setBookmarked(prev => ({ ...prev, [msg.timestamp]: true }));
      toast.success("Sauvegardé !", { description: "Conseil ajouté à ta bibliothèque" });
    } catch {
      toast.error("Erreur", { description: "Impossible de sauvegarder" });
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard?.writeText(content).then(() => {
      toast.success("Copié !");
    }).catch(() => {});
  };

  const refreshPlans = async () => {
    if (!dog || !user) return;
    try {
      const nplans = await base44.entities.NutritionPlan.filter({ dog_id: dog.id, owner_email: user.email }, "-generated_at", 10).catch(() => []);
      const allP = nplans || [];
      setAllPlans(allP);
      const active = allP.find(p => p.is_active);
      setActivePlan(active || null);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      setMonthlyPlanCount(allP.filter(p => p.generated_at >= monthStart).length);
    } catch { /* ignore */ }
  };

  useEffect(() => { init(); }, []);
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const getTodayString = () => new Date().toISOString().split("T")[0];

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);

      if (!isUserPremium(u)) {
        const { msgCredits } = await initCredits(u);
        setMessagesRemaining(msgCredits);
      }

      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        const d = getActiveDog(dogs);
        setDog(d);
        const [scans, prefs, ckns, hrecs, dlogs, nplans] = await Promise.all([
          base44.entities.FoodScan.filter({ dog_id: d.id }, "-timestamp", 5).catch(() => []),
          base44.entities.DietPreferences.filter({ dog_id: d.id, owner_email: u.email }).catch(() => []),
          base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 7).catch(() => []),
          base44.entities.HealthRecord.filter({ dog_id: d.id }, "-date", 10).catch(() => []),
          base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 7).catch(() => []),
          base44.entities.NutritionPlan.filter({ dog_id: d.id, owner_email: u.email }, "-generated_at", 10).catch(() => []),
        ]);
        setRecentScans(scans || []);
        if (prefs?.length > 0) setDietPrefs(prefs[0]);
        setCheckins(ckns || []);
        setHealthRecords(hrecs || []);
        setDailyLogs(dlogs || []);
        const allP = nplans || [];
        setAllPlans(allP);
        const active = allP.find(p => p.is_active);
        setActivePlan(active || null);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        setMonthlyPlanCount(allP.filter(p => p.generated_at >= monthStart).length);
        const planInfo = active ? (() => {
          try {
            const pd = JSON.parse(active.plan_text);
            const elapsed = pd.start_date ? Math.floor((Date.now() - new Date(pd.start_date + "T00:00:00").getTime()) / 86400000) : null;
            const dayNum = elapsed !== null && elapsed >= 0 ? Math.min(elapsed + 1, 7) : null;
            const expired = elapsed !== null && elapsed >= 7;
            if (expired) return "\n\nTon plan repas est terminé ! Tu peux en générer un nouveau dans l'onglet **Plan repas**.";
            if (dayNum) return `\n\nTu as un **plan repas actif** (Jour ${dayNum}/7, ${pd.calories_per_day || "?"} kcal/jour). Je peux t'aider à l'ajuster ou répondre à tes questions dessus !`;
            return "";
          } catch { return ""; }
        })() : "";
        setMessages([{
          role: "assistant",
          content: `Bonjour ! \u{1F957} Je suis **NutriCoach**, ton expert nutrition pour **${d.name}** !\n\nJe connais son profil ${d.breed || ""}${d.weight ? ` de ${d.weight} kg` : ""}${d.allergies && d.allergies.toLowerCase() !== "non" ? ` avec des allergies à ${d.allergies}` : ""}, ses check-ins, son historique santé et ses préférences alimentaires.${planInfo}\n\nPose-moi une question, génère un **plan de repas personnalisé**, ou demande une **recommandation de croquettes** ! \u{1F356}`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error("Nutri init error:", err);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !dog || loading) return;
    if (!isUserPremium(user)) {
      if ((messagesRemaining ?? 0) <= 0) return;
    }

    if (navigator.vibrate) navigator.vibrate(10);

    setInput("");
    setLastFailedInput(null);
    setMessages(prev => [...prev, { role: "user", content, timestamp: new Date().toISOString() }]);
    setLoading(true);
    try {
      const contextMsgs = messages.slice(-15).map(m => ({ role: m.role, content: m.content }));
      contextMsgs.push({ role: "user", content });
      const response = await base44.functions.invoke("pawcoachChat", { dogId: dog.id, mode: "nutrition", messages: contextMsgs });
      if (response.data?.error === "quota_exceeded") { setMessagesRemaining(0); return; }
      const assistantContent = response.data?.content || "Désolé, je n'ai pas pu répondre.";
      const assistantTs = new Date().toISOString();

      startStreaming(assistantContent, assistantTs);

      if (!isUserPremium(user) && response.data?.messages_remaining !== undefined) {
        setMessagesRemaining(response.data.messages_remaining);
      }
    } catch (err) {
      console.error("Nutri send error:", err);
      if (err?.message?.includes?.("quota_exceeded") || err?.status === 429) { setMessagesRemaining(0); return; }
      setLastFailedInput(content);
      setMessages(prev => [...prev, { role: "assistant", content: "Oups, une erreur est survenue. Réessaie dans un instant.", timestamp: new Date().toISOString(), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-24">
        <div className="gradient-primary safe-pt-14 pb-4 px-5">
          <div className="h-3 w-16 bg-white/20 rounded animate-pulse mb-2" />
          <div className="h-7 w-36 bg-white/20 rounded animate-pulse" />
        </div>
        <BottomNav currentPage="Nutri" />
      </div>
    );
  }

  const isLimitReached = !isUserPremium(user) && (messagesRemaining ?? 0) <= 0;
  const showQuickActions = messages.length <= 1 && !isLimitReached;
  const quickActions = dog ? [
    `Plan de repas hebdomadaire pour ${dog.name}`,
    `Meilleures croquettes pour ${dog.breed || "mon chien"}`,
    `Quelle quantité donner à ${dog.name} ?`,
    `Aliments à éviter absolument`,
  ] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary safe-pt-14 pb-3 px-5 mt-8 overflow-hidden relative">
        <div className="relative z-10 flex items-end gap-3 mb-3">
          <div className="flex-1 pb-1">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl leading-tight">Nutrition</h1>
            {dog && <p className="text-white/70 text-xs mt-0.5">Pour {dog.name} &middot; {dog.breed}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {!isUserPremium(user) && messagesRemaining !== null && (
                <div className="bg-white/20 px-2.5 py-1 rounded-full">
                  <span className="text-white text-xs font-medium">{messagesRemaining} cr&eacute;dit{messagesRemaining !== 1 ? "s" : ""} IA</span>
                </div>
              )}
              {isUserPremium(user) && (
                <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-white text-xs font-medium">Premium</span>
                </div>
              )}
              {recentScans.length > 0 && (
                <div className="bg-white/20 px-2.5 py-1 rounded-full">
                  <span className="text-white text-xs font-medium">{"\u{1F50D}"} {recentScans.length} scans</span>
                </div>
              )}
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 flex-shrink-0"
          >
            <Illustration name="petFood" alt="Nutrition" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

        {/* Tabs — pill cards */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          {TABS.map(({ id, label, emoji, bg }) => {
            const active = activeTab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.93 }}
                transition={spring}
                onClick={() => changeTab(id)}
                className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl text-center overflow-hidden transition-all ${
                  active ? "shadow-lg" : "bg-white/10"
                }`}
              >
                {active && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-100`} />
                )}
                <span className="relative text-xl leading-none">{emoji}</span>
                <span className={`relative text-[10px] font-bold leading-tight ${active ? "text-white" : "text-white/75"}`}>{label}</span>
                {active && (
                  <motion.div
                    layoutId="nutriTabIndicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/60"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" custom={tabDir}>
        <motion.div
          key={activeTab}
          custom={tabDir}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="flex-1 flex flex-col"
        >

      {/* Tab: Scan */}
      {activeTab === "scan" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-5">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32"
          >
            <Illustration name="petFood" alt="Scanner" className="w-full h-full drop-shadow-lg" />
          </motion.div>
          <div className="text-center">
            <h2 className="font-bold text-foreground text-lg">Scanner un aliment</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Toxicit&eacute; d'un aliment brut ou analyse compl&egrave;te<br />
              d'une &eacute;tiquette nutritionnelle pour {dog?.name || "ton chien"}.
            </p>
          </div>
          <Button asChild className="gradient-primary border-0 text-white w-full max-w-xs h-13 rounded-xl font-bold shadow-lg shadow-primary/25">
            <Link to={createPageUrl("Scan")}>
              <ScanLine className="w-5 h-5 mr-2" />
              Ouvrir le Scanner
            </Link>
          </Button>
          {recentScans.length > 0 && (
            <p className="text-xs text-muted-foreground">{recentScans.length} scan{recentScans.length > 1 ? "s" : ""} r&eacute;cent{recentScans.length > 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      {/* Tab: Plan repas */}
      {activeTab === "mealplan" && (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
          <NutritionMealPlan dog={dog} recentScans={recentScans} isPremium={isUserPremium(user)} user={user} dietPrefs={dietPrefs} checkins={checkins} healthRecords={healthRecords} dailyLogs={dailyLogs} activePlan={activePlan} monthlyPlanCount={monthlyPlanCount} allPlans={allPlans} onPlanSaved={refreshPlans} onSwitchToCoach={(msg) => { changeTab("coach"); if (msg) setTimeout(() => setInput(msg), 300); }} />
        </div>
      )}

      {/* Tab: Preferences */}
      {activeTab === "prefs" && (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
          <DietPreferencesPanel dog={dog} user={user} />
        </div>
      )}

      {/* Tab: Comparateur */}
      {activeTab === "compare" && (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-28">
          <div className="mb-4">
            <h2 className="font-bold text-foreground text-base">Comparateur de produits</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scanne 2 emballages et l'IA compare leur composition pour {dog?.name || "ton chien"}
            </p>
          </div>
          <FoodComparator dog={dog} />
        </div>
      )}

      {/* Tab: NutriCoach chat */}
      {activeTab === "coach" && (
        <div className="flex-1 flex flex-col">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-44">
            {messages.map((msg, i) => (
              <div key={i}>
                {shouldShowDateSeparator(messages, i) && (
                  <div className="flex items-center gap-3 py-2 my-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      {getDateLabel(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                <motion.div {...msgAnim} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl" />
                  )}
                  <div className="flex flex-col gap-0.5 max-w-[82%]">
                    <div
                      data-selectable
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden break-words ${
                        msg.role === "user" ? "chat-bubble-user text-white rounded-br-sm" : "chat-bubble-assistant text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" components={mdComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 px-1 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/50">{getTimeStr(msg.timestamp)}</span>
                      {msg.role === "assistant" && !msg.isError && (
                        <>
                          <button
                            aria-label="Copier"
                            onClick={() => handleCopy(msg.content)}
                            className="text-muted-foreground/40 hover:text-primary transition-colors"
                            title="Copier"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            aria-label="Sauvegarder"
                            onClick={() => handleBookmark(msg)}
                            className="text-muted-foreground/40 hover:text-primary transition-colors"
                            title="Sauvegarder"
                          >
                            {bookmarked[msg.timestamp]
                              ? <BookmarkCheck className="w-3 h-3 text-primary" />
                              : <Bookmark className="w-3 h-3" />}
                          </button>
                        </>
                      )}
                      {msg.isError && lastFailedInput && (
                        <button
                          onClick={() => sendMessage(lastFailedInput)}
                          className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>R&eacute;essayer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}

            {/* Typewriter streaming message */}
            {isStreaming && streamingText && (
              <motion.div {...msgAnim} className="flex gap-2 justify-start">
                <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl" />
                <div className="flex flex-col gap-0.5 max-w-[82%]">
                  <div className="chat-bubble-assistant px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed text-foreground">
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" components={mdComponents}>
                      {streamingText}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Typing dots */}
            {((loading && !isStreaming) || (isStreaming && !streamingText)) && (
              <div className="flex gap-2 justify-start">
                <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl" />
                <div className="chat-bubble-assistant px-4 py-3.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-primary rounded-full" />
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 bg-primary rounded-full" />
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Scroll-to-bottom FAB */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="fixed bottom-40 right-5 z-40 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="fixed bottom-[4.5rem] left-0 right-0 bg-background border-t border-border">
            {isLimitReached ? (
              <div className="px-5 py-3">
                <div className="flex gap-2 justify-start mb-2">
                  <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl" />
                  <div className="max-w-[82%] px-4 py-3 rounded-2xl rounded-bl-sm chat-bubble-assistant text-foreground">
                    <p className="text-sm leading-relaxed">J'adorerais continuer ! {"\u{1F957}"} Tes cr&eacute;dits IA sont &eacute;puis&eacute;s pour aujourd'hui. Reviens demain ou passe en Premium.</p>
                    <Button onClick={() => navigate(createPageUrl("Premium") + "?from=nutrition")} size="sm" className="mt-2 bg-safe hover:bg-safe/90 border-0 text-white text-xs h-8">
                      Passer Premium &middot; d&egrave;s 5 &euro;/mois
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {showQuickActions && (
                  <div className="px-5 pt-3 pb-1">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {quickActions.map((s, i) => (
                        <motion.button key={i} whileTap={{ scale: 0.96 }} transition={spring} onClick={() => sendMessage(s)}
                          className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-xl border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                {!isUserPremium(user) && messagesRemaining !== null && (
                  <div className="flex items-center gap-1.5 px-5 pt-2 pb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[11px] text-muted-foreground font-medium">{messagesRemaining} credit{messagesRemaining !== 1 ? "s" : ""} restant{messagesRemaining !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="flex gap-2 px-5 py-3 items-end">
                  <textarea
                    aria-label="Votre message"
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    maxLength={2000}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder={dog ? `Question nutrition pour ${dog.name}...` : "Pose ta question..."}
                    rows={1}
                    className="flex-1 min-h-[44px] max-h-[120px] rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ lineHeight: "1.5" }}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading || isStreaming}
                    className="h-11 w-11 rounded-xl bg-safe hover:bg-safe/90 border-0 shadow-lg p-0 flex-shrink-0 self-end"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

        </motion.div>
      </AnimatePresence>

      <BottomNav currentPage="Nutri" />
    </div>
  );
}