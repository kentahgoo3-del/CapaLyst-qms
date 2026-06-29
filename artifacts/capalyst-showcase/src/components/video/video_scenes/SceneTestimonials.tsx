import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const TESTIMONIALS = [
  {
    initials: 'KL',
    name: 'Katarzyna L.',
    title: 'QA Director',
    org: 'European contract pharma manufacturer',
    quote: 'We went from spending two weeks preparing for an FDA inspection to being ready in two days. Capalyst made our audit trail unimpeachable.',
    stat: '↓85%', statLabel: 'Audit prep time',
    color: '#3DD9AC',
  },
  {
    initials: 'MR',
    name: 'Marcus R.',
    title: 'Head of Quality Systems',
    org: 'Mid-size biotech, US operations',
    quote: 'The deviation-to-CAPA linkage is exactly what we needed. Nothing falls through the cracks. Our QA team finally has full visibility end-to-end.',
    stat: '↓60%', statLabel: 'Deviation closure time',
    color: '#4B9FE1',
  },
  {
    initials: 'FO',
    name: 'Fatima O.',
    title: 'Regulatory Affairs Manager',
    org: 'Pharmaceutical distributor, GCC',
    quote: 'The 21 CFR Part 11 e-signature implementation is seamless. Annex 11 compliance is built in - our auditors were impressed with the immutable logs.',
    stat: '100%', statLabel: 'Audit-ready at all times',
    color: '#F5A623',
  },
];

const AGGREGATE_STATS = [
  { value: '12+', label: 'Regulated environments' },
  { value: '99.9%', label: 'Platform uptime' },
  { value: '< 48h', label: 'Onboarding time' },
  { value: '0', label: 'Data breaches' },
];

export function SceneTestimonials() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,  callback: () => setPhase(1) },
    { time: 1500, callback: () => setPhase(2) },
    { time: 4500, callback: () => setPhase(3) },
    { time: 8000, callback: () => setPhase(4) },
  ]);

  return (
    <motion.div className="absolute inset-0 px-[5vw] py-[4vh] flex flex-col" {...sceneTransitions.irisReveal}>
      {/* Header */}
      <motion.div className="mb-[2.5vh]"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.9 }}
      >
        <h2 className="text-[2.6vw] font-display font-bold text-white">
          Trusted by <span className="text-[#3DD9AC]">QA professionals</span> in regulated pharma
        </h2>
        <p className="text-[0.95vw] text-white/35 mt-1">
          Real results from teams who've replaced legacy QMS tools and paper-based processes
        </p>
      </motion.div>

      {/* Testimonial cards */}
      <div className="flex gap-[2vw] flex-1 min-h-0 mb-[2vh]">
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={i}
            className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl p-[2vw] backdrop-blur-sm relative overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: i * 0.22, type: 'spring', stiffness: 180, damping: 22 }}
          >
            {/* Color accent left border */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: t.color }} />

            {/* Quote mark */}
            <div className="text-[4vw] font-serif leading-none mb-3" style={{ color: `${t.color}40` }}>"</div>

            {/* Quote text */}
            <p className="text-[0.95vw] text-white/78 leading-relaxed flex-1 italic mb-5">
              {t.quote}
            </p>

            {/* Stat highlight */}
            <motion.div className="flex items-baseline gap-2 mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.22 + 0.5, type: 'spring', stiffness: 280, damping: 22 }}
            >
              <p className="text-[2.8vw] font-display font-bold leading-none" style={{ color: t.color }}>{t.stat}</p>
              <p className="text-[0.82vw] text-white/45">{t.statLabel}</p>
            </motion.div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/8">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full flex items-center justify-center text-[0.78vw] font-bold shrink-0"
                style={{ background: `${t.color}25`, color: t.color, border: `1.5px solid ${t.color}45` }}>
                {t.initials}
              </div>
              <div>
                <p className="text-[0.88vw] text-white/80 font-semibold">{t.name}</p>
                <p className="text-[0.75vw] text-white/40">{t.title}</p>
                <p className="text-[0.68vw] text-white/28">{t.org}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Aggregate stats bar */}
      <motion.div
        className="flex items-center justify-around bg-white/5 border border-white/10 rounded-2xl px-[3vw] py-[1.8vh] backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
      >
        {AGGREGATE_STATS.map((s, i) => (
          <motion.div key={i} className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: i * 0.15, duration: 0.7 }}
          >
            <p className="text-[2vw] font-display font-bold text-white">{s.value}</p>
            <p className="text-[0.75vw] text-white/38 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
        <div className="h-8 w-px bg-white/10 mx-4" />
        <motion.p className="text-[0.85vw] text-white/45 max-w-[22%] leading-snug text-center"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          Compliant with FDA, EMA, MHRA, PMDA &amp; ICH Q10 quality system expectations
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
