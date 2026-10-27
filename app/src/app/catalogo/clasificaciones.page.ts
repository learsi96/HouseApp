import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import type { ReorderEndCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmark, swapVertical } from 'ionicons/icons';

import { ArticulosRepository } from '../data/articulos.repository';
import { ClasificacionesRepository } from '../data/clasificaciones.repository';
import type { Clasificacion } from '../data/modelos';

import { ClasificacionFormComponent } from './clasificacion-form.component';
import type { ResultadoClasificacionForm } from './clasificacion-form.component';

@Component({
  selector: 'app-clasificaciones',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/mas"></ion-back-button>
        </ion-buttons>
        <ion-title>Clasificaciones</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="ordenando.set(!ordenando())">
            <ion-icon slot="start" [name]="ordenando() ? 'checkmark' : 'swap-vertical'"></ion-icon>
            {{ ordenando() ? 'Listo' : 'Ordenar' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (ordenando()) {
        <p class="ayuda">Arrastra para acomodarlas en el orden en que recorren el súper.</p>
      }

      <ion-list>
        <ion-reorder-group [disabled]="!ordenando()" (ionReorderEnd)="reordenar($event)">
          @for (c of activas(); track c.id) {
            <ion-item [button]="!ordenando()" [detail]="false" (click)="!ordenando() && editar(c)">
              <span slot="start" class="icono-clasificacion cl-{{ c.color }}">{{ c.icono }}</span>
              <ion-label>{{ c.nombre }}</ion-label>
              <ion-note slot="end">{{ conteo().get(c.id) ?? 0 }}</ion-note>
              <ion-reorder slot="end"></ion-reorder>
            </ion-item>
          }
        </ion-reorder-group>
      </ion-list>

      @if (inactivas().length && !ordenando()) {
        <ion-list>
          <ion-list-header>Inactivas</ion-list-header>
          @for (c of inactivas(); track c.id) {
            <ion-item button [detail]="false" class="inactiva" (click)="editar(c)">
              <span slot="start" class="icono-clasificacion cl-{{ c.color }}">{{ c.icono }}</span>
              <ion-label>{{ c.nombre }}</ion-label>
            </ion-item>
          }
        </ion-list>
      }

      @if (!ordenando()) {
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button (click)="nueva()">
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }
    </ion-content>
  `,
  styles: `
    .ayuda {
      margin: 12px 16px 0;
      color: var(--ion-color-medium);
    }
    .inactiva {
      opacity: 0.55;
    }
    ion-list:last-of-type {
      padding-bottom: 80px;
    }
  `,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonReorderGroup,
    IonReorder,
    IonFab,
    IonFabButton,
  ],
})
export class ClasificacionesPage {
  private readonly repo = inject(ClasificacionesRepository);
  private readonly modal = inject(ModalController);
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);

  private readonly todas = toSignal(this.repo.todas$, { initialValue: [] as Clasificacion[] });
  private readonly articulos = toSignal(inject(ArticulosRepository).todos$, { initialValue: [] });

  readonly activas = computed(() => this.todas().filter((c) => c.activo));
  readonly inactivas = computed(() => this.todas().filter((c) => !c.activo));
  readonly ordenando = signal(false);

  /** Artículos activos por clasificación. */
  readonly conteo = computed(() => {
    const mapa = new Map<string, number>();
    for (const a of this.articulos()) {
      if (a.activo) {
        mapa.set(a.clasificacionId, (mapa.get(a.clasificacionId) ?? 0) + 1);
      }
    }
    return mapa;
  });

  constructor() {
    addIcons({ add, checkmark, swapVertical });
  }

  async reordenar(evento: ReorderEndCustomEvent): Promise<void> {
    const ids = this.activas().map((c) => c.id);
    const [movido] = ids.splice(evento.detail.from, 1);
    ids.splice(evento.detail.to, 0, movido);
    // complete(false): no mover el DOM; lo vuelve a pintar Angular con el nuevo orden.
    evento.detail.complete(false);
    // Las inactivas van al final para que no estorben en el orden del recorrido.
    await this.repo.reordenar([...ids, ...this.inactivas().map((c) => c.id)]);
  }

  async nueva(): Promise<void> {
    const datos = await this.abrirFormulario();
    if (datos && datos !== 'cambiar-activo') {
      await this.repo.crear(datos, this.activas().length);
    }
  }

  async editar(clasificacion: Clasificacion): Promise<void> {
    const resultado = await this.abrirFormulario(clasificacion);
    if (!resultado) {
      return;
    }
    if (resultado !== 'cambiar-activo') {
      await this.repo.actualizar(clasificacion.id, resultado);
    } else if (!clasificacion.activo) {
      await this.repo.cambiarActivo(clasificacion.id, true);
    } else {
      await this.inactivar(clasificacion);
    }
  }

  private async inactivar(clasificacion: Clasificacion): Promise<void> {
    const enUso = this.conteo().get(clasificacion.id) ?? 0;
    if (enUso) {
      const aviso = await this.toast.create({
        message: `"${clasificacion.nombre}" tiene ${enUso} artículo(s) activos. Cámbialos de clasificación primero.`,
        duration: 3500,
        color: 'dark',
      });
      await aviso.present();
      return;
    }
    const confirmacion = await this.alerta.create({
      header: 'Inactivar clasificación',
      message: `"${clasificacion.nombre}" dejará de aparecer. Puedes reactivarla después.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Inactivar', role: 'destructive' },
      ],
    });
    await confirmacion.present();
    const { role } = await confirmacion.onDidDismiss();
    if (role === 'destructive') {
      await this.repo.cambiarActivo(clasificacion.id, false);
    }
  }

  private async abrirFormulario(clasificacion?: Clasificacion): Promise<ResultadoClasificacionForm | undefined> {
    const modal = await this.modal.create({
      component: ClasificacionFormComponent,
      componentProps: { clasificacion, existentes: this.todas() },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<ResultadoClasificacionForm>();
    return data;
  }
}
