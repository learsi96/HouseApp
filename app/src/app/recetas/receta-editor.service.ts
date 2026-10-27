import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertController, ModalController } from '@ionic/angular';

import { ComidasRepository } from '../data/comidas.repository';
import { hoyIso } from '../data/fechas';
import type { Receta } from '../data/modelos';
import type { DatosReceta } from '../data/recetas.repository';
import { RecetasRepository } from '../data/recetas.repository';

import { RecetaFormComponent } from './receta-form.component';
import type { ResultadoRecetaForm } from './receta-form.component';

/** Abre el formulario de receta y guarda el resultado. Lo usan el recetario y el calendario. */
@Injectable({ providedIn: 'root' })
export class RecetaEditorService {
  private readonly repo = inject(RecetasRepository);
  private readonly comidas = inject(ComidasRepository);
  private readonly modalCtrl = inject(ModalController);
  private readonly alerta = inject(AlertController);
  private readonly recetas = toSignal(this.repo.todas$, { initialValue: [] as Receta[] });

  /** Crea una receta nueva. Devuelve la receta creada, o undefined si se canceló. */
  async nueva(nombreInicial = ''): Promise<Receta | undefined> {
    const resultado = await this.abrir({ nombreInicial });
    if (resultado && resultado !== 'cambiar-activo') {
      return { id: await this.repo.crear(resultado), ...resultado, activo: true };
    }
    return undefined;
  }

  async editar(receta: Receta): Promise<void> {
    const resultado = await this.abrir({ receta });
    if (!resultado) {
      return;
    }
    if (resultado !== 'cambiar-activo') {
      await this.guardar(receta, resultado);
    } else if (!receta.activo) {
      await this.repo.cambiarActivo(receta.id, true);
    } else {
      const confirmacion = await this.alerta.create({
        header: 'Inactivar receta',
        message: `"${receta.nombre}" dejará de aparecer en el recetario. Los días donde ya está planeada no cambian.`,
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

  /**
   * Guarda cambios en la receta y, si cambió el nombre o los ingredientes, pregunta si se aplican
   * también a las comidas ya planeadas desde hoy. Los días pasados nunca cambian.
   * @param excluirComidaId comida que originó el cambio (ya tiene sus ingredientes).
   */
  async guardar(receta: Receta, datos: DatosReceta, excluirComidaId?: string): Promise<void> {
    await this.repo.actualizar(receta.id, datos);
    const cambio =
      datos.nombre !== receta.nombre ||
      datos.ingredientes.length !== receta.ingredientes.length ||
      datos.ingredientes.some((id) => !receta.ingredientes.includes(id));
    if (!cambio) {
      return;
    }
    const futuras = (await this.comidas.deRecetaDesde(receta.id, hoyIso())).filter((c) => c.id !== excluirComidaId);
    if (!futuras.length) {
      return;
    }
    const pregunta = await this.alerta.create({
      header: 'Comidas ya planeadas',
      message:
        `"${datos.nombre}" está planeada ${futuras.length === 1 ? 'otra vez' : `${futuras.length} veces más`} ` +
        'desde hoy. ¿Les aplico también los cambios? Se reemplazan sus ingredientes por los de la receta.',
      buttons: [
        { text: 'No, solo la receta', role: 'cancel' },
        { text: 'Sí, actualizarlas', role: 'confirm' },
      ],
    });
    await pregunta.present();
    const { role } = await pregunta.onDidDismiss();
    if (role === 'confirm') {
      await this.comidas.actualizarDesdeReceta(
        futuras.map((c) => c.id),
        datos,
      );
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
