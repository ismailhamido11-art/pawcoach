import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Bot } from "lucide-react";

function getAge(birthDate) {
  if (!birthDate) return null;
  const now = new Date();
  const birth = new Date(birthDate);
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const total = years * 12 + months;
  if (total < 12) return `${total} mois`;
  return `${years} an${years > 1 ? "s" : ""}`;
}

const SUGGESTIONS = [
  "Quelle quantité donner à mon chien ?",
  "Mon chien gratte beaucoup, pourquoi ?",
  "Comment apprendre le rappel à mon chien ?",
  "Combien de sorties par jour ?",
  "Mon chien vomit, est-ce grave ?",
];

export default function Chat() {
  const [dog, setDog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async () => {
    const user = await base44.auth.me();
    const dogs = await base44.entities.Dog.filter({ owner: user.email });
    if (dogs.length > 0) {
      const d = dogs[0];
      setDog(d);
      const history = await base44.entities.ChatMessage.filter({ dog_id: d.id });
      const sorted = history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      if (sorted.length === 0) {
        const welcome = {
          role: "assistant",
          content: `Bonjour ! Je suis PawCoach, votre coach bien-être pour **${d.name}** 🐾\n\nJe connais le profil de ${d.name} : ${d.breed}${getAge(d.birth_date) ? `, ${getAge(d.birth_date)}` : ""}${d.weight ? `, ${d.weight} kg` : ""}. Je suis là pour vous aider avec la nutrition, le comportement, l'entraînement et le bien-être.\n\nQue puis-je faire pour vous aujourd'hui ?`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcome]);
      } else {
        setMessages(sorted);
      }
    }
    setInitializing(false);
  };

  const buildSystemPrompt = (d) => {
    return `Tu es PawCoach, un coach bien-être canin bienveillant et expert, qui répond en français. 
Tu connais parfaitement le profil du chien de l'utilisateur :
- Nom : ${d.name}
- Race : ${d.breed}
- Âge : ${getAge(d.birth_date) || "inconnu"}
- Poids : ${d.weight ? d.weight + " kg" : "inconnu"}
- Sexe : ${d.sex === "male" ? "Mâle" : d.sex === "female" ? "Femelle" : "inconnu"}${d.neutered ? " (stérilisé)" : ""}
- Niveau d'activité : ${d.activity_level || "inconnu"}
- Environnement : ${d.environment || "inconnu"}
- Allergies : ${d.allergies || "aucune connue"}
- Problèmes de santé : ${d.health_issues || "aucun connu"}
- Autres animaux : ${d.other_animals ? "oui" : "non"}

RÈGLES IMPORTANTES :
1. Tu es un COACH BIEN-ÊTRE, pas un vétérinaire. Rappelle-le si nécessaire.
2. Pour tout symptôme grave, recommande toujours de consulter un vétérinaire.
3. Personnalise tes réponses au profil de ${d.name}.
4. Réponds de façon chaleureuse, courte et pratique. Utilise des émojis avec parcimonie.
5. Ne pose jamais de diagnostic médical.`;
  };

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || !dog) return;
    setInput("");

    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Save user message
    await base44.entities.ChatMessage.create({ dog_id: dog.id, ...userMsg });

    // Build conversation history for API
    const history = messages
      .filter(m => m.role !== "assistant" || m.content !== messages[0]?.content)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `${buildSystemPrompt(dog)}\n\n--- Historique de conversation ---\n${history.map(m => `${m.role === "user" ? "Utilisateur" : "PawCoach"}: ${m.content}`).join("\n")}\n\nUtilisateur: ${content}\n\nPawCoach:`,
    });

    const assistantMsg = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    await base44.entities.ChatMessage.create({ dog_id: dog.id, ...assistantMsg });
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="text-4xl animate-bounce-soft block">🐾</span>
          <p className="text-muted-foreground text-sm">Chargement du chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WellnessBanner />

      {/* Header */}
      <div className="gradient-primary pt-10 pb-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">PawCoach Chat</h1>
            {dog && (
              <p className="text-white/70 text-xs">Personnalisé pour {dog.name} · {dog.breed}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-white text-xs font-medium">En ligne</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">🐾</span>
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "chat-bubble-user text-white rounded-br-sm"
                  : "chat-bubble-assistant text-foreground rounded-bl-sm"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm">🐾</span>
            </div>
            <div className="chat-bubble-assistant px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: "200ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-xl border border-border hover:border-primary hover:text-primary transition-all tap-scale"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Posez votre question sur votre chien..."
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