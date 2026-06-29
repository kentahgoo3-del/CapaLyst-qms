import { createContext, useContext } from 'react';

/**
 * Provides the current playback-paused state to any scene component in the tree.
 * Defaults to false (playing) so scenes work standalone without a provider.
 */
export const PlaybackContext = createContext<boolean>(false);

/** Returns true when the showcase is paused. */
export function usePlaybackPaused(): boolean {
  return useContext(PlaybackContext);
}
