# PLAAT DEO — Context del projecte

PWA de gestió d'obres per a PLAAT Arquitectura Tècnica (React + Supabase + Vercel).
Comunicació habitual amb Jan Moreno: espanyol/català barrejat. Comentaris de codi i UI en català/castellà.

## Stack i estructura

- **Frontend**: React (Vite), un únic fitxer principal `src/App.jsx` (~8.000 línies) + `src/main.jsx` (capa de dades)
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Desplegament**: Vercel, domini `plaat.vercel.app`
- **PDF**: jsPDF, carregat dinàmicament via CDN (`window.jspdf`); el mòdul de Seguiment també carrega `jsPDF-AutoTable` pel mateix mecanisme (CDN, mai bundlejat)
- **Mapes**: Leaflet, carregat dinàmicament via CDN (`window.L`)
- **Clima**: API Open-Meteo (gratuïta, sense clau) — es va provar AEMET però es va revertir per simplicitat

### Fitxers clau
- `src/App.jsx` — tota la lògica de la UI, els mòduls (Incidencias, Calidad, Acta VO, Seguimiento, Notas y tareas, Inspecciones) i el generador de PDF
- `src/main.jsx` — capa de dades: client Supabase, `window.db.*` (CRUD), `window.storage.*` (KV legacy), cache offline amb IndexedDB, cua de mutacions pendents, auth
- `src/supabase.js` — credencials del client

## Arquitectura de dades important

- **`obraRow()` / `rowToObra()`** (a `App.jsx`, dins del component `App`): serialitzen/deserialitzen l'obra a/des de Supabase. **Qualsevol camp nou a nivell d'obra (com `climaLat`, `diasVisita`, etc.) s'ha d'afegir explícitament a totes dues funcions**, si no es perd en recarregar — ja ha passat un cop (bug de `climaLat`/`climaLon` no persistents).
- **Guardat amb debounce**: `actualizarObra()` (a `App`) actualitza l'estat local a l'instant i espera 700ms abans d'escriure a Supabase (`saveUnaObra`). Es fa *flush* forçat (`desarPendentsAra()`) en: sortir de l'obra, canviar de pestanya dins de `DetalleObra` (prop `onFlush`), i tancar la pestanya del navegador. **Important**: `actualizarObra` només toca `obraActiva` si l'obra editada ja és l'activa — si no, es podria navegar-hi sense voler en fer una edició ràpida des del tauler.
- **Mode offline**: `main.jsx` cacheja lectures a IndexedDB i encua escriptures quan no hi ha xarxa; les reintenta en recuperar connexió.

## Acta de Visita d'Obra (mòdul més treballat)

