export default function Slide14CustomerFit() {
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
            Who We Serve
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[5vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Built for the people running quality
        </h2>

        {/* 3 persona cards */}
        <div className="grid grid-cols-3 gap-[3vw] flex-1">
          {/* Persona 1 — QA Manager */}
          <div className="flex flex-col p-[3vw] rounded-[1vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <div className="w-[6vw] h-[6vw] rounded-full flex items-center justify-center mb-[2.5vh] font-display font-800" style={{ background: "rgba(75, 159, 225, 0.2)", border: "2px solid #4B9FE1", fontSize: "1.8vw", color: "#4B9FE1" }}>QA</div>
            <span className="font-display font-800 mb-[1.5vh]" style={{ fontSize: "2.5vw", color: "#4B9FE1" }}>QA Manager</span>
            <div className="h-[0.12vh] w-[4vw] mb-[2.5vh]" style={{ background: "#4B9FE1" }} />
            <p className="font-body font-400 mb-[2vh]" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
              Owns all deviation, CAPA, and change control sign-offs across the site
            </p>
            <div className="mt-auto">
              <p className="font-body font-600 mb-[0.8vh]" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cares about</p>
              <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "#ffffff", lineHeight: 1.35 }}>Audit readiness, overdue items, and closure rates — every morning</p>
            </div>
          </div>

          {/* Persona 2 — Compliance Officer */}
          <div className="flex flex-col p-[3vw] rounded-[1vw]" style={{ background: "rgba(61, 217, 172, 0.07)", border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <div className="w-[6vw] h-[6vw] rounded-full flex items-center justify-center mb-[2.5vh] font-display font-800" style={{ background: "rgba(61, 217, 172, 0.2)", border: "2px solid #3DD9AC", fontSize: "1.8vw", color: "#3DD9AC" }}>CO</div>
            <span className="font-display font-800 mb-[1.5vh]" style={{ fontSize: "2.5vw", color: "#3DD9AC" }}>Compliance Officer</span>
            <div className="h-[0.12vh] w-[4vw] mb-[2.5vh]" style={{ background: "#3DD9AC" }} />
            <p className="font-body font-400 mb-[2vh]" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
              Responsible for regulatory submissions and inspection readiness across all sites
            </p>
            <div className="mt-auto">
              <p className="font-body font-600 mb-[0.8vh]" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cares about</p>
              <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "#ffffff", lineHeight: 1.35 }}>21 CFR Part 11 compliance, audit trail integrity, and regulatory trends</p>
            </div>
          </div>

          {/* Persona 3 — Site Director */}
          <div className="flex flex-col p-[3vw] rounded-[1vw]" style={{ background: "rgba(75, 159, 225, 0.08)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <div className="w-[6vw] h-[6vw] rounded-full flex items-center justify-center mb-[2.5vh] font-display font-800" style={{ background: "rgba(75, 159, 225, 0.2)", border: "2px solid #4B9FE1", fontSize: "1.8vw", color: "#4B9FE1" }}>SD</div>
            <span className="font-display font-800 mb-[1.5vh]" style={{ fontSize: "2.5vw", color: "#4B9FE1" }}>Site Director</span>
            <div className="h-[0.12vh] w-[4vw] mb-[2.5vh]" style={{ background: "#4B9FE1" }} />
            <p className="font-body font-400 mb-[2vh]" style={{ fontSize: "1.8vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
              Accountable for site-wide quality performance, risk exposure, and capacity
            </p>
            <div className="mt-auto">
              <p className="font-body font-600 mb-[0.8vh]" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cares about</p>
              <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "#ffffff", lineHeight: 1.35 }}>Executive dashboard, recall risk, and quality KPIs at a glance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>14</span>
      </div>
    </div>
  );
}
