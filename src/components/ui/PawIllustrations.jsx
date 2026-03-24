/**
 * PawIllustrations — Unified SVG illustration library for PawCoach
 * Same artistic style as DogIllustrations (check-in dogs).
 * Each illustration is a self-contained SVG component.
 * color prop drives the main tint; accent props add secondary color.
 */

// ─── Shared helpers ────────────────────────────────────────────────────────────
const SHADOW = ({ cx = 100, rx = 55, opacity = 0.12 }) => (
  <ellipse cx={cx} cy="190" rx={rx} ry="9" fill="black" fillOpacity={opacity} />
);

// ─── Hero / Home ───────────────────────────────────────────────────────────────

/** Dog sitting happily, paw up — used on Home hero / welcome */
export function DogWave({ color = "#2d9f82" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="154" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      {/* back legs */}
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      {/* front left leg sitting */}
      <rect x="72" y="160" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="80" cy="184" rx="11" ry="6" fill={color} />
      {/* front right arm raised — waving */}
      <path d="M122 148 Q148 118 156 100" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="158" cy="96" rx="12" ry="12" fill={color} />
      {/* paw on raised arm */}
      <ellipse cx="158" cy="88" rx="8" ry="6" fill="white" fillOpacity="0.3" />
      {/* tail curved up */}
      <path d="M148 138 Q176 112 170 88" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="168" cy="84" rx="8" ry="8" fill={color} />
      {/* neck */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      {/* head */}
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* ears perky */}
      <path d="M58 62 Q36 44 42 68 Q50 62 58 68Z" fill={color} />
      <path d="M142 62 Q164 44 158 68 Q150 62 142 68Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="102" rx="17" ry="11" fill="white" fillOpacity="0.38" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* big smile + tongue */}
      <path d="M84 110 Q100 122 116 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="118" rx="10" ry="8" fill="#fca5a5" />
      <ellipse cx="100" cy="123" rx="7" ry="5" fill="#f87171" />
      {/* happy arc eyes */}
      <path d="M70 80 Q80 70 90 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M110 80 Q120 70 130 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* rosy cheeks */}
      <ellipse cx="70" cy="97" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.38" />
      <ellipse cx="130" cy="97" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.38" />
      {/* sparkles */}
      <path d="M20 52 L22 44 L24 52 L32 54 L24 56 L22 64 L20 56 L12 54Z" fill="#34d399" fillOpacity="0.7" />
    </svg>
  );
}

/** Dog with magnifying glass — Scan page */
export function DogDetective({ color = "#6366f1" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      {/* legs */}
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      {/* arm holding magnifier */}
      <path d="M124 148 Q150 136 158 120" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* magnifying glass */}
      <circle cx="162" cy="110" r="18" stroke="white" strokeWidth="5" fill="none" strokeOpacity="0.8" />
      <circle cx="162" cy="110" r="12" fill="white" fillOpacity="0.15" />
      <line x1="174" y1="122" x2="184" y2="134" stroke="white" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.7" />
      {/* lens glint */}
      <ellipse cx="156" cy="104" rx="4" ry="3" fill="white" fillOpacity="0.5" />
      {/* tail */}
      <path d="M148 138 Q172 120 168 96" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* detective hat */}
      <rect x="66" y="54" width="68" height="10" rx="5" fill="#1a0a0a" fillOpacity="0.45" />
      <ellipse cx="100" cy="50" rx="30" ry="10" fill="#1a0a0a" fillOpacity="0.45" />
      <rect x="76" y="40" width="48" height="16" rx="5" fill="#1a0a0a" fillOpacity="0.4" />
      {/* ears */}
      <path d="M58 62 Q36 46 42 68 Q50 62 58 68Z" fill={color} />
      <path d="M142 62 Q164 46 158 68 Q150 62 142 68Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* focused eyes */}
      <ellipse cx="78" cy="84" rx="9" ry="10" fill="white" />
      <ellipse cx="80" cy="85" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="77" cy="82" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <ellipse cx="122" cy="84" rx="9" ry="10" fill="white" />
      <ellipse cx="120" cy="85" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="117" cy="82" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      {/* slight smirk */}
      <path d="M90 110 Q100 116 112 108" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Dog with graduation cap — Training page */
export function DogGrad({ color = "#8b5cf6" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="58" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="67" cy="194" rx="12" ry="6" fill={color} />
      <rect x="122" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="131" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail up proud */}
      <path d="M148 136 Q178 108 172 80" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="170" cy="76" rx="8" ry="8" fill={color} />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* graduation cap */}
      <rect x="68" y="56" width="64" height="8" rx="4" fill="#1a0a0a" fillOpacity="0.5" />
      <polygon points="100,38 138,54 100,58 62,54" fill="#1a0a0a" fillOpacity="0.45" />
      {/* tassel */}
      <line x1="138" y1="54" x2="148" y2="62" stroke="#34d399" strokeWidth="2" />
      <circle cx="150" cy="64" r="4" fill="#34d399" />
      {/* ears */}
      <path d="M58 64 Q36 48 42 70 Q50 64 58 70Z" fill={color} />
      <path d="M142 64 Q164 48 158 70 Q150 64 142 70Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* proud smile */}
      <path d="M86 110 Q100 122 114 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="118" rx="9" ry="7" fill="#fca5a5" />
      {/* confident eyes */}
      <path d="M70 80 Q80 72 90 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M110 80 Q120 72 130 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
      <ellipse cx="130" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
      {/* diploma scroll */}
      <rect x="18" y="120" width="28" height="20" rx="4" fill="white" fillOpacity="0.35" />
      <line x1="23" y1="128" x2="41" y2="128" stroke={color} strokeWidth="2" strokeOpacity="0.6" />
      <line x1="23" y1="133" x2="37" y2="133" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
}

