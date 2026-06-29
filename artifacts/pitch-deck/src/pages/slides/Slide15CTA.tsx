export default function Slide15CTA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #050B14 0%, #0A1628 60%, #0D1F3C 100%)" }}>
      {/* Background grid dots */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #4B9FE1 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Teal accent bar — left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.4vw]" style={{ background: "linear-gradient(to bottom, #3DD9AC, #4B9FE1)" }} />

      {/* Top-right geometric accent */}
      <div className="absolute top-0 right-0 w-[30vw] h-[30vw] opacity-10 rounded-full" style={{ background: "radial-gradient(circle, #3DD9AC 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

      {/* Bottom-left accent */}
      <div className="absolute bottom-0 left-0 w-[20vw] h-[20vw] opacity-8 rounded-full" style={{ background: "radial-gradient(circle, #4B9FE1 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      {/* Main content — centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[10vw]">
        {/* Product label */}
        <div className="flex items-center gap-[1.2vw] mb-[4vh]">
          <div className="h-[0.25vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
          <span className="font-display font-600 tracking-[0.25em] uppercase" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>
            Capalyst QMS
          </span>
          <div className="h-[0.25vh] w-[3vw]" style={{ background: "#3DD9AC" }} />
        </div>

        {/* Hero headline */}
        <h1
          className="font-display font-800 leading-tight tracking-tight mb-[3vh]"
          style={{ fontSize: "4.8vw", color: "#ffffff", textWrap: "balance" }}
        >
          Ready to see it live?
        </h1>

        {/* Subline */}
        <p
          className="font-body font-400 mb-[6vh]"
          style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, maxWidth: "60vw" }}
        >
          A 30-minute demo covers all four modules, a live audit trail walk-through, and a Q&A with the product team.
        </p>

        {/* Divider */}
        <div className="h-[0.15vh] w-[20vw] mb-[6vh]" style={{ background: "linear-gradient(to right, transparent, #3DD9AC, transparent)" }} />

        {/* Contact info row */}
        <div className="flex items-center gap-[8vw]">
          <div className="flex flex-col items-center gap-[1vh]">
            <span className="font-body font-600 tracking-[0.15em] uppercase" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.4)" }}>Website</span>
            <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>capalyst.io</span>
          </div>
          <div className="w-[0.12vw] h-[8vh]" style={{ background: "rgba(61, 217, 172, 0.3)" }} />
          <div className="flex flex-col items-center gap-[1vh]">
            <span className="font-body font-600 tracking-[0.15em] uppercase" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.4)" }}>Email</span>
            <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#4B9FE1" }}>demo@capalyst.io</span>
          </div>
          <div className="w-[0.12vw] h-[8vh]" style={{ background: "rgba(61, 217, 172, 0.3)" }} />
          <div className="flex flex-col items-center gap-[1vh]">
            <span className="font-body font-600 tracking-[0.15em] uppercase" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.4)" }}>Request</span>
            <span className="font-display font-800" style={{ fontSize: "1.3vw", color: "#3DD9AC" }}>capalyst.io/demo</span>
          </div>
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-[4vh] left-[9vw] right-[6vw] flex items-center justify-between">
        <p className="font-body font-400" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
          CONFIDENTIAL &nbsp;·&nbsp; 2026 &nbsp;·&nbsp; Capalyst Technologies
        </p>
        <span className="font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.2)" }}>15</span>
      </div>
    </div>
  );
}
