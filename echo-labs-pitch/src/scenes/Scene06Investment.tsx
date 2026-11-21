import React from 'react';
import {AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {EchoLogo} from '../components/EchoLogo';
import {LightingAndShadows, PaperGrain} from '../components/LightingAndShadows';
import {PaperCharacter} from '../components/PaperCharacter';
import {SceneImage} from '../components/SceneImage';
import {PaperTag, PaperTypography} from '../components/PaperTypography';
import {PaperUnfoldIn} from '../components/PaperTransitions';
import {COLORS} from '../timeline';
import {useLang} from '../i18n';

// voice starts at frame 12. "five thousand" 0.22 s, technology 3.1 s, "acquisition system" 6.2 s, "grow" 9.2 s
const V = 12;

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {t, portrait} = useLang();
  const tagSize = portrait ? (t.tag2.length > 36 ? 44 : 52) : t.tag2.length > 36 ? 36 : 46;
  const {fps} = useVideoConfig();
  const tag = spring({frame: frame - 40, fps, config: {damping: 14}});
  const tag2 = spring({frame: frame - 52, fps, config: {damping: 14}});
  const sheets = [COLORS.tealDark, COLORS.teal, COLORS.burgundyDark, COLORS.burgundy];
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      {/* stacked cardstock sheets sliding in */}
      {sheets.map((c, i) => {
        const s = spring({frame: frame - i * 3, fps, config: {damping: 16}});
        return (
          <AbsoluteFill
            key={i}
            style={{
              background: c,
              transform: `translateY(${(1 - s) * 2000}px) rotate(${(i - 1.5) * 0.8}deg) scale(${1.1 - i * 0.04})`,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.45)',
            }}
          />
        );
      })}
      {portrait ? (
        <PaperCharacter view="three-quarter" height={1150} x={315} bottom={70} delay={10} />
      ) : (
        <PaperCharacter view="three-quarter" height={880} x={170} bottom={60} delay={10} />
      )}
      <AbsoluteFill
        style={
          portrait
            ? {top: 150, height: 'auto', bottom: 'auto', alignItems: 'center', padding: '0 50px'}
            : {left: 640, width: 'auto', right: 40, justifyContent: 'center', alignItems: 'center'}
        }
      >
        <EchoLogo delay={14} size={200} />
        <div style={{marginTop: 46, textAlign: 'center', fontFamily: 'Archivo Black', letterSpacing: 2, whiteSpace: portrait ? 'normal' : 'nowrap'}}>
          <div style={{fontSize: tagSize, color: COLORS.cream, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`}}>
            {t.tag1}
          </div>
          <div
            style={{
              fontSize: tagSize,
              color: COLORS.amber,
              marginTop: 10,
              opacity: tag2,
              transform: `translateY(${(1 - tag2) * 30}px)`,
            }}
          >
            {t.tag2}
          </div>
        </div>
      </AbsoluteFill>
      <PaperGrain opacity={0.18} />
    </AbsoluteFill>
  );
};

// 50.5–64 s · Jorge in front of the finished city; $5,000 assembles; end card.
export const Scene06Investment: React.FC = () => {
  const {t, at, portrait, timeline} = useLang();
  const END_CARD_AT = timeline.endCardAt;
  const USES = [
    {label: t.uses[0], at: at(5, 'use1', V + 90)},
    {label: t.uses[1], at: at(5, 'use2', V + 180)},
    {label: t.uses[2], at: at(5, 'use3', V + 245)},
  ];
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <CameraMovement from={{scale: 1.18, x: 0, y: 70}} to={{scale: 1.06, x: 0, y: 20}} durationInFrames={END_CARD_AT}>
        <SceneImage src={portrait ? 'img/v6-hero.png' : 'img/s6-hero.png'} video={portrait ? 'video/mv6-hero.mp4' : undefined} clipSecs={12} spanFrames={END_CARD_AT} />
      </CameraMovement>
      <LightingAndShadows warmth={0.32} vignette={0.45} lightX={50} lightY={10} />
      <div style={{position: 'absolute', top: portrait ? 130 : 70, left: 0, right: 0}}>
        <PaperTypography text="$5,000" delay={V + 4} size={190} color={COLORS.cream} edge="#9C8B6E" depth={9} stagger={3} />
      </div>
      <div style={portrait ? {position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16} : {position: 'absolute', left: 90, bottom: 220, display: 'flex', flexDirection: 'column', gap: 18}}>
        {USES.map((u, i) => (
          <PaperTag key={u.label} delay={u.at} bg={i === 2 ? COLORS.amber : COLORS.cream} rotate={[-2, 1.5, -1][i]}>
            <div style={{fontFamily: 'Archivo Black', fontSize: portrait ? 28 : 30, color: COLORS.ink, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {u.label}
            </div>
          </PaperTag>
        ))}
      </div>
      <Sequence from={END_CARD_AT}>
        <PaperUnfoldIn seed="end" mode="tear">
          <EndCard />
        </PaperUnfoldIn>
      </Sequence>
    </AbsoluteFill>
  );
};

