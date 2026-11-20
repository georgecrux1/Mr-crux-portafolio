import React, {createContext, useContext} from 'react';
import en1 from './captions/vo1.json';
import en2 from './captions/vo2.json';
import en3 from './captions/vo3.json';
import en4 from './captions/vo4.json';
import en5 from './captions/vo5.json';
import en6 from './captions/vo6.json';
import es1 from './captions/es-vo1.json';
import es2 from './captions/es-vo2.json';
import es3 from './captions/es-vo3.json';
import es4 from './captions/es-vo4.json';
import es5 from './captions/es-vo5.json';
import es6 from './captions/es-vo6.json';
import {FPS, SCENES} from './timeline';

export type Lang = 'en' | 'es';
export type Word = {text: string; start: number; end: number};

const WORDS: Record<Lang, Word[][]> = {
  en: [en1, en2, en3, en4, en5, en6],
  es: [es1, es2, es3, es4, es5, es6],
};

export const voFile = (lang: Lang, i: number) => (lang === 'en' ? `audio/vo${i + 1}.mp3` : `audio/es-vo${i + 1}.mp3`);

/** Spoken numbers are shown as figures in subtitles. */
export const NUMBER_REWRITES: Record<Lang, [string[], string][]> = {
  en: [
    [['two', 'hundred', 'thirty-seven'], '237'],
    [['five', 'thousand', 'dollars,'], '$5,000,'],
  ],
  es: [
    [['doscientas', 'treinta', 'y', 'siete'], '237'],
    [['cinco', 'mil', 'dólares,'], '$5,000,'],
  ],
};

export const STRINGS = {
  en: {
    problem: 'THE PROBLEM',
    whereCustomers: 'WHERE ARE THE CUSTOMERS?',
    founderRole: 'FOUNDER · ECHO LABS',
    leadsNot: ['LEADS', 'CUSTOMERS'],
    enquiries: 'WHATSAPP ENQUIRIES',
    oneCampaign: 'FROM ONE REAL CAMPAIGN',
    modules: ['DIGITAL ADVERTISING', 'CREATIVE CONTENT', 'MARKETING AUTOMATION'],
    oneSystem: 'ONE CUSTOMER ACQUISITION SYSTEM',
    latam: 'STARTING IN LATIN AMERICA',
    beyond: '→ EUROPE & BEYOND',
    uses: ['STRONGER TECHNOLOGY', 'INTERNATIONAL ACQUISITION SYSTEM', 'MORE BUSINESSES GROWING'],
    tag1: "WE DON'T SELL LIKES.",
    tag2: 'WE HELP BUSINESSES GET CUSTOMERS.',
  },
  es: {
    problem: 'EL PROBLEMA',
    whereCustomers: '¿DÓNDE ESTÁN LOS CLIENTES?',
    founderRole: 'FUNDADOR · ECHO LABS',
    leadsNot: ['LEADS', 'CLIENTES'],
    enquiries: 'CONSULTAS POR WHATSAPP',
    oneCampaign: 'DE UNA CAMPAÑA REAL',
    modules: ['PUBLICIDAD DIGITAL', 'CONTENIDO CREATIVO', 'AUTOMATIZACIÓN DE MARKETING'],
    oneSystem: 'UN SOLO SISTEMA DE CAPTACIÓN DE CLIENTES',
    latam: 'EMPEZANDO EN LATINOAMÉRICA',
    beyond: '→ EUROPA Y MÁS ALLÁ',
    uses: ['TECNOLOGÍA MÁS FUERTE', 'SISTEMA INTERNACIONAL DE CAPTACIÓN', 'MÁS NEGOCIOS CRECIENDO'],
    tag1: 'NO VENDEMOS LIKES.',
    tag2: 'AYUDAMOS A LOS NEGOCIOS A CONSEGUIR CLIENTES.',
  },
};

/** Words that drive on-screen beats, per scene and language. */
const ANCHORS: Record<string, Record<Lang, string>> = {
  number: {en: 'two', es: 'doscientas'},
  leads: {en: 'But', es: 'Pero'},
  mod1: {en: 'advertising,', es: 'publicidad'},
  mod2: {en: 'creative', es: 'contenido'},
  mod3: {en: 'automation.', es: 'automatización.'},
  latam: {en: 'Latin', es: 'Latinoamérica'},
  intl: {en: 'internationally.', es: 'internacional.'},
  use1: {en: 'technology,', es: 'tecnología,'},
  use2: {en: 'acquisition', es: 'captación'},
  use3: {en: 'help', es: 'ayudaré'},
};

type Ctx = {lang: Lang; t: (typeof STRINGS)['en']; words: (scene: number) => Word[]; at: (scene: number, key: string, fallback: number) => number};

const LangContext = createContext<Ctx | null>(null);

export const LangProvider: React.FC<{lang: Lang; children: React.ReactNode}> = ({lang, children}) => {
  const value: Ctx = {
    lang,
    t: STRINGS[lang],
    words: (scene) => WORDS[lang][scene],
    // scene-local frame at which the anchor word starts being spoken
    at: (scene, key, fallback) => {
      const target = ANCHORS[key]?.[lang]?.toLowerCase();
      const w = WORDS[lang][scene].find((x) => x.text.toLowerCase() === target);
      return w ? SCENES[scene].voOffset + Math.round(w.start * FPS) : fallback;
    },
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => {
  const c = useContext(LangContext);
  if (!c) throw new Error('useLang outside LangProvider');
  return c;
};
