import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AlertController,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
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
import { add, addCircleOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';

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

@Component({
  selector: 'app-articulos',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/mas"></ion-back-button>
        </ion-buttons>
        <ion-title>Artículos</ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="verInactivos.set(!verInactivos())"
            [attr.aria-label]="verInactivos() ? 'Ocultar inactivos' : 'Ver inactivos'"
          >
            <ion-icon slot="icon-only" [name]="verInactivos() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-searchbar
          placeholder="Buscar o agregar…"
          [debounce]="150"
          [value]="busqueda()"
          (ionInput)="busqueda.set($any($event).detail.value ?? '')"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        @if (puedeCrear()) {
          <ion-item button [detail]="false" (click)="nuevo(busqueda())">
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
              <ion-item button [detail]="false" [class.inactivo]="!a.activo" (click)="editar(a)">
                <ion-label>{{ a.nombre }}</ion-label>
                @if (a.basico) {
                  <ion-badge slot="end" color="secondary">Básico</ion-badge>
                }
                @if (!a.activo) {
                  <ion-badge slot="end" color="medium">Inactivo</ion-badge>
                }
              </ion-item>
            }
          </ion-item-group>
        } @empty {
          @if (!puedeCrear()) {
            <div class="vacio">
              <div class="icono">🛒</div>
              <p>Todavía no hay artículos.<br />Escribe uno arriba o toca el botón +.</p>
            </div>
          }
        }
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="nuevo(busqueda())">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: `
    ion-item-divider {
      --background: var(--cl-fondo);
      font-weight: 600;
    }
    .inactivo {
      opacity: 0.55;
    }
    ion-badge {
      margin-left: 6px;
    }
    ion-list {
      padding-bottom: 80px;
    }
    .vacio {
      text-align: center;
      margin-top: 25vh;
      color: var(--ion-color-medium);
    }
    .vacio .icono {
      font-size: 48px;
    }
  `,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonFab,
    IonFabButton,
  ],
})
export class ArticulosPage {
  private readonly repo = inject(ArticulosRepository);
  private readonly modal = inject(ModalController);
  private readonly alerta = inject(AlertController);

  private readonly articulos = toSignal(this.repo.todos$, { initialValue: [] as Articulo[] });
  private readonly clasificaciones = toSignal(inject(ClasificacionesRepository).todas$, {
    initialValue: [] as Clasificacion[],
  });

  readonly busqueda = signal('');
  readonly verInactivos = signal(false);

  /** Artículos filtrados y agrupados por clasificación, en el orden del recorrido del súper. */
  readonly grupos = computed<Grupo[]>(() => {
    const filtro = claveTexto(this.busqueda());
    const visibles = this.articulos().filter(
      (a) => (a.activo || this.verInactivos()) && claveTexto(a.nombre).includes(filtro),
    );
    return this.clasificaciones()
      .map((clasificacion) => ({
        clasificacion,
        articulos: visibles.filter((a) => a.clasificacionId === clasificacion.id),
      }))
      .filter((g) => g.articulos.length);
  });

  /** Se ofrece crear lo que se escribió si no existe un artículo con ese nombre exacto. */
  readonly puedeCrear = computed(() => {
    const clave = claveTexto(this.busqueda());
    return !!clave && !this.articulos().some((a) => claveTexto(a.nombre) === clave);
  });

  constructor() {
    addIcons({ add, addCircleOutline, eyeOutline, eyeOffOutline });
  }

  async nuevo(nombreInicial: string): Promise<void> {
    const datos = await this.abrirFormulario({ nombreInicial });
    if (datos && datos !== 'cambiar-activo') {
      await this.repo.crear(datos);
      this.busqueda.set('');
    }
  }

  async editar(articulo: Articulo): Promise<void> {
    const resultado = await this.abrirFormulario({ articulo });
    if (!resultado) {
      return;
    }
    if (resultado !== 'cambiar-activo') {
      await this.repo.actualizar(articulo.id, resultado);
    } else if (!articulo.activo) {
      await this.repo.cambiarActivo(articulo.id, true);
    } else {
      const confirmacion = await this.alerta.create({
        header: 'Inactivar artículo',
        message: `"${articulo.nombre}" dejará de sugerirse. Puedes reactivarlo después.`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Inactivar', role: 'destructive' },
        ],
      });
      await confirmacion.present();
      const { role } = await confirmacion.onDidDismiss();
      if (role === 'destructive') {
        await this.repo.cambiarActivo(articulo.id, false);
      }
    }
  }

  private async abrirFormulario(props: {
    articulo?: Articulo;
    nombreInicial?: string;
  }): Promise<ResultadoArticuloForm | undefined> {
    const modal = await this.modal.create({
      component: ArticuloFormComponent,
      componentProps: {
        ...props,
        clasificaciones: this.clasificaciones().filter((c) => c.activo || c.id === props.articulo?.clasificacionId),
        existentes: this.articulos(),
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<ResultadoArticuloForm>();
    return data;
  }
}
