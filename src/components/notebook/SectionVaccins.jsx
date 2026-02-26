import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Syringe, Plus, X, Calendar } from "lucide-react";

export default function SectionVaccins({ records, dogId, onDelete }) {

  const vaccines = records.filter(r => r.type === "vaccine").sort((a, b) => new Date(b.date) - new Date(a.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getReminderInfo = (record) => {
    let dateToUse = record.next_date;
    let isEstimated = false;
    
    if (!dateToUse) {
      // Estimate 1 year later
      const d = new Date(record.date);
      d.setFullYear(d.getFullYear() + 1);
      dateToUse = d.toISOString().split('T')[0];
      isEstimated = true;
    }

    const nextDateObj = new Date(dateToUse);
    const isOverdue = nextDateObj < today;
    
    return {
      dateStr: dateToUse,
      isEstimated,
      isOverdue,
      text: isOverdue ? "En retard" : (isEstimated ? "Rappel estimé" : "Rappel")
    };
  };

  return (
    <div className="space-y-3">
      {vaccines.length === 0 ? (
        <EmptyState emoji="💉" text="Aucun vaccin enregistré" />
      ) : (
        vaccines.map(r => {
          const reminder = getReminderInfo(r);
          return (
            <RecordRow key={r.id} record={r} onDelete={onDelete}
              icon={<Syringe className="w-4 h-4 text-blue-600" />}
              accentClass="bg-blue-50 border-blue-100"
              extra={
                <span className={`text-xs font-medium flex items-center gap-1 mt-1 ${reminder.isOverdue ? 'text-destructive' : 'text-amber-600'}`}>
                  <Calendar className="w-3 h-3" /> {reminder.text} : {fmtDate(reminder.dateStr)}
                </span>
              }
            />
          );
        })
      )}

    </div>
  );
}

function fmtDate(d) { return new Date(d).toLocaleDateString("fr-FR"); }

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}

export function RecordRow({ record, onDelete, icon, accentClass, extra }) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border bg-white`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${accentClass || "bg-muted border-border"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{record.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(record.date)}</p>
        {extra}
        {record.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.details}</p>}
      </div>
      <button onClick={() => onDelete(record.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}