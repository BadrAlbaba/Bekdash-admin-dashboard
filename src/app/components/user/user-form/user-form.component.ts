import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../services/user/user.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  roles = ['SELLER', 'CUSTOMER'];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['SELLER', Validators.required],
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        country: ['', Validators.required],
      }),
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.userService.registerUser(this.userForm.value).subscribe({
      next: () => {
        this.toast.show('User registered successfully', 'success');
        this.router.navigate(['/dashboard/users']);
      },
      error: (err) => {
        this.toast.show('Failed to register user: ' + err.message, 'error');
      },
    });
  }

  get addressForm(): FormGroup {
    return this.userForm.get('address') as FormGroup;
  }
}
