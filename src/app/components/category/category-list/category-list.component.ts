import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { CategoryService } from '../../../services/category/category.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-list',
  imports: [RouterModule, CommonModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  categories: any[] = [];
  flattenedCategories: any[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getCategoryTree().subscribe({
      next: (data) => {
        this.flattenedCategories = this.flattenCategories(data);
      },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  flattenCategories(categories: any[], depth: number = 0): any[] {
    let result: any[] = [];

    for (const cat of categories) {
      result.push({ ...cat, depth });
      if (cat.children?.length) {
        result = result.concat(this.flattenCategories(cat.children, depth + 1));
      }
    }

    return result;
  }
}