Aquest ha estat el focus de la majoria de sessions recents. Estructura de `vo` (objecte `actaVO` de l'obra):

- `num` — número d'acta actual (s'incrementa en exportar)
- `fechaActa` — data de l'acta, **editable** (no sempre coincideix amb el dia en què s'omple)
- `fase`, `lloc` — camps lliures
- `equipo` — array de rols, cadascun amb `grupo` (editable, agrupa visualment) i `personas[]`
- `estadoObra.ubicacions[]` — fotos agrupades per ubicació (secció "A")
- `trabajosEnCurso[]` — secció "B"
- `secciones[]` — les 5 seccions de temes (per defecte: Temas generales, Instalaciones, Control de calidad, LEED & BREAM, Planificación), cadascuna amb `temas[]`
- Cada **tema** té `titulo` + `entradas[]` (seguiments cronològics). Cada entrada té `estado` (P/R/I), `resp[]` (array de responsables), `fecha` (editable), `fotos[]`, i **`nueva`** (boolean manual — decideix si surt en blanc/negreta al PDF; **ja NO es calcula automàticament comparant `actaNum`**, perquè es van important actes antigues fora d'ordre)
- El **`num` de cada tema ("4.07") és immutable**: identifica el punt a totes les actes ja emeses. `renumerarSecciones()` renumera NOMÉS el `codigo` de les seccions i mai els temes — reescriure'ls en moure/esborrar seccions va trencar la numeració d'una obra sencera (prefixos barrejats i números repetits). Només es canvia a mà, o amb "Restaurar numeración de temas" (dins "Actas exportadas"), que recupera el `num` de cada tema des d'una versió arxivada per `id` sense perdre'n cap (`planRestaurarNums()`, test a `scripts/test-restaurar-nums.mjs`). Els números repetits es marquen amb un avís taronja a la llista de temes.
- `hitos.{esenciales[], intermedios[]}` — secció numerada dinàmicament (sempre just després de l'última secció de temes)
- `contrataciones[]` — mateixa numeració dinàmica
- `clima[]` — fins a 7 dies; la data triada per l'usuari és sempre **l'últim** dia del rang (els 6 anteriors + aquest)
- `firmasSeleccionadas[]` — array d'ids (`ROLES_FIRMA`) que trien quins rols surten al quadre de firmes; per defecte tots (retrocompatible)
- `climaLat`/`climaLon` — **viuen a nivell d'OBRA, no de `vo`** (es reutilitzen entre actes)

### Generador de PDF
- `generarActaVO_v2()` és l'únic generador actiu (hi ha un `generarActaVO()` v1 sense ús, no tocar-lo)
- Numeració de seccions especials (Hitos/Contrataciones/Clima) és **dinàmica**: `numBaseFinal = vo.secciones.length`, mai fixa
- Text llarg es justifica amb `dibuixarLiniesJustificades()` — té un límit màxim d'espai extra per paraula (evita forats enormes en línies curtes)
- Cerca d'empresa per a firmes (`getEmpresa()`) usa prefixos curts en MAJÚSCULES perquè coincideixin tant en català com en castellà (compte: "SEGUR" no "SEGURE", ja va fallar un cop per aquest motiu)

## UI de l'Acta VO (mòdul `ModuloActaVO`)

- Tres pestanyes internes: **Temes** (contingut real, per defecte), **Equip**, **Dades** (Trabajos en curso + Hitos + Contrataciones + Clima)
- Capçalera *sticky* (compte amb marges negatius verticals combinats amb `position: sticky` — ja va causar un bug de solapament; només s'usen marges negatius horitzontals)
- Botó flotant "+" (crear tema nou) i tots els modals (`Modal`, `ConfirmMini`) usen **`createPortal` a `document.body`** — necessari per evitar bugs de `position: fixed` dins de contenidors amb scroll niat en mòbil real. **Advertència**: l'entorn de previsualització d'artefactes de Claude (dins del xat) NO permet `import ... from "react-dom"` i mostrarà error — això només afecta la previsualització en aquest xat, no el desplegament real a Vercel.
- Totes les seccions de temes es poden plegar; els temes es llisten en **ordre d'inserció** (no ordenats per estat — es va provar i es va revertir perquè feia que els punts nous no aparegueguessin al final)
- Data per defecte en crear un tema/seguiment: **no és "avui"**, és el dia de visita configurat més recent (`obra.diasVisita`), calculat amb `dataVisitaRecent()`

## Acta de Seguiment d'Obra (mòdul `ModuloSeguimiento`)

Pestanya nova (entre Acta VO i Notas y tareas) per fer seguiment de temes pendents que sorgeixen en reunions (presencials o telemàtiques) — diferent de l'Acta VO. Es va basar en una eina feta per un company (estructura obra → reunions → punts) i en l'Excel que s'usava fins ara. **Substitueix una vista global antiga "Seguimiento"** (al sidebar, taula Supabase `seguimiento`, sense reunions) que no estava documentada aquí — es va retirar; els seus punts es migren automàticament per obra (`migrarSeguimientoGlobalAntiguo`, s'executa un sol cop en segon pla en carregar el tauler).

- **Model de dades**: dues taules Supabase noves amb el mateix patró itemitzat que `incidencias`/`notas` (una fila per punt/reunió, mai un blob únic com `vo`): `seguimiento_puntos` i `seguimiento_reuniones` (`id`, `obra_id`, `data` jsonb, `updated_at`). SQL: `supabase/migrations/2026-11-20_seguimiento.sql` (crea les taules i còpia les polítiques RLS de `incidencias`). Camps nous a nivell d'obra: `seguimientoNextNum` (comptador), `seguimientoTematicas` (llista plana antiga, retrocompatible), `seguimientoFase` (`'pre'|'obra'|'post'`, per defecte `'obra'`), `seguimientoTematicasPorFase` (`{pre,obra,post}`, `tematicasSegPorFase(obra)` calcula el fallback des de `seguimientoTematicas` si falta) i `seguimientoDirectorio` (intervinients reutilitzables per a la reunió).
- **El `id` d'un punt és un `uid()` opac (clau primària real), MAI el "P-xxx" visible** — el "P-xxx" és només `nuevoNumSeguimiento(num)`, derivat del camp `num`. Fer-los servir com el mateix camp va ser un bug real (trobat pel subagent `revisor` abans de publicar): dos punts creats gairebé alhora (dues pestanyes, o la migració solapant-se amb una creació manual) col·lisionaven a la mateixa fila de Supabase i un es sobreescrivia en silenci.
- **Persistència**: NO passa pel debounce de 700ms de `vo`/`actualizarObra` — cada punt/reunió es desa amb diffing per referència dins `saveUnaObra` (igual que `incidencias`/`notas`: només es fa `upsertModulo` dels que han canviat). Les eliminacions són explícites (`eliminarPuntoSeg` crida `deleteModulo` directament), perquè el diff per referència mai detecta que un element ha desaparegut de l'array. **Important**: quan una acció toca més d'un punt alhora (canvi en bloc, propostes del repàs de finalització), s'ha de fer un ÚNIC `onSave` amb tots els punts afectats dins del mateix array (`cambiarEstadoBulkSeg`, `aplicarPropuestasBulkSeg`) — fer una crida de guardat per punt perd canvis pel camí, perquè cada crida llegeix `obra.seguimientoPuntos` tal com estava abans de l'anterior (la prop no es refresca fins al següent render); això ja va ser un bug real trobat pel `revisor` dins de `PuntoSegModal` (es perdien `comentarios` afegits durant la mateixa sessió del modal en guardar un altre canvi).
- **Classificació automàtica de l'estat** (curso/decidido/cerrado) i **relació entre notes i punts pendents**: sense IA (l'app no té cap capacitat de sampling, decisió confirmada explícitament amb Jan) — regles de text locals (`clasificarEstadoSeguimiento`) i similitud de paraules (Jaccard, `sugerirRelacionadosSeg`, `candidatosRepasoSeg`); sempre com a proposta descartable, mai aplicades sense confirmació de l'usuari. El reconeixement de contactes des d'una foto del prototip del company depèn d'IA i per tant no s'ha portat.
- **PDF**: `generarActaSeguimiento()`, mateix patró `doc.output('blob')` + `URL.createObjectURL` + `window.open` que la resta de generadors (no `doc.save()`, per compatibilitat amb iOS Safari). Taules reals amb `jsPDF-AutoTable` (`doc.autoTable(...)`, carregat dinàmicament per CDN **després** de jsPDF — `jspdf.plugin.autotable.min.js@3.8.2`, mateixa versió que usava el prototip, compatible amb jsPDF 2.5.1 — mai bundlejat, igual que jsPDF): cajetí de la reunió (fase/tema/fecha + casetes de modalitat dibuixades a mà en `didDrawCell`), taula d'assistents amb `mailto:` real, i taula(es) de punts (propis/tractats/annex en taules separades) amb alçada de fila dinàmica via `didParseCell` (`layoutPuntoSeg`/`dibujarContenidoPuntoSeg`: títol en negreta + motiu justificat + últimes observacions en cursiva + fotos aparellades de 2 en 2). **Dev-only**: `jspdf` es va fixar a `2.5.1` (abans `^4.2.1`) perquè l'arnès de test Node faci servir la mateixa versió que es carrega per CDN en producció — `jspdf-autotable` és peer-dependent d'aquesta versió. Arnès de prova: `scripts/test-pdf-seguimiento.mjs` + `scripts/_extracted-acta-seguimiento.js` (en Windows, sense poppler, es renderitza a PNG amb `scripts/render-png.mjs`, no `pdftoppm`; al test Node cal `import 'jspdf-autotable'` com a side-effect abans de cridar el generador, equivalent al `<script>` de producció).
- Camps d'un **punt**: a més dels ja documentats, `titulo` (curt, opcional — mai obligatori a la captura ràpida en reunió, perquè no alenteixi l'anotació en viu), `comentarios[]` (`{id, texto, creadaEn}`, equivalent a la columna "Observaciones" del Excel que s'usava abans: log lliure que l'usuari va afegint amb el temps, diferent del `historial` automàtic de canvis de camp) i `fase` (snapshot de la fase de l'obra en donar-se d'alta, només per trazabilitat). `tituloPuntoSeg(p)` decideix què es mostra com a títol (el camp si n'hi ha, si no les primeres paraules del `texto`, tallant sempre per paraula sencera).
- Un punt es pot donar d'alta **directament des del registre, sense reunió** (`NuevoPuntoModal`, botó "+ Nuevo punto" a `VistaSeguimientoObra`) — reflecteix l'ús real de Jan (Excel de Ferrovial: la majoria de punts recents no neixen d'una reunió formal).
- **Selecció múltiple + canvi d'estat en bloc** al registre de punts (`cambiarEstadoBulkSeg`) i **exportació a Excel real** (`exportarSeguimientoExcel`, via `XLSX` — ja dependència de producció, mateixa llibreria que la importació de granulometria/CQ) amb les mateixes columnes que el Excel que Jan feia servir abans.
- **Fases d'obra** (`FASES_SEG`: Preconstrucción/Obra/Postobra, igual que el prototip): `obra.seguimientoFase` es canvia des del cajetí de `VistaSeguimientoObra` (botó "⚙ Ajustes" → `ModalAjustesSeg`) o en triar-la a "Nueva reunión" (llavors passa a ser la fase "actual" de l'obra). Cada reunió/punt en guarda un snapshot (`reunion.fase`/`punto.fase`). Les temàtiques disponibles depenen de la fase (`tematicasSegDeFase`); el filtre del registre (no lligat a cap fase concreta) usa la unió de les tres (`tematicasSegTodasFases`).
- **Directori d'intervinents** (`obra.seguimientoDirectorio`) i selector agrupat per empresa (`AttendeePicker`, equivalent a `attPicker()` del prototip): pas 1 tria empreses convocades, pas 2 marca persones per empresa amb "Todos/Ninguno"; permet donar d'alta un intervinent nou al vol i marcar-lo alhora. S'usa a "Nueva reunión" i a `ModalDatosReunionSeg` (editar una reunió ja creada — abans no existia cap manera de corregir títol/modalitat/lloc/assistents). **`reunion.asistentes` es manté com a snapshot inline** (`{empresa,persona,rol,email,telefono}`, amb `dirId` com a referència per saber què està marcat al picker), NO com a IDs vius al directori com fa el prototip — així l'acta d'una reunió antiga no canvia si després s'edita o s'esborra una entrada del directori (mateix criteri que l'`equipo`/firmes de l'Acta VO).
- **"Finalizar reunión"** passa primer per `RepasoFinalizarModal`, que combina dues coses (regles locals, cap IA): **candidats a canvi d'estat** (`candidatosRepasoSeg`: per cada punt obert, busca el punt més semblant donat d'alta igual o després que ell amb estat ja `cerrado`/`decidido`, i enllaça la nota evidenciant el canvi al camp `relacionados` del punt, que fins ara estava al model però sense usar-se) i **punts vençuts** (Mantener/Ampliar 7 dies/Cerrar) — un punt surt a una secció o l'altra, mai a totes dues. En confirmar, finalitza la reunió i genera el PDF en el mateix pas ("Finalizar y generar PDF"); si el PDF falla, la reunió igualment queda finalitzada.
- **Detecció d'avisos de dades personals** (`detectarPersonalesSeg`, regex sense IA: DNI/NIE, telèfon, compte bancari, correu, termes de salut) a la nota ràpida de reunió i al motiu d'edició d'un punt. **Dreceres de teclat** a la reunió (`Alt+1/2/3` fixa l'estat, `Alt+N` torna a la nota). **Enganxar captura amb Ctrl+V** (nota ràpida i edició de punt, `pegarFotosPortapapeles`) i **arrossegar i deixar anar** a la zona de fotos del punt. **Lightbox amb navegació** ←/→/Escape quan un punt té diverses fotos (`LightboxFotosSeg`).
- Pendent conegut: si dos punts arriben a tenir el mateix `num` (carrera molt poc probable entre dispositius/pestanyes), es veuria un "P-xxx" duplicat a la UI (ja no es perd cap dada, és només cosmètic) — es podria afegir un avís com el que ja hi ha per als números de tema repetits de l'Acta VO si mai arriba a passar de debò.
- **Descartat deliberadament** (no encaixa amb aquesta app, no tornar-ho a plantejar sense que Jan ho demani): importar una obra sencera com a "obra nova" (al prototip cada obra és una unitat autocontinguda d'un artefacte d'un sol usuari; aquí les obres viuen a Supabase, compartides per l'equip) i un sistema de toasts propi (la resta de l'app usa `alert()`; un toast només aquí trencaria la coherència visual).

