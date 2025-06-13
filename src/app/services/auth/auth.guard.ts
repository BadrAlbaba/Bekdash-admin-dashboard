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
      console.log('AuthGuard: User is logged in and has the required role');
      return true;
    } else if (this.auth.isLoggedIn() && !expectedRoles) {
      console.log('AuthGuard: User is logged in but no specific role required');
      return this.router.parseUrl('/dashboard');
    } else {
      console.log(
        'AuthGuard: User is not logged in or does not have the required role'
      );
      return false;
    }
  }
}
