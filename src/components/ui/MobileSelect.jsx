import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Mobile-friendly select that opens a bottom Drawer instead of native <select>
 * Props: value, onChange, options: [{value, label}], placeholder, label
 */
export default function MobileSelect({ value, onChange, options = [], placeholder = "Sélectionner...", label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 border border-border rounded-xl px-3 py-2.5 bg-background text-sm text-left"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base font-bold">{label || placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-1 overflow-y-auto">
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary/10 text-primary border-2 border-primary/30"
                      : "bg-white border border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}