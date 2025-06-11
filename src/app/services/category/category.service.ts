import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Category } from '../../models/category.models';
import { environment } from '../../../enviroments/environment';
import { GraphQLResponse } from '../../models/graphql.models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly GRAPHQL_API = environment.GRAPHQL_API;

  addCategory(
    name: string,
    level: string,
    parentId?: string
  ): Observable<Category> {
    const query = `
      mutation AddCategory($input: CategoryInput!) {
        addCategory(input: $input) {
          id
          name
          level
          parent {
            id
          }
        }
      }
    `;

    const variables = {
      input: { name, level, parentId },
    };

    return this.http
      .post<GraphQLResponse<{ addCategory: Category }>>(this.GRAPHQL_API, {
        query,
        variables,
      })
      .pipe(
        map((res) => {
          if (res.errors?.length) {
            const userFriendly = this.mapGraphQLError(res.errors[0].message);
            throw new Error(userFriendly);
          }

          if (!res.data?.addCategory) {
            throw new Error('Something went wrong. Please try again.');
          }

          return res.data.addCategory;
        })
      );
  }

  listCategoriesByLevel(level: string) {
    const query = `
      query ($level: CategoryLevel) {
        listCategories(level: $level) {
          id
          name
        }
      }
    `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { level },
      })
      .pipe(map((res) => res.data.listCategories));
  }

  getCategoryTree() {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
        query {
            listCategories(level: FIRST) {
                id
                name
                children {
                id
                name
                children {
                    id
                    name
                }
                }
            }
            }
      `,
      })
      .pipe(map((res) => res.data.listCategories));
  }

  mapGraphQLError(error: string): string {
    const normalized = error.replace(/\s+/g, ' ').toLowerCase();

    if (
      normalized.includes('unique constraint failed') &&
      normalized.includes('name')
    ) {
      return 'A category with this name already exists.';
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
