// Video player hook - handles recording lifecycle, scene advancement, and looping

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlaybackPaused } from './PlaybackContext';

declare global {
  interface Window {
    startRecording?: () => Promise<void>;
    stopRecording?: () => void;
  }
}

export interface SceneDurations {
  [key: string]: number;
}

export interface UseVideoPlayerOptions {
  durations: SceneDurations;
  onVideoEnd?: () => void;
  loop?: boolean;
}

export interface UseVideoPlayerReturn {
  currentScene: number;
  totalScenes: number;
  currentSceneKey: string;
  hasEnded: boolean;
  paused: boolean;
  pause: () => void;
  play: () => void;
  togglePause: () => void;
  seekTo: (sceneIndex: number) => void;
  restart: () => void;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { durations, onVideoEnd, loop = true } = options;

  // Captured once on mount -- durations must be a static object
  const sceneKeys = useRef(Object.keys(durations)).current;
  const totalScenes = sceneKeys.length;
  const durationsArray = useRef(Object.values(durations)).current;

  const [currentScene, setCurrentScene] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [paused, setPaused] = useState(false);

  // When non-null, the next timer should use this value instead of the full scene duration.
  // Only written by pause(); cleared on scene advance, seek, or restart.
  const remainingRef = useRef<number | null>(null);

  // Tracks when the current timer epoch started — used by pause() to compute remaining time.
  const timerStartRef = useRef<number>(Date.now());

  // Keep a ref to currentScene so callbacks have a stable capture.
  const currentSceneRef = useRef(currentScene);
  useEffect(() => { currentSceneRef.current = currentScene; }, [currentScene]);

  // Pause: imperatively capture remaining time before halting the effect.
  const pause = useCallback(() => {
    const fullDuration = durationsArray[currentSceneRef.current];
    const scheduledDuration = remainingRef.current !== null ? remainingRef.current : fullDuration;
    const elapsed = Date.now() - timerStartRef.current;
    remainingRef.current = Math.max(0, scheduledDuration - elapsed);
    setPaused(true);
  }, [durationsArray]);

  const play = useCallback(() => {
    // remainingRef already holds the leftover time set by pause()
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    // Read current paused value from a ref so the callback is stable
    setPaused(prev => {
      if (!prev) {
        // Transitioning to paused — capture remaining time now
        const fullDuration = durationsArray[currentSceneRef.current];
        const scheduledDuration = remainingRef.current !== null ? remainingRef.current : fullDuration;
        const elapsed = Date.now() - timerStartRef.current;
        remainingRef.current = Math.max(0, scheduledDuration - elapsed);
      }
      return !prev;
    });
  }, [durationsArray]);

  const seekTo = useCallback((sceneIndex: number) => {
    const clamped = Math.max(0, Math.min(totalScenes - 1, sceneIndex));
    remainingRef.current = null;
    setHasEnded(false);
    setCurrentScene(clamped);
    setPaused(false);
  }, [totalScenes]);

  const restart = useCallback(() => {
    remainingRef.current = null;
    setHasEnded(false);
    setCurrentScene(0);
    setPaused(false);
  }, []);

  // Start recording on mount
  useEffect(() => {
    window.startRecording?.();
  }, []);

  // Scene advancement -- loops independently of recording
  useEffect(() => {
    if (paused) return;
    if (hasEnded && !loop) return;

    const duration =
      remainingRef.current !== null
        ? remainingRef.current
        : durationsArray[currentScene];

    // Record when this timer epoch starts so pause() can compute elapsed time.
    timerStartRef.current = Date.now();

    const timer = setTimeout(() => {
      // Clear remaining so the next scene uses its full duration.
      remainingRef.current = null;

      // Last scene just finished playing
      if (currentScene >= totalScenes - 1) {
        if (!hasEnded) {
          window.stopRecording?.();
          setHasEnded(true);
          onVideoEnd?.();
        }
        if (loop) {
          setCurrentScene(0);
        }
      } else {
        setCurrentScene(prev => prev + 1);
      }
    }, duration);

    // Cleanup only cancels the timer; remaining time is captured imperatively by pause().
    return () => clearTimeout(timer);
  }, [currentScene, totalScenes, durationsArray, hasEnded, loop, onVideoEnd, paused]);

  return {
    currentScene,
    totalScenes,
    currentSceneKey: sceneKeys[currentScene],
    hasEnded,
    paused,
    pause,
    play,
    togglePause,
    seekTo,
    restart,
  };
}

/**
 * Pause-aware phase timer for scene components.
 * Drop-in replacement for the raw `useEffect(() => { const timers = [...]; ... }, [])` pattern.
 * Reads `paused` from PlaybackContext and suspends/resumes pending timers accordingly.
 */
export function usePausablePhaseTimer(events: Array<{ time: number; callback: () => void }>) {
  // Capture events once on mount — phase timers are always static per scene mount
  const eventsRef = useRef(events);
  const firedRef = useRef<Set<number>>(new Set());
  // remainingRef tracks how much time is left for each event; starts at full delay
  const remainingRef = useRef<number[]>(events.map(e => e.time));
  const epochStartRef = useRef<number>(Date.now());

  const paused = usePlaybackPaused();

  useEffect(() => {
    if (paused) return; // while paused, let cleanup record remaining times

    epochStartRef.current = Date.now();

    const timers = remainingRef.current.map((remaining, index) => {
      if (firedRef.current.has(index)) return null; // already fired
      if (remaining <= 0) {
        // Time already elapsed — fire immediately on resume
        firedRef.current.add(index);
        eventsRef.current[index].callback();
        return null;
      }
      return setTimeout(() => {
        firedRef.current.add(index);
        eventsRef.current[index].callback();
      }, remaining);
    });

    return () => {
      const elapsed = Date.now() - epochStartRef.current;
      timers.forEach((timer, index) => {
        if (timer !== null) {
          clearTimeout(timer);
          // Only update remaining if this event hasn't fired yet
          if (!firedRef.current.has(index)) {
            remainingRef.current[index] = Math.max(0, remainingRef.current[index] - elapsed);
          }
        }
      });
    };
  }, [paused]);
}

export function useSceneTimer(events: Array<{ time: number; callback: () => void }>) {
  const firedRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    callbacksRef.current = events.map(e => e.callback);
  }, [events]);

  const scheduleKey = events.map((event, i) => `${i}:${event.time}`).join('|');

  useEffect(() => {
    firedRef.current = new Set();

    const timers = events.map(({ time }, index) => {
      return setTimeout(() => {
        if (!firedRef.current.has(index)) {
          firedRef.current.add(index);
          callbacksRef.current[index]?.();
        }
      }, time);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scheduleKey]);
}
