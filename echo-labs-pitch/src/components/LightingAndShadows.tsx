import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

/** Paper fibre grain (SVG turbulence), re-seeded every 3 frames like film grain. */
export const PaperGrain: React.FC<{opacity?: number}> = ({opacity = 0.16}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3) % 6;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply', opacity}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Warm key light, vignette and a soft breathing flicker, like practical lamps over a miniature set. */
export const LightingAndShadows: React.FC<{
  warmth?: number;
  vignette?: number;
  lightX?: number;
  lightY?: number;
}> = ({warmth = 0.22, vignette = 0.55, lightX = 30, lightY = 20}) => {
  const frame = useCurrentFrame();
  const flicker = 1 + (random(`f${Math.floor(frame / 4)}`) - 0.5) * 0.06;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${lightX}% ${lightY}%, rgba(255,196,120,${
            warmth * flicker
          }) 0%, rgba(255,170,90,0) 55%)`,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(10,6,4,${vignette}) 100%)`,
        }}
      />
      <PaperGrain />
    </AbsoluteFill>
  );
};

/** Drop shadow recipe for stacked cardstock layers. */
export const paperShadow = (lift = 1) =>
  `drop-shadow(0 ${2 * lift}px ${1.5 * lift}px rgba(0,0,0,0.35)) drop-shadow(0 ${10 * lift}px ${
    18 * lift
  }px rgba(0,0,0,0.28))`;
