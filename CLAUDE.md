# HouseApp — Contexto del proyecto

> Este archivo se carga automáticamente en cada sesión de Claude Code.
> Contiene el contexto principal del proyecto. Última actualización: 2026-10-27.

## Estado actual
- Definición del MVP **cerrada** (entrevista por bloques 1 a 8, abajo).
- Desarrollo: **Etapas 0 a 4 terminadas** y **primer APK generado** (`apk\HouseApp.apk`).
  Todavía **no se ha probado en celulares reales**.
- **Siguiente:** que el usuario instale el APK en los dos celulares y valide la Etapa 5
  (tiempo real entre los dos y uso sin internet). Ver **Pendientes**.
- Forma de trabajo con el usuario: en español, paso a paso; para definir, entrevista con pocas
  preguntas por bloque; para diseño, se desarrolla directo y el usuario pide ajustes sobre la marcha.

## Descripción general
App móvil para planear las comidas de la semana y generar la lista del súper.
Nace de una necesidad real en casa: el usuario y su pareja hacen la lista de compras
(comidas y cosas de la casa) en la app de notas del celular, y no les da la funcionalidad que necesitan.

## Plataforma
- Inicialmente **Android**.
- iOS **solo si el usuario lo pide más adelante** (puede que no). Aun así, conviene no cerrar esa puerta.

## Funcionalidad principal (idea original)
1. **Calendario de comidas**: elegir un día y agregar la comida (ej. "Molida con bandera") con sus
   ingredientes. La idea es definir las comidas de la semana antes de que empiece.
2. **Lista de compras**: se genera con todos los ingredientes de las comidas del periodo.
3. **Plus: recetario**: las comidas capturadas se guardan para reutilizarlas sin volver a teclear
   los ingredientes.

---

## Definición del MVP

### Usuarios y uso compartido (Bloque 1)
- MVP: **un solo hogar**, solo el usuario y su pareja. Los dos tienen **los mismos permisos**.
- MVP: **no** se registra quién agregó o modificó algo (sería para la versión formal).
- MVP: **sin pantalla de login**, se entra directo (ver "Código de hogar" en Decisiones).

### Comidas y recetas (Bloque 2)
- Una receta tiene **nombre + ingredientes** (artículos del catálogo) + **etiquetas libres**
  (varias por receta, con autocompletado de las existentes).
- Se crean desde el recetario **o** desde un día del calendario (queda guardada en el recetario).
- Se pueden **editar**; borrado **lógico** (inactivar). No puede haber dos recetas con el mismo nombre.
- **Receta** = plantilla única. **Comida planeada** = receta asignada a un día con **su propia copia**
  de nombre e ingredientes.
  - Ajustar ingredientes en un día solo afecta a ese día; al guardar se pregunta si también se
    cambia la receta (se actualiza la misma, no se crea otra).
  - Al editar una receta con comidas planeadas **desde hoy**, se pregunta si se actualizan también.
  - Los días pasados nunca cambian (historial fiel).
- La **lista del súper se genera de las comidas planeadas**, no de las recetas.

### Catálogo de artículos (Bloque 3)
- **Catálogo único** de artículos: ingredientes **y** cosas de la casa (limpieza, higiene…).
- Cada artículo existe una sola vez y tiene una **clasificación**. Borrado lógico.
- **Clasificaciones**: lista inicial incluida; se pueden agregar, editar, ordenar e inactivar.
- MVP: **solo nombre**, sin cantidad ni unidad. En la lista los repetidos se juntan indicando de
  qué comidas vienen ("Cebolla — Molida con bandera, Tinga").
- Marca **"básico de despensa"** (sal, aceite…): en la lista sale normal pero con una marca visual.

### Calendario (Bloque 4)
- **Varias comidas por día**, sin tiempos fijos. Vista **semanal y mensual**.
- Se planea **varias semanas hacia adelante**, en cualquier orden. La semana no tiene inicio fijo
  (suelen comprar sábado o domingo); en pantalla la semana va de lunes a domingo.
- **Días especiales** sin receta: opciones fijas (Comemos fuera, Sobras, Pedimos comida) **más
  texto libre**. No generan artículos en la lista.

