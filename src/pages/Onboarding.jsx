import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, ChevronLeft, Mic, MicOff, Camera as CameraIcon, PawPrint, Dog as DogIcon, Cake, Users, Scale, PersonStanding, Home as HomeIcon, Hospital, HeartPulse, GraduationCap, Salad, Smile, Handshake, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import WelcomeScreen from "../components/onboarding/WelcomeScreen";
import Illustration from "../components/illustrations/Illustration";
import { spring } from "@/lib/animations";

const GOAL_OPTIONS = [
  { icon: HeartPulse, color: "#ef4444", label: "Qu'il soit en bonne santé", bg: "#ef444415" },
  { icon: GraduationCap, color: "#6366f1", label: "Bien l'éduquer", bg: "#6366f115" },
  { icon: Salad, color: "#10b981", label: "Qu'il mange bien", bg: "#10b98115" },
  { icon: Smile, color: "#ec4899", label: "Son bonheur au quotidien", bg: "#ec489915" },
  { icon: Handshake, color: "#10b981", label: "Mieux le comprendre", bg: "#10b98115" },
];

const INTERVIEW_STEPS = [
  { type: "choice", question: "Qu'est-ce qui compte le plus pour toi ?", icon: PawPrint, iconColor: "#2d9f82" },
  { type: "photo", question: "Une photo de ton chien ?", icon: CameraIcon, iconColor: "#6366f1" },
  { type: "voice", question: "Comment s'appelle-t-il ?", icon: DogIcon, iconColor: "#10b981", placeholder: "Son prénom..." },
  { type: "voice", question: "Quelle est sa race ?", icon: DogIcon, iconColor: "#10b981", placeholder: "Ex: Beagle, Croisé..." },
  { type: "voice", question: "Quel âge a-t-il ?", icon: Cake, iconColor: "#ec4899", placeholder: "Ex: 2 ans, 6 mois..." },
  { type: "voice", question: "Mâle ou femelle ?", icon: Users, iconColor: "#3b82f6", placeholder: "Mâle ou Femelle" },
  { type: "voice", question: "Combien pèse-t-il environ ?", icon: Scale, iconColor: "#10b981", placeholder: "Ex: 15 kg" },
  { type: "voice", question: "Son niveau d'activité ?", icon: PersonStanding, iconColor: "#10b981", placeholder: "Calme, Modéré, Très actif..." },
  { type: "voice", question: "Où vit-il principalement ?", icon: HomeIcon, iconColor: "#6366f1", placeholder: "Appartement, Maison..." },
  { type: "voice", question: "Des problèmes de santé ou allergies ?", icon: Hospital, iconColor: "#ef4444", placeholder: "Non, ou préciser..." },
];

