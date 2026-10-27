import { ElementRef, inject } from '@angular/core';

/**
 * Devuelve una función que cierra el modal donde vive el componente.
 * `ModalController.dismiss()` cierra "el de hasta arriba", y con modales anidados
 * (receta → selector → nuevo artículo) puede cerrar el equivocado si alguno sigue animándose.
 * Se debe llamar en el constructor o en la inicialización de un campo (contexto de inyección).
 */
export function cerrarEsteModal(): (data?: unknown) => void {
  const elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  return (data?: unknown) => {
    void (elemento.closest('ion-modal') as HTMLIonModalElement | null)?.dismiss(data);
  };
}