/** Dog with leaf/salad — Nutrition page */
export function DogChef({ color = "#10b981" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      <ellipse cx="100" cy="150" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="150" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="158" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="58" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="67" cy="194" rx="12" ry="6" fill={color} />
      <rect x="122" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="131" cy="194" rx="12" ry="6" fill={color} />
      {/* arm holding bowl */}
      <path d="M58 148 Q38 130 30 110" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* salad bowl */}
      <ellipse cx="28" cy="104" rx="22" ry="10" fill="white" fillOpacity="0.6" />
      <path d="M10 104 Q28 120 46 104" fill={color} fillOpacity="0.4" />
      {/* salad leaves */}
      <ellipse cx="22" cy="96" rx="8" ry="6" fill="#4ade80" fillOpacity="0.9" transform="rotate(-20 22 96)" />
      <ellipse cx="34" cy="94" rx="8" ry="6" fill="#4ade80" fillOpacity="0.9" transform="rotate(15 34 94)" />
      <ellipse cx="28" cy="92" rx="7" ry="5" fill="#86efac" fillOpacity="0.9" />
      {/* other arm out */}
      <path d="M140 152 Q164 142 170 128" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="172" cy="124" rx="10" ry="10" fill={color} />
      {/* tail up */}
      <path d="M148 138 Q174 118 170 94" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="118" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="90" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="74" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* chef hat */}
      <rect x="74" y="60" width="52" height="8" rx="4" fill="white" fillOpacity="0.7" />
      <ellipse cx="100" cy="52" rx="24" ry="16" fill="white" fillOpacity="0.65" />
      {/* ears */}
      <path d="M58 66 Q36 50 42 72 Q50 66 58 72Z" fill={color} />
      <path d="M142 66 Q164 50 158 72 Q150 66 142 72Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="104" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="98" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="96" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* happy smile + tongue */}
      <path d="M84 112 Q100 124 116 112" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="120" rx="10" ry="8" fill="#fca5a5" />
      {/* happy eyes */}
      <path d="M70 82 Q80 72 90 82" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M110 82 Q120 72 130 82" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="98" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.38" />
      <ellipse cx="130" cy="98" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.38" />
    </svg>
  );
}

/** Dog with medical cross — Notebook/Health page */
export function DogDoctor({ color = "#ef4444" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      {/* stethoscope arm */}
      <path d="M56 146 Q32 136 20 116" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* stethoscope */}
      <circle cx="18" cy="110" r="10" stroke="white" strokeWidth="4" fill="none" strokeOpacity="0.7" />
      <path d="M28 110 Q40 92 52 90" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.6" />
      <circle cx="54" cy="88" r="5" fill="white" fillOpacity="0.7" />
      {/* other arm + medical cross badge */}
      <path d="M140 152 Q162 140 168 122" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <rect x="158" y="108" width="22" height="22" rx="6" fill="white" fillOpacity="0.6" />
      <rect x="165" y="112" width="8" height="14" rx="2" fill={color} fillOpacity="0.7" />
      <rect x="161" y="116" width="16" height="6" rx="2" fill={color} fillOpacity="0.7" />
      {/* tail */}
      <path d="M148 136 Q172 118 166 92" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* mirror headband */}
      <path d="M62 76 Q100 68 138 76" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
      <circle cx="100" cy="70" r="9" fill="white" fillOpacity="0.4" />
      <circle cx="100" cy="70" r="5" fill={color} fillOpacity="0.5" />
      {/* ears */}
      <path d="M58 66 Q36 48 42 70 Q50 64 58 70Z" fill={color} />
      <path d="M142 66 Q164 48 158 70 Q150 64 142 70Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* caring smile */}
      <path d="M86 110 Q100 120 114 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* caring eyes */}
      <ellipse cx="78" cy="84" rx="9" ry="10" fill="white" />
      <ellipse cx="78" cy="85" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="75" cy="82" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <ellipse cx="122" cy="84" rx="9" ry="10" fill="white" />
      <ellipse cx="122" cy="85" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="119" cy="82" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

/** Dog with chat bubble — Chat page */
export function DogChat({ color = "#3b82f6" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail up */}
      <path d="M148 136 Q176 110 170 86" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* speech bubble */}
      <rect x="130" y="40" width="58" height="40" rx="12" fill="white" fillOpacity="0.7" />
      <path d="M136 80 L130 92 L148 80Z" fill="white" fillOpacity="0.7" />
      {/* dots in bubble */}
      <circle cx="147" cy="60" r="4" fill={color} fillOpacity="0.7" />
      <circle cx="159" cy="60" r="4" fill={color} fillOpacity="0.7" />
      <circle cx="171" cy="60" r="4" fill={color} fillOpacity="0.7" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* ears */}
      <path d="M58 64 Q36 46 42 70 Q50 64 58 70Z" fill={color} />
      <path d="M142 64 Q164 46 158 70 Q150 64 142 70Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* friendly smile */}
      <path d="M84 110 Q100 122 116 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="118" rx="10" ry="8" fill="#fca5a5" />
      {/* happy eyes */}
      <path d="M70 80 Q80 70 90 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M110 80 Q120 70 130 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
      <ellipse cx="130" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
    </svg>
  );
}