### Lista del súper (Bloque 5)
- "Generar lista del súper": **siempre se eligen** fecha inicio y fin (sin rango por defecto).
- La lista **se genera y se guarda**. Si cambian las comidas del rango, la app avisa y ofrece
  **actualizar**, conservando palomeados, artículos manuales y quitados.
- **Artículos manuales** (del catálogo) y **quitar artículos** sin afectar recetas ni comidas.
- MVP: **una sola lista activa**; generar otra la **reemplaza** (con confirmación), sin historial.

### Modo súper (Bloque 6)
- Agrupada por **clasificación** en el orden del recorrido del súper (ordenable por el usuario).
- Al palomear, el artículo **se tacha y se va al final de su grupo**.
- **Tiempo real** entre los dos celulares y **funciona sin internet** (sincroniza al volver la señal).
- No hay "Terminar compra": lo no palomeado se queda hasta que se genere otra lista.

### Experiencia de uso (Bloque 7)
- **Pantalla de inicio:** el calendario en la semana actual. **Sin notificaciones** en el MVP.
- **Diseño:** lo elige Claude; no hubo prototipo (no hay Figma disponible). Material 3 (Ionic en
  modo `md`), verde albahaca como principal, acento terracota, tema claro/oscuro según el sistema,
  ícono (emoji) y color suave por clasificación.

### Fuera del MVP (propuestas para MVP 2 o posteriores)
- Recetas favoritas o más usadas primero; notas o pasos; foto; link externo; porciones; precios
  y total estimado.
- Notificaciones (sin comidas planeadas, cambios hechos por la pareja…) → requiere registrar la app
  Android en Firebase (`google-services.json`).
- Archivar e historial de listas; varias listas activas; pasar pendientes a la siguiente lista.
- Copiar una semana; mover o duplicar comidas entre días.
- Cantidades y unidades en los artículos.
- Registro de quién agregó o modificó algo.
- Versión formal: login (Google y cuenta propia), backend **.NET 10** + BD **SQL**, Play Store.
- iOS (solo si se pide).

---

## Stack y decisiones técnicas
- **App:** Ionic 9 + Angular 22 (standalone, **zoneless**) + Capacitor 8. `appId` `com.learsi96.houseapp`.
- **Datos:** Firebase JS SDK 13 — Firestore con **caché persistente** (sin internet + tiempo real)
  y **Anonymous Auth** (invisible) para las reglas de seguridad. Proyecto Firebase `houseapp-8d4cc`.
  En Firebase la app está registrada como **app Web** (el SDK corre dentro del WebView de Capacitor).
- **Código de hogar:** la primera vez, un celular crea el hogar y recibe un código (ej. `K7P-42Q`);
  el otro se une escribiéndolo (una sola vez por celular; si se reinstala, se vuelve a escribir).
  El código se consulta en **Más → Código del hogar**.
- **Reglas de Firestore:** `firestore.rules` en la raíz (solo los miembros del hogar leen/escriben).
  Se publican **copiándolas en la consola de Firebase** (Firestore → Reglas). `firebase.json` y
  `.firebaserc` quedan listos por si se usa Firebase CLI.
- **Distribución del MVP:** APK de depuración instalado directo en los dos celulares (no Play Store).
- **Futuro:** si se formaliza, migrar a .NET 10 + SQL. Por eso los datos están detrás de repositorios
  y los modelos son planos. Tablas previstas: `Clasificacion`, `Articulo`, `Receta`,
  `RecetaIngrediente`, `RecetaEtiqueta`, `ComidaPlaneada`, `ComidaPlaneadaIngrediente`,
  `ListaCompra`, `ListaCompraArticulo`.

