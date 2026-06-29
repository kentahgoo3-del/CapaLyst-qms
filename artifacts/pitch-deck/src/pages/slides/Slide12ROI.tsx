export default function Slide12ROI() {
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
            Value Delivered
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[2vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Returns teams see in the first year
        </h2>
        <p className="font-body font-400 mb-[5vh]" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.6)" }}>
          Based on outcomes reported by QA teams moving from paper-based and spreadsheet systems
        </p>

        {/* 3 stat hero cards */}
        <div className="grid grid-cols-3 gap-[3vw] flex-1">
          {/* Card 1 */}
          <div className="flex flex-col justify-between p-[3vw] rounded-[1vw]" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
            <div>
              <span className="font-display font-800 leading-none tracking-tighter" style={{ fontSize: "4.8vw", color: "#4B9FE1" }}>60%</span>
              <div className="h-[0.15vh] w-[6vw] mt-[2vh] mb-[2vh]" style={{ background: "#4B9FE1" }} />
            </div>
            <div>
              <p className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#ffffff", lineHeight: 1.2 }}>faster audit preparation</p>
              <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.35 }}>
                Immutable logs and structured records eliminate manual collation before an inspection
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col justify-between p-[3vw] rounded-[1vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.35)" }}>
            <div>
              <span className="font-display font-800 leading-none tracking-tighter" style={{ fontSize: "4.8vw", color: "#3DD9AC" }}>40%</span>
              <div className="h-[0.15vh] w-[6vw] mt-[2vh] mb-[2vh]" style={{ background: "#3DD9AC" }} />
            </div>
            <div>
              <p className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#ffffff", lineHeight: 1.2 }}>reduction in deviation closure time</p>
              <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.35 }}>
                Automated routing and e-sig gates remove the delays of chasing wet signatures
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col justify-between p-[3vw] rounded-[1vw]" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.35)" }}>
            <div>
              <span className="font-display font-800 leading-none tracking-tighter" style={{ fontSize: "4.8vw", color: "#4B9FE1" }}>$2M+</span>
              <div className="h-[0.15vh] w-[6vw] mt-[2vh] mb-[2vh]" style={{ background: "#4B9FE1" }} />
            </div>
            <div>
              <p className="font-display font-800 mb-[1vh]" style={{ fontSize: "1.3vw", color: "#ffffff", lineHeight: 1.2 }}>saved per recall avoided</p>
              <p className="font-body font-400" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.35 }}>
                Proper CAPA closure and efficacy review cut repeat failures before they escalate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>12</span>
      </div>
    </div>
  );
}
