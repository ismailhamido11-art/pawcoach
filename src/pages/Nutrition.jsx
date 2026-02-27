import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import WellnessBanner from "../components/WellnessBanner";
import NutritionMealPlan from "../components/nutrition/NutritionMealPlan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Salad } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Nutrition() {
  const [dog, setDog] = useState(null);
  const [user, setUser] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const bottomRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
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
    if (!user?.is_premium && messages.length > 20) return;

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-4xl block animate-bounce">🥗</span>
      </div>
    );
  }

  const quickActions = dog ? [
    `Plan de repas hebdomadaire pour ${dog.name}`,
    `Meilleures croquettes pour ${dog.breed || "mon chien"}`,
    `Quelle quantité donner à ${dog.name} ?`,
    `Aliments à éviter absolument`,
  ] : [];

  const showQuickActions = messages.length <= 1;

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
          {recentScans.length > 0 && (
            <div className="ml-auto bg-white/20 px-2.5 py-1 rounded-full">
              <span className="text-white text-xs font-medium">🔍 {recentScans.length} scans</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "chat" ? "bg-white text-primary" : "bg-white/10 text-white"}`}
          >
            💬 Chat Nutrition
          </button>
          <button
            onClick={() => setActiveTab("mealplan")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "mealplan" ? "bg-white text-primary" : "bg-white/10 text-white"}`}
          >
            🗓️ Plan de repas IA
          </button>
        </div>
      </div>

      {activeTab === "mealplan" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <NutritionMealPlan dog={dog} recentScans={recentScans} isPremium={user?.is_premium} />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-44">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 mt-1 text-base">🥗</div>
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
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 mt-1 text-base">🥗</div>
                <div className="chat-bubble-assistant px-4 py-3.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Bottom input */}
          <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border">
            {showQuickActions && (
              <div className="px-4 pt-3 pb-1">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickActions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-xl border border-border hover:border-primary hover:text-primary transition-all tap-scale whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 px-4 py-3">
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
                className="h-11 w-11 rounded-xl bg-green-600 hover:bg-green-700 border-0 shadow-lg p-0"
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </>
      )}

      <BottomNav currentPage="Nutrition" />
    </div>
  );
}
