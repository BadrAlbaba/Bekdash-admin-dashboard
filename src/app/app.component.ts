import { Component } from '@angular/core';
import { Route, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(private authService: AuthService, private route: Router) {}

  ngOnInit() {
    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.getMe().subscribe({
        next: () => {},
        error: (err) => {
          this.authService.logout();
        },
      });
    }
  }

  title = 'bekdash-admin-dashboard';
}
