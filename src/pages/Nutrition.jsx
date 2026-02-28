import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import WellnessBanner from "../components/WellnessBanner";
import NutritionMealPlan from "../components/nutrition/NutritionMealPlan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Salad, MessageCircle, CalendarRange } from "lucide-react";
import { DogChef } from "../components/ui/PawIllustrations";
import IconBadge from "@/components/ui/IconBadge";
import { InlineIcon } from "@/components/ui/IconBadge";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const msgAnim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 120, damping: 20 } };

export default function Nutrition() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [messagesRemaining, setMessagesRemaining] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const getTodayString = () => new Date().toISOString().split("T")[0];

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);

      // Shared quota pool with Chat
      if (!u.is_premium) {
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
        const d = dogs[0];
        setDog(d);
        const scans = await base44.entities.FoodScan.filter({ dog_id: d.id }, "-timestamp", 5);
        setRecentScans(scans);

        setMessages([{
          role: "assistant",
          content: `Bonjour ! 🥗 Je suis **NutriCoach**, ton expert nutrition pour **${d.name}** !\n\nJe connais son profil ${d.breed || ""}${d.weight ? ` de ${d.weight} kg` : ""}${d.allergies ? ` avec des allergies à ${d.allergies}` : ""} et j'ai accès à ses derniers scans alimentaires.\n\nPose-moi une question, génère un **plan de repas personnalisé**, ou demande une **recommandation de croquettes** ! 🍖`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error("Nutrition init error:", err);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !dog || loading) return;
    if (!user?.is_premium) {
      const remaining = messagesRemaining ?? 0;
      if (remaining <= 0) return;
    }

    setInput("");
    setMessages(prev => [...prev, { role: "user", content, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const contextMsgs = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      contextMsgs.push({ role: "user", content });

      const response = await base44.functions.invoke("pawcoachChat", {
        dogId: dog.id,
        mode: "nutrition",
        messages: contextMsgs,
      });

      const assistantContent = response.data?.content || "Désolé, je n'ai pas pu répondre.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() }]);

      if (!user?.is_premium) {
        const newRemaining = Math.max(0, (messagesRemaining ?? 0) - 1);
        setMessagesRemaining(newRemaining);
        await base44.auth.updateMe({ messages_remaining: newRemaining, messages_daily_reset: getTodayString() });
      }
    } catch (err) {
      console.error("Nutrition send error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Oups, une erreur est survenue. Réessaie dans un instant.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-7 bg-muted" />
        <div className="gradient-primary pt-10 pb-3 px-5 mt-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 animate-pulse" />
            <div className="space-y-2"><div className="h-4 w-24 bg-white/20 rounded animate-pulse" /><div className="h-3 w-32 bg-white/10 rounded animate-pulse" /></div>
          </div>
        </div>
        <div className="flex-1 px-5 py-4 space-y-4">
          <div className="flex gap-2"><div className="w-8 h-8 rounded-xl bg-muted animate-pulse" /><div className="h-20 w-4/5 bg-muted animate-pulse rounded-2xl" /></div>
        </div>
        <BottomNav currentPage="Nutrition" />
      </div>
    );
  }

  const quickActions = dog ? [
    `Plan de repas hebdomadaire pour ${dog.name}`,
    `Meilleures croquettes pour ${dog.breed || "mon chien"}`,
    `Quelle quantité donner à ${dog.name} ?`,
    `Aliments à éviter absolument`,
  ] : [];

  const isNutriLimitReached = !user?.is_premium && (messagesRemaining ?? 0) <= 0;
  const showQuickActions = messages.length <= 1 && !isNutriLimitReached;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary pt-10 pb-3 px-5 mt-7">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Salad className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">NutriCoach</h1>
            {dog && <p className="text-white/70 text-xs">Coach nutrition IA pour {dog.name}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!user?.is_premium && messagesRemaining !== null && (
              <div className="bg-white/20 px-2.5 py-1 rounded-full">
                <span className="text-white text-xs font-medium">
                  {messagesRemaining} msg restant{messagesRemaining !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {user?.is_premium && (
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

        {/* Tabs */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === "chat" ? "bg-white text-primary" : "bg-white/10 text-white"}`}
          >
            <InlineIcon icon={MessageCircle} color={activeTab === "chat" ? "hsl(168,55%,38%)" : "#fff"} size={12} className="mr-1" /> Chat Nutrition
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => setActiveTab("mealplan")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === "mealplan" ? "bg-white text-primary" : "bg-white/10 text-white"}`}
          >
            <InlineIcon icon={CalendarRange} color={activeTab === "mealplan" ? "hsl(168,55%,38%)" : "#fff"} size={12} className="mr-1" /> Plan de repas IA
          </motion.button>
        </div>
      </div>

      {activeTab === "mealplan" ? (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
          <NutritionMealPlan dog={dog} recentScans={recentScans} isPremium={user?.is_premium} />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-44">
            {messages.map((msg, i) => (
              <motion.div key={i} {...msgAnim} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl" />
                )}
                <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" ? "chat-bubble-user text-white rounded-br-sm" : "chat-bubble-assistant text-foreground rounded-bl-sm"
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
              </motion.div>
            ))}

            {loading && (
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

          {/* Bottom input */}
          <div className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border">
            {isNutriLimitReached ? (
              <div className="px-5 py-3 space-y-3">
                <div className="flex gap-2 justify-start">
                  <IconBadge icon={Salad} color="#10b981" size="sm" className="mt-1 !w-8 !h-8 !rounded-xl" />
                  <div className="max-w-[82%] px-4 py-3 rounded-2xl rounded-bl-sm chat-bubble-assistant text-foreground">
                    <p className="text-sm leading-relaxed">
                      J'adorerais continuer à conseiller <strong>{dog?.name || "ton chien"}</strong> sur sa nutrition ! 🥗 Tes messages gratuits sont épuisés pour aujourd'hui. Reviens demain pour 2 messages offerts, ou passe en Premium pour un coaching illimité !
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => window.location.href = '/Premium?from=chat'} size="sm" className="bg-safe hover:bg-safe/90 border-0 text-white text-xs h-8">
                        Débloquer Premium ✨
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground">
                        À demain ! 👋
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-0 py-0">
                  <Input
                    disabled
                    placeholder="Reviens demain ou passe Premium..."
                    className="flex-1 h-11 rounded-xl border-border bg-muted/30 opacity-60"
                  />
                </div>
              </div>
            ) : (
              <>
                {showQuickActions && (
                  <div className="px-5 pt-3 pb-1">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {quickActions.map((s, i) => (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.96 }}
                          transition={spring}
                          onClick={() => sendMessage(s)}
                          className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-xl border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 px-5 py-3">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={dog ? `Question nutrition pour ${dog.name}...` : "Posez votre question..."}
                    className="flex-1 h-11 rounded-xl border-border bg-muted/30"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="h-11 w-11 rounded-xl bg-safe hover:bg-safe/90 border-0 shadow-lg p-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <BottomNav currentPage="Nutrition" />
    </div>
  );
}