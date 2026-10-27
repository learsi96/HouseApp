import { Injectable, inject } from '@angular/core';
import { deleteDoc, doc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { HogarDb } from './hogar-db';
import type { ComidaPlaneada, Receta } from './modelos';

const COLECCION = 'comidas';

/** Opciones fijas de días especiales; además se puede escribir uno libre. */
export const ESPECIALES = [
  { nombre: 'Comemos fuera', icono: '🍽️' },
  { nombre: 'Sobras', icono: '🥡' },
  { nombre: 'Pedimos comida', icono: '🛵' },
];
export const ICONO_ESPECIAL_LIBRE = '📝';

function mapear(id: string, d: DocumentData): ComidaPlaneada {
  return {
    id,
    fecha: d['fecha'],
    tipo: d['tipo'],
    recetaId: d['recetaId'] ?? null,
    nombre: d['nombre'],
    icono: d['icono'] ?? '',
    ingredientes: d['ingredientes'] ?? [],
    orden: d['orden'] ?? 0,
  };
}

@Injectable({ providedIn: 'root' })
export class ComidasRepository {
  private readonly hogarDb = inject(HogarDb);

  /** Comidas entre dos fechas (inclusive), ordenadas por fecha y por orden de captura. */
  rango$(inicio: string, fin: string): Observable<ComidaPlaneada[]> {
    return this.hogarDb
      .escuchar(COLECCION, mapear, [where('fecha', '>=', inicio), where('fecha', '<=', fin)])
      .pipe(map((lista) => lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden)));
  }

  /** Lectura única del rango (del servidor, o de la caché si no hay internet). */
  async enRango(inicio: string, fin: string): Promise<ComidaPlaneada[]> {
    const snap = await getDocs(
      query(await this.hogarDb.coleccion(COLECCION), where('fecha', '>=', inicio), where('fecha', '<=', fin)),
    );
    return snap.docs.map((d) => mapear(d.id, d.data()));
  }

  async agregarReceta(fecha: string, receta: Pick<Receta, 'id' | 'nombre' | 'ingredientes'>): Promise<void> {
    await this.agregar({
      fecha,
      tipo: 'receta',
      recetaId: receta.id,
      nombre: receta.nombre,
      icono: '',
      ingredientes: [...receta.ingredientes],
    });
  }

  async agregarEspecial(fecha: string, nombre: string, icono: string): Promise<void> {
    await this.agregar({ fecha, tipo: 'especial', recetaId: null, nombre, icono, ingredientes: [] });
  }

  async actualizarIngredientes(id: string, ingredientes: string[]): Promise<void> {
    this.hogarDb.enviar(updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { ingredientes }));
  }

  /** Quitar una comida de un día sí la borra: no es catálogo, es la planeación. */
  async quitar(id: string): Promise<void> {
    this.hogarDb.enviar(deleteDoc(doc(await this.hogarDb.coleccion(COLECCION), id)));
  }

  /** Comidas de una receta desde una fecha (inclusive). Funciona sin internet con lo que haya en caché. */
  async deRecetaDesde(recetaId: string, desde: string): Promise<ComidaPlaneada[]> {
    // Solo igualdad en la consulta (sin índice compuesto); la fecha se filtra aquí.
    const snap = await getDocs(query(await this.hogarDb.coleccion(COLECCION), where('recetaId', '==', recetaId)));
    return snap.docs.map((d) => mapear(d.id, d.data())).filter((c) => c.fecha >= desde);
  }

  /** Copia a esas comidas el nombre y los ingredientes actuales de la receta. */
  async actualizarDesdeReceta(ids: string[], receta: Pick<Receta, 'nombre' | 'ingredientes'>): Promise<void> {
    const ref = await this.hogarDb.coleccion(COLECCION);
    const batch = writeBatch(this.hogarDb.db);
    ids.forEach((id) => batch.update(doc(ref, id), { nombre: receta.nombre, ingredientes: [...receta.ingredientes] }));
    this.hogarDb.enviar(batch.commit());
  }

  private async agregar(datos: Omit<ComidaPlaneada, 'id' | 'orden'>): Promise<void> {
    const ref = doc(await this.hogarDb.coleccion(COLECCION));
    this.hogarDb.enviar(setDoc(ref, { ...datos, orden: Date.now() }));
  }
}
