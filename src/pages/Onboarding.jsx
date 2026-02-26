import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, ChevronLeft, Mic, MicOff, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import WelcomeScreen from "../components/onboarding/WelcomeScreen";

const INTERVIEW_STEPS = [
  { type: "photo", question: "Une jolie photo pour commencer ?", emoji: "📸" },
  { type: "voice", question: "Comment s'appelle votre chien ?", emoji: "🐶", placeholder: "Son prénom..." },
  { type: "voice", question: "Quelle est sa race ?", emoji: "🐕", placeholder: "Ex: Beagle, Croisé..." },
  { type: "voice", question: "Quel âge a-t-il ?", emoji: "🎂", placeholder: "Ex: 2 ans, 6 mois..." },
  { type: "voice", question: "Est-ce un mâle ou une femelle ?", emoji: "⚧️", placeholder: "Mâle ou Femelle" },
  { type: "voice", question: "Combien pèse-t-il environ ?", emoji: "⚖️", placeholder: "Ex: 15 kg" },
  { type: "voice", question: "Quel est son niveau d'activité ?", emoji: "🏃", placeholder: "Calme, Modéré, Très actif..." },
  { type: "voice", question: "Où vit-il principalement ?", emoji: "🏠", placeholder: "Appartement, Maison..." },
  { type: "voice", question: "A-t-il des problèmes de santé ou allergies ?", emoji: "🏥", placeholder: "Non, ou préciser..." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(INTERVIEW_STEPS.length).fill(""));
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dogData, setDogData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);

  const currentAnswer = answers[step];
  const setCurrentAnswer = (val) => {
    const newAnswers = [...answers];
    newAnswers[step] = val;
    setAnswers(newAnswers);
  };

  const currentStepData = INTERVIEW_STEPS[step];
  const progress = ((step + 1) / INTERVIEW_STEPS.length) * 100;

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCurrentAnswer(file_url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const toggleMic = () => {
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
      setCurrentAnswer(currentAnswer ? currentAnswer + " " + transcript : transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleNext = async () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    if (step < INTERVIEW_STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Final step, process with AI
    setSaving(true);
    try {
      const user = await base44.auth.me();
      
      const photoUrl = answers[0]; // Step 0 is photo
      const textAnswers = answers.slice(1);
      const textSteps = INTERVIEW_STEPS.slice(1);
      
      const prompt = `Voici les réponses d'un utilisateur concernant son chien :
${textSteps.map((s, i) => `- ${s.question} : ${textAnswers[i]}`).join('\n')}

Extrais ces informations et renvoie un objet JSON correspondant au schéma fourni.
- Calcule une "birth_date" (YYYY-MM-DD) approximative si l'âge est donné (l'année actuelle est ${new Date().getFullYear()}).
- Pour le sexe: "male" ou "female".
- Pour le niveau d'activité: "faible", "modere", "eleve", ou "tres_eleve".
- Pour l'environnement: "appartement", "maison_sans_jardin", ou "maison_avec_jardin".
- Si une info est inconnue, manquante ou que l'utilisateur a dit "non" / rien dit, mets null.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            breed: { type: "string" },
            birth_date: { type: "string" },
            sex: { type: "string" },
            weight: { type: "number" },
            activity_level: { type: "string" },
            environment: { type: "string" },
            allergies: { type: "string" },
            health_issues: { type: "string" }
          },
          required: ["name"]
        }
      });

      const extracted = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

      const dog = await base44.entities.Dog.create({
        name: extracted.name || "Mon chien",
        photo: photoUrl || null,
        breed: extracted.breed || null,
        birth_date: extracted.birth_date || null,
        sex: extracted.sex || null,
        weight: extracted.weight || null,
        activity_level: extracted.activity_level || null,
        environment: extracted.environment || null,
        allergies: extracted.allergies || null,
        health_issues: extracted.health_issues || null,
        owner: user.email,
        onboarding_completed: true,
      });

      setDogData(dog);
      
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Bienvenue sur PawCoach, ${user.full_name || "l'ami"} !`,
          body: `${dog.name} est maintenant inscrit ! Profitez de l'application !`,
        });
      } catch (e) {}

      setDone(true);
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  if (done && dogData) {
    return (
      <WelcomeScreen
        dogName={dogData.name}
        dogPhoto={dogData.photo}
        onDiscover={() => navigate(createPageUrl("Home"))}
      />
    );
  }

  const canNext = currentStepData.type === "photo" || currentAnswer.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <div className="pt-12 px-6 pb-4 flex items-center gap-4">
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} className="w-10 h-10 flex items-center justify-center bg-secondary rounded-full tap-scale">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
        <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: \`\${progress}%\` }} />
        </div>
        <div className="w-10 flex items-center justify-end font-bold text-sm text-muted-foreground">
          {step + 1}/{INTERVIEW_STEPS.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-7xl mb-8 animate-bounce-soft">{currentStepData.emoji}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12 leading-tight">
          {currentStepData.question}
        </h1>

        {currentStepData.type === "photo" ? (
          <div className="flex flex-col items-center mb-12">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative w-40 h-40 rounded-full border-4 border-dashed border-primary/40 bg-secondary/40 flex items-center justify-center overflow-hidden tap-scale transition-all hover:border-primary hover:bg-secondary mb-4"
            >
              {currentAnswer ? (
                <img src={currentAnswer} alt="Chien" className="w-full h-full object-cover" />
              ) : uploading ? (
                <div className="w-10 h-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin" />
              ) : (
                <Camera className="w-12 h-12 text-primary/60" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files[0] && handlePhoto(e.target.files[0])}
            />
            <p className="text-sm font-medium text-muted-foreground">Appuie pour choisir (Optionnel)</p>
          </div>
        ) : (
          <>
            {/* Big Mic Button */}
            <button
              onClick={toggleMic}
              className={\`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center transition-all tap-scale mb-12 \${
                listening 
                  ? "bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]" 
                  : "bg-primary shadow-2xl shadow-primary/30 hover:scale-105"
              }\`}
            >
              {listening ? (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
                  <MicOff className="w-16 h-16 text-white" />
                </>
              ) : (
                <Mic className="w-16 h-16 text-white" />
              )}
            </button>

            <div className="text-center mb-8 w-full max-w-sm">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                {listening ? "Je t'écoute..." : "Appuie pour parler ou tape ta réponse"}
              </p>
              <Input 
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentStepData.placeholder}
                className="h-14 text-center text-lg rounded-2xl border-2 border-border focus-visible:ring-primary shadow-sm w-full"
              />
            </div>
          </>
        )}

        <Button
          onClick={handleNext}
          disabled={!canNext || saving}
          className="w-full max-w-sm h-14 rounded-2xl gradient-primary text-white font-bold text-lg shadow-lg shadow-primary/30 gap-2 mt-auto"
        >
          {saving ? (
            <>
              <span className="animate-spin text-xl">🪄</span>
              Analyse magique...
            </>
          ) : step === INTERVIEW_STEPS.length - 1 ? (
            <>
              <Sparkles className="w-5 h-5" />
              Créer le profil
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}