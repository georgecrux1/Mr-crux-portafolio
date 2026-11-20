import React from 'react';
import {Composition, Still} from 'remotion';
import {EchoLabsPitch} from './EchoLabsPitch';
import {CharacterModelSheet} from './scenes/CharacterModelSheet';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EchoLabsPitch" component={EchoLabsPitch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Still id="CharacterModelSheet" component={CharacterModelSheet} width={WIDTH} height={HEIGHT} />
  </>
);
