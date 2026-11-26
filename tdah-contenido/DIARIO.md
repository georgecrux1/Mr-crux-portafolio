# Rutina diaria — 4 posts de TDAH para @georgecrux1

Cuenta de TikTok en español (Colombia/Latam) sobre TDAH, contada por alguien que lo vive. Avatar: personaje con gorro vinotinto y gafas (`avatar.jpg`). Se entregan 4 posts nuevos al día, a las **9:00 am hora Colombia**.

Tono: cercano, sin culpa y con humor suave, pero con datos que se puedan verificar. Referencia: cuentas de TDAH en Instagram como @tdahangelvalor. La red del entorno bloquea Instagram, así que no se pudo analizar esa cuenta. No copiar su contenido.

## 0. Preparar el entorno

- Rama `ccr-3d8e766c-12ml39` de `georgecrux1/Mr-crux-portafolio`. Si la carpeta `tdah-contenido/` no existe, ejecutar `git fetch origin ccr-3d8e766c-12ml39 && git checkout ccr-3d8e766c-12ml39`.
- Herramientas: Node con Playwright (preinstalado) y ffmpeg.
- Trabajar en `<scratchpad>/dia-AAAA-MM-DD/`, nunca dentro del repo (los MP4 y MP3 no se suben).
- Leer `historial.md` para no repetir temas ni datos de días anteriores.

## 1. Investigar (WebSearch)

Cada día van 4 posts, uno de cada tipo:

1. **Noticia**: estudio, congreso o noticia de salud sobre TDAH de los últimos 1–7 días.
2. **Dato curioso**: una cifra o hallazgo llamativo que venga de un estudio o de una institución (puede ser de los últimos 2 años).
3. **Cómo lidiar con él**: 3–4 estrategias prácticas (tiempo, foco, orden, emociones, dinero, sueño, trabajo, estudio, pareja).
4. **Mito vs realidad**, o una pregunta para la comunidad ("¿te pasa?").

Fuentes confiables, de mejor a peor: OMS/OPS, CDC, NIMH, NICE/NHS, CHADD, ADDitude (para estrategias), universidades (UCL, Karolinska, etc.), revistas (JAMA, Lancet, Nature, Frontiers), Society for Neuroscience, EurekAlert, ScienceDaily, Medical Xpress, PsyPost, psiquiatria.com, Infocop, y medios grandes (El País, BBC Mundo, Infobae, El Tiempo).

Reglas:
- **Nunca inventar** cifras ni estudios. Si no se puede verificar, no se usa.
- Un estudio presentado en un congreso, o que todavía no ha sido revisado por pares, se marca así: "estudio sin publicar" / "según…". Lo que es solo asociación se marca como **"asociación, no causa"**.
- **Nada de consejos de medicación** (dosis, empezar o dejar un medicamento, marcas). Se puede contar qué dice un estudio sobre los medicamentos, sin recomendar nada.
- No diagnosticar ("si te pasa esto, tienes TDAH" está prohibido). Usar frases como "a muchas personas con TDAH les pasa".
- Nota: la red del entorno suele bloquear los sitios de noticias. Si no se puede abrir la página, verificar con 2 búsquedas que coincidan y decirlo en la entrega.
- No descargar ni volver a subir videos de otros. Para reaccionar a un clip se usa Stitch o Dúo.

## 2. Escribir los 4 posts

- Guion de voz de **20–35 palabras** (unos 10–12 s), en español neutro latino, con gancho al inicio y CTA al final.
- Para la voz Piper, escribir los números en letras ("cuarenta y dos por ciento") y evitar palabras en inglés.
- Layout `texto` de `render_dia.js`. Qué usar según el tipo:
  - Noticia → `head` + `subs`.
  - Dato curioso → `big` (la cifra) + `subs`.
  - Cómo lidiar → `list` con `check: true` (4 puntos de máximo 28 caracteres).
  - Mito vs realidad → `vs: [["MITO","…"],["REALIDAD","…"]]` + 1 `sub`.
- `kicker` de **máximo 20 caracteres** (si es más largo, choca con el avatar). `cta` corto, que quepa en 1 línea (máximo unos 26 caracteres).
- `intro` (el texto sobre el avatar al inicio): 1–3 palabras.
- `credit` obligatorio: `Fuente: … ` o `Según: …`, más `· No reemplaza consulta médica` cuando quepa.
- Paleta del avatar (ya está en las plantillas): fondo #17212C, vinotinto #D93A5E, amarillo #F2C14E.

## 3. Voz

