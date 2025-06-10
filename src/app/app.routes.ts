import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth/auth.guard';
import { LayoutComponent } from './components/layout/layout.component';
import { UserListComponent } from './components/user/user-list/user-list.component';
import { ProductListComponent } from './components/product/product-list/product-list.component';
import { LoginComponent } from './components/login/login.component';
import { RedirectComponent } from './components/redirect/redirect.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => RedirectComponent,
    data: { title: 'Redirect' },
  },
  {
    path: 'login',
    loadComponent: () => LoginComponent,
    data: { title: 'Login' },
  },
  {
    path: 'dashboard',
    loadComponent: () => LayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'SELLER'] },
    children: [
      {
        path: 'users',
        loadComponent: () => UserListComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'products',
        loadComponent: () => ProductListComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SELLER'] },
      },
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
