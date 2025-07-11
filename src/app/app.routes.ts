import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth/auth.guard';
import { LayoutComponent } from './components/layout/layout.component';
import { UserListComponent } from './components/user/user-list/user-list.component';
import { ProductListComponent } from './components/product/product-list/product-list.component';
import { LoginComponent } from './components/login/login.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { OrderListComponent } from './components/order/order-list/order-list.component';
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { CategoryFormComponent } from './components/category/category-form/category-form.component';
import { UserFormComponent } from './components/user/user-form/user-form.component';
import { UserDetailComponent } from './components/user/user-detail/user-detail.component';
import { ProductFormComponent } from './components/product/product-form/product-form.component';
import { ProductDetailComponent } from './components/product/product-detail/product-detail.component';
import { CategoryDetailComponent } from './components/category/category-detail/category-detail.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => RedirectComponent,
    data: { title: 'Login' },
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
        path: 'analytics',
        loadComponent: () => AnalyticsComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SELLER'] },
      },
      {
        path: 'users',
        loadComponent: () => UserListComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'users/new',
        loadComponent: () => UserFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        loadComponent: () => UserDetailComponent,
        path: 'users/:id',
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
        path: 'products/new',
        loadComponent: () => ProductFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SELLER'] },
      },
      {
        path: 'products/:id',
        loadComponent: () => ProductDetailComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SELLER'] },
      },

      {
        path: 'products/edit/:id',
        loadComponent: () => ProductFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SELLER'] },
      },

      {
        path: 'orders',
        loadComponent: () => OrderListComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SELLER'] },
      },
      {
        path: 'categories',
        loadComponent: () => CategoryListComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
        children: [],
      },
      {
        path: 'categories/new',
        loadComponent: () => CategoryFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'categories/:id',
        loadComponent: () => CategoryDetailComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
        children: [],
      },
      {
        path: 'categories/edit/:id',
        loadComponent: () => CategoryFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
        children: [],
      },
      {
        loadComponent: () => UserFormComponent,
        path: 'users/edit/:id',
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
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
