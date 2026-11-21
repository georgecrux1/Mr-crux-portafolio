import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile} from 'remotion';
import './fonts';
import {Format, Lang, LangProvider, useLang, voFile} from './i18n';
import {PaperUnfoldIn} from './components/PaperTransitions';
import {Subtitles} from './components/Subtitles';
import {Scene01Problem} from './scenes/Scene01Problem';
import {Scene02Founder} from './scenes/Scene02Founder';
import {Scene03Experience} from './scenes/Scene03Experience';
import {Scene04Solution} from './scenes/Scene04Solution';
import {Scene05Vision} from './scenes/Scene05Vision';
import {Scene06Investment} from './scenes/Scene06Investment';
import {SceneDef, TRANSITION} from './timeline';

const VIEWS = [Scene01Problem, Scene02Founder, Scene03Experience, Scene04Solution, Scene05Vision, Scene06Investment];

/** Music ducks under the voiceover and fades at the end. */
const makeMusicVolume = (SCENES: SceneDef[], TOTAL_FRAMES: number) => (f: number) => {
  const VO_RANGES = SCENES.map((s) => [s.from + s.voOffset, s.from + s.voOffset + s.voFrames]);
  const speaking = VO_RANGES.some(([a, b]) => f >= a - 6 && f <= b + 6);
  const nearest = Math.min(...VO_RANGES.flatMap(([a, b]) => [Math.abs(f - (a - 6)), Math.abs(f - (b + 6))]));
  const duck = speaking ? 0.16 : interpolate(nearest, [0, 12], [0.16, 0.42], {extrapolateRight: 'clamp'});
  const fadeIn = interpolate(f, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(f, [TOTAL_FRAMES - 60, TOTAL_FRAMES], [1, 0], {extrapolateLeft: 'clamp'});
  return duck * fadeIn * fadeOut;
};

export const EchoLabsPitch: React.FC<{lang: Lang; format?: Format}> = ({lang, format = 'landscape'}) => (
  <LangProvider lang={lang} format={format}>
    <Film />
  </LangProvider>
);

const Film: React.FC = () => {
  const {lang, words, timeline} = useLang();
  const SCENES = timeline.scenes;
  const musicVolume = makeMusicVolume(SCENES, timeline.total);
  return (
  <AbsoluteFill style={{background: '#1E1A17'}}>
    {SCENES.map((s, i) => {
      const View = VIEWS[i];
      const last = i === SCENES.length - 1;
      return (
        <Sequence key={s.id} name={`${String(i + 1).padStart(2, '0')} ${s.id}`} from={s.from} durationInFrames={s.duration + (last ? 0 : TRANSITION)}>
          {i === 0 ? <View /> : (
            <PaperUnfoldIn seed={s.id} mode={i % 2 ? 'fold' : 'tear'}>
              <View />
            </PaperUnfoldIn>
          )}
        </Sequence>
      );
    })}

    {/* subtitles sit above all scenes */}
    {SCENES.map((s, i) => (
      <Sequence key={`sub-${s.id}`} from={s.from} durationInFrames={s.duration}>
        <Subtitles words={words(i)} offset={s.voOffset} />
      </Sequence>
    ))}

    {/* ---------------- sound ---------------- */}
    <Audio src={staticFile('audio/music.mp3')} volume={musicVolume} />
    {SCENES.map((s, i) => (
      <Sequence key={`vo-${s.id}`} from={s.from + s.voOffset}>
        <Audio src={staticFile(voFile(lang, i))} volume={1} />
      </Sequence>
    ))}
    {SCENES.slice(1).map((s) => (
      <Sequence key={`fold-${s.id}`} from={s.from - 4}>
        <Audio src={staticFile('audio/sfx-fold.mp3')} volume={0.45} />
      </Sequence>
    ))}
    <Sequence from={SCENES[1].from + 2}>
      <Audio src={staticFile('audio/sfx-door.mp3')} volume={0.4} />
    </Sequence>
    <Sequence from={SCENES[3].from + 10}>
      <Audio src={staticFile('audio/sfx-machine.mp3')} volume={0.5} />
    </Sequence>
    <Sequence from={SCENES[5].from + timeline.endCardAt - 4}>
      <Audio src={staticFile('audio/sfx-fold.mp3')} volume={0.5} />
    </Sequence>
  </AbsoluteFill>
);
};
