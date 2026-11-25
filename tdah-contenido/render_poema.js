// Uso: node render_poema.js <poema.json> <salida.mp4> [fps=60] [previewMs,...]
// Video calmado tipo poema: un verso por escena (voz por verso) + colchón sonoro suave generado con ffmpeg.
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path'), fs = require('fs');
const DIR = __dirname;
const [, , cfgPath, outPath, fpsArg, previewArg] = process.argv;
const FPS = parseInt(fpsArg || '60', 10);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const base = path.dirname(path.resolve(cfgPath));
const LEAD = 900, TAIL = 1700;
let t = 600;
for (const g of cfg.segments) {
  g.start = t;
  if (g.type === 'verse') {
    g.audio = path.resolve(base, g.audio);
    g.voice = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${g.audio}"`).toString()) * 1000;
    g.lead = LEAD; g.dur = Math.round(LEAD + g.voice + TAIL);
  } else g.dur = g.dur || 4500;
  t += g.dur;
}
cfg.total = t;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(DIR, cfg.template || 'poema.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(c => window.build(c), cfg);
  await page.evaluate(urls => Promise.all(urls.map(u => { const im = new Image(); im.src = u; return im.decode(); })),
    cfg.segments.filter(g => g.image).map(g => g.image));
  await page.waitForTimeout(300);
  if (previewArg) {
    for (const ms of previewArg.split(',').map(Number)) { await page.evaluate(m => window.seek(m), ms); await page.screenshot({ path: `${outPath}_${ms}.png` }); }
    console.log(cfg.segments.map(g => `${g.type}@${g.start}+${g.dur}`).join(' '), 'total', t); await browser.close(); return;
  }
  const verses = cfg.segments.filter(g => g.type === 'verse');
  const secs = (t / 1000).toFixed(2);
  // colchón: acorde suave (La mayor 9) con trémolo lento, filtrado, muy bajo
  const pad = `aevalsrc='0.20*sin(2*PI*110*t)+0.14*sin(2*PI*164.81*t)+0.12*sin(2*PI*220*t)+0.08*sin(2*PI*277.18*t)+0.06*sin(2*PI*329.63*t)+0.05*sin(2*PI*493.88*t)':s=48000:d=${secs},` +
    `tremolo=f=0.15:d=0.5,lowpass=f=900,volume=0.22,afade=t=in:d=3,afade=t=out:st=${(t / 1000 - 4).toFixed(2)}:d=4[pad]`;
  const ins = [], filt = [pad];
  verses.forEach((g, i) => { ins.push('-i', g.audio); const ms = g.start + g.lead; filt.push(`[${i + 1}:a]adelay=${ms}|${ms},volume=1.0[v${i}]`); });
  const mix = verses.map((_, i) => `[v${i}]`).join('') + `[pad]amix=inputs=${verses.length + 1}:normalize=0,loudnorm=I=-15:TP=-1.5[a]`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...ins,
    '-filter_complex', filt.join(';') + ';' + mix, '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-r', String(FPS), '-t', secs, '-movflags', '+faststart', outPath]);
  const n = Math.round(t / 1000 * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate(ms => window.seek(ms), i * 1000 / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('ok', outPath, t + 'ms');
  await browser.close();
})();
