import { Injectable, inject } from '@angular/core';
import { addDoc, doc, getDocsFromServer, updateDoc, writeBatch } from 'firebase/firestore';
import { defer, from, map, shareReplay, switchMap } from 'rxjs';

import { HogarDb } from './hogar-db';
import type { Clasificacion, ColorClasificacion } from './modelos';

const COLECCION = 'clasificaciones';

// Lista inicial. Los ids son fijos para que, si los dos celulares la crean a la vez, no se dupliquen.
const INICIALES: Omit<Clasificacion, 'orden' | 'activo'>[] = [
  { id: 'frutas-verduras', nombre: 'Frutas y verduras', icono: '🥬', color: 'verde' },
  { id: 'carnes', nombre: 'Carnes y pescados', icono: '🥩', color: 'rojo' },
  { id: 'lacteos', nombre: 'Lácteos y huevo', icono: '🧀', color: 'amarillo' },
  { id: 'panaderia', nombre: 'Panadería y tortillas', icono: '🍞', color: 'cafe' },
  { id: 'abarrotes', nombre: 'Abarrotes', icono: '🥫', color: 'naranja' },
  { id: 'especias', nombre: 'Especias y condimentos', icono: '🧂', color: 'rosa' },
  { id: 'bebidas', nombre: 'Bebidas', icono: '🥤', color: 'azul' },
  { id: 'congelados', nombre: 'Congelados', icono: '🧊', color: 'turquesa' },
  { id: 'botanas', nombre: 'Botanas y dulces', icono: '🍪', color: 'morado' },
  { id: 'limpieza', nombre: 'Limpieza', icono: '🧴', color: 'azul' },
  { id: 'higiene', nombre: 'Higiene personal', icono: '🧼', color: 'rosa' },
  { id: 'otros', nombre: 'Otros', icono: '📦', color: 'gris' },
];

export type DatosClasificacion = Pick<Clasificacion, 'nombre' | 'icono' | 'color'>;

@Injectable({ providedIn: 'root' })
export class ClasificacionesRepository {
  private readonly hogarDb = inject(HogarDb);

  /** Todas (activas e inactivas), ordenadas por el recorrido del súper. */
  readonly todas$ = defer(() => from(this.asegurarIniciales())).pipe(
    switchMap(() =>
      this.hogarDb.escuchar<Clasificacion>(COLECCION, (id, d) => ({
        id,
        nombre: d['nombre'],
        icono: d['icono'],
        color: d['color'],
        orden: d['orden'],
        activo: d['activo'],
      })),
    ),
    map((lista) => lista.sort((a, b) => a.orden - b.orden)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  async crear(datos: DatosClasificacion, orden: number): Promise<void> {
    this.hogarDb.enviar(addDoc(await this.hogarDb.coleccion(COLECCION), { ...datos, orden, activo: true }));
  }

  async actualizar(id: string, datos: DatosClasificacion): Promise<void> {
    this.hogarDb.enviar(updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { ...datos }));
  }

  async cambiarActivo(id: string, activo: boolean): Promise<void> {
    this.hogarDb.enviar(updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { activo }));
  }

  /** Guarda el orden recibido (índice = posición en el recorrido del súper). */
  async reordenar(ids: string[]): Promise<void> {
    const ref = await this.hogarDb.coleccion(COLECCION);
    const batch = writeBatch(this.hogarDb.db);
    ids.forEach((id, orden) => batch.update(doc(ref, id), { orden }));
    this.hogarDb.enviar(batch.commit());
  }

  private async asegurarIniciales(): Promise<void> {
    const ref = await this.hogarDb.coleccion(COLECCION);
    // Se consulta al servidor (no a la caché): sin internet no se sabe si ya existen y no se crea nada,
    // para no pisar cambios que el hogar ya haya hecho a la lista inicial.
    try {
      if (!(await getDocsFromServer(ref)).empty) {
        return;
      }
    } catch {
      return;
    }
    const batch = writeBatch(this.hogarDb.db);
    INICIALES.forEach(({ id, ...datos }, orden) => batch.set(doc(ref, id), { ...datos, orden, activo: true }));
    await batch.commit();
  }
}

export const COLORES: ColorClasificacion[] = [
  'verde',
  'rojo',
  'amarillo',
  'cafe',
  'naranja',
  'rosa',
  'azul',
  'turquesa',
  'morado',
  'gris',
];

export const ICONOS = [
  '🥬',
  '🍎',
  '🥕',
  '🧅',
  '🥑',
  '🍋',
  '🥩',
  '🍗',
  '🐟',
  '🦐',
  '🧀',
  '🥛',
  '🥚',
  '🍞',
  '🌽',
  '🫓',
  '🥫',
  '🍝',
  '🍚',
  '🫘',
  '🧂',
  '🌶️',
  '🫙',
  '🥤',
  '☕',
  '🍺',
  '🧊',
  '🍪',
  '🍫',
  '🧴',
  '🧽',
  '🧻',
  '🧼',
  '🪥',
  '💊',
  '🐶',
  '🐱',
  '👶',
  '🌿',
  '📦',
  '🛒',
  '⭐',
];
