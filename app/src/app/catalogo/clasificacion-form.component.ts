import type { OnInit } from '@angular/core';
import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { cerrarEsteModal } from '../core/modal';
import { COLORES, ICONOS } from '../data/clasificaciones.repository';
import type { DatosClasificacion } from '../data/clasificaciones.repository';
import type { Clasificacion, ColorClasificacion } from '../data/modelos';
import { claveTexto, limpiarNombre } from '../data/texto';

/** Resultado: los datos a guardar, o 'cambiar-activo' para inactivar/reactivar. */
export type ResultadoClasificacionForm = DatosClasificacion | 'cambiar-activo';

@Component({
  selector: 'app-clasificacion-form',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ clasificacion ? 'Editar' : 'Nueva' }} clasificación</ion-title>
        <ion-buttons slot="end">
          <ion-button strong (click)="guardar()">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="vista-previa">
        <span class="icono-clasificacion grande cl-{{ color() }}">{{ icono() }}</span>
      </div>

      <ion-list lines="none">
        <ion-item>
          <ion-input
            label="Nombre"
            labelPlacement="stacked"
            fill="outline"
            placeholder="Ej. Mascotas"
            [(ngModel)]="nombre"
            (ionInput)="error.set('')"
          ></ion-input>
        </ion-item>
        @if (error()) {
          <ion-note color="danger" class="error">{{ error() }}</ion-note>
        }

        <ion-list-header>Color</ion-list-header>
        <div class="opciones">
          @for (c of colores; track c) {
            <button
              type="button"
              class="opcion color cl-{{ c }}"
              [class.elegida]="c === color()"
              [attr.aria-label]="c"
              (click)="color.set(c)"
            ></button>
          }
        </div>

        <ion-list-header>Ícono</ion-list-header>
        <div class="opciones">
          @for (i of iconos; track i) {
            <button type="button" class="opcion" [class.elegida]="i === icono()" (click)="icono.set(i)">{{ i }}</button>
          }
        </div>
      </ion-list>

      @if (clasificacion) {
        <ion-button
          expand="block"
          fill="outline"
          [color]="clasificacion.activo ? 'danger' : 'primary'"
          class="boton-activo"
          (click)="cerrar('cambiar-activo')"
        >
          {{ clasificacion.activo ? 'Inactivar clasificación' : 'Reactivar clasificación' }}
        </ion-button>
      }
    </ion-content>
  `,
  styles: `
    .vista-previa {
      text-align: center;
      margin-bottom: 8px;
    }
    .grande {
      width: 72px;
      height: 72px;
      font-size: 40px;
    }
    .error {
      display: block;
      padding: 4px 16px;
    }
    .opciones {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px;
    }
    .opcion {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 2px solid transparent;
      background: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.08);
      font-size: 24px;
      cursor: pointer;
    }
    .opcion.color {
      border-radius: 50%;
      background: var(--cl-fondo);
    }
    .opcion.elegida {
      border-color: var(--ion-color-primary);
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
    IonListHeader,
    IonItem,
    IonInput,
    IonNote,
  ],
})
export class ClasificacionFormComponent implements OnInit {
  private readonly cerrarModal = cerrarEsteModal();

  /** Clasificación a editar; sin valor = nueva. */
  @Input() clasificacion?: Clasificacion;
  /** Todas las clasificaciones, para validar nombres repetidos. */
  @Input() existentes: Clasificacion[] = [];

  readonly colores = COLORES;
  readonly iconos = ICONOS;
  readonly color = signal<ColorClasificacion>('verde');
  readonly icono = signal('🛒');
  readonly error = signal('');
  nombre = '';

  ngOnInit(): void {
    if (this.clasificacion) {
      this.nombre = this.clasificacion.nombre;
      this.color.set(this.clasificacion.color);
      this.icono.set(this.clasificacion.icono);
    }
  }

  guardar(): void {
    const nombre = limpiarNombre(this.nombre);
    if (!nombre) {
      this.error.set('Escribe un nombre.');
      return;
    }
    const repetida = this.existentes.find(
      (c) => c.id !== this.clasificacion?.id && claveTexto(c.nombre) === claveTexto(nombre),
    );
    if (repetida) {
      this.error.set(
        repetida.activo
          ? `Ya existe "${repetida.nombre}".`
          : `Ya existe "${repetida.nombre}" (inactiva). Reactívala desde la lista.`,
      );
      return;
    }
    this.cerrar({ nombre, color: this.color(), icono: this.icono() });
  }

  cerrar(resultado?: ResultadoClasificacionForm): void {
    this.cerrarModal(resultado);
  }
}
