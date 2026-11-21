import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {useCount} from '../components/EchoLogo';
import {LightingAndShadows} from '../components/LightingAndShadows';
import {SceneImage} from '../components/SceneImage';
import {PaperTag} from '../components/PaperTypography';
import {COLORS} from '../timeline';
import {useLang} from '../i18n';

// voice starts at frame 16; "two hundred thirty-seven" ≈ 2.5–3.8 s; "But leads aren't enough" ≈ 5.4 s

const ChatBubble: React.FC<{x: number; y: number; delay: number; w: number}> = ({x, y, delay, w}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 10, stiffness: 160}});
  const drift = interpolate(frame - delay, [0, 120], [0, -60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + drift,
        width: w,
        height: 40,
        borderRadius: 14,
        background: COLORS.green,
        transform: `scale(${s}) rotate(${(x % 7) - 3}deg)`,
        boxShadow: '0 3px 0 #23804f, 0 10px 16px rgba(0,0,0,0.3)',
        opacity: s > 0.02 ? 1 : 0,
      }}
    >
      <div style={{margin: '12px 14px', height: 6, width: w * 0.6, background: 'rgba(255,255,255,0.75)', borderRadius: 3}} />
      <div style={{margin: '0 14px', height: 6, width: w * 0.35, background: 'rgba(255,255,255,0.55)', borderRadius: 3}} />
    </div>
  );
};

// 18–30 s · The founder's advertising studio unfolds; a real result appears: 237 WhatsApp enquiries.
export const Scene03Experience: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {t, at, portrait} = useLang();
  const NUM_AT = at(2, 'number', 91);
  const LEADS_AT = at(2, 'leads', 179);
  const n = useCount(0, 237, NUM_AT - 8, 40);
  const numPop = spring({frame: frame - (NUM_AT - 10), fps, config: {damping: 9, stiffness: 120}});
  const bubbles = Array.from({length: 14}, (_, i) => ({
    x: portrait ? 620 + ((i * 97) % 300) : 1300 + ((i * 97) % 380),
    y: portrait ? 1200 - ((i * 53) % 300) : 640 - ((i * 53) % 260),
    delay: NUM_AT - 6 + i * 3,
    w: 110 + ((i * 37) % 80),
  }));
  return (
    <AbsoluteFill style={{background: COLORS.paper}}>
      <CameraMovement from={portrait ? {scale: 1.04, x: 0, y: 60} : {scale: 1.12, x: 120, y: 40}} to={portrait ? {scale: 1.14, x: -30, y: 20} : {scale: 1.2, x: -110, y: 10}}>
        <SceneImage src={portrait ? 'img/v3-studio.png' : 'img/s3-studio.png'} video={portrait ? 'video/mv3-studio.mp4' : undefined} clipSecs={15} />
      </CameraMovement>
      {bubbles.map((b, i) => (
        <ChatBubble key={i} {...b} />
      ))}
      <LightingAndShadows warmth={0.2} vignette={0.42} lightX={20} lightY={15} />
      <div
        style={{
          position: 'absolute',
          right: portrait ? 60 : 90,
          top: portrait ? 120 : 60,
          textAlign: 'right',
          transform: `scale(${0.6 + 0.4 * numPop}) rotate(${(1 - numPop) * 8}deg)`,
          transformOrigin: '100% 0%',
          opacity: numPop > 0.02 ? 1 : 0,
        }}
      >
        <div
          style={{
            fontFamily: 'Archivo Black',
            fontSize: portrait ? 230 : 250,
            lineHeight: 0.9,
            color: COLORS.burgundy,
            textShadow:
              '1px 2px 0 #4E121B, 2px 4px 0 #4E121B, 3px 6px 0 #4E121B, 4px 8px 0 #4E121B, 0 22px 26px rgba(0,0,0,0.4)',
          }}
        >
          {n}
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 14,
            background: COLORS.green,
            color: '#fff',
            fontFamily: 'Archivo Black',
            fontSize: portrait ? 36 : 42,
            letterSpacing: 3,
            padding: '10px 22px',
            borderRadius: 6,
            boxShadow: '0 3px 0 #23804f, 0 12px 20px rgba(0,0,0,0.35)',
          }}
        >
          {t.enquiries}
        </div>
        <div style={{fontFamily: 'Inter', fontWeight: 700, fontSize: 24, color: COLORS.ink, marginTop: 10, letterSpacing: 2}}>
          {t.oneCampaign}
        </div>
      </div>
      <div style={{position: 'absolute', left: portrait ? 60 : 90, top: portrait ? 560 : 80}}>
        <PaperTag delay={LEADS_AT} bg={COLORS.ink} rotate={-3}>
          <div style={{fontFamily: 'Archivo Black', fontSize: 40, color: COLORS.cream, letterSpacing: 2}}>
            {t.leadsNot[0]} <span style={{color: COLORS.amber}}>≠</span> {t.leadsNot[1]}
          </div>
        </PaperTag>
      </div>
    </AbsoluteFill>
  );
};
