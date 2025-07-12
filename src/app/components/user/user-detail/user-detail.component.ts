import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../../services/confirmation/confirmation.service';
import { ToastService } from '../../../services/toast/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-detail',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  user: any;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.error = 'Invalid user ID';
      return;
    }

    this.userService.getUser(userId).subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user details';
        this.loading = false;
        console.error(err);
      },
    });
  }

  getOrderTotal(order: any): number {
    return order.items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);
  }

  onBack(): void {
    this.router.navigate(['/dashboard/users']);
  }

  onSellerProducts(): void {
    if (
      this.user &&
      (this.user.role === 'SELLER' || this.user.role === 'ADMIN')
    ) {
      this.router.navigate(['/dashboard/products'], {
        queryParams: { sellerId: this.user.id },
      });
    } else {
      this.error = 'User is not a seller';
    }
  }
  onEdit(): void {
    if (this.user) {
      this.router.navigate(['/dashboard/users/edit', this.user.id]);
    } else {
      this.error = 'User not found';
    }
  }
  onDelete(): void {
    if (this.user) {
      this.confirmationService
        .confirm(
          'Delete Category',
          `Are you sure you want to delete "${this.user.name}" and its subcategories?`
        )
        .then((confirmed) => {
          if (!confirmed) return;
          this.userService.deleteUser(this.user.id).subscribe({
            next: () => {
              this.toastService.show('User deleted successfully', 'success');
            },
            error: (err) => {
              this.toastService.show(
                'Failed to delete user: ' + err.message,
                'error'
              );
            },
          });
        });
    } else {
      this.error = 'User not found';
    }
  }
}
