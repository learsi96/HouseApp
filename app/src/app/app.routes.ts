import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

import { hogarGuard } from './core/hogar.guard';

const proximamente = (): Promise<Type<unknown>> => import('./tabs/proximamente.page').then((m) => m.ProximamentePage);

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
        loadComponent: proximamente,
        data: { titulo: 'Calendario', mensaje: 'Aquí irá el calendario de comidas (Etapa 3).' },
      },
      {
        path: 'recetas',
        loadComponent: () => import('./recetas/recetas.page').then((m) => m.RecetasPage),
      },
      {
        path: 'lista',
        loadComponent: proximamente,
        data: { titulo: 'Lista del súper', mensaje: 'Aquí irá la lista del súper (Etapa 4).' },
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
