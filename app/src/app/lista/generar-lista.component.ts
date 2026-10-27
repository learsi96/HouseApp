import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { of, switchMap } from 'rxjs';

import { cerrarEsteModal } from '../core/modal';
import { ComidasRepository } from '../data/comidas.repository';
import { deIso, fechaLarga } from '../data/fechas';
import { derivarArticulos } from '../data/lista';
import type { ComidaPlaneada } from '../data/modelos';

export interface RangoLista {
  inicio: string;
  fin: string;
}

/** Elegir el rango de fechas de la lista. Siempre se eligen las dos fechas (sin rango por defecto). */
@Component({
  selector: 'app-generar-lista',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Generar lista</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="ayuda">¿De qué días son las comidas que van a comprar?</p>
      <ion-list lines="none">
        <ion-item>
          <ion-input
            type="date"
            label="Desde"
            labelPlacement="stacked"
            fill="outline"
            [value]="inicio()"
            (ionInput)="inicio.set($any($event).detail.value ?? '')"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            type="date"
            label="Hasta"
            labelPlacement="stacked"
            fill="outline"
            [value]="fin()"
            [min]="inicio()"
            (ionInput)="fin.set($any($event).detail.value ?? '')"
          ></ion-input>
        </ion-item>
      </ion-list>

      @if (error()) {
        <ion-note color="danger" class="bloque">{{ error() }}</ion-note>
      } @else if (valido()) {
        <div class="resumen">
          <p>
            <strong>{{ desdeTexto() }}</strong> a <strong>{{ hastaTexto() }}</strong>
          </p>
          <p>
            {{ recetas() }} {{ recetas() === 1 ? 'comida' : 'comidas' }} →
            <strong>{{ articulos() }} {{ articulos() === 1 ? 'artículo' : 'artículos' }}</strong>
          </p>
          @if (!recetas()) {
            <ion-note class="bloque">No hay comidas planeadas en esos días; la lista empezará vacía.</ion-note>
          }
        </div>
      }

      <ion-button expand="block" [disabled]="!valido()" (click)="cerrar({ inicio: inicio(), fin: fin() })">
        Generar lista
      </ion-button>
    </ion-content>
  `,
  styles: `
    .ayuda {
      margin-top: 0;
      color: var(--ion-color-medium);
    }
    ion-item {
      --padding-bottom: 8px;
    }
    .bloque {
      display: block;
      margin: 8px 16px;
    }
    .resumen {
      margin: 16px;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
    }
    .resumen p {
      margin: 4px 0;
    }
  `,
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonList, IonItem, IonInput, IonNote],
})
export class GenerarListaComponent {
  private readonly cerrarModal = cerrarEsteModal();
  private readonly comidasRepo = inject(ComidasRepository);

  readonly inicio = signal('');
  readonly fin = signal('');

  readonly error = computed(() =>
    this.inicio() && this.fin() && this.fin() < this.inicio()
      ? 'La fecha final no puede ser antes que la inicial.'
      : '',
  );
  readonly valido = computed(() => !!this.inicio() && !!this.fin() && !this.error());
  readonly desdeTexto = computed(() => (this.inicio() ? fechaLarga(deIso(this.inicio())) : ''));
  readonly hastaTexto = computed(() => (this.fin() ? fechaLarga(deIso(this.fin())) : ''));

  // Vista previa en vivo de lo que tendrá la lista.
  private readonly comidas = toSignal(
    toObservable(computed(() => (this.valido() ? { inicio: this.inicio(), fin: this.fin() } : null))).pipe(
      switchMap((rango) => (rango ? this.comidasRepo.rango$(rango.inicio, rango.fin) : of([]))),
    ),
    { initialValue: [] as ComidaPlaneada[] },
  );
  readonly recetas = computed(() => this.comidas().filter((c) => c.tipo === 'receta').length);
  readonly articulos = computed(() => derivarArticulos(this.comidas()).size);

  cerrar(resultado?: RangoLista): void {
    this.cerrarModal(resultado);
  }
}
