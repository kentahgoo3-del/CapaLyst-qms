import { useState } from 'react';
import { usePausablePhaseTimer } from '@/lib/video';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const USERS = [
  { initials: 'SC', name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'QA', dept: 'Quality Assurance', status: 'active', roleColor: '#3DD9AC' },
  { initials: 'JM', name: 'Jonas Müller', email: 'j.muller@company.com', role: 'QA', dept: 'Quality Control', status: 'active', roleColor: '#3DD9AC' },
  { initials: 'AM', name: 'Ana Martínez', email: 'a.martinez@company.com', role: 'User', dept: 'Operations', status: 'active', roleColor: '#4B9FE1' },
  { initials: 'RC', name: 'Ravi Chen', email: 'r.chen@company.com', role: 'User', dept: 'Site Coordination', status: 'active', roleColor: '#4B9FE1' },
  { initials: 'AS', name: 'Aisha Singh', email: 'a.singh@company.com', role: 'User', dept: 'Manufacturing', status: 'active', roleColor: '#4B9FE1' },
];

const PERMISSIONS = [
  { action: 'Submit deviations', qa: true, user: true },
  { action: 'Close deviations', qa: true, user: false },
  { action: 'Approve CAPA', qa: true, user: false },
  { action: 'Sign off e-signatures', qa: true, user: false },
  { action: 'Manage change controls', qa: true, user: false },
  { action: 'View all records', qa: true, user: true },
  { action: 'Export reports', qa: true, user: false },
  { action: 'Admin: manage users', qa: false, user: false },
];

export function SceneUserAdmin() {
  const [phase, setPhase] = useState(0);

  usePausablePhaseTimer([
    { time: 500,  callback: () => setPhase(1) },
    { time: 1600, callback: () => setPhase(2) },
    { time: 3200, callback: () => setPhase(3) },
    { time: 6000, callback: () => setPhase(4) },
    { time: 9000, callback: () => setPhase(5) },
  ]);

  return (
    <motion.div className="absolute inset-0 px-[5vw] py-[4vh] flex flex-col" {...sceneTransitions.clipPolygon}>
      {/* Header */}
      <motion.div className="mb-[2vh]"
        initial={{ opacity: 0, y: -22 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -22 }}
        transition={{ duration: 0.9 }}
      >
        <h2 className="text-[2.6vw] font-display font-bold text-white">
          User Administration &amp; <span className="text-[#3DD9AC]">Access Control</span>
        </h2>
        <p className="text-[0.95vw] text-white/35 mt-1">
          Role-gated access ensures the right people have the right permissions - every time
        </p>
      </motion.div>

      <div className="flex-1 flex gap-[2vw] min-h-0">
        {/* LEFT - User table */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
          {/* Table header */}
          <motion.div className="flex items-center gap-4 px-[2vw] py-[1.2vh] border-b border-white/8 bg-white/3"
            initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-[0.72vw] text-white/35 uppercase tracking-widest w-[28%]">User</span>
            <span className="text-[0.72vw] text-white/35 uppercase tracking-widest flex-1">Department</span>
            <span className="text-[0.72vw] text-white/35 uppercase tracking-widest w-[15%] text-center">Role</span>
            <span className="text-[0.72vw] text-white/35 uppercase tracking-widest w-[12%] text-center">Status</span>
          </motion.div>

          {/* User rows */}
          <div className="flex flex-col flex-1 justify-around py-[1vh]">
            {USERS.map((user, i) => (
              <motion.div key={i}
                className="flex items-center gap-4 px-[2vw] py-[1vh] hover:bg-white/3 transition-colors border-b border-white/4 last:border-0"
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: i * 0.14, duration: 0.7 }}
              >
                {/* Avatar */}
                <div className="flex items-center gap-3 w-[28%] min-w-0">
                  <div className="w-[2.4vw] h-[2.4vw] rounded-full shrink-0 flex items-center justify-center text-[0.72vw] font-bold text-white"
                    style={{ background: `${user.roleColor}30`, border: `1.5px solid ${user.roleColor}50` }}>
                    {user.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.88vw] text-white/85 font-medium truncate">{user.name}</p>
                    <p className="text-[0.68vw] text-white/32 truncate">{user.email}</p>
                  </div>
                </div>
                <span className="text-[0.82vw] text-white/50 flex-1">{user.dept}</span>
                <div className="w-[15%] flex justify-center">
                  <span className="px-2.5 py-1 rounded-full text-[0.72vw] font-semibold"
                    style={{ color: user.roleColor, background: `${user.roleColor}18`, border: `1px solid ${user.roleColor}35` }}>
                    {user.role}
                  </span>
                </div>
                <div className="w-[12%] flex justify-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3DD9AC]" />
                    <span className="text-[0.7vw] text-white/40">Active</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add user button */}
          <motion.div className="px-[2vw] py-[1.5vh] border-t border-white/8"
            initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4B9FE1]/15 border border-[#4B9FE1]/35 cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B9FE1" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                <span className="text-[0.78vw] text-[#4B9FE1] font-medium">Add User</span>
              </div>
              <span className="text-[0.72vw] text-white/25">Invite by email · Assign role · Set permissions</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT - Permissions matrix */}
        <div className="w-[38%] flex flex-col gap-[1.5vw]">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-[1.8vw] backdrop-blur-sm flex-1">
            <p className="text-[0.78vw] text-white/35 uppercase tracking-widest mb-[1.5vh]">Role Permission Matrix</p>

            {/* Column headers */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="flex-1 text-[0.7vw] text-white/25">Action</span>
              <span className="w-[18%] text-center text-[0.72vw] text-[#3DD9AC]/70 font-semibold">QA</span>
              <span className="w-[18%] text-center text-[0.72vw] text-[#4B9FE1]/70 font-semibold">User</span>
            </div>

            <div className="space-y-[0.6vh]">
              {PERMISSIONS.map((perm, i) => (
                <motion.div key={i}
                  className="flex items-center gap-2 py-[0.4vh] border-b border-white/4 last:border-0"
                  initial={{ opacity: 0, x: 16 }}
                  animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                  transition={{ delay: i * 0.09, duration: 0.6 }}
                >
                  <span className="flex-1 text-[0.78vw] text-white/55">{perm.action}</span>
                  <div className="w-[18%] flex justify-center">
                    {perm.qa
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3DD9AC" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </div>
                  <div className="w-[18%] flex justify-center">
                    {perm.user
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B9FE1" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom callout */}
          <motion.div className="bg-[#3DD9AC]/8 border border-[#3DD9AC]/25 rounded-xl px-[1.5vw] py-[1.5vh]"
            initial={{ opacity: 0, y: 12 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 1 }}
          >
            <p className="text-[0.85vw] text-[#3DD9AC]/90 leading-snug">
              <span className="font-semibold">Principle of least privilege.</span> QA staff hold signing authority - standard users can only submit and view. No configuration needed.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