/** Dog with trophy — Milestone / streak */
export function DogTrophy({ color = "#10b981" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      {/* arm holding trophy */}
      <path d="M58 148 Q36 130 26 108" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* trophy cup */}
      <path d="M16 88 Q16 106 28 110 L28 118 L20 122 L36 122 L28 118 L28 110 Q40 106 40 88Z" fill="#34d399" fillOpacity="0.9" />
      <rect x="16" y="84" width="24" height="8" rx="4" fill="#34d399" fillOpacity="0.9" />
      <path d="M16 88 Q8 88 8 96 Q8 104 16 104" stroke="#34d399" strokeWidth="4" strokeLinecap="round" fill="none" fillOpacity="0.8" />
      <path d="M40 88 Q48 88 48 96 Q48 104 40 104" stroke="#34d399" strokeWidth="4" strokeLinecap="round" fill="none" fillOpacity="0.8" />
      {/* star on trophy */}
      <path d="M28 90 L29.5 94.5 L34 94.5 L30.5 97 L31.8 102 L28 99 L24.2 102 L25.5 97 L22 94.5 L26.5 94.5Z" fill="white" fillOpacity="0.8" />
      {/* other arm raised */}
      <path d="M140 152 Q164 136 168 114" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="170" cy="110" rx="10" ry="10" fill={color} />
      {/* tail highest */}
      <path d="M148 132 Q180 100 174 72" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M174 72 Q186 56 176 48" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* ears very perky */}
      <path d="M56 60 Q34 42 40 66 Q48 60 56 66Z" fill={color} />
      <path d="M144 60 Q166 42 160 66 Q152 60 144 66Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* huge grin */}
      <path d="M80 110 Q100 128 120 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="120" rx="13" ry="10" fill="#fca5a5" />
      <ellipse cx="100" cy="126" rx="9" ry="5.5" fill="#f87171" />
      {/* heart eyes */}
      <path d="M64 72 C64 66 70 64 73 69 C76 64 82 66 82 72 C82 80 73 88 73 88 C73 88 64 80 64 72Z" fill="#ff4d6d" />
      <path d="M118 72 C118 66 124 64 127 69 C130 64 136 66 136 72 C136 80 127 88 127 88 C127 88 118 80 118 72Z" fill="#ff4d6d" />
      <ellipse cx="68" cy="70" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      <ellipse cx="122" cy="70" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      {/* sparkles */}
      <path d="M22 46 L24 38 L26 46 L34 48 L26 50 L24 58 L22 50 L14 48Z" fill="#34d399" fillOpacity="0.8" />
      <path d="M168 30 L170 24 L172 30 L178 32 L172 34 L170 40 L168 34 L162 32Z" fill="#34d399" fillOpacity="0.7" />
    </svg>
  );
}

/** Dog looking up curious — empty state generic */
export function DogCurious({ color = "#94a3b8" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="55" ry="9" fill="black" fillOpacity="0.1" />
      <ellipse cx="100" cy="150" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="150" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="158" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="164" width="16" height="22" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="164" width="16" height="22" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail questioning curve */}
      <path d="M148 138 Q174 122 170 96 Q166 78 154 82" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* head tilted slightly */}
      <ellipse cx="100" cy="118" rx="26" ry="18" fill={color} />
      <ellipse cx="102" cy="88" rx="42" ry="36" fill={color} transform="rotate(5 102 88)" />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* question mark floating */}
      <text x="152" y="66" fontSize="28" fontWeight="900" fill={color} fillOpacity="0.6" fontFamily="sans-serif">?</text>
      {/* floppy ears */}
      <path d="M56 70 Q34 54 38 78 Q46 70 56 76Z" fill={color} />
      <path d="M146 62 Q168 48 162 72 Q154 66 146 72Z" fill={color} />
      {/* snout */}
      <ellipse cx="102" cy="103" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="102" cy="97" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="98" cy="95" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* curious slight smile */}
      <path d="M90 112 Q102 118 114 112" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* wide curious eyes — one bigger */}
      <ellipse cx="80" cy="84" rx="10" ry="11" fill="white" />
      <ellipse cx="80" cy="85" rx="7" ry="8" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="77" cy="82" rx="2.5" ry="3" fill="white" fillOpacity="0.7" />
      <ellipse cx="122" cy="84" rx="8" ry="9" fill="white" />
      <ellipse cx="122" cy="85" rx="5" ry="6.5" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="119" cy="82" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      {/* one raised eyebrow */}
      <path d="M72 73 Q80 67 88 73" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Dog sleeping curled up, zzz floating */
export function DogSleepy({ color = "#818cf8" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={52} opacity={0.1} />
      {/* curled body — big oval rotated */}
      <ellipse cx="100" cy="158" rx="60" ry="30" fill={color} />
      <ellipse cx="100" cy="158" rx="60" ry="30" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="162" rx="38" ry="18" fill="white" fillOpacity="0.2" />
      {/* tail curled inward */}
      <path d="M152 148 Q178 136 172 110 Q168 96 156 102" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* front paws tucked */}
      <ellipse cx="68" cy="178" rx="18" ry="10" fill={color} />
      <ellipse cx="68" cy="183" rx="13" ry="6" fill="white" fillOpacity="0.2" />
      <ellipse cx="132" cy="178" rx="18" ry="10" fill={color} />
      <ellipse cx="132" cy="183" rx="13" ry="6" fill="white" fillOpacity="0.2" />
      {/* head resting, slightly tilted */}
      <ellipse cx="96" cy="130" rx="38" ry="32" fill={color} transform="rotate(-12 96 130)" />
      <ellipse cx="84" cy="116" rx="14" ry="9" fill="white" fillOpacity="0.13" />
      {/* floppy ears drooping */}
      <path d="M60 122 Q38 112 44 136 Q52 128 60 134Z" fill={color} />
      <path d="M128 116 Q150 106 148 130 Q140 124 130 128Z" fill={color} />
      {/* snout */}
      <ellipse cx="96" cy="142" rx="20" ry="13" fill="white" fillOpacity="0.28" />
      <ellipse cx="96" cy="136" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.7" />
      <ellipse cx="93" cy="134" rx="2.5" ry="2" fill="white" fillOpacity="0.45" />
      {/* closed sleeping eyes — curved lines */}
      <path d="M70 120 Q78 114 86 120" stroke="#1a0a0a" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M104 116 Q112 110 120 116" stroke="#1a0a0a" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* sleepy smile */}
      <path d="M84 148 Q96 154 108 148" stroke="#1a0a0a" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* zzz floating */}
      <text x="148" y="80" fontSize="16" fontWeight="900" fill={color} fillOpacity="0.7" fontFamily="sans-serif">z</text>
      <text x="160" y="64" fontSize="20" fontWeight="900" fill={color} fillOpacity="0.55" fontFamily="sans-serif">z</text>
      <text x="174" y="46" fontSize="24" fontWeight="900" fill={color} fillOpacity="0.4" fontFamily="sans-serif">z</text>
      {/* moon accent */}
      <path d="M22 50 Q30 38 42 42 Q28 54 30 68 Q16 64 22 50Z" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

