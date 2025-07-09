import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UserStateService } from '../../../services/auth/user-state.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuOpen = false;

  menuItems = [
    {
      label: 'Products',
      sublinks: [
        { label: 'Add Product', routerLink: '/dashboard/products/new' },
        { label: 'Show Products', routerLink: '/dashboard/products' },
      ],
    },
    {
      label: 'Orders',
      sublinks: [
        {
          label: 'New Orders',
          routerLink: '/dashboard/orders',
          queryParams: { status: 'PLACED', viewMode: 'ITEM' },
        },
        {
          label: 'All Orders',
          routerLink: '/dashboard/orders',
        },
      ],
    },
    {
      label: 'Categories',
      sublinks: [
        { label: 'Add Category', routerLink: '/dashboard/categories/new' },
        { label: 'Show Categories', routerLink: '/dashboard/categories' },
      ],
    },
    {
      label: 'Users',
      sublinks: [
        { label: 'Add User', routerLink: '/dashboard/users/new' },
        { label: 'Show Users', routerLink: '/dashboard/users' },
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
