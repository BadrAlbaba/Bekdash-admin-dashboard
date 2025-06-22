import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

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

  constructor(private router: Router, private authService: AuthService) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.router.navigate(['/login']);
    this.authService.logout();
  }
}
