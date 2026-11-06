# FitPulse Frontend

Aplicacion web Angular para FitPulse Health Lab.

## Incluye

- Login y registro de usuarios.
- Dashboard de metas y sesiones.
- Buscador tipo Elasticsearch (modo *FitPulse*): sesiones, metas, reportes y más, con resaltado, facetas y tolerancia a errores. Modos *Archivos* y *Web* como antes.
- **Reportar fallo**: formulario de tickets y lista de mis reportes con su estado.
- Panel Admin con pestaña **Reportes de fallos** para cambiar estado y responder al usuario.
- Panel de apariencia con temas.
- Menu hamburguesa responsive.
- Modal de terminos y uso.
- Vista Smart TV con `?tv=1`.
- Dashboard Flutter Web embebido desde `src/assets/flutter_dashboard`.

## Requisitos

- Node.js
- Backend FitPulse corriendo en `http://localhost:3000`

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm start
```

App web:

```text
http://localhost:4200
```

Smart TV:

```text
http://localhost:4200?tv=1
```

## Despliegue en AWS

En producción la web usa `apiUrl: '/api'` (mismo servidor). El script `deploy/aws.sh` del repo `fitpulse-backend` la compila y la sirve con nginx en la instancia EC2.

## Build

```bash
npm run build
```

## Version estable

La version estable para entrega es `1.0.0`.

Evidencia local del frontend:

```text
src/assets/version.json
```

Evidencia desplegada esperada:

```text
/assets/version.json
```

Checklist de display y responsividad:

```text
docs/responsive-display.md
```

## Entrega academica

Este repo cubre la parte web: maquetacion, contenido dinamico, buscador, popups,
terminos de uso, menu hamburguesa, dashboard y enlace visual con Smart TV/wearable.
