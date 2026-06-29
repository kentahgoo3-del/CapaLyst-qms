import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const STAGES = [
  { name: 'Draft', color: '#4B9FE1', desc: 'Recorded' },
  { name: 'Submitted', color: '#4B9FE1', desc: 'Under review' },
  { name: 'Area Review', color: '#3DD9AC', desc: 'Site sign-off' },
  { name: 'QA Accepted', color: '#3DD9AC', desc: 'QA gate' },
  { name: 'Investigation', color: '#F5A623', desc: 'Root cause' },
  { name: 'Root Cause', color: '#F5A623', desc: 'Analysis' },
  { name: 'Completed', color: '#3DD9AC', desc: 'Closed' },
];

const NODE_X = [50, 170, 290, 410, 530, 650, 770];
const NODE_Y = 80;
const ARROW_Y = NODE_Y;

export function Scene3Deviations() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,  callback: () => setPhase(1) },
    { time: 1400, callback: () => setPhase(2) },
    { time: 2300, callback: () => setPhase(3) },
    { time: 3200, callback: () => setPhase(4) },
    { time: 4100, callback: () => setPhase(5) },
    { time: 5000, callback: () => setPhase(6) },
    { time: 6000, callback: () => setPhase(7) },
  ]);

  return (
    <motion.div
      className="absolute inset-0 px-[5vw] py-[5vh] flex flex-col"
      {...sceneTransitions.diagonalWipe}
    >
      <motion.h2
        className="text-[2.6vw] font-display font-semibold mb-[1.5vh] text-center text-[#4B9FE1]"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        Deviation Lifecycle
      </motion.h2>

      <motion.p
        className="text-center text-[1vw] text-white/35 mb-[3vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.4 }}
      >
        Sequential, gate-controlled - no stage can be skipped
      </motion.p>

      {/* SVG flowchart */}
      <div className="flex-1 w-full relative">
        <svg viewBox="0 0 820 210" className="w-full" style={{ overflow: 'visible' }}>
          {/* Background track */}
          <line x1={NODE_X[0]} y1={ARROW_Y} x2={NODE_X[6]} y2={ARROW_Y}
            stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

          {/* Animated connecting lines */}
          {NODE_X.slice(0, -1).map((x, i) => {
            const lineLength = NODE_X[i + 1] - 24 - (x + 24);
            return (
              <motion.line
                key={i}
                x1={x + 24}
                y1={ARROW_Y}
                x2={NODE_X[i + 1] - 24}
                y2={ARROW_Y}
                stroke={STAGES[i + 1].color}
                strokeWidth="2.5"
                strokeDasharray={lineLength}
                initial={{ strokeDashoffset: lineLength, opacity: 0 }}
                animate={phase >= i + 2 ? { strokeDashoffset: 0, opacity: 1 } : { strokeDashoffset: lineLength, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            );
          })}

          {/* Arrowheads */}
          {NODE_X.slice(0, -1).map((_, i) => (
            <motion.polygon
              key={`arrow-${i}`}
              points={`${NODE_X[i + 1] - 26},${ARROW_Y - 6} ${NODE_X[i + 1] - 26},${ARROW_Y + 6} ${NODE_X[i + 1] - 14},${ARROW_Y}`}
              fill={STAGES[i + 1].color}
              initial={{ opacity: 0 }}
              animate={phase >= i + 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            />
          ))}

          {/* Stage nodes */}
          {STAGES.map((stage, i) => (
            <motion.g
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={phase >= i + 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              style={{ transformOrigin: `${NODE_X[i]}px ${NODE_Y}px` }}
            >
              <circle cx={NODE_X[i]} cy={NODE_Y} r="24" fill="#0A1628"
                stroke={stage.color} strokeWidth="2.5" />
              <circle cx={NODE_X[i]} cy={NODE_Y} r="11" fill={stage.color} opacity={0.85} />
            </motion.g>
          ))}

          {/* Stage descriptions (below nodes) */}
          {STAGES.map((stage, i) => (
            <motion.text
              key={`desc-${i}`}
              x={NODE_X[i]}
              y={NODE_Y + 46}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="10"
              fontFamily="inherit"
              initial={{ opacity: 0 }}
              animate={phase >= i + 1 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {stage.desc}
            </motion.text>
          ))}
        </svg>

        {/* Labels below */}
        <div className="flex justify-between w-full mt-[0.5vh]">
          {STAGES.map((stage, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center"
              style={{ width: `${100 / STAGES.length}%` }}
              initial={{ opacity: 0, y: 14 }}
              animate={phase >= i + 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="text-[1vw] font-semibold text-center leading-tight"
                style={{ color: stage.color }}>
                {stage.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div
          className="mt-[4vh] flex items-center justify-center gap-8"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.9 }}
        >
          {['E-signature at every gate', 'Full audit trail', 'Role-gated access'].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3DD9AC]" />
              <span className="text-[0.9vw] text-white/50">{t}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
