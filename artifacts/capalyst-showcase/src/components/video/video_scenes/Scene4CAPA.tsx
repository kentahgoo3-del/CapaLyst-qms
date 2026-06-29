import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const STEPS = [
  { name: 'Draft', color: '#4B9FE1', desc: 'Define corrective action' },
  { name: 'QA Review', color: '#4B9FE1', desc: 'Quality approval' },
  { name: 'Implement', color: '#F5A623', desc: 'Execute the plan' },
  { name: 'Efficacy Review', color: '#3DD9AC', desc: 'Verify effectiveness', highlight: true },
  { name: 'Closed', color: '#3DD9AC', desc: 'Sign-off complete' },
];

const SVG_HEIGHT = 300;
const STEP_Y = (i: number) => 35 + i * (SVG_HEIGHT / (STEPS.length - 1)) * 0.88;

export function Scene4CAPA() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,  callback: () => setPhase(1) },
    { time: 1800, callback: () => setPhase(2) },
    { time: 3200, callback: () => setPhase(3) },
    { time: 4800, callback: () => setPhase(4) },
    { time: 6500, callback: () => setPhase(5) },
  ]);

  return (
    <motion.div
      className="absolute inset-0 px-[5vw] py-[4vh] flex"
      {...sceneTransitions.panReveal}
    >
      {/* Left heading */}
      <div className="w-[30%] flex flex-col justify-center pr-[3vw] border-r border-white/10">
        <motion.h2
          className="text-[3.8vw] font-display font-bold text-[#F5A623] mb-4 leading-none"
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
        >
          CAPA
        </motion.h2>
        <motion.p
          className="text-[1.15vw] text-white/60 leading-relaxed mb-6"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          Corrective &amp; Preventive Actions - role-gated, e-signed at every step.
        </motion.p>

        {/* Stats */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.8 }}
        >
          {[
            { label: 'Linked to parent deviation', color: '#4B9FE1' },
            { label: 'Implementation evidence tracked', color: '#F5A623' },
            { label: 'Efficacy loop built-in', color: '#3DD9AC' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
              <p className="text-[0.85vw] text-white/50">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right: SVG workflow */}
      <div className="flex-1 pl-[4vw] flex items-center">
        <div className="w-full relative" style={{ height: `${SVG_HEIGHT + 60}px` }}>
          <svg
            viewBox={`0 0 520 ${SVG_HEIGHT + 30}`}
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            {/* Vertical spine segments */}
            {STEPS.slice(0, -1).map((_, i) => {
              const segLen = Math.abs((STEP_Y(i + 1) - 22) - (STEP_Y(i) + 22));
              return (
              <motion.line
                key={`line-${i}`}
                x1={60} y1={STEP_Y(i) + 22}
                x2={60} y2={STEP_Y(i + 1) - 22}
                stroke={STEPS[i + 1].color}
                strokeWidth="2"
                strokeDasharray="5 4"
                initial={{ strokeDashoffset: segLen, opacity: 0 }}
                animate={phase >= i + 2 ? { strokeDashoffset: 0, opacity: 1 } : { strokeDashoffset: segLen, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              );
            })}

            {/* Efficacy loop arrow */}
            <motion.path
              d={`M 82 ${STEP_Y(3)} C 220 ${STEP_Y(3)}, 220 ${STEP_Y(2)}, 82 ${STEP_Y(2)}`}
              fill="none"
              stroke="#3DD9AC"
              strokeWidth="2.5"
              strokeDasharray="400"
              initial={{ strokeDashoffset: 400, opacity: 0 }}
              animate={phase >= 5 ? { strokeDashoffset: 0, opacity: 0.85 } : { strokeDashoffset: 400, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
            <motion.text
              x="210" y={(STEP_Y(3) + STEP_Y(2)) / 2 + 5}
              fill="#3DD9AC" fontSize="12" textAnchor="middle"
              opacity={0}
              animate={phase >= 5 ? { opacity: 0.8 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              if not effective
            </motion.text>

            {/* Step nodes + labels */}
            {STEPS.map((step, i) => (
              <g key={i}>
                <motion.circle
                  cx={60} cy={STEP_Y(i)}
                  r={step.highlight ? 22 : 17}
                  fill={step.highlight ? step.color : '#0A1628'}
                  stroke={step.color} strokeWidth="2.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={phase >= i + 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                  style={{ transformOrigin: `${60}px ${STEP_Y(i)}px` }}
                />
                {step.highlight && (
                  <motion.circle
                    cx={60} cy={STEP_Y(i)} r={30}
                    fill="none" stroke={step.color} strokeWidth="1" opacity={0.3}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={phase >= i + 1 ? { scale: 1, opacity: 0.3 } : { scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                    style={{ transformOrigin: `${60}px ${STEP_Y(i)}px` }}
                  />
                )}
                <motion.g
                  initial={{ opacity: 0, x: 12 }}
                  animate={phase >= i + 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  <text x={100} y={STEP_Y(i) - 4}
                    fill={step.highlight ? '#3DD9AC' : 'rgba(255,255,255,0.9)'}
                    fontSize="16" fontWeight={step.highlight ? '700' : '600'} fontFamily="inherit">
                    {step.name}
                  </text>
                  <text x={100} y={STEP_Y(i) + 14}
                    fill="rgba(255,255,255,0.38)" fontSize="12" fontFamily="inherit">
                    {step.desc}
                  </text>
                </motion.g>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
