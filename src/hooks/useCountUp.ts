'use client';

import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animates an integer toward `target`. Starts from 0 on mount, then tweens
 * from wherever it currently is whenever the target changes. Jumps straight
 * to the target when the user prefers reduced motion.
 */
export function useCountUp(target: number, { duration = 900, delay = 0 } = {}): number {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = valueRef.current;
    if (reduced || from === target) {
      valueRef.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const next = Math.round(from + (target - from) * easeOutCubic(t));
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);

  return value;
}
