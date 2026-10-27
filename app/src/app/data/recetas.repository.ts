import { Injectable, inject } from '@angular/core';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { map, shareReplay } from 'rxjs';

import { HogarDb } from './hogar-db';
import type { Receta } from './modelos';
import { claveTexto } from './texto';

const COLECCION = 'recetas';

export type DatosReceta = Pick<Receta, 'nombre' | 'ingredientes' | 'etiquetas'>;

@Injectable({ providedIn: 'root' })
export class RecetasRepository {
  private readonly hogarDb = inject(HogarDb);

  /** Todas (activas e inactivas), en orden alfabético. */
  readonly todas$ = this.hogarDb
    .escuchar<Receta>(COLECCION, (id, d) => ({
      id,
      nombre: d['nombre'],
      ingredientes: d['ingredientes'] ?? [],
      etiquetas: d['etiquetas'] ?? [],
      activo: d['activo'],
    }))
    .pipe(
      map((lista) => lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  /** Devuelve el id de la receta creada. */
  async crear(datos: DatosReceta): Promise<string> {
    const ref = doc(await this.hogarDb.coleccion(COLECCION));
    this.hogarDb.enviar(setDoc(ref, { ...this.documento(datos), activo: true, creadaEn: serverTimestamp() }));
    return ref.id;
  }

  async actualizar(id: string, datos: DatosReceta): Promise<void> {
    this.hogarDb.enviar(updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), this.documento(datos)));
  }

  async cambiarActivo(id: string, activo: boolean): Promise<void> {
    this.hogarDb.enviar(updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { activo }));
  }

  private documento(datos: DatosReceta): DatosReceta & { clave: string } {
    return {
      nombre: datos.nombre,
      clave: claveTexto(datos.nombre),
      ingredientes: [...new Set(datos.ingredientes)],
      etiquetas: [...new Set(datos.etiquetas)],
    };
  }
}
