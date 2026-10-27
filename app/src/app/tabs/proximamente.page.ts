import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

// Pantalla temporal para las pestañas que se construyen en etapas posteriores.
@Component({
  selector: 'app-proximamente',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ datos['titulo'] }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="vacio">
        <div class="icono">🚧</div>
        <p>{{ datos['mensaje'] }}</p>
      </div>
    </ion-content>
  `,
  styles: `
    .vacio {
      text-align: center;
      margin-top: 30vh;
      color: var(--ion-color-medium);
    }
    .icono {
      font-size: 48px;
    }
  `,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class ProximamentePage {
  readonly datos = inject(ActivatedRoute).snapshot.data;
}
