import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

function generateCode(email) {
  const prefix = (email || "PAW").split("@")[0].slice(0, 4).toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return prefix + suffix;
}

export default function ReferralSection({ user, onSave }) {
  const [copied, setCopied] = useState(false);

  const ensureCode = async () => {
    if (user?.referral_code) return user.referral_code;
    const code = generateCode(user?.email);
    await onSave({ referral_code: code });
    return code;
  };

  const handleCopy = async () => {
    const code = await ensureCode();
    const text = `Rejoins PawCoach, le coach IA pour ton chien ! Utilise mon code ${code} pour commencer.\nhttps://paw-coach-care.base44.app`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const code = await ensureCode();
    const text = `Rejoins PawCoach, le coach IA pour ton chien ! Utilise mon code ${code} pour commencer.`;
    const url = "https://paw-coach-care.base44.app";
    if (navigator.share) {
      await navigator.share({ title: "PawCoach", text, url });
    } else {
      handleCopy();
    }
  };

  const code = user?.referral_code;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Gift className="w-4 h-4 text-accent" />
        <span className="font-bold text-sm text-foreground">Parrainer un ami</span>
      </div>

      <div className="px-4 py-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Partage ton code avec un ami. 7 jours d'essai gratuit offerts !
        </p>

        {code ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-center">
              <p className="text-lg font-black text-foreground tracking-wider">{code}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 hover:bg-accent/20 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-accent" />
              ) : (
                <Copy className="w-4 h-4 text-accent" />
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={ensureCode}
            className="w-full py-3 rounded-xl bg-accent/10 text-accent font-semibold text-sm hover:bg-accent/20 transition-colors"
          >
            Générer mon code parrain
          </button>
        )}

        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Partager
        </button>
      </div>
    </div>
  );
}
