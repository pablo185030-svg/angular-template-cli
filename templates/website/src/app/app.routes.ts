import { Routes } from '@angular/router';
import { RouteSeoData } from '@core/models/seo.model';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Inicio',
        data: {
          seo: {
            description:
              'Punto de partida para sitios web Angular con renderizado en el servidor, construido con Coto UI Kit.',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('@domains/home/pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'acerca-de',
        title: 'Acerca de',
        data: {
          seo: {
            description:
              'Conocé cómo está organizado este proyecto y cómo agregar nuevas páginas por área funcional.',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('@domains/about/pages/about-page/about-page').then((m) => m.AboutPage),
      },
      {
        path: '**',
        title: 'Página no encontrada',
        data: {
          seo: {
            description: 'La página que buscás no existe.',
            noindex: true,
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('@shared/pages/not-found-page/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
