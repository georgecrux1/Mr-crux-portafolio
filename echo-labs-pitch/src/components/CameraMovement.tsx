import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

type Keyframe = {scale: number; x: number; y: number; rotate?: number};

/**
 * Cinematic dolly: eases between two camera keyframes over the sequence
 * and adds a tiny handheld "stop-motion" drift.
 */
export const CameraMovement: React.FC<{
  from: Keyframe;
  to: Keyframe;
  children: React.ReactNode;
  durationInFrames?: number;
  shake?: number;
}> = ({from, to, children, durationInFrames, shake = 1}) => {
  const frame = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const dur = durationInFrames ?? d;
  const t = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const lerp = (a: number, b: number) => a + (b - a) * t;
  // stepped drift every 2 frames => stop-motion feel
  const step = Math.floor(frame / 2);
  const dx = Math.sin(step * 0.37) * 1.6 * shake;
  const dy = Math.cos(step * 0.29) * 1.2 * shake;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${lerp(from.x, to.x) + dx}px, ${lerp(from.y, to.y) + dy}px) scale(${lerp(
          from.scale,
          to.scale,
        )}) rotate(${lerp(from.rotate ?? 0, to.rotate ?? 0)}deg)`,
        transformOrigin: '50% 50%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Parallax layer: moves proportionally to depth on top of the camera. */
export const ParallaxLayer: React.FC<{
  depth: number; // 0 = far, 1 = near
  travel: number; // px of horizontal travel for depth 1
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({depth, travel, children, style}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const x = interpolate(frame, [0, durationInFrames], [0, -travel * depth], {
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{transform: `translateX(${x}px)`, ...style}}>{children}</AbsoluteFill>;
};
