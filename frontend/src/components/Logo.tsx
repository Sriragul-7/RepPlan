export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dumbbell in right hand — extended forward */}
      <g>
        {/* Handle */}
        <line x1="28" y1="14" x2="36" y2="10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left plate */}
        <rect x="35" y="8" width="2.5" height="4" rx="0.8" fill="#ffffff" transform="rotate(-26 36 10)" />
        {/* Right plate */}
        <rect x="26" y="12.5" width="2.5" height="4" rx="0.8" fill="#ffffff" transform="rotate(-26 27 14.5)" />
      </g>

      {/* Kicking leg — extended high right */}
      <path
        d="M22 25 L30 18 L36 16"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Foot */}
      <path
        d="M36 16 L38 15"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Body / torso — leaning back for the kick */}
      <path
        d="M16 18 L22 25"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Head */}
      <circle cx="15" cy="14" r="3.5" fill="#ffffff" />

      {/* Left arm — back for balance */}
      <path
        d="M16 18 L10 14 L6 16"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Fist on left hand */}
      <circle cx="6" cy="16" r="1.2" fill="#ffffff" />

      {/* Supporting leg — planted */}
      <path
        d="M22 25 L18 32 L16 38"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Foot on ground */}
      <path
        d="M16 38 L14 38.5"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Ground shadow */}
      <ellipse
        cx="16"
        cy="39"
        rx="5"
        ry="1"
        fill="#ffffff"
        opacity="0.2"
      />
    </svg>
  );
}
