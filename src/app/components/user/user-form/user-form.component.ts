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
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode = false;
  userId: string | null = null;
  roles = ['CUSTOMER', 'SELLER', 'ADMIN'];
  showPassword = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private fb: FormBuilder,
    private toast: ToastService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: [''], // only required on create
      role: ['SELLER', Validators.required],
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        country: ['', Validators.required],
      }),
    });

    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId;

    if (this.isEditMode) {
      this.userService.getUser(this.userId!).subscribe({
        next: (user) => this.patchForm(user),
        error: () => this.toast.show('Failed to load user', 'error'),
      });
    }
  }

  patchForm(user: any) {
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: '', // do not pre-fill password
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        country: user.address?.country || '',
      },
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const formValue = this.userForm.value;
    if (this.isEditMode) {
      if (!formValue.password) delete formValue.password;
      this.userService.updateUser(this.userId!, formValue).subscribe({
        next: () => {
          this.toast.show('User updated successfully', 'success');
          this.router.navigate(['/dashboard/users']);
        },
        error: (err) => {
          const msg = this.userService.mapGraphQLError(
            err?.error?.errors?.[0]?.message || ''
          );
          this.toast.show(msg, 'error');
        },
      });
    } else {
      this.userService.registerUser(formValue).subscribe({
        next: () => {
          this.toast.show('User created successfully', 'success');
          this.router.navigate(['/dashboard/users']);
        },
        error: (err) => {
          const msg = this.userService.mapGraphQLError(
            err?.error?.errors?.[0]?.message || ''
          );
          this.toast.show(msg, 'error');
        },
      });
    }
  }

  get addressForm(): FormGroup {
    return this.userForm.get('address') as FormGroup;
  }

  onCancel(): void {
    if (this.userForm.dirty) {
      this.confirmationService
        .confirm(
          'Cancel Changes',
          'You have unsaved changes. Are you sure you want to cancel?'
        )
        .then((confirmed) => {
          if (!confirmed) return;
          window.history.back();
        });
    } else {
      window.history.back();
    }
  }
}
