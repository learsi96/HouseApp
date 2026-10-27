import type { Routes } from '@angular/router';

import { hogarGuard } from './core/hogar.guard';

export const routes: Routes = [
  {
    path: 'bienvenida',
    loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: 'home',
    canActivate: [hogarGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
