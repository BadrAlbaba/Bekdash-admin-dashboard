export interface AddCategoryResponse {
  addCategory: {
    id: string;
    name: string;
    level: number;
    parentId?: string;
  };
}
