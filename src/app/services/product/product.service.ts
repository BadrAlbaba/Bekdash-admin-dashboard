import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { ProductImage } from '../../models/product.models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly GRAPHQL_API = environment.GRAPHQL_API;

  constructor(private http: HttpClient) {}

  addProduct(productData: any): Observable<any> {
    console.log('Sending product data to API:', productData);

    const query = `
      mutation ($input: ProductInput!) {
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
    mutation ($id: ID!, $input: ProductInput!) {
      updateProduct(id: $id, input: $input) {
        id
        title
        thumbnail
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
}
