import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {LightingAndShadows} from '../components/LightingAndShadows';
import {PaperCity} from '../components/PaperCity';
import {SceneImage} from '../components/SceneImage';
import {PaperTag} from '../components/PaperTypography';
import {COLORS} from '../timeline';
import {useLang} from '../i18n';

// 0–10 s · An empty miniature paper street. Shop owners wait for customers who never come.
export const Scene01Problem: React.FC = () => {
  const {t, portrait} = useLang();
  return (
  <AbsoluteFill style={{background: COLORS.tealDark}}>
    <CameraMovement from={{scale: 1.04, x: 60, y: 10}} to={{scale: 1.22, x: -40, y: 30}}>
      <SceneImage src={portrait ? 'img/v1-city.png' : 'img/s1-city.png'} video={portrait ? 'video/mv1-city.mp4' : undefined} clipSecs={12} brightness={0.92} />
    </CameraMovement>
    {/* near paper skyline sliding faster than the set => parallax depth */}
    <PaperCity
      travel={260}
      rise={14}
      glow={0.25}
      rows={[
        {color: '#22302F', height: 170, depth: 0.6},
        {color: '#141B1B', height: 110, depth: 1},
      ]}
    />
    <LightingAndShadows warmth={0.18} vignette={0.62} lightX={70} lightY={25} />
    <div style={{position: 'absolute', left: portrait ? 60 : 90, top: portrait ? 150 : 80}}>
      <PaperTag delay={10} bg={COLORS.cream} rotate={-3}>
        <div style={{fontFamily: 'Archivo Black', fontSize: 34, color: COLORS.burgundy, letterSpacing: 3}}>
          {t.problem}
        </div>
      </PaperTag>
    </div>
    <div style={{position: 'absolute', right: portrait ? 50 : 110, top: portrait ? 280 : 90}}>
      <PaperTag delay={120} bg={COLORS.burgundy} rotate={4}>
        <div style={{fontFamily: 'Archivo Black', fontSize: 40, color: COLORS.cream, letterSpacing: 2}}>
          {t.whereCustomers}
        </div>
      </PaperTag>
    </div>
  </AbsoluteFill>
  );
};
