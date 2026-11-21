export const FPS = 30;
export const TRANSITION = 18; // frames of overlap between scenes

export type Lang = 'en' | 'es';
export type Format = 'landscape' | 'portrait';

export const DIMENSIONS: Record<Format, {width: number; height: number}> = {
  landscape: {width: 1920, height: 1080},
  portrait: {width: 1080, height: 1920},
};

export type SceneDef = {
  id: string;
  from: number; // start frame
  duration: number; // frames (excluding outgoing overlap)
  voOffset: number; // frames after scene start
  voFrames: number; // length of voiceover clip
};

// Voiceover lengths in frames (ffprobe seconds * 30, rounded up) — voice "Voz gruesa Jorge" (YXAI7CSvIsaQpUusOC9o).
const VO_FRAMES: Record<Lang, number[]> = {
  en: [247, 222, 369, 251, 326, 294],
  es: [285, 196, 342, 294, 304, 333],
};

const BASE = [
  {id: 'problem', min: 300, voOffset: 24, pad: 20},
  {id: 'founder', min: 240, voOffset: 14, pad: 20},
  {id: 'experience', min: 360, voOffset: 16, pad: 24},
  {id: 'solution', min: 330, voOffset: 30, pad: 75}, // room for the logo reveal after narration
  {id: 'vision', min: 285, voOffset: 14, pad: 20},
  {id: 'investment', min: 0, voOffset: 12, pad: 0},
];
export const END_CARD_FRAMES = 105;

export const VO_OFFSETS = BASE.map((b) => b.voOffset);

/** Scene timing derived from the real voiceover length, so nothing is ever cut. */
export const buildTimeline = (lang: Lang) => {
  let from = 0;
  const scenes: SceneDef[] = BASE.map((b, i) => {
    const voFrames = VO_FRAMES[lang][i];
    const last = i === BASE.length - 1;
    const endCardAt = Math.max(300, b.voOffset + voFrames + 10);
    const duration = last ? endCardAt + END_CARD_FRAMES : Math.max(b.min, b.voOffset + voFrames + b.pad);
    const s = {id: b.id, from, duration, voOffset: b.voOffset, voFrames};
    from += duration;
    return s;
  });
  const last = scenes[scenes.length - 1];
  return {scenes, total: from, endCardAt: last.duration - END_CARD_FRAMES};
};

export const COLORS = {
  cream: '#F3E9D8',
  paper: '#EADBC2',
  ink: '#1E1A17',
  burgundy: '#7A1F2B',
  burgundyDark: '#4E121B',
  amber: '#E8A33D',
  teal: '#1F5C63',
  tealDark: '#123A3F',
  green: '#3BB273',
};
