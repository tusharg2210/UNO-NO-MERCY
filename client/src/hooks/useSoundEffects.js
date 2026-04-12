import { useCallback, useRef } from 'react';

const SOUNDS = {
  playCard: '/sounds/card-play.mp3',
  drawCard: '/sounds/card-draw.mp3',
  uno: '/sounds/uno-call.mp3',
  noMercy: '/sounds/no-mercy.mp3',
  gameOver: '/sounds/game-over.mp3',
  yourTurn: '/sounds/your-turn.mp3',
  skip: '/sounds/skip.mp3',
  reverse: '/sounds/reverse.mp3',
  buzzer: '/sounds/buzzer.mp3',
};

const useSoundEffects = () => {
  const audioRef = useRef({});
  const muted = useRef(false);

  const preload = useCallback(() => {
    Object.entries(SOUNDS).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioRef.current[key] = audio;
    });
  }, []);

  const play = useCallback((soundName) => {
    if (muted.current) return;
    const audio = audioRef.current[soundName];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, []);

  const toggleMute = useCallback(() => {
    muted.current = !muted.current;
    return muted.current;
  }, []);

  return { preload, play, toggleMute };
};

export default useSoundEffects;