/** Dog running energetically, legs stretched */
export function DogRunner({ color = "#f59e0b" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={108} rx={48} opacity={0.1} />
      {/* body leaning forward */}
      <ellipse cx="108" cy="140" rx="50" ry="28" fill={color} transform="rotate(-18 108 140)" />
      <ellipse cx="108" cy="140" rx="50" ry="28" fill="white" fillOpacity="0.1" transform="rotate(-18 108 140)" />
      <ellipse cx="108" cy="146" rx="30" ry="16" fill="white" fillOpacity="0.2" transform="rotate(-18 108 146)" />
      {/* back legs — stride position */}
      <path d="M80 158 Q62 170 52 185" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="48" cy="188" rx="14" ry="6" fill={color} />
      <path d="M96 162 Q112 176 126 180" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="130" cy="181" rx="14" ry="6" fill={color} />
      {/* front legs — stretched forward */}
      <path d="M120 132 Q138 122 152 115" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="156" cy="113" rx="12" ry="6" fill={color} />
      <path d="M110 128 Q126 114 142 108" stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
      <ellipse cx="146" cy="106" rx="12" ry="6" fill={color} />
      {/* tail streaming back */}
      <path d="M70 134 Q44 124 28 110 Q18 102 22 90" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="23" cy="86" rx="8" ry="8" fill={color} />
      {/* neck + head pushed forward */}
      <ellipse cx="134" cy="116" rx="22" ry="16" fill={color} transform="rotate(-22 134 116)" />
      <ellipse cx="148" cy="92" rx="38" ry="32" fill={color} transform="rotate(-12 148 92)" />
      <ellipse cx="140" cy="76" rx="14" ry="9" fill="white" fillOpacity="0.13" />
      {/* ears blown back by wind */}
      <path d="M124 74 Q102 58 108 80 Q116 74 124 80Z" fill={color} />
      <path d="M168 72 Q188 58 184 80 Q176 74 168 80Z" fill={color} />
      {/* snout */}
      <ellipse cx="172" cy="104" rx="20" ry="13" fill="white" fillOpacity="0.28" transform="rotate(-12 172 104)" />
      <ellipse cx="170" cy="98" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" transform="rotate(-12 170 98)" />
      <ellipse cx="167" cy="96" rx="2.5" ry="2" fill="white" fillOpacity="0.5" />
      {/* excited open mouth */}
      <path d="M158 108 Q168 120 178 110" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="168" cy="116" rx="9" ry="7" fill="#fca5a5" />
      <ellipse cx="168" cy="120" rx="6" ry="4" fill="#f87171" />
      {/* focused eyes */}
      <path d="M130 82 Q138 74 146 82" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M152 80 Q160 72 168 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* speed lines */}
      <line x1="18" y1="126" x2="40" y2="126" stroke={color} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="10" y1="138" x2="36" y2="138" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="14" y1="150" x2="34" y2="150" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" />
    </svg>
  );
}

/** Dog eating from bowl, tail wagging */
export function DogEating({ color = "#10b981" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.11} />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      {/* back legs sitting */}
      <rect x="58" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="67" cy="194" rx="12" ry="6" fill={color} />
      <rect x="122" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="131" cy="194" rx="12" ry="6" fill={color} />
      {/* food bowl on ground */}
      <ellipse cx="82" cy="186" rx="30" ry="8" fill="white" fillOpacity="0.5" />
      <path d="M56 182 Q82 196 108 182" fill={color} fillOpacity="0.35" />
      <ellipse cx="82" cy="178" rx="22" ry="6" fill="white" fillOpacity="0.3" />
      {/* kibble in bowl */}
      <circle cx="74" cy="176" r="3.5" fill={color} fillOpacity="0.7" />
      <circle cx="82" cy="174" r="3.5" fill={color} fillOpacity="0.7" />
      <circle cx="90" cy="176" r="3.5" fill={color} fillOpacity="0.7" />
      {/* tail wagging — angled high */}
      <path d="M148 134 Q178 106 176 78" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M176 78 Q184 62 176 56" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* neck + head leaned down toward bowl */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} transform="rotate(10 100 116)" />
      <ellipse cx="88" cy="94" rx="40" ry="34" fill={color} transform="rotate(15 88 94)" />
      <ellipse cx="76" cy="80" rx="14" ry="9" fill="white" fillOpacity="0.13" />
      {/* ears flopped forward */}
      <path d="M52 80 Q30 66 36 90 Q44 82 52 88Z" fill={color} />
      <path d="M118 70 Q138 54 138 78 Q130 72 120 76Z" fill={color} />
      {/* snout near bowl */}
      <ellipse cx="82" cy="108" rx="22" ry="14" fill="white" fillOpacity="0.28" transform="rotate(15 82 108)" />
      <ellipse cx="80" cy="102" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="77" cy="100" rx="2.5" ry="2" fill="white" fillOpacity="0.5" />
      {/* tongue lapping */}
      <path d="M68 110 Q78 122 90 114" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="76" cy="118" rx="10" ry="7" fill="#fca5a5" transform="rotate(15 76 118)" />
      <ellipse cx="76" cy="122" rx="7" ry="5" fill="#f87171" transform="rotate(15 76 122)" />
      {/* happy squint eyes */}
      <path d="M60 86 Q68 78 76 86" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M94 80 Q102 72 110 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* steam from food */}
      <path d="M74 166 Q72 158 74 150" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
      <path d="M82 164 Q80 154 82 146" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.4" />
      <path d="M90 166 Q88 158 90 150" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
    </svg>
  );
}

