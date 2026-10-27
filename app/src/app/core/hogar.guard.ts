import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { HogarService } from './hogar.service';

/** Sin hogar todavía → pantalla de bienvenida (crear o unirse con código). */
export const hogarGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const hogar = await inject(HogarService).actual();
  return hogar ? true : router.parseUrl('/bienvenida');
};
