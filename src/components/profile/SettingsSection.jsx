import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Settings, ChevronDown, ChevronUp, ChevronRight,
  BookMarked, ShieldCheck, Info, LogOut, Trash2, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsSection() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold text-sm text-foreground">Réglages</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {/* Library */}
              <button
                onClick={() => navigate(createPageUrl("Library"))}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/20 transition-all"
              >
                <BookMarked className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground flex-1">Ma Bibliothèque</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Privacy */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Confidentialité et données</span>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-sm text-destructive py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer mon compte
                </button>
              </div>

              {/* About */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">À propos de PawCoach</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Version 1.0.0</p>
                  <a href="mailto:support@pawcoach.app" className="flex items-center gap-1 text-primary">
                    <Mail className="w-3 h-3" /> support@pawcoach.app
                  </a>
                  <p className="leading-relaxed mt-1">🐾 PawCoach est un coach bien-être canin. Il ne remplace pas un vétérinaire qualifié.</p>
                </div>
              </div>

              {/* Logout */}
              <div className="px-4 py-3">
                <Button
                  onClick={() => base44.auth.logout()}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-border text-foreground font-semibold gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 pb-8 px-5">
          <div className="bg-white rounded-3xl p-6 w-full space-y-4 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Supprimer mon compte</h2>
              <p className="text-sm text-muted-foreground">
                Cette action est irréversible. Toutes tes données seront supprimées définitivement.
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Contacte-nous à{" "}
              <a href="mailto:support@pawcoach.app" className="text-primary underline">support@pawcoach.app</a>
            </p>
            <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="w-full h-12 rounded-xl">
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}