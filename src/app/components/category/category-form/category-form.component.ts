import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CategoryService } from '../../../services/category/category.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit {
  categoryForm!: FormGroup;
  parentCategories: any[] = [];
  levels = ['FIRST', 'SECOND', 'THIRD'];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      level: ['FIRST', Validators.required],
      parentId: [''],
    });

    this.categoryForm.get('level')?.valueChanges.subscribe((level) => {
      const parentCtrl = this.categoryForm.get('parentId');

      if (level === 'FIRST') {
        parentCtrl?.clearValidators();
        parentCtrl?.reset();
        this.parentCategories = [];
      } else {
        // Set validator for parentId
        parentCtrl?.setValidators([Validators.required]);

        // Determine parent level: if SECOND → parent is FIRST, if THIRD → parent is SECOND
        const parentLevel = level === 'SECOND' ? 'FIRST' : 'SECOND';

        this.categoryService.listCategoriesByLevel(parentLevel).subscribe({
          next: (categories) => (this.parentCategories = categories),
          error: (err) => console.error('Error loading parent categories', err),
        });
      }

      parentCtrl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    const { name, level, parentId } = this.categoryForm.value;

    this.categoryService.addCategory(name, level, parentId).subscribe({
      next: () => {
        this.categoryForm.reset({ level: 'FIRST' });
        this.toastService.show('Category created successfully!', 'success');
        this.router.navigate(['dashboard/categories']);
      },
      error: (err) => {
        this.toastService.show(
          'Failed to create category: ' + err.message,
          'error'
        );
      },
    });
  }
}
