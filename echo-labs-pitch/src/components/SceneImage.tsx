import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useVideoConfig} from 'remotion';

/**
 * Full-bleed papercraft set. When an animated clip exists (`video`) it plays muted,
 * time-stretched to cover `spanFrames` (default: the whole scene); otherwise the still is used.
 */
export const SceneImage: React.FC<{
  src: string;
  video?: string;
  clipSecs?: number;
  spanFrames?: number;
  blur?: number;
  brightness?: number;
}> = ({src, video, clipSecs, spanFrames, blur = 0, brightness = 1}) => {
  const {durationInFrames, fps} = useVideoConfig();
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: `blur(${blur}px) brightness(${brightness}) saturate(1.05) contrast(1.04)`,
  };
  if (video && clipSecs) {
    const span = spanFrames ?? durationInFrames;
    // never play faster than real time; stretch slightly if the scene is longer than the clip
    const rate = Math.min(1, (clipSecs * fps - 2) / span);
    return (
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(video)} muted playbackRate={rate} style={style} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={style} />
    </AbsoluteFill>
  );
};
