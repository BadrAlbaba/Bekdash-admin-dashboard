import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  loading = false;
  data: {
    personalStats: {
      ordersCount: number;
      todayOrdersCount: number;
      totalRevenue: number;
      productCount: number;
      bestSellingProducts: {
        productId: string;
        title: string;
        totalSold: number;
      }[];
      orderStatusCounts: {
        status: string;
        count: number;
      }[];
    };
    globalStats?: {
      totalOrders: number;
      newOrdersToday: number;
      totalRevenue: number;
      totalCustomers: number;
      totalProducts: number;
      totalSellers: number;
      orderStatusCounts: {
        status: string;
        count: number;
      }[];
    } | null;
  } | null = null;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loading = true;
    this.analyticsService.getAnalytics().subscribe({
      next: (res) => (this.data = res),
      error: (err) => console.error('Analytics load failed', err),
      complete: () => (this.loading = false),
    });
  }
}
