import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';
import { ToastService } from '../../../services/toast/toast.service';
import { UserStateService } from '../../../services/auth/user-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss', '../../../app.component.scss'],
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  currentUserId: string = '';
  filteredUsers: any[] = [];

  searchTerm = '';
  roleFilter: string = '';
  sortBy: string = 'createdAt';
  order: 'ASC' | 'DESC' = 'DESC';

  constructor(
    private userService: UserService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private toastService: ToastService,
    private userStateService: UserStateService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.currentUserId = this.userStateService.getId() || '';
  }

  loadUsers() {
    this.userService
      .listUsers(this.roleFilter || undefined, this.sortBy, this.order)
      .subscribe({
        next: (data) => {
          this.users = data;
          this.applyFilter();
        },
        error: (err) => console.error('Failed to load users', err),
      });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }

  onSearchChange() {
    this.applyFilter();
  }

  onSort(field: string) {
    if (this.sortBy === field) {
      this.order = this.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.order = 'ASC';
    }
    this.loadUsers();
  }

  onFilterChange(role: string) {
    this.roleFilter = role;
    this.loadUsers();
  }

  viewUser(userId: string) {
    this.router.navigate([`/dashboard/users/${userId}`]);
  }

  editUser(userId: string) {
    this.router.navigate([`/dashboard/users/edit/${userId}`]);
  }

  onDelete(user: any) {
    this.confirmationService
      .confirm(
        this.translate.instant('CONFIRMATION.DELETE_USER_CONFIRM_TITLE'),
        this.translate.instant('CONFIRMATION.DELETE_USER_CONFIRM_MESSAGE', {
          name: user.name,
        })
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.toastService.show(
              this.translate.instant('TOAST.DELETE_USER_SUCCESS'),
              'success'
            );
            this.loadUsers(); // Refresh list
          },
          error: (err) => {
            this.toastService.show(
              this.translate.instant('TOAST.DELETE_USER_ERROR', {
                message: err.message,
              }),
              'error'
            );
          },
        });
      });
  }
}
