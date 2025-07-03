import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable, Subject, debounceTime, map } from 'rxjs';
import * as XLSX from 'xlsx';

import { OrderService } from '../../../services/order/order.service';
import { UserStateService } from '../../../services/auth/user-state.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss', '../../../app.component.scss'],
})
export class OrderListComponent implements OnInit {
  /** User & View Settings */
  isAdmin = false;
  isSeller = false;
  listMode: 'ALL' | 'MY' = 'MY';
  private _viewMode: 'ORDER' | 'ITEM' = 'ORDER';
  get viewMode() {
    return this._viewMode;
  }
  set viewMode(mode: 'ORDER' | 'ITEM') {
    this._viewMode = mode;
    this.page = 1;
    this.orders = [];
    this.loadOrders();
  }

  /** UI/Filter State */
  statusFilters: string[] = [];
  statusFilter: string | null = null;
  selectedProductIds: string[] = [];
  searchTerm = '';
  expandedOrderId: string | null = null;
  exportStartDate: string | null = null;
  exportEndDate: string | null = null;
  exportScope: 'CURRENT' | 'ALL' = 'CURRENT';
  selectedSellerIds: string[] = [];
  sellerOptions: any[] = [];
  orderIdFilter: string = '';

  /** Pagination */
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  /** Sorting */
  sortMode = 'CREATED_AT';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  /** Data */
  orders: any[] = [];
  productOptions: any[] = [];
  loading = false;

  /** Constants */
  readonly orderStatuses = [
    { label: 'Placed', value: 'PLACED' },
    { label: 'Canceled', value: 'CANCELED' },
    { label: 'On The Way', value: 'ON_THE_WAY' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Return Requested', value: 'RETURN_REQUESTED' },
    { label: 'Return In Progress', value: 'RETURN_IN_PROGRESS' },
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Refunded', value: 'REFUNDED' },
  ];

  /** Internal Helpers */
  private searchSubject = new Subject<string>();
  @ViewChildren('expandedRow') expandedRows!: QueryList<ElementRef>;

  constructor(
    private orderService: OrderService,
    private userService: UserStateService,
    private toastService: ToastService
  ) {}

  /** Lifecycle */
  ngOnInit(): void {
    this.isAdmin = this.userService.getRole() === 'ADMIN';
    this.isSeller = this.userService.getRole() === 'SELLER';
    if (this.isAdmin) {
      this.listMode = 'ALL';
      this.loadSellerOptions();
    }

    this.loadProductOptions();
    this.loadOrders();

    this.searchSubject.pipe(debounceTime(400)).subscribe((val) => {
      this.searchTerm = val;
      this.page = 1;
      this.loadOrders();
    });
  }

  /** Public Methods */

  loadOrders(): void {
    this.loading = true;

    const skip = (this.page - 1) * this.pageSize;
    const sellerId =
      this.viewMode === 'ITEM' && this.isAdmin && this.listMode === 'ALL'
        ? null
        : this.getSellerIdForRequest();

    const statuses = this.statusFilters.length ? this.statusFilters : null;
    const productIds = this.selectedProductIds.length
      ? this.selectedProductIds
      : null;

    this.orderService;
    this.orderService
      .listOrders(
        this.viewMode,
        statuses,
        null,
        sellerId,
        this.searchTerm,
        skip,
        this.pageSize,
        productIds,
        this.selectedSellerIds.length ? this.selectedSellerIds : null,
        this.exportStartDate,
        this.exportEndDate,
        this.orderIdFilter
      )

      .subscribe({
        next: (res) => {
          this.orders = (res.items || []).filter((item: any) =>
            this.viewMode === 'ORDER' ? item?.items : item?.order
          );
          this.totalCount = res.totalCount;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        },
        error: (err) =>
          this.toastService.show(`Load failed: ${err.message}`, 'error'),
        complete: () => (this.loading = false),
      });
  }

  loadProductOptions(): void {
    const sellerId =
      this.isAdmin && this.listMode === 'MY' ? this.userService.getId() : null;

    this.orderService.listAvailableProductsForItemsView(sellerId).subscribe({
      next: (products) => (this.productOptions = products),
      error: (err) =>
        this.toastService.show(
          `Failed to load products: ${err.message}`,
          'error'
        ),
    });
  }

  loadSellerOptions(): void {
    this.orderService.listSellersForOrders().subscribe({
      next: (sellers) => {
        this.sellerOptions = sellers.map((s: any) => ({
          id: s.user.id,
          name: s.user.name,
        }));
      },
      error: (err) =>
        this.toastService.show(
          `Failed to load sellers: ${err.message}`,
          'error'
        ),
    });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadOrders();
    }
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onOrderIdChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.orderIdFilter = value.trim();
    this.page = 1;
    this.loadOrders();
  }

