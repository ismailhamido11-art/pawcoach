import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getActiveDog, createPageUrl } from "@/utils";
import BottomNav from "../components/BottomNav";
import ChatFAB from "../components/ChatFAB";
import WellnessBanner from "../components/WellnessBanner";
import NutritionMealPlan from "../components/nutrition/NutritionMealPlan";
import FoodComparator from "../components/nutrition/FoodComparator";
import DietPreferencesPanel from "../components/nutrition/DietPreferencesPanel";
import SavedPlansPanel from "../components/nutrition/SavedPlansPanel";
import { Button } from "@/components/ui/button";
import { Send, Salad, Bookmark, BookmarkCheck, ScanLine, Settings2, History } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import { isUserPremium } from "@/utils/premium";
import IconBadge from "@/components/ui/IconBadge";
import { InlineIcon } from "@/components/ui/IconBadge";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const msgAnim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 120, damping: 20 }
};

const TABS = [
  { id: "coach",    label: "NutriCoach", emoji: "🥗", bg: "from-emerald-500 to-teal-600" },
  { id: "mealplan", label: "Plan repas",  emoji: "📅", bg: "from-orange-500 to-amber-600" },
  { id: "saved",    label: "Mes plans",  emoji: "🗂️", bg: "from-primary to-accent" },
  { id: "prefs",    label: "Préférences", emoji: "⚙️", bg: "from-slate-500 to-slate-700" },
  { id: "compare",  label: "Comparer",   emoji: "⚖️", bg: "from-blue-500 to-indigo-600" },
  { id: "scan",     label: "Scanner",    emoji: "📷", bg: "from-violet-500 to-purple-600" },
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
  const [activeTab, setActiveTab] = useState("coach");
  const [messagesRemaining, setMessagesRemaining] = useState(null);
  const [bookmarked, setBookmarked] = useState({});
  const [dietPrefs, setDietPrefs] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

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

  useEffect(() => { init(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
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
        const today = getTodayString();
        const lastReset = u.messages_daily_reset;
        const remaining = u.messages_remaining ?? 20;
        if (remaining === null || remaining === undefined) {
          await base44.auth.updateMe({ messages_remaining: 20, messages_daily_reset: today });
          setMessagesRemaining(20);
        } else if (remaining <= 0 && lastReset !== today) {
          await base44.auth.updateMe({ messages_remaining: 2, messages_daily_reset: today });
          setMessagesRemaining(2);
        } else {
          setMessagesRemaining(remaining);
        }
      }

      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) {
        const d = getActiveDog(dogs);
        setDog(d);
        const scans = await base44.entities.FoodScan.filter({ dog_id: d.id }, "-timestamp", 5);
        setRecentScans(scans);
        const prefs = await base44.entities.DietPreferences.filter({ dog_id: d.id, owner_email: u.email });
        if (prefs.length > 0) setDietPrefs(prefs[0]);
        setMessages([{
          role: "assistant",
          content: `Bonjour ! 🥗 Je suis **NutriCoach**, ton expert nutrition pour **${d.name}** !\n\nJe connais son profil ${d.breed || ""}${d.weight ? ` de ${d.weight} kg` : ""}${d.allergies ? ` avec des allergies à ${d.allergies}` : ""} et j'ai accès à ses derniers scans alimentaires.\n\nPose-moi une question, génère un **plan de repas personnalisé**, ou demande une **recommandation de croquettes** ! 🍖`,
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
    setInput("");
    setMessages(prev => [...prev, { role: "user", content, timestamp: new Date().toISOString() }]);
    setLoading(true);
    try {
      const contextMsgs = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      contextMsgs.push({ role: "user", content });
      const response = await base44.functions.invoke("pawcoachChat", { dogId: dog.id, mode: "nutrition", messages: contextMsgs });
      if (response.data?.error === "quota_exceeded") { setMessagesRemaining(0); return; }
      const assistantContent = response.data?.content || "Désolé, je n'ai pas pu répondre.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() }]);
      if (!isUserPremium(user) && response.data?.messages_remaining !== undefined) {
        setMessagesRemaining(response.data.messages_remaining);
      }
    } catch (err) {
      console.error("Nutri send error:", err);
      if (err?.message?.includes?.("quota_exceeded") || err?.status === 429) { setMessagesRemaining(0); return; }
      setMessages(prev => [...prev, { role: "assistant", content: "Oups, une erreur est survenue. Réessaie dans un instant.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-24">
        <div className="gradient-primary pt-14 pb-4 px-5">
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
      <div className="gradient-primary pt-14 pb-3 px-5 mt-8 overflow-hidden relative">
        <div className="relative z-10 flex items-end gap-3 mb-3">
          <div className="flex-1 pb-1">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl leading-tight">Nutrition</h1>
            {dog && <p className="text-white/70 text-xs mt-0.5">Pour {dog.name} · {dog.breed}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {!isUserPremium(user) && messagesRemaining !== null && (
                <div className="bg-white/20 px-2.5 py-1 rounded-full">
                  <span className="text-white text-xs font-medium">{messagesRemaining} crédit{messagesRemaining !== 1 ? "s" : ""} IA</span>
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
                  <span className="text-white text-xs font-medium">🔍 {recentScans.length} scans</span>
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
                onClick={() => setActiveTab(id)}
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

      {/* Tab: Scan → link to Scan page */}
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
              Prends en photo n'importe quel aliment ou étiquette.<br />
              L'IA analyse la toxicité et la qualité pour {dog?.name || "ton chien"}.
            </p>
          </div>
          <Button asChild className="gradient-primary border-0 text-white w-full max-w-xs h-13 rounded-xl font-bold shadow-lg shadow-primary/25">
            <Link to={createPageUrl("Scan")}>
              <ScanLine className="w-5 h-5 mr-2" />
              Ouvrir le Scanner
            </Link>
          </Button>
          {recentScans.length > 0 && (
            <p className="text-xs text-muted-foreground">{recentScans.length} scan{recentScans.length > 1 ? "s" : ""} récent{recentScans.length > 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      {/* Tab: Plan repas */}
      {activeTab === "mealplan" && (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
          <NutritionMealPlan dog={dog} recentScans={recentScans} isPremium={isUserPremium(user)} user={user} dietPrefs={dietPrefs} />
        </div>
      )}

      {/* Tab: Mes plans sauvegardés */}
      {activeTab === "saved" && (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
          <SavedPlansPanel dog={dog} user={user} />
        </div>
      )}

      {/* Tab: Préférences alimentaires */}
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
        <div className="px-4 py-4">
          <div className="bg-white rounded-2xl shadow-md border border-border overflow-hidden">

            {/* Messages area */}
            <div className="h-[40vh] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-slate-50/50">
              {messages.map((msg, i) => (
                <motion.div key={i} {...msgAnim} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex flex-col gap-1 max-w-[82%]">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden break-words ${
                      msg.role === "user"
                        ? "chat-bubble-user text-white rounded-br-sm"
                        : "bg-white border border-border/50 text-foreground rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          components={{
                            p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                            li: ({ children }) => <li className="my-0.5">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleBookmark(msg)}
                        className="self-start ml-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        {bookmarked[msg.timestamp]
                          ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                          : <Bookmark className="w-3.5 h-3.5" />}
                        {bookmarked[msg.timestamp] ? "Sauvegardé" : "Sauvegarder"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl flex-shrink-0" />
                  <div className="bg-white border border-border/50 shadow-sm px-4 py-3.5 rounded-2xl rounded-bl-sm">
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

            {/* Quick actions */}
            {showQuickActions && (
              <div className="px-4 pt-3 pb-1 border-t border-slate-100">
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

            {/* Input area */}
            <div className="px-3 py-3 bg-white border-t border-slate-100">
              {isLimitReached ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-2">Crédits épuisés pour aujourd'hui 🥗</p>
                  <Button onClick={() => navigate(createPageUrl("Premium") + "?from=nutrition")} size="sm" className="bg-safe hover:bg-safe/90 border-0 text-white text-xs h-8">
                    Débloquer Premium ✨
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      maxLength={2000}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      placeholder={dog ? `Question nutrition pour ${dog.name}...` : "Pose ta question..."}
                      rows={1}
                      className="w-full min-h-[40px] max-h-[100px] rounded-full border border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5 text-sm resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ lineHeight: "1.4" }}
                    />
                  </div>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-full bg-safe hover:bg-safe/90 flex items-center justify-center flex-shrink-0 disabled:opacity-40 shadow-md"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav currentPage="Nutri" />
    </div>
  );
}