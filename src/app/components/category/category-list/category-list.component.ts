import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../../services/category/category.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast/toast.service';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';
import { environment } from '../../../../enviroments/environment';

@Component({
  selector: 'app-category-list',
  imports: [RouterModule, CommonModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  categories: any[] = [];
  flattenedCategories: any[] = [];

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategoryTree().subscribe({
      next: (data) => {
        this.flattenedCategories = this.flattenCategories(data);
      },
    });
  }

  // Add expanded state to each category
  flattenCategories(
    categories: any[],
    depth: number = 0,
    parentId: string | null = null
  ): any[] {
    let result: any[] = [];
    for (const cat of categories) {
      const entry = {
        ...cat,
        depth,
        parentId,
        expanded: false,
        visible: depth === 0, // Only root visible at first
      };
      result.push(entry);
      if (cat.children?.length) {
        const childItems = this.flattenCategories(
          cat.children,
          depth + 1,
          cat.id
        );
        result.push(...childItems);
      }
    }
    return result;
  }

  toggleExpand(categoryId: string): void {
    const category = this.flattenedCategories.find((c) => c.id === categoryId);
    if (!category) return;
    category.expanded = !category.expanded;
    this.updateVisibility();
  }

  updateVisibility(): void {
    const visibilityMap = new Map<string, boolean>();
    for (const cat of this.flattenedCategories) {
      if (cat.depth === 0) {
        cat.visible = true;
        visibilityMap.set(cat.id, cat.expanded);
      } else {
        const parentVisible = visibilityMap.get(cat.parentId!) ?? false;
        cat.visible = parentVisible;
        visibilityMap.set(cat.id, parentVisible && cat.expanded);
      }
    }
  }

  onView(categoryId: string) {
    this.router.navigate(['/dashboard/categories', categoryId]);
  }

  onEdit(categoryId: string) {
    this.router.navigate(['/dashboard/categories/edit', categoryId]);
  }

  getImageUrl(path: string): string {
    return `${environment.SERVER_URL}${path}`;
  }

  onDelete(category: any) {
    this.confirmationService
      .confirm(
        'Delete Category',
        `Are you sure you want to delete "${category.name}" and its subcategories?`
      )
      .then((confirmed) => {
        if (!confirmed) return;

        //TODO: Implement actual deletion logic
        // this.categoryService.deleteCategory(category.id).subscribe({
        //   next: () => {
        //     this.flattenedCategories = this.flattenedCategories.filter(
        //       (c) => c.id !== category.id && c.parentId !== category.id
        //     );
        //     this.toastService.show('Category deleted successfully', 'success');
        //   },
        //   error: (err) => {
        //     this.toastService.show(
        //       'Failed to delete category: ' + err.message,
        //       'error'
        //     );
        //   },
        // });
      });
  }
}