  setSort(field: string): void {
    this.sortOrder =
      this.sortMode === field && this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.sortMode = field;
    this.loadOrders();
  }

  getSortIcon(field: string): string {
    return this.sortMode === field
      ? this.sortOrder === 'ASC'
        ? '&uarr;'
        : '&darr;'
      : '';
  }

  get showingRange(): string {
    if (!this.totalCount) return '0 of 0 orders';
    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalCount);
    return `${start} – ${end} of ${this.totalCount} orders`;
  }

  toggleExpanded(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;

    setTimeout(() => {
      const row = this.expandedRows?.first;
      if (row) {
        row.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        row.nativeElement.classList.add('highlight-flash');
        setTimeout(
          () => row.nativeElement.classList.remove('highlight-flash'),
          1000
        );
      }
    }, 50);
  }

  allOrderStatuses(): string[] {
    return [
      'PLACED',
      'CANCELED',
      'ON_THE_WAY',
      'DELIVERED',
      'RETURN_REQUESTED',
      'RETURN_IN_PROGRESS',
      'RETURNED',
      'REFUNDED',
    ];
  }

  availableStatuses(current: string): string[] {
    return this.allOrderStatuses().filter((s) => s !== current);
  }

  changeOrderItemStatus(itemId: string, newStatus: string): void {
    this.orderService.updateOrderItemStatus(itemId, newStatus).subscribe({
      next: () => {
        this.toastService.show('Status updated', 'success');
        this.loadOrders(); // refresh table
      },
      error: (err) =>
        this.toastService.show(
          `Failed to update status: ${err.message}`,
          'error'
        ),
    });
  }

  exportCSV(): void {
    this.toastService.show('Preparing export...', 'info');

    const handleExport = (items: any[]) => {
      const rows: string[] = [];
      const formatDate = (timestamp: number) =>
        new Date(+timestamp).toLocaleString();

      if (this.viewMode === 'ORDER') {
        rows.push('Order ID,Customer,Date,Item Count,Total,Shipping,Status');
        items.forEach((order) => {
          rows.push(
            [
              order.id,
              `"${order.customer?.user?.name || ''}"`,
              formatDate(order.createdAt),
              order.items?.length || 0,
              this.getOrderTotal(order),
              `${order.shippingStreet || ''}, ${order.shippingCity || ''}, ${
                order.shippingCountry || ''
              }`,
              `"${this.getStatusProgressSummary(order.items)}"`,
            ].join(',')
          );
        });
      } else {
        rows.push(
          'Order ID,Customer,Date,Product,Quantity,Price,Shipping,Status'
        );
        items.forEach((item) => {
          rows.push(
            [
              item.order?.id,
              `"${item.order?.customer?.user?.name || ''}"`,
              formatDate(item.order?.createdAt),
              `"${item.product?.title || ''}"`,
              item.quantity,
              item.price,
              item.order
                ? `${item.order.shippingStreet || ''}, ${
                    item.order.shippingCity || ''
                  }, ${item.order.shippingCountry || ''}`
                : '',
              item.status,
            ].join(',')
          );
        });
      }

      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };

    if (this.exportScope === 'ALL') {
      this.fetchAllOrdersForExport().subscribe({
        next: (items) => {
          handleExport(items);
          this.toastService.show(
            'CSV export completed successfully',
            'success'
          );
        },
        error: (err) =>
          this.toastService.show(`CSV export failed: ${err.message}`, 'error'),
      });
    } else {
      handleExport(this.orders);
      this.toastService.show('CSV export completed successfully', 'success');
    }
  }

  exportExcel(): void {
    this.toastService.show('Preparing export...', 'info');

    const handleExport = (items: any[]) => {
      const formatDate = (timestamp: number) =>
        new Date(+timestamp).toLocaleString();

      const data =
        this.viewMode === 'ORDER'
          ? items.map((order) => ({
              'Order ID': order.id,
              Customer: order.customer?.user?.name || '',
              Date: formatDate(order.createdAt),
              'Item Count': order.items?.length || 0,
              Total: this.getOrderTotal(order),
              'Shipping Address': `${order.shippingStreet || ''}, ${
                order.shippingCity || ''
              }, ${order.shippingCountry || ''}`,
              Status: this.getStatusProgressSummary(order.items),
            }))
          : items.map((item) => ({
              'Order ID': item.order?.id || '',
              Customer: item.order?.customer?.user?.name || '',
              Date: formatDate(item.order?.createdAt),
              Product: item.product?.title || '',
              Quantity: item.quantity,
              Price: item.price,
              'Shipping Address': item.order
                ? `${item.order.shippingStreet || ''}, ${
                    item.order.shippingCity || ''
                  }, ${item.order.shippingCountry || ''}`
                : '',
              Status: item.status,
            }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      XLSX.writeFile(workbook, `orders-export-${Date.now()}.xlsx`);
    };

    if (this.exportScope === 'ALL') {
      this.fetchAllOrdersForExport().subscribe({
        next: (items) => {
          handleExport(items);
          this.toastService.show(
            'Excel export completed successfully',
            'success'
          );
        },
        error: (err) =>
          this.toastService.show(
            `Excel export failed: ${err.message}`,
            'error'
          ),
      });
    } else {
      handleExport(this.orders);
      this.toastService.show('Excel export completed successfully', 'success');
    }
  }

  printOrders(): void {
    const printContent = document.querySelector('table')?.outerHTML;
    if (!printContent) return;

    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(`
      <html>
        <head>
          <title>Print Orders</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="p-3">
          <h2>Orders Report</h2>
          ${printContent}
        </body>
      </html>
    `);
    win?.document.close();
    setTimeout(() => win?.print(), 300);
  }

  clearFilters(): void {
    this.statusFilters = [];
    this.searchTerm = '';
    this.exportStartDate = null;
    this.exportEndDate = null;
    this.orderIdFilter = '';

    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder*="Search customer"]'
    );
    if (input) input.value = '';

    this.page = 1;
    this.loadOrders();
  }

  /** Display Helpers */

  getOrderTotal(order: any): number {
    return (order.items || []).reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );
  }

  getStatusProgressSummary(items: any[]): string {
    const counts = items.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([status, count]) => `${count} of ${items.length} ${status}`)
      .join(', ');
  }

  getGroupedStatuses(items: any[]): { status: string; lines: string[] }[] {
    const map = new Map<string, string[]>();
    items.forEach((item) => {
      const line = `${item.product?.title || 'Unknown'} × ${item.quantity}`;
      if (!map.has(item.status)) map.set(item.status, []);
      map.get(item.status)!.push(line);
    });
    return Array.from(map.entries()).map(([status, lines]) => ({
      status,
      lines,
    }));
  }

  getStatusTextClass(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'text-primary',
      ON_THE_WAY: 'text-warning',
      DELIVERED: 'text-success',
      RETURN_REQUESTED: 'text-info',
      RETURN_IN_PROGRESS: 'text-info',
      RETURNED: 'text-info',
      CANCELED: 'text-danger',
      REFUNDED: 'text-danger',
    };
    return map[status] || 'text-secondary';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'bg-primary',
      ON_THE_WAY: 'bg-warning',
      DELIVERED: 'bg-success',
      RETURN_REQUESTED: 'bg-info',
      RETURN_IN_PROGRESS: 'bg-info',
      RETURNED: 'bg-info',
      CANCELED: 'bg-danger',
      REFUNDED: 'bg-danger',
    };
    return map[status] || 'bg-secondary';
  }

  /** Private Helpers */

  private fetchAllOrdersForExport(): Observable<any[]> {
    return this.orderService
      .listOrders(
        this.viewMode,
        this.statusFilters.length ? this.statusFilters : null,
        null,
        this.getSellerIdForRequest(),
        this.searchTerm,
        0,
        10000,
        this.selectedProductIds.length ? this.selectedProductIds : null,
        this.selectedSellerIds.length ? this.selectedSellerIds : null,
        this.exportStartDate,
        this.exportEndDate
      )
      .pipe(map((res) => res.items));
  }

  private getSellerIdForRequest(): string | null {
    if (this.isAdmin && this.listMode === 'MY') return this.userService.getId();
    if (!this.isAdmin) return this.userService.getId();
    return null;
  }

  viewOrder(orderId: string): void {
    // Redirect to ITEMS view with pre-filled orderId filter
    this.viewMode = 'ITEM';
    this.orderIdFilter = orderId;
    this.page = 1;
    this.loadOrders();
  }
}
