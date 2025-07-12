import { Component } from '@angular/core';
import { Route, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ToastComponent } from './components/shared/toast/toast.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    private authService: AuthService,
    private route: Router,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.translate.currentLang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    }
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
  platformId(platformId: any) {
    throw new Error('Method not implemented.');
  }

  title = 'Bekdash';
}
