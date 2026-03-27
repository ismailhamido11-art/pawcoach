import { useState, useRef } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";

export default function VoiceButton({ onTranscript, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (disabled) return;
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Dictée non supportée sur ce navigateur.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      onClick={startListening}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0
        ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-muted hover:bg-border text-muted-foreground"}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
      aria-label={isListening ? "Dictée en cours..." : "Commencer la dictée vocale"}
    >
      <Mic className="w-4.5 h-4.5" />
    </button>
  );
}
