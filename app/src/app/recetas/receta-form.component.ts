import type { OnInit } from '@angular/core';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, closeCircle, closeOutline } from 'ionicons/icons';

import { ArticuloSelectorComponent } from '../catalogo/articulo-selector.component';
import { ArticulosRepository } from '../data/articulos.repository';
import { ClasificacionesRepository } from '../data/clasificaciones.repository';
import type { Articulo, Clasificacion, Receta } from '../data/modelos';
import type { DatosReceta } from '../data/recetas.repository';
import { claveTexto, limpiarNombre } from '../data/texto';

/** Resultado: los datos a guardar, o 'cambiar-activo' para inactivar/reactivar. */
export type ResultadoRecetaForm = DatosReceta | 'cambiar-activo';

interface Ingrediente {
  articulo: Articulo;
  clasificacion?: Clasificacion;
}

@Component({
  selector: 'app-receta-form',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cerrar()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ receta ? 'Editar' : 'Nueva' }} receta</ion-title>
        <ion-buttons slot="end">
          <ion-button strong (click)="guardar()">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list lines="none">
        <ion-item>
          <ion-input
            label="Nombre de la comida"
            labelPlacement="stacked"
            fill="outline"
            placeholder="Ej. Molida con bandera"
            [(ngModel)]="nombre"
            (ionInput)="error.set('')"
          ></ion-input>
        </ion-item>
        @if (error()) {
          <ion-note color="danger" class="error">{{ error() }}</ion-note>
        }
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>Ingredientes ({{ ingredientes().length }})</ion-label>
          <ion-button (click)="elegirIngredientes()">
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

      <ion-list lines="none">
        <ion-list-header>
          <ion-label>Etiquetas</ion-label>
        </ion-list-header>
        <div class="chips">
          @for (e of etiquetas(); track e) {
            <ion-chip color="primary" (click)="quitarEtiqueta(e)">
              <ion-label>{{ e }}</ion-label>
              <ion-icon name="close-circle"></ion-icon>
            </ion-chip>
          }
        </div>
        <ion-item>
          <ion-input
            fill="outline"
            placeholder="Ej. pollo, rápida, económica…"
            [value]="nuevaEtiqueta()"
            (ionInput)="nuevaEtiqueta.set($any($event).detail.value ?? '')"
            (keyup.enter)="agregarEtiqueta(nuevaEtiqueta())"
          ></ion-input>
          <ion-button slot="end" fill="clear" (click)="agregarEtiqueta(nuevaEtiqueta())" aria-label="Agregar etiqueta">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
        </ion-item>
        @if (sugerencias().length) {
          <div class="chips">
            @for (s of sugerencias(); track s) {
              <ion-chip [outline]="true" (click)="agregarEtiqueta(s)">
                <ion-icon name="add"></ion-icon>
                <ion-label>{{ s }}</ion-label>
              </ion-chip>
            }
          </div>
        }
      </ion-list>

      @if (receta) {
        <div class="ion-padding">
          <ion-button
            expand="block"
            fill="outline"
            [color]="receta.activo ? 'danger' : 'primary'"
            (click)="cerrar('cambiar-activo')"
          >
            {{ receta.activo ? 'Inactivar receta' : 'Reactivar receta' }}
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: `
    .error {
      display: block;
      padding: 4px 16px;
    }
    .chico {
      width: 32px;
      height: 32px;
      font-size: 18px;
    }
    .inactivo {
      opacity: 0.55;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      padding: 0 12px;
    }
    ion-list-header ion-button {
      margin-right: 8px;
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
    IonLabel,
    IonNote,
    IonBadge,
    IonIcon,
    IonChip,
  ],
})
export class RecetaFormComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  /** Receta a editar; sin valor = nueva. */
  @Input() receta?: Receta;
  /** Nombre sugerido para una receta nueva. */
  @Input() nombreInicial = '';
  /** Todas las recetas: para validar nombres repetidos y sugerir etiquetas. */
  @Input() existentes: Receta[] = [];

  private readonly articulos = toSignal(inject(ArticulosRepository).todos$, { initialValue: [] as Articulo[] });
  private readonly clasificaciones = toSignal(inject(ClasificacionesRepository).todas$, {
    initialValue: [] as Clasificacion[],
  });

  readonly error = signal('');
  readonly ingredienteIds = signal<string[]>([]);
  readonly etiquetas = signal<string[]>([]);
  readonly nuevaEtiqueta = signal('');
  nombre = '';

  /** Ingredientes en el orden del recorrido del súper y luego alfabético. */
  readonly ingredientes = computed<Ingrediente[]>(() => {
    const articulos = new Map(this.articulos().map((a) => [a.id, a]));
    const clasificaciones = new Map(this.clasificaciones().map((c) => [c.id, c]));
    return this.ingredienteIds()
      .map((id) => articulos.get(id))
      .filter((a): a is Articulo => !!a)
      .map((articulo) => ({ articulo, clasificacion: clasificaciones.get(articulo.clasificacionId) }))
      .sort(
        (a, b) =>
          (a.clasificacion?.orden ?? 99) - (b.clasificacion?.orden ?? 99) ||
          a.articulo.nombre.localeCompare(b.articulo.nombre, 'es'),
      );
  });

  /** Etiquetas usadas en otras recetas que coinciden con lo escrito y no están ya puestas. */
  readonly sugerencias = computed(() => {
    const filtro = claveTexto(this.nuevaEtiqueta());
    const puestas = new Set(this.etiquetas());
    const todas = new Set(this.existentes.flatMap((r) => r.etiquetas));
    return [...todas]
      .filter((e) => !puestas.has(e) && claveTexto(e).includes(filtro))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .slice(0, 12);
  });

  constructor() {
    addIcons({ add, closeOutline, closeCircle });
  }

  ngOnInit(): void {
    if (this.receta) {
      this.nombre = this.receta.nombre;
      this.ingredienteIds.set([...this.receta.ingredientes]);
      this.etiquetas.set([...this.receta.etiquetas]);
    } else {
      this.nombre = limpiarNombre(this.nombreInicial);
    }
  }

  async elegirIngredientes(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ArticuloSelectorComponent,
      componentProps: { titulo: 'Ingredientes', seleccionados: this.ingredienteIds() },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<string[]>();
    if (data) {
      this.ingredienteIds.set(data);
    }
  }

  quitar(id: string): void {
    this.ingredienteIds.update((ids) => ids.filter((x) => x !== id));
  }

  agregarEtiqueta(texto: string): void {
    const limpia = texto.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!limpia) {
      return;
    }
    // Si ya existe con otra escritura ("Rápida" / "rapida"), se usa la existente.
    const clave = claveTexto(limpia);
    const existente = this.existentes.flatMap((r) => r.etiquetas).find((e) => claveTexto(e) === clave);
    const etiqueta = existente ?? limpia;
    if (!this.etiquetas().some((e) => claveTexto(e) === clave)) {
      this.etiquetas.update((lista) => [...lista, etiqueta]);
    }
    this.nuevaEtiqueta.set('');
  }

  quitarEtiqueta(etiqueta: string): void {
    this.etiquetas.update((lista) => lista.filter((e) => e !== etiqueta));
  }

  guardar(): void {
    const nombre = limpiarNombre(this.nombre);
    if (!nombre) {
      this.error.set('Escribe el nombre de la comida.');
      return;
    }
    const repetida = this.existentes.find(
      (r) => r.id !== this.receta?.id && claveTexto(r.nombre) === claveTexto(nombre),
    );
    if (repetida) {
      this.error.set(
        repetida.activo
          ? `Ya existe la receta "${repetida.nombre}".`
          : `Ya existe "${repetida.nombre}" (inactiva). Reactívala desde el recetario.`,
      );
      return;
    }
    // Lo escrito en etiquetas sin presionar "+" también se guarda.
    this.agregarEtiqueta(this.nuevaEtiqueta());
    this.cerrar({ nombre, ingredientes: this.ingredienteIds(), etiquetas: this.etiquetas() });
  }

  cerrar(resultado?: ResultadoRecetaForm): void {
    this.modalCtrl.dismiss(resultado);
  }
}
