import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, string, string][] = [
  ['Archivo Black', 'fonts/archivo-black-latin-400-normal.woff2', '400'],
  ['Inter', 'fonts/inter-latin-500-normal.woff2', '500'],
  ['Inter', 'fonts/inter-latin-700-normal.woff2', '700'],
];

if (typeof window !== 'undefined' && 'FontFace' in window) {
  const handle = delayRender('Loading fonts');
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, {weight});
      document.fonts.add(f);
      return f.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
