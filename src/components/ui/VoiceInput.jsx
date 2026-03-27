import { useState, useRef } from "react";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";

export default function VoiceInput({ onTranscript, className = "" }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggle = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Dictée vocale non supportée. Utilise Chrome.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };
    recognition.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") {
        toast.error("Accès au microphone refusé. Autorise-le dans les réglages de ton navigateur.");
      } else if (e.error === "no-speech") {
        toast.info("Aucune voix détectée. Réessaie.");
      } else {
        toast.error("Erreur de dictée vocale. Réessaie.");
      }
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Arrêter la dictée" : "Dicter"}
      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all tap-scale ${
        listening
          ? "bg-red-500 shadow-lg shadow-red-200 animate-pulse"
          : "bg-secondary border border-border hover:bg-primary/10 hover:border-primary"
      } ${className}`}
    >
      {listening ? (
        <MicOff className="w-5 h-5 text-white" />
      ) : (
        <Mic className="w-5 h-5 text-primary" />
      )}
    </button>
  );
}