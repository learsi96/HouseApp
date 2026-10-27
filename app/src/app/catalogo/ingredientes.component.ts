import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, closeOutline } from 'ionicons/icons';

import { ArticulosRepository } from '../data/articulos.repository';
import { ClasificacionesRepository } from '../data/clasificaciones.repository';
import type { Articulo, Clasificacion } from '../data/modelos';

import { ArticuloSelectorComponent } from './articulo-selector.component';

interface Ingrediente {
  articulo: Articulo;
  clasificacion?: Clasificacion;
}

/** Lista editable de ingredientes (ids de artículos): agregar con el selector del catálogo y quitar. */
@Component({
  selector: 'app-ingredientes',
  template: `
    <ion-list>
      <ion-list-header>
        <ion-label>Ingredientes ({{ ingredientes().length }})</ion-label>
        <ion-button (click)="elegir()">
          <ion-icon slot="start" name="add"></ion-icon>
          Agregar
        </ion-button>
      </ion-list-header>
      @for (i of ingredientes(); track i.articulo.id) {
        <ion-item>
          <span slot="start" class="icono-clasificacion chico cl-{{ i.clasificacion?.color }}">
            {{ i.clasificacion?.icono }}
          </span>
          <ion-label [class.inactivo]="!i.articulo.activo">
            {{ i.articulo.nombre }}
            @if (!i.articulo.activo) {
              <ion-note>(inactivo)</ion-note>
            }
          </ion-label>
          @if (i.articulo.basico) {
            <ion-badge slot="end" color="secondary">Básico</ion-badge>
          }
          <ion-button slot="end" fill="clear" color="medium" (click)="quitar(i.articulo.id)" aria-label="Quitar">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </ion-item>
      } @empty {
        <ion-item lines="none">
          <ion-label color="medium">Sin ingredientes. Toca "Agregar" para elegirlos del catálogo.</ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: `
    .chico {
      width: 32px;
      height: 32px;
      font-size: 18px;
    }
    .inactivo {
      opacity: 0.55;
    }
    ion-list-header ion-button {
      margin-right: 8px;
    }
  `,
  imports: [IonList, IonListHeader, IonItem, IonLabel, IonNote, IonBadge, IonButton, IonIcon],
})
export class IngredientesComponent {
  private readonly modalCtrl = inject(ModalController);

  readonly ids = input<string[]>([]);
  readonly cambio = output<string[]>();

  private readonly articulos = toSignal(inject(ArticulosRepository).todos$, { initialValue: [] as Articulo[] });
  private readonly clasificaciones = toSignal(inject(ClasificacionesRepository).todas$, {
    initialValue: [] as Clasificacion[],
  });

  /** En el orden del recorrido del súper y luego alfabético. */
  readonly ingredientes = computed<Ingrediente[]>(() => {
    const articulos = new Map(this.articulos().map((a) => [a.id, a]));
    const clasificaciones = new Map(this.clasificaciones().map((c) => [c.id, c]));
    return this.ids()
      .map((id) => articulos.get(id))
      .filter((a): a is Articulo => !!a)
      .map((articulo) => ({ articulo, clasificacion: clasificaciones.get(articulo.clasificacionId) }))
      .sort(
        (a, b) =>
          (a.clasificacion?.orden ?? 99) - (b.clasificacion?.orden ?? 99) ||
          a.articulo.nombre.localeCompare(b.articulo.nombre, 'es'),
      );
  });

  constructor() {
    addIcons({ add, closeOutline });
  }

  async elegir(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ArticuloSelectorComponent,
      componentProps: { titulo: 'Ingredientes', seleccionados: this.ids() },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<string[]>();
    if (data) {
      this.cambio.emit(data);
    }
  }

  quitar(id: string): void {
    this.cambio.emit(this.ids().filter((x) => x !== id));
  }
}
