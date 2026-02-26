import { useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceInput({ onTranscript, className = "" }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggle = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("La dictée vocale n'est pas supportée sur ce navigateur. Utilise Chrome.");
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
    recognition.onerror = () => setListening(false);
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