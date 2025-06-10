import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CategoryService } from '../../../services/category/category.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit {
  categoryForm!: FormGroup;
  levels = ['FIRST', 'SECOND', 'THIRD'];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    console.log('CategoryFormComponent initialized');
  }

  ngOnInit(): void {
    console.log('CategoryFormComponent initialized');
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      level: ['FIRST', Validators.required],
      parentId: [''],
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    const input = this.categoryForm.value;

    this.categoryService
      .addCategory(input.name, input.level, input.parentId)
      .subscribe({
        next: (res) => {
          console.log('Category created:', res);
          this.categoryForm.reset({ level: 'FIRST' });
        },
        error: (err) => {
          console.error('Error creating category:', err);
        },
      });
  }
}