### Modelo en Firestore
- `usuarios/{uid}` → `{ hogarId }` · `codigos/{codigo}` → `{ hogarId }`
- `hogares/{hogarId}` → `{ codigo, miembros[], creadoEn }`
- Bajo `hogares/{hogarId}/`:
  - `clasificaciones/{id}` → nombre, icono, color, orden, activo (ids fijos para las 12 iniciales).
  - `articulos/{id}` → nombre, clave, clasificacionId, basico, activo (iniciales con id `ini-…`).
  - `recetas/{id}` → nombre, clave, ingredientes[ids], etiquetas[], activo, creadaEn.
  - `comidas/{id}` → fecha 'YYYY-MM-DD' (hora local), tipo receta|especial, recetaId, nombre,
    icono, ingredientes[ids], orden. Quitar una comida es borrado físico (es planeación).
  - `listas/activa` → inicio, fin, generadaEn, `articulos` como **mapa por articuloId**
    (origenes[], manual, quitado, comprado) para que cada palomeo sea una escritura independiente.
  - `config/semillas` → `{ articulos: true }` cuando ya se cargaron los 72 artículos iniciales.

---

## Estructura del código (`app/src/app/`)
- `core/` → `firebase.service` (inicio, auth anónima, caché), `hogar.service` (crear/unirse con
  código), `hogar.guard`, `modal.ts` (`cerrarEsteModal()`).
- `data/` → **única capa que toca Firestore**: `modelos.ts`, `hogar-db.ts` (`escuchar`,
  `escucharDoc`, `enviar`), repositorios (`clasificaciones`, `articulos`, `recetas`, `comidas`,
  `lista`), `lista.ts` (reglas puras de armado/actualización de la lista), `fechas.ts`, `texto.ts`
  (`claveTexto`, `limpiarNombre`), `articulos-iniciales.ts`.
- `bienvenida/` (crear hogar o unirse) · `tabs/` (Calendario, Recetas, Lista, Más)
- `calendario/` → página, `agregar-comida`, `comida-detalle`.
- `recetas/` → página, `receta-form`, `receta-editor.service` (abre el formulario, guarda y hace las
  preguntas de días futuros; lo usan recetario y calendario).
- `lista/` → página, `generar-lista`.
- `catalogo/` → artículos y clasificaciones (páginas y formularios), `articulo-selector`
  (selector múltiple con "Crear…", reutilizado en recetas, comidas y lista), `ingredientes`
  (lista editable de ingredientes).
- `mas/` → menú de catálogos y código del hogar.
- Tema: `theme/variables.scss` (colores) y `global.scss` (clases `cl-<color>` de clasificaciones).

## Repositorio
- GitHub **privado**: `https://learsi96@github.com/learsi96/HouseApp.git`, rama `main`
  (el usuario en la URL hace que Git Credential Manager use la cuenta personal).
- Identidad **local** del repo: `learsi96` / `92958189+learsi96@users.noreply.github.com`.
  El git global de la máquina es de trabajo (`IsraelMovit96`): **nunca commitear con el correo de trabajo**.
- `app/` (Ionic) · `app/android/` (proyecto Capacitor) · `app/scripts/apk.ps1` · `apk/` (salida,
  ignorada) · `firestore.rules` · (futuro) `backend/`.
- No está instalado GitHub CLI (`gh`).

## Entorno de desarrollo
- Windows; **nvm-windows** con Node **22.23.3** activo (cada versión de Node tiene sus propios
  globales). En esa versión está **Ionic CLI 7.2.1**. Angular CLI: usar el local (`npx ng`).
- Correr la app en el navegador: desde `app/`, `ionic serve` → http://localhost:8100.
- **Android sin Android Studio** (decisión del usuario), todo en **E:** porque **C: está casi lleno**
  (~7 GB libres):
  - JDK 21 (Temurin 21.0.12) en `E:\Android\jdk-21`.
  - SDK en `E:\Android\Sdk`: cmdline-tools, platform-tools, `platforms;android-36`, `build-tools;36.0.0`.
    `sdkmanager` es obsoleto: usar `E:\Android\Sdk\cmdline-tools\latest\bin\android.exe --no-metrics
    --sdk=E:\Android\Sdk sdk install|list ...`. Licencia del SDK aceptada por el usuario.
  - Caché de Gradle en `E:\Android\gradle`.
  - Las variables de entorno globales **no se tocaron** (el `JAVA_HOME` global sigue en JDK 8 para
    el trabajo del usuario).
  - **Generar el APK:** desde `app/`: `powershell -ExecutionPolicy Bypass -File scripts\apk.ps1`
    (fija las rutas solo para ese proceso; compila producción, `cap sync`, `gradlew assembleDebug
    --no-daemon`). Resultado: `apk\HouseApp.apk` en la raíz del repo.
  - El APK se firma con `C:\Users\jicm_\.android\debug.keystore`: **no borrarla**, o para actualizar
    habría que desinstalar la app (los datos siguen en Firebase, pero hay que reescribir el código).

