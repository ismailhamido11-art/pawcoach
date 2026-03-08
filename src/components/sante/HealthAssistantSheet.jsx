import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import useBackClose from "@/hooks/useBackClose";
import SmartHealthAssistant from "@/components/notebook/SmartHealthAssistant";

export default function HealthAssistantSheet({ visible, onClose, dogId, dog, onRecordAdded }) {
  useBackClose(visible, onClose);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{
              maxHeight: "88vh",
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1A4D3E 0%, #2D9F82 100%)" }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm leading-tight">
                    Assistant Sante
                  </p>
                  {dog?.name && (
                    <p className="text-[10px] text-muted-foreground">
                      Suivi de {dog.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Assistant */}
            <div className="flex-1 overflow-hidden px-3 py-3">
              {dogId && (
                <SmartHealthAssistant
                  dogId={dogId}
                  onRecordAdded={onRecordAdded}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