/** Dog holding camera, photographer pose */
export function DogCamera({ color = "#6366f1" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.11} />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      {/* arms holding camera */}
      <path d="M58 144 Q40 134 34 116" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M140 144 Q158 134 164 116" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* camera body */}
      <rect x="46" y="100" width="108" height="72" rx="10" fill="white" fillOpacity="0.6" />
      <rect x="46" y="100" width="108" height="72" rx="10" fill="white" fillOpacity="0.1" />
      {/* camera viewfinder bump */}
      <rect x="72" y="90" width="28" height="14" rx="5" fill="white" fillOpacity="0.55" />
      {/* flash */}
      <rect x="108" y="92" width="16" height="10" rx="3" fill="#fef08a" fillOpacity="0.8" />
      {/* camera lens */}
      <circle cx="100" cy="138" r="22" fill={color} fillOpacity="0.35" />
      <circle cx="100" cy="138" r="16" fill={color} fillOpacity="0.45" />
      <circle cx="100" cy="138" r="10" fill="white" fillOpacity="0.2" />
      <ellipse cx="95" cy="133" rx="4" ry="3" fill="white" fillOpacity="0.4" />
      {/* shutter button */}
      <circle cx="132" cy="108" r="6" fill={color} fillOpacity="0.6" />
      {/* tail */}
      <path d="M148 134 Q174 116 170 90" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="76" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="50" rx="40" ry="34" fill={color} />
      <ellipse cx="88" cy="36" rx="14" ry="9" fill="white" fillOpacity="0.13" />
      {/* ears */}
      <path d="M60 40 Q38 24 44 48 Q52 42 60 48Z" fill={color} />
      <path d="M140 40 Q162 24 156 48 Q148 42 140 48Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="64" rx="20" ry="13" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="58" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="97" cy="56" rx="2.5" ry="2" fill="white" fillOpacity="0.5" />
      {/* focused one-eye squint (looking through viewfinder) */}
      <ellipse cx="78" cy="46" rx="9" ry="10" fill="white" />
      <ellipse cx="80" cy="47" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="77" cy="44" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <path d="M110 42 Q118 34 126 42" stroke="#1a0a0a" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* cheeky smile */}
      <path d="M86 70 Q100 80 114 70" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* flash sparkle */}
      <path d="M148 24 L150 18 L152 24 L158 26 L152 28 L150 34 L148 28 L142 26Z" fill="#fef08a" fillOpacity="0.8" />
    </svg>
  );
}

/** Dog with heart floating above, loving expression */
export function DogHeart({ color = "#f43f5e" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.11} />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail curved with love */}
      <path d="M148 134 Q176 112 172 84" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M172 84 Q180 66 170 60" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* big heart floating */}
      <path d="M84 40 C84 30 92 26 100 34 C108 26 116 30 116 40 C116 52 100 64 100 64 C100 64 84 52 84 40Z" fill="#ff4d6d" />
      <ellipse cx="92" cy="36" rx="4" ry="5" fill="white" fillOpacity="0.4" />
      {/* small hearts trailing */}
      <path d="M62 58 C62 53 66 51 70 55 C74 51 78 53 78 58 C78 63 70 68 70 68 C70 68 62 63 62 58Z" fill="#ff4d6d" fillOpacity="0.5" />
      <path d="M128 50 C128 46 131 44 134 47 C137 44 140 46 140 50 C140 54 134 58 134 58 C134 58 128 54 128 50Z" fill="#ff4d6d" fillOpacity="0.4" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* ears */}
      <path d="M58 62 Q36 44 42 68 Q50 62 58 68Z" fill={color} />
      <path d="M142 62 Q164 44 158 68 Q150 62 142 68Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* loving smile + tongue */}
      <path d="M84 110 Q100 124 116 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="118" rx="11" ry="8" fill="#fca5a5" />
      <ellipse cx="100" cy="123" rx="7" ry="5" fill="#f87171" />
      {/* heart eyes */}
      <path d="M64 74 C64 68 70 66 73 71 C76 66 82 68 82 74 C82 82 73 90 73 90 C73 90 64 82 64 74Z" fill="#ff4d6d" />
      <path d="M118 74 C118 68 124 66 127 71 C130 66 136 68 136 74 C136 82 127 90 127 90 C127 90 118 82 118 74Z" fill="#ff4d6d" />
      <ellipse cx="68" cy="72" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      <ellipse cx="122" cy="72" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      {/* rosy cheeks */}
      <ellipse cx="68" cy="98" rx="11" ry="8" fill="#fca5a5" fillOpacity="0.45" />
      <ellipse cx="132" cy="98" rx="11" ry="8" fill="#fca5a5" fillOpacity="0.45" />
    </svg>
  );
}

/** Dog with star/sparkle, achievement vibe */
export function DogStar({ color = "#eab308" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.11} />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      {/* arm holding star */}
      <path d="M58 148 Q38 132 30 112" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* big star */}
      <path d="M30 90 L34 100 L46 100 L36 107 L40 118 L30 111 L20 118 L24 107 L14 100 L26 100Z" fill="#fef08a" fillOpacity="0.9" />
      <ellipse cx="24" cy="96" rx="3" ry="4" fill="white" fillOpacity="0.4" />
      {/* other arm raised */}
      <path d="M140 152 Q164 136 168 114" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="170" cy="110" rx="10" ry="10" fill={color} />
      {/* tail proud and high */}
      <path d="M148 132 Q178 106 172 78" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M172 78 Q182 60 174 52" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* star on forehead */}
      <path d="M100 56 L102 62 L108 62 L103 66 L105 72 L100 68 L95 72 L97 66 L92 62 L98 62Z" fill="#fef08a" fillOpacity="0.85" />
      {/* ears */}
      <path d="M56 60 Q34 42 40 66 Q48 60 56 66Z" fill={color} />
      <path d="M144 60 Q166 42 160 66 Q152 60 144 66Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* beaming smile */}
      <path d="M82 110 Q100 126 118 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="119" rx="12" ry="9" fill="#fca5a5" />
      <ellipse cx="100" cy="124" rx="8" ry="5" fill="#f87171" />
      {/* glowing eyes */}
      <path d="M70 80 Q80 70 90 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M110 80 Q120 70 130 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.4" />
      <ellipse cx="130" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.4" />
      {/* sparkles around */}
      <path d="M160 54 L162 46 L164 54 L172 56 L164 58 L162 66 L160 58 L152 56Z" fill="#fef08a" fillOpacity="0.8" />
      <path d="M22 36 L23.5 30 L25 36 L31 37.5 L25 39 L23.5 45 L22 39 L16 37.5Z" fill="#fef08a" fillOpacity="0.65" />
      <path d="M178 28 L179.5 22 L181 28 L187 29.5 L181 31 L179.5 37 L178 31 L172 29.5Z" fill="#fef08a" fillOpacity="0.55" />
    </svg>
  );
}

