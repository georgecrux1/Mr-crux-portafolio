import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {TRANSITION} from '../timeline';

/** Jagged torn-paper edge as an SVG path, deterministic per seed. */
const tornEdge = (seed: string, w: number, h: number, progress: number) => {
  const x = progress * (w + 300) - 150;
  const pts: string[] = [`${-10},${-10}`, `${x},${-10}`];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const y = (h / steps) * i;
    const jag = (random(`${seed}-${i}`) - 0.5) * 70 + Math.sin(i * 0.9) * 25;
    pts.push(`${x + jag},${y}`);
  }
  pts.push(`${x},${h + 10}`, `-10,${h + 10}`);
  return pts.join(' ');
};

/**
 * Incoming scene unfolds like a sheet of card swinging in from the right,
 * with a torn edge reveal and a moving fold shadow.
 */
export const PaperUnfoldIn: React.FC<{children: React.ReactNode; seed: string; mode?: 'fold' | 'tear'}> = ({
  children,
  seed,
  mode = 'fold',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = interpolate(frame, [0, TRANSITION], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.6, 0, 0.2, 1),
  });
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (mode === 'tear') {
    const id = `tear-${seed}`;
    return (
      <AbsoluteFill>
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <clipPath id={id}>
              <polygon points={tornEdge(seed, width, height, p)} />
            </clipPath>
          </defs>
        </svg>
        <AbsoluteFill style={{clipPath: `url(#${id})`, filter: 'drop-shadow(14px 0 18px rgba(0,0,0,0.55))'}}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const rot = interpolate(p, [0, 1], [-100, 0]);
  return (
    <AbsoluteFill style={{perspective: 2200}}>
      <AbsoluteFill
        style={{
          transform: `rotateY(${rot}deg)`,
          transformOrigin: '0% 50%',
          boxShadow: `0 0 60px rgba(0,0,0,${0.6 * (1 - p)})`,
        }}
      >
        {children}
        <AbsoluteFill
          style={{
            background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${0.55 * (1 - p)}) 100%)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Short cardstock flash used on beats (paper sheet slap). */
export const PaperFlash: React.FC<{at: number; color?: string}> = ({at, color = '#F3E9D8'}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + 10], [0, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};