// Welcome splash shown before the form
function OnboardingWelcome({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden gradient-primary">
      {/* Decorative orbs */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-white/10 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="absolute bottom-[-60px] left-[-40px] w-60 h-60 rounded-full bg-accent/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Illustration */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6"
        >
          <Illustration name="adoptAPet" alt="Adopte un compagnon" className="w-48 h-48 drop-shadow-2xl" />
        </motion.div>

        <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-3">PawCoach</p>
        <h1 className="text-2xl font-black text-white leading-tight mb-4">
          Bienvenue dans<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-400">
            l'aventure
          </span>
        </h1>
        <p className="text-white/60 text-base leading-relaxed max-w-xs mb-12">
          En 2 minutes, crée le profil de ton chien et commence à suivre son bien-être au quotidien.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {["🤖 IA personnalisée", "📊 Suivi quotidien", "🏥 Carnet santé", "🍽️ NutriCoach"].map(f => (
            <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-medium">
              {f}
            </span>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="w-full max-w-xs h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 shadow-2xl text-base gradient-primary"
        >
          Créer le profil de mon chien
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-2 mt-6 bg-white/10 px-4 py-2 rounded-full border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-white/80" />
          <p className="text-white/80 text-xs font-semibold">7 jours Premium offerts · Sans carte bancaire</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const isAddDog = urlParams.get("addDog") === "true";
  const [started, setStarted] = useState(isAddDog); // skip welcome splash when adding a dog
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(INTERVIEW_STEPS.length).fill(""));
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dogData, setDogData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);
  const savingRef = useRef(false);

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
      alert("Impossible d'envoyer la photo. Réessaie.");
    } finally {
      setUploading(false);
    }
  };

  const toggleMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("La dictée vocale n'est pas supportée sur ce navigateur. Utilise Chrome.");
      return;
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
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
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    if (step < INTERVIEW_STEPS.length - 1) { setStep(s => s + 1); return; }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const FREE_MAX = 1, PREMIUM_MAX = 3;
      const existingDogs = await base44.entities.Dog.filter({ owner: user.email });
      const maxDogs = isUserPremium(user) ? PREMIUM_MAX : FREE_MAX;
      if ((existingDogs || []).length >= maxDogs) {
        setSaving(false); savingRef.current = false;
        if (!isUserPremium(user)) navigate(createPageUrl("Premium") + "?from=profile");
        else { toast.error("Maximum 3 chiens atteint"); navigate(createPageUrl("Profile")); }
        return;
      }
      const ownerGoal = answers[0];
      const photoUrl = answers[1];
      const textAnswers = answers.slice(2);
      const textSteps = INTERVIEW_STEPS.slice(2);
      const prompt = `Voici les réponses d'un utilisateur concernant son chien :
${textSteps.map((s, i) => `- ${s.question} : ${textAnswers[i]}`).join('\n')}
Extrais ces informations et renvoie un objet JSON.
- Calcule une "birth_date" (YYYY-MM-DD) approximative si l'âge est donné (l'année actuelle est ${new Date().getFullYear()}).
- Pour le sexe: "male" ou "female".
- Pour le niveau d'activité: "faible", "modere", "eleve", ou "tres_eleve".
- Pour l'environnement: "appartement", "maison_sans_jardin", ou "maison_avec_jardin".
- Si une info est inconnue, mets null.`;
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" }, breed: { type: "string" }, birth_date: { type: "string" },
            sex: { type: "string" }, weight: { type: "number" }, activity_level: { type: "string" },
            environment: { type: "string" }, allergies: { type: "string" }, health_issues: { type: "string" }
          },
          required: ["name"]
        }
      });
      const extracted = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
      const dog = await base44.entities.Dog.create({
        name: extracted.name || "Mon chien", photo: photoUrl || null,
        breed: extracted.breed || null, birth_date: extracted.birth_date || null,
        sex: extracted.sex || null, weight: extracted.weight || null,
        activity_level: extracted.activity_level || null, environment: extracted.environment || null,
        allergies: extracted.allergies || null, health_issues: extracted.health_issues || null,
        owner: user.email, owner_goal: ownerGoal || null, onboarding_completed: true,
      });
      setDogData(dog);
      // Set new dog as active
      localStorage.setItem("activeDogId", dog.id);
      if (!isAddDog) {
        try {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `Bienvenue sur PawCoach, ${user.full_name || "l'ami"} !`,
            body: `${dog.name} est maintenant inscrit ! Profitez de l'application !`,
          });
        } catch (e) {
          console.warn("Welcome email failed:", e.message || e);
        }
        // Activate 7-day free trial + store nudge flag (only if no existing trial)
        try {
          if (!user.trial_expires_at) {
            const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await base44.auth.updateMe({ premium_onboarding_nudge_shown: false, trial_expires_at: trialEnd });
          }
        } catch(e) {
          console.error("Trial setup failed:", e.message || e);
        }
      }
      setDone(true);
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue lors de la création du profil. Réessaie.");
    } finally {
      setSaving(false); savingRef.current = false;
    }
  };

  if (!started) return <OnboardingWelcome onStart={() => setStarted(true)} />;
  if (done && dogData) {
    const destination = isAddDog ? "Profile" : "Home";
    return <WelcomeScreen dogName={dogData.name} dogPhoto={dogData.photo} isPremium={isUserPremium(currentUser)} onDiscover={() => navigate(createPageUrl(destination))} />;
  }

  const handleGoalSelect = (label) => {
    setCurrentAnswer(label);
    setTimeout(() => setStep(s => s + 1), 250);
  };

  const canNext = currentStepData.type === "choice" ? currentAnswer.length > 0 : (currentStepData.type === "photo" && !uploading) || currentAnswer.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-950 via-green-50/80 to-green-50">
      {/* Progress header */}
      <div className="safe-pt-14 px-6 pb-6 flex items-center gap-4">
        {step > 0 ? (
          <motion.button whileTap={{ scale: 0.96 }} transition={spring} onClick={() => setStep(s => s - 1)}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur rounded-full border border-white/30">
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
        ) : (
          <div className="w-10 h-10" />
        )}
        <div className="flex-1 bg-white/20 backdrop-blur h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-white"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <span className="text-white/70 font-bold text-sm w-10 text-right">{step + 1}/{INTERVIEW_STEPS.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="flex flex-col items-center w-full"
          >
            {/* Step icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
              style={{ background: `${currentStepData.iconColor}20`, border: `1.5px solid ${currentStepData.iconColor}30` }}
            >
              <currentStepData.icon style={{ color: currentStepData.iconColor, width: 28, height: 28 }} />
            </div>

            <h1 className="text-2xl font-black text-center text-foreground mb-10 leading-tight">
              {currentStepData.question}
            </h1>

            {/* Goal choice */}
            {currentStepData.type === "choice" && (
              <div className="w-full max-w-sm space-y-2.5 mb-10">
                {GOAL_OPTIONS.map((opt, i) => (
                  <motion.button
                    key={opt.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.07 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleGoalSelect(opt.label)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left"
                    style={{
                      background: currentAnswer === opt.label ? opt.bg : "white",
                      borderColor: currentAnswer === opt.label ? opt.color : "#e2e8f0",
                      boxShadow: currentAnswer === opt.label ? `0 4px 20px ${opt.color}25` : "none",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: opt.bg }}>
                      <opt.icon style={{ color: opt.color, width: 20, height: 20 }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                    {currentAnswer === opt.label && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto text-lg">✓</motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Photo */}
            {currentStepData.type === "photo" && (
              <div className="flex flex-col items-center mb-10">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileRef.current?.click()}
                  className="relative w-44 h-44 rounded-3xl border-2 border-dashed bg-white flex items-center justify-center overflow-hidden shadow-md mb-4 transition-all"
                  style={{ borderColor: currentAnswer ? "#10b981" : "#cbd5e1" }}
                >
                  {currentAnswer ? (
                    <img src={currentAnswer} alt="Chien" className="w-full h-full object-cover" />
                  ) : uploading ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CameraIcon className="w-10 h-10 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground font-medium">Appuyer pour choisir</span>
                    </div>
                  )}
                </motion.button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && handlePhoto(e.target.files[0])} />
                <p className="text-sm text-muted-foreground">Optionnel — tu pourras le changer</p>
              </div>
            )}

            {/* Voice + text */}
            {currentStepData.type === "voice" && (
              <>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleMic}
                  className="relative w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all"
                  style={{
                    background: listening ? "#ef4444" : "linear-gradient(135deg, #1A4D3E, #2D9F82)",
                    boxShadow: listening ? "0 0 50px rgba(239,68,68,0.45)" : "0 12px 40px rgba(26,77,62,0.35)",
                  }}
                >
                  {listening && <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />}
                  {listening ? <MicOff className="w-14 h-14 text-white" /> : <Mic className="w-14 h-14 text-white" />}
                </motion.button>

                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  {listening ? "🎙️ Je t'écoute..." : "Appuie pour dicter ou tape ci-dessous"}
                </p>
                <Input
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-center text-lg rounded-2xl border-2 focus-visible:ring-primary shadow-sm w-full max-w-sm mb-8"
                />
              </>
            )}

            {/* Next button (not for choice) */}
            {currentStepData.type !== "choice" && (
              <Button
                onClick={handleNext}
                disabled={!canNext || saving}
                className="w-full max-w-sm h-14 rounded-2xl font-black text-base gap-2 gradient-primary"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Création en cours...</>
                ) : step === INTERVIEW_STEPS.length - 1 ? (
                  <><Sparkles className="w-5 h-5" /> Créer le profil</>
                ) : (
                  <>Suivant <ChevronRight className="w-5 h-5" /></>
                )}
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}