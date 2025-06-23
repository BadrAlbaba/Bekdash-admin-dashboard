import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category/category.service';
import { ToastService } from '../../../services/toast/toast.service';
import { environment } from '../../../../enviroments/environment';

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
    private toastService: ToastService
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
    this.router.navigate(['/dashboard/categories', this.category.id, 'edit']);
  }

  viewProducts(): void {
    this.router.navigate(['/dashboard/products'], {
      queryParams: { category: this.category.id },
    });
  }

  onBack(): void {
    this.router.navigate(['/dashboard/categories']);
  }
}
