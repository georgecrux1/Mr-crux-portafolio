import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {PaperBuilding} from './PaperBuildings';

/**
 * Foreground skyline of cardstock buildings at several depths.
 * Each row slides at a different speed => physical parallax over the AI-rendered set.
 */
export const PaperCity: React.FC<{
  rows?: {color: string; height: number; depth: number}[];
  travel?: number;
  rise?: number; // frames for buildings to pop up
  glow?: number;
  opacity?: number;
}> = ({
  rows = [
    {color: '#2A3B3D', height: 230, depth: 0.5},
    {color: '#1A2526', height: 150, depth: 1},
  ],
  travel = 220,
  rise = 0,
  glow = 0.5,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{opacity}}>
      {rows.map((row, ri) => {
        const x = interpolate(frame, [0, durationInFrames], [0, -travel * row.depth]);
        const buildings: React.ReactNode[] = [];
        let cx = -120;
        let i = 0;
        while (cx < 1920 + travel + 200) {
          const w = 120 + random(`w${ri}-${i}`) * 140;
          const h = row.height * (0.6 + random(`h${ri}-${i}`) * 0.6);
          const roofs = ['flat', 'gable', 'step'] as const;
          const popDelay = i * 3;
          const pop = rise
            ? interpolate(frame, [popDelay, popDelay + rise], [h, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 0;
          buildings.push(
            <div key={i} style={{position: 'absolute', left: 0, bottom: 0, transform: `translateY(${pop}px)`}}>
              <PaperBuilding
                x={cx}
                width={w}
                height={h}
                color={row.color}
                roof={roofs[Math.floor(random(`r${ri}-${i}`) * 3)]}
                windowGlow={glow}
                seed={`b${ri}-${i}`}
                lift={1 + row.depth}
              />
            </div>,
          );
          cx += w + 6 + random(`g${ri}-${i}`) * 30;
          i++;
        }
        return (
          <AbsoluteFill key={ri} style={{transform: `translateX(${x}px) translateY(${(1 - row.depth) * -10}px)`}}>
            {buildings}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
