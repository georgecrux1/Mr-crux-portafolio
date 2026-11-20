import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

/** Full-bleed AI-rendered papercraft set, sized slightly larger than frame for camera moves. */
export const SceneImage: React.FC<{src: string; blur?: number; brightness?: number}> = ({
  src,
  blur = 0,
  brightness = 1,
}) => (
  <AbsoluteFill>
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: `blur(${blur}px) brightness(${brightness}) saturate(1.05) contrast(1.04)`,
      }}
    />
  </AbsoluteFill>
);
