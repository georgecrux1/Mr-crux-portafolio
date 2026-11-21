import React from 'react';
import {Composition, Still} from 'remotion';
import {EchoLabsPitch} from './EchoLabsPitch';
import {CharacterModelSheet} from './scenes/CharacterModelSheet';
import {buildTimeline, DIMENSIONS, Format, FPS, Lang} from './timeline';

const VARIANTS: {id: string; lang: Lang; format: Format}[] = [
  {id: 'EchoLabsPitch', lang: 'en', format: 'landscape'},
  {id: 'EchoLabsPitchES', lang: 'es', format: 'landscape'},
  {id: 'EchoLabsPitchVertical', lang: 'en', format: 'portrait'},
  {id: 'EchoLabsPitchVerticalES', lang: 'es', format: 'portrait'},
];

export const RemotionRoot: React.FC = () => (
  <>
    {VARIANTS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={EchoLabsPitch}
        defaultProps={{lang: v.lang, format: v.format}}
        durationInFrames={buildTimeline(v.lang).total}
        fps={FPS}
        width={DIMENSIONS[v.format].width}
        height={DIMENSIONS[v.format].height}
      />
    ))}
    <Still id="CharacterModelSheet" component={CharacterModelSheet} width={1920} height={1080} />
  </>
);
