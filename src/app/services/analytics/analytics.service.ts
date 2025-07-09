import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly GRAPHQL_API = environment.GRAPHQL_API;
  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<any> {
    const query = `
    query {
  getAnalytics {
    personalStats {
      ordersCount
      todayOrdersCount
      totalRevenue
      productCount
      bestSellingProducts {
        productId
        title
        totalSold
      }
      orderStatusCounts {
        status
        count
      }
    }
    globalStats {
      totalOrders
      newOrdersToday
      totalRevenue
      totalCustomers
      totalProducts
      totalSellers
      orderStatusCounts {
        status
        count
      }
    }
  }
}

  `;

    return this.http
      .post<{ data?: any; errors?: any }>(this.GRAPHQL_API, { query })
      .pipe(
        map((res) => {
          if (res.errors) {
            throw new Error(res.errors[0]?.message || 'GraphQL error');
          }
          if (!res.data?.getAnalytics) {
            throw new Error('No analytics data returned');
          }
          return res.data.getAnalytics;
        })
      );
  }
}
