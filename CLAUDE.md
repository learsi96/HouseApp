# HouseApp — Contexto del proyecto

> Este archivo se carga automáticamente en cada sesión de Claude Code.
> Contiene el contexto principal del proyecto.

## Estado actual
Definición del MVP **cerrada** (bloques 1 a 8). Desarrollo por etapas: ver **Progreso**.

## Descripción general
App móvil para planear las comidas de la semana y generar la lista del súper.
Nace de una necesidad real en casa: el usuario y su pareja hacen la lista de compras
(comidas y cosas de la casa) en la app de notas del celular, y no les da la funcionalidad que necesitan.

## Plataforma
- Inicialmente **Android**.
- iOS **solo si el usuario lo pide más adelante** (puede que no). Aun así, conviene no cerrar esa puerta.

## Funcionalidad principal (idea original)
1. **Calendario de comidas**
   - Seleccionar un día y agregar la comida planeada (ej. "Molida con bandera").
   - Cada comida tiene su lista de ingredientes, que se capturan uno por uno.
   - La idea es definir las comidas de la semana antes de que empiece.
2. **Lista de compras semanal**
   - Se genera con todos los ingredientes de todas las comidas de la semana.
3. **Plus: historial / recetario**
   - Las comidas ya capturadas se guardan para reutilizarlas: se elige una comida anterior
     y sus ingredientes se cargan solos, sin teclearlos otra vez.

## Usuarios y uso compartido (Bloque 1 — definido)
- MVP: **un solo hogar**, solo el usuario y su pareja.
- Los dos tienen **los mismos permisos**: planear, editar recetas, modificar la lista.
- MVP: **no** se registra quién agregó o modificó algo (sería para la versión formal).
- MVP: **sin pantalla de login**, se entra directo.

## Comidas y recetas (Bloque 2 — definido)
- MVP: una receta tiene **nombre + ingredientes**; cada ingrediente tiene una **clasificación**
  (Verduras, Carnes, etc.).
- Las recetas se clasifican con **etiquetas libres**, varias por receta (ej. "pollo", "rápida").
  Al escribir una etiqueta se autocompletan las existentes, para no duplicar "Pollo" y "pollo".
- Se pueden crear de **dos formas**: desde el día del calendario (se guarda sola en el recetario)
  o desde una sección de recetario.
- Las recetas se pueden **editar**. El borrado es **lógico** (inactivar), nunca físico.
- No puede haber dos recetas **activas** con el mismo nombre; si ya existe, se sugiere la existente.

### Modelo receta y comida planeada
- **Receta** = plantilla única en el recetario.
- **Comida planeada** = receta asignada a un día, con su **propia copia** de ingredientes.
- Un ajuste de ingredientes en un día solo afecta a esa comida planeada. Al guardar, se pregunta
  si el cambio también se guarda en la receta (se actualiza la misma, no se crea otra).
- Al editar una receta que tiene días **futuros** ya planeados, se pregunta si actualizarlos también.
- Los días pasados nunca cambian (historial fiel).
- La **lista de compras se genera de las comidas planeadas**, no de las recetas.
- Tablas previstas en SQL: `Receta`, `RecetaIngrediente`, `RecetaEtiqueta`, `ComidaPlaneada`,
  `ComidaPlaneadaIngrediente`.

## Catálogo de artículos (Bloque 3 — definido)
- **Catálogo único de artículos**: ingredientes de comida **y** cosas de la casa (limpieza, higiene…).
  Así se puede agregar algo a la lista aunque no lo use ninguna receta de la semana.
- Cada artículo existe **una sola vez** y las recetas lo referencian. Al escribir se autocompleta.
- Borrado lógico (inactivar).
- **Clasificaciones**: la app trae una lista inicial (Verduras, Carnes, Lácteos, Limpieza, Higiene…)
  y los usuarios pueden agregar, editar e inactivar.
- MVP: **solo nombre**, sin cantidad ni unidad. En la lista, los repetidos se juntan en uno
  indicando de qué comidas vienen (ej. "Cebolla — Molida con bandera, Tinga").
- Marca **"básico de despensa"** en el artículo (sal, aceite, azúcar…). Cómo se comporta en la
  lista se define en el Bloque 5.
- Tablas previstas en SQL: `Articulo`, `Clasificacion`.

## Calendario (Bloque 4 — definido)
- **Varias comidas por día**, sin tiempos fijos (sin desayuno/comida/cena obligatorios).
- Vista **semanal y mensual**, con un botón para cambiar entre ellas.
- Se puede planear **varias semanas hacia adelante**, en cualquier día y en cualquier orden.
- La semana no tiene un inicio fijo. Suelen comprar el sábado o el domingo, pero eso no limita
  la planeación.
