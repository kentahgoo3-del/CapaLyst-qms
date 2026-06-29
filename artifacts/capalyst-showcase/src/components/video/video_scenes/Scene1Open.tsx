import { useState, useEffect, useRef } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion, AnimatePresence } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

function CountUpTo({ target, duration = 1400, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
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
  return <>{prefix}{value}{suffix}</>;
}

const MODULES = [
  {
    label: 'Deviations', color: '#4B9FE1', bg: 'rgba(75,159,225,0.08)', border: 'rgba(75,159,225,0.35)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4B9FE1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ), desc: 'Event-to-closure tracking',
  },
  {
    label: 'CAPA', color: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.35)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ), desc: 'Corrective & preventive actions',
  },
  {
    label: 'Change Control', color: '#4B9FE1', bg: 'rgba(75,159,225,0.08)', border: 'rgba(75,159,225,0.35)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4B9FE1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
        <path d="M18 9a9 9 0 0 1-9 9"/>
      </svg>
    ), desc: 'Multi-reviewer approval chains',
  },
  {
    label: 'Analytics', color: '#3DD9AC', bg: 'rgba(61,217,172,0.08)', border: 'rgba(61,217,172,0.35)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3DD9AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ), desc: 'Reports, trends & audit trails',
  },
];

export function Scene1Open() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 400,   callback: () => setPhase(1) },
    { time: 1800,  callback: () => setPhase(2) },
    { time: 3600,  callback: () => setPhase(3) },
    { time: 5200,  callback: () => setPhase(4) },
    { time: 6400,  callback: () => setPhase(5) },
    { time: 8000,  callback: () => setPhase(6) },
    { time: 10500, callback: () => setPhase(7) },
    { time: 13000, callback: () => setPhase(8) },
  ]);

  return (
    <motion.div className="absolute inset-0 flex" {...sceneTransitions.morphExpand}>
      {/* Pharma lab background */}
      <motion.div className="absolute inset-0"
        initial={{ scale: 1.1, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.15, opacity: 0, filter: 'blur(20px)' }}
        transition={{ duration: 5, ease: 'easeOut' }}
      >
        <img src={`${import.meta.env.BASE_URL}images/pharma-lab-bg.png`} alt="" aria-hidden
          className="w-full h-full object-cover"
          style={{ filter: 'blur(8px) brightness(0.22) saturate(1.3)' }} />
      </motion.div>
      <motion.div className="absolute inset-0 mix-blend-screen"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 0.25 }} 
        exit={{ opacity: 0 }}
        transition={{ duration: 5 }}
      >
        <img src={`${import.meta.env.BASE_URL}images/particle-texture.png`} alt="" aria-hidden
          className="w-full h-full object-cover" />
      </motion.div>

      {/* ── DRAMATIC STAT HOOK (phases 0–3) ── */}
      <AnimatePresence>
        {phase < 4 && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-[15vw]"
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          >
            {/* Big number */}
            <motion.p
              className="text-[10vw] font-display font-black text-white leading-none tracking-tight mb-4"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            >
              {phase >= 1 ? <CountUpTo target={50} suffix="M+" prefix="$" duration={1200} /> : '$0'}
            </motion.p>

            {/* Stat description */}
            <motion.p
              className="text-[2.2vw] text-white/70 font-light mb-3"
              initial={{ opacity: 0, y: 18 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.9 }}
            >
              Average cost of a single pharmaceutical product recall
            </motion.p>
            <motion.p
              className="text-[1.2vw] text-[#F5A623]/85 mb-12"
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
            >
              Caused by preventable quality management failures - deviations missed, CAPAs unverified, changes unapproved.
            </motion.p>

            {/* The pivot */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 1 }}
            >
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#3DD9AC] to-transparent" />
              <p className="text-[1.8vw] text-[#3DD9AC] font-semibold tracking-wide">There is a better way.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT (phase 4+) ── */}
      <motion.div
        className="absolute inset-0 z-10 flex"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.3 }}
      >
        {/* LEFT */}
        <div className="w-[44%] flex flex-col justify-center px-[5vw]">
          <motion.div className="flex items-center gap-4 mb-7"
            initial={{ x: -50, opacity: 0 }}
            animate={phase >= 5 ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-[#4B9FE1] to-[#3DD9AC] rounded-xl shadow-2xl shadow-[#4B9FE1]/30 shrink-0" />
            <div>
              <h1 className="text-[4.2vw] font-display font-bold tracking-tight leading-none">Capalyst</h1>
              <p className="text-[0.85vw] text-white/40 uppercase tracking-widest mt-1">Pharmaceutical Quality Management</p>
            </div>
          </motion.div>

          <motion.p className="text-[1.2vw] text-white/75 font-light leading-relaxed mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.9, delay: 0.15 }}
          >
            A purpose-built QMS that eliminates the chaos of spreadsheets, manual sign-off chains, and disconnected paper trails - replacing them with a single, audit-ready platform.
          </motion.p>

          <motion.div
            className="h-px bg-gradient-to-r from-[#3DD9AC] to-transparent mb-5"
            initial={{ width: 0 }}
            animate={phase >= 5 ? { width: '75%' } : { width: 0 }}
            transition={{ duration: 1.2 }}
          />

          <motion.p className="text-[1.3vw] text-[#3DD9AC] font-semibold"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            Capalyst brings clarity, control, and compliance - in one unified platform.
          </motion.p>

          {/* Bottom stats */}
          <motion.div className="mt-8 flex gap-6"
            initial={{ opacity: 0 }} animate={phase >= 8 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {[
              { n: 100, suffix: '%', label: 'Audit ready' },
              { n: 0, suffix: ' paper', label: 'Processes' },
              { n: 4, suffix: ' modules', label: 'Integrated' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[2vw] font-display font-bold text-white leading-none">
                  {phase >= 8 ? <CountUpTo target={s.n} duration={1400} suffix={s.suffix} /> : `0${s.suffix}`}
                </p>
                <p className="text-[0.72vw] text-white/35 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT - module cards */}
        <div className="flex-1 flex flex-col justify-center pr-[5vw] pl-[2vw] gap-[1.6vh]">
          <motion.p className="text-[0.8vw] text-white/25 uppercase tracking-widest mb-1"
            initial={{ opacity: 0 }} animate={phase >= 6 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            Platform modules
          </motion.p>
          {MODULES.map((mod, i) => (
            <motion.div key={i}
              className="flex items-center gap-4 rounded-2xl px-[2vw] py-[1.8vh] backdrop-blur-sm border"
              style={{ background: mod.bg, borderColor: mod.border }}
              initial={{ opacity: 0, x: 50 }}
              animate={phase >= 6 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ delay: i * 0.16, type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="shrink-0">{mod.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[1vw] font-semibold" style={{ color: mod.color }}>{mod.label}</p>
                <p className="text-[0.78vw] text-white/38">{mod.desc}</p>
              </div>
              <svg width="44" height="22" viewBox="0 0 44 22" className="shrink-0 opacity-40">
                <motion.polyline points="0,18 11,13 22,9 33,5 44,1" fill="none" stroke={mod.color} strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={phase >= 7 ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.14 }}
                />
                <motion.circle cx="44" cy="1" r="2.5" fill={mod.color}
                  initial={{ scale: 0 }} animate={phase >= 7 ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: i * 0.14 + 0.7, type: 'spring', stiffness: 400 }}
                  style={{ transformOrigin: '44px 1px' }}
                />
              </svg>
            </motion.div>
          ))}
          <motion.p className="text-center text-[0.85vw] text-white/22 uppercase tracking-widest mt-2"
            initial={{ opacity: 0 }} animate={phase >= 7 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            One platform · Full lifecycle · Zero gaps
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
