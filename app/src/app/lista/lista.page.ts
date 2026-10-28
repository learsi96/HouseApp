import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonCheckbox,
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
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cartOutline, chevronDown, chevronUp, refreshOutline, removeCircleOutline } from 'ionicons/icons';
import { of, switchMap } from 'rxjs';

import { ArticuloSelectorComponent } from '../catalogo/articulo-selector.component';
import { ArticulosRepository } from '../data/articulos.repository';
import { ClasificacionesRepository } from '../data/clasificaciones.repository';
import { ComidasRepository } from '../data/comidas.repository';
import { deIso, fechaCorta, nombreDia } from '../data/fechas';
import { derivarArticulos, hayCambios, manualesPendientes } from '../data/lista';
import { ListaRepository } from '../data/lista.repository';
import type { Articulo, ArticuloLista, Clasificacion, ComidaPlaneada } from '../data/modelos';

import { GenerarListaComponent } from './generar-lista.component';
import type { RangoLista } from './generar-lista.component';

interface Renglon {
  item: ArticuloLista;
  articulo: Articulo;
}

interface Grupo {
  clasificacion: Clasificacion;
  renglones: Renglon[];
}

@Component({
  selector: 'app-lista',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          Lista del súper
          @if (lista(); as l) {
            <div class="rango">{{ rangoTexto() }}</div>
          }
        </ion-title>
        @if (lista()) {
          <ion-buttons slot="end">
            <ion-button (click)="generar()" aria-label="Generar nueva lista">
              <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
      @if (lista() && total()) {
        <ion-toolbar class="progreso">
          <div class="barra"><div class="relleno" [style.width.%]="(comprados() / total()) * 100"></div></div>
          <div class="conteo">{{ comprados() }} de {{ total() }} en el carrito</div>
        </ion-toolbar>
      }
    </ion-header>

    <ion-content>
      @if (cargando()) {
        <!-- Esperando la primera lectura -->
      } @else if (!lista()) {
        <div class="vacio">
          <div class="icono">🛒</div>
          <p>Todavía no hay lista.<br />Elige de qué días son las comidas y se arma sola.</p>
          <ion-button (click)="generar()">Generar lista del súper</ion-button>
        </div>
      } @else {
        @if (cambios()) {
          <div class="aviso">
            <span>Cambiaron las comidas de estos días.</span>
            <ion-button size="small" (click)="actualizar()">Actualizar lista</ion-button>
          </div>
        }

        <ion-list>
          @for (g of grupos(); track g.clasificacion.id) {
            <ion-item-group>
              <ion-item-divider sticky class="cl-{{ g.clasificacion.color }}">
                <ion-label>{{ g.clasificacion.icono }} {{ g.clasificacion.nombre }}</ion-label>
              </ion-item-divider>
              @for (r of g.renglones; track r.item.articuloId) {
                <ion-item [class.comprado]="r.item.comprado">
                  <ion-checkbox
                    slot="start"
                    [checked]="r.item.comprado"
                    (ionChange)="palomear(r.item, $any($event).detail.checked)"
                    [attr.aria-label]="r.articulo.nombre"
                  ></ion-checkbox>
                  <ion-label>
                    <span class="nombre">{{ r.articulo.nombre }}</span>
                    @if (r.articulo.basico) {
                      <ion-badge color="secondary">Básico</ion-badge>
                    }
                    <p>{{ r.item.origenes.length ? r.item.origenes.join(', ') : 'Agregado a mano' }}</p>
                  </ion-label>
                  <ion-button
                    slot="end"
                    fill="clear"
                    color="medium"
                    (click)="repo.marcar(r.item.articuloId, 'quitado', true)"
                    aria-label="Quitar de la lista"
                  >
                    <ion-icon slot="icon-only" name="remove-circle-outline"></ion-icon>
                  </ion-button>
                </ion-item>
              }
            </ion-item-group>
          } @empty {
            <div class="vacio chico">
              <p>La lista está vacía. Agrega artículos con el botón +.</p>
            </div>
          }

          @if (quitados().length) {
            <ion-item button [detail]="false" lines="none" (click)="verQuitados.set(!verQuitados())">
              <ion-label color="medium">Quitados ({{ quitados().length }})</ion-label>
              <ion-icon slot="end" color="medium" [name]="verQuitados() ? 'chevron-up' : 'chevron-down'"></ion-icon>
            </ion-item>
            @if (verQuitados()) {
              @for (r of quitados(); track r.item.articuloId) {
                <ion-item class="quitado">
                  <ion-label>{{ r.articulo.nombre }}</ion-label>
                  <ion-button slot="end" fill="clear" (click)="repo.marcar(r.item.articuloId, 'quitado', false)">
                    Regresar
                  </ion-button>
                </ion-item>
              }
            }
          }
        </ion-list>

        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button (click)="agregar()" aria-label="Agregar artículos">
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }
    </ion-content>
  `,
  styles: `
    .rango {
      font-size: 13px;
      font-weight: 400;
      opacity: 0.9;
    }
    .progreso {
      --min-height: 40px;
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 8px;
      --padding-bottom: 8px;
    }
    .barra {
      height: 6px;
      border-radius: 3px;
      background: rgba(var(--ion-color-primary-rgb), 0.15);
      overflow: hidden;
    }
    .relleno {
      height: 100%;
      background: var(--ion-color-primary);
      transition: width 0.2s;
    }
    .conteo {
      margin-top: 4px;
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    .aviso {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 12px;
      padding: 8px 8px 8px 16px;
      border-radius: 12px;
      background: rgba(var(--ion-color-secondary-rgb), 0.15);
    }
    ion-item-divider {
      --background: var(--cl-fondo);
      font-weight: 600;
    }
    ion-badge {
      margin-left: 6px;
      vertical-align: middle;
    }
    .comprado .nombre {
      text-decoration: line-through;
    }
    .comprado ion-label {
      opacity: 0.5;
    }
    .quitado ion-label {
      opacity: 0.55;
    }
    ion-list {
      padding-bottom: 80px;
    }
    .vacio {
      text-align: center;
      margin-top: 22vh;
      padding: 0 24px;
      color: var(--ion-color-medium);
    }
    .vacio.chico {
      margin-top: 10vh;
    }
    .vacio .icono {
      font-size: 56px;
    }
  `,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonBadge,
    IonFab,
    IonFabButton,
  ],
})
export class ListaPage {
  readonly repo = inject(ListaRepository);
  private readonly comidasRepo = inject(ComidasRepository);
  private readonly modalCtrl = inject(ModalController);
  private readonly alerta = inject(AlertController);

  private readonly listaLeida = toSignal(this.repo.activa$);
  readonly cargando = computed(() => this.listaLeida() === undefined);
  readonly lista = computed(() => this.listaLeida() ?? null);
  readonly verQuitados = signal(false);

  private readonly articulos = toSignal(inject(ArticulosRepository).todos$, { initialValue: [] as Articulo[] });
  private readonly clasificaciones = toSignal(inject(ClasificacionesRepository).todas$, {
    initialValue: [] as Clasificacion[],
  });

  /** Comidas del rango de la lista, para detectar cambios. */
  private readonly comidas = toSignal(
    toObservable(computed(() => this.lista()?.inicio + '|' + this.lista()?.fin)).pipe(
      switchMap(() => {
        const lista = this.lista();
        return lista ? this.comidasRepo.rango$(lista.inicio, lista.fin) : of([]);
      }),
    ),
    { initialValue: [] as ComidaPlaneada[] },
  );
  private readonly derivados = computed(() => derivarArticulos(this.comidas()));
  readonly cambios = computed(() => {
    const lista = this.lista();
    return !!lista && hayCambios(lista.articulos, this.derivados());
  });

  private readonly renglones = computed<Renglon[]>(() => {
    const articulos = new Map(this.articulos().map((a) => [a.id, a]));
    return (this.lista()?.articulos ?? [])
      .map((item) => ({ item, articulo: articulos.get(item.articuloId) }))
      .filter((r): r is Renglon => !!r.articulo);
  });

  /** Por clasificación en el orden del recorrido; dentro, lo pendiente primero y lo palomeado al final. */
  readonly grupos = computed<Grupo[]>(() => {
    const visibles = this.renglones().filter((r) => !r.item.quitado);
    return this.clasificaciones()
      .map((clasificacion) => ({
        clasificacion,
        renglones: visibles
          .filter((r) => r.articulo.clasificacionId === clasificacion.id)
          .sort(
            (a, b) =>
              Number(a.item.comprado) - Number(b.item.comprado) ||
              a.articulo.nombre.localeCompare(b.articulo.nombre, 'es'),
          ),
      }))
      .filter((g) => g.renglones.length);
  });

  readonly quitados = computed(() =>
    this.renglones()
      .filter((r) => r.item.quitado)
      .sort((a, b) => a.articulo.nombre.localeCompare(b.articulo.nombre, 'es')),
  );
  readonly total = computed(() => this.renglones().filter((r) => !r.item.quitado).length);
  readonly comprados = computed(() => this.renglones().filter((r) => !r.item.quitado && r.item.comprado).length);

  readonly rangoTexto = computed(() => {
    const lista = this.lista();
    if (!lista) {
      return '';
    }
    const dia = (iso: string): string => {
      const fecha = deIso(iso);
      return `${nombreDia(fecha).slice(0, 3)} ${fechaCorta(fecha)}`;
    };
    return `${dia(lista.inicio)} – ${dia(lista.fin)}`;
  });

  constructor() {
    addIcons({ add, cartOutline, chevronDown, chevronUp, refreshOutline, removeCircleOutline });
  }

  palomear(item: ArticuloLista, comprado: boolean): void {
    if (item.comprado !== comprado) {
      void this.repo.marcar(item.articuloId, 'comprado', comprado);
    }
  }

  async generar(): Promise<void> {
    const actual = this.lista();
    if (actual) {
      const pendientes = manualesPendientes(actual.articulos).length;
      const manuales =
        pendientes === 1
          ? ' El artículo agregado a mano que no han comprado pasa a la nueva lista.'
          : pendientes > 1
            ? ` Los ${pendientes} artículos agregados a mano que no han comprado pasan a la nueva lista.`
            : '';
      const confirmacion = await this.alerta.create({
        header: 'Generar nueva lista',
        message: `La lista actual (${this.rangoTexto()}) se reemplaza.${manuales}`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Continuar', role: 'confirm' },
        ],
      });
      await confirmacion.present();
      if ((await confirmacion.onDidDismiss()).role !== 'confirm') {
        return;
      }
    }
    const modal = await this.modalCtrl.create({ component: GenerarListaComponent });
    await modal.present();
    const { data } = await modal.onDidDismiss<RangoLista>();
    if (!data) {
      return;
    }
    // Se leen las comidas del rango justo al generar (la vista previa del modal es solo informativa).
    const comidas = await this.comidasRepo.enRango(data.inicio, data.fin);
    // La lista anterior se toma ya al final por si la pareja agregó algo mientras se elegían las fechas.
    await this.repo.generar(data.inicio, data.fin, derivarArticulos(comidas), this.lista());
  }

  async actualizar(): Promise<void> {
    const lista = this.lista();
    if (lista) {
      await this.repo.actualizar(lista, this.derivados());
    }
  }

  async agregar(): Promise<void> {
    const lista = this.lista();
    if (!lista) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: ArticuloSelectorComponent,
      componentProps: { titulo: 'Agregar a la lista' },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<string[]>();
    if (data?.length) {
      await this.repo.agregarManuales(lista, data);
    }
  }
}
