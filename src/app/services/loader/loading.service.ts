import { Injectable, signal, computed } from '@angular/core';
import { AppInitService } from '../init/app-init.service';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loading = signal(true);
  isLoading = computed(() => this.loading());

  constructor(private appInit: AppInitService) {
    setTimeout(() => {
      this.loading.set(false); // fallback in case init fails silently
    }, 3000);
  }

  stop() {
    this.loading.set(false);
  }
}
