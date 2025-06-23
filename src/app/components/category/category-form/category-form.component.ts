import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category/category.service';
import { UploadService } from '../../../services/upload/upload.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { environment } from '../../../../enviroments/environment';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit {
  categoryForm!: FormGroup;
  parentCategories: any[] = [];
  levels = ['FIRST', 'SECOND', 'THIRD'];
  thumbnailFile: File | null = null;
  thumbnailPreviewUrl: string | null = null;
  existingImageUrl: string | null = null;
  categoryId: string | null = null;
  imageRemoved = false;

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
    private categoryService: CategoryService,
    private uploadService: UploadService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      level: ['FIRST', Validators.required],
      parentId: [''],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    this.categoryId = idParam && idParam !== '' ? idParam : null;

    if (this.categoryId) {
      this.loadCategory();
    }

    this.categoryForm.get('level')?.valueChanges.subscribe((level) => {
      this.handleLevelChange(level);
    });
  }

  loadCategory(): void {
    this.categoryService.getCategory(this.categoryId!).subscribe({
      next: (cat) => {
        this.categoryForm.patchValue({
          name: cat.name,
          description: cat.description,
          level: cat.level,
          parentId: cat.parent?.id || '',
        });
        this.existingImageUrl = cat.image || null;
        this.handleLevelChange(cat.level, cat.parent?.id);
      },
      error: (err) => {
        this.toastService.show(
          `Failed to load category: ${err.message}`,
          'error'
        );
      },
    });
  }

  handleLevelChange(level: string, parentId: string = ''): void {
    const parentCtrl = this.categoryForm.get('parentId');
    if (level === 'FIRST') {
      parentCtrl?.clearValidators();
      parentCtrl?.reset();
      this.parentCategories = [];
    } else {
      parentCtrl?.setValidators([Validators.required]);
      const parentLevel = level === 'SECOND' ? 'FIRST' : 'SECOND';
      this.categoryService.listCategoriesByLevel(parentLevel).subscribe({
        next: (categories) => {
          this.parentCategories = categories;
          if (parentId) parentCtrl?.setValue(parentId);
        },
        error: (err) => console.error('Error loading parent categories', err),
      });
    }
    parentCtrl?.updateValueAndValidity();
  }

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.thumbnailFile = file;
      this.thumbnailPreviewUrl = URL.createObjectURL(file);
    }
  }

  removeThumbnail(): void {
    if (this.thumbnailPreviewUrl) {
      URL.revokeObjectURL(this.thumbnailPreviewUrl);
      this.thumbnailPreviewUrl = null;
      this.thumbnailFile = null;
    }
  }

  removeExistingImage(): void {
    this.existingImageUrl = null;
    this.imageRemoved = true;
    this.toastService.show('Image removed', 'info');
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    const { name, level, parentId, description } = this.categoryForm.value;

    const saveCategory = (imageUrl: string | undefined = undefined) => {
      const { name, level, parentId, description } = this.categoryForm.value;
      const cleanedParentId = level === 'FIRST' ? null : parentId || null;

      const updateData: any = {
        name,
        level,
        description,
        image: this.imageRemoved
          ? ''
          : imageUrl || this.existingImageUrl || undefined,
      };

      if (cleanedParentId) {
        updateData.parentId = cleanedParentId;
      }

      if (this.categoryId) {
        this.categoryService
          .updateCategory(this.categoryId, updateData)
          .subscribe({
            next: () => {
              this.toastService.show(
                'Category updated successfully!',
                'success'
              );
              this.router.navigate(['dashboard/categories']);
            },
            error: (err) => {
              this.toastService.show(`Update failed: ${err.message}`, 'error');
            },
          });
      } else {
        this.categoryService
          .addCategory(name, description, level, cleanedParentId, imageUrl)
          .subscribe({
            next: () => {
              this.toastService.show(
                'Category created successfully!',
                'success'
              );
              this.router.navigate(['dashboard/categories']);
            },
            error: (err) => {
              this.toastService.show(
                `Creation failed: ${err.message}`,
                'error'
              );
            },
          });
      }
    };

    if (this.thumbnailFile) {
      this.uploadService.uploadImage(this.thumbnailFile).subscribe({
        next: (url) => {
          saveCategory(url);
        },
        error: () => {
          this.toastService.show('Image upload failed', 'error');
        },
      });
    } else {
      saveCategory();
    }
  }

  getImageUrl(path: string): string {
    return `${environment.SERVER_URL}${path}`;
  }

  onCancel(): void {
    if (this.categoryForm.dirty) {
      this.confirmationService
        .confirm(
          'Cancel Changes',
          'You have unsaved changes. Are you sure you want to cancel?'
        )
        .then((confirmed) => {
          if (!confirmed) return;
          this.router.navigate(['/dashboard/categories']);
        });
    } else {
      this.router.navigate(['/dashboard/categories']);
    }
  }
}
