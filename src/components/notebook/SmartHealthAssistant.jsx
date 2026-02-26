import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Mic, Camera, X, Check, Loader2, Sparkles, 
  Keyboard, ChevronRight, ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartHealthAssistant({ dogId, onRecordAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("idle"); // idle, listening, processing, review, text
  const [transcript, setTranscript] = useState("");
  const [scannedImage, setScannedImage] = useState(null);
  const [result, setResult] = useState(null); // { records: [], message: "" }
  
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Voice Logic ---
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Dictée non supportée. Utilisez le clavier.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setMode("listening");
      setTranscript("");
    };

    recognition.onresult = (e) => {
      const current = e.results[e.results.length - 1][0].transcript;
      setTranscript(current);
    };

    recognition.onend = () => {
      // Auto-process if we have text
      if (recognitionRef.current && transcript.trim().length > 2) {
        handleProcess(transcript, null);
      } else {
        setMode("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      // onend will trigger process
    }
  };

  // --- Process Logic ---
  const handleProcess = async (text, file) => {
    setMode("processing");
    try {
      let imageUrl = null;
      if (file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        imageUrl = file_url;
      }

      const { data } = await base44.functions.invoke("processHealthInput", {
        text,
        imageUrl,
        dogId
      });

      setResult(data);
      setMode("review");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'analyse.");
      setMode("idle");
    }
  };

  const confirmRecord = async (record) => {
    try {
      await base44.entities.HealthRecord.create({
        dog_id: dogId,
        ...record
      });
      onRecordAdded(record);
      // Remove confirmed record from result list
      setResult(prev => ({
        ...prev,
        records: prev.records.filter(r => r !== record)
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const allDone = result?.records?.length === 0;

  useEffect(() => {
    if (mode === "review" && allDone) {
      // Close after a brief delay showing "All done"
      const t = setTimeout(() => {
        setIsOpen(false);
        setMode("idle");
        setResult(null);
        setTranscript("");
        setScannedImage(null);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [allDone, mode]);


  // --- Render Components ---

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if(!open) { setMode("idle"); setResult(null); setTranscript(""); }
    }}>
      <DialogTrigger asChild>
        <button className="fixed bottom-24 right-5 h-16 w-16 rounded-full gradient-primary shadow-xl shadow-primary/40 flex items-center justify-center tap-scale z-40 group">
          <Sparkles className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-75" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-none w-full h-full p-0 border-0 bg-background/95 backdrop-blur-xl sm:rounded-none" hideClose>
        <div className="h-full flex flex-col relative overflow-hidden">
          
          {/* Background Ambient Orbs */}
          <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 z-10">
             <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
               <X className="w-6 h-6 text-foreground/70" />
             </button>
             {mode !== "idle" && (
                <button onClick={() => { setMode("idle"); setTranscript(""); }} className="text-sm font-medium text-muted-foreground">
                  Annuler
                </button>
             )}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">
            
            <AnimatePresence mode="wait">
              
              {/* IDLE STATE */}
              {mode === "idle" && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center text-center space-y-12 w-full max-w-md"
                >
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
                      Quoi de neuf ?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      "J'ai fait le rappel de vaccin hier"<br/>
                      "Il pèse 12.5 kg"
                    </p>
                  </div>

                  {/* Big Interaction Buttons */}
                  <div className="flex items-center justify-center gap-8">
                    {/* Camera */}
                    <div className="flex flex-col items-center gap-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 rounded-3xl bg-white border border-border shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Camera className="w-7 h-7 text-primary" />
                      </button>
                      <span className="text-xs font-medium text-muted-foreground">Scanner</span>
                      <input 
                        type="file" ref={fileInputRef} accept="image/*" className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) {
                            setScannedImage(URL.createObjectURL(file));
                            handleProcess(null, file);
                          }
                        }}
                      />
                    </div>

                    {/* BIG MIC */}
                    <div className="relative">
                      <button 
                        onClick={startListening}
                        className="w-28 h-28 rounded-full gradient-primary shadow-2xl shadow-primary/40 flex items-center justify-center tap-scale relative z-10"
                      >
                        <Mic className="w-12 h-12 text-white" />
                      </button>
                      {/* Decorative rings */}
                      <div className="absolute inset-0 rounded-full border border-primary/20 scale-125 pointer-events-none" />
                      <div className="absolute inset-0 rounded-full border border-primary/10 scale-150 pointer-events-none" />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col items-center gap-3">
                      <button 
                        onClick={() => setMode("text")}
                        className="w-16 h-16 rounded-3xl bg-white border border-border shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Keyboard className="w-7 h-7 text-primary" />
                      </button>
                      <span className="text-xs font-medium text-muted-foreground">Écrire</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* LISTENING STATE */}
              {mode === "listening" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center space-y-8 w-full"
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-xl z-20 relative">
                      <Mic className="w-14 h-14 text-white" />
                    </div>
                    {/* Pulsing waves */}
                    <motion.div 
                      animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-primary/30 rounded-full z-10"
                    />
                    <motion.div 
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                      className="absolute inset-0 bg-primary/20 rounded-full z-10"
                    />
                  </div>

                  <div className="space-y-4 max-w-xs">
                    <p className="text-2xl font-semibold text-foreground">Je t'écoute...</p>
                    <p className="text-lg text-muted-foreground min-h-[3rem]">
                      "{transcript || "..."}"
                    </p>
                  </div>

                  <Button onClick={stopListening} variant="outline" className="rounded-full px-8">
                    C'est tout
                  </Button>
                </motion.div>
              )}

              {/* TEXT INPUT STATE */}
              {mode === "text" && (
                <motion.div
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                   className="w-full max-w-md space-y-6"
                >
                  <h3 className="text-xl font-bold text-center">Écris ce qui s'est passé</h3>
                  <div className="relative">
                    <Input 
                      autoFocus
                      placeholder="Ex: Poids 15kg ce matin..."
                      className="h-14 rounded-2xl pl-4 pr-12 text-lg shadow-sm"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleProcess(transcript, null)}
                    />
                    <Button 
                      onClick={() => handleProcess(transcript, null)}
                      size="icon" 
                      className="absolute right-2 top-2 h-10 w-10 rounded-xl gradient-primary"
                    >
                      <ArrowLeft className="w-5 h-5 text-white rotate-180" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PROCESSING STATE */}
              {mode === "processing" && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center space-y-6"
                >
                  <div className="relative w-24 h-24">
                     <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                     <div className="absolute inset-2 border-4 border-t-transparent border-r-accent border-b-transparent border-l-transparent rounded-full animate-spin-reverse" />
                     <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground animate-pulse">
                    Analyse magique en cours...
                  </p>
                </motion.div>
              )}

              {/* REVIEW STATE */}
              {mode === "review" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-md space-y-6"
                >
                  {allDone ? (
                    <div className="text-center space-y-4">
                       <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                         <Check className="w-10 h-10 text-green-600" />
                       </div>
                       <h3 className="text-2xl font-bold text-green-700">C'est noté !</h3>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-foreground">J'ai compris ça :</h3>
                        {result?.message && <p className="text-sm text-muted-foreground mt-1">{result.message}</p>}
                      </div>

                      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                        {result?.records?.map((rec, i) => (
                          <motion.div 
                            key={i}
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                            className="bg-white border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden group"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-emerald-400" />
                            
                            <div className="flex justify-between items-start mb-2 pl-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{getEmoji(rec.type)}</span>
                                <div>
                                  <p className="font-bold text-foreground">{rec.title}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{rec.type.replace('_', ' ')}</p>
                                </div>
                              </div>
                              <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-lg text-primary-foreground/80">
                                {rec.date}
                              </span>
                            </div>

                            {rec.details && <p className="text-sm text-muted-foreground pl-3 mb-3">{rec.details}</p>}
                            {rec.value && <p className="text-sm font-semibold pl-3 mb-3">Valeur: {rec.value} kg</p>}
                            
                            {rec.next_date && (
                               <div className="ml-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mb-3">
                                 <span className="font-bold">⏰ Rappel :</span> {rec.next_date}
                               </div>
                            )}

                            <div className="flex gap-3 pl-3 mt-2">
                               <Button 
                                 onClick={() => confirmRecord(rec)}
                                 className="flex-1 gradient-primary text-white rounded-xl h-10 shadow-md shadow-primary/20"
                               >
                                 <Check className="w-4 h-4 mr-2" /> Confirmer
                               </Button>
                               <Button 
                                 variant="outline"
                                 onClick={() => {
                                   // Remove from list without adding
                                   setResult(prev => ({...prev, records: prev.records.filter(r => r !== rec)}));
                                 }}
                                 className="px-3 rounded-xl border-dashed"
                               >
                                 <X className="w-4 h-4 text-muted-foreground" />
                               </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {result?.records?.length === 0 && !allDone && (
                        <div className="text-center p-6 bg-muted/30 rounded-2xl border border-dashed border-border">
                           <p className="text-muted-foreground">Je n'ai rien trouvé de précis.</p>
                           <Button variant="link" onClick={() => setMode("idle")} className="text-primary mt-2">
                             Réessayer
                           </Button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
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