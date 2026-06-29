export default function Slide10ESignatures() {
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
            Access &amp; Accountability
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Role-based access with e-signature controls
        </h2>

        {/* Two-column split */}
        <div className="flex gap-[5vw] flex-1">
          {/* Left — Roles */}
          <div className="flex flex-col gap-[2.5vh] flex-1">
            <h3 className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Roles</h3>

            <div className="flex items-center gap-[2vw] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-display font-800" style={{ background: "#4B9FE1", fontSize: "1.8vw", color: "#050B14" }}>QA</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>QA Manager</span>
            </div>

            <div className="flex items-center gap-[2vw] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-display font-800" style={{ background: "rgba(255,255,255,0.15)", fontSize: "1.8vw", color: "#ffffff" }}>IN</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Investigator</span>
            </div>

            <div className="flex items-center gap-[2vw] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-display font-800" style={{ background: "rgba(255,255,255,0.15)", fontSize: "1.8vw", color: "#ffffff" }}>AL</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Area Lead</span>
            </div>

            <div className="flex items-center gap-[2vw] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.25)" }}>
              <div className="w-[3vw] h-[3vw] rounded-full flex items-center justify-center font-display font-800" style={{ background: "#3DD9AC", fontSize: "1.8vw", color: "#050B14" }}>SD</div>
              <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#ffffff" }}>Site Director</span>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="w-[0.12vw] my-[1vh]" style={{ background: "rgba(61, 217, 172, 0.25)" }} />

          {/* Right — Capabilities */}
          <div className="flex flex-col gap-[2.5vh] flex-1">
            <h3 className="font-display font-800 mb-[0.5vh]" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>What they can do</h3>

            <div className="flex flex-col gap-[0.8vh] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.2)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#4B9FE1" }}>QA Accept, approve, close — all workflows</span>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)" }}>E-sign at every gate. Full read/write access.</span>
            </div>

            <div className="flex flex-col gap-[0.8vh] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Create, edit, investigate deviations and CAPAs</span>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)" }}>Cannot approve or close records.</span>
            </div>

            <div className="flex flex-col gap-[0.8vh] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#ffffff" }}>Review and sign-off for own area</span>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)" }}>E-sign on area review stage only.</span>
            </div>

            <div className="flex flex-col gap-[0.8vh] px-[2vw] py-[2vh] rounded-[0.6vw]" style={{ background: "rgba(61, 217, 172, 0.06)", border: "1px solid rgba(61, 217, 172, 0.2)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.7vw", color: "#3DD9AC" }}>Dashboard, reports, and all audit records</span>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.55)" }}>Read-only across all modules and sites.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>10</span>
      </div>
    </div>
  );
}