/** Dog with head tilted, question mark, confused */
export function DogQuestion({ color = "#a78bfa" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.11} />
      {/* body */}
      <ellipse cx="100" cy="150" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="150" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="158" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="164" width="16" height="22" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="164" width="16" height="22" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail questioning — curled */}
      <path d="M148 140 Q174 124 170 98 Q166 80 154 84" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head tilted notably */}
      <ellipse cx="100" cy="118" rx="26" ry="18" fill={color} />
      <ellipse cx="105" cy="87" rx="42" ry="36" fill={color} transform="rotate(14 105 87)" />
      <ellipse cx="90" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* multiple question marks */}
      <text x="150" y="72" fontSize="30" fontWeight="900" fill={color} fillOpacity="0.7" fontFamily="sans-serif">?</text>
      <text x="20" y="60" fontSize="18" fontWeight="900" fill={color} fillOpacity="0.45" fontFamily="sans-serif">?</text>
      {/* floppy ears — one more raised due to tilt */}
      <path d="M56 72 Q34 56 40 80 Q48 72 56 78Z" fill={color} />
      <path d="M148 60 Q170 44 166 68 Q158 62 148 68Z" fill={color} />
      {/* snout */}
      <ellipse cx="105" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" transform="rotate(14 105 102)" />
      <ellipse cx="105" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" transform="rotate(14 105 96)" />
      <ellipse cx="101" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* puzzled mouth */}
      <path d="M92 112 Q104 116 118 110" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* wide eyes — one bigger, both round */}
      <ellipse cx="84" cy="83" rx="10" ry="11" fill="white" />
      <ellipse cx="84" cy="84" rx="7" ry="8" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="81" cy="81" rx="2.5" ry="3" fill="white" fillOpacity="0.7" />
      <ellipse cx="124" cy="81" rx="8" ry="9" fill="white" />
      <ellipse cx="124" cy="82" rx="5.5" ry="6.5" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="121" cy="79" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      {/* raised eyebrows both */}
      <path d="M76 71 Q84 65 92 71" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M116 69 Q124 63 132 69" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Dog sitting next to calendar icon */
