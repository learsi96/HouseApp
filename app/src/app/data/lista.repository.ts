import { Injectable, inject } from '@angular/core';
import { FieldPath, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { shareReplay } from 'rxjs';

import { HogarDb } from './hogar-db';
import type { Derivados } from './lista';
import { actualizarLista, nuevaListaConManuales } from './lista';
import type { ArticuloLista, ListaCompra } from './modelos';

const COLECCION = 'listas';
// En el MVP hay una sola lista activa; generar otra la reemplaza.
const ACTIVA = 'activa';

type CampoArticulo = 'manual' | 'quitado' | 'comprado';

// En Firestore los artículos se guardan como mapa por articuloId: así cada celular puede palomear
// su artículo con una escritura independiente sin pisar lo que palomea el otro.
function aMapa(articulos: ArticuloLista[]): Record<string, Omit<ArticuloLista, 'articuloId'>> {
  return Object.fromEntries(articulos.map(({ articuloId, ...resto }) => [articuloId, resto]));
}

function mapear(d: DocumentData): ListaCompra {
  const articulos = Object.entries((d['articulos'] ?? {}) as Record<string, DocumentData>).map(([articuloId, a]) => ({
    articuloId,
    origenes: a['origenes'] ?? [],
    manual: a['manual'] ?? false,
    quitado: a['quitado'] ?? false,
    comprado: a['comprado'] ?? false,
  }));
  return { inicio: d['inicio'], fin: d['fin'], articulos };
}

@Injectable({ providedIn: 'root' })
export class ListaRepository {
  private readonly hogarDb = inject(HogarDb);

  /** La lista activa, o null si todavía no se ha generado ninguna. */
  readonly activa$ = this.hogarDb
    .escucharDoc(COLECCION, ACTIVA, mapear)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  /** Crea la lista del rango; si ya había una, la reemplaza pasando sus agregados a mano pendientes. */
  async generar(inicio: string, fin: string, derivados: Derivados, anterior: ListaCompra | null): Promise<void> {
    const articulos = nuevaListaConManuales(anterior?.articulos ?? [], derivados);
    this.hogarDb.enviar(
      setDoc(await this.ref(), { inicio, fin, generadaEn: serverTimestamp(), articulos: aMapa(articulos) }),
    );
  }

  /** Aplica los cambios de las comidas conservando palomeados, manuales y quitados. */
  async actualizar(lista: ListaCompra, derivados: Derivados): Promise<void> {
    this.hogarDb.enviar(updateDoc(await this.ref(), { articulos: aMapa(actualizarLista(lista.articulos, derivados)) }));
  }

  /** Agrega artículos a mano. Si alguno estaba quitado, regresa a la lista. */
  async agregarManuales(lista: ListaCompra, ids: string[]): Promise<void> {
    const actuales = new Map(lista.articulos.map((a) => [a.articuloId, a]));
    const ref = await this.ref();
    const cambios: unknown[] = [];
    for (const id of ids) {
      const existente = actuales.get(id);
      if (existente) {
        cambios.push(new FieldPath('articulos', id, 'manual'), true, new FieldPath('articulos', id, 'quitado'), false);
      } else {
        cambios.push(new FieldPath('articulos', id), {
          origenes: [],
          manual: true,
          quitado: false,
          comprado: false,
        });
      }
    }
    if (cambios.length) {
      const [campo, valor, ...resto] = cambios;
      this.hogarDb.enviar(updateDoc(ref, campo as FieldPath, valor, ...resto));
    }
  }

  async marcar(articuloId: string, campo: CampoArticulo, valor: boolean): Promise<void> {
    this.hogarDb.enviar(updateDoc(await this.ref(), new FieldPath('articulos', articuloId, campo), valor));
  }

  private async ref() {
    return doc(await this.hogarDb.coleccion(COLECCION), ACTIVA);
  }
}
