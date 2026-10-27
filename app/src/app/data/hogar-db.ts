import { Injectable, inject } from '@angular/core';
import type { CollectionReference, DocumentData, Firestore } from 'firebase/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';

import { FirebaseService } from '../core/firebase.service';
import { HogarService } from '../core/hogar.service';

/** Acceso a las colecciones del hogar actual (`hogares/{hogarId}/...`). Solo lo usan los repositorios. */
@Injectable({ providedIn: 'root' })
export class HogarDb {
  private readonly firebase = inject(FirebaseService);
  private readonly hogarService = inject(HogarService);

  get db(): Firestore {
    return this.firebase.db;
  }

  async coleccion(nombre: string): Promise<CollectionReference<DocumentData>> {
    const hogar = await this.hogarService.actual();
    if (!hogar) {
      throw new Error('Este celular todavía no pertenece a un hogar');
    }
    return collection(this.firebase.db, 'hogares', hogar.id, nombre);
  }

  /**
   * Las escrituras de Firestore solo resuelven cuando el servidor confirma: sin internet se quedarían
   * esperando. Como se aplican de inmediato en la caché local (y se ven en pantalla), no se esperan.
   */
  enviar(escritura: Promise<unknown>): void {
    escritura.catch((error) => console.error('No se pudo guardar en Firestore', error));
  }

  /** Escucha la colección en tiempo real (incluye cambios del otro celular y cambios hechos sin internet). */
  escuchar<T>(nombre: string, mapear: (id: string, data: DocumentData) => T): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      let cancelar: (() => void) | undefined;
      let cerrado = false;
      this.coleccion(nombre).then(
        (ref) => {
          if (cerrado) {
            return;
          }
          cancelar = onSnapshot(
            ref,
            (snap) => subscriber.next(snap.docs.map((d) => mapear(d.id, d.data()))),
            (error) => subscriber.error(error),
          );
        },
        (error) => subscriber.error(error),
      );
      return () => {
        cerrado = true;
        cancelar?.();
      };
    });
  }
}
