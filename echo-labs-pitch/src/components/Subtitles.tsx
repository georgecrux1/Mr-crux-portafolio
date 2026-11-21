import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FPS} from '../timeline';
import {NUMBER_REWRITES, useLang, Word} from '../i18n';

export type {Word};

const normalise = (words: Word[], REWRITES: [string[], string][]): Word[] => {
  const out: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    const hit = REWRITES.find(([seq]) => seq.every((s, k) => words[i + k]?.text.toLowerCase() === s));
    if (hit) {
      out.push({text: hit[1], start: words[i].start, end: words[i + hit[0].length - 1].end});
      i += hit[0].length - 1;
    } else out.push(words[i]);
  }
  return out;
};

/** Groups words into short lines: break on sentence punctuation or after ~6 words. */
const toLines = (words: Word[]) => {
  const lines: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    const brk = /[.:!?]$/.test(w.text) || (/,$/.test(w.text) && cur.length >= 3) || cur.length >= 8;
    if (brk) {
      lines.push(cur);
      cur = [];
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
};

/**
 * Word-accurate English subtitles driven by the voiceover transcript timestamps.
 * Rendered as a cream paper strip; the spoken word is inked in burgundy.
 */
export const Subtitles: React.FC<{words: Word[]; offset: number}> = ({words, offset}) => {
  const frame = useCurrentFrame();
  const {lang, portrait} = useLang();
  const t = (frame - offset) / FPS;
  const lines = toLines(normalise(words, NUMBER_REWRITES[lang]));
  const line = lines.find((l, i) => {
    const end = lines[i + 1] ? lines[i + 1][0].start : l[l.length - 1].end + 0.5;
    return t >= l[0].start - 0.05 && t < end;
  });
  if (!line) return null;
  const appear = interpolate(t, [line[0].start - 0.05, line[0].start + 0.12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: portrait ? 300 : 70,
        display: 'flex',
        justifyContent: 'center',
        opacity: appear,
        transform: `translateY(${(1 - appear) * 12}px)`,
      }}
    >
      <div
        style={{
          background: 'rgba(243,233,216,0.94)',
          padding: '14px 30px 16px',
          borderRadius: 4,
          boxShadow: '0 2px 0 #b9a888, 0 3px 0 #a49373, 0 12px 24px rgba(0,0,0,0.35)',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontWeight: 700,
          fontSize: portrait ? 46 : 42,
          letterSpacing: 0.2,
          color: '#2A221D',
          maxWidth: portrait ? 960 : 1500,
          textAlign: 'center',
        }}
      >
        {line.map((w, i) => (
          <span key={i} style={{color: t >= w.start && t < w.end + 0.08 ? '#7A1F2B' : '#2A221D'}}>
            {w.text}
            {i < line.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
