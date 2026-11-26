# Convierte un recorte de la hoja de personaje en figura de cartulina (PNG con transparencia)
import sys, numpy as np
from PIL import Image, ImageFilter, ImageChops
src, box, out = sys.argv[1], tuple(map(int, sys.argv[2].split(','))), sys.argv[3]
im = Image.open(src).convert('RGB').crop(box)
a = np.asarray(im).astype(float)
# fondo: color medio de las esquinas superiores (gris azulado liso)
bg = np.concatenate([a[:12, :12].reshape(-1, 3), a[:12, -12:].reshape(-1, 3)]).mean(0)
d = np.sqrt(((a - bg) ** 2).sum(-1))
m = Image.fromarray((d > 38).astype(np.uint8) * 255).filter(ImageFilter.MedianFilter(7))
# rellenar huecos y quedarnos con la silueta
m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
mk = np.asarray(m) > 128
# posterizar (look de capas de papel)
q = im.quantize(colors=int(sys.argv[4]) if len(sys.argv)>4 else 10, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
q = q.filter(ImageFilter.ModeFilter(9))
qa = np.asarray(q).astype(float)
# borde entre capas: oscurecer pixeles donde cambia el color (grosor de cartulina)
lab = np.asarray(q.convert('L')).astype(int)
edge = np.zeros_like(lab, bool)
edge[1:] |= lab[1:] != lab[:-1]; edge[:, 1:] |= lab[:, 1:] != lab[:, :-1]
e = Image.fromarray(edge.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
ea = np.asarray(e)[..., None] / 255.0
# sombra bajo cada capa: desplazar el borde hacia abajo-derecha
sh = np.roll(np.roll(ea, 3, 0), 2, 1)
qa = qa * (1 - 0.35 * sh) + 255 * 0.10 * ea
# textura de papel
rng = np.random.default_rng(7)
n = rng.normal(0, 1, qa.shape[:2]); n = np.asarray(Image.fromarray(((n * 20) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(float) - 128
qa = (qa + n[..., None] * 0.35).clip(0, 255)
# calidez (paleta ámbar/crema)
qa = qa * np.array([1.04, 1.0, 0.93])
fig = Image.fromarray(qa.clip(0, 255).astype(np.uint8))
H, W = mk.shape; P = 40
canvas = Image.new('RGBA', (W + 2 * P, H + 2 * P), (0, 0, 0, 0))
M = Image.new('L', canvas.size, 0); M.paste(Image.fromarray(mk.astype(np.uint8) * 255), (P, P))
cut = M.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(1))  # borde blanco troquelado
# sombra suave
shadow = Image.new('RGBA', canvas.size, (30, 20, 15, 0)); shadow.putalpha(ImageChops.offset(cut, 10, 14).filter(ImageFilter.GaussianBlur(14)).point(lambda v: v * 0.55))
canvas = Image.alpha_composite(canvas, shadow)
# grosor de cartulina (capa crema más oscura desplazada)
thick = Image.new('RGBA', canvas.size, (185, 168, 136, 255)); thick.putalpha(ImageChops.offset(cut, 3, 5))
canvas = Image.alpha_composite(canvas, thick)
paper = Image.new('RGBA', canvas.size, (243, 233, 216, 255)); paper.putalpha(cut)
canvas = Image.alpha_composite(canvas, paper)
figL = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); figL.paste(fig, (P, P)); figL.putalpha(M.filter(ImageFilter.GaussianBlur(0.7)))
canvas = Image.alpha_composite(canvas, figL)
canvas.save(out)
print(out, canvas.size)
