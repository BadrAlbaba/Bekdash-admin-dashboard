import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  FormArray,
} from '@angular/forms';
import { UploadService } from '../../../services/upload/upload.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  loading = false;

  productForm!: FormGroup;
  categories: any[] = [];
  productId: string = '';
  productImages: any[] = [];
  pendingImageFiles: File[] = [];
  pendingThumbnailFile: File | null = null;
  productThumbnail: string = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private uploadService: UploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      active: [false],
      categoryIds: [[], Validators.required],
    });

    this.categoryService.listCategoriesByLevel('THIRD').subscribe({
      next: (res) => (this.categories = res),
      error: (err) => console.error(err),
    });
  }

  get images(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    console.log(files);
    if (files) {
      this.pendingThumbnailFile = files[0];
      this.toastService.show(
        `${files.length} Thumnail queued for upload`,
        'info'
      );
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      this.pendingImageFiles.push(...Array.from(files));
      this.toastService.show(
        `${files.length} image(s) queued for upload`,
        'info'
      );
    }
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.toastService.show('Please fill all required fields', 'error');
      return;
    }

    this.loading = true; // Start loading spinner

    const productData = this.productForm.value;

    this.productService.addProduct(productData).subscribe({
      next: (product) => {
        this.productId = product.id;
        this.toastService.show(
          'Product created. Uploading images...',
          'success'
        );
        this.uploadPendingImages();
        this.UploadPenidngThumbnail();

        setTimeout(() => {
          this.loading = false; // Stop loading spinner before navigation
          this.router.navigate(['/dashboard/products']);
        }, 1000);

        this.toastService.show(
          'Product created successfully and images added succesfully',
          'success'
        );
      },
      error: (err) => {
        this.loading = false; // Stop loading spinner on error
        this.toastService.show(
          `Product creation failed: ${err.message}`,
          'error'
        );
      },
    });
  }

  UploadPenidngThumbnail() {
    if (this.pendingThumbnailFile) {
      this.uploadService.uploadImage(this.pendingThumbnailFile).subscribe({
        next: (url) => {
          this.productService
            .updateProductThumbnail(this.productId, url)
            .subscribe({
              next: (product) => {
                this.productThumbnail = product.thumbnail;
                this.toastService.show('Thumbnail uplaod succed', 'success');
              },
              error: (err) => {
                this.toastService.show(
                  `Thumbnail upload failed: ${err.message}`,
                  'error'
                );
              },
            });
          this.toastService.show('Thumbnail uploaded', 'success');
        },
        error: () => this.toastService.show('Thumbnail upload failed', 'error'),
      });
    } else {
      this.toastService.show('No thumbnail file selected', 'info');
    }

    this.pendingThumbnailFile = null;
  }

  uploadPendingImages() {
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
                `Uploading images failed: ${err.message}`,
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

  onRemoveImage(imageId: string, index: number) {
    this.productService.removeProductImage(imageId).subscribe({
      next: () => {
        this.productImages.splice(index, 1);
        this.toastService.show('Image removed', 'success');
      },
      error: () => this.toastService.show('Remove failed', 'error'),
    });
  }
}
