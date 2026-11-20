import { Routes } from '@angular/router';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Home',
        loadComponent: () =>
          import('@domains/home/pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'about',
        title: 'About',
        loadComponent: () =>
          import('@domains/about/pages/about-page/about-page').then((m) => m.AboutPage),
      },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () =>
          import('@shared/pages/not-found-page/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
