export default function Slide05Dashboard() {
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
            Dashboard
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display font-800 leading-tight tracking-tight mb-[4.5vh]" style={{ fontSize: "2.5vw", color: "#ffffff" }}>
          Live quality at a glance
        </h2>

        {/* KPI cards row */}
        <div className="grid grid-cols-4 gap-[2vw] mb-[3.5vh]">
          {/* Card 1 */}
          <div className="flex flex-col p-[2.2vw] rounded-[0.8vw]" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <span className="font-body font-600 mb-[1.5vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)" }}>Total Deviations</span>
            <span className="font-display font-800 leading-none" style={{ fontSize: "4.8vw", color: "#4B9FE1" }}>47</span>
            <span className="font-body font-400 mt-[1vh]" style={{ fontSize: "1.6vw", color: "#3DD9AC" }}>+3 this week</span>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col p-[2.2vw] rounded-[0.8vw]" style={{ background: "rgba(245, 166, 35, 0.08)", border: "1px solid rgba(245, 166, 35, 0.3)" }}>
            <span className="font-body font-600 mb-[1.5vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)" }}>Overdue</span>
            <span className="font-display font-800 leading-none" style={{ fontSize: "4.8vw", color: "#F5A623" }}>8</span>
            <span className="font-body font-400 mt-[1vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Past due date</span>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col p-[2.2vw] rounded-[0.8vw]" style={{ background: "rgba(61, 217, 172, 0.08)", border: "1px solid rgba(61, 217, 172, 0.25)" }}>
            <span className="font-body font-600 mb-[1.5vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)" }}>Open CAPAs</span>
            <span className="font-display font-800 leading-none" style={{ fontSize: "4.8vw", color: "#3DD9AC" }}>12</span>
            <span className="font-body font-400 mt-[1vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>In progress</span>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col p-[2.2vw] rounded-[0.8vw]" style={{ background: "rgba(75, 159, 225, 0.1)", border: "1px solid rgba(75, 159, 225, 0.3)" }}>
            <span className="font-body font-600 mb-[1.5vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.6)" }}>CCs in Review</span>
            <span className="font-display font-800 leading-none" style={{ fontSize: "4.8vw", color: "#4B9FE1" }}>5</span>
            <span className="font-body font-400 mt-[1vh]" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)" }}>Pending approval</span>
          </div>
        </div>

        {/* Trend chart mockup */}
        <div className="flex-1 rounded-[0.8vw] px-[2.5vw] py-[2vh]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between mb-[1.5vh]">
            <span className="font-display font-800" style={{ fontSize: "1.7vw", color: "rgba(255,255,255,0.8)" }}>30-Day Deviation Trend</span>
            <span className="font-body font-400" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.4)" }}>By area — Manufacturing · QC · Packaging · Warehouse</span>
          </div>
          {/* Simplified bar chart visual */}
          <div className="flex items-end gap-[1.2vw] h-[15vh]">
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "45%", background: "rgba(75, 159, 225, 0.5)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "60%", background: "rgba(75, 159, 225, 0.5)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "35%", background: "rgba(75, 159, 225, 0.5)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "80%", background: "rgba(75, 159, 225, 0.6)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "55%", background: "rgba(75, 159, 225, 0.5)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "70%", background: "rgba(61, 217, 172, 0.6)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "40%", background: "rgba(61, 217, 172, 0.6)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "90%", background: "rgba(61, 217, 172, 0.6)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "65%", background: "rgba(61, 217, 172, 0.6)" }} />
            <div className="flex-1 rounded-t-[0.3vw]" style={{ height: "50%", background: "rgba(61, 217, 172, 0.5)" }} />
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[6vw]">
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.25)" }}>05</span>
      </div>
    </div>
  );
}
