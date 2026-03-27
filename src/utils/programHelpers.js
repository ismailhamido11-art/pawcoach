/**
 * programHelpers.js — Shared helpers for training programs & activity display.
 */
import { PawPrint, Gamepad2, Brain, Wind, Moon, Target } from "lucide-react";

/**
 * Icon + color mapping for activity types used in training program cards.
 * "repos actif" is included (merged from AITrainingProgram + ActiveProgramCards).
 *
 * Usage:
 *   const { Icon, color } = ACTIVITY_ICONS[actType] ?? ACTIVITY_ICONS.balade;
 *   return <Icon className={`w-5 h-5 ${color}`} />;
 */
export const ACTIVITY_ICONS = {
  balade:           { Icon: PawPrint, color: "text-emerald-600" },
  jeu:              { Icon: Gamepad2, color: "text-emerald-600" },
  "exercice mental":{ Icon: Brain,    color: "text-violet-600" },
  "repos actif":    { Icon: Wind,     color: "text-blue-500" },
  repos:            { Icon: Moon,     color: "text-indigo-500" },
  entraînement:     { Icon: Target,   color: "text-emerald-700" },
};
