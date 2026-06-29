import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const BENEFITS = [
  { icon: '⚡', label: 'Deviations', desc: 'From event to closure with full QA sign-off' },
  { icon: '🎯', label: 'CAPA', desc: 'Corrective actions with built-in efficacy loops' },
  { icon: '🔒', label: 'Change Control', desc: 'Multi-reviewer approval chains, zero gaps' },
];

export function Scene7Close() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 700,   callback: () => setPhase(1) },
    { time: 2000,  callback: () => setPhase(2) },
    { time: 3600,  callback: () => setPhase(3) },
    { time: 5500,  callback: () => setPhase(4) },
    { time: 8500,  callback: () => setPhase(5) },
    { time: 14000, callback: () => setPhase(6) },
  ]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A1628] overflow-hidden"
      {...sceneTransitions.perspectiveFlip}
    >
      {/* Warm exit wash */}
      <motion.div
        className="absolute inset-0 z-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, #E8622A 0%, #F5A623 40%, transparent 100%)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 6 ? { opacity: 0.7 } : { opacity: 0 }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />
      {/* Background glow pulses */}
      <motion.div
        className="absolute w-[90vw] h-[90vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(75,159,225,0.08) 0%, transparent 70%)', top: '50%', left: '50%', x: '-50%', y: '-50%' }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pharma lab background - very subtle */}
      <motion.div
        className="absolute inset-0 opacity-0"
        animate={phase >= 1 ? { opacity: 0.12 } : { opacity: 0 }}
        transition={{ duration: 3 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/pharma-lab-bg.png`}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover mix-blend-screen"
          style={{ filter: 'blur(2px) brightness(0.6) saturate(1.2)' }}
        />
      </motion.div>

      <div className="relative z-10 text-center px-[8vw]">
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center gap-5 mb-5"
          initial={{ scale: 0.75, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.75, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          <div className="w-18 h-18 bg-gradient-to-tr from-[#4B9FE1] to-[#3DD9AC] rounded-xl shadow-2xl shadow-[#4B9FE1]/40"
            style={{ width: '4.5rem', height: '4.5rem' }} />
          <h1 className="text-[8vw] font-display font-bold tracking-tight">Capalyst</h1>
        </motion.div>

        {/* Primary tagline */}
        <motion.p
          className="text-[1.8vw] text-[#3DD9AC] font-medium tracking-wide mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          Built for regulated pharma. Designed for real QA teams.
        </motion.p>

        {/* Secondary tagline */}
        <motion.p
          className="text-[1.1vw] text-white/40 font-light tracking-wide mb-10"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          Where Quality Meets Compliance.
        </motion.p>

        {/* Divider */}
        <motion.div
          className="mx-auto h-px bg-gradient-to-r from-transparent via-[#3DD9AC]/40 to-transparent mb-10"
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: '70%' } : { width: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />

        {/* Three benefit cards */}
        <motion.div
          className="flex gap-[2vw] justify-center mb-12"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl px-[2vw] py-[2vh] text-left backdrop-blur-sm"
              style={{ minWidth: '16vw' }}
              initial={{ opacity: 0, y: 30 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: i * 0.2, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <div className="text-[1.6vw] mb-2">{b.icon}</div>
              <p className="text-[1vw] font-semibold text-white/90 mb-1">{b.label}</p>
              <p className="text-[0.8vw] text-white/40 leading-snug">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <motion.div
            className="px-10 py-4 bg-gradient-to-r from-[#4B9FE1] to-[#3DD9AC] rounded-2xl shadow-2xl shadow-[#4B9FE1]/25"
            animate={phase >= 4 ? { boxShadow: ['0 0 30px rgba(75,159,225,0.25)', '0 0 60px rgba(61,217,172,0.35)', '0 0 30px rgba(75,159,225,0.25)'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-[1.4vw] font-bold tracking-wide text-white">
              Request a Demo Today
            </p>
          </motion.div>
          <p className="text-[0.85vw] text-white/30 tracking-wider">
            Thank you - Kent Ah Goo
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
