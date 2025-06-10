import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER' | null;

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private idSubject = new BehaviorSubject<string | null>(null);
  private nameSubject = new BehaviorSubject<string | null>(null);
  private roleSubject = new BehaviorSubject<UserRole>(null);

  // SETTERS
  setUser(user: { id: string; name: string; role: UserRole }) {
    this.idSubject.next(user.id);
    this.nameSubject.next(user.name);
    this.roleSubject.next(user.role);
  }

  clearUser() {
    this.idSubject.next(null);
    this.nameSubject.next(null);
    this.roleSubject.next(null);
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
