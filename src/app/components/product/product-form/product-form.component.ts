import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product/product.service';
import { CategoryService } from '../../../services/category/category.service';
import { ToastService } from '../../../services/toast/toast.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { UploadService } from '../../../services/upload/upload.service';
import { environment } from '../../../../enviroments/environment';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    QuillModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit, OnDestroy {
  loading = false;

  productForm!: FormGroup;
  categories: any[] = [];
  productId: string = '';
  productImages: any[] = [];
  pendingImageFiles: File[] = [];
  pendingThumbnailFile: File | null = null;
  productThumbnail: string = '';

  thumbnailPreviewUrl: string | null = null;
  imagePreviewUrls: string[] = [];

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      [{ direction: 'rtl' }],
      ['blockquote'],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  };

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private uploadService: UploadService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadCategories();

    if (this.productId) {
      this.loadProduct();
    }
  }

  ngOnDestroy(): void {
    if (this.thumbnailPreviewUrl) URL.revokeObjectURL(this.thumbnailPreviewUrl);
    this.imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  initForm(): void {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      active: [false],
      categoryIds: [[], Validators.required],
    });
  }

  loadCategories(): void {
    this.categoryService.listCategoriesByLevel('THIRD').subscribe({
      next: (res) => (this.categories = res),
      error: (err) => console.error(err),
    });
  }

  loadProduct(): void {
    this.loading = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          title: product.title,
          description: product.description,
          price: product.price,
          stock: product.stock,
          active: product.active,
          categoryIds: product.categories.map((c: any) => c.id),
        });
        this.productImages = product.images || [];
        this.productThumbnail = product.thumbnail || '';
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

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files[0]) {
      this.pendingThumbnailFile = files[0];
      this.thumbnailPreviewUrl = URL.createObjectURL(files[0]);
      this.toastService.show(`Thumbnail queued for upload`, 'info');
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      const newFiles = Array.from(files);
      this.pendingImageFiles.push(...newFiles);
      this.imagePreviewUrls.push(
        ...newFiles.map((f) => URL.createObjectURL(f))
      );
      this.toastService.show(
        `${files.length} image(s) queued for upload`,
        'info'
      );
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.toastService.show('Please fill all required fields', 'error');
      return;
    }

    const desc = this.productForm.value.description;
    if (!desc || desc.trim() === '' || desc === '<p><br></p>') {
      this.toastService.show('Description cannot be empty.', 'error');
      return;
    }

    this.loading = true;
    const productData = this.productForm.value;

    if (this.productId) {
      this.updateExistingProduct(productData);
    } else {
      this.createNewProduct(productData);
    }
  }

  private updateExistingProduct(productData: any): void {
    this.productService.updateProduct(this.productId, productData).subscribe({
      next: () => {
        this.toastService.show('Product updated successfully', 'success');
        this.uploadPendingImages();
        this.uploadPendingThumbnail();
        this.loading = false;
        this.router.navigate(['/dashboard/products']);
      },
      error: (err) => {
        this.toastService.show(`Update failed: ${err.message}`, 'error');
        this.loading = false;
      },
    });
  }

  private createNewProduct(productData: any): void {
    this.productService.addProduct(productData).subscribe({
      next: (product) => {
        this.productId = product.id;
        this.toastService.show(
          'Product created. Uploading images...',
          'success'
        );
        this.uploadPendingImages();
        this.uploadPendingThumbnail();
        setTimeout(() => {
          this.loading = false;
          this.router.navigate(['/dashboard/products']);
        }, 1000);
        this.cleanupPreviews();
      },
      error: (err) => {
        this.toastService.show(
          `Product creation failed: ${err.message}`,
          'error'
        );
        this.loading = false;
      },
    });
  }

  private uploadPendingThumbnail(): void {
    if (this.pendingThumbnailFile) {
      this.uploadService.uploadImage(this.pendingThumbnailFile).subscribe({
        next: (url) => {
          this.productService
            .updateProductThumbnail(this.productId, url)
            .subscribe({
              next: (product) => {
                this.productThumbnail = product.thumbnail;
                this.toastService.show('Thumbnail upload succeeded', 'success');
              },
              error: (err) => {
                this.toastService.show(
                  `Thumbnail update failed: ${err.message}`,
                  'error'
                );
              },
            });
        },
        error: () => this.toastService.show('Thumbnail upload failed', 'error'),
      });
      this.pendingThumbnailFile = null;
    }
  }

  private uploadPendingImages(): void {
    if (!this.pendingImageFiles.length) return;

    this.pendingImageFiles.forEach((file) => {
      this.uploadService.uploadImage(file).subscribe({
        next: (url) => {
          this.productService.addProductImage(this.productId, url).subscribe({
            next: (image) => {
              this.productImages.push(image);
              this.toastService.show('Image uploaded', 'success');
            },
            error: (err) => {
              this.toastService.show(
                `Adding image failed: ${err.message}`,
                'error'
              );
            },
          });
        },
        error: (err) => {
          this.toastService.show(
            `Uploading image failed: ${err.message}`,
            'error'
          );
        },
      });
    });

    this.pendingImageFiles = [];
  }

  removeThumbnailPreview(): void {
    if (this.thumbnailPreviewUrl) {
      URL.revokeObjectURL(this.thumbnailPreviewUrl);
      this.thumbnailPreviewUrl = null;
      this.pendingThumbnailFile = null;
      this.toastService.show('Thumbnail removed', 'info');
    }
  }

  removeImagePreview(index: number): void {
    URL.revokeObjectURL(this.imagePreviewUrls[index]);
    this.imagePreviewUrls.splice(index, 1);
    this.pendingImageFiles.splice(index, 1);
    this.toastService.show('Image removed from queue', 'info');
  }

  onRemoveImage(imageId: string, index: number): void {
    this.productService.removeProductImage(imageId).subscribe({
      next: () => {
        this.productImages.splice(index, 1);
        this.toastService.show('Image removed', 'success');
      },
      error: () => this.toastService.show('Remove failed', 'error'),
    });
  }

  removeExistingThumbnail(): void {
    this.productService.updateProductThumbnail(this.productId, '').subscribe({
      next: () => {
        this.productThumbnail = '';
        this.toastService.show('Thumbnail removed', 'success');
      },
      error: (err) => {
        this.toastService.show(
          `Failed to remove thumbnail: ${err.message}`,
          'error'
        );
      },
    });
  }

  getImageUrl(path: string): string {
    return `${environment.SERVER_URL}${path}`;
  }

  cleanupPreviews(): void {
    this.imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    if (this.thumbnailPreviewUrl) URL.revokeObjectURL(this.thumbnailPreviewUrl);
    this.imagePreviewUrls = [];
    this.thumbnailPreviewUrl = null;
  }

  onCancel(): void {
    if (this.productForm.dirty) {
      this.confirmationService
        .confirm(
          'Cancel Changes',
          'You have unsaved changes. Are you sure you want to cancel?'
        )
        .then((confirmed) => {
          if (!confirmed) return;
          this.router.navigate(['/dashboard/products']);
        });
    } else {
      this.router.navigate(['/dashboard/products']);
    }
  }
}
