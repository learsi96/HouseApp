import { Component, inject, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';

import { HogarService } from '../core/hogar.service';

// Pantalla temporal: en la Etapa 3 se reemplaza por el calendario.
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage {
  readonly codigo = signal('');

  constructor() {
    inject(HogarService)
      .actual()
      .then((hogar) => this.codigo.set(hogar?.codigo ?? ''));
  }
}
