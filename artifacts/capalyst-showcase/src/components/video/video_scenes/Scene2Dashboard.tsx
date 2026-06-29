import { useState, useEffect } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion, animate } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

function CountUp({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, target, {
      type: "spring",
      stiffness: 180,
      damping: 20,
      onUpdate(value) {
        setValue(Math.round(value));
      }
    });
    return controls.stop;
  }, [target]);

  return <>{value}</>;
}

const ACTIVITY = [
  { text: 'DEV-2041 closed - root cause confirmed', time: '2m ago', color: '#3DD9AC' },
  { text: 'CAPA-089 submitted for QA review', time: '14m ago', color: '#4B9FE1' },
  { text: 'CC-017 approved by all reviewers', time: '1h ago', color: '#4B9FE1' },
  { text: 'DEV-2039 escalated - overdue 3 days', time: '2h ago', color: '#F5A623' },
];

export function Scene2Dashboard() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 400,  callback: () => setPhase(1) },
    { time: 1600, callback: () => setPhase(2) },
    { time: 3200, callback: () => setPhase(3) },
    { time: 5500, callback: () => setPhase(4) },
  ]);

  const kpis = [
    { label: 'Open Deviations', value: 24, color: 'text-[#4B9FE1]', border: 'border-[#4B9FE1]/30' },
    { label: 'Overdue CAPAs', value: 7, color: 'text-[#F5A623]', border: 'border-[#F5A623]/30' },
    { label: 'Change Controls', value: 12, color: 'text-[#3DD9AC]', border: 'border-[#3DD9AC]/30' },
  ];

  return (
    <motion.div
      className="absolute inset-0 px-[5vw] py-[4vh] flex flex-col"
      {...sceneTransitions.glassReveal}
    >
      <motion.h2
        className="text-[2.8vw] font-display font-semibold mb-[2.5vh] text-white/90"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9 }}
      >
        Real-Time Quality Oversight
      </motion.h2>

      {/* KPI cards */}
      <div className="flex gap-[2vw] mb-[2.5vh]">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            className={`flex-1 bg-white/5 border ${kpi.border} rounded-2xl p-[2vw] backdrop-blur-md`}
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: i * 0.18 }}
          >
            <p className="text-white/50 text-[0.85vw] uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className={`text-[4.5vw] font-display font-bold ${kpi.color} leading-none`}>
              {phase >= 2 ? <CountUp target={kpi.value} /> : 0}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Chart + Activity feed */}
      <div className="flex-1 flex gap-[2vw] min-h-0">
        {/* Chart */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-[2vw] backdrop-blur-sm relative overflow-hidden">
          <p className="text-white/40 text-[0.8vw] uppercase tracking-widest mb-2">Deviation Trend - 30 days</p>
          <svg className="w-full h-[80%]" viewBox="0 0 800 180" preserveAspectRatio="none">
            {[...Array(5)].map((_, i) => (
              <line key={i} x1="0" y1={i * 45} x2="800" y2={i * 45} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            <defs>
              <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4B9FE1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4B9FE1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0,160 C80,140 160,130 240,120 S400,90 480,75 S640,50 800,30"
              fill="none"
              stroke="#4B9FE1"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={phase >= 3 ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
            />
            <motion.path
              d="M0,160 C80,140 160,130 240,120 S400,90 480,75 S640,50 800,30 L800,180 L0,180 Z"
              fill="url(#chartGrad)"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1.2, delay: 1 }}
            />
          </svg>
        </div>

        {/* Activity feed */}
        <div className="w-[28vw] bg-white/5 border border-white/10 rounded-2xl p-[2vw] backdrop-blur-sm flex flex-col gap-[1.2vh]">
          <p className="text-white/40 text-[0.8vw] uppercase tracking-widest mb-1">Recent Activity</p>
          {ACTIVITY.map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
              initial={{ opacity: 0, x: 24 }}
              animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
              transition={{ delay: i * 0.2, type: 'spring', stiffness: 280, damping: 26 }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <p className="text-[0.9vw] text-white/80 flex-1">{item.text}</p>
              <span className="text-[0.75vw] text-white/30">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
