// Uso: node render_dia.js <posts.json> <carpeta_salida>
// Cada post: { file, layout: "texto" | "ventana", audio: "ruta.mp3", intro, kicker, head:[], hl:[], ... }
//  - "texto":   video completo (sirve sola o como parte final de un Stitch/Dúo de TikTok). Campos: big, subs, list, check, step, vs, cta
//  - "ventana": plantilla con ventana verde para el clip (croma en CapCut). Campos: windows ("una" | "dos"), labels, cta, credit, headSize
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const DIR = __dirname;
const [, , jsonPath, outArg] = process.argv;
const OUT = path.resolve(outArg || path.join(DIR, 'out')); fs.mkdirSync(OUT, { recursive: true });
const FPS = 30;
const CR = 'Material: Rockstar Games · Página de fans no afiliada';
const posts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
for (const p of posts) {
  p.audio = path.resolve(path.dirname(jsonPath), p.audio);
  const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${p.audio}"`).toString());
  p.duration = Math.max(9000, Math.ceil((d + 0.3 + 1.5) * 10) * 100);
  if (p.layout === 'ventana') {
    const labels = p.labels || [];
    p.windows = p.windows === 'dos'
      ? [{ x: 120, y: 640, w: 840, h: 472, label: labels[0] }, { x: 120, y: 1134, w: 840, h: 472, label: labels[1] }]
      : [{ x: 0, y: 690, w: 1080, h: 608, label: labels[0], tag: p.tag }];
    if (p.windows.length === 2) { p.headSize = p.headSize || 110; p.creditTop = 1640; delete p.cta; } else { p.ctaTop = 1340; }
    p.credit = p.credit || CR;
  } else if (p.credit) { /* el template de texto también acepta credit */ }
}
(async () => {
  const browser = await chromium.launch();
  await Promise.all(posts.map(async p => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const tpl = p.layout === 'ventana' ? 'frame.html' : 'template.html';
    await page.goto('file://' + path.join(DIR, tpl));
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(c => window.build(c), p);
    if (p.credit && p.layout !== 'ventana') await page.evaluate(t => { document.getElementById('credit').textContent = t; }, p.credit);
    const suffix = p.layout === 'ventana' ? '_plantilla_verde.mp4' : '.mp4';
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', p.audio,
      '-filter_complex', '[1:a]adelay=300|300,apad,loudnorm=I=-14:TP=-1.5[a]', '-map', '0:v', '-map', '[a]', '-shortest', '-c:a', 'aac', '-b:a', '192k',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-movflags', '+faststart', path.join(OUT, p.file + suffix)]);
    const n = Math.round(p.duration / 1000 * FPS);
    for (let i = 0; i < n; i++) {
      await page.evaluate(ms => window.seek(ms), i * 1000 / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    const still = path.join(OUT, p.file + '_ultimo_frame.png');
    await page.screenshot({ path: still });
    if (p.layout === 'ventana') {
      execSync(`ffmpeg -y -loglevel error -i "${still}" -vf "colorkey=0x00FF00:0.08:0.0,format=rgba" "${path.join(OUT, p.file + '_marco_transparente.png')}"`);
    }
    console.log('ok', p.file, p.layout, p.duration + 'ms');
  }));
  await browser.close();
})();
