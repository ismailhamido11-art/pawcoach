// Realistic cute dog SVG illustrations for check-in cards
// Each dog has: body, head, snout, ears, eyes, tail, legs — proper dog anatomy

export function DogSad({ color = "#f43f5e" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* shadow */}
      <ellipse cx="100" cy="185" rx="52" ry="9" fill="black" fillOpacity="0.12" />
      {/* body */}
      <ellipse cx="100" cy="148" rx="52" ry="36" fill={color} />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill="white" fillOpacity="0.12" />
      {/* belly patch */}
      <ellipse cx="100" cy="155" rx="28" ry="20" fill="white" fillOpacity="0.25" />
      {/* tail drooping down */}
      <path d="M148 150 Q175 165 170 188" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="167" cy="191" rx="8" ry="6" fill={color} />
      {/* back legs */}
      <rect x="55" y="172" width="18" height="24" rx="9" fill={color} />
      <ellipse cx="64" cy="196" rx="11" ry="6" fill={color} />
      <rect x="125" y="172" width="18" height="24" rx="9" fill={color} />
      <ellipse cx="134" cy="196" rx="11" ry="6" fill={color} />
      {/* front legs */}
      <rect x="72" y="164" width="16" height="26" rx="8" fill={color} />
      <ellipse cx="80" cy="190" rx="10" ry="6" fill={color} />
      <rect x="110" y="164" width="16" height="26" rx="8" fill={color} />
      <ellipse cx="118" cy="190" rx="10" ry="6" fill={color} />
      {/* neck */}
      <ellipse cx="100" cy="118" rx="28" ry="20" fill={color} />
      {/* head */}
      <ellipse cx="100" cy="90" rx="42" ry="38" fill={color} />
      {/* head highlight */}
      <ellipse cx="88" cy="72" rx="16" ry="12" fill="white" fillOpacity="0.15" />
      {/* floppy sad ears */}
      <path d="M58 72 Q32 55 34 88 Q44 80 58 86Z" fill={color} />
      <path d="M58 72 Q36 58 38 88 Q46 82 58 86Z" fill={color} />
      <path d="M58 72 Q34 56 36 86" stroke="black" strokeOpacity="0.1" strokeWidth="1" fill="none" />
      <path d="M142 72 Q168 55 166 88 Q156 80 142 86Z" fill={color} />

      {/* snout */}
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="white" fillOpacity="0.3" />
      <ellipse cx="100" cy="104" rx="18" ry="12" fill="white" fillOpacity="0.4" />
      {/* nose */}
      <ellipse cx="100" cy="98" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="96" cy="96" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* sad mouth */}
      <path d="M87 112 Q100 106 113 112" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* sad eyes */}
      <ellipse cx="78" cy="82" rx="9" ry="9" fill="white" />
      <ellipse cx="78" cy="83" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="75" cy="80" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <ellipse cx="122" cy="82" rx="9" ry="9" fill="white" />
      <ellipse cx="122" cy="83" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="119" cy="80" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      {/* droopy eyebrows */}
      <path d="M70 72 Q78 76 86 72" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M114 72 Q122 76 130 72" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* tears */}
      <ellipse cx="74" cy="92" rx="3" ry="5" fill="#93c5fd" fillOpacity="0.7" />
      <ellipse cx="126" cy="92" rx="3" ry="5" fill="#93c5fd" fillOpacity="0.7" />
    </svg>
  );
}

