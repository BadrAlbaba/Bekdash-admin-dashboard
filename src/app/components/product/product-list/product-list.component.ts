import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../services/product/product.service';
import { CategoryService } from '../../../services/category/category.service';
import { ToastService } from '../../../services/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { environment } from '../../../../enviroments/environment';
import { UserStateService } from '../../../services/auth/user-state.service';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  imports: [CommonModule, FormsModule, NgSelectModule],
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  private readonly SERVER_URL = environment.SERVER_URL;

  isAdmin = false;
  listMode: 'ALL' | 'MY' = 'MY';

  products: any[] = [];
  categories: any[] = [];
  filters: any = { categoryIds: [], sellerId: undefined };
  sortMode = 'CREATED_AT';
  sortOrder = 'DESC';
  sellers: any[] = [];

  loading = false;

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private router: Router,
    private userService: UserStateService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.userService.getRole() === 'ADMIN';
    if (this.isAdmin) {
      this.listMode = 'ALL';
      this.loadSellers();
    }

    this.route.queryParams.subscribe((params) => {
      const categoryId = params['category'];
      if (categoryId) this.filters.categoryIds = [categoryId];
    });

    this.loadCategories();
    this.loadProducts();

    this.searchSubject.pipe(debounceTime(500)).subscribe((value) => {
      this.filters.titleContains = value;
      this.page = 1;
      this.loadProducts();
    });
  }

  loadSellers(): void {
    this.productService.listSellers().subscribe({
      next: (res) => {
        this.sellers = res.data.listSellers.map((s: any) => ({
          id: s.id, // or s.user.id if you want user id
          name: s.user.name, // flatten name for ng-select
          email: s.user.email, // optional
        }));
      },
      error: (err) => {
        this.toastService.show(
          `Failed to load sellers: ${err.message}`,
          'error'
        );
      },
    });
  }

  loadCategories(): void {
    this.categoryService.listCategoriesByLevel('THIRD').subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) =>
        this.toastService.show(`Category load failed: ${err.message}`, 'error'),
    });
  }

  loadProducts(): void {
    this.loading = true;
    const skip = (this.page - 1) * this.pageSize;

    const filters = { ...this.filters };
    if (this.isAdmin && this.listMode === 'MY') {
      filters.sellerId = this.userService.getId();
    }

    this.productService
      .listProducts(filters, this.sortMode, this.sortOrder, skip, this.pageSize)
      .subscribe({
        next: (result) => {
          this.products = result.items;
          this.totalCount = result.totalCount;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.loading = false;
        },
        error: (err) => {
          this.toastService.show(`Load failed: ${err.message}`, 'error');
          this.loading = false;
        },
      });
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.searchSubject.next(value);
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadProducts();
    }
  }

  setSort(field: string): void {
    if (this.sortMode.toLowerCase() === field.toLowerCase()) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortMode = field.toUpperCase();
      this.sortOrder = 'ASC';
    }
    this.loadProducts();
  }

  getSortIcon(field: string): string {
    if (this.sortMode.toLowerCase() !== field.toLowerCase()) return '';
    return this.sortOrder === 'ASC' ? '&uarr;' : '&darr;';
  }

  toggleActive(product: any): void {
    const newStatus = !product.active;

    this.productService
      .updateProduct(product.id, { active: newStatus })
      .subscribe({
        next: () => {
          this.toastService.show(
            `Product ${newStatus ? 'activated' : 'deactivated'}`,
            'success'
          );
          product.active = newStatus;
        },
        error: (err) => {
          this.toastService.show(`Update failed: ${err.message}`, 'error');
        },
      });
  }

  viewProduct(id: string): void {
    this.router.navigate(['/dashboard/products', id]);
  }

  editProduct(id: string): void {
    this.router.navigate(['/dashboard/products', 'edit', id]);
  }

  deleteProduct(product: any): void {
    this.confirmationService
      .confirm(
        'Delete User',
        `Are you sure you want to delete ${product.title}?`
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            this.toastService.show('Product deleted successfully', 'success');
            this.loadProducts();
          },
          error: (err) => {
            this.toastService.show(
              `Error deleting product: ${err.message}`,
              'error'
            );
          },
        });
      });
  }

  getThumbnailUrl(path: string): string {
    const apiBase = this.SERVER_URL;
    return `${apiBase}${path}`;
  }

  get showingRange(): string {
    if (this.totalCount === 0) return '0 of 0 products';

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalCount);
    return `${start} – ${end} of ${this.totalCount} products`;
  }
}
