export default function Slide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #050B14 0%, #0A1628 100%)" }}>
      {/* Background grid dots */}
      <div className="absolute inset-0 opacity-8" style={{ backgroundImage: "radial-gradient(circle, #4B9FE1 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.4vw]" style={{ background: "linear-gradient(to bottom, #3DD9AC, #4B9FE1)" }} />

      <div className="absolute inset-0 flex items-center pl-[9vw] pr-[8vw] gap-[6vw]">
        {/* Left — stat hero */}
        <div className="flex flex-col items-start justify-center min-w-[32vw]">
          <span className="font-display font-600 tracking-[0.2em] uppercase mb-[1.5vh]" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>
            The Cost of Failure
          </span>
          <div className="h-[0.15vh] w-[8vw] mb-[3vh]" style={{ background: "#3DD9AC" }} />
          <span
            className="font-display font-800 leading-none tracking-tighter"
            style={{ fontSize: "8vw", color: "#4B9FE1" }}
          >
            $50M
          </span>
          <p className="font-body font-600 mt-[1.5vh]" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>
            average cost of a major<br />pharmaceutical recall
          </p>
        </div>

        {/* Vertical divider */}
        <div className="self-stretch w-[0.12vw] my-[8vh]" style={{ background: "rgba(61, 217, 172, 0.3)" }} />

        {/* Right — pain points */}
        <div className="flex flex-col justify-center gap-[3.5vh] flex-1">
          <h2 className="font-display font-800 leading-tight mb-[1vh]" style={{ fontSize: "1.8vw", color: "#ffffff" }}>
            Where quality breaks down
          </h2>

          <div className="flex items-start gap-[1.5vw]">
            <span className="font-display font-800 mt-[0.3vh]" style={{ fontSize: "1.7vw", color: "#3DD9AC" }}>01</span>
            <p className="font-body font-400" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.35 }}>
              Paper trails and spreadsheets create untracked gaps in deviation records
            </p>
          </div>

          <div className="flex items-start gap-[1.5vw]">
            <span className="font-display font-800 mt-[0.3vh]" style={{ fontSize: "1.7vw", color: "#3DD9AC" }}>02</span>
            <p className="font-body font-400" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.35 }}>
              Manual sign-offs delay closures and break audit chains
            </p>
          </div>

          <div className="flex items-start gap-[1.5vw]">
            <span className="font-display font-800 mt-[0.3vh]" style={{ fontSize: "1.7vw", color: "#3DD9AC" }}>03</span>
            <p className="font-body font-400" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.35 }}>
              Audit prep consumes weeks of QA bandwidth every cycle
            </p>
          </div>

          <div className="flex items-start gap-[1.5vw]">
            <span className="font-display font-800 mt-[0.3vh]" style={{ fontSize: "1.7vw", color: "#3DD9AC" }}>04</span>
            <p className="font-body font-400" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.35 }}>
              No real-time visibility across open CAPAs and change controls
            </p>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>02</span>
      </div>
    </div>
  );
}
