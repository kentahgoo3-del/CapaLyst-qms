import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { PlaybackContext } from '@/lib/video/PlaybackContext';

import { Scene1Open } from './video_scenes/Scene1Open';
import { SceneBenefits } from './video_scenes/SceneBenefits';
import { Scene2Dashboard } from './video_scenes/Scene2Dashboard';
import { SceneNotifications } from './video_scenes/SceneNotifications';
import { Scene3Deviations } from './video_scenes/Scene3Deviations';
import { Scene4CAPA } from './video_scenes/Scene4CAPA';
import { Scene5ChangeControl } from './video_scenes/Scene5ChangeControl';
import { SceneUserAdmin } from './video_scenes/SceneUserAdmin';
import { SceneAnalytics } from './video_scenes/SceneAnalytics';
import { Scene6Compliance } from './video_scenes/Scene6Compliance';
import { Scene7Close } from './video_scenes/Scene7Close';

export const SCENE_DURATIONS: Record<string, number> = {
  open: 16000,
  benefits: 13000,
  dashboard: 13000,
  notifications: 12000,
  deviations: 13000,
  capa: 13000,
  changeControl: 13000,
  userAdmin: 12000,
  analytics: 13000,
  compliance: 15000,
  close: 16000,
};

const SCENE_LABELS: Record<string, string> = {
  open: 'Intro',
  benefits: 'Benefits',
  dashboard: 'Dashboard',
  notifications: 'Alerts',
  deviations: 'Deviations',
  capa: 'CAPA',
  changeControl: 'Change Control',
  userAdmin: 'User Admin',
  analytics: 'Analytics',
  compliance: 'Compliance',
  close: 'Close',
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1Open,
  benefits: SceneBenefits,
  dashboard: Scene2Dashboard,
  notifications: SceneNotifications,
  deviations: Scene3Deviations,
  capa: Scene4CAPA,
  changeControl: Scene5ChangeControl,
  userAdmin: SceneUserAdmin,
  analytics: SceneAnalytics,
  compliance: Scene6Compliance,
  close: Scene7Close,
};

const SCENE_KEYS = Object.keys(SCENE_DURATIONS);

const SCENE_TINTS: Record<string, string> = {
  open:          'rgba(10, 22, 40, 0)',
  benefits:      'rgba(30, 58, 138, 0.12)',
  dashboard:     'rgba(37, 99, 235, 0.14)',
  notifications: 'rgba(217, 119, 6, 0.13)',
  deviations:    'rgba(185, 28, 28, 0.13)',
  capa:          'rgba(180, 83, 9, 0.14)',
  changeControl: 'rgba(13, 148, 136, 0.14)',
  userAdmin:     'rgba(109, 40, 217, 0.14)',
  analytics:     'rgba(6, 95, 170, 0.15)',
  compliance:    'rgba(21, 128, 61, 0.14)',
  close:         'rgba(10, 22, 40, 0)',
};

const SCENE_ACCENT_COLORS: Record<string, string> = {
  open:          '#3DD9AC',
  benefits:      '#3B82F6',
  dashboard:     '#2563EB',
  notifications: '#F59E0B',
  deviations:    '#EF4444',
  capa:          '#F97316',
  changeControl: '#14B8A6',
  userAdmin:     '#8B5CF6',
  analytics:     '#0EA5E9',
  compliance:    '#22C55E',
  close:         '#4B9FE1',
};

const persistentAccentLineStates = [
  { left: '20%', width: '60%', top: '50%', rotate: -15, opacity: 0.8 },
  { left: '10%', width: '80%', top: '20%', rotate: 0, opacity: 0.4 },
  { left: '-10%', width: '120%', top: '80%', rotate: -5, opacity: 0.5 },
  { left: '30%', width: '40%', top: '15%', rotate: 0, opacity: 0.7 },
  { left: '50%', width: '50%', top: '85%', rotate: -10, opacity: 0.6 },
  { left: '0%', width: '100%', top: '90%', rotate: 0, opacity: 0.3 },
  { left: '40%', width: '20%', top: '60%', rotate: -45, opacity: 0.9 },
  { left: '15%', width: '70%', top: '35%', rotate: -8, opacity: 0.5 },
  { left: '60%', width: '40%', top: '70%', rotate: -20, opacity: 0.7 },
  { left: '25%', width: '55%', top: '25%', rotate: 5, opacity: 0.4 },
  { left: '5%', width: '90%', top: '55%', rotate: -3, opacity: 0.6 },
  { left: '35%', width: '30%', top: '80%', rotate: -30, opacity: 0.8 },
];

