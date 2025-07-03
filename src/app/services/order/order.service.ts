import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly GRAPHQL_API = environment.GRAPHQL_API;

  constructor(private http: HttpClient) {}

  listOrders(
    viewMode: 'ORDER' | 'ITEM',
    statuses: string[] | null,
    customerId: string | null,
    sellerId: string | null,
    search: string | null,
    skip = 0,
    take = 10,
    productIds: string[] | null = null,
    sellerIds: string[] | null = null,
    startDate: string | null = null,
    endDate: string | null = null,
    orderId: string | null = null
  ) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      query ListOrders(
        $viewMode: ViewMode!
        $statuses: [OrderStatus!]
        $customerId: ID
        $sellerId: ID
        $search: String
        $skip: Int
        $take: Int
        $productIds: [ID!]
        $sellerIds: [ID!]
        $startDate: String
        $endDate: String
        $orderId: ID
      ) {
        listOrders(
          viewMode: $viewMode
          statuses: $statuses
          customerId: $customerId
          sellerId: $sellerId
          search: $search
          skip: $skip
          take: $take
          productIds: $productIds
          sellerIds: $sellerIds
          startDate: $startDate
          endDate: $endDate
          orderId: $orderId
        ) {
          ... on PagedOrders {
            items {
              id
              createdAt
              customer { user { name } }
              items {
                price
                quantity
                status
                product {
                  title
                }
              }
              shippingStreet
              shippingCity
              shippingCountry
            }
            totalCount
          }
          ... on PagedOrderItems {
            items {
              id
              quantity
              price
              status
              product { title seller { user { name } }}
              order {
                id
                createdAt
                customer { user { name } }
                shippingStreet
                shippingCity
                shippingCountry
              }
            }
            totalCount
          }
        }
      }
    `,
        variables: {
          viewMode,
          statuses,
          customerId,
          sellerId,
          search,
          skip,
          take,
          productIds,
          sellerIds,
          startDate,
          endDate,
          orderId,
        },
      })
      .pipe(map((res) => res.data.listOrders));
  }

  listMySales(skip = 0, take = 10) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
      query ListMySales($skip: Int, $take: Int) {
        listMySales(skip: $skip, take: $take) {
          items {
            id
            createdAt
            customer { user { name } }
            shippingStreet
            shippingCity
            shippingCountry
            sellerTotal
            items { price quantity status }
          }
          totalCount
        }
      }
    `,
        variables: { skip, take },
      })
      .pipe(map((res) => res.data.listMySales));
  }

  listAvailableProductsForItemsView(sellerId: string | null = null) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
        query ListAvailableProductsForItemsView($sellerId: ID) {
          listAvailableProductsForItemsView(sellerId: $sellerId) {
            id
            title
          }
        }
      `,
        variables: { sellerId },
      })
      .pipe(map((res) => res.data.listAvailableProductsForItemsView));
  }

  updateOrderItemStatus(itemId: string, status: string) {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
        mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
          updateOrderStatus(id: $id, status: $status) {
            id
            status
          }
        }
      `,
        variables: { id: itemId, status },
      })
      .pipe(map((res) => res.data.updateOrderStatus));
  }

  listSellersForOrders() {
    return this.http
      .post<any>(this.GRAPHQL_API, {
        query: `
        query {
          listSellers {
            user {
              id
              name
            }
          }
        }
      `,
      })
      .pipe(map((res) => res.data.listSellers));
  }
}
