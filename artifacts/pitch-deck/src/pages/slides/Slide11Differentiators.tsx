export default function Slide11Differentiators() {
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
            Competitive Position
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[3.5vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Why Capalyst over the alternatives
        </h2>

        {/* Comparison table */}
        <div className="flex-1 flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-[1.5vw] mb-[1.5vh]">
            <div />
            <div className="text-center py-[1.5vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.55)" }}>Paper / Spreadsheets</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.55)" }}>Generic Tools</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.5vw]" style={{ background: "rgba(61, 217, 172, 0.12)", border: "2px solid rgba(61, 217, 172, 0.4)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Capalyst</span>
            </div>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-[1.5vw] mb-[1.2vh]">
            <div className="flex items-center">
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.75)" }}>21 CFR Part 11</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>None</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Partial / add-on</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(61, 217, 172, 0.06)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Native</span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-[1.5vw] mb-[1.2vh]">
            <div className="flex items-center">
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.75)" }}>E-signature workflow</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Manual wet sig</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Bolted on</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(61, 217, 172, 0.06)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Every gate</span>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-4 gap-[1.5vw] mb-[1.2vh]">
            <div className="flex items-center">
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.75)" }}>Deviation-CAPA link</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Manual reference</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Custom config</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(61, 217, 172, 0.06)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Structured, built-in</span>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-4 gap-[1.5vw] mb-[1.2vh]">
            <div className="flex items-center">
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.75)" }}>Audit readiness</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Weeks of prep</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Moderate</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(61, 217, 172, 0.06)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Always ready</span>
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-4 gap-[1.5vw]">
            <div className="flex items-center">
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.75)" }}>Real-time dashboard</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>None</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="font-body font-400" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.35)" }}>Generic reports</span>
            </div>
            <div className="text-center py-[1.5vh] rounded-[0.4vw]" style={{ background: "rgba(61, 217, 172, 0.06)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>QMS-specific KPIs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>11</span>
      </div>
    </div>
  );
}
