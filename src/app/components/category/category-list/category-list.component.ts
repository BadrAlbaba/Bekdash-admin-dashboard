import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-category-list',
  imports: [RouterModule, RouterOutlet],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  constructor(private router: Router) {}
  navigateToNew(): void {
    this.router.navigate(['dashboard/categories/new']);
  }
}
