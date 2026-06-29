export default function Slide07CapaFlow() {
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
            CAPA
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[1vh]" style={{ fontSize: "3.2vw", color: "#ffffff" }}>
          Corrective action to efficacy review
        </h2>
        <p className="font-body font-400 mb-[6vh]" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.6)" }}>
          The efficacy round confirms the fix held — no closure without proof
        </p>

        {/* Linear 5-step flowchart */}
        <div className="flex items-stretch gap-0 flex-1">
          {/* Step 1 */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[3vh] rounded-[0.8vw] text-center flex-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <div className="w-[4vw] h-[4vw] rounded-full flex items-center justify-center mb-[2vh] font-display font-800" style={{ background: "rgba(75, 159, 225, 0.15)", border: "2px solid #4B9FE1", fontSize: "1.6vw", color: "#4B9FE1" }}>1</div>
            <span className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Draft</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Owner creates CAPA linked to deviation</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center px-[1.5vw]">
            <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[3vh] rounded-[0.8vw] text-center flex-1" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <div className="w-[4vw] h-[4vw] rounded-full flex items-center justify-center mb-[2vh] font-display font-800" style={{ background: "rgba(75, 159, 225, 0.15)", border: "2px solid #4B9FE1", fontSize: "1.6vw", color: "#4B9FE1" }}>2</div>
            <span className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>QA Review</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>QA approves the proposed action plan</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center px-[1.5vw]">
            <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[3vh] rounded-[0.8vw] text-center flex-1" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <div className="w-[4vw] h-[4vw] rounded-full flex items-center justify-center mb-[2vh] font-display font-800" style={{ background: "rgba(75, 159, 225, 0.15)", border: "2px solid #4B9FE1", fontSize: "1.6vw", color: "#4B9FE1" }}>3</div>
            <span className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>Implementation</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Corrective actions executed and documented</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center px-[1.5vw]">
            <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>

          {/* Step 4 — Efficacy loop */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[3vh] rounded-[0.8vw] text-center flex-1 relative" style={{ background: "rgba(61, 217, 172, 0.1)", border: "2px solid rgba(61, 217, 172, 0.4)" }}>
            <div className="absolute -top-[1.8vh] left-[50%]" style={{ transform: "translateX(-50%)" }}>
              <span className="px-[0.8vw] py-[0.3vh] rounded-[0.3vw] font-body font-600" style={{ fontSize: "1.3vw", background: "#3DD9AC", color: "#050B14" }}>LOOP</span>
            </div>
            <div className="w-[4vw] h-[4vw] rounded-full flex items-center justify-center mb-[2vh] font-display font-800 mt-[0.5vh]" style={{ background: "rgba(61, 217, 172, 0.2)", border: "2px solid #3DD9AC", fontSize: "1.6vw", color: "#3DD9AC" }}>4</div>
            <span className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#3DD9AC" }}>Efficacy Review</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>QA confirms the fix held — repeats if not</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center px-[1.5vw]">
            <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>

          {/* Step 5 */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[3vh] rounded-[0.8vw] text-center flex-1" style={{ background: "rgba(61, 217, 172, 0.12)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <div className="w-[4vw] h-[4vw] rounded-full flex items-center justify-center mb-[2vh] font-display font-800" style={{ background: "rgba(61, 217, 172, 0.2)", border: "2px solid #3DD9AC", fontSize: "1.6vw", color: "#3DD9AC" }}>5</div>
            <span className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#3DD9AC" }}>Closed</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Verified effective, audit record sealed</span>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>07</span>
      </div>
    </div>
  );
}
