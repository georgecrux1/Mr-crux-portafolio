import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '../fonts';
import {COLORS} from '../timeline';

/** Reference still: the locked character model sheet + palette used across every scene. */
export const CharacterModelSheet: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.paper, padding: 60, fontFamily: 'Inter'}}>
    <div style={{fontFamily: 'Archivo Black', fontSize: 54, color: COLORS.ink}}>ECHO LABS · FOUNDER CHARACTER SHEET</div>
    <div style={{fontSize: 26, fontWeight: 700, color: COLORS.burgundy, letterSpacing: 3, marginTop: 6}}>
      FRONT · THREE-QUARTER · PROFILE · BACK — 3D PAPERCRAFT
    </div>
    <Img src={staticFile('img/character-sheet.png')} style={{width: 1500, marginTop: 30, borderRadius: 8, boxShadow: '0 14px 30px rgba(0,0,0,0.3)'}} />
    <div style={{position: 'absolute', right: 60, top: 200, display: 'flex', flexDirection: 'column', gap: 16}}>
      {Object.entries(COLORS).map(([k, v]) => (
        <div key={k} style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 60, height: 60, background: v, borderRadius: 4, boxShadow: '0 3px 0 rgba(0,0,0,0.2)'}} />
          <div style={{fontSize: 20, fontWeight: 700, color: COLORS.ink}}>{k}<br />{v}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