export function DogCalendar({ color = "#0ea5e9" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={60} opacity={0.1} />
      {/* calendar */}
      <rect x="18" y="80" width="72" height="82" rx="8" fill="white" fillOpacity="0.65" />
      <rect x="18" y="80" width="72" height="26" rx="8" fill={color} fillOpacity="0.6" />
      {/* calendar header rings */}
      <rect x="36" y="74" width="8" height="14" rx="4" fill={color} fillOpacity="0.7" />
      <rect x="64" y="74" width="8" height="14" rx="4" fill={color} fillOpacity="0.7" />
      {/* calendar grid lines */}
      <line x1="18" y1="118" x2="90" y2="118" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="18" y1="134" x2="90" y2="134" strokeWidth="1.5" stroke={color} strokeOpacity="0.3" />
      <line x1="42" y1="106" x2="42" y2="162" strokeWidth="1.5" stroke={color} strokeOpacity="0.3" />
      <line x1="66" y1="106" x2="66" y2="162" strokeWidth="1.5" stroke={color} strokeOpacity="0.3" />
      {/* checkmark on calendar */}
      <path d="M28 128 L34 136 L50 120" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.8" />
      {/* day numbers */}
      <circle cx="54" cy="126" r="7" fill={color} fillOpacity="0.25" />
      {/* body */}
      <ellipse cx="148" cy="150" rx="44" ry="32" fill={color} />
      <ellipse cx="148" cy="150" rx="44" ry="32" fill="white" fillOpacity="0.1" />
      <ellipse cx="148" cy="158" rx="26" ry="16" fill="white" fillOpacity="0.22" />
      <rect x="112" y="172" width="16" height="20" rx="8" fill={color} />
      <ellipse cx="120" cy="192" rx="11" ry="5" fill={color} />
      <rect x="168" y="172" width="16" height="20" rx="8" fill={color} />
      <ellipse cx="176" cy="192" rx="11" ry="5" fill={color} />
      {/* front leg reaching toward calendar */}
      <path d="M112 148 Q96 142 90 134" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="88" cy="131" rx="10" ry="8" fill={color} />
      {/* tail */}
      <path d="M184 138 Q200 114 196 90" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="148" cy="118" rx="24" ry="16" fill={color} />
      <ellipse cx="148" cy="90" rx="38" ry="32" fill={color} />
      <ellipse cx="136" cy="76" rx="13" ry="8" fill="white" fillOpacity="0.13" />
      {/* ears */}
      <path d="M112 78 Q92 64 98 86 Q106 80 112 86Z" fill={color} />
      <path d="M180 74 Q200 60 196 82 Q188 76 180 82Z" fill={color} />
      {/* snout */}
      <ellipse cx="148" cy="104" rx="20" ry="13" fill="white" fillOpacity="0.28" />
      <ellipse cx="148" cy="98" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="145" cy="96" rx="2.5" ry="2" fill="white" fillOpacity="0.5" />
      {/* friendly smile */}
      <path d="M134 110 Q148 120 162 110" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* bright eyes */}
      <path d="M122 80 Q130 72 138 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M158 80 Q166 72 174 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Dog on leash, walking happily */
export function DogWalking({ color = "#2d9f82" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={90} rx={50} opacity={0.11} />
      {/* leash going to upper right */}
      <path d="M126 82 Q160 60 178 36" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.7" />
      {/* leash clip on collar */}
      <circle cx="126" cy="83" r="5" fill="#94a3b8" fillOpacity="0.7" />
      {/* body leaning forward slightly */}
      <ellipse cx="90" cy="146" rx="48" ry="30" fill={color} transform="rotate(-8 90 146)" />
      <ellipse cx="90" cy="146" rx="48" ry="30" fill="white" fillOpacity="0.1" transform="rotate(-8 90 146)" />
      <ellipse cx="90" cy="152" rx="28" ry="16" fill="white" fillOpacity="0.22" transform="rotate(-8 90 152)" />
      {/* collar */}
      <ellipse cx="112" cy="110" rx="18" ry="7" fill={color} fillOpacity="0.6" transform="rotate(-12 112 110)" />
      <ellipse cx="112" cy="110" rx="18" ry="7" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.4" transform="rotate(-12 112 110)" />
      {/* legs in walking stride */}
      <path d="M66 162 Q50 174 42 188" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="38" cy="190" rx="13" ry="5" fill={color} />
      <path d="M82 166 Q82 180 86 192" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="85" cy="194" rx="13" ry="5" fill={color} />
      <path d="M100 162 Q100 176 104 188" stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
      <ellipse cx="103" cy="190" rx="12" ry="5" fill={color} />
      <path d="M114 156 Q130 166 140 178" stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
      <ellipse cx="143" cy="180" rx="12" ry="5" fill={color} />
      {/* tail up happy */}
      <path d="M128 134 Q154 112 150 86 Q148 72 138 74" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head forward */}
      <ellipse cx="112" cy="112" rx="24" ry="16" fill={color} transform="rotate(-12 112 112)" />
      <ellipse cx="124" cy="88" rx="40" ry="32" fill={color} transform="rotate(-8 124 88)" />
      <ellipse cx="114" cy="74" rx="14" ry="9" fill="white" fillOpacity="0.13" />
      {/* ears */}
      <path d="M100 74 Q80 58 84 80 Q92 74 100 80Z" fill={color} />
      <path d="M148 70 Q168 56 164 78 Q156 72 148 78Z" fill={color} />
      {/* snout */}
      <ellipse cx="148" cy="100" rx="20" ry="13" fill="white" fillOpacity="0.28" transform="rotate(-8 148 100)" />
      <ellipse cx="148" cy="94" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="145" cy="92" rx="2.5" ry="2" fill="white" fillOpacity="0.5" />
      {/* happy panting smile */}
      <path d="M136 106 Q148 118 160 108" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="148" cy="114" rx="10" ry="7" fill="#fca5a5" />
      <ellipse cx="148" cy="118" rx="7" ry="4" fill="#f87171" />
      {/* happy eyes */}
      <path d="M110 80 Q118 72 126 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M136 78 Q144 70 152 78" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* ground dots suggesting movement */}
      <circle cx="22" cy="192" r="3" fill={color} fillOpacity="0.3" />
      <circle cx="30" cy="196" r="2" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

/** Dog with book/reading, studious */
export function DogReading({ color = "#8b5cf6" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.11} />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="60" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      {/* arms holding open book */}
      <path d="M62 146 Q44 138 34 120" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M138 146 Q156 138 166 120" stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* open book */}
      <path d="M28 108 Q60 100 100 108 Q140 100 172 108 L172 148 Q140 140 100 148 Q60 140 28 148Z" fill="white" fillOpacity="0.65" />
      {/* book spine */}
      <line x1="100" y1="108" x2="100" y2="148" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      {/* text lines on left page */}
      <line x1="38" y1="118" x2="90" y2="116" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="38" y1="126" x2="86" y2="124" stroke={color} strokeWidth="2" strokeOpacity="0.35" />
      <line x1="38" y1="134" x2="82" y2="132" stroke={color} strokeWidth="2" strokeOpacity="0.35" />
      <line x1="38" y1="142" x2="78" y2="140" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      {/* text lines on right page */}
      <line x1="110" y1="116" x2="162" y2="118" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="114" y1="124" x2="162" y2="126" stroke={color} strokeWidth="2" strokeOpacity="0.35" />
      <line x1="118" y1="132" x2="162" y2="134" stroke={color} strokeWidth="2" strokeOpacity="0.35" />
      <line x1="122" y1="140" x2="162" y2="142" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      {/* tail curled beside, calm */}
      <path d="M148 136 Q172 120 168 96 Q164 80 152 84" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head looking down at book */}
      <ellipse cx="100" cy="82" rx="26" ry="18" fill={color} transform="rotate(8 100 82)" />
      <ellipse cx="100" cy="56" rx="40" ry="34" fill={color} transform="rotate(8 100 56)" />
      <ellipse cx="88" cy="42" rx="14" ry="9" fill="white" fillOpacity="0.13" />
      {/* glasses */}
      <circle cx="82" cy="58" r="12" stroke="white" strokeWidth="3" fill="none" strokeOpacity="0.6" />
      <circle cx="114" cy="56" r="12" stroke="white" strokeWidth="3" fill="none" strokeOpacity="0.6" />
      <line x1="94" y1="57" x2="102" y2="56" stroke="white" strokeWidth="2.5" strokeOpacity="0.6" />
      <line x1="70" y1="55" x2="62" y2="52" stroke="white" strokeWidth="2.5" strokeOpacity="0.5" />
      <line x1="126" y1="53" x2="134" y2="50" stroke="white" strokeWidth="2.5" strokeOpacity="0.5" />
      {/* ears */}
      <path d="M62 44 Q40 30 46 54 Q54 48 62 54Z" fill={color} />
      <path d="M138 40 Q160 26 156 50 Q148 44 138 50Z" fill={color} />
      {/* snout */}
      <ellipse cx="102" cy="70" rx="20" ry="13" fill="white" fillOpacity="0.28" transform="rotate(8 102 70)" />
      <ellipse cx="102" cy="64" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="99" cy="62" rx="2.5" ry="2" fill="white" fillOpacity="0.5" />
      {/* concentrated mouth */}
      <path d="M90 76 Q101 80 114 74" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* focused eyes through glasses */}
      <ellipse cx="82" cy="58" rx="7" ry="8" fill="white" />
      <ellipse cx="84" cy="59" rx="5" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="81" cy="56" rx="1.5" ry="2" fill="white" fillOpacity="0.7" />
      <ellipse cx="114" cy="56" rx="7" ry="8" fill="white" />
      <ellipse cx="112" cy="57" rx="5" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="109" cy="54" rx="1.5" ry="2" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

