export default function Slide13Onboarding() {
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
            Implementation
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[2vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Up and running in five weeks
        </h2>
        <p className="font-body font-400 mb-[6vh]" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.6)" }}>
          A structured onboarding keeps your team focused — without disrupting day-to-day quality operations
        </p>

        {/* Timeline — 3 phases */}
        <div className="flex items-stretch gap-0 flex-1">
          {/* Phase 1 — Setup */}
          <div className="flex flex-col flex-1 rounded-l-[1vw] overflow-hidden" style={{ border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <div className="px-[2.5vw] py-[2vh]" style={{ background: "rgba(75, 159, 225, 0.15)", borderBottom: "1px solid rgba(75, 159, 225, 0.3)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "#4B9FE1", textTransform: "uppercase", letterSpacing: "0.15em" }}>Phase 1</span>
              <div className="mt-[0.5vh]">
                <span className="font-display font-800" style={{ fontSize: "2.5vw", color: "#ffffff" }}>Setup</span>
              </div>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Weeks 1 – 2</span>
            </div>
            <div className="flex flex-col gap-[2vh] px-[2.5vw] py-[3vh] flex-1" style={{ background: "rgba(75, 159, 225, 0.05)" }}>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Environment provisioning</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Configure your site, areas, and user roles</p>
              </div>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Data migration</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Import open records from existing systems</p>
              </div>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Validation support</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>IQ/OQ documentation package provided</p>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex items-center px-[1.5vw]">
            <div className="h-[0.15vh] w-[2.5vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>

          {/* Phase 2 — Training */}
          <div className="flex flex-col flex-1 overflow-hidden" style={{ border: "1px solid rgba(61, 217, 172, 0.3)" }}>
            <div className="px-[2.5vw] py-[2vh]" style={{ background: "rgba(61, 217, 172, 0.12)", borderBottom: "1px solid rgba(61, 217, 172, 0.3)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "#3DD9AC", textTransform: "uppercase", letterSpacing: "0.15em" }}>Phase 2</span>
              <div className="mt-[0.5vh]">
                <span className="font-display font-800" style={{ fontSize: "2.5vw", color: "#ffffff" }}>Training</span>
              </div>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Weeks 3 – 4</span>
            </div>
            <div className="flex flex-col gap-[2vh] px-[2.5vw] py-[3vh] flex-1" style={{ background: "rgba(61, 217, 172, 0.04)" }}>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Role-based walkthroughs</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Separate sessions for QA, investigators, and leads</p>
              </div>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Workflow rehearsals</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Run real scenarios in a sandboxed environment</p>
              </div>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Admin certification</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Your QA admin trained to manage users and reports</p>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex items-center px-[1.5vw]">
            <div className="h-[0.15vh] w-[2.5vw]" style={{ background: "#3DD9AC" }} />
            <div className="w-0 h-0" style={{ borderLeft: "1vw solid #3DD9AC", borderTop: "0.6vw solid transparent", borderBottom: "0.6vw solid transparent" }} />
          </div>

          {/* Phase 3 — Go-Live */}
          <div className="flex flex-col flex-1 rounded-r-[1vw] overflow-hidden" style={{ border: "2px solid rgba(61, 217, 172, 0.5)" }}>
            <div className="px-[2.5vw] py-[2vh]" style={{ background: "rgba(61, 217, 172, 0.15)", borderBottom: "1px solid rgba(61, 217, 172, 0.4)" }}>
              <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "#3DD9AC", textTransform: "uppercase", letterSpacing: "0.15em" }}>Phase 3</span>
              <div className="mt-[0.5vh]">
                <span className="font-display font-800" style={{ fontSize: "2.5vw", color: "#3DD9AC" }}>Go-Live</span>
              </div>
              <span className="font-body font-400" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Week 5+</span>
            </div>
            <div className="flex flex-col gap-[2vh] px-[2.5vw] py-[3vh] flex-1" style={{ background: "rgba(61, 217, 172, 0.06)" }}>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Production cutover</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Live on day one with all workflows active</p>
              </div>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Hypercare support</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Dedicated support for the first 30 days</p>
              </div>
              <div>
                <p className="font-body font-600 mb-[0.5vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>Ongoing SLA</p>
                <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>99.9% uptime commitment, SOC 2 compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>13</span>
      </div>
    </div>
  );
}
