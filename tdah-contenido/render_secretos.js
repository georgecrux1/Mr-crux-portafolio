// Uso: node render_secretos.js <video.json> <salida.mp4> [fps=60] [previewMs,...]
// video.json: { part, credit, segments:[{type:"hook"|"secret"|"cta", audio:"ruta.mp3", ...campos de secretos.html}] }
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path'), fs = require('fs');
const DIR = __dirname;
const [, , cfgPath, outPath, fpsArg, previewArg] = process.argv;
const FPS = parseInt(fpsArg || '60', 10);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const base = path.dirname(path.resolve(cfgPath));
const LEAD = 250; // ms de silencio antes de cada voz
let t = 0;
for (const g of cfg.segments) {
  g.audio = path.resolve(base, g.audio);
  const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${g.audio}"`).toString()) * 1000;
  g.start = t; g.dur = Math.round(d + LEAD + (g.type === 'cta' ? 1400 : 350));
  if (g.type === 'hook') g.dur = Math.max(g.dur, 2800);
  if (g.type === 'secret' && g.stampWord != null) g.stampAt = Math.round(LEAD + d * g.stampWord);
  t += g.dur;
}
cfg.total = t;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(DIR, 'secretos.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(c => window.build(c), cfg);
  if (previewArg) {
    for (const ms of previewArg.split(',').map(Number)) {
      await page.evaluate(m => window.seek(m), ms);
      await page.screenshot({ path: `${outPath}_${ms}.png` });
    }
    console.log('segments', cfg.segments.map(g => `${g.type}@${g.start}+${g.dur}`).join(' '), 'total', t);
    await browser.close(); return;
  }
  const ins = [], filt = [];
  cfg.segments.forEach((g, i) => { ins.push('-i', g.audio); const ms = g.start + LEAD; filt.push(`[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`); });
  const mix = cfg.segments.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${cfg.segments.length}:normalize=0,apad,loudnorm=I=-14:TP=-1.5[a]`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...ins,
    '-filter_complex', filt.join(';') + ';' + mix, '-map', '0:v', '-map', '[a]', '-shortest', '-c:a', 'aac', '-b:a', '192k',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-r', String(FPS), '-movflags', '+faststart', outPath]);
  const n = Math.round(t / 1000 * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate(ms => window.seek(ms), i * 1000 / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('ok', outPath, t + 'ms', n + ' frames');
  await browser.close();
})();
