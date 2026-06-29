import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const AUDIT_ROWS = [
  { action: 'DEV-2041 QA sign-off', user: 'J. Müller · QA Lead', time: '14:22:08', hash: 'a3f9c…d12', color: '#3DD9AC', sig: true },
  { action: 'CAPA-089 efficacy confirmed', user: 'S. Chen · QA Director', time: '13:41:55', hash: 'b8e1d…7ac', color: '#3DD9AC', sig: true },
  { action: 'CC-017 approved', user: 'R. Chen · SC Review', time: '11:07:30', hash: 'f2a4b…3e8', color: '#4B9FE1', sig: true },
  { action: 'DEV-2039 investigation submitted', user: 'A. Singh · Ops', time: '09:55:14', hash: 'c7d2e…91f', color: '#4B9FE1', sig: false },
  { action: 'CC-016 change implemented', user: 'K. Lim · Mfg', time: '08:30:02', hash: 'd9f3a…55c', color: '#4B9FE1', sig: false },
  { action: 'DEV-2038 escalated (overdue)', user: 'System · Auto-escalate', time: '07:15:00', hash: 'e1b7c…28d', color: '#F5A623', sig: false },
];

const REGS = [
  { label: '21 CFR Part 11', desc: 'FDA electronic records & signatures', color: '#3DD9AC' },
  { label: 'Annex 11', desc: 'EU GMP computerised systems', color: '#4B9FE1' },
  { label: 'ICH Q10', desc: 'Pharmaceutical quality system', color: '#F5A623' },
  { label: 'ISO 13485', desc: 'Medical device quality management', color: '#3DD9AC' },
];

const BULLETS = [
  { text: 'Every action e-signed by the responsible person - no proxy, no backdating', color: '#3DD9AC' },
  { text: 'Immutable audit trail - tamper-evident, cryptographically hashed entries', color: '#4B9FE1' },
  { text: 'Full traceability: who did what, when, from which role, and why', color: '#3DD9AC' },
  { text: 'System-generated escalations logged as automatic entries - nothing hidden', color: '#F5A623' },
  { text: 'Export audit trail as PDF or CSV for inspectors in one click', color: '#4B9FE1' },
];

