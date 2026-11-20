import React from 'react';
import {random} from 'remotion';
import {COLORS} from '../timeline';
import {paperShadow} from './LightingAndShadows';

/** A single cut-cardstock building silhouette with lit paper windows. */
export const PaperBuilding: React.FC<{
  x: number;
  width: number;
  height: number;
  color: string;
  roof?: 'flat' | 'gable' | 'step';
  windowGlow?: number; // 0..1
  seed: string;
  lift?: number;
}> = ({x, width, height, color, roof = 'flat', windowGlow = 0.6, seed, lift = 1}) => {
  const roofPts =
    roof === 'gable'
      ? `0,${height * 0.18} ${width / 2},0 ${width},${height * 0.18}`
      : roof === 'step'
      ? `0,${height * 0.12} ${width * 0.3},${height * 0.12} ${width * 0.3},0 ${width * 0.7},0 ${width * 0.7},${
          height * 0.12
        } ${width},${height * 0.12}`
      : `0,${height * 0.04} ${width},${height * 0.04}`;
  const top = roof === 'flat' ? height * 0.04 : roof === 'step' ? height * 0.12 : height * 0.18;
  const cols = Math.max(2, Math.floor(width / 46));
  const rows = Math.max(2, Math.floor((height - top) / 70));
  const wins: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = random(`${seed}-${r}-${c}`) < windowGlow;
      const ww = (width / cols) * 0.45;
      wins.push(
        <rect
          key={`${r}-${c}`}
          x={(width / cols) * c + (width / cols - ww) / 2}
          y={top + 24 + r * ((height - top - 40) / rows)}
          width={ww}
          height={ww * 1.25}
          rx={3}
          fill={lit ? COLORS.amber : 'rgba(0,0,0,0.35)'}
          opacity={lit ? 0.95 : 1}
        />,
      );
    }
  }
  return (
    <svg
      width={width}
      height={height}
      style={{position: 'absolute', left: x, bottom: 0, overflow: 'visible', filter: paperShadow(lift)}}
    >
      <polygon points={`${roofPts} ${width},${height} 0,${height}`} fill={color} />
      {/* paper edge highlight */}
      <polyline points={roofPts} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      {wins}
    </svg>
  );
};
