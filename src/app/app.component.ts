import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  constructor(private authService: AuthService) {}

  ngOnInit() {
    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.getMe().subscribe({
        next: () => {
          console.log('User session restored.');
        },
        error: (err) => {
          console.warn('Failed to fetch user info', err.message);
          this.authService.logout();
        },
      });
    }
  }

  title = 'bekdash-admin-dashboard';
}
