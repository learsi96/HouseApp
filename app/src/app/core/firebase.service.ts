import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, User, indexedDBLocalPersistence, initializeAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

import { environment } from '../../environments/environment';

/**
 * Punto único de acceso a Firebase. Las pantallas no lo usan directo:
 * pasan por los repositorios, para poder migrar a .NET + SQL sin tocar la UI.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp = initializeApp(environment.firebase);

  // initializeAuth (no getAuth) para no cargar el resolver de popups, que falla dentro del WebView de Capacitor.
  readonly auth: Auth = initializeAuth(this.app, { persistence: indexedDBLocalPersistence });

  // Caché persistente: la app funciona sin internet y sincroniza al recuperar la señal.
  readonly db: Firestore = initializeFirestore(this.app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  /** Resuelve con el usuario anónimo; lo crea la primera vez que se abre la app. */
  readonly user: Promise<User> = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(this.auth).then((cred) => resolve(cred.user), reject);
      }
    });
  });
}
