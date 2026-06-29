import React from "react";

const SCRIPT: React.CSSProperties = {
  fontFamily: "'Dancing Script', cursive",
  fontWeight: 700,
};

const SANS: React.CSSProperties = {
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontWeight: 600,
};

export function CapalystLogoFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 410"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      aria-label="Capalyst"
    >
      {/* ── Feather (scaled to 55% so text dominates) ── */}
      <g transform="translate(92, 180) rotate(32) scale(0.55)" opacity="0.5">
        {/* Body */}
        <path
          d="M 0,-238
             C 14,-208 50,-158 72,-100
             C 94,-42 98,28 88,108
             C 74,182 46,232 0,270
             C -38,232 -64,180 -70,108
             C -80,28 -70,-42 -48,-100
             C -24,-158 -14,-208 0,-238 Z"
          fill="white"
        />
        {/* Shaft */}
        <path d="M 0,-238 Q 3,18 0,270" stroke="rgba(255,255,255,0.45)" strokeWidth="3" fill="none" />
        {/* Right barbs */}
        {([
          [-198,  26, -158],
          [-148,  56, -108],
          [-98,   76,  -56],
          [-48,   90,   -4],
          [  2,   94,   50],
          [ 52,   86,   98],
          [102,   70,  146],
          [148,   50,  192],
          [198,   26,  238],
        ] as [number, number, number][]).map(([y1, x2, y2], i) => (
          <line key={`r${i}`} x1={0} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        ))}
        {/* Left barbs */}
        {([
          [-198, -18, -158],
          [-148, -38, -108],
          [-98,  -54,  -56],
          [-48,  -62,   -4],
          [  2,  -65,   50],
          [ 52,  -58,   98],
          [102,  -48,  146],
          [148,  -32,  192],
          [198,  -16,  238],
        ] as [number, number, number][]).map(([y1, x2, y2], i) => (
          <line key={`l${i}`} x1={0} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        ))}
      </g>

      {/* ── Ink flourish from quill ── */}
      <circle cx="14" cy="313" r="4" fill="rgba(255,255,255,0.4)" />
      <path
        d="M 14,313 C 55,304 130,295 225,292 C 320,289 440,291 530,295 C 600,298 648,293 668,285"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Brand name — large & white ── */}
      <text
        x="122"
        y="357"
        style={{ ...SCRIPT, fontSize: "118px", fill: "white", letterSpacing: "-1px" }}
      >
        Capalyst
      </text>

      {/* ── Tagline — bright and spaced ── */}
      <text
        x="137"
        y="398"
        style={{ ...SANS, fontSize: "17px", letterSpacing: "3.5px", fill: "rgba(255,255,255,0.82)" }}
      >
        WHERE QUALITY MEETS COMPLIANCE.
      </text>
    </svg>
  );
}

export function CapalystLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 52"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      aria-label="Capalyst"
    >
      {/* Mini feather */}
      <g transform="translate(18, 25) rotate(32) scale(0.38)" opacity="0.55">
        <path
          d="M 0,-238
             C 14,-208 50,-158 72,-100
             C 94,-42 98,28 88,108
             C 74,182 46,232 0,270
             C -38,232 -64,180 -70,108
             C -80,28 -70,-42 -48,-100
             C -24,-158 -14,-208 0,-238 Z"
          fill="white"
        />
        <path d="M 0,-238 Q 3,18 0,270" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" />
      </g>
      {/* Brand name */}
      <text
        x="36"
        y="41"
        style={{ ...SCRIPT, fontSize: "42px", fill: "white" }}
      >
        Capalyst
      </text>
    </svg>
  );
}
