import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly GRAPHQL_API = environment.GRAPHQL_API;
  constructor() {}

  uploadImage(file: File): Observable<string> {
    const operations = JSON.stringify({
      query: `
      mutation ($file: Upload!) {
        uploadProductImage(file: $file)
      }
    `,
      variables: { file: null },
    });

    const mapData = JSON.stringify({ '0': ['variables.file'] });

    const formData = new FormData();
    formData.append('operations', operations);
    formData.append('map', mapData);
    formData.append('0', file, file.name);

    return this.http
      .post<any>(this.GRAPHQL_API, formData, {
        headers: {
          'x-apollo-operation-name': 'UploadProductImage',
        },
      })
      .pipe(
        map((res) => {
          if (res.errors) throw new Error(res.errors[0].message);
          return res.data.uploadProductImage;
        }),
        catchError((err) => {
          throw err;
        })
      );
  }
}
