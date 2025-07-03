import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category/category.service';
import { ToastService } from '../../../services/toast/toast.service';
import { environment } from '../../../../enviroments/environment';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';

@Component({
  selector: 'app-category-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.scss'],
})
export class CategoryDetailComponent implements OnInit {
  category: any = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCategory(id);
    } else {
      this.toastService.show('No category ID provided.', 'error');
      this.router.navigate(['/dashboard/categories']);
    }
  }

  loadCategory(id: string): void {
    this.loading = true;
    this.categoryService.getCategory(id).subscribe({
      next: (cat) => {
        this.category = cat;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.show(
          `Failed to load category: ${err.message}`,
          'error'
        );
        this.loading = false;
        this.router.navigate(['/dashboard/categories']);
      },
    });
  }

  getImageUrl(path: string): string {
    return `${environment.SERVER_URL}${path}`;
  }

  onEdit(): void {
    this.router.navigate(['/dashboard/categories/edit', this.category.id]);
  }

  viewProducts(): void {
    this.router.navigate(['/dashboard/products'], {
      queryParams: { category: this.category.id },
    });
  }

  onBack(): void {
    window.history.back();
  }

  onDelete(): void {
    this.confirmationService
      .confirm(
        'Delete Category',
        `Are you sure you want to delete "${this.category.name}" and its subcategories?`
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.categoryService.deleteCategory(this.category.id).subscribe({
          next: () => {
            this.toastService.show('Category deleted successfully', 'success');
            this.router.navigate(['/dashboard/categories']);
          },
          error: (err) => {
            this.toastService.show(
              'Failed to delete category: ' + err.message,
              'error'
            );
          },
        });
      });
  }
}
