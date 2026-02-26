import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Send, Mic, X, Check, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoiceInput from "@/components/ui/VoiceInput";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

export default function SmartHealthAssistant({ dogId, onRecordAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis ton assistant santé. Dis-moi ce que tu veux ajouter (ex: 'Vaccin rage fait hier') ou scanne un document." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRecords, setPendingRecords] = useState([]);
  const fileInputRef = useRef(null);

  const handleSend = async (text = input, file = null) => {
    if (!text && !file) return;
    
    const newMsgs = [...messages, { role: "user", content: text || "📷 Image envoyée", image: file ? URL.createObjectURL(file) : null }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    setPendingRecords([]);

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

      if (data.records && data.records.length > 0) {
        setPendingRecords(data.records);
        setMessages(prev => [...prev, { role: "assistant", content: data.message || `J'ai trouvé ${data.records.length} élément(s). Vérifie et confirme.` }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.message || "Je n'ai rien trouvé de pertinent. Peux-tu reformuler ?" }]);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "Oups, une erreur est survenue." }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmRecord = async (record) => {
    try {
      await base44.entities.HealthRecord.create({
        dog_id: dogId,
        ...record
      });
      onRecordAdded(record);
      setPendingRecords(prev => prev.filter(r => r !== record));
      // Feedback
      setMessages(prev => [...prev, { role: "assistant", content: `✅ ${record.title} ajouté avec succès !` }]);
    } catch (e) {
      console.error(e);
    }
  };

  const discardRecord = (record) => {
    setPendingRecords(prev => prev.filter(r => r !== record));
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button className="fixed bottom-24 right-5 h-14 w-14 rounded-full gradient-primary shadow-xl shadow-primary/30 flex items-center justify-center tap-scale z-40">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] flex flex-col bg-background">
        <DrawerHeader className="text-left border-b border-border pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            Assistant Santé
          </DrawerTitle>
          <DrawerDescription>Ajoute des vaccins, poids ou visites en parlant ou en scannant.</DrawerDescription>
        </DrawerHeader>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <BotIcon className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
              }`}>
                {m.image && <img src={m.image} alt="upload" className="w-full rounded-lg mb-2 max-h-40 object-cover" />}
                <p>{m.content}</p>
              </div>
            </div>
          ))}

          {/* Pending Records Cards */}
          {pendingRecords.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">À confirmer</p>
              {pendingRecords.map((rec, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm animate-slide-up">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getEmoji(rec.type)}</span>
                      <span className="font-bold text-foreground">{rec.title}</span>
                    </div>
                    <div className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {rec.date}
                    </div>
                  </div>
                  {rec.details && <p className="text-xs text-muted-foreground mb-3">{rec.details}</p>}
                  {rec.next_date && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md mb-3 w-fit">
                      <ClockIcon className="w-3 h-3" />
                      Rappel : {rec.next_date}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => discardRecord(rec)}>
                      Ignorer
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmRecord(rec)}>
                      <Check className="w-3 h-3 mr-1.5" /> Confirmer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background pb-8">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSend(null, e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 hover:bg-secondary/80 transition-colors border border-border"
            >
              <Camera className="w-5 h-5 text-secondary-foreground" />
            </button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Dites quelque chose..."
              className="flex-1 h-11 rounded-xl bg-muted/50 border-border"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            
            {input.trim() ? (
              <Button onClick={() => handleSend()} className="h-11 w-11 rounded-xl p-0 gradient-primary">
                <Send className="w-4 h-4 text-white" />
              </Button>
            ) : (
              <VoiceInput onTranscript={(txt) => setInput(txt)} className="h-11 w-11 !rounded-xl border border-border" />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function BotIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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