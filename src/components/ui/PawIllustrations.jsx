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