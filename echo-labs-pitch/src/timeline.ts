export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TRANSITION = 18; // frames of overlap between scenes

export type SceneDef = {
  id: string;
  from: number; // start frame
  duration: number; // frames (excluding outgoing overlap)
  vo: string; // voiceover file in /public/audio
  voOffset: number; // frames after scene start
  voFrames: number; // length of voiceover clip
  text: string; // exact narration (subtitles)
};

// Voiceover durations measured with ffprobe (seconds * 30).
export const SCENES: SceneDef[] = [
  {
    id: 'problem',
    from: 0,
    duration: 300,
    vo: 'audio/vo1.mp3',
    voOffset: 24,
    voFrames: 203,
    text: "Small businesses don't fail because they lack good products. Many fail because they can't consistently find customers.",
  },
  {
    id: 'founder',
    from: 300,
    duration: 240,
    vo: 'audio/vo2.mp3',
    voOffset: 14,
    voFrames: 217,
    text: "I'm Jorge, founder of Echo Labs. After years in digital advertising and marketing, I've seen this problem firsthand.",
  },
  {
    id: 'experience',
    from: 540,
    duration: 360,
    vo: 'audio/vo3.mp3',
    voOffset: 16,
    voFrames: 323,
    text: "I've run real campaigns. One generated 237 WhatsApp enquiries. But leads aren't enough. Businesses need a system that turns them into customers.",
  },
  {
    id: 'solution',
    from: 900,
    duration: 330,
    vo: 'audio/vo4.mp3',
    voOffset: 30,
    voFrames: 229,
    text: "That's why I'm building Echo Labs: a customer acquisition service combining digital advertising, creative content and automation.",
  },
  {
    id: 'vision',
    from: 1230,
    duration: 285,
    vo: 'audio/vo5.mp3',
    voOffset: 14,
    voFrames: 222,
    text: 'My vision is to make professional marketing accessible to small businesses, starting in Latin America and expanding internationally.',
  },
  {
    id: 'investment',
    from: 1515,
    duration: 405,
    vo: 'audio/vo6.mp3',
    voOffset: 12,
    voFrames: 289,
    text: "With five thousand dollars, I'll strengthen our technology, build our international client acquisition system, and help more businesses grow.",
  },
];

export const TOTAL_FRAMES = 1920; // 64 s

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
