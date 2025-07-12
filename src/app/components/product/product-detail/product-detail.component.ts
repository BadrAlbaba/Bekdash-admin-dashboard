import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product/product.service';
import { ToastService } from '../../../services/toast/toast.service';
import { environment } from '../../../../enviroments/environment';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  imports: [CommonModule, TranslateModule],
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: any = '';
  loading = false;
  private readonly SERVER_URL = environment.SERVER_URL;
  lightboxOpen = false;
  currentImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private toastService: ToastService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.toastService.show('Product ID not found in URL', 'error');
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (prod) => {
        this.product = prod;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.show(
          `Failed to load product: ${err.message}`,
          'error'
        );
        this.loading = false;
      },
    });
  }

  getThumbnailUrl(path: string): string {
    return `${this.SERVER_URL}${path}`;
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/dashboard/products/edit', this.product.id]);
    }
  }

  deleteProduct(): void {
    this.confirmationService
      .confirm(
        this.translate.instant('CONFIRMATION.DELETE_PRODUCT_TITLE'),
        this.translate.instant('CONFIRMATION.DELETE_PRODUCT_MESSAGE', {
          title: this.product.title,
        })
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.productService.deleteProduct(this.product.id).subscribe({
          next: () => {
            this.toastService.show(
              this.translate.instant('TOAST.PRODUCT_DELETED'),
              'success'
            );
            this.router.navigate(['/dashboard/products']);
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

  toggleActive(): void {
    if (!this.product) return;
    const newStatus = !this.product.active;

    this.productService
      .updateProduct(this.product.id, { active: newStatus })
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
          this.loadProduct(this.product.id);
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

  openLightbox(index: number): void {
    this.currentImageIndex = index;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', this.handleKeyDown);
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.product.images.length) %
      this.product.images.length;
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.product.images.length;
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.lightboxOpen) return;

    switch (event.key) {
      case 'ArrowLeft':
        this.prevImage(event);
        break;
      case 'ArrowRight':
        this.nextImage(event);
        break;
      case 'Escape':
        this.closeLightbox();
        break;
    }
  };

  viewOrders(): void {
    // Navigate to a route or open modal — adapt as needed
    this.router.navigate(['/admin/orders'], {
      queryParams: { productId: this.product.id },
    });
  }

  onBack(): void {
    this.router.navigate(['/dashboard/products']);
  }
}
