import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, chevronBack, chevronForward, todayOutline } from 'ionicons/icons';
import { switchMap } from 'rxjs';

import { ComidasRepository } from '../data/comidas.repository';
import {
  aIso,
  deIso,
  fechaCorta,
  hoyIso,
  inicioMes,
  inicioSemana,
  nombreDia,
  nombreMes,
  sumarDias,
} from '../data/fechas';
import type { ComidaPlaneada, Receta } from '../data/modelos';
import { RecetasRepository } from '../data/recetas.repository';
import { RecetaEditorService } from '../recetas/receta-editor.service';

import { AgregarComidaComponent } from './agregar-comida.component';
import type { ComidaElegida } from './agregar-comida.component';
import { ComidaDetalleComponent } from './comida-detalle.component';
import type { ResultadoComidaDetalle } from './comida-detalle.component';

type Modo = 'semana' | 'mes';

interface Dia {
  iso: string;
  nombre: string;
  corta: string;
  numero: number;
  hoy: boolean;
  pasado: boolean;
  delMes: boolean;
}

const ICONO_RECETA = '🍲';

@Component({
  selector: 'app-calendario',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Calendario</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="irAHoy()" aria-label="Ir a hoy">
            <ion-icon slot="icon-only" name="today-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="modo()" (ionChange)="cambiarModo($any($event).detail.value)">
          <ion-segment-button value="semana"><ion-label>Semana</ion-label></ion-segment-button>
          <ion-segment-button value="mes"><ion-label>Mes</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar class="navegacion">
        <ion-buttons slot="start">
          <ion-button (click)="mover(-1)" aria-label="Anterior">
            <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="small">{{ periodo() }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="mover(1)" aria-label="Siguiente">
            <ion-icon slot="icon-only" name="chevron-forward"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (modo() === 'semana') {
        @for (d of semana(); track d.iso) {
          <ng-container [ngTemplateOutlet]="bloqueDia" [ngTemplateOutletContext]="{ $implicit: d }"></ng-container>
        }
      } @else {
        <div class="mes">
          @for (inicial of iniciales; track $index) {
            <div class="inicial">{{ inicial }}</div>
          }
          @for (d of mes(); track d.iso) {
            <button
              type="button"
              class="celda"
              [class.fuera]="!d.delMes"
              [class.hoy]="d.hoy"
              [class.elegido]="d.iso === seleccionado()"
              (click)="seleccionado.set(d.iso)"
            >
              <span class="numero">{{ d.numero }}</span>
              <span class="puntos">
                @for (c of (porDia().get(d.iso) ?? []).slice(0, 3); track c.id) {
                  <span class="punto" [class.especial]="c.tipo === 'especial'"></span>
                }
              </span>
            </button>
          }
        </div>
        @if (diaSeleccionado(); as d) {
          <ng-container [ngTemplateOutlet]="bloqueDia" [ngTemplateOutletContext]="{ $implicit: d }"></ng-container>
        }
      }

      <ng-template #bloqueDia let-d>
        <section class="dia" [class.hoy]="d.hoy" [class.pasado]="d.pasado">
          <header>
            <div>
              <strong>{{ d.nombre }}</strong>
              <span class="corta">{{ d.corta }}</span>
              @if (d.hoy) {
                <span class="etiqueta-hoy">Hoy</span>
              }
            </div>
            <ion-button fill="clear" size="small" (click)="agregar(d)">
              <ion-icon slot="start" name="add"></ion-icon>
              Agregar
            </ion-button>
          </header>
          <ion-list lines="none">
            @for (c of porDia().get(d.iso) ?? []; track c.id) {
              <ion-item button [detail]="false" (click)="abrir(c)">
                <span slot="start" class="icono-comida">{{ c.icono || iconoReceta }}</span>
                <ion-label>
                  {{ c.nombre }}
                  @if (c.tipo === 'receta') {
                    <p>{{ c.ingredientes.length }} ingredientes</p>
                  }
                </ion-label>
              </ion-item>
            } @empty {
              <ion-item>
                <ion-note>Sin comidas planeadas</ion-note>
              </ion-item>
            }
          </ion-list>
        </section>
      </ng-template>
    </ion-content>
  `,
  styles: `
    .navegacion {
      --min-height: 40px;
    }
    .dia {
      margin: 12px;
      border-radius: 16px;
      overflow: hidden;
      background: var(--ion-item-background, var(--ion-background-color));
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.1);
    }
    .dia header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 4px 0 16px;
    }
    .dia .corta {
      margin-left: 8px;
      color: var(--ion-color-medium);
    }
    .dia.hoy {
      border: 2px solid var(--ion-color-primary);
    }
    .dia.pasado {
      opacity: 0.6;
    }
    .etiqueta-hoy {
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
    }
    .icono-comida {
      font-size: 22px;
    }
    .mes {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      padding: 8px;
    }
    .inicial {
      text-align: center;
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    .celda {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 0;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .celda.fuera {
      opacity: 0.35;
    }
    .celda.hoy .numero {
      color: var(--ion-color-primary);
      font-weight: 700;
    }
    .celda.elegido {
      background: rgba(var(--ion-color-primary-rgb), 0.15);
    }
    .puntos {
      display: flex;
      gap: 3px;
      height: 6px;
    }
    .punto {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ion-color-primary);
    }
    .punto.especial {
      background: var(--ion-color-secondary);
    }
  `,
  imports: [
    NgTemplateOutlet,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonList,
    IonItem,
    IonNote,
  ],
})
export class CalendarioPage {
  private readonly repo = inject(ComidasRepository);
  private readonly editor = inject(RecetaEditorService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alerta = inject(AlertController);
  private readonly recetas = toSignal(inject(RecetasRepository).todas$, { initialValue: [] as Receta[] });

  readonly iconoReceta = ICONO_RECETA;
  readonly iniciales = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  readonly modo = signal<Modo>('semana');
  /** Cualquier fecha dentro del periodo que se está viendo. */
  readonly ancla = signal(new Date());
  /** Día elegido en la vista mensual. */
  readonly seleccionado = signal(hoyIso());

  readonly semana = computed(() => {
    const inicio = inicioSemana(this.ancla());
    return Array.from({ length: 7 }, (_, i) => this.dia(sumarDias(inicio, i), true));
  });

  /** 6 semanas completas que cubren el mes. */
  readonly mes = computed(() => {
    const primero = inicioMes(this.ancla());
    const inicio = inicioSemana(primero);
    return Array.from({ length: 42 }, (_, i) => {
      const fecha = sumarDias(inicio, i);
      return this.dia(fecha, fecha.getMonth() === primero.getMonth());
    });
  });

  readonly diaSeleccionado = computed(() => this.mes().find((d) => d.iso === this.seleccionado()));

  readonly periodo = computed(() => {
    if (this.modo() === 'mes') {
      return nombreMes(this.ancla());
    }
    const dias = this.semana();
    return `${dias[0].corta} – ${dias[6].corta}`;
  });

  private readonly rango = computed(() => {
    const dias = this.modo() === 'semana' ? this.semana() : this.mes();
    return { inicio: dias[0].iso, fin: dias[dias.length - 1].iso };
  });

  private readonly comidas = toSignal(
    toObservable(this.rango).pipe(switchMap(({ inicio, fin }) => this.repo.rango$(inicio, fin))),
    { initialValue: [] as ComidaPlaneada[] },
  );

  readonly porDia = computed(() => {
    const mapa = new Map<string, ComidaPlaneada[]>();
    for (const c of this.comidas()) {
      mapa.set(c.fecha, [...(mapa.get(c.fecha) ?? []), c]);
    }
    return mapa;
  });

  constructor() {
    addIcons({ add, chevronBack, chevronForward, todayOutline });
  }

  cambiarModo(modo: Modo): void {
    if (modo === 'semana' && this.modo() === 'mes') {
      this.ancla.set(deIso(this.seleccionado()));
    }
    this.modo.set(modo);
  }

  mover(direccion: 1 | -1): void {
    const ancla = this.ancla();
    if (this.modo() === 'semana') {
      this.ancla.set(sumarDias(ancla, 7 * direccion));
    } else {
      const mes = new Date(ancla.getFullYear(), ancla.getMonth() + direccion, 1);
      this.ancla.set(mes);
      this.seleccionado.set(aIso(mes));
    }
  }

  irAHoy(): void {
    this.ancla.set(new Date());
    this.seleccionado.set(hoyIso());
  }

  async agregar(dia: Dia): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AgregarComidaComponent,
      componentProps: { titulo: `${dia.nombre} ${dia.corta}` },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<ComidaElegida>();
    if (data?.tipo === 'receta') {
      await this.repo.agregarReceta(dia.iso, data.receta);
    } else if (data?.tipo === 'especial') {
      await this.repo.agregarEspecial(dia.iso, data.nombre, data.icono);
    }
  }

  async abrir(comida: ComidaPlaneada): Promise<void> {
    const modal = await this.modalCtrl.create({ component: ComidaDetalleComponent, componentProps: { comida } });
    await modal.present();
    const { data } = await modal.onDidDismiss<ResultadoComidaDetalle>();
    if (data?.accion === 'quitar') {
      await this.repo.quitar(comida.id);
    } else if (data?.accion === 'guardar' && !mismos(data.ingredientes, comida.ingredientes)) {
      await this.repo.actualizarIngredientes(comida.id, data.ingredientes);
      await this.ofrecerGuardarEnReceta(comida, data.ingredientes);
    }
  }

  /** Si el ajuste del día difiere de la receta, pregunta si también se guarda en la receta. */
  private async ofrecerGuardarEnReceta(comida: ComidaPlaneada, ingredientes: string[]): Promise<void> {
    const receta = this.recetas().find((r) => r.id === comida.recetaId);
    if (!receta?.activo || mismos(ingredientes, receta.ingredientes)) {
      return;
    }
    const pregunta = await this.alerta.create({
      header: '¿Cambiar también la receta?',
      message: `Los cambios ya se guardaron para este día. ¿Quieres que "${receta.nombre}" quede así desde ahora?`,
      buttons: [
        { text: 'Solo este día', role: 'cancel' },
        { text: 'Sí, la receta también', role: 'confirm' },
      ],
    });
    await pregunta.present();
    const { role } = await pregunta.onDidDismiss();
    if (role === 'confirm') {
      await this.editor.guardar(
        receta,
        { nombre: receta.nombre, ingredientes, etiquetas: receta.etiquetas },
        comida.id,
      );
    }
  }

  private dia(fecha: Date, delMes: boolean): Dia {
    const iso = aIso(fecha);
    const hoy = hoyIso();
    return {
      iso,
      nombre: nombreDia(fecha),
      corta: fechaCorta(fecha),
      numero: fecha.getDate(),
      hoy: iso === hoy,
      pasado: iso < hoy,
      delMes,
    };
  }
}

function mismos(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}
