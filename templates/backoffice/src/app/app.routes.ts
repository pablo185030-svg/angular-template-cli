import { Routes } from '@angular/router';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';
import { authGuard } from '@core/guards/auth.guard';
import { loginPageGuard } from '@core/guards/login-page.guard';
import { permissionGuard } from '@core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Login',
    canActivate: [loginPageGuard],
    loadComponent: () =>
      import('@domains/login/pages/login-page/login-page').then((m) => m.LoginPage),
  },
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
        canActivate: [permissionGuard('read')],
        loadComponent: () =>
          import('@domains/products/pages/products-list-page/products-list-page').then(
            (m) => m.ProductsListPage,
          ),
      },
      {
        path: 'productos/nuevo',
        title: 'New product',
        canActivate: [permissionGuard('write')],
        loadComponent: () =>
          import('@domains/products/pages/product-form-page/product-form-page').then(
            (m) => m.ProductFormPage,
          ),
      },
      {
        path: 'productos/:id/editar',
        title: 'Edit product',
        canActivate: [permissionGuard('write')],
        loadComponent: () =>
          import('@domains/products/pages/product-form-page/product-form-page').then(
            (m) => m.ProductFormPage,
          ),
      },
      {
        path: 'roles',
        title: 'Roles',
        canActivate: [permissionGuard('manage-roles')],
        loadComponent: () =>
          import('@domains/roles/pages/roles-list-page/roles-list-page').then(
            (m) => m.RolesListPage,
          ),
      },
      {
        path: 'roles/nuevo',
        title: 'New role',
        canActivate: [permissionGuard('manage-roles')],
        loadComponent: () =>
          import('@domains/roles/pages/role-form-page/role-form-page').then((m) => m.RoleFormPage),
      },
      {
        path: 'roles/:id/editar',
        title: 'Edit role',
        canActivate: [permissionGuard('manage-roles')],
        loadComponent: () =>
          import('@domains/roles/pages/role-form-page/role-form-page').then((m) => m.RoleFormPage),
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
