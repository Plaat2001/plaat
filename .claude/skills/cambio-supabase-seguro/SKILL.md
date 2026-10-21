---
name: cambio-supabase-seguro
description: Procedimiento para cambiar el esquema de Supabase (columnas, tablas, RLS, storage) sin perder datos ni romper a quien tenga la versión anterior de la app abierta. Úsala antes de cualquier migración o cambio de política.
---

# Cambio seguro en Supabase

PLAAT usa datos reales de obras. Un fallo aquí afecta al estudio entero.

1. **Nunca contra producción primero.** Usa un proyecto de desarrollo (o una *branch* de Supabase) para probar. El MCP de Supabase del repo está en `read_only=true`: sirve para inspeccionar, no para escribir.
2. **Backup antes de tocar nada**: exportar (Dashboard → Database → Backups, o `pg_dump`). Anotar la fecha del backup.
3. **Cambios aditivos primero** (expand → migrate → contract):
   - Añadir columna nueva **nullable o con default**; no renombrar ni borrar en el mismo paso.
   - Desplegar la app que lee/escribe ambas versiones.
   - Migrar datos antiguos con un script revisable (`UPDATE` con `WHERE` acotado, probado primero con `SELECT`).
   - Solo después, en otro despliegue, retirar lo viejo.
4. **Pestañas abiertas con la versión anterior**: la app antigua seguirá escribiendo con el esquema viejo hasta recargar. Por eso los cambios deben ser retrocompatibles y `rowToObra()` tolerar campos ausentes.
5. **RLS**: tras cualquier cambio de política, probar con un usuario normal (no solo con el rol de servicio) lectura, escritura y borrado. Nunca desactivar RLS "para que funcione".
6. **Storage** (fotos): no cambiar nombres de bucket ni rutas sin migrar los objetos existentes.
7. **Script SQL guardado en el repo** (`supabase/migrations/AAAA-MM-DD_descripcion.sql`) y comentado en el commit.
8. **Pedir confirmación explícita a Jan** antes de ejecutar nada de escritura en producción y mostrarle el SQL exacto.
9. Después: comprobar que obras existentes cargan, que se guarda un cambio y que la cola offline sigue funcionando.
