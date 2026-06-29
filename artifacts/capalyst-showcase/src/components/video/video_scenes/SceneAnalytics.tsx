import { useState, useEffect, useRef } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

function CountUp({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return <>{value}</>;
}

const AREA_DATA = [
  { label: 'Manufacturing', value: 38, color: '#4B9FE1' },
  { label: 'QC Lab', value: 24, color: '#4B9FE1' },
  { label: 'Packaging', value: 17, color: '#F5A623' },
  { label: 'Warehouse', value: 12, color: '#3DD9AC' },
  { label: 'Other', value: 9, color: '#3DD9AC' },
];
const MAX_AREA = 38;

const CAPA_ROWS = [
  { label: 'On-Time Closure', pct: 87, color: '#3DD9AC' },
  { label: 'Efficacy Verified', pct: 79, color: '#4B9FE1' },
  { label: 'Recurrence Rate', pct: 8, color: '#F5A623', inverse: true },
];

const KPI_CARDS = [
  { label: 'Reports generated', value: 142, suffix: '', color: '#4B9FE1' },
  { label: 'Avg export time', value: 3, suffix: 's', color: '#3DD9AC' },
  { label: 'Scheduled reports', value: 24, suffix: '', color: '#F5A623' },
  { label: 'Formats supported', value: 4, suffix: '', color: '#3DD9AC' },
];

const TREND_PATH = "M0,120 C30,115 60,105 90,95 S150,75 180,65 S240,48 270,40 S330,28 360,22 S420,14 450,10";

export function SceneAnalytics() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,   callback: () => setPhase(1) },
    { time: 1500,  callback: () => setPhase(2) },
    { time: 3500,  callback: () => setPhase(3) },
    { time: 5800,  callback: () => setPhase(4) },
    { time: 8500,  callback: () => setPhase(5) },
    { time: 11000, callback: () => setPhase(6) },
  ]);

  return (
    <motion.div className="absolute inset-0 px-[5vw] py-[3.5vh] flex flex-col" {...sceneTransitions.splitVertical}>
      {/* Header */}
      <motion.div className="flex items-end justify-between mb-[2vh]"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.9 }}
      >
        <div>
          <h2 className="text-[2.6vw] font-display font-bold text-white">
            Reports &amp; <span className="text-[#3DD9AC]">Analytics</span>
          </h2>
          <p className="text-[0.95vw] text-white/35 mt-0.5">
            Built-in dashboards, trend analysis, and export-ready reports - no BI tool needed
          </p>
        </div>
        <motion.div className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {['CSV', 'PDF', 'Excel', 'API'].map((fmt, i) => (
            <span key={i} className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[0.72vw] text-white/45 font-medium">
              {fmt}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* 2-column grid */}
      <div className="flex-1 grid grid-cols-2 gap-[1.5vw] min-h-0">

        {/* TOP LEFT - Deviation trend line chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-[1.5vw] flex flex-col backdrop-blur-sm">
          <p className="text-white/35 text-[0.75vw] uppercase tracking-widest mb-2">Deviation Trend - 6 months</p>
          <div className="flex-1 relative">
            <svg className="w-full h-full" viewBox="0 0 450 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4B9FE1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4B9FE1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 40, 80, 120].map((y, i) => (
                <line key={i} x1="0" y1={y} x2="450" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))}
              {/* Month labels */}
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                <text key={i} x={i * 90} y="128" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="inherit">{m}</text>
              ))}
              <motion.path
                d={TREND_PATH}
                fill="none" stroke="#4B9FE1" strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
              />
              <motion.path
                d={`${TREND_PATH} L450,130 L0,130 Z`}
                fill="url(#trendGrad)"
                initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 1.2, delay: 1.5 }}
              />
              {/* Second series (CAPA closures) */}
              <motion.path
                d="M0,128 C30,122 60,118 90,112 S150,100 180,92 S240,80 270,72 S330,60 360,55 S420,48 450,44"
                fill="none" stroke="#3DD9AC" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3"
                initial={{ pathLength: 0 }} animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 2.5, delay: 0.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute top-0 right-0 flex gap-3 text-[0.65vw]">
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#4B9FE1]" /><span className="text-white/30">Deviations</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#3DD9AC] opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #3DD9AC 0, #3DD9AC 4px, transparent 4px, transparent 8px)' }} /><span className="text-white/30">CAPA closures</span></div>
            </div>
          </div>
        </div>

        {/* TOP RIGHT - Deviations by Area horizontal bar chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-[1.5vw] flex flex-col backdrop-blur-sm">
          <p className="text-white/35 text-[0.75vw] uppercase tracking-widest mb-3">Deviations by Area</p>
          <div className="flex-1 flex flex-col justify-around">
            {AREA_DATA.map((row, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-[0.82vw] text-white/60">{row.label}</span>
                  <span className="text-[0.78vw] font-semibold" style={{ color: row.color }}>
                    {phase >= 3 ? <CountUp target={row.value} duration={1400} /> : 0}%
                  </span>
                </div>
                <div className="h-[7px] bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: row.color }}
                    initial={{ width: 0 }}
                    animate={phase >= 3 ? { width: `${(row.value / MAX_AREA) * 100}%` } : { width: 0 }}
                    transition={{ duration: 1.2, delay: i * 0.15 + 0.2, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* BOTTOM LEFT - CAPA effectiveness */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-[1.5vw] flex flex-col backdrop-blur-sm">
          <p className="text-white/35 text-[0.75vw] uppercase tracking-widest mb-3">CAPA Effectiveness Metrics</p>
          <div className="flex-1 flex flex-col justify-around">
            {CAPA_ROWS.map((row, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: i * 0.22, duration: 0.8 }}
              >
                <div className="flex justify-between mb-1.5">
                  <span className="text-[0.85vw] text-white/60">{row.label}</span>
                  <span className="text-[1.1vw] font-display font-bold" style={{ color: row.color }}>
                    {phase >= 4 ? <CountUp target={row.pct} duration={1800} /> : 0}%
                  </span>
                </div>
                <div className="h-[8px] bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${row.color}aa, ${row.color})` }}
                    initial={{ width: 0 }}
                    animate={phase >= 4 ? { width: `${row.pct}%` } : { width: 0 }}
                    transition={{ duration: 1.4, delay: i * 0.22 + 0.3, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* BOTTOM RIGHT - KPI cards + export callout */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-[1.5vw] flex flex-col backdrop-blur-sm">
          <p className="text-white/35 text-[0.75vw] uppercase tracking-widest mb-3">Reporting at a Glance</p>
          <div className="grid grid-cols-2 gap-[1vw] flex-1">
            {KPI_CARDS.map((kpi, i) => (
              <motion.div key={i}
                className="flex flex-col justify-center rounded-xl bg-white/5 border border-white/8 p-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 280, damping: 22 }}
              >
                <p className="text-[1.8vw] font-display font-bold leading-none mb-1" style={{ color: kpi.color }}>
                  {phase >= 5 ? <CountUp target={kpi.value} duration={1600} /> : 0}{kpi.suffix}
                </p>
                <p className="text-[0.72vw] text-white/40 leading-tight">{kpi.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.div className="mt-3 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#3DD9AC] shrink-0" />
            <p className="text-[0.8vw] text-white/45">Scheduled reports delivered automatically to your inbox</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
