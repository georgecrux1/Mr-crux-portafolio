import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../timeline';

const thickness = (edge: string, depth: number) => {
  const layers: string[] = [];
  for (let i = 1; i <= depth; i++) layers.push(`${i * 0.6}px ${i}px 0 ${edge}`);
  layers.push(`0 ${depth + 6}px 14px rgba(0,0,0,0.45)`);
  return layers.join(', ');
};

/**
 * Cut-cardstock lettering: every glyph unfolds upward (rotateX) with a springy
 * stop-motion settle, and carries a visible paper edge underneath.
 */
export const PaperTypography: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  edge?: string;
  depth?: number;
  stagger?: number;
  weight?: number;
  letterSpacing?: number;
  font?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  size = 120,
  color = COLORS.cream,
  edge = '#A89778',
  depth = 6,
  stagger = 2,
  weight = 900,
  letterSpacing = 2,
  font = "'Archivo Black', 'Arial Black', Impact, sans-serif",
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        perspective: 900,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        letterSpacing,
        lineHeight: 1,
        ...style,
      }}
    >
      {text.split('').map((ch, i) => {
        const s = spring({frame: frame - delay - i * stagger, fps, config: {damping: 11, stiffness: 140, mass: 0.7}});
        // quantise to 2-frame steps for a hand-animated feel
        const q = Math.round(s * 12) / 12;
        const rot = interpolate(q, [0, 1], [-95, 0]);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              color,
              textShadow: thickness(edge, depth),
              transform: `rotateX(${rot}deg) translateY(${(1 - q) * 30}px)`,
              transformOrigin: '50% 100%',
              opacity: q > 0.02 ? 1 : 0,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Paper label card (tag) that drops in and swings. */
export const PaperTag: React.FC<{
  children: React.ReactNode;
  delay?: number;
  bg?: string;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({children, delay = 0, bg = COLORS.cream, rotate = -2, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 9, stiffness: 120}});
  const swing = Math.sin((frame - delay) / 6) * 3 * Math.exp(-(frame - delay) / 25);
  return (
    <div
      style={{
        background: bg,
        padding: '18px 34px',
        borderRadius: 6,
        boxShadow: '0 2px 0 #b9a888, 0 4px 0 #a49373, 0 14px 26px rgba(0,0,0,0.4)',
        transform: `translateY(${(1 - s) * -160}px) rotate(${rotate + (frame > delay ? swing : 0)}deg) scale(${
          0.6 + 0.4 * s
        })`,
        opacity: s > 0.02 ? 1 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
