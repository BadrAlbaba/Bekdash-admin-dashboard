import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER' | null;

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private idSubject = new BehaviorSubject<string | null>(null);
  private nameSubject = new BehaviorSubject<string | null>(null);
  private roleSubject = new BehaviorSubject<UserRole>(null);
  isBrowser: any;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const id = localStorage.getItem('userId');
      const name = localStorage.getItem('userName');
      const role = localStorage.getItem('userRole') as UserRole;

      if (id && name && role) {
        this.setUser({ id, name, role });
      }
    }
  }

  // SETTERS
  setUser(user: { id: string; name: string; role: UserRole }) {
    this.idSubject.next(user.id);
    this.nameSubject.next(user.name);
    this.roleSubject.next(user.role);

    if (this.isBrowser) {
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userRole', user.role!);
    }
  }

  clearUser() {
    this.idSubject.next(null);
    this.nameSubject.next(null);
    this.roleSubject.next(null);

    if (this.isBrowser) {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
    }
  }

  // OBSERVABLES
  getId$() {
    return this.idSubject.asObservable();
  }

  getName$() {
    return this.nameSubject.asObservable();
  }

  getRole$() {
    return this.roleSubject.asObservable();
  }

  // SYNC VALUES
  getId(): string | null {
    return this.idSubject.getValue();
  }

  getName(): string | null {
    return this.nameSubject.getValue();
  }

  getRole(): UserRole {
    return this.roleSubject.getValue();
  }
}
