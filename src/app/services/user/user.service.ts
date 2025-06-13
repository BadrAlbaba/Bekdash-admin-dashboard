import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly GRAPHQL_API = environment.GRAPHQL_API;
  constructor() {}

  registerUser(input: any) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      mutation($input: RegisterInput!) {
        registerUser(input: $input) {
          id
          name
          email
        }
      }
    `,
        variables: { input },
      })
      .pipe(
        map((res) => {
          if (res.errors?.length) {
            const userFriendly = this.mapGraphQLError(res.errors[0].message);
            throw new Error(userFriendly);
          }

          if (!res.data?.registerUser) {
            throw new Error('Something went wrong. Please try again.');
          }

          return res.data.registerUser;
        })
      );
  }

  listUsers(
    role?: string,
    sortBy = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC'
  ) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      query ($role: UserRole, $sortBy: String, $order: SortOrder) {
        listUsers(role: $role, sortBy: $sortBy, order: $order) {
          id
          name
          email
          phone
          role
          createdAt
        }
      }
    `,
        variables: { role, sortBy, order },
      })
      .pipe(map((res) => res.data.listUsers));
  }

  deleteUser(userId: string) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      mutation ($id: ID!) {
        deleteUser(id: $id)
      }
    `,
        variables: { id: userId },
      })
      .pipe(
        map((res) => {
          if (res.errors?.length) {
            // 👇 Throw the first GraphQL error so the component can catch it
            throw new Error(res.errors[0].message);
          }
          return res.data.deleteUser;
        })
      );
  }

  mapGraphQLError(error: string): string {
    const normalized = error.replace(/\s+/g, ' ').toLowerCase();

    if (normalized.includes('unique constraint failed')) {
      if (normalized.includes('email')) {
        return 'A user with this email already exists.';
      }

      if (normalized.includes('phone')) {
        return 'A user with this phone number already exists.';
      }

      if (normalized.includes('name')) {
        return 'A user with this name already exists.';
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }

  getUser(id: string) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      query ($id: ID!) {
        getUser(id: $id) {
          id
          name
          email
          phone
          role
          createdAt
          address {
            street
            city
            country
          }
        }
      }
    `,
        variables: { id },
      })
      .pipe(map((res) => res.data.getUser));
  }

  updateUser(id: string, input: any) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      mutation ($id: ID!, $input: UpdateUserInput!) {
        updateUser(id: $id, input: $input) {
          id
          name
          email
        }
      }
    `,
        variables: { id, input },
      })
      .pipe(map((res) => res.data.updateUser));
  }
}
