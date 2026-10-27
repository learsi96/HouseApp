import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonNote, IonSpinner } from '@ionic/angular';

import { HogarService } from '../core/hogar.service';

type Paso = 'inicio' | 'creado' | 'unirse';

@Component({
  selector: 'app-bienvenida',
  templateUrl: 'bienvenida.page.html',
  styleUrls: ['bienvenida.page.scss'],
  imports: [FormsModule, IonContent, IonButton, IonInput, IonNote, IonSpinner],
})
export class BienvenidaPage {
  private readonly hogarService = inject(HogarService);
  private readonly router = inject(Router);

  readonly paso = signal<Paso>('inicio');
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly codigoCreado = signal('');
  codigo = '';

  async crear(): Promise<void> {
    await this.ejecutar(async () => {
      const hogar = await this.hogarService.crear();
      this.codigoCreado.set(hogar.codigo);
      this.paso.set('creado');
    }, 'No se pudo crear el hogar. Revisa tu conexión a internet.');
  }

  async unirse(): Promise<void> {
    await this.ejecutar(async () => {
      const hogar = await this.hogarService.unirse(this.codigo);
      if (!hogar) {
        this.error.set('Ese código no existe. Revísalo e inténtalo de nuevo.');
        return;
      }
      await this.entrar();
    }, 'No se pudo unir al hogar. Revisa tu conexión a internet.');
  }

  irA(paso: Paso): void {
    this.error.set('');
    this.paso.set(paso);
  }

  entrar(): Promise<boolean> {
    return this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  private async ejecutar(accion: () => Promise<void>, mensajeError: string): Promise<void> {
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
    } catch (e) {
      console.error(e);
      this.error.set(mensajeError);
    } finally {
      this.ocupado.set(false);
    }
  }
}
