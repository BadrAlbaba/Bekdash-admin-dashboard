import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { AddCategoryResponse } from '../../models/category.models';
import { map } from 'rxjs/operators';
import { DocumentNode } from 'graphql';

const AddCategoryGQL: DocumentNode = gql`
  mutation AddCategory($name: String!, $level: Int!, $parentId: String) {
    addCategory(name: $name, level: $level, parentId: $parentId) {
      id
      name
      level
      parentId
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private apollo: Apollo) {}

  addCategory(name: string, level: number, parentId?: string) {
    return this.apollo
      .mutate<AddCategoryResponse>({
        mutation: AddCategoryGQL,
        variables: { name, level, parentId },
      })
      .pipe(map((res) => res.data!.addCategory));
  }
}
