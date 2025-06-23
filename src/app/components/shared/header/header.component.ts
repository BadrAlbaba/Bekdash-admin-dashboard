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
      addLink: '/dashboard/products/new',
      listLink: '/dashboard/products',
    },
    {
      label: 'Orders',
      addLink: '/dashboard/orders/new',
      listLink: '/dashboard/orders',
    },
    {
      label: 'Categories',
      addLink: '/dashboard/categories/new',
      listLink: '/dashboard/categories',
    },
    {
      label: 'Users',
      addLink: '/dashboard/users/new',
      listLink: '/dashboard/users',
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
    // Assuming userService has a getCurrentUser() returning the logged-in user object

    if (role === 'SELLER') {
      this.menuItems = this.menuItems.filter(
        (item) => item.label !== 'Categories' && item.label !== 'Users'
      );
    }
  }
}
