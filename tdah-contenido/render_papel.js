// Uso: node render_papel.js <posts.json> <carpeta_salida> [soloPreview: ms,ms,...]
// Estilo papercraft (papel.html). Cada post:
// { file, audio, script (texto exacto de la voz), intro, tag, title:["LÍNEA",...], hl:[índices de línea en ámbar], titleSize,
//   big (número que sube), bigSuffix, subs:[...], list:[...], vs:[["MITO","…"],["REALIDAD","…"]],
//   sync:["palabra", ...] (cada elemento del contenido aparece cuando la voz dice esa palabra), cta, credit }
// Subtítulos: tiempos por palabra estimados por longitud (o reales si el post trae words:[{w,s,e}] en ms).
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path'), fs = require('fs');
const DIR = __dirname, FPS = 30, LEAD = 2300; // la voz entra después de la intro del personaje
const [, , jsonPath, outArg, previewArg] = process.argv;
const OUT = path.resolve(outArg || path.join(DIR, 'out')); fs.mkdirSync(OUT, { recursive: true });
const posts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ%]/g, '');

function wordTimes(script, durMs) {
  const ws = script.split(/\s+/).filter(Boolean);
  const weight = w => w.replace(/[^\p{L}\p{N}]/gu, '').length + 2 + (/[.,:;?!]$/.test(w) ? 5 : 0);
  const tot = ws.reduce((a, w) => a + weight(w), 0);
  let t = LEAD, g = 0, n = 0; const out = [];
  ws.forEach((w, i) => {
    const d = durMs * weight(w) / tot;
    out.push({ w, s: Math.round(t), e: Math.round(t + d), g });
    t += d; n++;
    if (n >= 5 || /[.,:;?!]$/.test(w)) { g++; n = 0; }
  });
  return out;
}

for (const p of posts) {
  p.audio = path.resolve(path.dirname(jsonPath), p.audio);
  const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${p.audio}"`).toString()) * 1000;
  p.voiceMs = d;
  p.duration = Math.ceil((LEAD + d + 2600) / 100) * 100;
  if (!p.words) p.words = wordTimes(p.script, d);
  if (p.sync) {
    let from = 0;
    p.at = p.sync.map(k => { if (k == null) return null; const i = p.words.findIndex((w, j) => j >= from && norm(w.w).startsWith(norm(k))); if (i < 0) return null; from = i + 1; return Math.max(2300, p.words[i].s - 150); });
  }
}

(async () => {
  const browser = await chromium.launch();
  await Promise.all(posts.map(async p => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await page.goto('file://' + path.join(DIR, 'papel.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
    await page.evaluate(c => window.build(c), p);
    if (previewArg) {
      for (const ms of previewArg.split(',').map(Number)) { await page.evaluate(m => window.seek(m), ms); await page.screenshot({ path: path.join(OUT, `${p.file}_${ms}.png`) }); }
      console.log('preview', p.file, p.duration + 'ms'); return;
    }
    const secs = (p.duration / 1000).toFixed(2);
    // colchón musical suave generado (sin música comercial): sube en las pausas y baja al 16 % cuando habla la voz
    const pad = `aevalsrc='0.20*sin(2*PI*110*t)+0.14*sin(2*PI*164.81*t)+0.12*sin(2*PI*220*t)+0.08*sin(2*PI*277.18*t)+0.06*sin(2*PI*329.63*t)+0.05*(sin(2*PI*880*t)*exp(-6*mod(t,0.5)))':s=48000:d=${secs},` +
      `tremolo=f=0.25:d=0.4,lowpass=f=1400,volume=0.42,afade=t=in:d=1.5,afade=t=out:st=${(p.duration / 1000 - 2).toFixed(2)}:d=2[pad]`;
    const filt = `${pad};[1:a]aresample=48000,adelay=${LEAD}|${LEAD},apad,asplit=2[v][sc];[pad][sc]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=400:makeup=1[duck];` +
      `[v][duck]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5[a]`;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-nostdin', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', p.audio,
      '-filter_complex', filt, '-map', '0:v', '-map', '[a]', '-t', secs, '-c:a', 'aac', '-b:a', '192k',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', path.join(OUT, p.file + '.mp4')]);
    ff.stdin.on('error', () => {});
    const n = Math.round(p.duration / 1000 * FPS);
    for (let i = 0; i < n; i++) {
      await page.evaluate(ms => window.seek(ms), i * 1000 / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    await page.screenshot({ path: path.join(OUT, p.file + '_ultimo_frame.png') });
    console.log('ok', p.file, p.duration + 'ms');
  }));
  await browser.close();
})();
