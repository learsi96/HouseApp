import type { OnInit } from '@angular/core';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

import { ArticulosRepository } from '../data/articulos.repository';
import { ClasificacionesRepository } from '../data/clasificaciones.repository';
import type { Articulo, Clasificacion } from '../data/modelos';
import { claveTexto } from '../data/texto';

import { ArticuloFormComponent } from './articulo-form.component';
import type { ResultadoArticuloForm } from './articulo-form.component';

interface Grupo {
  clasificacion: Clasificacion;
  articulos: Articulo[];
}

/**
 * Modal para elegir varios artículos del catálogo, con búsqueda y "Crear…" si no existe.
 * Devuelve los ids elegidos al tocar "Listo"; undefined si se cancela.
 */
@Component({
  selector: 'app-articulo-selector',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong (click)="cerrar(seleccion())">Listo ({{ seleccion().length }})</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar o crear…"
          [debounce]="100"
          [value]="busqueda()"
          (ionInput)="busqueda.set($any($event).detail.value ?? '')"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        @if (puedeCrear()) {
          <ion-item button [detail]="false" (click)="crear()">
            <ion-icon slot="start" name="add-circle-outline" color="primary"></ion-icon>
            <ion-label color="primary">Crear "{{ busqueda().trim() }}"</ion-label>
          </ion-item>
        }
        @for (g of grupos(); track g.clasificacion.id) {
          <ion-item-group>
            <ion-item-divider sticky class="cl-{{ g.clasificacion.color }}">
              <ion-label>{{ g.clasificacion.icono }} {{ g.clasificacion.nombre }}</ion-label>
            </ion-item-divider>
            @for (a of g.articulos; track a.id) {
              <ion-item>
                <ion-checkbox justify="space-between" [checked]="elegidos().has(a.id)" (ionChange)="alternar(a.id)">
                  {{ a.nombre }}
                  @if (a.basico) {
                    <ion-badge color="secondary">Básico</ion-badge>
                  }
                </ion-checkbox>
              </ion-item>
            }
          </ion-item-group>
        }
      </ion-list>
    </ion-content>
  `,
  styles: `
    ion-item-divider {
      --background: var(--cl-fondo);
      font-weight: 600;
    }
    ion-badge {
      margin-left: 6px;
      vertical-align: middle;
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
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonBadge,
    IonIcon,
  ],
})
export class ArticuloSelectorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly repo = inject(ArticulosRepository);

  @Input() titulo = 'Ingredientes';
  /** Ids ya elegidos al abrir. */
  @Input() seleccionados: string[] = [];

  private readonly articulos = toSignal(this.repo.todos$, { initialValue: [] as Articulo[] });
  private readonly clasificaciones = toSignal(inject(ClasificacionesRepository).todas$, {
    initialValue: [] as Clasificacion[],
  });

  readonly busqueda = signal('');
  readonly seleccion = signal<string[]>([]);
  readonly elegidos = computed(() => new Set(this.seleccion()));

  /** Activos que coinciden con la búsqueda, más los ya elegidos aunque estén inactivos. */
  readonly grupos = computed<Grupo[]>(() => {
    const filtro = claveTexto(this.busqueda());
    const elegidos = this.elegidos();
    const visibles = this.articulos().filter(
      (a) => (a.activo || elegidos.has(a.id)) && claveTexto(a.nombre).includes(filtro),
    );
    return this.clasificaciones()
      .map((clasificacion) => ({
        clasificacion,
        articulos: visibles.filter((a) => a.clasificacionId === clasificacion.id),
      }))
      .filter((g) => g.articulos.length);
  });

  readonly puedeCrear = computed(() => {
    const clave = claveTexto(this.busqueda());
    return !!clave && !this.articulos().some((a) => claveTexto(a.nombre) === clave);
  });

  constructor() {
    addIcons({ addCircleOutline });
  }

  ngOnInit(): void {
    this.seleccion.set([...this.seleccionados]);
  }

  alternar(id: string): void {
    this.seleccion.update((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));
  }

  async crear(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ArticuloFormComponent,
      componentProps: {
        nombreInicial: this.busqueda(),
        clasificaciones: this.clasificaciones().filter((c) => c.activo),
        existentes: this.articulos(),
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<ResultadoArticuloForm>();
    if (data && data !== 'cambiar-activo') {
      const id = await this.repo.crear(data);
      this.seleccion.update((lista) => [...lista, id]);
      this.busqueda.set('');
    }
  }

  cerrar(resultado?: string[]): void {
    this.modalCtrl.dismiss(resultado);
  }
}
