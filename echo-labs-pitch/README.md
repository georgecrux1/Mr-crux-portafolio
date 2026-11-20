# Echo Labs — Animated Investor Pitch (3D Papercraft)

64-second, 1920×1080, 30 fps pitch film built with **Remotion + React**.
Visual sets and the founder character were generated with ElevenLabs image models
(gemini-3-pro-image, using Jorge's photo as identity reference) and animated in
layers in Remotion.

## Render

```bash
npm install
npm run studio                       # live preview / edit
npx remotion render EchoLabsPitch out/echo-labs-pitch.mp4 --crf=18      # English
npx remotion render EchoLabsPitchES out/echo-labs-pitch-es.mp4 --crf=18 # Español
npx remotion still CharacterModelSheet out/character-model-sheet.png
```

## Storyboard & timing

| # | Scene | Time | Visual | On-screen |
|---|-------|------|--------|-----------|
| 01 | Problem | 0–10 s | Dolly down an empty paper street; parallax skyline pops up | THE PROBLEM · WHERE ARE THE CUSTOMERS? |
| 02 | Founder | 10–18 s | Paper door opens, pull-back reveal of Jorge | JORGE AMOROCHO CRUZ · Founder |
| 03 | Experience | 18–30 s | Pop-up ad studio, chat bubbles burst out | **237** WHATSAPP ENQUIRIES · LEADS ≠ CUSTOMERS |
| 04 | Solution | 30–41 s | Lever → machine powers up, 3 modules linked | 01 / 02 / 03 cards → ECHO LABS logo |
| 05 | Vision | 41–50.5 s | Paper globe, threads LatAm → Europe | STARTING IN LATIN AMERICA → EUROPE & BEYOND |
| 06 | Investment | 50.5–64 s | Hero shot, $5,000 assembles, torn-paper end card | $5,000 · uses · tagline |

Narration was trimmed (scenes 2–3) so it fits at natural speed. The voice is "George cruz"
(ElevenLabs). Subtitles use word-level timestamps from transcribing the narration
(`src/captions/*.json`).

## Languages

`src/i18n.tsx` holds on-screen strings, voiceover files and word-timing captions for
`en` and `es`. On-screen beats (the 237 counter, module cards, tags) are anchored to the
moment the matching word is spoken, so they stay in sync in both languages.

## Architecture

```
src/
  timeline.ts            scene timing, VO offsets, palette
  EchoLabsPitch.tsx      composition: scenes, transitions, subtitles, mix (music ducking)
  fonts.ts               Archivo Black + Inter (local woff2)
  components/
    PaperCharacter.tsx   founder cut-out puppet (breathing, stop-motion, pop-up stand)
    PaperCity.tsx        multi-depth parallax skyline
    PaperBuildings.tsx   SVG cardstock buildings with lit windows
    PaperTypography.tsx  unfolding cardstock letters + hanging paper tags
    PaperTransitions.tsx page-fold and torn-paper scene transitions
    CameraMovement.tsx   eased dolly/zoom with stepped handheld drift, parallax layers
    LightingAndShadows.tsx warm key light, vignette, animated paper grain, shadow recipe
    EchoLogo.tsx         concentric-ring logo mark + count-up helper
    Subtitles.tsx        word-synced captions on a paper strip
    SceneImage.tsx       full-bleed generated set
  scenes/Scene01…06      one file per scene (edit independently)
  scenes/CharacterModelSheet.tsx  reference still
public/img               character sheet, cut-outs, 6 scene sets
public/audio             vo1–6, original score (instrumental), SFX
```

All figures shown are the founder's own claims (237 enquiries, $5,000 ask); no other results are stated.
