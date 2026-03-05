import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import BottomNav from "../components/BottomNav";
import ShareCard from "../components/scan/ShareCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera, ChevronDown, ChevronUp, CheckCircle, AlertTriangle,
  AlertCircle, X, History, Share2, Phone, Crown
} from "lucide-react";
import { updateStreakSilently } from "../components/streakHelper";
import { motion } from "framer-motion";
import Illustration from "../components/illustrations/Illustration";
import { isUserPremium } from "@/utils/premium";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const listContainer = { show: { transition: { staggerChildren: 0.06 } } };
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
};

const VERDICT_CONFIG = {
  safe: {
    label: "✅ Sans danger",
    badgeBg: "bg-green-100 text-green-700",
    cardBg: "bg-green-50",
    border: "border-green-200",
    ring: "#22c55e",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  caution: {
    label: "⚠️ Avec précaution",
    badgeBg: "bg-amber-100 text-amber-700",
    cardBg: "bg-amber-50",
    border: "border-amber-200",
    ring: "#d97706",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  toxic: {
    label: "💀 TOXIQUE",
    badgeBg: "bg-red-100 text-red-700",
    cardBg: "bg-red-50",
    border: "border-red-200",
    ring: "#ef4444",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
};

const FREE_SCAN_LIMIT = 3;

function CircleScore({ score, color }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = score != null ? (score / 10) * circ : 0;
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle cx="40" cy="40" r={r} stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-foreground leading-none">{score ?? "?"}</span>
        <span className="text-[10px] text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

function getWeekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Scan() {
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [dogAteIt, setDogAteIt] = useState(false);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs.length > 0) {
        const activeDog = getActiveDog(dogs);
        setDog(activeDog);
        const scans = await base44.entities.FoodScan.filter({ dog_id: activeDog.id });
        setHistory(scans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les données. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  const checkScanLimit = (u) => {
    if (isUserPremium(u)) return false;
    const weekStart = getWeekStart();
    const isSameWeek = u?.scans_week_start === weekStart;
    const count = isSameWeek ? (u?.scans_this_week || 0) : 0;
    return count >= FREE_SCAN_LIMIT;
  };

  const incrementScanCount = async (u) => {
    const weekStart = getWeekStart();
    const isSameWeek = u?.scans_week_start === weekStart;
    const newCount = isSameWeek ? (u?.scans_this_week || 0) + 1 : 1;
    await base44.auth.updateMe({ scans_this_week: newCount, scans_week_start: weekStart });
  };

  const handleFile = (f) => {
    if (checkScanLimit(user)) { setScanLimitReached(true); return; }
    setScanLimitReached(false);
    setFile(f);
    setResult(null);
    setSaved(false);
    setDogAteIt(false);
    setError(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const analyzeFood = async () => {
    if (!file || !dog) return;
    if (checkScanLimit(user)) { setScanLimitReached(true); return; }

    setScanning(true);
    setShowDetails(false);
    setDogAteIt(false);
    setError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const ageText = dog.birth_date
        ? (() => {
            const months = Math.floor((Date.now() - new Date(dog.birth_date)) / (1000 * 60 * 60 * 24 * 30));
            return months < 12 ? `${months} mois` : `${Math.floor(months / 12)} ans`;
          })()
        : "âge inconnu";

      const prompt = `Tu es PawCoach, un analyseur de sécurité alimentaire pour chiens. Analyse cette image. Si c'est un aliment brut, identifie-le et classe-le en : TOXIQUE (avec emoji crâne), AVEC PRECAUTION (avec emoji avertissement), ou SANS DANGER (avec emoji coche verte). Si c'est une étiquette de croquettes/aliment pour animaux, analyse la composition nutritionnelle et donne un score sur 10. Personnalise pour ce chien : ${dog.name}, ${dog.breed || "race inconnue"}, ${ageText}, ${dog.weight ? dog.weight + "kg" : "poids inconnu"}, allergies : ${dog.allergies || "aucune"}. Réponds en français. Utilise le tutoiement. Formate ta réponse en JSON avec ces champs : food_name (string), verdict ("toxic", "caution", ou "safe"), score (number 1-10, null si aliment brut), summary (résumé de 2-3 lignes), details (analyse nutritionnelle ou explication détaillée), recommendation (conseil personnalisé pour ${dog.name}). Sois concis et chaleureux.`;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_name: { type: "string" },
            verdict: { type: "string" },
            score: { type: "number" },
            summary: { type: "string" },
            details: { type: "string" },
            recommendation: { type: "string" },
          },
        },
      });

      await incrementScanCount(user);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);

      const finalResult = { ...aiResult, photo_url: file_url, timestamp: new Date().toISOString() };
      setResult(finalResult);
      if (finalResult.verdict === "toxic" && navigator.vibrate) navigator.vibrate(200);
    } catch (e) {
      console.error(e);
      setError("L'analyse a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setScanning(false);
    }
  };

  const saveResult = async () => {
    if (!result || !dog || !user) return;
    try {
      await base44.entities.FoodScan.create({
        dog_id: dog.id,
        photo_url: result.photo_url,
        food_name: result.food_name,
        verdict: result.verdict,
        score: result.score,
        details: result.details,
        recommendation: result.recommendation,
        timestamp: result.timestamp,
      });
      setSaved(true);
      setHistory(prev => [result, ...prev]);
      if (navigator.vibrate) navigator.vibrate(30);

      const newPoints = (user.points || 0) + 10;
      await base44.auth.updateMe({ points: newPoints });
      setUser(prev => ({ ...prev, points: newPoints }));

      // --- STREAK UPDATE ---
      await updateStreakSilently(dog.id, user.email);
    } catch (e) {
      console.error(e);
      alert("Impossible de sauvegarder. Réessaie.");
    }
  };

  const reset = () => {
    setResult(null); setPreview(null); setFile(null);
    setSaved(false); setShowDetails(false); setDogAteIt(false);
    setScanLimitReached(false); setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="gradient-primary pb-0 px-5 pt-14 overflow-hidden relative">
          <div className="flex items-start justify-between">
            <div className="pb-6">
              <div className="h-3 w-16 bg-white/20 rounded animate-pulse mb-3" />
              <div className="h-7 w-32 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse mt-2" />
            </div>
            <div className="w-28 h-28 flex-shrink-0 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="px-5 pt-5 space-y-4">
          <div className="h-52 rounded-2xl border-2 border-dashed border-muted bg-muted/20 animate-pulse" />
        </div>
        <BottomNav currentPage="Scan" />
      </div>
    );
  }

  const verdictCfg = result ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.caution : null;

  const weekStart = getWeekStart();
  const isSameWeek = user?.scans_week_start === weekStart;
  const scansUsed = isSameWeek ? (user?.scans_this_week || 0) : 0;
  const isInTrial = isUserPremium(user) && !user?.is_premium;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Emergency banner */}
      {result?.verdict === "toxic" && dogAteIt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 px-4 py-3 text-white text-center shadow-lg">
          <p className="font-bold text-sm">🚨 URGENCE — Appelle immédiatement ton vétérinaire</p>
          <a href="tel:0478871040" className="flex items-center justify-center gap-2 mt-1 text-white font-extrabold text-base">
            <Phone className="w-4 h-4" /> Centre antipoison : 04 78 87 10 40
          </a>
        </div>
      )}

      {/* Header */}
      <div className={`gradient-primary pb-0 px-5 ${result?.verdict === "toxic" && dogAteIt ? "pt-24" : "pt-14"} overflow-hidden relative`}>
        <div className="relative z-10 flex items-start justify-between">
          <div className="pb-6">
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-3">PawCoach</p>
            <h1 className="text-white font-black text-2xl leading-tight">Scan Aliment</h1>
            <p className="text-white/70 text-sm mt-1">
              {dog ? `Analyse pour ${dog.name}` : "Chargement..."}
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 flex-shrink-0 -mb-2"
          >
            <Illustration name="petFood" alt="Scan alimentaire" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => { setError(null); loadData(); }}
              className="mt-2 text-xs text-red-600 font-bold underline">
              Réessayer
            </button>
          </div>
        )}

        {/* Freemium limit reached */}
        {scanLimitReached && (
          <Card className="shadow-none border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-center space-y-3">
              <div className="w-24 h-24 mx-auto">
                <Illustration name="petFood" alt="Limite atteinte" className="w-full h-full drop-shadow-md" />
              </div>
              <p className="font-bold text-foreground">Tu as utilisé tes {FREE_SCAN_LIMIT} scans gratuits cette semaine ({scansUsed}/{FREE_SCAN_LIMIT}).</p>
              <p className="text-sm text-muted-foreground">Passe en Premium pour scanner sans limite.</p>
              <Button onClick={() => window.location.href = '/Premium?from=scan'} className="w-full h-12 rounded-xl gradient-warm border-0 text-white font-bold">
                👑 Voir Premium
              </Button>
              <button onClick={() => setScanLimitReached(false)} className="text-xs text-muted-foreground underline">
                Retour
              </button>
            </CardContent>
          </Card>
        )}

        {/* Freemium counter */}
        {!result && !scanLimitReached && !isUserPremium(user) && !isInTrial && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
            <span>Scans cette semaine : <strong className="text-foreground">{scansUsed}/{FREE_SCAN_LIMIT}</strong></span>
            <button onClick={() => window.location.href = '/Premium?from=scan'} className="flex items-center gap-1 text-primary font-semibold">
              <Crown className="w-3 h-3" /> Premium
            </button>
          </div>
        )}

        {/* Upload zone */}
        {!result && !scanLimitReached && (
          <>
            <motion.button
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={() => fileRef.current.click()}
                className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/30 py-10 flex flex-col items-center gap-4 hover:border-primary hover:bg-secondary/50 transition-colors"
              >
              {preview ? (
                <div className="relative w-full px-4">
                  <img src={preview} alt="Aperçu" className="w-full max-h-56 object-contain rounded-2xl" />
                  <button
                    onClick={e => { e.stopPropagation(); reset(); }}
                    className="absolute top-2 right-6 bg-white rounded-full p-1 shadow"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-lg">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground text-base">Scanner un aliment</p>
                    <p className="text-sm text-muted-foreground mt-1">Photo depuis ta caméra ou galerie</p>
                    <p className="text-xs text-muted-foreground mt-1">Emballage, étiquette ou aliment brut</p>
                  </div>
                </>
              )}
            </motion.button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            {preview && (
              <Button onClick={analyzeFood} disabled={scanning}
                className="w-full h-14 rounded-xl gradient-primary border-0 text-white font-bold text-base shadow-lg shadow-primary/30">
                {scanning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyse en cours...
                  </span>
                ) : "Analyser cet aliment"}
              </Button>
            )}
          </>
        )}

        {/* Result card */}
        {result && verdictCfg && (
          <div className="space-y-3">
            <Card className={`shadow-none border-2 ${verdictCfg.border} ${verdictCfg.cardBg}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <CircleScore score={result.score} color={verdictCfg.ring} />
                  <div className="flex-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${verdictCfg.badgeBg}`}>
                      {verdictCfg.label}
                    </span>
                    <p className="text-foreground font-bold text-lg mt-2 leading-tight">{result.food_name}</p>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>

                {/* Emergency: dog ate it? */}
                {result.verdict === "toxic" && (
                  <div className={`p-3 rounded-2xl border-2 ${dogAteIt ? "bg-red-100 border-red-400" : "bg-red-50 border-red-200"}`}>
                    <p className="text-sm font-bold text-red-700 mb-2">⚠️ {dog?.name} a-t-il/elle mangé cet aliment ?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDogAteIt(true)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${dogAteIt ? "bg-red-600 text-white border-red-600" : "bg-white text-red-600 border-red-300"}`}
                      >
                        Oui 😱
                      </button>
                      <button
                        onClick={() => setDogAteIt(false)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${!dogAteIt ? "bg-white text-green-600 border-green-300" : "bg-white text-gray-400 border-gray-200"}`}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-white/70 rounded-2xl border border-white">
                  <p className="text-xs font-bold text-primary mb-1">💡 Pour {dog?.name}</p>
                  <p className="text-sm text-foreground">{result.recommendation}</p>
                </div>

                <button onClick={() => setShowDetails(s => !s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showDetails ? "Masquer l'analyse" : "Voir l'analyse détaillée"}
                </button>
                {showDetails && (
                  <p className="text-sm text-foreground/70 leading-relaxed border-t border-white/60 pt-3">
                    {result.details}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Partner link — only shown for safe/caution, NEVER for toxic */}
            {result.verdict !== "toxic" && (
              <div className="bg-white rounded-2xl border border-border p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground">Disponible chez nos partenaires</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Lien partenaire</p>
                </div>
                <Button onClick={() => window.open("https://zooplus.fr", "_blank")} size="sm" variant="outline" className="rounded-xl h-8 text-xs font-semibold">
                  Voir l'offre
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={reset} className="h-12 rounded-xl font-semibold text-sm">
                Nouveau
              </Button>
              <Button onClick={() => setShowShare(true)} variant="outline"
                className="h-12 rounded-xl font-semibold text-sm gap-1">
                <Share2 className="w-3.5 h-3.5" /> Partager
              </Button>
              <Button onClick={saveResult} disabled={saved}
                className="h-12 rounded-xl gradient-primary border-0 text-white font-semibold text-sm">
                {saved ? "✅ Ok" : "Sauvegarder"}
              </Button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && !result && !scanLimitReached && (
          <div>
            <button onClick={() => setShowHistory(s => !s)}
              className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">Derniers scans ({history.length})</h2>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`} />
            </button>

            {showHistory && (
              <motion.div className="space-y-2" variants={listContainer} initial="hidden" animate="show">
                {history.slice(0, 10).map((scan, i) => {
                  const cfg = VERDICT_CONFIG[scan.verdict] || VERDICT_CONFIG.caution;
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={i} variants={listItem} className={`flex items-center gap-3 p-3 rounded-2xl border ${cfg.border} ${cfg.cardBg}`}>
                      {scan.photo_url && (
                        <img src={scan.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      )}
                      {!scan.photo_url && <Icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0`} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{scan.food_name}</p>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${cfg.badgeBg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{new Date(scan.timestamp).toLocaleDateString("fr-FR")}</p>
                        {scan.score != null && <p className="text-sm font-bold text-foreground">{scan.score}/10</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {showShare && result && (
        <ShareCard result={result} dogName={dog?.name} onClose={() => setShowShare(false)} />
      )}

      <BottomNav currentPage="Scan" />
    </div>
  );
}