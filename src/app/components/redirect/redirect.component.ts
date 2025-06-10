import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { LoaderComponent } from '../shared/loader/loader.component';
import { UserStateService } from '../../services/auth/user-state.service';

@Component({
  selector: 'app-redirect',
  standalone: true,
  templateUrl: './redirect.component.html',
  imports: [LoaderComponent],
})
export class RedirectComponent {
  constructor(
    private auth: AuthService,
    private router: Router,
    private userState: UserStateService
  ) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const role = this.userState.getRole();
    if (role === 'ADMIN' || role === 'SELLER') {
      this.router.navigate(['/dashboard/products']);
    }
  }
}
