---
name: campo-nuevo-obra
description: Checklist para añadir un campo nuevo a nivel de obra o de acta VO sin que se pierda al recargar. Úsala cada vez que se añada, renombre o elimine un campo persistente (por ejemplo climaLat, diasVisita, firmasSeleccionadas).
---

# Añadir un campo persistente

Ya ocurrió: `climaLat`/`climaLon` se reseteaban porque faltaban en la serialización. Sigue siempre este orden.

## Campo a nivel de OBRA
1. **`obraRow()`** (dentro del componente `App`): añade el campo a la fila que se envía a Supabase.
2. **`rowToObra()`**: léelo de vuelta, con valor por defecto seguro (`row.campo ?? valorDefecto`).
3. Si Supabase tiene columna propia, añádela (ver skill `cambio-supabase-seguro`); si el campo vive dentro de un JSON existente, confirma en qué columna se guarda.
4. Valor por defecto para obras antiguas que no lo tienen.
5. Uso en UI: modifica con `actualizarObra({...obra, campo})` (debounce de 700 ms; no navegues a la obra al editar desde el tablero).

## Campo dentro de `vo` (acta)
1. Añádelo al objeto por defecto de un acta nueva.
2. **`migrateVO`**: da valor por defecto a actas antiguas (retrocompatibilidad), p. ej. `vo.campo ??= valor`.
3. Si afecta al PDF, usa la skill `probar-pdf-acta`.

## Verificación
- `npm run build` pasa.
- Prueba manual: edita el campo → cambia de pestaña → recarga la página → el valor sigue ahí.
- Prueba con una obra antigua (sin el campo): no debe romper.
- Pasa el subagente `revisor`.
