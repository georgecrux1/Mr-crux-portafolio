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

// voice starts at frame 12. "five thousand" 0.22 s, technology 3.1 s, "acquisition system" 6.2 s, "grow" 9.2 s
const V = 12;
const USES = [
  {label: 'STRONGER TECHNOLOGY', at: V + 90},
  {label: 'INTERNATIONAL ACQUISITION SYSTEM', at: V + 180},
  {label: 'MORE BUSINESSES GROWING', at: V + 245},
];
const END_CARD_AT = 300;

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
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
              transform: `translateY(${(1 - s) * 1100}px) rotate(${(i - 1.5) * 0.8}deg) scale(${1.1 - i * 0.04})`,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.45)',
            }}
          />
        );
      })}
      <PaperCharacter view="three-quarter" height={880} x={170} bottom={60} delay={10} />
      <AbsoluteFill style={{left: 640, width: 'auto', right: 40, justifyContent: 'center', alignItems: 'center'}}>
        <EchoLogo delay={14} size={200} />
        <div style={{marginTop: 46, textAlign: 'center', fontFamily: 'Archivo Black', letterSpacing: 2, whiteSpace: 'nowrap'}}>
          <div style={{fontSize: 46, color: COLORS.cream, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`}}>
            WE DON&apos;T SELL LIKES.
          </div>
          <div
            style={{
              fontSize: 46,
              color: COLORS.amber,
              marginTop: 10,
              opacity: tag2,
              transform: `translateY(${(1 - tag2) * 30}px)`,
            }}
          >
            WE HELP BUSINESSES GET CUSTOMERS.
          </div>
        </div>
      </AbsoluteFill>
      <PaperGrain opacity={0.18} />
    </AbsoluteFill>
  );
};

// 50.5–64 s · Jorge in front of the finished city; $5,000 assembles; end card.
export const Scene06Investment: React.FC = () => {
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <CameraMovement from={{scale: 1.18, x: 0, y: 70}} to={{scale: 1.06, x: 0, y: 20}} durationInFrames={END_CARD_AT}>
        <SceneImage src="img/s6-hero.png" />
      </CameraMovement>
      <LightingAndShadows warmth={0.32} vignette={0.45} lightX={50} lightY={10} />
      <div style={{position: 'absolute', top: 70, left: 0, right: 0}}>
        <PaperTypography text="$5,000" delay={V + 4} size={190} color={COLORS.cream} edge="#9C8B6E" depth={9} stagger={3} />
      </div>
      <div style={{position: 'absolute', left: 90, bottom: 220, display: 'flex', flexDirection: 'column', gap: 18}}>
        {USES.map((u, i) => (
          <PaperTag key={u.label} delay={u.at} bg={i === 2 ? COLORS.amber : COLORS.cream} rotate={[-2, 1.5, -1][i]}>
            <div style={{fontFamily: 'Archivo Black', fontSize: 30, color: COLORS.ink, letterSpacing: 1}}>
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

