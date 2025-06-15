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
  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard/products']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
