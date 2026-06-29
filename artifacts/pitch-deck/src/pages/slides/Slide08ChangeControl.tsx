export default function Slide08ChangeControl() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #050B14 0%, #0A1628 100%)" }}>
      {/* Background grid dots */}
      <div className="absolute inset-0 opacity-8" style={{ backgroundImage: "radial-gradient(circle, #4B9FE1 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.4vw]" style={{ background: "linear-gradient(to bottom, #3DD9AC, #4B9FE1)" }} />

      <div className="absolute inset-0 flex flex-col pl-[9vw] pr-[8vw] pt-[6vh] pb-[5vh]">
        {/* Section label */}
        <div className="flex items-center gap-[1.2vw] mb-[1.5vh]">
          <div className="h-[0.25vh] w-[3vw] bg-accent" />
          <span className="font-display font-600 tracking-[0.2em] uppercase" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>
            Change Control
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[1vh]" style={{ fontSize: "3.2vw", color: "#ffffff" }}>
          Parallel review to approval
        </h2>
        <p className="font-body font-400 mb-[3vh]" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.6)" }}>
          Three independent reviewers working simultaneously — no sequential bottleneck
        </p>

        {/* Pipeline diagram */}
        <div className="flex items-center justify-center gap-[1.5vw] flex-1">

          {/* Stage 1 — Submit */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[2.5vh] rounded-[0.8vw] text-center" style={{ minWidth: "13vw", minHeight: "20vh", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <span className="font-display font-800 mb-[0.8vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Submitted</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Change request<br />raised</span>
          </div>

          {/* Fan-out arrows */}
          <div className="flex flex-col items-center justify-center gap-[1.5vh]" style={{ minWidth: "5vw" }}>
            <div className="flex items-center">
              <div className="h-[0.15vh] w-[2vw]" style={{ background: "#4B9FE1" }} />
              <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #4B9FE1", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
            </div>
            <div className="flex items-center">
              <div className="h-[0.15vh] w-[2vw]" style={{ background: "#4B9FE1" }} />
              <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #4B9FE1", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
            </div>
            <div className="flex items-center">
              <div className="h-[0.15vh] w-[2vw]" style={{ background: "#4B9FE1" }} />
              <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #4B9FE1", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
            </div>
          </div>

          {/* Parallel review lanes */}
          <div className="flex flex-col gap-[1.5vh]" style={{ minWidth: "16vw" }}>
            <div className="flex items-center justify-center px-[1.5vw] py-[1.8vh] rounded-[0.6vw] text-center" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#4B9FE1" }}>HR Review</span>
            </div>
            <div className="flex items-center justify-center px-[1.5vw] py-[1.8vh] rounded-[0.6vw] text-center" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#4B9FE1" }}>SC Review</span>
            </div>
            <div className="flex items-center justify-center px-[1.5vw] py-[1.8vh] rounded-[0.6vw] text-center" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#4B9FE1" }}>Expert Review</span>
            </div>
          </div>

          {/* Converge arrows */}
          <div className="flex flex-col items-center justify-center gap-[1.5vh]" style={{ minWidth: "5vw" }}>
            <div className="flex items-center">
              <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
              <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #3DD9AC", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
            </div>
            <div className="flex items-center">
              <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
              <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #3DD9AC", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
            </div>
            <div className="flex items-center">
              <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
              <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #3DD9AC", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
            </div>
          </div>

          {/* Stage 3 — Works Plan */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[2.5vh] rounded-[0.8vw] text-center" style={{ minWidth: "13vw", minHeight: "20vh", background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <span className="font-display font-800 mb-[0.8vh]" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Works Plan</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>All reviewers<br />approved</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #3DD9AC", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
          </div>

          {/* Stage 4 — PIR */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[2.5vh] rounded-[0.8vw] text-center" style={{ minWidth: "13vw", minHeight: "20vh", background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <span className="font-display font-800 mb-[0.8vh]" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>PIR</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Post-implementation<br />review</span>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="h-[0.15vh] w-[2vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "0.8vw solid #3DD9AC", borderTop: "0.5vw solid transparent", borderBottom: "0.5vw solid transparent" }} />
          </div>

          {/* Stage 5 — Close */}
          <div className="flex flex-col items-center justify-center px-[2vw] py-[2.5vh] rounded-[0.8vw] text-center" style={{ minWidth: "13vw", minHeight: "20vh", background: "rgba(61, 217, 172, 0.15)", border: "2px solid rgba(61, 217, 172, 0.5)" }}>
            <span className="font-display font-800 mb-[0.8vh]" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>Closed</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Record sealed,<br />logged</span>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>08</span>
      </div>
    </div>
  );
}
