import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  user: any;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
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
}