export function DogMeh({ color = "#f59e0b" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="185" rx="52" ry="9" fill="black" fillOpacity="0.12" />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill={color} />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill="white" fillOpacity="0.12" />
      <ellipse cx="100" cy="155" rx="28" ry="20" fill="white" fillOpacity="0.25" />
      {/* tail neutral */}
      <path d="M148 148 Q172 148 174 134" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="175" cy="130" rx="7" ry="7" fill={color} />
      <rect x="55" y="172" width="18" height="24" rx="9" fill={color} />
      <ellipse cx="64" cy="196" rx="11" ry="6" fill={color} />
      <rect x="125" y="172" width="18" height="24" rx="9" fill={color} />
      <ellipse cx="134" cy="196" rx="11" ry="6" fill={color} />
      <rect x="72" y="164" width="16" height="26" rx="8" fill={color} />
      <ellipse cx="80" cy="190" rx="10" ry="6" fill={color} />
      <rect x="110" y="164" width="16" height="26" rx="8" fill={color} />
      <ellipse cx="118" cy="190" rx="10" ry="6" fill={color} />
      <ellipse cx="100" cy="118" rx="28" ry="20" fill={color} />
      <ellipse cx="100" cy="90" rx="42" ry="38" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="12" fill="white" fillOpacity="0.15" />
      {/* medium floppy ears */}
      <path d="M58 68 Q36 58 40 84 Q48 76 58 80Z" fill={color} />
      <path d="M142 68 Q164 58 160 84 Q152 76 142 80Z" fill={color} />
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="white" fillOpacity="0.3" />
      <ellipse cx="100" cy="104" rx="18" ry="12" fill="white" fillOpacity="0.4" />
      <ellipse cx="100" cy="98" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="96" cy="96" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* flat mouth */}
      <line x1="88" y1="112" x2="112" y2="112" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
      {/* half-lid eyes */}
      <ellipse cx="78" cy="82" rx="9" ry="9" fill="white" />
      <ellipse cx="78" cy="84" rx="6" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="75" cy="81" rx="2" ry="2" fill="white" fillOpacity="0.7" />
      <rect x="68" y="74" width="22" height="9" rx="3" fill={color} />
      <ellipse cx="122" cy="82" rx="9" ry="9" fill="white" />
      <ellipse cx="122" cy="84" rx="6" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="119" cy="81" rx="2" ry="2" fill="white" fillOpacity="0.7" />
      <rect x="110" y="74" width="22" height="9" rx="3" fill={color} />
      {/* flat brows */}
      <path d="M70 73 L86 73" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M114 73 L130 73" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function DogHappy({ color = "#10b981" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="185" rx="52" ry="9" fill="black" fillOpacity="0.12" />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill={color} />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill="white" fillOpacity="0.12" />
      <ellipse cx="100" cy="155" rx="28" ry="20" fill="white" fillOpacity="0.25" />
      {/* tail up */}
      <path d="M148 140 Q172 120 166 100" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="164" cy="96" rx="8" ry="8" fill={color} />
      <rect x="55" y="172" width="18" height="24" rx="9" fill={color} />
      <ellipse cx="64" cy="196" rx="11" ry="6" fill={color} />
      <rect x="125" y="172" width="18" height="24" rx="9" fill={color} />
      <ellipse cx="134" cy="196" rx="11" ry="6" fill={color} />
      <rect x="72" y="164" width="16" height="26" rx="8" fill={color} />
      <ellipse cx="80" cy="190" rx="10" ry="6" fill={color} />
      <rect x="110" y="164" width="16" height="26" rx="8" fill={color} />
      <ellipse cx="118" cy="190" rx="10" ry="6" fill={color} />
      <ellipse cx="100" cy="118" rx="28" ry="20" fill={color} />
      <ellipse cx="100" cy="90" rx="42" ry="38" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="12" fill="white" fillOpacity="0.15" />
      {/* perky ears */}
      <path d="M58 62 Q36 46 40 70 Q48 64 58 70Z" fill={color} />
      <path d="M142 62 Q164 46 160 70 Q152 64 142 70Z" fill={color} />
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="white" fillOpacity="0.3" />
      <ellipse cx="100" cy="104" rx="18" ry="12" fill="white" fillOpacity="0.4" />
      <ellipse cx="100" cy="98" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="96" cy="96" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* big smile */}
      <path d="M84 110 Q100 122 116 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* tongue */}
      <ellipse cx="100" cy="118" rx="10" ry="8" fill="#fca5a5" />
      <path d="M90 118 Q100 126 110 118" fill="#f87171" />
      {/* happy arc eyes */}
      <path d="M68 80 Q78 70 88 80" stroke="#1a0a0a" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M112 80 Q122 70 132 80" stroke="#1a0a0a" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* rosy cheeks */}
      <ellipse cx="68" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.4" />
      <ellipse cx="132" cy="96" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.4" />
      {/* happy brows */}
      <path d="M70 70 Q78 64 86 70" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M114 70 Q122 64 130 70" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function DogLove({ color = "#8b5cf6" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="185" rx="52" ry="9" fill="black" fillOpacity="0.12" />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill={color} />
      <ellipse cx="100" cy="148" rx="52" ry="36" fill="white" fillOpacity="0.12" />
      <ellipse cx="100" cy="155" rx="28" ry="20" fill="white" fillOpacity="0.25" />
      {/* tail curled high */}
      <path d="M148 136 Q180 112 176 86 Q172 66 156 72" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <rect x="55" y="172" width="18" height="24" rx="9" fill={color} transform="rotate(8 55 172)" />
      <ellipse cx="64" cy="196" rx="11" ry="6" fill={color} />
      <rect x="125" y="172" width="18" height="24" rx="9" fill={color} transform="rotate(-8 134 172)" />
      <ellipse cx="134" cy="196" rx="11" ry="6" fill={color} />
      <rect x="72" y="162" width="16" height="26" rx="8" fill={color} transform="rotate(6 72 162)" />
      <ellipse cx="80" cy="188" rx="10" ry="6" fill={color} />
      <rect x="110" y="162" width="16" height="26" rx="8" fill={color} transform="rotate(-6 118 162)" />
      <ellipse cx="118" cy="188" rx="10" ry="6" fill={color} />
      <ellipse cx="100" cy="118" rx="28" ry="20" fill={color} />
      <ellipse cx="100" cy="90" rx="42" ry="38" fill={color} />
      <ellipse cx="88" cy="72" rx="16" ry="12" fill="white" fillOpacity="0.15" />
      {/* very perky ears */}
      <path d="M56 58 Q34 38 40 62 Q48 56 58 62Z" fill={color} />
      <path d="M144 58 Q166 38 160 62 Q152 56 142 62Z" fill={color} />
      <ellipse cx="100" cy="104" rx="22" ry="16" fill="white" fillOpacity="0.3" />
      <ellipse cx="100" cy="104" rx="18" ry="12" fill="white" fillOpacity="0.4" />
      <ellipse cx="100" cy="98" rx="10" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="96" cy="96" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* huge smile */}
      <path d="M80 110 Q100 128 120 110" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* big tongue */}
      <ellipse cx="100" cy="120" rx="14" ry="10" fill="#fca5a5" />
      <ellipse cx="100" cy="125" rx="10" ry="6" fill="#f87171" />
      {/* heart eyes */}
      <path d="M64 72 C64 66 70 64 73 69 C76 64 82 66 82 72 C82 80 73 88 73 88 C73 88 64 80 64 72Z" fill="#ff4d6d" />
      <ellipse cx="68" cy="70" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      <path d="M118 72 C118 66 124 64 127 69 C130 64 136 66 136 72 C136 80 127 88 127 88 C127 88 118 80 118 72Z" fill="#ff4d6d" />
      <ellipse cx="122" cy="70" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      {/* blush */}
      <ellipse cx="64" cy="98" rx="12" ry="8" fill="#fca5a5" fillOpacity="0.5" />
      <ellipse cx="136" cy="98" rx="12" ry="8" fill="#fca5a5" fillOpacity="0.5" />
      {/* sparkles */}
      <path d="M24 40 L26 34 L28 40 L34 42 L28 44 L26 50 L24 44 L18 42Z" fill="#fbbf24" fillOpacity="0.8" />
      <path d="M168 28 L170 24 L172 28 L176 30 L172 32 L170 36 L168 32 L164 30Z" fill="#fbbf24" fillOpacity="0.7" />
    </svg>
  );
}

