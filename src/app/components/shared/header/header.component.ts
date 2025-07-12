import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UserStateService } from '../../../services/auth/user-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuOpen = false;

  menuItems = [
    {
      label: 'MENU.PRODUCTS',
      sublinks: [
        { label: 'MENU.ADD_PRODUCT', routerLink: '/dashboard/products/new' },
        { label: 'MENU.SHOW_PRODUCTS', routerLink: '/dashboard/products' },
      ],
    },
    {
      label: 'MENU.ORDERS',
      sublinks: [
        {
          label: 'MENU.NEW_ORDERS',
          routerLink: '/dashboard/orders',
          queryParams: { status: 'PLACED', viewMode: 'ITEM' },
        },
        {
          label: 'MENU.ALL_ORDERS',
          routerLink: '/dashboard/orders',
        },
      ],
    },
    {
      label: 'MENU.CATEGORIES',
      sublinks: [
        { label: 'MENU.ADD_CATEGORY', routerLink: '/dashboard/categories/new' },
        { label: 'MENU.SHOW_CATEGORIES', routerLink: '/dashboard/categories' },
      ],
    },
    {
      label: 'MENU.USERS',
      sublinks: [
        { label: 'MENU.ADD_USER', routerLink: '/dashboard/users/new' },
        { label: 'MENU.SHOW_USERS', routerLink: '/dashboard/users' },
      ],
    },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserStateService
  ) {
    this.filterMenuItems();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.router.navigate(['/login']);
    this.authService.logout();
  }
  filterMenuItems() {
    const role = this.userService.getRole();

    if (role === 'SELLER') {
      this.menuItems = this.menuItems.filter(
        (item) => item.label !== 'Categories' && item.label !== 'Users'
      );
    }
  }
}
