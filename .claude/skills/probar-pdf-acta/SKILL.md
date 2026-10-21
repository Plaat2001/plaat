---
name: probar-pdf-acta
description: Genera de verdad el PDF del Acta de Visita de Obra con datos de prueba y lo renderiza a imagen para revisarlo visualmente. Úsala siempre que se toque generarActaVO_v2, la justificación de texto, tablas, clima, firmas o cualquier cosa que afecte al PDF.
---

# Probar el PDF del Acta VO

Que compile no significa que se vea bien. Antes de dar por buena cualquier modificación del PDF:

1. **Localiza el generador**: `generarActaVO_v2()` (el único activo; `generarActaVO()` v1 no se toca). Si ya está en un módulo propio (`src/pdf/generarActaVO.js`), impórtalo directamente; si sigue dentro de `App.jsx`, extráelo a un fichero temporal en `scripts/` sin modificar el original.
2. **Crea (o reutiliza) `scripts/test-pdf.mjs`**: un script Node que
   - carga `jspdf` (`npm i -D jspdf` si falta) y lo expone como `globalThis.window = { jspdf: ..., open: (url)=>... }`;
   - sustituye `window.open` por una escritura a `out/acta-test.pdf`;
   - construye un objeto `obra` + `vo` de prueba **realista y exigente**: nombres de empresa largos, textos de más de 3 líneas, 2 días de clima con lluvia, un tema con varias entradas `nueva:true`, contrataciones con descripciones largas, `firmasSeleccionadas` con 3 y con 5 roles.
3. **Genera el PDF**: `node scripts/test-pdf.mjs`.
4. **Renderiza a PNG**: `pdftoppm -r 80 -png out/acta-test.pdf out/pag` y **mira cada página** (herramienta Read sobre los PNG).
5. **Comprueba esta lista**:
   - Texto de una celda que pisa a la de al lado (tabla de equipo: empresa / contacto / email).
   - Filas de contrataciones con alto dinámico y texto centrado verticalmente.
   - Justificación: sin huecos enormes en líneas cortas (límite `MAX_EXTRA`).
   - Numeración de Hitos / Contrataciones / Clima = `vo.secciones.length` + 1…, no fija.
   - Saltos de página: ninguna cabecera huérfana al final de página.
   - Quadro de firmas: filas de máximo 3, solo los roles de `firmasSeleccionadas`.
   - Clima: días completos, TEMP/PREC centrados, nivel de precipitación correcto.
6. Si algo falla, corrige y **repite** el ciclo completo. Informa a Jan con un resumen de qué páginas has revisado.

No dejes `out/` ni `scripts/test-pdf.mjs` sin añadir `out/` a `.gitignore`.
