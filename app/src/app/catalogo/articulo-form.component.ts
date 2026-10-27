import type { OnInit } from '@angular/core';
import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import type { DatosArticulo } from '../data/articulos.repository';
import type { Articulo, Clasificacion } from '../data/modelos';
import { claveTexto, limpiarNombre } from '../data/texto';

/** Resultado: los datos a guardar, o 'cambiar-activo' para inactivar/reactivar. */
export type ResultadoArticuloForm = DatosArticulo | 'cambiar-activo';

@Component({
  selector: 'app-articulo-form',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ articulo ? 'Editar' : 'Nuevo' }} artículo</ion-title>
        <ion-buttons slot="end">
          <ion-button strong (click)="guardar()">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item>
          <ion-input
            label="Nombre"
            labelPlacement="stacked"
            fill="outline"
            placeholder="Ej. Cebolla"
            [(ngModel)]="nombre"
            (ionInput)="error.set('')"
          ></ion-input>
        </ion-item>
        @if (error()) {
          <ion-note color="danger" class="error">{{ error() }}</ion-note>
        }

        <ion-item>
          <ion-select
            label="Clasificación"
            labelPlacement="stacked"
            fill="outline"
            interface="action-sheet"
            cancelText="Cancelar"
            [(ngModel)]="clasificacionId"
          >
            @for (c of clasificaciones; track c.id) {
              <ion-select-option [value]="c.id">{{ c.icono }} {{ c.nombre }}</ion-select-option>
            }
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-toggle [(ngModel)]="basico" justify="space-between">
            <ion-label>
              Básico de despensa
              <p>Casi siempre lo tienen en casa (sal, aceite…). En la lista sale con una marca.</p>
            </ion-label>
          </ion-toggle>
        </ion-item>
      </ion-list>

      @if (articulo) {
        <ion-button
          expand="block"
          fill="outline"
          [color]="articulo.activo ? 'danger' : 'primary'"
          class="boton-activo"
          (click)="cerrar('cambiar-activo')"
        >
          {{ articulo.activo ? 'Inactivar artículo' : 'Reactivar artículo' }}
        </ion-button>
      }
    </ion-content>
  `,
  styles: `
    .error {
      display: block;
      padding: 4px 16px;
    }
    ion-item {
      --padding-bottom: 8px;
    }
    .boton-activo {
      margin-top: 32px;
    }
  `,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonLabel,
    IonNote,
  ],
})
export class ArticuloFormComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  /** Artículo a editar; sin valor = nuevo. */
  @Input() articulo?: Articulo;
  /** Nombre sugerido para un artículo nuevo (lo que se escribió en el buscador). */
  @Input() nombreInicial = '';
  /** Clasificaciones activas para elegir. */
  @Input() clasificaciones: Clasificacion[] = [];
  /** Todos los artículos, para validar nombres repetidos. */
  @Input() existentes: Articulo[] = [];

  readonly error = signal('');
  nombre = '';
  clasificacionId = '';
  basico = false;

  ngOnInit(): void {
    if (this.articulo) {
      this.nombre = this.articulo.nombre;
      this.clasificacionId = this.articulo.clasificacionId;
      this.basico = this.articulo.basico;
    } else {
      this.nombre = limpiarNombre(this.nombreInicial);
      this.clasificacionId = (this.clasificaciones.find((c) => c.id === 'otros') ?? this.clasificaciones[0])?.id ?? '';
    }
  }

  guardar(): void {
    const nombre = limpiarNombre(this.nombre);
    if (!nombre) {
      this.error.set('Escribe un nombre.');
      return;
    }
    const repetido = this.existentes.find(
      (a) => a.id !== this.articulo?.id && claveTexto(a.nombre) === claveTexto(nombre),
    );
    if (repetido) {
      this.error.set(
        repetido.activo
          ? `Ya existe "${repetido.nombre}".`
          : `Ya existe "${repetido.nombre}" (inactivo). Reactívalo desde la lista.`,
      );
      return;
    }
    if (!this.clasificacionId) {
      this.error.set('Elige una clasificación.');
      return;
    }
    this.cerrar({ nombre, clasificacionId: this.clasificacionId, basico: this.basico });
  }

  cerrar(resultado?: ResultadoArticuloForm): void {
    this.modalCtrl.dismiss(resultado);
  }
}