export function Scene6Compliance() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,  callback: () => setPhase(1) },  // padlock + title
    { time: 1800, callback: () => setPhase(2) },  // timeline bar + first bullets
    { time: 3400, callback: () => setPhase(3) },  // audit trail rows stagger in
    { time: 6200, callback: () => setPhase(4) },  // e-sig indicator column
    { time: 8500, callback: () => setPhase(5) },  // regulatory badges
    { time: 10800, callback: () => setPhase(6) }, // inspection-ready callout
  ]);

  return (
    <motion.div
      className="absolute inset-0 flex"
      {...sceneTransitions.splitHorizontal}
    >
      {/* Clinical environment background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/clinical-env-bg.png`}
          alt="" aria-hidden="true"
          className="w-full h-full object-cover"
          style={{ filter: 'blur(4px) brightness(0.18) saturate(1.2)' }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 3.5, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/particle-texture.png`}
          alt="" aria-hidden="true"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* LEFT - Audit trail */}
      <div className="w-[50%] h-full flex flex-col justify-center px-[4vw] py-[3vh]">
        <motion.p className="text-white/30 text-[0.72vw] uppercase tracking-widest mb-[1.5vh]"
          initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          Live Audit Trail - Today
        </motion.p>

        {/* Timeline bar */}
        <div className="relative mb-[2.5vh]">
          <div className="h-[2px] bg-white/8 w-full rounded-full" />
          <motion.div
            className="absolute top-0 left-0 h-[2px] rounded-full"
            style={{ background: 'linear-gradient(to right, #4B9FE1, #3DD9AC)' }}
            initial={{ width: 0 }}
            animate={phase >= 2 ? { width: '100%' } : { width: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />
          <div className="absolute top-0 left-0 w-full flex justify-between" style={{ transform: 'translateY(-50%)' }}>
            {AUDIT_ROWS.map((_, i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full"
                style={{ background: AUDIT_ROWS[i].color }}
                initial={{ scale: 0 }}
                animate={phase >= 2 ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.15 * i + 0.3, type: 'spring', stiffness: 380, damping: 18 }}
              />
            ))}
          </div>
        </div>

        {/* Audit rows */}
        <div className="flex flex-col gap-[0.9vh] flex-1 justify-center">
          {/* Column headers */}
          <motion.div className="flex items-center gap-3 px-3 mb-1"
            initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="flex-1 text-[0.65vw] text-white/22 uppercase tracking-widest">Action</span>
            <span className="w-[30%] text-[0.65vw] text-white/22 uppercase tracking-widest">User / Role</span>
            <span className="w-[14%] text-[0.65vw] text-white/22 uppercase tracking-widest text-right">Time</span>
            <span className="w-[6%] text-center text-[0.65vw] text-white/22 uppercase tracking-widest">Sig</span>
          </motion.div>

          {AUDIT_ROWS.map((row, i) => (
            <motion.div key={i}
              className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-3 py-[1vh]"
              initial={{ opacity: 0, x: -20 }}
              animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: i * 0.16, duration: 0.65 }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />
                <div className="min-w-0">
                  <p className="text-[0.82vw] text-white/82 truncate">{row.action}</p>
                  <p className="text-[0.65vw] text-white/28 font-mono">{row.hash}</p>
                </div>
              </div>
              <p className="text-[0.72vw] text-white/40 w-[30%] truncate">{row.user}</p>
              <p className="text-[0.68vw] text-white/28 font-mono w-[14%] text-right">{row.time}</p>
              <div className="w-[6%] flex justify-center">
                <motion.div
                  initial={{ scale: 0 }} animate={phase >= 4 ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: i * 0.08 + 0.2, type: 'spring', stiffness: 340 }}
                >
                  {row.sig
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3DD9AC" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }
                </motion.div>
              </div>
            </motion.div>
          ))}

          {/* Export hint */}
          <motion.div className="flex items-center gap-2 mt-1 px-2"
            initial={{ opacity: 0 }} animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B9FE1" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <p className="text-[0.7vw] text-[#4B9FE1]/70">Export full trail as PDF or CSV for inspector review</p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT - Compliance detail */}
      <div className="flex-1 pr-[4vw] pl-[2vw] flex flex-col justify-center py-[3vh]">
        {/* Padlock + heading */}
        <div className="flex items-start gap-4 mb-[2.5vh]">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14 }}
            className="shrink-0 mt-1"
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#3DD9AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <motion.rect x="3" y="11" width="18" height="11" rx="2"
                initial={{ pathLength: 0 }} animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.9 }}
              />
              <motion.path d="M7 11V7a5 5 0 0 1 10 0v4"
                initial={{ pathLength: 0 }} animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.9, delay: 0.4 }}
              />
            </svg>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            <h2 className="text-[2.8vw] font-display font-bold leading-tight">
              Every action.<br />
              <span className="text-white/40">Signed. Logged. Traceable.</span>
            </h2>
            <p className="text-[0.88vw] text-white/35 mt-2 leading-snug">
              Built for FDA inspections, EMA audits, and internal quality reviews - from day one.
            </p>
          </motion.div>
        </div>

        {/* Bullet points */}
        <div className="flex flex-col gap-[1.2vh] mb-[2.5vh]">
          {BULLETS.map((item, i) => (
            <motion.div key={i}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ delay: i * 0.2, duration: 0.7 }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.55vw]" style={{ background: item.color }} />
              <p className="text-[0.9vw] text-white/70 leading-snug">{item.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Regulatory framework grid */}
        <motion.p className="text-[0.68vw] text-white/25 uppercase tracking-widest mb-[1.2vh]"
          initial={{ opacity: 0 }} animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Regulatory frameworks supported
        </motion.p>
        <div className="grid grid-cols-2 gap-[1vh] mb-[2vh]">
          {REGS.map((reg, i) => (
            <motion.div key={i}
              className="flex items-start gap-2.5 bg-white/4 border rounded-xl px-3 py-[1.2vh]"
              style={{ borderColor: `${reg.color}30` }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
              transition={{ delay: i * 0.14, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.45vw]" style={{ background: reg.color }} />
              <div>
                <p className="text-[0.82vw] font-semibold" style={{ color: reg.color }}>{reg.label}</p>
                <p className="text-[0.68vw] text-white/35">{reg.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Inspection-ready callout */}
        <motion.div
          className="bg-[#3DD9AC]/10 border border-[#3DD9AC]/30 rounded-xl px-[1.5vw] py-[1.5vh]"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1 }}
        >
          <p className="text-[0.88vw] text-[#3DD9AC]/90 leading-snug">
            <span className="font-semibold">Inspection ready at all times.</span> When an auditor arrives, open the audit trail - every decision is there, signed, timestamped, and unalterable.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
