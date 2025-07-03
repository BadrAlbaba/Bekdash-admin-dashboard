export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  children?: Category[];
  level: string;
  parentId?: string;
}
