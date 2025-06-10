export interface GraphQLError {
  message: string;
  [key: string]: any;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}
