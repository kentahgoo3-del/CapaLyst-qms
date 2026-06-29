export default function Slide03Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #050B14 0%, #0A1628 100%)" }}>
      {/* Background grid dots */}
      <div className="absolute inset-0 opacity-8" style={{ backgroundImage: "radial-gradient(circle, #4B9FE1 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.4vw]" style={{ background: "linear-gradient(to bottom, #3DD9AC, #4B9FE1)" }} />

      <div className="absolute inset-0 flex flex-col pl-[9vw] pr-[8vw] pt-[7vh] pb-[6vh]">
        {/* Section label */}
        <div className="flex items-center gap-[1.2vw] mb-[2vh]">
          <div className="h-[0.25vh] w-[3vw] bg-accent" />
          <span className="font-display font-600 tracking-[0.2em] uppercase" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>
            The Platform
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[1.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>
          One platform, four critical modules
        </h2>
        <p className="font-body font-400 mb-[4vh]" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
          End-to-end quality management designed for GxP environments
        </p>

        {/* 2x2 card grid */}
        <div className="grid grid-cols-2 gap-[2.5vw] flex-1">
          {/* Card 1 — Deviations */}
          <div className="flex flex-col justify-center p-[3vw] rounded-[1vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.25)" }}>
            <div className="flex items-center gap-[1.2vw] mb-[1.5vh]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-[0.6vw] flex items-center justify-center font-display font-800" style={{ background: "rgba(75, 159, 225, 0.15)", fontSize: "1.3vw", color: "#4B9FE1" }}>D</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Deviations</span>
            </div>
            <p className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.35 }}>
              Capture, investigate, and close non-conformances with full e-signature workflow
            </p>
          </div>

          {/* Card 2 — CAPA */}
          <div className="flex flex-col justify-center p-[3vw] rounded-[1vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.25)" }}>
            <div className="flex items-center gap-[1.2vw] mb-[1.5vh]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-[0.6vw] flex items-center justify-center font-display font-800" style={{ background: "rgba(61, 217, 172, 0.15)", fontSize: "1.3vw", color: "#3DD9AC" }}>C</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>CAPA</span>
            </div>
            <p className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.35 }}>
              Root cause to corrective action — with efficacy review to confirm the fix held
            </p>
          </div>

          {/* Card 3 — Change Control */}
          <div className="flex flex-col justify-center p-[3vw] rounded-[1vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.25)" }}>
            <div className="flex items-center gap-[1.2vw] mb-[1.5vh]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-[0.6vw] flex items-center justify-center font-display font-800" style={{ background: "rgba(75, 159, 225, 0.15)", fontSize: "1.3vw", color: "#4B9FE1" }}>CC</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Change Control</span>
            </div>
            <p className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.35 }}>
              Structured multi-role approval pipeline for all process and document changes
            </p>
          </div>

          {/* Card 4 — Audit Trail */}
          <div className="flex flex-col justify-center p-[3vw] rounded-[1vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.25)" }}>
            <div className="flex items-center gap-[1.2vw] mb-[1.5vh]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-[0.6vw] flex items-center justify-center font-display font-800" style={{ background: "rgba(61, 217, 172, 0.15)", fontSize: "1.3vw", color: "#3DD9AC" }}>AT</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Audit Trail</span>
            </div>
            <p className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.35 }}>
              Immutable, timestamped log of every action — 21 CFR Part 11 compliant by design
            </p>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>03</span>
      </div>
    </div>
  );
}
