import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CameraMovement} from '../components/CameraMovement';
import {LightingAndShadows} from '../components/LightingAndShadows';
import {SceneImage} from '../components/SceneImage';
import {PaperTag} from '../components/PaperTypography';
import {COLORS} from '../timeline';
import {useLang} from '../i18n';

// voice starts at frame 14. "Latin America" ≈ 4.76 s, "internationally" ≈ 6.45 s

const ARCS = [
  {d: 'M 520 700 Q 820 380 1180 520', delay: 40},
  {d: 'M 560 760 Q 980 330 1420 600', delay: 70},
  {d: 'M 480 640 Q 640 300 980 360', delay: 100},
  {d: 'M 600 820 Q 1100 560 1600 780', delay: 130},
  {d: 'M 1180 520 Q 1380 300 1640 420', delay: 170},
];

// 41–51 s · The city becomes a paper world; threads connect Latin America, Europe and beyond.
export const Scene05Vision: React.FC = () => {
  const frame = useCurrentFrame();
  const {t, at} = useLang();
  const LATAM_AT = at(4, 'latam', 154);
  const INTL_AT = at(4, 'intl', 206);
  return (
    <AbsoluteFill style={{background: COLORS.tealDark}}>
      <CameraMovement from={{scale: 1.3, x: 160, y: -40, rotate: -2}} to={{scale: 1.04, x: 0, y: 0, rotate: 0}}>
        <SceneImage src="img/s5-world.png" />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {ARCS.map((a, i) => {
            const p = interpolate(frame, [a.delay, a.delay + 45], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <g key={i}>
                <path d={a.d} stroke="rgba(0,0,0,0.25)" strokeWidth={6} fill="none" strokeDasharray="1200" strokeDashoffset={1200 * (1 - p)} transform="translate(4,8)" />
                <path
                  d={a.d}
                  stroke={COLORS.amber}
                  strokeWidth={5}
                  fill="none"
                  strokeDasharray="14 10"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1200,
                    strokeDashoffset: 1200 * (1 - p),
                  }}
                />
                {p >= 1 ? (
                  <circle
                    cx={Number(a.d.split(' ').slice(-2)[0])}
                    cy={Number(a.d.split(' ').slice(-1)[0])}
                    r={10 + Math.sin((frame - a.delay) / 5) * 3}
                    fill={COLORS.cream}
                    stroke={COLORS.burgundy}
                    strokeWidth={4}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      </CameraMovement>
      <LightingAndShadows warmth={0.3} vignette={0.5} lightX={60} lightY={20} />
      <div style={{position: 'absolute', left: 110, top: 100}}>
        <PaperTag delay={LATAM_AT} bg={COLORS.burgundy} rotate={-3}>
          <div style={{fontFamily: 'Archivo Black', fontSize: 40, color: COLORS.cream, letterSpacing: 2}}>
            {t.latam}
          </div>
        </PaperTag>
      </div>
      <div style={{position: 'absolute', right: 110, top: 200}}>
        <PaperTag delay={INTL_AT} bg={COLORS.cream} rotate={3}>
          <div style={{fontFamily: 'Archivo Black', fontSize: 40, color: COLORS.teal, letterSpacing: 2}}>
            {t.beyond}
          </div>
        </PaperTag>
      </div>
    </AbsoluteFill>
  );
};
