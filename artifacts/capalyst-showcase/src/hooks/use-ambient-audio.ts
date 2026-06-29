import { useEffect, useRef, useCallback, useState } from 'react';

const VOLUME = 0.07;
const FADE_IN_SECONDS = 3;

type OscillatorEntry = {
  osc: OscillatorNode;
  gain: GainNode;
};

function buildPadLayer(
  ctx: AudioContext,
  masterGain: GainNode,
  freq: number,
  type: OscillatorType,
  detuneCents: number,
  gainValue: number,
): OscillatorEntry {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detuneCents;

  const gain = ctx.createGain();
  gain.gain.value = gainValue;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  filter.Q.value = 0.5;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  return { osc, gain };
}

export function useAmbientAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorEntry[]>([]);
  const startedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FADE_IN_SECONDS);
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    const layers: Array<[number, OscillatorType, number, number]> = [
      [110, 'sine', 0, 1.0],
      [220, 'sine', 4, 0.5],
      [329.6, 'sine', -3, 0.35],
      [440, 'sine', 2, 0.2],
      [110, 'triangle', 7, 0.15],
      [164.8, 'sine', -5, 0.25],
      [82.4, 'sine', 0, 0.3],
    ];

    const entries = layers.map(([freq, type, detune, gainVal]) =>
      buildPadLayer(ctx, masterGain, freq, type, detune, gainVal),
    );
    entries.forEach(({ osc }) => osc.start());
    oscillatorsRef.current = entries;
  }, []);

  const handleInteraction = useCallback(() => {
    if (startedRef.current) return;
    start();
  }, [start]);

  useEffect(() => {
    const events = ['click', 'keydown', 'pointerdown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleInteraction, { once: true, passive: true }));

    const tryAutoplay = async () => {
      try {
        const ctx = new AudioContext();
        if (ctx.state === 'running') {
          ctx.close();
          start();
        } else {
          ctx.close();
        }
      } catch {
      }
    };
    tryAutoplay();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleInteraction));
    };
  }, [handleInteraction, start]);

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(({ osc }) => {
        try { osc.stop(); } catch { }
      });
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !mutedRef.current;
    mutedRef.current = newMuted;
    setMuted(newMuted);

    const masterGain = masterGainRef.current;
    const ctx = ctxRef.current;
    if (!masterGain || !ctx) return;

    if (newMuted) {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    } else {
      if (!startedRef.current) {
        start();
      } else {
        masterGain.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 0.5);
      }
    }
  }, [start]);

  return { muted, toggleMute };
}
