import type { OnInit } from '@angular/core';
import { Component, Input, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { IngredientesComponent } from '../catalogo/ingredientes.component';
import { deIso, fechaLarga } from '../data/fechas';
import type { ComidaPlaneada } from '../data/modelos';

export type ResultadoComidaDetalle = { accion: 'guardar'; ingredientes: string[] } | { accion: 'quitar' };

/** Ver y ajustar una comida de un día. Los ajustes solo afectan a este día. */
@Component({
  selector: 'app-comida-detalle',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ comida.icono }} {{ comida.nombre }}</ion-title>
        @if (comida.tipo === 'receta') {
          <ion-buttons slot="end">
            <ion-button strong (click)="guardar()">Guardar</ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <p class="fecha">{{ fecha }}</p>

      @if (comida.tipo === 'receta') {
        <app-ingredientes [ids]="ingredientes()" (cambio)="ingredientes.set($event)"></app-ingredientes>
        <ion-note class="ayuda">
          Los cambios aquí son solo para este día. Al guardar te pregunto si también quieres cambiar la receta.
        </ion-note>
      } @else {
        <div class="especial">
          <div class="icono">{{ comida.icono }}</div>
          <p>Día especial: no agrega nada a la lista del súper.</p>
        </div>
      }

      <div class="ion-padding">
        <ion-button expand="block" fill="outline" color="danger" (click)="cerrar({ accion: 'quitar' })">
          Quitar de este día
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: `
    .fecha {
      margin: 16px 16px 0;
      color: var(--ion-color-medium);
    }
    .ayuda {
      display: block;
      padding: 8px 16px;
    }
    .especial {
      text-align: center;
      margin-top: 15vh;
      color: var(--ion-color-medium);
    }
    .especial .icono {
      font-size: 56px;
    }
  `,
  imports: [IngredientesComponent, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonNote],
})
export class ComidaDetalleComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) comida!: ComidaPlaneada;

  readonly ingredientes = signal<string[]>([]);
  fecha = '';

  ngOnInit(): void {
    this.ingredientes.set([...this.comida.ingredientes]);
    this.fecha = fechaLarga(deIso(this.comida.fecha));
  }

  guardar(): void {
    this.cerrar({ accion: 'guardar', ingredientes: this.ingredientes() });
  }

  cerrar(resultado?: ResultadoComidaDetalle): void {
    this.modalCtrl.dismiss(resultado);
  }
}
