import { Injectable, inject } from '@angular/core';
import { doc, getDocFromServer, getDocsFromServer, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { defer, from, map, shareReplay, switchMap } from 'rxjs';

import { ARTICULOS_INICIALES } from './articulos-iniciales';
import { HogarDb } from './hogar-db';
import type { Articulo } from './modelos';
import { claveTexto } from './texto';

const COLECCION = 'articulos';

export type DatosArticulo = Pick<Articulo, 'nombre' | 'clasificacionId' | 'basico'>;

@Injectable({ providedIn: 'root' })
export class ArticulosRepository {
  private readonly hogarDb = inject(HogarDb);

  /** Todos (activos e inactivos), en orden alfabético. */
  readonly todos$ = defer(() => from(this.asegurarIniciales())).pipe(
    switchMap(() =>
      this.hogarDb.escuchar<Articulo>(COLECCION, (id, d) => ({
        id,
        nombre: d['nombre'],
        clasificacionId: d['clasificacionId'],
        basico: d['basico'] ?? false,
        activo: d['activo'],
      })),
    ),
    map((lista) => lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Devuelve el id del artículo creado. */
  async crear(datos: DatosArticulo): Promise<string> {
    const ref = doc(await this.hogarDb.coleccion(COLECCION));
    this.hogarDb.enviar(setDoc(ref, this.documento(datos, true)));
    return ref.id;
  }

  async actualizar(id: string, datos: DatosArticulo): Promise<void> {
    const { nombre, clave, clasificacionId, basico } = this.documento(datos, true);
    this.hogarDb.enviar(
      updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { nombre, clave, clasificacionId, basico }),
    );
  }

  async cambiarActivo(id: string, activo: boolean): Promise<void> {
    this.hogarDb.enviar(updateDoc(doc(await this.hogarDb.coleccion(COLECCION), id), { activo }));
  }

  /**
   * Carga una sola vez por hogar los artículos comunes (marca en `config/semillas`), así no regresan
   * si después los inactivan. Se salta los que ya existan con el mismo nombre.
   * Se consulta al servidor: sin internet no se hace nada y se intenta la próxima vez.
   */
  private async asegurarIniciales(): Promise<void> {
    try {
      const ref = await this.hogarDb.coleccion(COLECCION);
      const marca = doc(await this.hogarDb.coleccion('config'), 'semillas');
      if ((await getDocFromServer(marca)).get('articulos')) {
        return;
      }
      const existentes = new Set((await getDocsFromServer(ref)).docs.map((d) => claveTexto(d.get('nombre'))));
      const batch = writeBatch(this.hogarDb.db);
      for (const [clasificacionId, lista] of Object.entries(ARTICULOS_INICIALES)) {
        for (const [nombre, basico = false] of lista) {
          const clave = claveTexto(nombre);
          if (!existentes.has(clave)) {
            // Id fijo: si los dos celulares cargan a la vez, no se duplican.
            const id = 'ini-' + clave.replace(/[^a-z0-9]+/g, '-');
            batch.set(doc(ref, id), this.documento({ nombre, clasificacionId, basico }, true));
          }
        }
      }
      batch.set(marca, { articulos: true }, { merge: true });
      await batch.commit();
    } catch (e) {
      console.warn('No se cargaron los artículos iniciales', e);
    }
  }

  // `clave` se guarda para poder buscar duplicados del lado del servidor el día que se migre a SQL.
  private documento(datos: DatosArticulo, activo: boolean) {
    return { ...datos, clave: claveTexto(datos.nombre), activo };
  }
}
