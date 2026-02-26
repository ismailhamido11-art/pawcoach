import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { 
  Mic, Camera, X, Check, Loader2, Sparkles, 
  Keyboard, ChevronRight, ArrowLeft, ExternalLink, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

// Sound utility (clean beep/pop using Web Audio API)
const playPop = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

export default function SmartHealthAssistant({ dogId, onRecordAdded, inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Conversation state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize conversation when opening
  useEffect(() => {
    if (isOpen && messages.length === 0 && dogId) {
      // Trigger initial greeting only when we have dogId
      processConversation([]);
    }
  }, [isOpen, dogId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

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

      // 1. Add assistant response (next question)
      if (data.next_question) {
        addMessage({ role: "assistant", content: data.next_question });
      }

      // 2. Handle document scan suggestion
      setShowScanner(!!data.suggest_scan);

      // 3. Collect records
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

      // 4. Finished?
      if (data.is_finished) {
        setIsFinished(true);
      }

      // 5. Suggestions
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

    const newMsg = { 
      role: "user", 
      content: text, 
      image_url: image 
    };
    
    // Add to UI immediately
    addMessage(newMsg);
    setInputValue("");
    setShowScanner(false); // Reset scanner suggestion after use
    setSuggestedActions([]); // Clear suggestions

    // Send full history to backend
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

    // Show optimistic loading bubble
    addMessage({ role: "user", content: "Analyse du document...", type: "loading_image" });
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Replace loading bubble with actual image message
      setMessages(prev => {
        const next = [...prev];
        next.pop(); // remove loading
        return [...next, { role: "user", content: "", image_url: file_url }];
      });
      
      const history = [...messages, { role: "user", content: "Voici le document.", image_url: file_url }];
      await processConversation(history);

    } catch(err) {
      console.error(err);
      addMessage({ role: "system", content: "Erreur lors de l'envoi de l'image." });
    }
  };

  const saveAllAndClose = async () => {
    for (const rec of pendingRecords) {
      await base44.entities.HealthRecord.create({ dog_id: dogId, ...rec });
      onRecordAdded(rec);
    }
    setIsOpen(false);
    setMessages([]);
    setPendingRecords([]);
    setIsFinished(false);
  };

  // --- UI ---
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if(!open) { setMessages([]); setPendingRecords([]); setIsFinished(false); }
    }}>
      <DialogTrigger asChild>
        {inline ? (
          <button className="w-full bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center gap-4 tap-scale group hover:border-primary/30 transition-all">
             <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 relative">
                <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-75" />
             </div>
             <div className="text-left flex-1">
                <p className="font-bold text-foreground text-sm">Assistant Santé</p>
                <p className="text-xs text-muted-foreground">Discussion guidée & intelligente</p>
             </div>
             <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ) : (
          <button className="fixed bottom-24 right-5 h-16 w-16 rounded-full gradient-primary shadow-xl shadow-primary/40 flex items-center justify-center tap-scale z-40 group">
            <Sparkles className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-75" />
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-none w-full h-full p-0 border-0 bg-background/95 backdrop-blur-xl sm:rounded-none">
        <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-background via-white to-secondary/20">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 backdrop-blur-sm z-20">
             <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
               <X className="w-6 h-6 text-foreground/70" />
             </button>
             <div className="flex flex-col items-center">
               <span className="font-bold text-foreground">Assistant Santé</span>
               <div className="flex items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] text-muted-foreground uppercase tracking-wider">En ligne</span>
               </div>
             </div>
             {pendingRecords.length > 0 ? (
               <Button size="sm" onClick={saveAllAndClose} className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
                 <Check className="w-4 h-4 mr-1" /> Sauver ({pendingRecords.length})
               </Button>
             ) : (
               <div className="w-10" />
             )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scroll-smooth">
             <AnimatePresence initial={false}>
               {messages.map((msg, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, y: 10, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   transition={{ duration: 0.3 }}
                   className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                 >
                   <div 
                     className={`
                       max-w-[85%] rounded-2xl p-4 shadow-sm relative
                       ${msg.role === "user" 
                         ? "bg-primary text-white rounded-br-none" 
                         : "bg-white border border-border/50 text-foreground rounded-bl-none"}
                     `}
                   >
                     {msg.image_url ? (
                       <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                         <img src={msg.image_url} alt="Document" className="w-full h-auto max-h-48 object-cover" />
                       </div>
                     ) : null}
                     
                     <div className="text-sm leading-relaxed markdown-content break-words">
                       <ReactMarkdown
                         components={{
                           a: ({node, ...props}) => (
                             <a 
                               {...props} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className={`
                                 inline-flex items-center gap-1.5 px-3 py-2 my-1 rounded-lg font-medium transition-all no-underline break-words max-w-full
                                 ${msg.role === "user" 
                                   ? "bg-white/20 text-white hover:bg-white/30 border border-white/30" 
                                   : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 shadow-sm"}
                               `}
                             >
                               {String(props.children).includes("vétérinaire") ? <MapPin className="w-4 h-4 flex-shrink-0" /> : <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
                               <span className="truncate">{props.children}</span>
                             </a>
                           ),
                           p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />
                         }}
                       >
                         {msg.content}
                       </ReactMarkdown>
                     </div>

                     {/* Inline Suggestions (only on the LAST assistant message if not processing) */}
                     {msg.role === "assistant" && i === messages.length - 1 && !isProcessing && suggestedActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {suggestedActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(action)}
                              className="text-xs bg-white hover:bg-slate-50 text-primary font-medium px-4 py-2 rounded-full shadow-sm border border-primary/30 transition-all active:scale-95"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                     )}

                     {/* Tail decoration */}
                     <div className={`absolute bottom-0 w-4 h-4 
                        ${msg.role === "user" 
                          ? "-right-2 bg-primary [clip-path:polygon(0_0,0%_100%,100%_100%)]" 
                          : "-left-2 bg-white border-b border-l border-border/50 [clip-path:polygon(100%_0,0%_100%,100%_100%)]"}
                     `} />
                   </div>
                 </motion.div>
               ))}

               {isProcessing && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                   <div className="bg-white border border-border/50 rounded-2xl rounded-bl-none p-3 flex gap-1.5 shadow-sm">
                     <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                     <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                     <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
             <div ref={messagesEndRef} />
          </div>

          {/* Scanner floating button */}
          <AnimatePresence>
            {showScanner && (
              <div className="absolute bottom-20 left-0 right-0 z-20 px-4 flex justify-center">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                >
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold transform hover:scale-105 transition-all border-2 border-white"
                  >
                    <Camera className="w-5 h-5" />
                    Scanner le document
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 bg-white/80 backdrop-blur-md border-t border-border/50 z-20">
            {isFinished ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                <Button onClick={saveAllAndClose} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-medium shadow-lg">
                  Terminer et sauvegarder
                </Button>
              </motion.div>
            ) : (
             <div className="flex items-center gap-3 relative">
               
               {/* Hidden File Input */}
               <input 
                 type="file" ref={fileInputRef} accept="image/*" className="hidden" 
                 onChange={handleImageUpload}
               />

               {/* Mic Button */}
               <button 
                 onClick={startListening}
                 className={`
                   w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md
                   ${isListening ? "bg-red-500 text-white animate-pulse shadow-red-500/40" : "bg-secondary hover:bg-secondary/80 text-foreground"}
                 `}
               >
                 <Mic className="w-5 h-5" />
               </button>

               {/* Text Input */}
               <div className="flex-1 relative">
                 <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Message..."
                    className="h-12 rounded-full pl-5 pr-12 border-border/60 shadow-inner bg-muted/20 focus:bg-white transition-colors"
                 />
                 <button 
                   onClick={() => handleSend()}
                   disabled={!inputValue.trim()}
                   className="absolute right-1 top-1 h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
                 >
                   <ArrowLeft className="w-5 h-5 rotate-90" />
                 </button>
               </div>
             </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function getEmoji(type) {
  const map = {
    vaccine: "💉",
    vet_visit: "🏥",
    weight: "⚖️",
    medication: "💊",
    allergy: "⚠️",
    note: "📝"
  };
  return map[type] || "📄";
}