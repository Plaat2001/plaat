# PLAAT DEO — Puesta en marcha del paquete de Claude Code

## 1. Instalar (una sola vez por PC)

1. Descomprime `claude-pack.zip`.
2. Copia **todo su contenido** a la raíz del repo, `C:\Users\Jan\plaat`, de modo que queden:
   - `CLAUDE.md` (sustituye al anterior)
   - `.mcp.json`
   - `.claude\settings.json`
   - `.claude\hooks\check-syntax.mjs`
   - `.claude\skills\…` (5 carpetas)
   - `.claude\agents\revisor.md`
3. Abre una terminal en esa carpeta y ejecuta:

   ```
   cd C:\Users\Jan\plaat
   git switch -c chore/claude-config
   npm install
   git add CLAUDE.md .mcp.json .claude
   git commit -m "chore: configuración de Claude Code (skills, revisor, hooks, MCP)"
   git push -u origin chore/claude-config
   ```
   Después, merge a `main` (así el otro PC también lo recibe con `git pull`).
4. Abre `.mcp.json` y cambia `REEMPLAZA_CON_EL_ID_DEL_PROYECTO` por el *Project ID* de Supabase (Settings → General). **Recomendado: usa un proyecto de desarrollo, no el de producción.** Se deja en `read_only=true`.
5. Escribe `claude` en la terminal. La primera vez te pedirá aprobar los servidores MCP del proyecto: acepta Playwright; Supabase y Vercel te pedirán iniciar sesión (usa las cuentas PLAAT).

## 2. Comprobar que todo funciona

Dentro de Claude Code:

- `/skills` → deben salir `probar-pdf-acta`, `campo-nuevo-obra`, `qa-movil`, `cambio-supabase-seguro`, `flujo-publicacion`.
- `/agents` → debe salir `revisor`.
- `/mcp` → estado de Playwright, Supabase y Vercel.
- `/permissions` → revisa las reglas de `settings.json`.

## 3. Cada día

```
git switch main
git pull
git switch -c feat/lo-que-sea
claude
```
Al terminar, dile: *"usa el revisor sobre mis cambios y, si está todo bien, sube la rama"*. Vercel creará una URL de preview; pruébala y, si está bien, haz el merge a `main`.

## 4. Prompts listos para copiar

**Dividir `App.jsx` (recomendado como primer trabajo)**
> Lee CLAUDE.md. `src/App.jsx` tiene unas 8.250 líneas. Propón un plan para dividirlo en módulos sin cambiar el comportamiento: `src/pdf/generarActaVO.js`, `src/components/` (ObraCard, Modal, ConfirmMini…), `src/modules/ModuloActaVO.jsx`, etc. Primero dame el plan y espera mi OK. Luego hazlo en pasos pequeños con un commit por cada módulo extraído, verificando `npm run build` en cada paso, y usa `probar-pdf-acta` al mover el generador.

**Revisión general antes de publicar**
> Usa el subagente revisor sobre todo lo que hay en esta rama frente a main y dame el veredicto.

**Campo nuevo**
> Quiero añadir el campo "<nombre>" a <obra / acta>. Sigue la skill campo-nuevo-obra.

**Probar el PDF**
> He cambiado <qué>. Usa probar-pdf-acta con datos exigentes y enséñame las páginas.

**QA móvil**
> Pasa qa-movil a la pestaña <X> del Acta VO en 390×844 y dime qué ves mal.

**Tests automáticos (siguiente mejora)**
> Añade Vitest al proyecto y escribe tests para `migrateVO`, `obraRow`/`rowToObra`, `condicioDesDeHores` y `nivellPluja`. Después, un test de humo del generador PDF.

## 5. Desde el móvil

Con el PC encendido y Claude Code abierto: escribe `/remote-control` (o `/rc`) en la sesión y conéctate desde la app de Claude del móvil. Requiere plan Pro/Max y una versión reciente de Claude Code.

## 6. Reglas de oro

- Nunca trabajar en `main`; siempre rama → preview → merge.
- `git pull` al empezar, `git push` al terminar (las conversaciones no se sincronizan entre PCs, el código sí).
- Supabase en solo lectura salvo decisión explícita tuya y sobre el SQL exacto.
- No compartir ni pegar claves; los `.env` están bloqueados para lectura.
