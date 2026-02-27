import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  Mic, Camera, X, Check, Loader2, Sparkles,
  Keyboard, ChevronRight, ArrowLeft, ExternalLink, MapPin, Phone, AlertCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

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

export default function SmartHealthAssistant({ dogId, onRecordAdded }) {
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

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-start conversation when dogId is available
  useEffect(() => {
    if (dogId && messages.length === 0) {
      processConversation([]);
    }
  }, [dogId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Cleanup SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
    };
  }, []);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
    if (msg.role === "assistant") playPop();
  };

  const processConversation = async (newMessages) => {
    setIsProcessing(true);
    try {
      const { data } = await base44.functions.invoke("processHealthInput", {
        messages: newMessages,
        dogId
      });

      if (data.next_question) {
        addMessage({
          role: "assistant",
          content: data.next_question,
          show_vet_map: data.show_vet_map
        });
      }

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

      if (data.suggested_actions && Array.isArray(data.suggested_actions)) {
        setSuggestedActions(data.suggested_actions);
      } else {
        setSuggestedActions([]);
      }

    } catch (e) {
      console.error("SmartHealthAssistant error:", e);
      const errMsg = e?.response?.data?.error || e?.message || "Erreur inconnue";
      addMessage({ role: "assistant", content: `Oups, erreur : ${errMsg}. On peut réessayer ?` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (text = inputValue, image = null) => {
    if ((!text && !image) || isProcessing) return;

    const newMsg = { role: "user", content: text, image_url: image };
    addMessage(newMsg);
    setInputValue("");
    setShowScanner(false);
    setSuggestedActions([]);

    const history = [...messages, newMsg];
    await processConversation(history);
  };

  // --- Voice ---
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Dictée non supportée.");
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
    e.target.value = ""; // Reset pour pouvoir re-scanner le même fichier

    addMessage({ role: "user", content: "Analyse du document...", type: "loading_image" });

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMessages(prev => {
        const next = [...prev];
        next.pop();
        return [...next, { role: "user", content: "", image_url: file_url }];
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
      addMessage({ role: "assistant", content: "Erreur lors de l'envoi de l'image. Réessaie." });
    }
  };

  const saveAllRecords = async () => {
    try {
      for (const rec of pendingRecords) {
        const created = await base44.entities.HealthRecord.create({ dog_id: dogId, ...rec });
        onRecordAdded(created); // Passe le record avec l'id BDD
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
      alert("Erreur lors de la sauvegarde. Réessaie.");
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
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">

      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight">Assistant Santé</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">En ligne</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingRecords.length > 0 && !hasSaved && (
            <Button size="sm" onClick={saveAllRecords} className="rounded-full bg-green-600 hover:bg-green-700 text-white text-xs h-8 shadow-md">
              <Check className="w-3.5 h-3.5 mr-1" /> Sauver ({pendingRecords.length})
            </Button>
          )}
          {messages.length > 2 && !isProcessing && !isFinished && (
            <button onClick={startNewConversation} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
              Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="max-h-[380px] overflow-y-auto p-4 space-y-4 scroll-smooth bg-gradient-to-b from-white to-slate-50/50">

        {/* Loading state before first message */}
        {messages.length === 0 && isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-border/50 rounded-2xl rounded-bl-none p-3 flex gap-1.5 shadow-sm">
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Saved confirmation */}
        {hasSaved && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center py-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 text-center">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-green-800">Enregistré avec succès !</p>
              <p className="text-xs text-green-600 mt-1">Le carnet se met à jour...</p>
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
                            {String(props.children).includes("vétérinaire") ? <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> : <ExternalLink className="w-3 h-3 flex-shrink-0" />}
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
                  {msg.role === "assistant" && i === messages.length - 1 && !isProcessing && suggestedActions.length > 0 && (
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

              {/* VET CARD */}
              {msg.role === "assistant" && msg.show_vet_map && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 mb-2 bg-white rounded-xl shadow-md border border-red-100 overflow-hidden"
                >
                  <div className="bg-red-50 px-3 py-2 border-b border-red-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-900 text-xs">Consultation recommandée</h4>
                      <p className="text-[10px] text-red-700">Trouver un professionnel</p>
                    </div>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-2">
                    <a
                      href="https://www.google.com/maps/search/vétérinaire+à+proximité"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-700">Maps</span>
                    </a>
                    <a
                      href="https://www.google.com/search?q=urgence+vétérinaire+à+proximité"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-semibold text-slate-700">Urgences</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {/* Processing indicator */}
          {isProcessing && messages.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white border border-border/50 rounded-2xl rounded-bl-sm p-3 flex gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
      <div className="px-3 py-3 bg-white border-t border-slate-100">
        {isFinished && pendingRecords.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={saveAllRecords} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-11 text-sm font-medium shadow-md">
              <Check className="w-4 h-4 mr-2" />
              Enregistrer {pendingRecords.length} entrée{pendingRecords.length > 1 ? 's' : ''} dans le carnet
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
                disabled={isProcessing}
                className="h-10 rounded-full pl-4 pr-11 border-slate-200 bg-slate-50 focus:bg-white transition-colors text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isProcessing}
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
