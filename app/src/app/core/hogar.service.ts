import { Injectable, inject } from '@angular/core';
import { arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

import { FirebaseService } from './firebase.service';

export interface Hogar {
  id: string;
  codigo: string;
}

// Sin 0/O, 1/I/L para que el código se pueda dictar y teclear sin confusiones.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Hogar al que pertenece este celular. Se crea o se une con código una sola vez. */
@Injectable({ providedIn: 'root' })
export class HogarService {
  private readonly firebase = inject(FirebaseService);
  private hogar: Hogar | null = null;

  /** Hogar actual, o null si este celular todavía no pertenece a ninguno. */
  async actual(): Promise<Hogar | null> {
    if (this.hogar) {
      return this.hogar;
    }
    const user = await this.firebase.user;
    const usuario = await getDoc(doc(this.firebase.db, 'usuarios', user.uid));
    const hogarId = usuario.get('hogarId') as string | undefined;
    if (!hogarId) {
      return null;
    }
    const hogar = await getDoc(doc(this.firebase.db, 'hogares', hogarId));
    this.hogar = { id: hogarId, codigo: hogar.get('codigo') as string };
    return this.hogar;
  }

  async crear(): Promise<Hogar> {
    const user = await this.firebase.user;
    const { db } = this.firebase;
    const hogarRef = doc(collection(db, 'hogares'));

    // Si el código ya existe, la regla rechaza el batch (create sin update) y se intenta con otro.
    for (let intento = 0; intento < 5; intento++) {
      const codigo = generarCodigo();
      const batch = writeBatch(db);
      batch.set(hogarRef, { codigo, miembros: [user.uid], creadoEn: serverTimestamp() });
      batch.set(doc(db, 'codigos', codigo), { hogarId: hogarRef.id });
      batch.set(doc(db, 'usuarios', user.uid), { hogarId: hogarRef.id });
      try {
        await batch.commit();
        this.hogar = { id: hogarRef.id, codigo };
        return this.hogar;
      } catch (e) {
        if (intento === 4) {
          throw e;
        }
      }
    }
    throw new Error('No se pudo crear el hogar');
  }

  /** Une este celular al hogar del código. Devuelve null si el código no existe. */
  async unirse(codigoCapturado: string): Promise<Hogar | null> {
    const user = await this.firebase.user;
    const { db } = this.firebase;
    const codigo = normalizarCodigo(codigoCapturado);

    const codigoDoc = await getDoc(doc(db, 'codigos', codigo));
    const hogarId = codigoDoc.get('hogarId') as string | undefined;
    if (!hogarId) {
      return null;
    }
    await updateDoc(doc(db, 'hogares', hogarId), { miembros: arrayUnion(user.uid) });
    await setDoc(doc(db, 'usuarios', user.uid), { hogarId });
    this.hogar = { id: hogarId, codigo };
    return this.hogar;
  }
}

function generarCodigo(): string {
  const valores = crypto.getRandomValues(new Uint32Array(6));
  const letras = Array.from(valores, (v) => ALFABETO[v % ALFABETO.length]).join('');
  return `${letras.slice(0, 3)}-${letras.slice(3)}`;
}

/** Acepta "k7p42q", "K7P 42Q" o "K7P-42Q". */
export function normalizarCodigo(texto: string): string {
  const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${limpio.slice(0, 3)}-${limpio.slice(3, 6)}`;
}
