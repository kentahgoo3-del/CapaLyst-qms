export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #050B14 0%, #0A1628 60%, #0D1F3C 100%)" }}>
      {/* Background grid dots */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #4B9FE1 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Teal accent bar — left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.4vw]" style={{ background: "linear-gradient(to bottom, #3DD9AC, #4B9FE1)" }} />

      {/* Top-right geometric accent */}
      <div className="absolute top-0 right-0 w-[28vw] h-[28vw] opacity-10 rounded-full" style={{ background: "radial-gradient(circle, #4B9FE1 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col justify-center pl-[9vw] pr-[12vw]">
        {/* Product label */}
        <div className="flex items-center gap-[1.2vw] mb-[3vh]">
          <div className="h-[0.25vh] w-[3vw] bg-accent" />
          <span className="font-display font-600 tracking-[0.25em] uppercase" style={{ fontSize: "1.8vw", color: "#3DD9AC" }}>
            Capalyst QMS
          </span>
        </div>

        {/* Hero headline */}
        <h1
          className="font-display font-800 leading-[1.05] tracking-tight"
          style={{ fontSize: "5.2vw", color: "#ffffff", textWrap: "balance", maxWidth: "70vw" }}
        >
          Pharmaceutical Quality,
          <span style={{ color: "#3DD9AC" }}> Reimagined.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="font-body font-400 mt-[3vh]"
          style={{ fontSize: "1.9vw", color: "rgba(255,255,255,0.7)", maxWidth: "55vw", lineHeight: 1.4 }}
        >
          Built for QA teams in regulated pharma and biotech — from deviation to closure, without the paper trail.
        </p>

        {/* Divider */}
        <div className="mt-[5vh] h-[0.15vh] w-[20vw]" style={{ background: "linear-gradient(to right, #3DD9AC, transparent)" }} />

        {/* Bottom tag */}
        <p className="mt-[2.5vh] font-body font-600" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}>
          CONFIDENTIAL &nbsp;·&nbsp; 2026
        </p>
      </div>

      {/* Bottom-right watermark text */}
      <div className="absolute bottom-[4vh] right-[6vw] text-right">
        <p className="font-display font-800 tracking-tighter" style={{ fontSize: "1.6vw", color: "rgba(75, 159, 225, 0.18)" }}>
          CAPALYST
        </p>
      </div>
    </div>
  );
}
