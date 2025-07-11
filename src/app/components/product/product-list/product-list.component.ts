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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  imports: [CommonModule, FormsModule, NgSelectModule, TranslateModule],
  styleUrls: ['./product-list.component.scss', '../../../app.component.scss'],
})
export class ProductListComponent implements OnInit {
  private readonly SERVER_URL = environment.SERVER_URL;

  isAdmin = false;
  listMode: 'ALL' | 'MY' = 'MY';

  products: any[] = [];
  categories: any[] = [];
  filters: any = { categoryIds: [], sellerIds: [] };
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
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.userService.getRole() === 'ADMIN';
    if (this.isAdmin) {
      this.listMode = 'ALL';
      this.loadSellers();
    }

    this.route.queryParams.subscribe((params) => {
      const categoryId = params['category'];
      const sellerId = params['sellerId'];
      console.log('Query params:', params);
      if (categoryId) this.filters.categoryIds = [categoryId];
      if (sellerId) this.filters.sellerIds = [sellerId];
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
          id: s.id,
          name: s.user.name,
          email: s.user.email,
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
      filters.sellerIds = [this.userService.getId()];
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
            this.translate.instant(
              newStatus
                ? 'TOAST.PRODUCT_ACTIVATED'
                : 'TOAST.PRODUCT_DEACTIVATED'
            ),
            'success'
          );
          product.active = newStatus;
        },
        error: (err) => {
          this.toastService.show(
            this.translate.instant('TOAST.UPDATE_FAILED', {
              error: err.message,
            }),
            'error'
          );
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
        this.translate.instant('CONFIRMATION.DELETE_PRODUCT_TITLE'),
        this.translate.instant('CONFIRMATION.DELETE_PRODUCT_MESSAGE', {
          title: product.title,
        })
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            this.toastService.show(
              this.translate.instant('TOAST.PRODUCT_DELETED'),
              'success'
            );
            this.loadProducts();
          },
          error: (err) => {
            this.toastService.show(
              this.translate.instant('TOAST.PRODUCT_DELETE_FAILED', {
                error: err.message,
              }),
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
    if (this.totalCount === 0) return '0 of 0 منتج';

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalCount);
    return `${start} – ${end} منتج  من ${this.totalCount} `;
  }
}
