import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {EchoLogo} from '../components/EchoLogo';
import {LightingAndShadows} from '../components/LightingAndShadows';
import {SceneImage} from '../components/SceneImage';
import {PaperTag} from '../components/PaperTypography';
import {COLORS} from '../timeline';
import {useLang} from '../i18n';

// voice starts at frame 30. Word times (s): advertising 4.62, creative 5.72, automation 6.87
const V = 30;

// 30–41 s · Jorge pulls the lever: three paper modules unfold and lock into one system.
export const Scene04Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const {t, at, portrait} = useLang();
  const MODULES = [
    {n: '01', label: t.modules[0], at: at(3, 'mod1', V + 136), color: COLORS.burgundy},
    {n: '02', label: t.modules[1], at: at(3, 'mod2', V + 172), color: COLORS.teal},
    {n: '03', label: t.modules[2], at: at(3, 'mod3', V + 206), color: COLORS.amber},
  ];
  const LOGO_AT = Math.max(V + 250, MODULES[2].at + 45);
  const LINK_AT = Math.min(MODULES[2].at + 26, LOGO_AT - 18);
  const power = interpolate(frame, [12, 40], [0.62, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const link = interpolate(frame, [LINK_AT, LINK_AT + 20], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const logoBg = interpolate(frame, [LOGO_AT - 6, LOGO_AT + 10], [0, 0.72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{background: COLORS.paper}}>
      <CameraMovement from={portrait ? {scale: 1.04, x: 0, y: 0} : {scale: 1.08, x: 40, y: 30}} to={portrait ? {scale: 1.12, x: 20, y: -30} : {scale: 1.2, x: 60, y: 60}}>
        <SceneImage src={portrait ? 'img/v4-machine.png' : 'img/s4-machine.png'} video={portrait ? 'video/mv4-machine.mp4' : undefined} clipSecs={14} brightness={power} blur={logoBg * 6} />
      </CameraMovement>
      <LightingAndShadows warmth={0.15 + 0.2 * power} vignette={0.45} lightX={35} lightY={70} />
      {/* module cards + connecting paper string */}
      <svg width={1920} height={1080} style={{position: 'absolute', display: portrait ? 'none' : 'block'}}>
        <path
          d="M 330 200 C 600 120, 700 280, 960 200 S 1350 120, 1590 200"
          stroke={COLORS.ink}
          strokeWidth={5}
          strokeDasharray="1400"
          strokeDashoffset={1400 * link}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
      </svg>
      <div style={portrait ? {position: 'absolute', top: 140, left: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22} : {position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0 40px', gap: 16}}>
        {MODULES.map((m, i) => (
          <PaperTag key={m.n} delay={m.at} bg={COLORS.cream} rotate={[-3, 2, -1][i]}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div
                style={{
                  fontFamily: 'Archivo Black',
                  fontSize: 40,
                  color: COLORS.cream,
                  background: m.color,
                  borderRadius: 6,
                  padding: '4px 14px',
                }}
              >
                {m.n}
              </div>
              <div style={{fontFamily: 'Archivo Black', fontSize: portrait ? 30 : m.label.length > 20 ? 25 : 30, color: COLORS.ink, letterSpacing: 1, whiteSpace: 'nowrap'}}>{m.label}</div>
            </div>
          </PaperTag>
        ))}
      </div>
      <AbsoluteFill style={{background: `rgba(30,20,16,${logoBg})`}} />
      {frame >= LOGO_AT - 4 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <EchoLogo delay={LOGO_AT} size={230} />
          <div
            style={{
              marginTop: 18,
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: portrait ? 3 : 6,
              textAlign: 'center',
              maxWidth: portrait ? 900 : undefined,
              color: COLORS.amber,
              opacity: interpolate(frame, [LOGO_AT + 30, LOGO_AT + 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}
          >
            {t.oneSystem}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
