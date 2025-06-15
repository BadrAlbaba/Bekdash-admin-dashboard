import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';
import { UserStateService } from './user-state.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private userState: UserStateService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const expectedRoles = route.data['roles'] as string[];
    const role = this.userState.getRole();

    if (
      this.auth.isLoggedIn() &&
      (!expectedRoles || expectedRoles.includes(role!))
    ) {
      return true;
    } else if (this.auth.isLoggedIn() && !expectedRoles) {
      return this.router.parseUrl('/dashboard');
    } else {
      return false;
    }
  }
}