- **Principal desde el 26/11/2026: voz clonada GRATIS con Chatterbox Multilingual** (Resemble AI, licencia MIT, corre en CPU, unos 50 s por audio). Referencia: `voz/referencia_voz.wav` (16 s de "Voz gruesa Jorge"; si el usuario manda su voz real, reemplazar este archivo).
  ```
  python3 -m venv cb && ./cb/bin/pip install chatterbox-tts "setuptools<81"
  HF_HUB_DISABLE_XET=1 ./cb/bin/python -I tdah-contenido/voz/cb_batch.py tdah-contenido/voz/referencia_voz.wav <dia>/papel.json <dia>/audio
  ```
  Genera `audio/01.mp3`…`04.mp3` a partir del campo `script` de cada post. La primera vez descarga los modelos de HuggingFace (el entorno ya tiene permitidos huggingface.co y sus CDN). Escribir los números en letras dentro de `script`.
- Si Chatterbox falla, usar ElevenLabs (si hay créditos) o Piper (abajo).

- **Principal: ElevenLabs.** `creative_generate_speech` con `voice_id` = `ow6VFT4afzoaAR90VHXT` (GEORGE CRUX), `model_id` = `eleven_v4`, **`generations_count` = 1**. Se puede iniciar un tag de emoción (`[curious]`, `[warm]`). Consultar con `creative_get_flow_run_status` y descargar cada `content_url` con curl a `audio/NN.mp3`. Nunca repetir una generación para "reintentar".
- **Respaldo de voz (si no hay créditos; el 25/11/2026 quedaban 70):** Piper con la voz **es_MX-claude-high** (escogida por el usuario porque se entiende mejor; NO usar es-carlfm-x-low). Se baja de GitHub (HuggingFace está bloqueado):
  ```
  python3 -m venv venv && ./venv/bin/pip install piper-tts
  curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_MX-claude-high.tar.bz2 | tar xj
  M=vits-piper-es_MX-claude-high/es_MX-claude-high.onnx
  echo "texto" | ./venv/bin/piper -m $M -c $M.json -f NN.wav --length-scale 1.0 --sentence-silence 0.15
  ffmpeg -i NN.wav -b:a 192k audio/NN.mp3
  ```
  Avisar al usuario que se usó la voz gratuita.

## 4. Renderizar (estilo papel, el que escogió el usuario)

Estilo "papercraft stop-motion", versión gratis, basada en `echo-labs-pitch/STYLE-GUIDE.md` (rama `ccr-ef1ba7d2-pmpv9c`) pero sin escenas de IA:
- Diorama de cartulina, personaje del gorro en papel (`personaje_papel.png`, hecho con `papelizar.py` desde la hoja de personaje).
- Paleta: burdeos #7A1F2B, ámbar #E8A33D, teal #1F5C63, crema #F3E9D8, tinta #1E1A17.
- Tipografía: Archivo Black (títulos) e Inter 700 (subtítulos), con la palabra que suena en burdeos.
- Letras que se despliegan con spring, etiquetas que caen y se balancean, temblor stop-motion, grano, viñeta.

```
cd tdah-contenido && node render_papel.js <dia>/papel.json <dia>/out
```

Campos del JSON: ver el encabezado de `render_papel.js`. Obligatorios: `script`, que es el texto EXACTO de la voz (de ahí salen los subtítulos). `sync` es la lista de palabras clave en las que aparece cada tarjeta, en orden: big → vs → list → subs. El título se ajusta solo de tamaño. Máximo: 2 subs, 4 ítems en `list`, o 1 `vs` + 1 sub.

Si hay créditos en Higgsfield o ElevenLabs, se pueden agregar escenas de IA de fondo según la guía de Echo Labs (gemini-3-pro-image + kling-3-pro), pero solo si el usuario lo pide.

Plantilla anterior (neón), por si se necesita:
```
cd tdah-contenido && node render_dia.js <dia>/posts.json <dia>/out
```

Revisar con Read el `_ultimo_frame.png` de cada post: que no haya texto encimado (CTA vs crédito, kicker vs avatar) ni cortado. Si algo falla, corregir el JSON y volver a renderizar solo ese post.

Las otras plantillas (`secretos.html`, `poema.html`, `vangogh.html`, `comedia_platos.html`, `tarjeta.html`, `frame.html`) también tienen ya los colores y el @ nuevos, para formatos especiales. `comedia_platos.html` trae textos fijos de un sketch: revisarlos antes de usarla.

## 5. Entregar

- **SendUserFile** con los 4 MP4, `status: "proactive"`.
- Mensaje en español, corto (el usuario tiene TDAH). Por cada post:
  - Título.
  - Fuente con link y qué tan confirmada está.
  - Texto de publicación con 3–5 hashtags (#tdah #tdahadultos #neurodivergente #saludmental + 1 del tema).
  - Hora sugerida para publicarlo (9:00 am, 1:00 pm, 7:00 pm o 9:30 pm).
- Agregar a `historial.md` la fecha y los 4 temas con sus fuentes. Hacer commit y push a la rama `ccr-3d8e766c-12ml39`.

## Qué NO hacer

- No usar logos ni arte de marcas, instituciones o medicamentos.
- No inventar estudios, cifras ni testimonios.
- No dar consejos de medicación ni diagnosticar.
- No usar música comercial.
- No publicar nada directamente en TikTok ni en Instagram.
