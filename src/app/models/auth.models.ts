import { UserRole } from '../services/auth/user-state.service';

export interface LoginResponse {
  data: {
    login: {
      accessToken: string;
    };
  };
  errors?: { message: string }[];
}

export interface MeResponse {
  me: {
    id: string;
    name: string;
    role: UserRole;
  };
}
