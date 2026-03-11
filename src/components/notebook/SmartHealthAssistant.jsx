import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  Mic, Camera, X, Check, Loader2, Sparkles,
  Keyboard, ChevronRight, ExternalLink, MapPin, Phone, AlertCircle, Send, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { isUserPremium } from "@/utils/premium";
import { initCredits, consumeMessageCredit } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

// Sound utility — reuse AudioContext to prevent memory leak
let _audioCtx = null;
const playPop = () => {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

function getTimeStr(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function SmartHealthAssistant({ dogId, onRecordAdded }) {
  // Credits
  const [msgCredits, setMsgCredits] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [hasSaved, setHasSaved] = useState(false);

  // Typewriter streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const streamingRef = useRef({ fullText: "", words: [], wordIndex: 0, timer: null, meta: {} });

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingRecordsRef = useRef([]);

  // Keep ref in sync for unmount auto-save
  useEffect(() => {
    pendingRecordsRef.current = pendingRecords;
  }, [pendingRecords]);

  // Auto-save pending records on unmount (prevents data loss on navigation)
  useEffect(() => {
    return () => {
      if (pendingRecordsRef.current.length > 0 && dogId) {
        pendingRecordsRef.current.forEach(rec => {
          base44.entities.HealthRecord.create({ dog_id: dogId, ...rec }).catch(() => {});
        });
      }
    };
  }, [dogId]);

  // Warn before closing page with unsaved records
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingRecordsRef.current.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Load credits
  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (isUserPremium(user)) {
          setIsPremium(true);
        } else {
          const { msgCredits: mc } = await initCredits(user);
          setMsgCredits(mc);
        }
      } catch (e) { console.warn("SmartHealthAssistant credits init error:", e?.message || String(e)); }
    })();
  }, []);

  // Auto-start conversation when dogId is available
  useEffect(() => {
    if (dogId && messages.length === 0) {
      processConversation([]);
    }
  }, [dogId]);

  // Scroll to bottom — only within the chat container, never the page
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isProcessing, streamingText]);

  // Cleanup SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
    };
  }, []);

  // Cleanup streaming timer on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current.timer) clearInterval(streamingRef.current.timer);
    };
  }, []);

  // --- Typewriter ---
  const startStreaming = useCallback((fullText, meta = {}, onComplete = null) => {
    const words = fullText.split(/(\s+)/);
    streamingRef.current = { fullText, words, wordIndex: 0, timer: null, meta, onComplete };
    setIsStreaming(true);
    setStreamingText("");
    const timer = setInterval(() => {
      const data = streamingRef.current;
      data.wordIndex += 2;
      if (data.wordIndex >= data.words.length) {
        clearInterval(timer);
        const finalText = data.fullText;
        const finalMeta = data.meta;
        const cb = data.onComplete;
        streamingRef.current = { fullText: "", words: [], wordIndex: 0, timer: null, meta: {} };
        setIsStreaming(false);
        setStreamingText("");
        setMessages(prev => [...prev, { role: "assistant", content: finalText, timestamp: new Date().toISOString(), ...finalMeta }]);
        playPop();
        if (cb) cb();
        return;
      }
      setStreamingText(data.words.slice(0, data.wordIndex).join(""));
    }, 30);
    streamingRef.current.timer = timer;
  }, []);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { ...msg, timestamp: msg.timestamp || new Date().toISOString() }]);
    if (msg.role === "assistant") playPop();
  };

  const handleCopy = (content) => {
    navigator.clipboard?.writeText(content).then(() => {
      toast.success("Copi\u00e9 !");
    }).catch(() => {});
  };

  const processConversation = async (newMessages) => {
    setIsProcessing(true);
    try {
      const { data } = await base44.functions.invoke("processHealthInput", {
        messages: newMessages,
        dogId
      });

      setShowScanner(!!data.suggest_scan);

      if (data.records_to_save && data.records_to_save.length > 0) {
        setPendingRecords(prev => {
          const newRecs = [...prev];
          data.records_to_save.forEach(rec => {
            if (!newRecs.find(r => r.title === rec.title && r.date === rec.date)) {
              newRecs.push(rec);
            }
          });
          return newRecs;
        });
      }

      if (data.is_finished) {
        setIsFinished(true);
      }

      if (data.next_question) {
        startStreaming(data.next_question, { show_vet_map: data.show_vet_map }, () => {
          if (data.suggested_actions && Array.isArray(data.suggested_actions)) {
            setSuggestedActions(data.suggested_actions);
          } else {
            setSuggestedActions([]);
          }
        });
      } else {
        if (data.suggested_actions && Array.isArray(data.suggested_actions)) {
          setSuggestedActions(data.suggested_actions);
        } else {
          setSuggestedActions([]);
        }
      }

    } catch (e) {
      console.error("SmartHealthAssistant error:", e);
      const errMsg = e?.response?.data?.error || e?.message || "Erreur inconnue";
      addMessage({ role: "assistant", content: `Oups, erreur : ${errMsg}. On peut r\u00e9essayer ?` });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLimitReached = !isPremium && msgCredits !== null && msgCredits <= 0;

  const handleSend = async (text = inputValue, image = null) => {
    if ((!text && !image) || isProcessing || isStreaming) return;
    if (isLimitReached) return;

    const newMsg = { role: "user", content: text, image_url: image, timestamp: new Date().toISOString() };
    addMessage(newMsg);
    setInputValue("");
    setShowScanner(false);
    setSuggestedActions([]);

    const history = [...messages, newMsg];
    await processConversation(history);

    // Consume message credit after successful send
    if (!isPremium && msgCredits != null) {
      const newCredits = await consumeMessageCredit(msgCredits);
      setMsgCredits(newCredits);
    }
  };

  // --- Voice ---
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Dict\u00e9e non support\u00e9e.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      handleSend(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- Upload Image ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    addMessage({ role: "user", content: "Analyse du document...", type: "loading_image" });

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMessages(prev => {
        const next = [...prev];
        next.pop();
        return [...next, { role: "user", content: "", image_url: file_url, timestamp: new Date().toISOString() }];
      });
      const history = [...messages, { role: "user", content: "Voici le document.", image_url: file_url }];
      await processConversation(history);
    } catch(err) {
      console.error(err);
      setMessages(prev => {
        const next = [...prev];
        next.pop();
        return next;
      });
      addMessage({ role: "assistant", content: "Erreur lors de l'envoi de l'image. R\u00e9essaie." });
    }
  };

  const saveAllRecords = async () => {
    try {
      const existingRecords = await base44.entities.HealthRecord.filter({ dog_id: dogId });
      let savedCount = 0;
      let skippedCount = 0;

      for (const rec of pendingRecords) {
        if (rec.type === "vaccine") {
          const isDuplicate = (existingRecords || []).some(
            existing => existing.type === "vaccine" && existing.title === rec.title && existing.date === rec.date
          );
          if (isDuplicate) {
            skippedCount++;
            continue;
          }
        }
        const created = await base44.entities.HealthRecord.create({ dog_id: dogId, ...rec });
        // Auto-update Dog.weight when a weight record is saved
        if (rec.type === "weight" && rec.value) {
          try { await base44.entities.Dog.update(dogId, { weight: rec.value }); } catch {}
        }
        onRecordAdded(created);
        savedCount++;
      }

      if (skippedCount > 0) {
        alert(`${skippedCount} vaccin(s) d\u00e9j\u00e0 enregistr\u00e9(s) pour cette date \u2014 ignor\u00e9(s).`);
      }

      setPendingRecords([]);
      setIsFinished(false);
      setHasSaved(true);
      setTimeout(() => {
        setMessages([]);
        setHasSaved(false);
        processConversation([]);
      }, 2000);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde. R\u00e9essaie.");
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setPendingRecords([]);
    setIsFinished(false);
    setSuggestedActions([]);
    processConversation([]);
  };

  // --- EMBEDDED UI ---
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">

      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight">Assistant Sant&eacute;</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              <span className="text-[10px] text-muted-foreground">En ligne</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && msgCredits != null && (
            <CreditBadge remaining={msgCredits} type="message" />
          )}
          {pendingRecords.length > 0 && !hasSaved && (
            <Button size="sm" onClick={saveAllRecords} className="rounded-full bg-safe hover:bg-safe/90 text-white text-xs h-8 shadow-md">
              <Check className="w-3.5 h-3.5 mr-1" /> Sauver ({pendingRecords.length})
            </Button>
          )}
          {messages.length > 2 && !isProcessing && !isStreaming && !isFinished && (
            <button onClick={startNewConversation} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
              Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="max-h-[50vh] overflow-y-auto p-4 space-y-4 scroll-smooth bg-gradient-to-b from-white to-slate-50/50">

        {/* Loading state before first message */}
         {messages.length === 0 && isProcessing && (
           <div className="flex justify-start">
             <div className="bg-white border border-border/50 rounded-2xl rounded-bl-none p-3 flex gap-1.5 shadow-sm">
               <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-primary/40 rounded-full" />
               <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 bg-primary/40 rounded-full" />
               <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 bg-primary/40 rounded-full" />
             </div>
           </div>
         )}

        {/* Saved confirmation */}
        {hasSaved && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center py-4">
            <div className="bg-safe/10 border border-safe/20 rounded-2xl px-6 py-4 text-center">
              <Check className="w-8 h-8 text-safe mx-auto mb-2" />
              <p className="text-sm font-bold text-safe">Enregistr&eacute; avec succ&egrave;s !</p>
              <p className="text-xs text-safe/70 mt-1">Le carnet se met &agrave; jour...</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <div key={`msg-${i}-${msg.role}`} className="flex flex-col w-full">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl p-3.5 shadow-sm relative
                    ${msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-border/50 text-foreground rounded-bl-sm"}
                  `}
                >
                  {msg.image_url && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                      <img src={msg.image_url} alt="Document" className="w-full h-auto max-h-40 object-cover" />
                    </div>
                  )}

                  <div className="text-sm leading-relaxed markdown-content break-words">
                    <ReactMarkdown
                      components={{
                        a: ({node, ...props}) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                              inline-flex items-center gap-1.5 px-2.5 py-1.5 my-1 rounded-lg font-medium transition-all no-underline break-words max-w-full text-xs
                              ${msg.role === "user"
                                ? "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 shadow-sm"}
                            `}
                          >
                            {String(props.children).includes("v\u00e9t\u00e9rinaire") ? <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> : <ExternalLink className="w-3 h-3 flex-shrink-0" />}
                            <span className="truncate">{props.children}</span>
                          </a>
                        ),
                        p: ({node, ...props}) => <p {...props} className="mb-1.5 last:mb-0" />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Inline Suggestions */}
                  {msg.role === "assistant" && i === messages.length - 1 && !isProcessing && !isStreaming && suggestedActions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(action)}
                          className="text-xs bg-white hover:bg-slate-50 text-primary font-medium px-3 py-1.5 rounded-full shadow-sm border border-primary/20 transition-all active:scale-95"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Actions: time + copy */}
              <div className={`flex items-center gap-2.5 px-1 mt-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <span className="text-[9px] text-muted-foreground/50">{getTimeStr(msg.timestamp)}</span>
                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="text-muted-foreground/40 hover:text-primary transition-colors"
                    title="Copier"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* VET CARD — graduated severity */}
              {msg.role === "assistant" && msg.show_vet_map && msg.show_vet_map !== "none" && (() => {
                const level = typeof msg.show_vet_map === "string" ? msg.show_vet_map : "routine";
                const VET_CARD_STYLES = {
                  routine: { bg: "bg-blue-50", border: "border-blue-100", iconBg: "bg-blue-100", iconColor: "text-blue-600", titleColor: "text-blue-900", subColor: "text-blue-700", title: "Check-up conseille", sub: "Prends rendez-vous quand tu peux" },
                  important: { bg: "bg-amber-50", border: "border-amber-100", iconBg: "bg-amber-100", iconColor: "text-amber-600", titleColor: "text-amber-900", subColor: "text-amber-700", title: "Consultation recommandee", sub: "Dans les prochains jours" },
                  urgent: { bg: "bg-red-50", border: "border-red-100", iconBg: "bg-red-100", iconColor: "text-red-600", titleColor: "text-red-900", subColor: "text-red-700", title: "Urgence veterinaire", sub: "Contacte rapidement un professionnel" },
                };
                const style = VET_CARD_STYLES[level] || VET_CARD_STYLES.important;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-2 mb-2 bg-white rounded-xl shadow-md border ${style.border} overflow-hidden`}
                  >
                    <div className={`${style.bg} px-3 py-2 border-b ${style.border} flex items-center gap-2`}>
                      <div className={`w-7 h-7 rounded-full ${style.iconBg} flex items-center justify-center`}>
                        <AlertCircle className={`w-4 h-4 ${style.iconColor}`} />
                      </div>
                      <div>
                        <h4 className={`font-bold ${style.titleColor} text-xs`}>{style.title}</h4>
                        <p className={`text-[10px] ${style.subColor}`}>{style.sub}</p>
                      </div>
                    </div>
                    <div className="p-2 grid grid-cols-2 gap-2">
                      <a
                        href="https://www.google.com/maps/search/v%C3%A9t%C3%A9rinaire+%C3%A0+proximit%C3%A9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 bg-white border border-border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-slate-700">Maps</span>
                      </a>
                      {level === "urgent" ? (
                        <a
                          href="tel:3115"
                          className="flex items-center justify-center gap-2 p-2.5 bg-white border border-border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-semibold text-slate-700">Urgences (3115)</span>
                        </a>
                      ) : (
                        <a
                          href="https://www.google.com/search?q=v%C3%A9t%C3%A9rinaire+%C3%A0+proximit%C3%A9"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-2.5 bg-white border border-border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-slate-700">Rechercher</span>
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          ))}

          {/* Typewriter streaming message */}
          {isStreaming && streamingText && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm p-3.5 shadow-sm bg-white border border-border/50 text-foreground">
                <div className="text-sm leading-relaxed markdown-content break-words">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p {...props} className="mb-1.5 last:mb-0" />
                    }}
                  >
                    {streamingText}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing indicator */}
          {((isProcessing && !isStreaming) || (isStreaming && !streamingText)) && messages.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white border border-border/50 rounded-2xl rounded-bl-sm p-3 flex gap-1.5 shadow-sm">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 bg-primary/40 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner floating suggestion */}
        <AnimatePresence>
          {showScanner && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm border-2 border-white transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Scanner le document
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 py-3 bg-white border-t border-border">
        {isLimitReached ? (
          <UpgradePrompt type="message" from="health-assistant" className="!p-3 !rounded-xl" />
        ) : isFinished && pendingRecords.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={saveAllRecords} className="w-full rounded-full bg-safe hover:bg-safe/90 text-white h-11 text-sm font-medium shadow-md">
              <Check className="w-4 h-4 mr-2" />
              Enregistrer {pendingRecords.length} entr&eacute;e{pendingRecords.length > 1 ? 's' : ''} dans le carnet
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file" ref={fileInputRef} accept="image/*" className="hidden"
              onChange={handleImageUpload}
            />

            {/* Camera Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex-shrink-0"
            >
              <Camera className="w-4.5 h-4.5" />
            </button>

            {/* Mic Button */}
            <button
              onClick={startListening}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0
                ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}
              `}
            >
              <Mic className="w-4.5 h-4.5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Écris ou parle..."
                disabled={isProcessing || isStreaming}
                className="h-10 rounded-full pl-4 pr-11 border-border bg-slate-50 focus:bg-white transition-colors text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isProcessing || isStreaming}
                className="absolute right-1 top-1 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white shadow-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}