## Convencions i patrons a seguir

- Comentaris de codi nous: català, seguint l'estil ja present
- Mòbil: sempre `isMobile` (hook `useIsMobile()`) per adaptar mides; inputs han de tenir `font-size: 16px` mínim en mòbil (ja hi ha una regla CSS global que ho força, evita el zoom automàtic d'iOS)
- Hover: classes CSS globals (`.chip-link`, `.dia-toggle`, `.hov-*`) en lloc d'estils inline, ja que `:hover` no funciona en `style={{}}`
- Abans de donar per bo un canvi al PDF, **generar-lo de veritat** amb un arnès de test Node.js + jsPDF i renderitzar-lo a imatge per revisar-lo visualment — no assumir que compila = que es veu bé

## Pendent / coses a vigilar

- El fitxer `App.jsx` és molt gran; **bona oportunitat per dividir-lo en mòduls** ara que es treballa des de Claude Code (per exemple: `pdf/generarActaVO.js`, `components/ObraCard.jsx`, `modules/ModuloActaVO.jsx`, etc.)
- Fer servir git per a l'historial en lloc de còpies manuals de fitxers
- Si es canvia l'esquema de Supabase (columnes, RLS), verificar que no trenqui l'app d'algú que tingui la versió anterior carregada al navegador

## Com treballar en aquest repo (Claude Code)

- **Branques**: es treballa directament a `main`. Quan Jan diu "commit y push" (o similar), és un commit + push a `main` — Vercel desplega `main` a producció automàticament, sense pas intermedi de preview/PR. No crear branques `feat/<nom>` tret que Jan ho demani explícitament per a alguna cosa concreta que vulgui provar abans de tenir-la en producció.
- **Sincronització entre PCs**: `git pull` en començar, `git push` en acabar. Les converses de Claude Code NO es sincronitzen entre dispositius; el codi sí (via GitHub).
- **Verificació**: després de tocar codi, `npm run build` ha de passar. Un hook (`.claude/hooks/check-syntax.mjs`) ja valida la sintaxi de cada `.jsx/.js` editat.
- **Skills del projecte** (`.claude/skills/`): `probar-pdf-acta`, `campo-nuevo-obra`, `qa-movil`, `cambio-supabase-seguro`, `flujo-publicacion`. Usar-les quan la tasca coincideixi.
- **Subagent `revisor`** (`.claude/agents/revisor.md`): revisió de només lectura del diff contra els errors històrics. Cridar-lo abans de cada push a `main`.
- **Supabase**: el MCP va en mode `read_only`. Mai executar SQL d'escriptura contra producció sense confirmació explícita de Jan.
- **Secrets**: mai llegir ni imprimir `.env*`; mai commitejar claus.
- **Idioma**: respondre a Jan en castellà; comentaris de codi nous en català.
