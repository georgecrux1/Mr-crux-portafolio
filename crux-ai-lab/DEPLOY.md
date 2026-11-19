# Publicar CRUX AI LAB con enlace HTTPS

Antes de publicar, en las variables del servicio:
- `APP_ACCESS_TOKEN` = cadena larga aleatoria (sin ella, cualquiera con el enlace usa tus claves de API).
- `ALLOW_PRIVATE_TARGETS=false` y, si puedes, `ALLOWED_TARGET_HOSTS=tu-bot.com,api.anthropic.com`.

## Opción A — Enlace temporal desde tu PC (gratis, 2 minutos)

Cloudflare Quick Tunnel, sin cuenta:

```bash
# 1) Arranca la app
uvicorn app.main:app --port 8000
# 2) En otra terminal (instala cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
cloudflared tunnel --url http://localhost:8000
```

Te da un `https://xxxx.trycloudflare.com`. Funciona mientras tu PC esté encendido. Define `APP_ACCESS_TOKEN` antes.

## Opción B — Render (gratis, enlace permanente)

1. Sube el repositorio a GitHub (ya incluye `crux-ai-lab/render.yaml`).
2. En https://render.com → **New → Blueprint** → elige el repo. Si no detecta el blueprint, crea **Web Service** con *Root Directory* `crux-ai-lab`, runtime Docker.
3. Render genera `APP_ACCESS_TOKEN`: cópialo desde *Environment* (lo pedirá el panel). Añade `ANTHROPIC_API_KEY` si vas a usar Claude.
4. Obtienes `https://crux-ai-lab-xxxx.onrender.com`.

Limitaciones del plan gratis: se duerme tras inactividad (primer acceso lento) y **el disco es efímero: el historial SQLite se pierde al redesplegar o reiniciar**. Para conservarlo: plan con *Persistent Disk* montado en `/app/data`.

## Opción C — VPS propio (datos persistentes)

```bash
git clone <tu-repo> && cd <repo>/crux-ai-lab
cp .env.example .env   # edita valores
docker compose up -d --build
```

HTTPS con Caddy (certificado automático): `caddy reverse-proxy --from crux.tudominio.com --to localhost:8000`.

## Comprobación tras publicar

- `https://<tu-url>/api/health` → `{"status":"ok"}`
- `https://<tu-url>/api/targets` sin token → `401`
