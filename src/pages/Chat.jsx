import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot } from "lucide-react";

function getAge(birthDate) {
  if (!birthDate) return null;
  const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
  return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
}

function buildSystemPrompt(d) {
  const activityMap = { faible: "Faible", modere: "Modérée", eleve: "Élevée", tres_eleve: "Très élevée" };
  const envMap = { appartement: "Appartement", maison_sans_jardin: "Maison sans jardin", maison_avec_jardin: "Maison avec jardin" };
  return `Tu es PawCoach, le coach bien-être et dressage canin personnel de l'utilisateur.
PROFIL DU CHIEN:
Prénom: ${d.name}
Race: ${d.breed || "inconnue"}
Age: ${getAge(d.birth_date) || "inconnu"}
Poids: ${d.weight ? d.weight + " kg" : "inconnu"}
Sexe: ${d.sex === "male" ? "Mâle" : d.sex === "female" ? "Femelle" : "inconnu"}
Stérilisé: ${d.neutered ? "Oui" : "Non"}
Activité: ${activityMap[d.activity_level] || "inconnue"}
Environnement: ${envMap[d.environment] || "inconnu"}
Allergies: ${d.allergies || "aucune"}
Problèmes connus: ${d.health_issues || "aucun"}

RÈGLES:
1) Tu es un coach informatif, PAS vétérinaire.
2) Tu ne diagnostiques JAMAIS.
3) Tu ne prescris JAMAIS de médicaments.
4) Si symptômes sérieux, dis: "Contacte ton vétérinaire ou le centre antipoison animal : 04 78 87 10 40"
5) Disclaimer UNIQUEMENT si ta réponse concerne la santé.
6) Personnalise avec le prénom du chien.
7) Tutoiement, chaleureux, concis.
8) Si photo, décris ce que tu observes sans diagnostiquer.`;
}

export default function Chat() {
  const [dog, setDog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { initChat(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const initChat = async () => {
    const user = await base44.auth.me();
    const dogs = await base44.entities.Dog.filter({ owner: user.email });
    if (dogs.length > 0) {
      const d = dogs[0];
      setDog(d);
      const history = await base44.entities.ChatMessage.filter({ dog_id: d.id });
      const sorted = history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      if (sorted.length === 0) {
        setMessages([{
          role: "assistant",
          content: `Bonjour ! 🐾 Je suis PawCoach, ton coach bien-être pour **${d.name}**.\n\nJe connais son profil : ${d.breed}${getAge(d.birth_date) ? `, ${getAge(d.birth_date)}` : ""}${d.weight ? `, ${d.weight} kg` : ""}.\n\nPose-moi n'importe quelle question sur sa nutrition, son comportement ou son dressage !`,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(sorted);
      }
    }
    setInitializing(false);
  };

  const getSuggestions = (d) => {
    if (!d) return [];
    return [
      `Comment dresser ${d.name} ?`,
      `Que peut manger ${d.name} ?`,
      `Exercices pour ${d.breed || "mon chien"}`,
      `Signes de stress à surveiller`,
    ];
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !dog) return;
    setInput("");

    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await base44.entities.ChatMessage.create({ dog_id: dog.id, ...userMsg });

    // Build last 10 messages for context (excluding welcome)
    const contextMsgs = [...messages, userMsg]
      .filter(m => m.role === "user" || messages.indexOf(m) > 0)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const response = await base44.functions.invoke("pawcoachChat", {
      systemPrompt: buildSystemPrompt(dog),
      messages: contextMsgs,
    });

    const assistantContent = response.data?.content || "Désolé, je n'ai pas pu répondre.";
    const assistantMsg = { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() };

    setMessages(prev => [...prev, assistantMsg]);
    await base44.entities.ChatMessage.create({ dog_id: dog.id, ...assistantMsg });
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="text-4xl block animate-bounce">🐾</span>
          <p className="text-muted-foreground text-sm">Chargement du chat...</p>
        </div>
      </div>
    );
  }

  const suggestions = getSuggestions(dog);
  const showSuggestions = messages.length <= 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Wellness banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center">
        <p className="text-xs text-amber-700 font-medium">🐾 PawCoach est un coach bien-être, pas un vétérinaire.</p>
      </div>

      {/* Header */}
      <div className="gradient-primary pt-10 pb-4 px-5 mt-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Assistant IA</h1>
            {dog && <p className="text-white/70 text-xs">Personnalisé pour {dog.name} · {dog.breed}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-white text-xs font-medium">En ligne</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-40">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">🐾</span>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "chat-bubble-user text-white rounded-br-sm"
                : "chat-bubble-assistant text-foreground rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm">🐾</span>
            </div>
            <div className="chat-bubble-assistant px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom area: suggestions + input */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border">
        {showSuggestions && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {suggestions.map((s, i) => (
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
            placeholder={`Question sur ${dog?.name || "votre chien"}...`}
            className="flex-1 h-11 rounded-xl border-border bg-muted/30"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="h-11 w-11 rounded-xl gradient-primary border-0 shadow-lg shadow-primary/30 p-0"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      <BottomNav currentPage="Chat" />
    </div>
  );
}