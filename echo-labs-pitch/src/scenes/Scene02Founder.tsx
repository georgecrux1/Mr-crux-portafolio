import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {LightingAndShadows} from '../components/LightingAndShadows';
import {SceneImage} from '../components/SceneImage';
import {PaperTag} from '../components/PaperTypography';
import {COLORS} from '../timeline';
import {useLang} from '../i18n';

// 10–18 s · A paper door opens and Jorge walks into the miniature city, looking at camera.
export const Scene02Founder: React.FC = () => {
  const {t, portrait} = useLang();
  return (
  <AbsoluteFill style={{background: COLORS.ink}}>
    <CameraMovement from={portrait ? {scale: 1.5, x: -40, y: 80} : {scale: 1.55, x: 60, y: 120}} to={{scale: 1.08, x: 0, y: 0}}>
      <SceneImage src={portrait ? 'img/v2-door.jpg' : 'img/s2-door.png'} video={portrait ? 'video/mv2-door.mp4' : undefined} clipSecs={10} />
    </CameraMovement>
    <LightingAndShadows warmth={0.3} vignette={0.5} lightX={45} lightY={40} />
    <div style={portrait ? {position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center'} : {position: 'absolute', right: 110, bottom: 210}}>
      <PaperTag delay={30} rotate={-2}>
        <div style={{fontFamily: 'Archivo Black', fontSize: portrait ? 44 : 50, color: COLORS.ink, letterSpacing: 1}}>
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
          {t.founderRole}
        </div>
      </PaperTag>
    </div>
  </AbsoluteFill>
  );
};
