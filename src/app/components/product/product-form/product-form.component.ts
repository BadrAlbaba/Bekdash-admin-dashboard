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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    QuillModule,
    TranslateModule,
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
  lastValidCategories: any[] = [];

  thumbnailPreviewUrl: string | null = null;
  imagePreviewUrls: string[] = [];

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
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
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.lastValidCategories = this.productForm.get('categoryIds')?.value || [];
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
        this.updateCategoryDisabledState();
        this.loading = false;
      },
      error: (err) => {
        this.toastService.show(
          this.translate.instant('TOAST.LOAD_FAILED') + ` ${err.message}`,
          'error'
        );
        this.loading = false;
      },
    });
  }

  get categoryLimitReached(): boolean {
    return this.productForm?.get('categoryIds')?.value?.length >= 3;
  }

  updateCategoryDisabledState(): void {
    const selected = this.productForm.get('categoryIds')?.value || [];

    this.categories = this.categories.map((cat) => ({
      ...cat,
      disabled: selected.length >= 3 && !selected.includes(cat.id),
    }));
  }

  onPriceInput(event: any) {
    const value = this.convertArabicToEnglish(event.target.value);
    this.productForm.get('price')?.setValue(value, { emitEvent: false });
  }

  onStockInput(event: any) {
    const value = this.convertArabicToEnglish(event.target.value);
    this.productForm.get('stock')?.setValue(value, { emitEvent: false });
  }

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files[0]) {
      this.pendingThumbnailFile = files[0];
      this.thumbnailPreviewUrl = URL.createObjectURL(files[0]);
      this.toastService.show(
        this.translate.instant('TOAST.THUMBNAIL_QUEUED'),
        'info'
      );
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
        `${files.length} ${this.translate.instant('TOAST.IMAGES_QUEUED')}`,
        'info'
      );
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.toastService.show(
        this.translate.instant('TOAST.FILL_REQUIRED'),
        'error'
      );
      return;
    }

    const desc = this.productForm.value.description;
    if (!desc || desc.trim() === '' || desc === '<p><br></p>') {
      this.toastService.show(
        this.translate.instant('TOAST.EMPTY_DESCRIPTION'),
        'error'
      );
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
        this.toastService.show(
          this.translate.instant('TOAST.PRODUCT_UPDATED'),
          'success'
        );
        this.uploadPendingImages();
        this.uploadPendingThumbnail();
        this.loading = false;
        this.router.navigate(['/dashboard/products']);
      },
      error: (err) => {
        this.toastService.show(
          this.translate.instant('TOAST.UPDATE_FAILED', { error: err.message }),
          'error'
        );
        this.loading = false;
      },
    });
  }

  private createNewProduct(productData: any): void {
    this.productService.addProduct(productData).subscribe({
      next: (product) => {
        this.productId = product.id;
        this.toastService.show(
          this.translate.instant('TOAST.PRODUCT_CREATED'),
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
          this.translate.instant('TOAST.CREATE_FAILED', { error: err.message }),
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
                this.toastService.show(
                  this.translate.instant('TOAST.THUMBNAIL_SUCCESS'),
                  'success'
                );
              },
              error: (err) => {
                this.toastService.show(
                  this.translate.instant('TOAST.THUMBNAIL_UPDATE_FAILED', {
                    error: err.message,
                  }),
                  'error'
                );
              },
            });
        },
        error: () =>
          this.toastService.show(
            this.translate.instant('TOAST.THUMBNAIL_UPLOAD_FAILED'),
            'error'
          ),
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
              this.toastService.show(
                this.translate.instant('TOAST.IMAGE_UPLOADED'),
                'success'
              );
            },
            error: (err) => {
              this.toastService.show(
                this.translate.instant('TOAST.IMAGE_ADD_FAILED', {
                  error: err.message,
                }),
                'error'
              );
            },
          });
        },
        error: (err) => {
          this.toastService.show(
            this.translate.instant('TOAST.IMAGE_UPLOAD_FAILED', {
              error: err.message,
            }),
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
      this.toastService.show(
        this.translate.instant('TOAST.THUMBNAIL_REMOVED'),
        'info'
      );
    }
  }

  removeImagePreview(index: number): void {
    URL.revokeObjectURL(this.imagePreviewUrls[index]);
    this.imagePreviewUrls.splice(index, 1);
    this.pendingImageFiles.splice(index, 1);
    this.toastService.show(
      this.translate.instant('TOAST.IMAGE_QUEUE_REMOVED'),
      'info'
    );
  }

  onRemoveImage(imageId: string, index: number): void {
    this.productService.removeProductImage(imageId).subscribe({
      next: () => {
        this.productImages.splice(index, 1);
        this.toastService.show(
          this.translate.instant('TOAST.IMAGE_REMOVED'),
          'success'
        );
      },
      error: () =>
        this.toastService.show(
          this.translate.instant('TOAST.IMAGE_REMOVE_FAILED'),
          'error'
        ),
    });
  }

  removeExistingThumbnail(): void {
    this.productService.updateProductThumbnail(this.productId, '').subscribe({
      next: () => {
        this.productThumbnail = '';
        this.toastService.show(
          this.translate.instant('TOAST.THUMBNAIL_REMOVED'),
          'success'
        );
      },
      error: (err) => {
        this.toastService.show(
          this.translate.instant('TOAST.THUMBNAIL_UPDATE_FAILED', {
            error: err.message,
          }),
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
          this.translate.instant('CONFIRMATION.CANCEL_TITLE'),
          this.translate.instant('CONFIRMATION.CANCEL_MESSAGE')
        )
        .then((confirmed) => {
          if (!confirmed) return;
          window.history.back();
        });
    } else {
      window.history.back();
    }
  }

  onEditorCreated(quill: any) {
    const editorElem = quill.root as HTMLElement;

    // Also force the container if needed
    const container = editorElem.closest('.ql-container') as HTMLElement;
    if (container) {
      container.style.direction = 'ltr';
      container.style.textAlign = 'left';
    }

    // Apply to toolbar if necessary
    const toolbar = container?.previousElementSibling as HTMLElement;
    if (toolbar?.classList.contains('ql-toolbar')) {
      toolbar.style.direction = 'ltr';
      toolbar.style.textAlign = 'left';
    }
  }

  convertArabicToEnglish(input: string): string {
    const arabicIndicMap: { [key: string]: string } = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
    };

    return input.replace(/[٠-٩]/g, (d) => arabicIndicMap[d]);
  }
}
