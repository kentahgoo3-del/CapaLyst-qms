import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion, AnimatePresence } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const ACTION_ITEMS = [
  { id: 'DEV-2041', action: 'Awaiting QA sign-off', user: 'Assigned to: J. Müller', urgency: 'high', color: '#F5A623', due: 'Due today' },
  { id: 'CAPA-089', action: 'Efficacy review overdue', user: 'Owner: A. Singh', urgency: 'critical', color: '#EF4444', due: 'Overdue 2d' },
  { id: 'CC-017', action: 'Expert review pending', user: 'Assigned to: R. Chen', urgency: 'medium', color: '#4B9FE1', due: 'Due tomorrow' },
];

const ACTIVITY_ITEMS = [
  { id: 'DEV-2039', text: 'Root cause analysis submitted', user: 'S. Chen · QA Lead', time: '4m ago', color: '#3DD9AC' },
  { id: 'CC-014', text: 'Change control approved', user: 'R. Chen · SC Review', time: '22m ago', color: '#4B9FE1' },
  { id: 'CAPA-085', text: 'Implementation evidence uploaded', user: 'A. Singh · Ops', time: '1h ago', color: '#3DD9AC' },
  { id: 'DEV-2038', text: 'Deviation investigation closed', user: 'J. Müller · QA', time: '3h ago', color: '#4B9FE1' },
];

export function SceneNotifications() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,  callback: () => setPhase(1) },
    { time: 1600, callback: () => setPhase(2) },
    { time: 3000, callback: () => setPhase(3) },
    { time: 5500, callback: () => setPhase(4) },
    { time: 8000, callback: () => setPhase(5) },
  ]);

  return (
    <motion.div className="absolute inset-0 px-[5vw] py-[4vh] flex flex-col" {...sceneTransitions.clipCircle}>
      {/* Header with bell */}
      <motion.div className="flex items-center justify-between mb-[2.5vh]"
        initial={{ opacity: 0, y: -24 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
        transition={{ duration: 0.9 }}
      >
        <div>
          <h2 className="text-[2.6vw] font-display font-bold text-white">
            Proactive <span className="text-[#F5A623]">Quality Alerts</span>
          </h2>
          <p className="text-[0.95vw] text-white/35 mt-1">
            The system surfaces what needs your attention - before it becomes a problem
          </p>
        </div>

        {/* Bell icon with badge */}
        <motion.div className="relative"
          initial={{ scale: 0 }} animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="w-[5vw] h-[5vw] bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <motion.div className="absolute -top-2 -right-2 w-6 h-6 bg-[#EF4444] rounded-full flex items-center justify-center text-white text-[0.6vw] font-bold"
            animate={phase >= 2 ? { scale: [1, 1.3, 1] } : {}}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            3
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="flex-1 flex gap-[2vw] min-h-0">
        {/* ACTION REQUIRED panel */}
        <div className="flex-1 flex flex-col">
          <motion.div className="flex items-center gap-3 mb-[1.5vh]"
            initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
            <p className="text-[0.9vw] font-semibold text-[#EF4444] uppercase tracking-widest">Action Required</p>
            <div className="px-2 py-0.5 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40">
              <span className="text-[0.72vw] text-[#EF4444] font-bold">{ACTION_ITEMS.length}</span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-[1.2vh]">
            {ACTION_ITEMS.map((item, i) => (
              <motion.div key={i}
                className="bg-white/5 border rounded-2xl px-[1.8vw] py-[1.8vh] backdrop-blur-sm"
                style={{ borderColor: `${item.color}40` }}
                initial={{ opacity: 0, x: -30 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ delay: i * 0.22, type: 'spring', stiffness: 220, damping: 24 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.78vw] font-mono font-bold px-2 py-0.5 rounded-md"
                      style={{ color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}35` }}>
                      {item.id}
                    </span>
                    <span className="text-[0.7vw] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
                      style={{ color: item.color, background: `${item.color}15` }}>
                      {item.urgency}
                    </span>
                  </div>
                  <span className="text-[0.72vw] text-white/35">{item.due}</span>
                </div>
                <p className="text-[1vw] text-white/85 font-medium mb-1">{item.action}</p>
                <p className="text-[0.78vw] text-white/38">{item.user}</p>

                {/* Action button placeholder */}
                <motion.div className="mt-3 flex gap-2"
                  initial={{ opacity: 0 }} animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                >
                  <div className="px-3 py-1 rounded-lg text-[0.72vw] font-semibold"
                    style={{ background: `${item.color}22`, color: item.color, border: `1px solid ${item.color}40` }}>
                    Review &amp; Sign Off
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY panel */}
        <div className="w-[38%] flex flex-col">
          <motion.div className="flex items-center gap-3 mb-[1.5vh]"
            initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#3DD9AC]" />
            <p className="text-[0.9vw] font-semibold text-[#3DD9AC] uppercase tracking-widest">Recent Activity</p>
          </motion.div>

          <div className="flex flex-col gap-[1vh] flex-1">
            {ACTIVITY_ITEMS.map((item, i) => (
              <motion.div key={i}
                className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl px-[1.5vw] py-[1.2vh] backdrop-blur-sm"
                initial={{ opacity: 0, x: 24 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
                transition={{ delay: i * 0.18, type: 'spring', stiffness: 220, damping: 26 }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.6vw]" style={{ background: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[0.72vw] font-mono text-white/45">{item.id}</span>
                  </div>
                  <p className="text-[0.88vw] text-white/80 leading-snug">{item.text}</p>
                  <p className="text-[0.72vw] text-white/32 mt-0.5">{item.user}</p>
                </div>
                <span className="text-[0.7vw] text-white/28 shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>

          {/* Insight callout */}
          <motion.div className="mt-[2vh] bg-[#3DD9AC]/8 border border-[#3DD9AC]/25 rounded-xl px-[1.5vw] py-[1.5vh]"
            initial={{ opacity: 0, y: 12 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 1 }}
          >
            <p className="text-[0.85vw] text-[#3DD9AC]/90 leading-snug">
              <span className="font-semibold">Never miss a deadline.</span> Capalyst automatically escalates overdue items and notifies the right people - no chasing required.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
