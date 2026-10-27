import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertController, ModalController } from '@ionic/angular';

import type { Receta } from '../data/modelos';
import { RecetasRepository } from '../data/recetas.repository';

import { RecetaFormComponent } from './receta-form.component';
import type { ResultadoRecetaForm } from './receta-form.component';

/** Abre el formulario de receta y guarda el resultado. Lo usan el recetario y el calendario. */
@Injectable({ providedIn: 'root' })
export class RecetaEditorService {
  private readonly repo = inject(RecetasRepository);
  private readonly modalCtrl = inject(ModalController);
  private readonly alerta = inject(AlertController);
  private readonly recetas = toSignal(this.repo.todas$, { initialValue: [] as Receta[] });

  /** Crea una receta nueva. Devuelve su id, o undefined si se canceló. */
  async nueva(nombreInicial = ''): Promise<string | undefined> {
    const resultado = await this.abrir({ nombreInicial });
    if (resultado && resultado !== 'cambiar-activo') {
      return this.repo.crear(resultado);
    }
    return undefined;
  }

  async editar(receta: Receta): Promise<void> {
    const resultado = await this.abrir({ receta });
    if (!resultado) {
      return;
    }
    if (resultado !== 'cambiar-activo') {
      // Etapa 3: aquí se preguntará si actualizar también los días futuros que ya la tienen planeada.
      await this.repo.actualizar(receta.id, resultado);
    } else if (!receta.activo) {
      await this.repo.cambiarActivo(receta.id, true);
    } else {
      const confirmacion = await this.alerta.create({
        header: 'Inactivar receta',
        message: `"${receta.nombre}" dejará de aparecer en el recetario. Los días donde ya se usó no cambian.`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Inactivar', role: 'destructive' },
        ],
      });
      await confirmacion.present();
      const { role } = await confirmacion.onDidDismiss();
      if (role === 'destructive') {
        await this.repo.cambiarActivo(receta.id, false);
      }
    }
  }

  private async abrir(props: { receta?: Receta; nombreInicial?: string }): Promise<ResultadoRecetaForm | undefined> {
    const modal = await this.modalCtrl.create({
      component: RecetaFormComponent,
      componentProps: { ...props, existentes: this.recetas() },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<ResultadoRecetaForm>();
    return data;
  }
}
