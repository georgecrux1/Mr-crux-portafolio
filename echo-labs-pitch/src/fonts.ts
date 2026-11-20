import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// @remotion/fonts handles delayRender/continueRender per render tab.
loadFont({family: 'Archivo Black', url: staticFile('fonts/archivo-black-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
