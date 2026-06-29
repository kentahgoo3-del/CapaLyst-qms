export default function Slide04Architecture() {
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
            Architecture
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[5vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          How Capalyst works
        </h2>

        {/* 3-column architecture diagram */}
        <div className="flex items-stretch gap-0 flex-1">

          {/* Column 1 — Users */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full text-center py-[1.5vh] mb-[3vh] rounded-[0.6vw]" style={{ background: "rgba(75, 159, 225, 0.15)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#4B9FE1" }}>Users &amp; Roles</span>
            </div>
            <div className="flex flex-col gap-[2vh] w-full">
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>QA Manager</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Investigator</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Area Lead</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Site Director</span>
              </div>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="flex items-center justify-center px-[2vw]">
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="h-[0.15vh] w-[4vw]" style={{ background: "#3DD9AC" }} />
              <div className="w-0 h-0" style={{ borderLeft: "1.2vw solid #3DD9AC", borderTop: "0.8vw solid transparent", borderBottom: "0.8vw solid transparent" }} />
            </div>
          </div>

          {/* Column 2 — Modules */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full text-center py-[1.5vh] mb-[3vh] rounded-[0.6vw]" style={{ background: "rgba(61, 217, 172, 0.12)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>QMS Modules</span>
            </div>
            <div className="flex flex-col gap-[2vh] w-full">
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.2)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Deviations</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.2)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>CAPA</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.2)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Change Control</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.2)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Dashboard</span>
              </div>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="flex items-center justify-center px-[2vw]">
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="h-[0.15vh] w-[4vw]" style={{ background: "#4B9FE1" }} />
              <div className="w-0 h-0" style={{ borderLeft: "1.2vw solid #4B9FE1", borderTop: "0.8vw solid transparent", borderBottom: "0.8vw solid transparent" }} />
            </div>
          </div>

          {/* Column 3 — Audit Trail */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full text-center py-[1.5vh] mb-[3vh] rounded-[0.6vw]" style={{ background: "rgba(75, 159, 225, 0.15)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
              <span className="font-display font-800" style={{ fontSize: "1.8vw", color: "#4B9FE1" }}>Audit Trail</span>
            </div>
            <div className="flex flex-col gap-[2vh] w-full">
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Every action logged</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Timestamped</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>E-signed</span>
              </div>
              <div className="text-center py-[1.8vh] rounded-[0.5vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Immutable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>04</span>
      </div>
    </div>
  );
}
