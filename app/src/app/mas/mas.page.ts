import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, layersOutline, pricetagsOutline } from 'ionicons/icons';

import { HogarService } from '../core/hogar.service';

@Component({
  selector: 'app-mas',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Más</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-list-header>Catálogos</ion-list-header>
        <ion-item routerLink="/mas/articulos" detail>
          <ion-icon slot="start" name="pricetags-outline" color="primary"></ion-icon>
          <ion-label>
            <h2>Artículos</h2>
            <p>Ingredientes y cosas de la casa</p>
          </ion-label>
        </ion-item>
        <ion-item routerLink="/mas/clasificaciones" detail>
          <ion-icon slot="start" name="layers-outline" color="primary"></ion-icon>
          <ion-label>
            <h2>Clasificaciones</h2>
            <p>Grupos y orden del recorrido en el súper</p>
          </ion-label>
        </ion-item>

        <ion-list-header>Hogar</ion-list-header>
        <ion-item button (click)="copiar()" [detail]="false">
          <ion-label>
            <h2>Código del hogar</h2>
            <p>Escríbelo en otro celular para compartir los datos</p>
          </ion-label>
          <ion-note slot="end" class="codigo">{{ codigo() }}</ion-note>
          <ion-icon slot="end" name="copy-outline"></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: `
    .codigo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--ion-color-primary);
    }
  `,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonLabel,
    IonNote,
  ],
})
export class MasPage {
  private readonly toast = inject(ToastController);
  readonly codigo = signal('');

  constructor() {
    addIcons({ pricetagsOutline, layersOutline, copyOutline });
    inject(HogarService)
      .actual()
      .then((hogar) => this.codigo.set(hogar?.codigo ?? ''));
  }

  async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codigo());
      await (await this.toast.create({ message: 'Código copiado', duration: 1500 })).present();
    } catch {
      // Sin permiso de portapapeles: el código queda visible en pantalla.
    }
  }
}
