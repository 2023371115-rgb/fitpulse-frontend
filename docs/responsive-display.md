# FitPulse - Display y responsividad

## Estado

El frontend esta preparado para escritorio, movil y Smart TV.

## Vistas cubiertas

- Login y registro.
- Header con menu hamburguesa.
- Buscador y panel de resultados.
- Metas y sesiones.
- Modal de perfil.
- Modal de terminos.
- Panel de dispositivos.
- Modo Smart TV (`?tv=1`).

## Breakpoints aplicados

- Escritorio: ancho mayor a 1180 px.
- Tablet: hasta 1180 px, acciones pasan a menu hamburguesa.
- Movil: hasta 700 px, formularios y botones se apilan.
- Movil pequeno: hasta 420 px, resumen semanal baja a una columna si es necesario.

## Pruebas visuales recomendadas

Abrir DevTools y probar:

```text
390 x 844  - iPhone moderno
412 x 915  - Android comun
768 x 1024 - tablet vertical
1366 x 768 - laptop
1920 x 1080 - Smart TV
```

## Resultado esperado en movil

- El header no genera scroll horizontal.
- El boton de menu hamburguesa queda visible.
- Los botones `Agregar meta` y `Nueva sesion` no se salen de su tarjeta.
- Los formularios ocupan una columna.
- Los modales se ajustan al alto de pantalla y permiten scroll interno.
- El panel de dispositivos ocupa el ancho disponible sin tapar todo el contenido.

## Resultado esperado en Smart TV

- La URL `?tv=1` muestra dashboard de 4 tarjetas.
- El foco se mueve con flechas.
- La etiqueta `En vivo SSE` aparece si hay conexion.
- El contenido respeta safe area visual.
