import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, string, string][] = [
  ['Archivo Black', 'fonts/archivo-black-latin-400-normal.woff2', '400'],
  ['Inter', 'fonts/inter-latin-500-normal.woff2', '500'],
  ['Inter', 'fonts/inter-latin-700-normal.woff2', '700'],
];

declare global {
  interface Window {
    __echoFontsLoaded?: boolean;
  }
}

if (typeof window !== 'undefined' && 'FontFace' in window && !window.__echoFontsLoaded) {
  window.__echoFontsLoaded = true;
  const handle = delayRender('Loading fonts', {timeoutInMilliseconds: 60000});
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      continueRender(handle);
    }
  };
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, {weight});
      document.fonts.add(f);
      return f.load();
    }),
  )
    .then(finish)
    .catch((e) => {
      console.error(e);
      finish();
    });
  // never block a render tab on fonts for more than 10 s
  setTimeout(finish, 10000);
}