- **Días especiales** sin receta ("comemos fuera", "sobras"…): no generan artículos en la lista.
- **Fuera del MVP:** copiar una semana, mover o duplicar comidas entre días.

## Lista del súper (Bloque 5 — definido)
- Botón **"Generar lista del súper"**: los usuarios **siempre eligen** fecha inicio y fecha fin
  (sin rango por defecto).
- La lista **se genera y se guarda** (no se recalcula sola). Si después cambian las comidas del
  rango, la app avisa y ofrece **actualizar la lista**. Al actualizar se conservan los palomeados,
  los artículos manuales y los quitados.
- Se pueden **agregar artículos manuales** del catálogo (no ligados a una comida).
- Se pueden **quitar artículos** de la lista sin afectar la receta ni la comida planeada.
- **Básicos de despensa**: aparecen normal pero con una **marca visual**.
- MVP: **una sola lista activa** a la vez. Al generar una nueva, **reemplaza** a la anterior
  (con confirmación previa). No se archivan listas anteriores.
- Tablas previstas en SQL: `ListaCompra`, `ListaCompraArticulo`.

## Modo súper (Bloque 6 — definido)
- La lista se agrupa por **clasificación**. Los usuarios pueden **ordenar las clasificaciones**
  según el recorrido de su súper (campo de orden en `Clasificacion`).
- Al palomear, el artículo **se tacha y se va al final de su grupo**.
- **Tiempo real** entre los dos: cada uno ve lo que el otro palomea.
- **Funciona sin internet**: se palomea sin señal y se sincroniza al recuperarla (offline-first).
- No hay acción de "Terminar compra" que cambie algo: lo que no se palomeó se queda tal cual
  hasta que se genere una nueva lista.

## Experiencia de uso (Bloque 7 — definido)
- **Pantalla de inicio:** el calendario, en la semana actual.
- **Sin notificaciones** en el MVP.
- **Apariencia:** la elige Claude (ver propuesta de diseño). El usuario quiere ver el diseño
  visualmente (Figma o algún diseñador de apps) **antes** de desarrollar.

## Fuera del MVP (propuestas para MVP 2 o posteriores)
- Recetas favoritas o más usadas primero; notas o pasos; foto; link externo; porciones; precios
  y total estimado.
- Notificaciones (sin comidas planeadas, cambios hechos por la pareja…).
- Archivar e historial de listas pasadas.
- Varias listas activas al mismo tiempo.
- Pasar los pendientes de una lista a la siguiente.
- Copiar una semana; mover o duplicar comidas entre días.
- Cantidades y unidades en los artículos.
- Registro de quién agregó o modificó algo.
- Login (Google y cuenta propia), backend .NET 10 + BD SQL, publicación en Play Store.
- iOS (solo si se pide).

## Stack tecnológico (Bloque 8 — definido)
- **App:** **Ionic + Angular** (el usuario ya lo conoce) + **Capacitor** para generar el APK de Android.
- **Datos:** Firebase JS SDK — Firestore con caché persistente (modo sin internet + tiempo real)
  y Firebase Anonymous Auth (invisible) para poder usar reglas de seguridad.
- En Firebase la app se registra como **app Web** (el Firebase JS SDK corre dentro del WebView de
  Capacitor). Registrar la app Android (`google-services.json`) solo hará falta si se usan
  funciones nativas, como notificaciones push (MVP 2).
- **Distribución del MVP:** APK instalado directo en los dos celulares, opcionalmente con
  Firebase App Distribution. No va a Play Store.
- **Repositorio:** GitHub **privado** en la cuenta **`learsi96`**. El git global de la máquina
  usa la identidad de trabajo (`IsraelMovit96`), así que en este repo se configura
  `user.name`/`user.email` **locales** de la cuenta personal. Nunca commitear con el correo de trabajo.
- **Diseño:** sin prototipo previo (no hay Figma disponible). Se desarrolla directo y el usuario
  pide correcciones de diseño sobre la marcha. Dirección visual: Material 3 (Ionic en modo `md`),
  verde albahaca como principal, acento terracota, tema claro/oscuro según el sistema, ícono y
  color suave por clasificación.

## Estructura del repositorio
- `app/` → app Ionic 9 + Angular 22 (standalone) + Capacitor 8. `appId`: `com.learsi96.houseapp`.
  Comandos desde `app/`: `ionic serve`, `npx ng build`.
