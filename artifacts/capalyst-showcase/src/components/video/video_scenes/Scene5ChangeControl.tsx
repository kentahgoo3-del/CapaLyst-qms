import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const REVIEWERS = [
  { title: 'HR Review', abbr: 'HR', color: '#4B9FE1', desc: 'Human Resources approval' },
  { title: 'SC Review', abbr: 'SC', color: '#4B9FE1', desc: 'Site Coordinator sign-off' },
  { title: 'Expert Review', abbr: 'EX', color: '#4B9FE1', desc: 'Domain expert assessment' },
];

export function Scene5ChangeControl() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 600,  callback: () => setPhase(1) },
    { time: 1800, callback: () => setPhase(2) },
    { time: 3200, callback: () => setPhase(3) },
    { time: 5200, callback: () => setPhase(4) },
    { time: 7000, callback: () => setPhase(5) },
  ]);

  return (
    <motion.div
      className="absolute inset-0 px-[5vw] py-[4vh] flex flex-col"
      {...sceneTransitions.zoomThrough}
    >
      <motion.h2
        className="text-[2.6vw] font-display font-semibold mb-[1vh] text-center"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        Change Control{' '}
        <span className="text-[#4B9FE1] font-light">Parallel Pipeline</span>
      </motion.h2>

      <motion.p
        className="text-center text-[0.95vw] text-white/35 mb-[2vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        Every reviewer acts simultaneously - no bottlenecks in the approval chain
      </motion.p>

      <div className="flex-1 flex items-center justify-center gap-[2.5vw]">
        {/* Change Request origin node */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div className="w-[7.5vw] h-[7.5vw] bg-[#11223D] border-2 border-[#4B9FE1]/50 rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-[#4B9FE1]/10">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#4B9FE1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span className="text-[0.85vw] text-white/60 text-center leading-tight">Change<br />Request</span>
        </motion.div>

        {/* Fan-out arrows */}
        <div className="flex flex-col justify-between" style={{ height: '22vh', width: '3.5vw' }}>
          <svg className="w-full h-full" viewBox="0 0 50 180" preserveAspectRatio="none">
            {[0, 90, 180].map((endY, i) => (
              <motion.path
                key={i}
                d={`M 0 90 C 25 90, 25 ${endY}, 50 ${endY}`}
                fill="none"
                stroke="#4B9FE1"
                strokeWidth="2"
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            ))}
          </svg>
        </div>

        {/* Three reviewer columns */}
        <div className="flex flex-col gap-[1.8vh] justify-center">
          {REVIEWERS.map((rev, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 bg-white/5 border border-[#4B9FE1]/25 rounded-xl px-[1.5vw] py-[1.2vh]"
              style={{ minWidth: '16vw' }}
              initial={{ opacity: 0, x: 24 }}
              animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
              transition={{ delay: i * 0.18, type: 'spring', stiffness: 280, damping: 26 }}
            >
              <div
                className="w-[2.8vw] h-[2.8vw] rounded-full flex items-center justify-center font-bold text-[0.85vw] shrink-0"
                style={{ background: `${rev.color}22`, color: rev.color, border: `1.5px solid ${rev.color}55` }}
              >
                {rev.abbr}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.95vw] font-semibold text-white/90">{rev.title}</p>
                <p className="text-[0.78vw] text-white/35 truncate">{rev.desc}</p>
                <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#3DD9AC] rounded-full"
                    initial={{ width: 0 }}
                    animate={phase >= 4 ? { width: '100%' } : { width: 0 }}
                    transition={{ delay: i * 0.18 + 0.4, duration: 1.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fan-in arrows */}
        <div className="flex flex-col justify-between" style={{ height: '22vh', width: '3.5vw' }}>
          <svg className="w-full h-full" viewBox="0 0 50 180" preserveAspectRatio="none">
            {[0, 90, 180].map((startY, i) => (
              <motion.path
                key={i}
                d={`M 0 ${startY} C 25 ${startY}, 25 90, 50 90`}
                fill="none"
                stroke="#3DD9AC"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={phase >= 4 ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            ))}
          </svg>
        </div>

        {/* Works Plan convergence node */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={phase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div className="w-[7.5vw] h-[7.5vw] bg-[#3DD9AC]/15 border-2 border-[#3DD9AC]/60 rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-[#3DD9AC]/10">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3DD9AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-[0.85vw] text-[#3DD9AC]/80 text-center leading-tight">Works<br />Plan</span>
        </motion.div>

        {/* Arrow to Closure */}
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={phase >= 5 ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ originX: 0 }}
        >
          <div className="w-[3vw] h-[2px] bg-[#3DD9AC]" />
          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[9px] border-transparent border-l-[#3DD9AC]" />
        </motion.div>

        {/* Closure node */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.15 }}
        >
          <div className="w-[7.5vw] h-[7.5vw] bg-[#F5A623]/10 border-2 border-[#F5A623]/50 rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-[#F5A623]/10">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="text-[0.85vw] text-[#F5A623]/80 text-center leading-tight">Closure</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
