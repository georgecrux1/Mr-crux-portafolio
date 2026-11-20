import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {LightingAndShadows} from '../components/LightingAndShadows';
import {SceneImage} from '../components/SceneImage';
import {PaperTag} from '../components/PaperTypography';
import {COLORS} from '../timeline';

// 10–18 s · A paper door opens and Jorge walks into the miniature city, looking at camera.
export const Scene02Founder: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.ink}}>
    <CameraMovement from={{scale: 1.55, x: 60, y: 120}} to={{scale: 1.08, x: 0, y: 0}}>
      <SceneImage src="img/s2-door.png" />
    </CameraMovement>
    <LightingAndShadows warmth={0.3} vignette={0.5} lightX={45} lightY={40} />
    <div style={{position: 'absolute', right: 110, bottom: 210}}>
      <PaperTag delay={30} rotate={-2}>
        <div style={{fontFamily: 'Archivo Black', fontSize: 50, color: COLORS.ink, letterSpacing: 1}}>
          JORGE AMOROCHO CRUZ
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 28,
            color: COLORS.burgundy,
            letterSpacing: 4,
            marginTop: 6,
          }}
        >
          FOUNDER · ECHO LABS
        </div>
      </PaperTag>
    </div>
  </AbsoluteFill>
);
