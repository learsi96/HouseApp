import { Injectable, inject } from '@angular/core';
import { addDoc, doc, updateDoc } from 'firebase/firestore';
import { map, shareReplay } from 'rxjs';

import { HogarDb } from './hogar-db';
import type { Articulo } from './modelos';
import { claveTexto } from './texto';

const COLECCION = 'articulos';

export type DatosArticulo = Pick<Articulo, 'nombre' | 'clasificacionId' | 'basico'>;

@Injectable({ providedIn: 'root' })
export class ArticulosRepository {
  private readonly hogarDb = inject(HogarDb);

  /** Todos (activos e inactivos), en orden alfabético. */
  readonly todos$ = this.hogarDb
    .escuchar<Articulo>(COLECCION, (id, d) => ({
      id,
      nombre: d['nombre'],
      clasificacionId: d['clasificacionId'],
      basico: d['basico'] ?? false,
      activo: d['activo'],
    }))
    .pipe(
      map((lista) => lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  /** Devuelve el id del artículo creado. */
  async crear(datos: DatosArticulo): Promise<string> {
    const ref = await addDoc(await this.hogarDb.coleccion(COLECCION), this.documento(datos, true));
    return ref.id;
  }

  async actualizar(id: string, datos: DatosArticulo): Promise<void> {
    const { nombre, clave, clasificacionId, basico } = this.documento(datos, true);
    await updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { nombre, clave, clasificacionId, basico });
  }

  async cambiarActivo(id: string, activo: boolean): Promise<void> {
    await updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { activo });
  }

  // `clave` se guarda para poder buscar duplicados del lado del servidor el día que se migre a SQL.
  private documento(datos: DatosArticulo, activo: boolean) {
    return { ...datos, clave: claveTexto(datos.nombre), activo };
  }
}