// ENERGY illustrations
export function DogSleep({ color = "#f43f5e" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="185" rx="60" ry="10" fill="black" fillOpacity="0.1" />
      {/* curled body */}
      <ellipse cx="110" cy="155" rx="58" ry="32" fill={color} />
      <ellipse cx="110" cy="155" rx="58" ry="32" fill="white" fillOpacity="0.1" />
      {/* tail tucked */}
      <path d="M60 155 Q42 172 54 182 Q62 188 68 180" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* paws tucked */}
      <ellipse cx="70" cy="178" rx="18" ry="10" fill={color} />
      <ellipse cx="100" cy="184" rx="16" ry="9" fill={color} />
      <ellipse cx="130" cy="182" rx="14" ry="8" fill={color} />
      {/* head resting */}
      <ellipse cx="52" cy="136" rx="38" ry="32" fill={color} />
      <ellipse cx="40" cy="122" rx="14" ry="10" fill="white" fillOpacity="0.12" />
      {/* floppy resting ear */}
      <path d="M30 126 Q10 118 14 146 Q22 136 34 142Z" fill={color} />
      <path d="M72 122 Q88 112 84 136 Q76 128 72 136Z" fill={color} />
      {/* snout resting on paw */}
      <ellipse cx="50" cy="150" rx="20" ry="13" fill="white" fillOpacity="0.28" />
      <ellipse cx="50" cy="150" rx="16" ry="10" fill="white" fillOpacity="0.35" />
      <ellipse cx="50" cy="145" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="47" cy="143" rx="2.5" ry="1.5" fill="white" fillOpacity="0.5" />
      {/* closed eyes (sleeping arcs) */}
      <path d="M30 132 Q38 126 46 132" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M52 132 Q60 126 68 132" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* mouth relaxed */}
      <path d="M40 152 Q50 156 60 152" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Z Z Z */}
      <text x="96" y="106" fontSize="22" fontWeight="900" fill="white" fillOpacity="0.65" fontFamily="sans-serif">z</text>
      <text x="114" y="85" fontSize="16" fontWeight="900" fill="white" fillOpacity="0.45" fontFamily="sans-serif">z</text>
      <text x="128" y="68" fontSize="11" fontWeight="900" fill="white" fillOpacity="0.3" fontFamily="sans-serif">z</text>
    </svg>
  );
}

