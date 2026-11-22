# Rutina diaria — 4 posts de GTA 6 para @elradardelseis

Página faceless de fans de GTA 6 en español (Colombia/Latam). Se entregan 4 posts nuevos al día, a las 12:30 pm hora Colombia.

## 0. Preparar el entorno

- Rama `ccr-3d8e766c-12ml39` de `georgecrux1/Mr-crux-portafolio`. Si la carpeta `gta6-contenido/` no existe, ejecutar `git fetch origin ccr-3d8e766c-12ml39 && git checkout ccr-3d8e766c-12ml39`.
- Herramientas: Node con Playwright (preinstalado) y ffmpeg.
- Trabajar en `<scratchpad>/dia-AAAA-MM-DD/`, nunca dentro del repo (los MP4 y MP3 no se suben).
- Leer `historial.md` para no repetir temas de días anteriores.

## 1. Investigar (WebSearch, solo de los últimos 1–3 días)

Hay que encontrar 4 temas, idealmente uno de cada tipo:

1. **Error o bug viral** que hayan grabado jugadores (TikTok, YouTube, X o Reddit).
2. **Huevo de pascua o secreto** encontrado por jugadores.
3. **Noticia oficial** de Rockstar (Newswire, @RockstarGames, actualizaciones).
4. **Comunidad**: un clip curioso o divertido de otro jugador, o una pregunta o encuesta sobre el tema del día.

Reglas:
- **Nada de leaks** ni rumores sin fuente. Si un dato no está verificado, se descarta.
- Abrir cada fuente antes de usarla. Para cada video guardar: link exacto, @ del autor y plataforma.
- **No descargar ni volver a subir videos de otros.** Con videos de TikTok se usa **Stitch o Dúo**: el video que generamos es la parte del comentario. Con videos de YouTube o X se usa la plantilla `ventana`, siempre y cuando el autor dé permiso.

## 2. Escribir los 4 posts

Para cada post:
- Guion de voz de **20–30 palabras** (máximo unos 10 s), en español neutro latino, con gancho en las primeras palabras y CTA al final ("comenta", "sígueme", "guarda").
- Escoger layout:
  - `texto` para noticias, encuestas y comentarios de Stitch o Dúo.
  - `ventana` para clips con permiso.
- Campos del JSON: ver el encabezado de `render_dia.js`. El título va en 2–6 palabras, en el arreglo `head`. Si un título lleva un espacio que no se debe partir, usar `&nbsp;`.
- Crédito: `Video original: @autor · Página de fans no afiliada`, o el crédito de Rockstar si es material oficial.

## 3. Voz (ElevenLabs)

- `creative_generate_speech` con `voice_id` = `ow6VFT4afzoaAR90VHXT` (GEORGE CRUX), `model_id` = `eleven_v4`, **`generations_count` = 1**, `flow_id` = `emfgcbvF3LntWvnlzqSB`.
- Se puede iniciar un tag de emoción, por ejemplo `[excited]` o `[curious]`.
- Consultar con `creative_get_flow_run_status` hasta que termine. Descargar cada `content_url` con curl a `audio/NN.mp3`.
- Nunca repetir una generación para "reintentar", porque se cobra doble. Si falla, ese post se entrega sin voz.

## 4. Renderizar

```
cd gta6-contenido && node render_dia.js <dia>/posts.json <dia>/out
```

Revisar con Read el `_ultimo_frame.png` de cada post: que no haya texto encimado ni cortado. Si algo falla, corregir el JSON y volver a renderizar.

## 5. Entregar

- **SendUserFile** con los MP4 (y los `_marco_transparente.png` de los posts con ventana), `status: "proactive"`.
- Mensaje en español, corto. Por cada post:
  - Título.
  - Link del video original y su autor.
  - Cómo publicarlo (normal / Stitch / Dúo / CapCut con croma).
  - Texto de publicación con 3–5 hashtags.
  - Hora sugerida para publicarlo (7:00 am, 12:30 pm, 6:00 pm o 9:00 pm).
- Agregar a `historial.md` la fecha y los 4 temas con sus links. Hacer commit y push a la rama `ccr-3d8e766c-12ml39`.

## Qué NO hacer

- No usar el logo oficial ni arte de Rockstar en las plantillas.
- No inventar huevos de pascua.
- No usar música comercial.
- No publicar nada directamente en TikTok.

## Respaldo de voz
Si ElevenLabs no tiene créditos, usar Piper (voz es-carlfm-x-low) con length-scale 0.9: piper-tts en un venv más el modelo de GitHub rhasspy/piper, release v0.0.2. Avisar al usuario que es una voz gratuita.
