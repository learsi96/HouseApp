import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, addCircleOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';

import type { Receta } from '../data/modelos';
import { RecetasRepository } from '../data/recetas.repository';
import { claveTexto } from '../data/texto';

import { RecetaEditorService } from './receta-editor.service';

@Component({
  selector: 'app-recetas',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Recetas</ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="verInactivas.set(!verInactivas())"
            [attr.aria-label]="verInactivas() ? 'Ocultar inactivas' : 'Ver inactivas'"
          >
            <ion-icon slot="icon-only" [name]="verInactivas() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-searchbar
          placeholder="Buscar receta…"
          [debounce]="150"
          [value]="busqueda()"
          (ionInput)="busqueda.set($any($event).detail.value ?? '')"
        ></ion-searchbar>
      </ion-toolbar>
      @if (etiquetas().length) {
        <ion-toolbar class="filtros">
          <div class="chips">
            @for (e of etiquetas(); track e) {
              <ion-chip [outline]="filtro() !== e" color="primary" (click)="filtro.set(filtro() === e ? '' : e)">
                <ion-label>{{ e }}</ion-label>
              </ion-chip>
            }
          </div>
        </ion-toolbar>
      }
    </ion-header>

    <ion-content>
      <ion-list>
        @if (puedeCrear()) {
          <ion-item button [detail]="false" (click)="nueva(busqueda())">
            <ion-icon slot="start" name="add-circle-outline" color="primary"></ion-icon>
            <ion-label color="primary">Crear receta "{{ busqueda().trim() }}"</ion-label>
          </ion-item>
        }
        @for (r of visibles(); track r.id) {
          <ion-item button [detail]="false" [class.inactiva]="!r.activo" (click)="editor.editar(r)">
            <ion-label>
              <h2>{{ r.nombre }}</h2>
              @if (r.etiquetas.length) {
                <p>{{ r.etiquetas.join(' · ') }}</p>
              }
            </ion-label>
            <ion-note slot="end">
              @if (!r.activo) {
                Inactiva ·
              }
              {{ r.ingredientes.length }} ingr.
            </ion-note>
          </ion-item>
        } @empty {
          @if (!puedeCrear()) {
            <div class="vacio">
              <div class="icono">🍲</div>
              <p>
                @if (recetas().length) {
                  No hay recetas que coincidan.
                } @else {
                  Todavía no hay recetas.<br />Toca el botón + para crear la primera.
                }
              </p>
            </div>
          }
        }
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="nueva(busqueda())">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: `
    .filtros {
      --min-height: 0;
    }
    .chips {
      display: flex;
      overflow-x: auto;
      padding: 0 8px;
    }
    ion-chip {
      flex-shrink: 0;
    }
    .inactiva {
      opacity: 0.55;
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
    IonTitle,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonChip,
    IonIcon,
    IonFab,
    IonFabButton,
  ],
})
export class RecetasPage {
  readonly editor = inject(RecetaEditorService);
  readonly recetas = toSignal(inject(RecetasRepository).todas$, { initialValue: [] as Receta[] });

  readonly busqueda = signal('');
  readonly filtro = signal('');
  readonly verInactivas = signal(false);

  /** Etiquetas de las recetas activas, para filtrar. */
  readonly etiquetas = computed(() =>
    [
      ...new Set(
        this.recetas()
          .filter((r) => r.activo)
          .flatMap((r) => r.etiquetas),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es')),
  );

  readonly visibles = computed(() => {
    const texto = claveTexto(this.busqueda());
    const etiqueta = this.filtro();
    return this.recetas().filter(
      (r) =>
        (r.activo || this.verInactivas()) &&
        claveTexto(r.nombre).includes(texto) &&
        (!etiqueta || r.etiquetas.includes(etiqueta)),
    );
  });

  readonly puedeCrear = computed(() => {
    const clave = claveTexto(this.busqueda());
    return !!clave && !this.recetas().some((r) => claveTexto(r.nombre) === clave);
  });

  constructor() {
    addIcons({ add, addCircleOutline, eyeOutline, eyeOffOutline });
  }

  async nueva(nombreInicial: string): Promise<void> {
    if (await this.editor.nueva(nombreInicial)) {
      this.busqueda.set('');
    }
  }
}
