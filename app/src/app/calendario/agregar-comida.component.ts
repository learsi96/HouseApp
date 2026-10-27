import { Component, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

import { cerrarEsteModal } from '../core/modal';
import { ESPECIALES, ICONO_ESPECIAL_LIBRE } from '../data/comidas.repository';
import type { Receta } from '../data/modelos';
import { RecetasRepository } from '../data/recetas.repository';
import { claveTexto, limpiarNombre } from '../data/texto';
import { RecetaEditorService } from '../recetas/receta-editor.service';

export type ComidaElegida = { tipo: 'receta'; receta: Receta } | { tipo: 'especial'; nombre: string; icono: string };

/** Elegir qué se come un día: una receta del recetario (o una nueva) o un día especial. */
@Component({
  selector: 'app-agregar-comida',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar o crear receta…"
          [debounce]="100"
          [value]="busqueda()"
          (ionInput)="busqueda.set($any($event).detail.value ?? '')"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!busqueda().trim()) {
        <ion-list lines="none">
          <ion-list-header>Día especial</ion-list-header>
          <div class="chips">
            @for (e of especiales; track e.nombre) {
              <ion-chip [outline]="true" (click)="cerrar({ tipo: 'especial', nombre: e.nombre, icono: e.icono })">
                {{ e.icono }} {{ e.nombre }}
              </ion-chip>
            }
            <ion-chip [outline]="true" (click)="especialLibre()">{{ iconoLibre }} Otro…</ion-chip>
          </div>
        </ion-list>
      }

      <ion-list>
        <ion-list-header>Recetas</ion-list-header>
        @if (puedeCrear()) {
          <ion-item button [detail]="false" (click)="crear()">
            <ion-icon slot="start" name="add-circle-outline" color="primary"></ion-icon>
            <ion-label color="primary">Crear receta "{{ busqueda().trim() }}"</ion-label>
          </ion-item>
        }
        @for (r of visibles(); track r.id) {
          <ion-item button [detail]="false" (click)="cerrar({ tipo: 'receta', receta: r })">
            <ion-label>
              <h2>{{ r.nombre }}</h2>
              @if (r.etiquetas.length) {
                <p>{{ r.etiquetas.join(' · ') }}</p>
              }
            </ion-label>
            <ion-note slot="end">{{ r.ingredientes.length }} ingr.</ion-note>
          </ion-item>
        } @empty {
          @if (!puedeCrear()) {
            <ion-item lines="none">
              <ion-label color="medium">Escribe el nombre de una comida para crearla.</ion-label>
            </ion-item>
          }
        }
      </ion-list>
    </ion-content>
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      padding: 0 12px;
    }
  `,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonChip,
    IonIcon,
  ],
})
export class AgregarComidaComponent {
  private readonly cerrarModal = cerrarEsteModal();
  private readonly alerta = inject(AlertController);
  private readonly editor = inject(RecetaEditorService);

  @Input() titulo = 'Agregar comida';

  readonly especiales = ESPECIALES;
  readonly iconoLibre = ICONO_ESPECIAL_LIBRE;
  readonly busqueda = signal('');
  private readonly recetas = toSignal(inject(RecetasRepository).todas$, { initialValue: [] as Receta[] });

  readonly visibles = computed(() => {
    const filtro = claveTexto(this.busqueda());
    return this.recetas().filter((r) => r.activo && claveTexto(r.nombre).includes(filtro));
  });

  readonly puedeCrear = computed(() => {
    const clave = claveTexto(this.busqueda());
    return !!clave && !this.recetas().some((r) => claveTexto(r.nombre) === clave);
  });

  constructor() {
    addIcons({ addCircleOutline });
  }

  async crear(): Promise<void> {
    const receta = await this.editor.nueva(this.busqueda());
    if (receta) {
      this.cerrar({ tipo: 'receta', receta });
    }
  }

  async especialLibre(): Promise<void> {
    const alerta = await this.alerta.create({
      header: 'Día especial',
      inputs: [{ name: 'nombre', placeholder: 'Ej. Cumpleaños de la abuela' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Agregar', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { role, data } = await alerta.onDidDismiss<{ values: { nombre: string } }>();
    const nombre = limpiarNombre(data?.values?.nombre ?? '');
    if (role === 'confirm' && nombre) {
      this.cerrar({ tipo: 'especial', nombre, icono: ICONO_ESPECIAL_LIBRE });
    }
  }

  cerrar(resultado?: ComidaElegida): void {
    this.cerrarModal(resultado);
  }
}
