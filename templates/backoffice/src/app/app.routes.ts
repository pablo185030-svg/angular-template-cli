import { Routes } from '@angular/router';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Home',
        loadComponent: () =>
          import('@domains/home/pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'acerca-de',
        title: 'About',
        loadComponent: () =>
          import('@domains/about/pages/about-page/about-page').then((m) => m.AboutPage),
      },
      {
        path: 'productos',
        title: 'Products',
        loadComponent: () =>
          import('@domains/products/pages/products-list-page/products-list-page').then(
            (m) => m.ProductsListPage,
          ),
      },
      {
        path: 'productos/nuevo',
        title: 'New product',
        loadComponent: () =>
          import('@domains/products/pages/product-form-page/product-form-page').then(
            (m) => m.ProductFormPage,
          ),
      },
      {
        path: 'productos/:id/editar',
        title: 'Edit product',
        loadComponent: () =>
          import('@domains/products/pages/product-form-page/product-form-page').then(
            (m) => m.ProductFormPage,
          ),
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
