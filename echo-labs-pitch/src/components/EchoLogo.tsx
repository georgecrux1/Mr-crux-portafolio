import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../timeline';
import {PaperTypography} from './PaperTypography';

/** Echo Labs mark: concentric cardstock rings that unfold outward, with paper wordmark. */
export const EchoLogo: React.FC<{delay?: number; size?: number; showWord?: boolean; light?: boolean}> = ({
  delay = 0,
  size = 220,
  showWord = true,
  light = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rings = [0, 1, 2, 3];
  const ringColors = [COLORS.burgundy, COLORS.amber, COLORS.teal, COLORS.cream];
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <div style={{position: 'relative', width: size, height: size}}>
        {rings
          .slice()
          .reverse()
          .map((r) => {
            const s = spring({frame: frame - delay - r * 4, fps, config: {damping: 10, stiffness: 130}});
            const d = size * (0.28 + r * 0.24);
            const pulse = 1 + Math.sin((frame - delay - r * 6) / 9) * 0.015 * s;
            return (
              <div
                key={r}
                style={{
                  position: 'absolute',
                  left: (size - d) / 2,
                  top: (size - d) / 2,
                  width: d,
                  height: d,
                  borderRadius: '50%',
                  border: r === 0 ? 'none' : `${size * 0.05}px solid ${ringColors[r]}`,
                  background: r === 0 ? COLORS.burgundy : 'transparent',
                  transform: `scale(${s * pulse})`,
                  boxShadow: '0 3px 0 rgba(0,0,0,0.25), 0 10px 18px rgba(0,0,0,0.35)',
                  opacity: s > 0.02 ? 1 : 0,
                }}
              />
            );
          })}
      </div>
      {showWord ? (
        <PaperTypography
          text="ECHO LABS"
          delay={delay + 12}
          size={size * 0.62}
          color={light ? COLORS.cream : COLORS.ink}
          edge={light ? '#9C8B6E' : '#000'}
          letterSpacing={size * 0.03}
        />
      ) : null}
    </div>
  );
};

/** Simple count-up helper for numbers on screen. */
export const useCount = (from: number, to: number, start: number, dur: number) => {
  const frame = useCurrentFrame();
  return Math.round(
    interpolate(frame, [start, start + dur], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 3),
    }),
  );
};
