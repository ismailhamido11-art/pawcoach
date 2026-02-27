import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Camera, Lock } from "lucide-react";
import VoiceInput from "@/components/ui/VoiceInput";
import ReactMarkdown from "react-markdown";
import { updateStreakSilently } from "../components/streakHelper";

function getAge(birthDate) {
  if (!birthDate) return null;
  const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
  return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [messagesRemaining, setMessagesRemaining] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const helpSent = useRef(false);

  useEffect(() => { initChat(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!initializing && dog && !helpSent.current) {
      const params = new URLSearchParams(window.location.search);
      const helpMsg = params.get("help");
      if (helpMsg) {
        helpSent.current = true;
        sendMessage(decodeURIComponent(helpMsg));
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [initializing, dog]);

  const initChat = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);

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
    } catch (err) {
      console.error("Chat init error:", err);
    } finally {
      setInitializing(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (pendingImage?.preview) URL.revokeObjectURL(pendingImage.preview);
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    const hasImage = !!pendingImage;
    if (!content && !hasImage) return;
    if (!dog) return;

    if (!user?.is_premium) {
      const remaining = messagesRemaining ?? 0;
      if (remaining <= 0) return;
    }

    setInput("");
    const imageToSend = pendingImage;
    setPendingImage(null);

    const userMsg = {
      role: "user",
      content: content || "📷 Photo envoyée",
      timestamp: new Date().toISOString(),
      has_image: hasImage,
      image_url: imageToSend?.preview || null,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let uploadedImageUrl = null;
      if (imageToSend) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageToSend.file });
        uploadedImageUrl = file_url;
        if (imageToSend.preview) URL.revokeObjectURL(imageToSend.preview);
      }

      await base44.entities.ChatMessage.create({
        dog_id: dog.id,
        role: "user",
        content: userMsg.content,
        timestamp: userMsg.timestamp,
        has_image: hasImage,
        image_url: uploadedImageUrl || null,
      });

      const contextMsgs = messages
        .slice(-9)
        .map(m => ({ role: m.role, content: m.content }));
      contextMsgs.push({ role: "user", content: content || "Analyse cette photo." });

      const response = await base44.functions.invoke("pawcoachChat", {
        dogId: dog.id,
        messages: contextMsgs,
        imageUrl: uploadedImageUrl || null,
      });

      const assistantContent = response.data?.content || "Désolé, je n'ai pas pu répondre.";
      const assistantMsg = { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() };

      setMessages(prev => [...prev, assistantMsg]);
      await base44.entities.ChatMessage.create({ dog_id: dog.id, ...assistantMsg });

      if (!user?.is_premium) {
        const newRemaining = Math.max(0, (messagesRemaining ?? 0) - 1);
        setMessagesRemaining(newRemaining);
        await base44.auth.updateMe({ messages_remaining: newRemaining, messages_daily_reset: getTodayString() });
      }

      // --- STREAK UPDATE (once per day, after successful message) ---
      await updateStreakSilently(dog.id, user.email);
    } catch (err) {
      console.error("Chat send error:", err);
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
        <div className="text-center space-y-3">
          <span className="text-4xl block animate-bounce">🐾</span>
          <p className="text-muted-foreground text-sm">Chargement du chat...</p>
        </div>
      </div>
    );
  }

  const isLimitReached = !user?.is_premium && (messagesRemaining ?? 0) <= 0;
  const showSuggestions = messages.length <= 1 && !isLimitReached;
  const suggestions = dog ? [
    `Comment dresser ${dog.name} ?`,
    `Que peut manger ${dog.name} ?`,
    `Exercices pour ${dog.breed || "mon chien"}`,
    `Signes de stress à surveiller`,
  ] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center">
        <p className="text-xs text-amber-700 font-medium">🐾 PawCoach est un coach bien-être, pas un vétérinaire.</p>
      </div>

      <div className="gradient-primary pt-10 pb-4 px-5 mt-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Assistant IA</h1>
            {dog && <p className="text-white/70 text-xs">Personnalisé pour {dog.name} · {dog.breed}</p>}
          </div>
          {!user?.is_premium && messagesRemaining !== null && (
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
              <span className="text-white text-xs font-medium">
                {messagesRemaining} msg restant{messagesRemaining !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {user?.is_premium && (
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              <span className="text-white text-xs font-medium">Premium</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-44">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">🐾</span>
              </div>
            )}
            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "chat-bubble-user text-white rounded-br-sm"
                : "chat-bubble-assistant text-foreground rounded-bl-sm"
            }`}>
              {msg.has_image && msg.image_url && (
                <img src={msg.image_url} alt="photo" className="w-full rounded-xl mb-2 max-h-48 object-cover" />
              )}
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
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm">\ud83d\udc3e</span>
            </div>
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

        {isLimitReached ? (
          <div className="mx-4 my-3 bg-muted rounded-2xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Messages gratuits utilisés</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tu as utilisé tes messages gratuits. Passe en Premium pour discuter sans limite, ou reviens demain (2 messages offerts).</p>
              <Button onClick={() => window.location.href = '/Premium'} size="sm" className="mt-2 gradient-primary border-0 text-white text-xs h-8">
                Passer en Premium ✨
              </Button>
            </div>
          </div>
        ) : (
          <>
            {pendingImage && (
              <div className="px-4 pt-2 flex items-center gap-2">
                <img src={pendingImage.preview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
                <span className="text-xs text-muted-foreground">Photo prête à envoyer</span>
                <button onClick={() => { if (pendingImage?.preview) URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }} className="ml-auto text-xs text-destructive">Retirer</button>
              </div>
            )}
            <div className="flex gap-2 px-4 py-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 hover:bg-secondary/80 transition-all tap-scale border border-border"
              >
                <Camera className="w-5 h-5 text-secondary-foreground" />
              </button>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={dog ? `Question sur ${dog.name}...` : "Posez votre question..."}
                className="flex-1 h-11 rounded-xl border-border bg-muted/30"
              />
              <VoiceInput onTranscript={(text) => setInput(text)} className="h-11 w-11 !rounded-xl border border-border" />
              <Button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !pendingImage) || loading}
                className="h-11 w-11 rounded-xl gradient-primary border-0 shadow-lg shadow-primary/30 p-0"
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav currentPage="Chat" />
    </div>
  );
}