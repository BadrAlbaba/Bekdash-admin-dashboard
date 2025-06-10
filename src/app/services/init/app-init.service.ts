import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  private initialized = false;

  constructor(private auth: AuthService) {}

  init(): () => Promise<void> {
    return () =>
      new Promise((resolve) => {
        this.auth.bootstrapAuth().subscribe({
          complete: () => {
            this.initialized = true;
            resolve();
          },
        });
      });
  }

  isReady(): boolean {
    return this.initialized;
  }
}
