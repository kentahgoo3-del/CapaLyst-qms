import { useState, useEffect, useRef } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

function CountUp({ target, duration = 2000, decimals = 0 }: { target: number; duration?: number; decimals?: number }) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const v = (1 - Math.pow(1 - p, 3)) * target;
      setValue(decimals ? parseFloat(v.toFixed(decimals)) : Math.round(v));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return <>{decimals ? value.toFixed(decimals) : value}</>;
}

const STATS = [
  { value: 60, suffix: '%', prefix: '↓', label: 'Faster deviation closure', color: '#3DD9AC', sub: 'vs. paper-based workflows' },
  { value: 100, suffix: '%', prefix: '', label: 'Audit-ready at all times', color: '#4B9FE1', sub: 'Immutable, timestamped records' },
  { value: 0, suffix: '', prefix: '', label: 'Paper processes remaining', color: '#F5A623', sub: 'Fully digital, end-to-end' },
];

const BEFORE_AFTER = [
  { label: 'Deviation closure', before: 28, after: 11, unit: 'days' },
  { label: 'Audit preparation', before: 14, after: 2, unit: 'days' },
  { label: 'CAPA sign-off', before: 21, after: 7, unit: 'days' },
  { label: 'Change approval', before: 10, after: 3, unit: 'days' },
];
const MAX_BEFORE = 28;

const BENEFITS = [
  { icon: '🔍', text: 'Real-time visibility across all quality events - from any device' },
  { icon: '🔐', text: 'Role-gated access with electronic signatures at every workflow step' },
  { icon: '📊', text: 'Built-in reporting: trend charts, area breakdowns, CAPA effectiveness' },
  { icon: '✅', text: 'GMP · 21 CFR Part 11 · Annex 11 compliance architecture built-in' },
];

export function SceneBenefits() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,   callback: () => setPhase(1) },
    { time: 1600,  callback: () => setPhase(2) },
    { time: 4000,  callback: () => setPhase(3) },
    { time: 7000,  callback: () => setPhase(4) },
    { time: 10500, callback: () => setPhase(5) },
  ]);

  return (
    <motion.div className="absolute inset-0 px-[5vw] py-[4vh] flex flex-col" {...sceneTransitions.wipe}>
      {/* Header */}
      <motion.div className="mb-[2.5vh]"
        initial={{ opacity: 0, y: -24 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
        transition={{ duration: 0.9 }}
      >
        <h2 className="text-[2.8vw] font-display font-bold text-white leading-tight">
          Why teams choose <span className="text-[#3DD9AC]">Capalyst</span>
        </h2>
        <p className="text-[1vw] text-white/40 mt-1">Measured impact across regulated pharma &amp; biotech environments</p>
      </motion.div>

      {/* STAT CARDS */}
      <div className="flex gap-[2vw] mb-[2.5vh]">
        {STATS.map((s, i) => (
          <motion.div key={i}
            className="flex-1 rounded-2xl p-[2vw] backdrop-blur-md border border-white/10 bg-white/5 flex flex-col"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: i * 0.18 }}
          >
            <p className={`text-[4vw] font-display font-bold leading-none mb-2`} style={{ color: s.color }}>
              {s.prefix}
              {phase >= 2 ? <CountUp target={s.value} duration={2200} /> : 0}
              {s.suffix}
            </p>
            <p className="text-[1vw] font-semibold text-white/85 mb-1">{s.label}</p>
            <p className="text-[0.78vw] text-white/35">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* BEFORE vs AFTER chart */}
      <div className="flex gap-[3vw] flex-1 min-h-0">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-[2vw] backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-[1.5vh]">
            <p className="text-white/40 text-[0.8vw] uppercase tracking-widest">Time to Close - Before vs After Capalyst</p>
            <div className="flex items-center gap-4 text-[0.75vw]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white/20" /><span className="text-white/40">Before</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#3DD9AC]" /><span className="text-white/40">After</span></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-around gap-[1.2vh]">
            {BEFORE_AFTER.map((row, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[0.85vw] text-white/60">{row.label}</span>
                  <span className="text-[0.75vw] text-white/30">{row.unit}</span>
                </div>
                {/* Before bar */}
                <div className="h-[5px] bg-white/8 rounded-full mb-1 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-white/20"
                    initial={{ width: 0 }}
                    animate={phase >= 3 ? { width: `${(row.before / MAX_BEFORE) * 100}%` } : { width: 0 }}
                    transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                  />
                </div>
                {/* After bar */}
                <div className="h-[5px] bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[#3DD9AC]"
                    initial={{ width: 0 }}
                    animate={phase >= 3 ? { width: `${(row.after / MAX_BEFORE) * 100}%` } : { width: 0 }}
                    transition={{ duration: 1.2, delay: i * 0.15 + 0.3, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[0.7vw] text-white/25">{row.before} days</span>
                  <span className="text-[0.7vw] text-[#3DD9AC]/70">{row.after} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefit bullets */}
        <div className="w-[30%] flex flex-col justify-center gap-[1.8vh]">
          <p className="text-[0.8vw] text-white/30 uppercase tracking-widest mb-2">Key capabilities</p>
          {BENEFITS.map((b, i) => (
            <motion.div key={i} className="flex items-start gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-3"
              initial={{ opacity: 0, x: 30 }}
              animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ delay: i * 0.2, type: 'spring', stiffness: 220, damping: 26 }}
            >
              <span className="text-[1.2vw] shrink-0 mt-0.5">{b.icon}</span>
              <p className="text-[0.82vw] text-white/65 leading-snug">{b.text}</p>
            </motion.div>
          ))}

          {/* Closing line */}
          <motion.p className="text-[0.9vw] text-[#3DD9AC] font-medium mt-2 leading-snug"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            Purpose-built for regulated pharma teams - not adapted from generic tools.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
