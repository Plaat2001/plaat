---
name: qa-movil
description: Revisión de usabilidad y bugs en móvil de la PWA (zoom iOS, portales, cabecera sticky, solapamientos, modales). Úsala tras cualquier cambio de UI, sobre todo en el Acta VO y el tablero.
---

# QA móvil

## Reglas del proyecto (comprobar en cada cambio de UI)
- **Inputs a 16 px mínimo** en móvil (regla global `@media (max-width:768px)`); si no, iOS hace zoom.
- Viewport: `maximum-scale=1.0, user-scalable=no`.
- **Modales, `ConfirmMini` y botón flotante "+" con `createPortal` a `document.body`**; nunca `position: fixed` dentro de contenedores con scroll anidado.
- Cabecera sticky: **sin márgenes negativos verticales** (solo horizontales) → causaban solapamientos.
- Modal móvil: `maxHeight: 92dvh`, contenido con scroll interno.
- Usar `useIsMobile()` para adaptar tamaños; estados Estado/Responsable apilados en móvil.
- Hover con clases CSS globales (`.chip-link`, `.dia-toggle`, `.hov-*`), no con estilos inline.

## Prueba automatizada (Playwright MCP o `npx playwright`)
1. `npm run dev` en segundo plano.
2. Abre `http://localhost:5173` con viewport **390×844** (iPhone) y otro de **360×740** (Android).
3. Recorre: tablero → abrir obra → Acta VO → pestañas Temes/Equip/Dades → "+" (nuevo tema) → modal → cerrar.
4. Captura pantalla en cada paso y **míralas**. Busca: texto cortado, elementos que se solapan, botón "+" que no sigue el scroll, modal más alto que la pantalla, scroll horizontal.
5. Repite con viewport 1280×800 para asegurar que PC no se ha roto (tablero en 2 columnas).

## Informe
Lista de hallazgos con captura, prioridad (bloqueante / molesto / cosmético) y propuesta de arreglo.
