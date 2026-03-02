import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Camera, Bookmark, BookmarkCheck } from "lucide-react";
import { DogChat } from "../components/ui/PawIllustrations";
import VoiceInput from "@/components/ui/VoiceInput";
import ReactMarkdown from "react-markdown";
import { updateStreakSilently } from "../components/streakHelper";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const msgAnim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 120, damping: 20 } };

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

  const [bookmarked, setBookmarked] = useState({});
  const helpSent = useRef(false);
  const textareaRef = useRef(null);

  const handleBookmark = async (msg) => {
    if (!dog || !user || bookmarked[msg.timestamp]) return;
    const title = msg.content.replace(/[#*_`]/g, "").split("\n")[0].slice(0, 60);
    try {
      await base44.entities.Bookmark.create({
        dog_id: dog.id,
        owner: user.email,
        content: msg.content,
        source: "chat",
        title,
        created_at: new Date().toISOString(),
      });
      setBookmarked(prev => ({ ...prev, [msg.timestamp]: true }));
      toast.success("Sauvegardé !", { description: "Conseil ajouté à ta bibliothèque" });
    } catch {
      toast.error("Erreur", { description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  useEffect(() => { initChat(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

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
        const [history, existingBookmarks] = await Promise.all([
          base44.entities.ChatMessage.filter({ dog_id: d.id }),
          base44.entities.Bookmark.filter({ dog_id: d.id, owner: u.email, source: "chat" }),
        ]);
        const bookmarkSet = {};
        (existingBookmarks || []).forEach(b => { bookmarkSet[b.content] = true; });
        const sorted = history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const initialBookmarked = {};
        sorted.forEach(m => { if (m.role === "assistant" && bookmarkSet[m.content]) initialBookmarked[m.timestamp] = true; });
        setBookmarked(initialBookmarked);
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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-7 bg-accent/10" />
        <div className="gradient-primary pt-10 pb-4 px-5 mt-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 animate-pulse" />
            <div className="space-y-2"><div className="h-4 w-24 bg-white/20 rounded animate-pulse" /><div className="h-3 w-32 bg-white/10 rounded animate-pulse" /></div>
          </div>
        </div>
        <div className="flex-1 px-5 py-4 space-y-4">
          <div className="flex gap-2"><div className="w-8 h-8 rounded-xl bg-muted animate-pulse" /><div className="h-16 w-3/4 bg-muted animate-pulse rounded-2xl" /></div>
          <div className="flex gap-2 justify-end"><div className="h-10 w-1/2 bg-muted animate-pulse rounded-2xl" /></div>
          <div className="flex gap-2"><div className="w-8 h-8 rounded-xl bg-muted animate-pulse" /><div className="h-24 w-4/5 bg-muted animate-pulse rounded-2xl" /></div>
        </div>
        <BottomNav currentPage="Chat" />
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-accent/10 backdrop-blur-sm border-b border-accent/20 px-5 py-1.5 text-center">
        <p className="text-xs text-accent-foreground font-medium">🐾 PawCoach est un coach bien-être, pas un vétérinaire.</p>
      </div>

      <div className="gradient-primary pt-10 pb-0 px-5 mt-8 overflow-hidden">
        <div className="flex items-end gap-3">
          <div className="flex-1 pb-4">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">PawCoach</p>
            <h1 className="text-white font-black text-2xl leading-tight">Assistant IA</h1>
            {dog && <p className="text-white/70 text-xs mt-0.5">Personnalisé pour {dog.name} · {dog.breed}</p>}
          </div>
          <div className="w-20 h-20 flex-shrink-0">
            <DogChat color="#bfdbfe" />
          </div>
          {!user?.is_premium && messagesRemaining !== null && (
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full">
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-44">
        {messages.map((msg, i) => (
          <motion.div key={i} {...msgAnim} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 flex-shrink-0 mt-1">
                <DogChat color="#2d9f82" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[82%]">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
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
            <div className="w-8 h-8 flex-shrink-0 mt-1">
              <DogChat color="#2d9f82" />
            </div>
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

      <div className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border">
        {showSuggestions && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {suggestions.map((s, i) => (
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

        {isLimitReached ? (
          <div className="px-5 py-3 space-y-3">
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 flex-shrink-0 mt-1">
                <DogChat color="#2d9f82" />
              </div>
              <div className="max-w-[82%] px-4 py-3 rounded-2xl rounded-bl-sm chat-bubble-assistant text-foreground">
                <p className="text-sm leading-relaxed">
                  J'adorerais continuer à t'aider avec <strong>{dog?.name || "ton chien"}</strong> ! 🐾 Tes messages gratuits sont épuisés pour aujourd'hui. Reviens demain pour 2 messages offerts, ou passe en Premium pour qu'on discute sans limite !
                </p>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => navigate(createPageUrl("Premium") + "?from=chat")} size="sm" className="gradient-primary border-0 text-white text-xs h-8">
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
            {pendingImage && (
              <div className="px-5 pt-2 flex items-center gap-2">
                <img src={pendingImage.preview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
                <span className="text-xs text-muted-foreground">Photo prête à envoyer</span>
                <button onClick={() => { if (pendingImage?.preview) URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }} className="ml-auto text-xs text-destructive">Retirer</button>
              </div>
            )}
            <div className="flex gap-2 px-5 py-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={() => fileInputRef.current?.click()}
                className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 hover:bg-secondary/80 transition-colors border border-border"
              >
                <Camera className="w-5 h-5 text-secondary-foreground" />
              </motion.button>
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