/** Dog wearing crown, premium/royal feel */
export function DogCrown({ color = "#f59e0b" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={55} opacity={0.12} />
      {/* body */}
      <ellipse cx="100" cy="148" rx="50" ry="34" fill={color} />
      <ellipse cx="100" cy="148" rx="50" ry="34" fill="white" fillOpacity="0.1" />
      <ellipse cx="100" cy="156" rx="28" ry="18" fill="white" fillOpacity="0.22" />
      <rect x="58" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="67" cy="194" rx="12" ry="6" fill={color} />
      <rect x="122" y="172" width="18" height="22" rx="9" fill={color} />
      <ellipse cx="131" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="162" width="16" height="24" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail curled proudly */}
      <path d="M148 136 Q178 110 174 82" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M174 82 Q182 66 174 58" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* neck + head */}
      <ellipse cx="100" cy="116" rx="26" ry="18" fill={color} />
      <ellipse cx="100" cy="88" rx="42" ry="36" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="11" fill="white" fillOpacity="0.13" />
      {/* crown */}
      <path d="M66 58 L66 44 L80 54 L100 36 L120 54 L134 44 L134 58Z" fill="#fef08a" fillOpacity="0.95" />
      <rect x="64" y="56" width="72" height="10" rx="3" fill="#fef08a" fillOpacity="0.85" />
      {/* crown jewels */}
      <circle cx="80" cy="50" r="5" fill="#f43f5e" fillOpacity="0.9" />
      <circle cx="100" cy="44" r="6" fill="#34d399" fillOpacity="0.9" />
      <circle cx="120" cy="50" r="5" fill="#3b82f6" fillOpacity="0.9" />
      {/* crown highlight */}
      <path d="M70 58 L70 50 Q78 56 86 52" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" fill="none" />
      {/* ears */}
      <path d="M58 64 Q36 48 42 70 Q50 64 58 70Z" fill={color} />
      <path d="M142 64 Q164 48 158 70 Q150 64 142 70Z" fill={color} />
      {/* snout */}
      <ellipse cx="100" cy="102" rx="22" ry="15" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="96" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="96" cy="94" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* regal smile */}
      <path d="M86 110 Q100 120 114 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* confident eyes */}
      <path d="M70 80 Q80 72 90 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M110 80 Q120 72 130 80" stroke="#1a0a0a" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
      <ellipse cx="130" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
      {/* sparkles around crown */}
      <path d="M22 50 L24 42 L26 50 L34 52 L26 54 L24 62 L22 54 L14 52Z" fill="#fef08a" fillOpacity="0.7" />
      <path d="M170 26 L172 20 L174 26 L180 28 L174 30 L172 36 L170 30 L164 28Z" fill="#fef08a" fillOpacity="0.65" />
    </svg>
  );
}

/** Dog sad, ears down, pouty */
export function DogSad({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SHADOW cx={100} rx={52} opacity={0.09} />
      {/* body slumped */}
      <ellipse cx="100" cy="152" rx="50" ry="32" fill={color} />
      <ellipse cx="100" cy="152" rx="50" ry="32" fill="white" fillOpacity="0.08" />
      <ellipse cx="100" cy="160" rx="28" ry="16" fill="white" fillOpacity="0.15" />
      <rect x="60" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="69" cy="194" rx="12" ry="6" fill={color} />
      <rect x="120" y="174" width="18" height="20" rx="9" fill={color} />
      <ellipse cx="129" cy="194" rx="12" ry="6" fill={color} />
      <rect x="70" y="164" width="16" height="22" rx="8" fill={color} />
      <ellipse cx="78" cy="186" rx="11" ry="6" fill={color} />
      <rect x="112" y="164" width="16" height="22" rx="8" fill={color} />
      <ellipse cx="120" cy="186" rx="11" ry="6" fill={color} />
      {/* tail drooping down */}
      <path d="M148 140 Q162 158 154 176 Q148 184 138 180" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck + head slightly bowed */}
      <ellipse cx="100" cy="120" rx="26" ry="18" fill={color} transform="rotate(-5 100 120)" />
      <ellipse cx="98" cy="90" rx="42" ry="36" fill={color} transform="rotate(-5 98 90)" />
      <ellipse cx="86" cy="74" rx="16" ry="11" fill="white" fillOpacity="0.1" />
      {/* ears drooping heavily down */}
      <path d="M56 76 Q28 84 30 108 Q40 96 54 100Z" fill={color} />
      <path d="M138 72 Q164 80 166 104 Q158 92 142 96Z" fill={color} />
      {/* snout */}
      <ellipse cx="98" cy="105" rx="22" ry="15" fill="white" fillOpacity="0.22" transform="rotate(-5 98 105)" />
      <ellipse cx="98" cy="99" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.75" />
      <ellipse cx="94" cy="97" rx="3" ry="2" fill="white" fillOpacity="0.4" />
      {/* sad frown */}
      <path d="M84 116 Q98 108 112 116" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* pouty lip */}
      <ellipse cx="98" cy="119" rx="8" ry="4" fill="#1a0a0a" fillOpacity="0.1" />
      {/* sad puppy eyes — droopy */}
      <ellipse cx="78" cy="88" rx="10" ry="11" fill="white" />
      <ellipse cx="80" cy="90" rx="7" ry="8" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="77" cy="87" rx="2.5" ry="3" fill="white" fillOpacity="0.65" />
      <ellipse cx="118" cy="87" rx="10" ry="11" fill="white" />
      <ellipse cx="116" cy="89" rx="7" ry="8" fill="#1a0a0a" fillOpacity="0.82" />
      <ellipse cx="113" cy="86" rx="2.5" ry="3" fill="white" fillOpacity="0.65" />
      {/* sad eyebrows angled down toward center */}
      <path d="M68 76 Q76 72 84 76" stroke="#1a0a0a" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" fill="none" transform="rotate(10 76 74)" />
      <path d="M112 74 Q120 70 128 74" stroke="#1a0a0a" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" fill="none" transform="rotate(-10 120 72)" />
      {/* tear drop */}
      <path d="M86 102 Q84 110 86 116 Q90 118 90 112 Q90 106 86 102Z" fill="#7dd3fc" fillOpacity="0.6" />
      {/* small rain cloud above */}
      <ellipse cx="150" cy="48" rx="20" ry="12" fill={color} fillOpacity="0.35" />
      <ellipse cx="138" cy="52" rx="14" ry="10" fill={color} fillOpacity="0.3" />
      <ellipse cx="162" cy="52" rx="14" ry="10" fill={color} fillOpacity="0.3" />
      <line x1="142" y1="62" x2="138" y2="74" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="152" y1="64" x2="148" y2="76" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="162" y1="62" x2="158" y2="74" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}