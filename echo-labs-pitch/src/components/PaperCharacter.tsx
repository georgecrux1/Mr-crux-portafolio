import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * The founder as a cut-out paper puppet (from the generated model sheet).
 * Idle breathing, stop-motion stepping and a pop-up entrance on its paper base.
 */
export const PaperCharacter: React.FC<{
  view?: 'front' | 'three-quarter';
  height?: number;
  x?: number;
  bottom?: number;
  delay?: number;
  flip?: boolean;
}> = ({view = 'front', height = 760, x = 0, bottom = 0, delay = 0, flip = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 110}});
  const step = Math.floor(frame / 2); // stop-motion cadence
  const breathe = 1 + Math.sin(step * 0.18) * 0.008;
  const sway = Math.sin(step * 0.09) * 0.8;
  const rotX = interpolate(pop, [0, 1], [80, 0]);
  const src = view === 'front' ? 'img/jorge-front.png' : 'img/jorge-34.png';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        bottom,
        height,
        perspective: 1400,
        opacity: pop > 0.01 ? 1 : 0,
      }}
    >
      <div
        style={{
          height: '100%',
          transformOrigin: '50% 100%',
          transform: `rotateX(${rotX}deg) rotate(${sway}deg) scaleY(${breathe}) scaleX(${flip ? -1 : 1})`,
          // paper edge: thin light rim + layered cast shadow
          filter:
            'drop-shadow(0 0 1.5px rgba(255,248,235,0.9)) drop-shadow(3px 4px 0 rgba(0,0,0,0.25)) drop-shadow(14px 22px 22px rgba(0,0,0,0.45))',
        }}
      >
        <Img src={staticFile(src)} style={{height: '100%'}} />
      </div>
      {/* folded paper stand */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          right: '10%',
          bottom: -10,
          height: 18,
          background: 'linear-gradient(#cdbb98, #a99572)',
          borderRadius: 3,
          transform: `scaleX(${pop})`,
          boxShadow: '0 8px 14px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
};
