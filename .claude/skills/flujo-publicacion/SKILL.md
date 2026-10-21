---
name: flujo-publicacion
description: Flujo de trabajo con ramas, preview de Vercel y merge a main para publicar cambios de la app PLAAT DEO. Úsala al empezar una tarea nueva, al terminarla o cuando Jan diga "súbelo", "publica" o "despliega".
---

# Flujo de publicación

`main` = producción (`plaat.vercel.app`). Nunca se trabaja directamente en `main`.

## Al empezar
1. `git status` (debe estar limpio) → `git switch main` → `git pull`.
2. `git switch -c feat/<nombre-corto>` (o `fix/…`).

## Durante
- Commits pequeños y descriptivos, en castellano.
- Tras cada bloque de cambios: `npm run build` debe pasar.

## Al terminar
1. Skills según el cambio: `probar-pdf-acta` (si toca PDF), `qa-movil` (si toca UI), `campo-nuevo-obra` (si toca datos).
2. Llamar al subagente **`revisor`** sobre el diff y resolver lo bloqueante.
3. `git push -u origin <rama>` (pide confirmación).
4. Vercel genera automáticamente una **URL de preview** para la rama: dársela a Jan para que la pruebe en el móvil y en el PC.
5. Solo cuando Jan dé el visto bueno: merge a `main` (PR en GitHub o `git switch main && git merge --no-ff <rama> && git push`), y comprobar que el despliegue de producción termina en verde.

## Si algo sale mal en producción
- Rollback inmediato: en Vercel → Deployments → desplegar la versión anterior (*Promote*), o `git revert <commit>` y push. Después se investiga con calma.

## Mensaje de commit
Formato: `tipo: resumen en una línea` (`feat`, `fix`, `refactor`, `docs`). Cuerpo opcional con el porqué.
