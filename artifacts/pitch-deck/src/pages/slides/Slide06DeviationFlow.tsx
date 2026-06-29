export default function Slide06DeviationFlow() {
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
            Deviation Management
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[1vh]" style={{ fontSize: "3.2vw", color: "#ffffff" }}>
          From event to closure
        </h2>
        <p className="font-body font-400 mb-[3.5vh]" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.6)" }}>
          E-signature gates enforce role accountability at every transition
        </p>

        {/* Row 1 of flowchart — steps 1–4 */}
        <div className="flex items-center mb-[2vh]">
          {/* Step 1 */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center" style={{ minWidth: "14vw", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Draft</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Initiation</span>
          </div>
          {/* Arrow */}
          <div className="flex items-center mx-[1vw]">
            <div className="h-[0.15vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center" style={{ minWidth: "14vw", background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>Submitted</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>QA notified</span>
          </div>
          {/* Arrow */}
          <div className="flex items-center mx-[1vw]">
            <div className="h-[0.15vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center" style={{ minWidth: "14vw", background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>Area Review</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Lead sign-off</span>
          </div>
          {/* Arrow */}
          <div className="flex items-center mx-[1vw]">
            <div className="h-[0.15vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>
          {/* Step 4 — e-sig gate */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center relative" style={{ minWidth: "14vw", background: "rgba(61, 217, 172, 0.12)", border: "2px solid rgba(61, 217, 172, 0.5)" }}>
            <div className="absolute -top-[1.8vh] left-[50%]" style={{ transform: "translateX(-50%)" }}>
              <span className="px-[0.8vw] py-[0.3vh] rounded-[0.3vw] font-body font-600" style={{ fontSize: "1.3vw", background: "#3DD9AC", color: "#050B14" }}>E-SIG</span>
            </div>
            <span className="font-display font-800 mb-[0.5vh] mt-[0.5vh]" style={{ fontSize: "1.3vw", color: "#3DD9AC" }}>QA Accept.</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>QA Manager</span>
          </div>
        </div>

        {/* Down arrow connector */}
        <div className="flex justify-start pl-[11vw] mb-[2vh]">
          <div className="flex flex-col items-center">
            <div className="w-[0.15vw] h-[3vh]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderTop: "1vw solid #3DD9AC", borderLeft: "0.6vw solid transparent", borderRight: "0.6vw solid transparent" }} />
          </div>
        </div>

        {/* Row 2 of flowchart — steps 5–8 (reversed direction) */}
        <div className="flex items-center flex-row-reverse">
          {/* Step 8 — e-sig gate */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center relative" style={{ minWidth: "14vw", background: "rgba(61, 217, 172, 0.12)", border: "2px solid rgba(61, 217, 172, 0.5)" }}>
            <div className="absolute -top-[1.8vh] left-[50%]" style={{ transform: "translateX(-50%)" }}>
              <span className="px-[0.8vw] py-[0.3vh] rounded-[0.3vw] font-body font-600" style={{ fontSize: "1.3vw", background: "#3DD9AC", color: "#050B14" }}>E-SIG</span>
            </div>
            <span className="font-display font-800 mb-[0.5vh] mt-[0.5vh]" style={{ fontSize: "1.3vw", color: "#3DD9AC" }}>Completed</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>QA closure</span>
          </div>
          {/* Arrow left */}
          <div className="flex items-center mx-[1vw]">
            <div className="w-0 h-0" style={{ borderRight: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
            <div className="h-[0.15vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
          </div>
          {/* Step 7 */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center" style={{ minWidth: "14vw", background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>CAPA / ER</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Linked action</span>
          </div>
          {/* Arrow left */}
          <div className="flex items-center mx-[1vw]">
            <div className="w-0 h-0" style={{ borderRight: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
            <div className="h-[0.15vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
          </div>
          {/* Step 6 */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center" style={{ minWidth: "14vw", background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>Root Cause</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Analysis</span>
          </div>
          {/* Arrow left */}
          <div className="flex items-center mx-[1vw]">
            <div className="w-0 h-0" style={{ borderRight: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
            <div className="h-[0.15vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
          </div>
          {/* Step 5 */}
          <div className="flex flex-col items-center justify-center px-[1.5vw] py-[2vh] rounded-[0.6vw] text-center" style={{ minWidth: "14vw", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <span className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Investigation</span>
            <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Findings</span>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>06</span>
      </div>
    </div>
  );
}
