import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { LoginResponse } from '../../models/auth.models';
import { UserRole, UserStateService } from './user-state.service';
import { AuthSyncService } from './auth-sync.service';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../toast/toast.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly GRAPHQL_API = environment.GRAPHQL_API;
  private accessToken: string | null = null;

  constructor(
    private http: HttpClient,
    private userState: UserStateService,
    private authSync: AuthSyncService,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('accessToken');
      if (stored) {
        this.accessToken = stored;
      }

      window.addEventListener('storage', (event) => {
        if (event.key === 'accessToken' && event.newValue === null) {
          console.warn('[AuthService] Detected logout from another tab');
          this.logout();
        }
      });
    }
  }

  login(email: string, password: string): Observable<any> {
    const query = `
    mutation Login($email: String!, $password: String!, $platform: String!) {
      login(email: $email, password: $password, platform: $platform) {
        accessToken
      }
    }
  `;

    const variables = {
      email,
      password,
      platform: 'web',
    };

    return this.http
      .post<LoginResponse>(
        this.GRAPHQL_API,
        { query, variables },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          if (res.errors) {
            throw new Error(res.errors[0].message);
          }

          const token = res.data?.login?.accessToken;
          if (token) {
            this.setAccessToken(token);
          } else {
            throw new Error('Login failed: No access token received.');
          }
        }),
        switchMap(() => this.getMe()),
        tap((user) => {
          if (user.role !== 'USER' && user.role !== 'ADMIN') {
            this.toastService.show(
              'Access denied: Invalid user role.',
              'error'
            );
          }
          this.userState.setUser({
            id: user.id,
            name: user.name,
            role: user.role as UserRole,
          });
          this.authSync.broadcastLogin({
            id: user.id,
            name: user.name,
            role: user.role as UserRole,
          });
        }),
        catchError((err) => {
          //TODO handle specific error cases (Tosaster maybe?))
          this.accessToken = null;
          console.error('Login error:', err.message);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    this.accessToken = null;

    // Clear localStorage + BehaviorSubjects
    this.userState.clearUser();

    // Notify other tabs to log out as well
    this.authSync.broadcastLogout();

    // Remove token from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
    }

    // Optional: also clear cookies server-side
    const query = `
    mutation {
      logout
    }
  `;
    this.http
      .post(this.GRAPHQL_API, { query }, { withCredentials: true })
      .subscribe();
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', token);
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;

    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('accessToken');
      if (stored) {
        this.accessToken = stored;
        return stored;
      }
    }

    return null;
  }

  isLoggedIn(): boolean {
    if (this.accessToken) return true;

    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('accessToken');
      if (stored) {
        this.accessToken = stored;
        return true;
      }
    }

    return false;
  }

  getUserIdFromToken(): string | null {
    const token = this.accessToken;
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  }

  // Fetch user info after login
  getMe(): Observable<{ id: string; name: string; role: string }> {
    const query = `
    query Me {
      me {
        id
        name
        role
      }
    }
    `;

    return this.http.post<any>(this.GRAPHQL_API, { query }).pipe(
      map((res) => {
        if (!res.data?.me) throw new Error('Failed to fetch user info.');
        return res.data.me;
      }),
      tap((user) => {
        this.userState.setUser(user);
      }),
      catchError((err) => {
        console.error('getMe() error:', err.message);
        return throwError(() => err);
      })
    );
  }

  // Auto-refresh token using refresh_token cookie
  refreshAccessToken(): Observable<string | null> {
    {
      const query = `
    mutation Refresh {
      refreshToken {
        accessToken
      }
    }
  `;

      return this.http
        .post<{ data: { refreshToken: { accessToken: string } | null } }>(
          this.GRAPHQL_API,
          { query },
          { withCredentials: true }
        )
        .pipe(
          map((res) => {
            const token = res.data?.refreshToken?.accessToken;
            if (!token) {
              return null;
            }

            this.setAccessToken(token);
            return token;
          }),
          catchError((err) => {
            console.error('Refresh failed', err);
            this.logout();
            return throwError(() => err);
          })
        );
    }
  }
}
