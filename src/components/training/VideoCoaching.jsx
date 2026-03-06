import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Video, Loader2, Sparkles, AlertCircle, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

export default function VideoCoaching({ exerciseName, dogName }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const saveFeedback = async () => {
    if (!feedback || saved) return;
    try {
      const user = await base44.auth.me();
      const text = typeof feedback === "string" ? feedback : JSON.stringify(feedback);
      await base44.entities.Bookmark.create({
        dog_id: null,
        owner: user.email,
        content: `# Coaching video — ${exerciseName}\n\n${text}`,
        source: "video",
        title: `Video : ${exerciseName}`.slice(0, 60),
        created_at: new Date().toISOString(),
      });
      setSaved(true);
      toast.success("Feedback sauvegarde !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFeedback(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!isPremium && !hasCredits) return;
    setLoading(true);
    setError(null);

    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: file });
      if (!uploadRes || !uploadRes.file_url) {
        throw new Error("Erreur lors de l'upload de la vidéo.");
      }

      const prompt = `Agis comme un éducateur canin professionnel. Analyse cette courte vidéo de l'exercice "${exerciseName}" effectué par le chien ${dogName || "du propriétaire"}. Donne un feedback personnalisé, constructif et bienveillant. Structure ta réponse avec :\n1. Ce qui est bien fait\n2. Ce qui peut être amélioré\n3. Un conseil pratique pour la prochaine fois.`;

      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [uploadRes.file_url]
      });

      setFeedback(llmRes);
      if (!isPremium) await consume();
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 border border-purple-100 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="font-bold text-foreground">Coaching Vidéo IA</h3>
      </div>

      {!isPremium && !hasCredits && !feedback && !loading && (
        <UpgradePrompt type="action" from="video-coaching" />
      )}

      {!feedback && !loading && hasCredits && (
        <div className="space-y-4">
          {!isPremium && credits != null && <CreditBadge remaining={credits} />}
          <p className="text-sm text-muted-foreground">
            Filme {dogName ? `ton chien ${dogName}` : "ton chien"} en train de faire l'exercice <strong>{exerciseName}</strong> et reçois un feedback personnalisé de notre IA coach !
          </p>

          <input
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!file ? (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-2"
            >
              <Video className="w-5 h-5" />
              Enregistrer une vidéo
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-100">
                <span className="text-sm text-purple-700 truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs font-semibold text-purple-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFile(null)}
                  variant="outline"
                  className="flex-1 rounded-xl text-muted-foreground border-border"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAnalyze}
                  className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Analyser
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <div className="text-center">
            <p className="font-semibold text-foreground">Analyse en cours...</p>
            <p className="text-xs text-muted-foreground mt-1">Notre coach IA observe attentivement la technique.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {feedback && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
            <ReactMarkdown className="text-sm prose prose-sm prose-purple max-w-none">
              {typeof feedback === 'string' ? feedback : JSON.stringify(feedback)}
            </ReactMarkdown>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveFeedback}
              disabled={saved}
              className={`flex-1 h-10 rounded-xl font-semibold ${saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
            >
              {saved ? <BookmarkCheck className="w-4 h-4 mr-1.5" /> : <BookmarkPlus className="w-4 h-4 mr-1.5" />}
              {saved ? "Sauvegarde" : "Sauvegarder"}
            </Button>
            <Button
              onClick={() => { setFeedback(null); setFile(null); setSaved(false); }}
              variant="outline"
              className="flex-1 h-10 rounded-xl border-purple-200 text-purple-700 font-semibold"
            >
              Nouvelle analyse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}