export function DogTrot({ color = "#f59e0b" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="187" rx="56" ry="8" fill="black" fillOpacity="0.12" />
      {/* body tilted forward slightly */}
      <ellipse cx="100" cy="138" rx="52" ry="30" fill={color} transform="rotate(-5 100 138)" />
      <ellipse cx="100" cy="138" rx="52" ry="30" fill="white" fillOpacity="0.1" transform="rotate(-5 100 138)" />
      <ellipse cx="100" cy="146" rx="28" ry="16" fill="white" fillOpacity="0.2" />
      {/* tail mid-high */}
      <path d="M144 130 Q168 110 164 90" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="162" cy="86" rx="8" ry="8" fill={color} />
      {/* alternating legs (trot gait) */}
      <rect x="58" y="160" width="16" height="28" rx="8" fill={color} transform="rotate(-12 58 160)" />
      <ellipse cx="54" cy="188" rx="11" ry="6" fill={color} />
      <rect x="76" y="162" width="16" height="22" rx="8" fill={color} transform="rotate(8 76 162)" />
      <ellipse cx="82" cy="184" rx="10" ry="6" fill={color} />
      <rect x="110" y="158" width="16" height="26" rx="8" fill={color} transform="rotate(-8 110 158)" />
      <ellipse cx="106" cy="184" rx="10" ry="6" fill={color} />
      <rect x="128" y="162" width="16" height="22" rx="8" fill={color} transform="rotate(14 128 162)" />
      <ellipse cx="136" cy="184" rx="10" ry="6" fill={color} />
      {/* neck */}
      <ellipse cx="80" cy="110" rx="24" ry="18" fill={color} />
      {/* head looking forward */}
      <ellipse cx="62" cy="84" rx="36" ry="32" fill={color} />
      <ellipse cx="52" cy="70" rx="14" ry="10" fill="white" fillOpacity="0.14" />
      {/* ears forward */}
      <path d="M40 68 Q22 52 28 74 Q34 68 40 72Z" fill={color} />
      <path d="M82 62 Q98 50 92 72 Q86 66 82 72Z" fill={color} />
      {/* snout */}
      <ellipse cx="60" cy="96" rx="20" ry="13" fill="white" fillOpacity="0.3" />
      <ellipse cx="60" cy="96" rx="16" ry="10" fill="white" fillOpacity="0.4" />
      <ellipse cx="60" cy="91" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="57" cy="89" rx="2.5" ry="1.8" fill="white" fillOpacity="0.5" />
      {/* slight smile */}
      <path d="M48 100 Q60 108 72 100" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* eyes alert */}
      <ellipse cx="46" cy="80" rx="8" ry="8" fill="white" />
      <ellipse cx="46" cy="80" rx="5" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="44" cy="78" rx="1.8" ry="2.2" fill="white" fillOpacity="0.7" />
      <ellipse cx="76" cy="78" rx="8" ry="8" fill="white" />
      <ellipse cx="76" cy="78" rx="5" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="74" cy="76" rx="1.8" ry="2.2" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

export function DogRun({ color = "#10b981" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="108" cy="188" rx="52" ry="8" fill="black" fillOpacity="0.12" />
      {/* body stretched horizontal */}
      <ellipse cx="108" cy="132" rx="58" ry="26" fill={color} transform="rotate(-10 108 132)" />
      <ellipse cx="108" cy="132" rx="58" ry="26" fill="white" fillOpacity="0.1" transform="rotate(-10 108 132)" />
      <ellipse cx="104" cy="140" rx="28" ry="14" fill="white" fillOpacity="0.2" />
      {/* tail high and wagging */}
      <path d="M152 122 Q178 94 170 68" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M170 68 Q180 54 168 46" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      <ellipse cx="166" cy="42" rx="7" ry="7" fill={color} />
      {/* sprint legs — wide spread */}
      <rect x="52" y="152" width="15" height="32" rx="7.5" fill={color} transform="rotate(-30 52 152)" />
      <ellipse cx="40" cy="178" rx="11" ry="6" fill={color} />
      <rect x="72" y="158" width="15" height="26" rx="7.5" fill={color} transform="rotate(20 72 158)" />
      <ellipse cx="80" cy="182" rx="10" ry="6" fill={color} />
      <rect x="110" y="150" width="15" height="32" rx="7.5" fill={color} transform="rotate(-22 110 150)" />
      <ellipse cx="100" cy="180" rx="11" ry="6" fill={color} />
      <rect x="132" y="154" width="15" height="28" rx="7.5" fill={color} transform="rotate(28 132 154)" />
      <ellipse cx="144" cy="180" rx="10" ry="6" fill={color} />
      {/* neck */}
      <ellipse cx="72" cy="108" rx="22" ry="16" fill={color} transform="rotate(-8 72 108)" />
      {/* head leaning forward */}
      <ellipse cx="52" cy="78" rx="36" ry="30" fill={color} transform="rotate(-8 52 78)" />
      <ellipse cx="42" cy="66" rx="14" ry="10" fill="white" fillOpacity="0.14" />
      {/* perky forward ears */}
      <path d="M32 62 Q14 44 22 66 Q28 60 34 66Z" fill={color} />
      <path d="M72 58 Q88 44 82 66 Q76 60 72 66Z" fill={color} />
      {/* snout open */}
      <ellipse cx="48" cy="88" rx="20" ry="14" fill="white" fillOpacity="0.3" />
      <ellipse cx="48" cy="88" rx="16" ry="11" fill="white" fillOpacity="0.4" />
      <ellipse cx="48" cy="83" rx="9" ry="6" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="45" cy="81" rx="2.5" ry="1.8" fill="white" fillOpacity="0.5" />
      {/* open panting mouth */}
      <path d="M34 94 Q48 106 62 94" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="48" cy="100" rx="12" ry="9" fill="#fca5a5" />
      <ellipse cx="48" cy="105" rx="9" ry="5.5" fill="#f87171" />
      {/* excited eyes wide */}
      <ellipse cx="34" cy="72" rx="9" ry="10" fill="white" />
      <ellipse cx="35" cy="73" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="32" cy="70" rx="2.2" ry="2.5" fill="white" fillOpacity="0.7" />
      <ellipse cx="64" cy="68" rx="9" ry="10" fill="white" />
      <ellipse cx="65" cy="69" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="62" cy="66" rx="2.2" ry="2.5" fill="white" fillOpacity="0.7" />
      {/* speed lines */}
      <line x1="6" y1="88" x2="20" y2="88" stroke="white" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="100" x2="20" y2="100" stroke="white" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="76" x2="14" y2="76" stroke="white" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// APPETITE illustrations
export function BowlEmpty({ color = "#f43f5e" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* sad dog looking at empty bowl */}
      <ellipse cx="100" cy="192" rx="70" ry="8" fill="black" fillOpacity="0.1" />
      {/* bowl */}
      <ellipse cx="100" cy="170" rx="60" ry="14" fill="#1a1a1a" fillOpacity="0.25" />
      <path d="M40 155 Q100 192 160 155" fill={color} fillOpacity="0.5" />
      <path d="M40 155 Q100 186 160 155" fill={color} fillOpacity="0.4" />
      <rect x="36" y="148" width="128" height="12" rx="6" fill={color} fillOpacity="0.6" />
      {/* empty inside */}
      <ellipse cx="100" cy="154" rx="52" ry="8" fill="black" fillOpacity="0.15" />
      {/* little dog peeking sadly */}
      <ellipse cx="100" cy="100" rx="46" ry="40" fill={color} />
      <ellipse cx="86" cy="80" rx="18" ry="12" fill="white" fillOpacity="0.12" />
      {/* floppy ears */}
      <path d="M56 84 Q34 68 38 96 Q48 86 56 90Z" fill={color} />
      <path d="M144 84 Q166 68 162 96 Q152 86 144 90Z" fill={color} />
      {/* sad snout */}
      <ellipse cx="100" cy="116" rx="24" ry="16" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="116" rx="19" ry="12" fill="white" fillOpacity="0.38" />
      <ellipse cx="100" cy="110" rx="11" ry="7" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="96" cy="108" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      <path d="M86 124 Q100 118 114 124" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* sad eyes */}
      <ellipse cx="82" cy="97" rx="10" ry="10" fill="white" />
      <ellipse cx="82" cy="99" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="79" cy="96" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <ellipse cx="118" cy="97" rx="10" ry="10" fill="white" />
      <ellipse cx="118" cy="99" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="115" cy="96" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      {/* droopy brows */}
      <path d="M73 86 Q82 91 91 86" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M109 86 Q118 91 127 86" stroke="#1a0a0a" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BowlHalf({ color = "#f59e0b" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="192" rx="70" ry="8" fill="black" fillOpacity="0.1" />
      {/* bowl */}
      <path d="M40 155 Q100 192 160 155" fill={color} fillOpacity="0.5" />
      <rect x="36" y="148" width="128" height="12" rx="6" fill={color} fillOpacity="0.6" />
      {/* half-full kibbles */}
      <ellipse cx="76" cy="152" rx="9" ry="7" fill={color} fillOpacity="0.9" />
      <ellipse cx="100" cy="150" rx="9" ry="7" fill={color} fillOpacity="0.9" />
      <ellipse cx="124" cy="152" rx="9" ry="7" fill={color} fillOpacity="0.9" />
      <ellipse cx="88" cy="158" rx="8" ry="6" fill={color} fillOpacity="0.7" />
      <ellipse cx="112" cy="158" rx="8" ry="6" fill={color} fillOpacity="0.7" />
      <ellipse cx="100" cy="192" rx="60" ry="8" fill="black" fillOpacity="0.1" />
      {/* neutral-happy dog */}
      <ellipse cx="100" cy="98" rx="46" ry="40" fill={color} />
      <ellipse cx="86" cy="78" rx="18" ry="12" fill="white" fillOpacity="0.12" />
      <path d="M56 80 Q34 62 40 88 Q48 80 56 86Z" fill={color} />
      <path d="M144 80 Q166 62 160 88 Q152 80 144 86Z" fill={color} />
      <ellipse cx="100" cy="112" rx="24" ry="16" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="112" rx="19" ry="12" fill="white" fillOpacity="0.38" />
      <ellipse cx="100" cy="106" rx="11" ry="7" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="96" cy="104" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      <path d="M86 120 Q100 128 114 120" stroke="#1a0a0a" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="82" cy="94" rx="10" ry="10" fill="white" />
      <ellipse cx="82" cy="95" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="79" cy="92" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <ellipse cx="118" cy="94" rx="10" ry="10" fill="white" />
      <ellipse cx="118" cy="95" rx="6" ry="7" fill="#1a0a0a" fillOpacity="0.85" />
      <ellipse cx="115" cy="92" rx="2" ry="2.5" fill="white" fillOpacity="0.7" />
      <path d="M73 83 Q82 78 91 83" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M109 83 Q118 78 127 83" stroke="#1a0a0a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="108" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
      <ellipse cx="130" cy="108" rx="10" ry="7" fill="#fca5a5" fillOpacity="0.35" />
    </svg>
  );
}

export function BowlFull({ color = "#10b981" }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="192" rx="70" ry="8" fill="black" fillOpacity="0.1" />
      {/* overflowing bowl */}
      <path d="M40 152 Q100 188 160 152" fill={color} fillOpacity="0.5" />
      <rect x="36" y="144" width="128" height="14" rx="7" fill={color} fillOpacity="0.65" />
      {/* overflow kibbles */}
      <ellipse cx="66" cy="144" rx="10" ry="8" fill={color} fillOpacity="0.9" />
      <ellipse cx="82" cy="138" rx="10" ry="8" fill={color} fillOpacity="0.9" />
      <ellipse cx="100" cy="136" rx="10" ry="8" fill={color} fillOpacity="0.9" />
      <ellipse cx="118" cy="138" rx="10" ry="8" fill={color} fillOpacity="0.9" />
      <ellipse cx="134" cy="144" rx="10" ry="8" fill={color} fillOpacity="0.9" />
      <ellipse cx="74" cy="148" rx="9" ry="7" fill={color} fillOpacity="0.75" />
      <ellipse cx="100" cy="146" rx="9" ry="7" fill={color} fillOpacity="0.75" />
      <ellipse cx="126" cy="148" rx="9" ry="7" fill={color} fillOpacity="0.75" />
      {/* very happy dog */}
      <ellipse cx="100" cy="92" rx="46" ry="40" fill={color} />
      <ellipse cx="86" cy="72" rx="18" ry="12" fill="white" fillOpacity="0.12" />
      <path d="M54 72 Q30 52 38 78 Q46 70 54 76Z" fill={color} />
      <path d="M146 72 Q170 52 162 78 Q154 70 146 76Z" fill={color} />
      <ellipse cx="100" cy="108" rx="24" ry="16" fill="white" fillOpacity="0.28" />
      <ellipse cx="100" cy="108" rx="19" ry="12" fill="white" fillOpacity="0.38" />
      <ellipse cx="100" cy="102" rx="11" ry="7" fill="#1a0a0a" fillOpacity="0.8" />
      <ellipse cx="96" cy="100" rx="3" ry="2" fill="white" fillOpacity="0.5" />
      {/* big happy open mouth */}
      <path d="M80 116 Q100 132 120 116" stroke="#1a0a0a" strokeOpacity="0.5" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="124" rx="14" ry="10" fill="#fca5a5" />
      <ellipse cx="100" cy="130" rx="10" ry="6" fill="#f87171" />
      {/* heart eyes */}
      <path d="M66 76 C66 70 72 68 75 73 C78 68 84 70 84 76 C84 84 75 92 75 92 C75 92 66 84 66 76Z" fill="#ff4d6d" />
      <ellipse cx="70" cy="74" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      <path d="M116 76 C116 70 122 68 125 73 C128 68 134 70 134 76 C134 84 125 92 125 92 C125 92 116 84 116 76Z" fill="#ff4d6d" />
      <ellipse cx="120" cy="74" rx="2.5" ry="3" fill="white" fillOpacity="0.5" />
      <ellipse cx="66" cy="106" rx="12" ry="8" fill="#fca5a5" fillOpacity="0.5" />
      <ellipse cx="134" cy="106" rx="12" ry="8" fill="#fca5a5" fillOpacity="0.5" />
      {/* star sparkles */}
      <path d="M22 60 L24 52 L26 60 L34 62 L26 64 L24 72 L22 64 L14 62Z" fill="#fbbf24" fillOpacity="0.85" />
      <path d="M172 44 L174 38 L176 44 L182 46 L176 48 L174 54 L172 48 L166 46Z" fill="#fbbf24" fillOpacity="0.75" />
    </svg>
  );
}