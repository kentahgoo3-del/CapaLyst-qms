export default function Slide09Compliance() {
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
            Regulatory Compliance
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Built to the standard, not retrofitted
        </h2>

        {/* 4-framework grid */}
        <div className="grid grid-cols-4 gap-[2vw] mb-[3.5vh]">
          <div className="flex flex-col items-center justify-center py-[3vh] px-[1.5vw] rounded-[0.8vw] text-center" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
            <span className="font-display font-800 mb-[1.5vh] leading-tight" style={{ fontSize: "1.6vw", color: "#4B9FE1" }}>21 CFR Part 11</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>Electronic records and e-signatures</span>
          </div>
          <div className="flex flex-col items-center justify-center py-[3vh] px-[1.5vw] rounded-[0.8vw] text-center" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <span className="font-display font-800 mb-[1.5vh] leading-tight" style={{ fontSize: "1.6vw", color: "#3DD9AC" }}>EU GMP Annex 11</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>Computerised systems in GMP environments</span>
          </div>
          <div className="flex flex-col items-center justify-center py-[3vh] px-[1.5vw] rounded-[0.8vw] text-center" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
            <span className="font-display font-800 mb-[1.5vh] leading-tight" style={{ fontSize: "1.6vw", color: "#4B9FE1" }}>ICH Q10</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>Pharmaceutical quality systems framework</span>
          </div>
          <div className="flex flex-col items-center justify-center py-[3vh] px-[1.5vw] rounded-[0.8vw] text-center" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <span className="font-display font-800 mb-[1.5vh] leading-tight" style={{ fontSize: "1.6vw", color: "#3DD9AC" }}>ISO 13485</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>Medical device quality management</span>
          </div>
        </div>

        {/* Immutable audit log visual */}
        <div className="flex items-center gap-[3vw] flex-1 rounded-[0.8vw] px-[3vw] py-[2.5vh]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex flex-col gap-[1.2vh] flex-1">
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Immutable Audit Trail</span>
            <div className="flex items-center gap-[1.5vw]">
              <div className="h-[0.12vh] flex-1" style={{ background: "rgba(61, 217, 172, 0.3)" }} />
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "#3DD9AC" }}>Every record is write-once</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="h-[0.12vh] flex-1" style={{ background: "rgba(61, 217, 172, 0.3)" }} />
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "#3DD9AC" }}>User, timestamp, and reason captured</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="h-[0.12vh] flex-1" style={{ background: "rgba(61, 217, 172, 0.3)" }} />
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "#3DD9AC" }}>No edit or delete — ever</span>
            </div>
          </div>
          {/* Log visual mockup */}
          <div className="flex flex-col gap-[1vh]" style={{ minWidth: "35vw" }}>
            <div className="flex items-center gap-[1.5vw] px-[1.5vw] py-[1.2vh] rounded-[0.4vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.2)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "#4B9FE1" }}>2026-01-14 09:42</span>
              <span className="font-body font-400" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.7)" }}>jsmith — Deviation DEV-0042 submitted</span>
            </div>
            <div className="flex items-center gap-[1.5vw] px-[1.5vw] py-[1.2vh] rounded-[0.4vw]" style={{ background: "rgba(61, 217, 172, 0.06)", border: "1px solid rgba(61, 217, 172, 0.2)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "#3DD9AC" }}>2026-01-14 10:15</span>
              <span className="font-body font-400" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.7)" }}>mlee — QA Acceptance signed [e-sig]</span>
            </div>
            <div className="flex items-center gap-[1.5vw] px-[1.5vw] py-[1.2vh] rounded-[0.4vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.2)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "#4B9FE1" }}>2026-01-15 14:30</span>
              <span className="font-body font-400" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.7)" }}>rchen — CAPA-0019 linked and approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>09</span>
      </div>
    </div>
  );
}