- (Futuro) `backend/` → API .NET 10, si se formaliza.
- Remoto: `https://learsi96@github.com/learsi96/HouseApp.git` (el usuario en la URL hace que
  Git Credential Manager use la cuenta personal). Rama `main`.
- Identidad local del repo: `learsi96` / `92958189+learsi96@users.noreply.github.com`.

## Entorno de desarrollo (revisado el 2026-10-27)
- Ionic CLI 7.2.1 instalado en Node 22.23.3 (2026-10-27).
- OK: Node 22.23.3, npm 10.9.9, Git, JDK 17 en el PATH.
- La máquina usa **nvm-windows** (versión activa: Node 22.23.3). Cada versión de Node tiene sus
  propios paquetes globales: Ionic CLI 7.x solo está en Node 10.16.3 y 16.20.0 (viejos);
  Angular CLI 21.2.7 en Node 22.16.0. En la versión activa no hay ninguno de los dos.
- Usar el Angular CLI local del proyecto (`npx ng`).
- Falta: **Android Studio + Android SDK**. `C:\Program Files\Android` solo tiene restos de una
  instalación anterior; `ANDROID_SDK_ROOT` apunta a una carpeta que no existe.
- Ajustar: `JAVA_HOME` apunta a JDK 8; Capacitor reciente requiere **JDK 21**
  (usar el JBR que trae Android Studio).
- No está instalado GitHub CLI (`gh`).
- **Futuro (si se formaliza y se publica en Play Store):** migrar a BD SQL + backend **.NET 10**,
  con login por Google y por cuenta propia en la BD, y registro de quién hace cada cambio.

## Reglas y convenciones
- Borrado lógico (campo activo/inactivo) en los catálogos, como las recetas.
- Separar el acceso a datos detrás de una capa de repositorios/servicios, para que migrar
  de Firebase a .NET + SQL no obligue a reescribir la UI.
  - `src/app/data/`: modelos planos (`modelos.ts`) y un repositorio por colección, que expone
    observables en tiempo real (`todos$`) y métodos async. Solo `HogarDb` toca Firestore.
  - Las pantallas usan `toSignal(repo.todos$)`; la app es **zoneless** (sin zone.js).
- Nombres en español en el dominio y la UI (`Articulo`, `Clasificacion`, `crear`, `cambiarActivo`…).
- Comparar nombres con `claveTexto()` (sin acentos ni mayúsculas) para evitar duplicados.
- Componentes abiertos como modal: sufijo `Component` (regla de lint) y **nunca** una propiedad
  llamada `modal` (Ionic la reserva); usar `modalCtrl`.
- Antes de commitear: `npx ng lint` y `npx ng build` desde `app/`.
- No editar archivos con `Get-Content`/`Set-Content` de PowerShell 5.1: rompe los acentos y agrega BOM.

## Progreso
- **Etapa 0 (preparación):** terminada. Proyecto, Firebase, hogar con código, reglas.
- **Etapa 1 (catálogos):** terminada. Pestañas (Calendario, Recetas, Lista y Más; las tres
  primeras todavía son pantallas temporales), clasificaciones (12 iniciales que se crean solas;
  crear, editar, ícono y color, ordenar, inactivar) y artículos (búsqueda, "Crear…" desde el
  buscador, agrupados por clasificación, básico de despensa, inactivar y ver inactivos).
  Catálogo inicial de 72 artículos comunes (`data/articulos-iniciales.ts`), que se cargan **una
  sola vez por hogar** (marca en `hogares/{id}/config/semillas`) y se saltan los que ya existan.
- **Siguiente:** Etapa 2 (recetario).

## Decisiones tomadas
- Firebase para el MVP; .NET 10 + SQL solo si se formaliza (ver Stack).
- Sin login visible en el MVP: se usa Firebase Anonymous Auth (un usuario por celular).
- **Código de hogar:** la primera vez, un celular crea el hogar y recibe un código (ej. `K7P-42Q`);
  el otro celular se une escribiéndolo. Se hace una sola vez por celular (si se reinstala la app,
  se vuelve a capturar el código). Modelo en Firestore: `usuarios/{uid}`, `codigos/{codigo}`,
  `hogares/{hogarId}` con `miembros[]`, y todos los datos bajo `hogares/{hogarId}/...`.
  Las reglas están en `firestore.rules` (raíz del repo) y solo dejan entrar a los miembros del hogar.

## Preguntas abiertas
_Ver la retroalimentación del análisis inicial; se irán anotando aquí las respuestas._
