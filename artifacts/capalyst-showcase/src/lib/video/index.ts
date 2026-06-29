// Video template library - hook and animation presets

export { useVideoPlayer, useSceneTimer, usePausablePhaseTimer } from './hooks';
export type { SceneDurations, UseVideoPlayerOptions, UseVideoPlayerReturn } from './hooks';

export { PlaybackContext, usePlaybackPaused } from './PlaybackContext';

export {
  springs,
  easings,
  sceneTransitions,
  elementAnimations,
  charVariants,
  charContainerVariants,
  staggerConfigs,
  containerVariants,
  itemVariants,
  staggerDelay,
  customSpring,
  withDelay,
} from './animations';
