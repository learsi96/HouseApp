import type { Routes } from '@angular/router';

import { hogarGuard } from './core/hogar.guard';

export const routes: Routes = [
  {
    path: 'bienvenida',
    loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: '',
    canActivate: [hogarGuard],
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'calendario',
        loadComponent: () => import('./calendario/calendario.page').then((m) => m.CalendarioPage),
      },
      {
        path: 'recetas',
        loadComponent: () => import('./recetas/recetas.page').then((m) => m.RecetasPage),
      },
      {
        path: 'lista',
        loadComponent: () => import('./lista/lista.page').then((m) => m.ListaPage),
      },
      {
        path: 'mas',
        loadComponent: () => import('./mas/mas.page').then((m) => m.MasPage),
      },
      {
        path: 'mas/articulos',
        loadComponent: () => import('./catalogo/articulos.page').then((m) => m.ArticulosPage),
      },
      {
        path: 'mas/clasificaciones',
        loadComponent: () => import('./catalogo/clasificaciones.page').then((m) => m.ClasificacionesPage),
      },
      { path: '', redirectTo: 'calendario', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
