import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly GRAPHQL_API = environment.GRAPHQL_API;

  constructor(private http: HttpClient) {}

  addProduct(productData: any): Observable<any> {
    const query = `
      mutation ($input: ProductCreateInput!) {
        addProduct(input: $input) {
          id
          title
        }
      }
    `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { input: productData },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.addProduct;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  updateProduct(productId: string, productData: any): Observable<any> {
    const query = `
    mutation ($id: ID!, $input: ProductUpdateInput!) {
      updateProduct(id: $id, input: $input) {
        id
        title
      }
    }
  `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { id: productId, input: productData },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.updateProduct;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  addProductImage(productId: string, url: string): Observable<any> {
    const query = `
      mutation ($productId: ID!, $input: ProductImageInput!) {
        addProductImage(productId: $productId, input: $input) {
          id
          url
        }
      }
    `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { productId, input: { url } },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.addProductImage;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  removeProductImage(imageId: string): Observable<boolean> {
    const query = `
    mutation ($id: ID!) {
      removeProductImage(id: $id)
    }
  `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { id: imageId },
      })
      .pipe(
        map((res) => res.data.removeProductImage),
        catchError((err) => {
          console.error('Remove image failed', err);
          throw err;
        })
      );
  }

  updateProductThumbnail(
    productId: string,
    thumbnailUrl: string
  ): Observable<any> {
    const query = `
    mutation ($productId: ID!, $thumbnailUrl: String!) {
      updateProductThumbnail(productId: $productId, thumbnailUrl: $thumbnailUrl) {
        id
        title
        thumbnail
      }
    }
  `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { productId, thumbnailUrl },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.updateProductThumbnail;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  listProducts(
    filters: any,
    sortBy: string,
    sortOrder: string,
    skip: number,
    take: number
  ): Observable<any> {
    const query = `
      query($filter: ProductFilterInput, $sortBy: ProductSortField, $order: SortOrder, $skip: Int, $take: Int) {
        listProducts(filter: $filter, sortBy: $sortBy, order: $order, skip: $skip, take: $take) {
          items {
            id
            title
            price
            stock
            averageRating
            active
            thumbnail
            seller {
              user {
                name
              }
            }
            categories {
              id
              name
            }
            reviewCount
            orderCount
          }
          totalCount
        }
      }
    `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: {
          filter: filters,
          sortBy,
          order: sortOrder,
          skip,
          take,
        },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.listProducts;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  deleteProduct(productId: string): Observable<boolean> {
    const query = `
    mutation ($id: ID!) {
      deleteProduct(id: $id)
    }
  `;

    return this.http
      .post<any>(this.GRAPHQL_API, {
        query,
        variables: { id: productId },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.deleteProduct;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }
}
