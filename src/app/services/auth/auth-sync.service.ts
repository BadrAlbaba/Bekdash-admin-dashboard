import { Injectable } from '@angular/core';
import { UserRole, UserStateService } from './user-state.service';

@Injectable({ providedIn: 'root' })
export class AuthSyncService {
  private channel = new BroadcastChannel('auth');

  constructor(private userState: UserStateService) {
    this.channel.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'LOGIN') {
        this.userState.setUser(payload);
      }

      if (type === 'LOGOUT') {
        this.userState.clearUser();
      }
    };
  }

  broadcastLogin(user: { id: string; name: string; role: UserRole }) {
    this.channel.postMessage({ type: 'LOGIN', payload: user });
  }

  broadcastLogout() {
    this.channel.postMessage({ type: 'LOGOUT' });
  }
}