const persistentShapeStates = [
  { x: '80vw', y: '20vh', scale: 1, rotate: 0, opacity: 0.2 },
  { x: '10vw', y: '80vh', scale: 1.5, rotate: 45, opacity: 0.15 },
  { x: '50vw', y: '10vh', scale: 0.8, rotate: 90, opacity: 0.3 },
  { x: '85vw', y: '75vh', scale: 1.2, rotate: 135, opacity: 0.2 },
  { x: '15vw', y: '25vh', scale: 1.4, rotate: 180, opacity: 0.25 },
  { x: '75vw', y: '50vh', scale: 0.9, rotate: 225, opacity: 0.1 },
  { x: '50vw', y: '50vh', scale: 2, rotate: 270, opacity: 0.05 },
  { x: '30vw', y: '65vh', scale: 1.1, rotate: 315, opacity: 0.18 },
  { x: '65vw', y: '30vh', scale: 0.7, rotate: 20, opacity: 0.22 },
  { x: '20vw', y: '45vh', scale: 1.3, rotate: 60, opacity: 0.16 },
  { x: '90vw', y: '60vh', scale: 0.8, rotate: 100, opacity: 0.12 },
  { x: '45vw', y: '85vh', scale: 1, rotate: 200, opacity: 0.2 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey, paused, togglePause, seekTo, restart } = useVideoPlayer({ durations, loop });
  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const dynamicSceneKeys = Object.keys(durations);
  const sceneIndex = dynamicSceneKeys.indexOf(currentSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];
  const accentColor = SCENE_ACCENT_COLORS[baseSceneKey] ?? '#3DD9AC';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A1628] font-body text-white">
      {/* Global background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(75, 159, 225, 0.15), transparent 70%)' }}
          animate={{ x: ['-20%', '10%', '-20%'], y: ['-10%', '20%', '-10%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full blur-[100px] right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, rgba(61, 217, 172, 0.1), transparent 70%)' }}
          animate={{ x: ['20%', '-10%', '20%'], y: ['20%', '-20%', '20%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwaC00MHY0MGg0MHpNMSAxSDM5VjM5SDF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz4KPC9zdmc+')] opacity-50" />
        {/* Scene tint overlay */}
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundColor: SCENE_TINTS[baseSceneKey] ?? 'rgba(10,22,40,0)' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </div>

      {/* Persistent midground shapes */}
      <motion.div
        className="absolute h-[2px] z-10"
        style={{ background: 'linear-gradient(to right, transparent, var(--via-color), transparent)' }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        animate={{
          ...persistentAccentLineStates[sceneIndex % persistentAccentLineStates.length],
          '--via-color': accentColor,
        } as any}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute w-32 h-32 rounded-full z-10 flex items-center justify-center"
        style={{ border: '1px solid' }}
        animate={{
          ...persistentShapeStates[sceneIndex % persistentShapeStates.length],
          borderColor: `${accentColor}33`,
        }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-16 h-16 rounded-full"
          style={{ border: '1px solid' }}
          animate={{ borderColor: `${accentColor}33` }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Scene Content */}
      <div className="relative z-20 w-full h-full">
        <PlaybackContext.Provider value={paused}>
          <AnimatePresence mode="popLayout">
            {SceneComponent && <SceneComponent key={currentSceneKey} />}
          </AnimatePresence>
        </PlaybackContext.Provider>
      </div>

      {/* ── Persistent scene progress indicator + playback controls ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pb-3 pt-6"
        style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.7) 0%, transparent 100%)' }}
      >
        {/* Scene label */}
        <motion.p
          key={baseSceneKey}
          className="text-[0.65vw] text-white/30 uppercase tracking-widest mb-2 font-medium pointer-events-none"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {SCENE_LABELS[baseSceneKey] ?? ''}
        </motion.p>

        {/* Controls row: restart · dot strip · pause/play */}
        <div className="flex items-center gap-3">
          {/* Restart button */}
          <button
            onClick={restart}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Restart showcase"
          >
            <svg className="w-2.5 h-2.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Dot + pill progress strip */}
          <div className="flex items-center gap-1.5">
            {dynamicSceneKeys.map((key, i) => {
              const isActive = i === sceneIndex;
              const isPast = i < sceneIndex;
              const cleanKey = key.replace(/_r[12]$/, '');
              return (
                <motion.button
                  key={key}
                  className="rounded-full cursor-pointer focus:outline-none"
                  title={SCENE_LABELS[cleanKey] ?? cleanKey}
                  onClick={() => seekTo(i)}
                  animate={{
                    width: isActive ? 28 : 6,
                    height: 6,
                    opacity: isActive ? 1 : isPast ? 0.55 : 0.25,
                    backgroundColor: isActive ? '#3DD9AC' : isPast ? '#4B9FE1' : 'rgba(255,255,255,0.5)',
                  }}
                  whileHover={{ opacity: 1, scale: 1.3 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
          </div>

          {/* Pause / Play button */}
          <button
            onClick={togglePause}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? (
              <svg className="w-2.5 h-2.5 text-[#3DD9AC]/70" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </button>
        </div>

        {/* Scene counter */}
        <p className="text-[0.6vw] text-white/20 mt-1.5 font-mono tabular-nums pointer-events-none">
          {sceneIndex + 1} / {SCENE_KEYS.length}
        </p>
      </div>
    </div>
  );
}
