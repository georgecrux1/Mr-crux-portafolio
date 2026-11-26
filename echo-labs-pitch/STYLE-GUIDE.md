# Guía de estilo — Echo Labs "Papercraft Stop-Motion"

Usa esto para replicar el estilo en cualquier video nuevo.

## 1. Estilo visual (prompt base para imágenes)

Pega esto al final de cualquier prompt de imagen:

```
Premium handcrafted 3D papercraft miniature diorama, layered colored cardstock,
visible paper edges and thickness, soft realistic shadows between layers,
folded paper construction, tilt-shift shallow depth of field, warm cinematic
lighting, stop-motion film still. Palette: warm amber, muted teal, burgundy,
cream paper. No readable text, no numbers.
```

- **Modelo de imagen:** `gemini-3-pro-image` (ElevenLabs).
- **Formato:** 16:9 para horizontal, 9:16 a 2K para vertical.
- **Coherencia:** pasa siempre como referencia la **hoja de personaje** (`public/img/character-sheet.png`) y la foto de la cara.
- **Texto en pantalla:** nunca lo dejes en la imagen; ponlo después en Remotion.

## 2. Personaje (Jorge en papel)

```
The exact papercraft character from the character sheet reference: dark curly
hair, black rectangular glasses, short salt-and-pepper stubble, charcoal
t-shirt with skull-and-aviator-goggles graphic, burgundy suspenders with silver
clips, black cargo pants, black-and-white low-top sneakers, black wristwatch.
Friendly but confident expression. Keep face, glasses and outfit identical.
```

## 3. Paleta de color

| Nombre | Hex | Uso |
|---|---|---|
| Cream | `#F3E9D8` | Tarjetas, textos claros |
| Paper | `#EADBC2` | Fondos claros |
| Ink | `#1E1A17` | Textos oscuros, fondo base |
| Burgundy | `#7A1F2B` | Acento principal (tirantes, etiquetas, números) |
| Burgundy dark | `#4E121B` | Grosor/sombra de números |
| Amber | `#E8A33D` | Luz cálida, frase destacada |
| Teal | `#1F5C63` | Acento secundario |
| Teal dark | `#123A3F` | Fondos nocturnos |
| Green | `#3BB273` | Solo para WhatsApp |

## 4. Movimiento (video IA)

- **Modelo:** `kling-3-pro`, start frame = imagen de la escena, 1080p, sin audio, 10–15 s.
- **Plantilla de prompt:**

```
Stop-motion papercraft animation of this exact scene. [ACCIÓN CONCRETA DEL
PERSONAJE + 2-3 objetos de papel que se mueven]. Slow cinematic camera
[push-in / dolly forward / rise / orbit]. Keep his face, glasses and outfit
exactly the same. Handcrafted cardstock look, visible paper edges, smooth motion.
```

- **Negative prompt:** `text, letters, numbers, face morphing, changing face, realistic humans, live action, blurry, distorted`
- **Regla:** una acción clara por escena (abrir puerta, teclear, tirar palanca, señalar) más un movimiento lento de cámara.

## 5. Animación en Remotion (encima del video)

- **Cámara:** dolly suave con easing `bezier(0.45, 0, 0.2, 1)` y un temblor "a mano" cada 2 fotogramas de ±1,5 px (sensación stop-motion).
- **Transiciones:** se alternan:
  - página que se dobla (`rotateY` de −100° a 0°, 18 fotogramas, con sombra de pliegue);
  - papel rasgado (borde irregular con `clipPath`).
- **Tipografía de papel:**
  - cada letra se despliega desde abajo (`rotateX` de −95° a 0°) con spring `damping 11, stiffness 140`, cuantizado en pasos de 1/12;
  - grosor de cartulina con 6–9 sombras de texto apiladas.
- **Etiquetas de papel (tags):** caen desde arriba, se balancean 3° y se amortiguan; tienen 2 bordes de grosor (`#b9a888`, `#a49373`) y sombra suave.
- **Luz:**
  - foco cálido radial en modo screen con parpadeo del ±3 % cada 4 fotogramas;
  - viñeta oscura del 45–60 %;
  - grano de papel (`feTurbulence`) que cambia cada 3 fotogramas.
- **Contadores:** número que sube con ease-out cúbico en 40 fotogramas (p. ej. 0 → 237).
- **Sincronía:** cada elemento aparece cuando la voz dice la palabra clave (marcas de tiempo por palabra de la transcripción).

## 6. Tipografía

- **Títulos:** Archivo Black, en mayúsculas, con letterSpacing 1–3.
- **Subtítulos:** Inter 700 sobre una tira de papel crema.
  - La palabra que suena en ese momento se pinta en burdeos `#7A1F2B`.
  - Posición: abajo; en vertical, a 300 px del borde para no chocar con la interfaz de TikTok/Reels.

## 7. Sonido

- **Voz:** "Voz gruesa Jorge" (`YXAI7CSvIsaQpUusOC9o`), modelo `eleven_multilingual_v2`.
- **Música:** `eleven_music_v2_5`, instrumental:
  - empieza curiosa (pizzicato, celesta);
  - crece con guitarra y percusión;
  - termina en un clímax inspirador;
  - baja de volumen al 16 % mientras habla la voz y sube al 42 % en las pausas.
- **Efectos:** doblez de papel en cada transición, puerta y pasos al aparecer el personaje, palanca y engranajes de papel en la máquina.

## 8. Estructura de cada escena

1. Escena IA en movimiento de fondo.
2. Capa de cámara (dolly + temblor).
3. Luz, viñeta y grano.
4. Etiquetas y números de papel sincronizados con la voz.
5. Subtítulos.
6. Transición de papel hacia la siguiente escena.
