import { AuthService } from './services/auth/auth.service';

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return () =>
    new Promise<void>((resolve) => {
      authService.bootstrapAuth().subscribe({
        complete: () => resolve(),
        error: () => resolve(),
      });
    });
}
