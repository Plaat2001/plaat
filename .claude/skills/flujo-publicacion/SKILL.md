---
name: flujo-publicacion
description: Flujo de trabajo para publicar cambios de la app PLAAT DEO directamente en producción. Úsala al empezar una tarea nueva, al terminarla o cuando Jan diga "súbelo", "publica", "despliega" o "commit y push".
---

# Flujo de publicación

`main` = producción (`plaat.vercel.app`). Se trabaja **directamente en `main`**: un push a `main` dispara el deploy de producción en Vercel automáticamente, sin paso intermedio de preview/PR. No crear ramas `feat/<nombre>` salvo que Jan lo pida explícitamente para algo que quiera probar antes de tenerlo en producción.

## Al empezar
1. `git status` (revisar que no haya cambios sueltos de otra tarea) → `git switch main` → `git pull`.

## Durante
- Commits pequeños y descriptivos, en castellano.
- Tras cada bloque de cambios: `npm run build` debe pasar.

## Al terminar
1. Skills según el cambio: `probar-pdf-acta` (si toca PDF), `qa-movil` (si toca UI), `campo-nuevo-obra` (si toca datos).
2. Llamar al subagente **`revisor`** sobre el diff y resolver lo bloqueante.
3. `git add` + `git commit` + `git push` a `main` (pide confirmación antes del push, como con cualquier acción que afecte a producción).
4. Vercel despliega `main` automáticamente — avisar a Jan de que el cambio ya está en producción y que compruebe en el móvil y en el PC.

## Si algo sale mal en producción
- Rollback inmediato: en Vercel → Deployments → desplegar la versión anterior (*Promote*), o `git revert <commit>` y push. Después se investiga con calma.

## Mensaje de commit
Formato: `tipo: resumen en una línea` (`feat`, `fix`, `refactor`, `docs`). Cuerpo opcional con el porqué.