## Reglas y convenciones
- Acceso a datos solo por `src/app/data/` (repositorios con observables en tiempo real y métodos
  async). Las pantallas usan `toSignal(repo.todos$)`.
- **Nunca esperar (`await`) una escritura de Firestore**: sin internet no resuelve hasta reconectar.
  Usar `hogarDb.enviar(setDoc(...))`; para crear, generar el id con `doc(coleccion)`.
  Excepción: lo que necesita servidor (crear/unirse a hogar, cargas iniciales).
- Borrado lógico (`activo`) en catálogos (clasificaciones, artículos, recetas).
- Nombres en español en dominio y UI. Comparar nombres con `claveTexto()` para evitar duplicados.
- Componentes abiertos como modal: sufijo `Component` (lint), nunca una propiedad llamada `modal`
  (Ionic la reserva) y cerrarlos con `cerrarEsteModal()`, no con `modalCtrl.dismiss()` (con modales
  anidados puede cerrar el equivocado).
- Antes de commitear: `npx ng lint` y `npx ng build` desde `app/` (y `npx prettier --write`).
- No editar archivos con `Get-Content`/`Set-Content` de PowerShell 5.1: rompe acentos y agrega BOM.
- Al probar en el navegador con los datos reales del usuario: no tocar lo que él capturó y
  limpiar lo que se agregue de prueba.

## Progreso
- **Etapa 0 — Preparación:** proyecto, Firebase, hogar con código, reglas de seguridad.
- **Etapa 1 — Catálogos:** pestañas; clasificaciones (12 iniciales automáticas; crear, editar,
  ícono y color, ordenar, inactivar con validación de artículos activos); artículos (buscador con
  "Crear…", agrupados por clasificación, básico, inactivar/ver inactivos) y 72 artículos iniciales.
- **Etapa 2 — Recetario:** búsqueda, "Crear receta…", filtro por etiqueta, inactivas; formulario con
  ingredientes (selector) y etiquetas con autocompletado.
- **Etapa 3 — Calendario:** semana y mes, agregar receta/nueva receta/día especial, detalle con
  ajuste solo del día y pregunta de cambiar la receta, quitar del día, pregunta de días futuros.
- **Etapa 4 — Lista del súper:** generar por rango con vista previa, agrupada y ordenada, orígenes,
  básicos, quitar/regresar, agregar a mano, aviso de cambios + actualizar, generar nueva con
  confirmación. Adelantado de la Etapa 5: palomear y barra de progreso.
- **Etapa 6 — APK:** plataforma Android agregada, script de compilación y primer APK (válido,
  revisado con `aapt2`/`apksigner`). Ícono y pantalla de carga: los genéricos de Capacitor.

## Pendientes
- [ ] **Etapa 5:** instalar el APK en los dos celulares y probar tiempo real y modo sin internet.
- [ ] Probar en un celular la pregunta de "actualizar las comidas planeadas desde hoy" al editar una
      receta (el código está, pero no se probó en el navegador para no modificar la receta real).
- [ ] Ícono y pantalla de carga propios de HouseApp (opcional, ofrecido al usuario).
- [ ] Ajustes de diseño que pida el usuario al usar la app.
- Datos actuales del hogar del navegador: receta "Molida con bandera" (creada en pruebas, real),
  una Molida planeada el 27 oct (la puso el usuario) y una **lista activa de prueba** (27 oct–1 nov,
  ajo quitado, cebolla palomeada, papel de baño manual): se reemplaza al generar una nueva.
  En los celulares se puede crear un hogar nuevo o unirse al del navegador con su código.
