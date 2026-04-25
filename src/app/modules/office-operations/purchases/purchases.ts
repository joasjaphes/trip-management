import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../models/purchase-order.model';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { VendorService } from '../../../services/vendor.service';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { PurchaseOrderForm } from './purchase-order-form/purchase-order-form';
import { PurchaseOrderReview, PurchaseOrderReviewMode } from './purchase-order-review/purchase-order-review';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

type PurchaseStatusTab = 'pending' | 'approved' | 'completed';

@Component({
  selector: 'app-purchases',
  imports: [CommonModule, FormsModule, Layout, DataTable, PurchaseOrderForm, PurchaseOrderReview, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Purchases implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private vendorServicePrivate = inject(VendorService);
  private expenseCategoryServicePrivate = inject(ExpenseCategoryService);

  // Expose services to template
  vendorService = this.vendorServicePrivate;
  expenseCategoryService = this.expenseCategoryServicePrivate;

  title = signal('Purchases');
  description = signal('Track purchase orders from pending request to final completion.');
  viewDetails = signal(false);
  viewType = signal<'add' | 'edit' | 'approve' | 'complete' | ''>('');
  reviewMode = signal<PurchaseOrderReviewMode>('approve');
  showAddButton = signal(true);
  splitSize = signal<'half' | 'full'>('full');
  formTitle = signal('');
  formDescription = signal('');
  selectedPurchaseOrder = signal<PurchaseOrder | undefined>(undefined);

  selectedStatus = signal<PurchaseStatusTab>('pending');
  filterVendorId = signal('');
  filterFromDate = signal('');
  filterToDate = signal('');

  loading = computed(() =>
    this.purchaseOrderService.loading() ||
    this.vendorServicePrivate.loading() ||
    this.expenseCategoryServicePrivate.loading()
  );

  statusTabs = computed(
    () =>
      [
        {
          key: 'pending' as const,
          label: 'Pending Orders',
          count: this.countByStatus('Pending'),
        },
        {
          key: 'approved' as const,
          label: 'Approved Orders',
          count: this.countByStatus('Approved'),
        },
        {
          key: 'completed' as const,
          label: 'Completed Orders',
          count: this.countByStatus('Completed'),
        },
      ] satisfies Array<{ key: PurchaseStatusTab; label: string; count: number }>
  );

  vendorOptions = computed(() =>
    this.vendorServicePrivate.allVendors().sort((a, b) => a.vendorName.localeCompare(b.vendorName))
  );

  orderRows = computed(() => {
    const vendorNames = new Map(
      this.vendorServicePrivate.allVendors().map((vendor) => [vendor.id, vendor.vendorName])
    );

    return this.purchaseOrderService.allPurchaseOrders().map((order) => {
      const orderItems = order.orderItems ?? [];
      const totalAmount = orderItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );
      const normalizedStatus = order.orderStatus.toLowerCase();

      return {
        id: order.id,
        orderId: order.id,
        purchaseOrderReferenceNumber:
          order.purchaseOrderReferenceNumber || '-',
        vendorId: order.vendorId,
        vendorName:
          order.vendor?.vendorName ||
          vendorNames.get(order.vendorId) ||
          order.vendorId ||
          '-',
        itemCount: orderItems.length,
        totalAmount,
        orderDateDisplay: this.formatDate(order.orderDate),
        approvedDateDisplay: this.formatDate(order.approvedDate),
        completionDateDisplay: this.formatDate(order.completionDate),
        orderStatus: order.orderStatus,
        normalizedStatus,
        orderDateRaw: order.orderDate,
        _order: order,
      };
    });
  });

  filteredRows = computed(() => {
    let filtered = this.orderRows();
    const selected = this.selectedStatus();
    const vendorFilter = this.filterVendorId();
    const fromDate = this.filterFromDate();
    const toDate = this.filterToDate();

    // Filter by status tab
    if (selected === 'pending') {
      filtered = filtered.filter((row) => row.normalizedStatus === 'pending');
    } else if (selected === 'approved') {
      filtered = filtered.filter((row) => row.normalizedStatus === 'approved');
    } else if (selected === 'completed') {
      filtered = filtered.filter((row) => row.normalizedStatus === 'completed');
    }

    // Filter by vendor
    if (vendorFilter) {
      filtered = filtered.filter((row) => row.vendorId === vendorFilter);
    }

    // Filter by date range
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      filtered = filtered.filter(
        (row) => new Date(row.orderDateRaw).getTime() >= from
      );
    }

    if (toDate) {
      const to = new Date(toDate).getTime();
      filtered = filtered.filter(
        (row) => new Date(row.orderDateRaw).getTime() <= to
      );
    }

    return filtered;
  });

  moreActions = computed(() => {
    const selected = this.selectedStatus();
    const actions = [];

    if (selected === 'pending') {
      actions.push({
        label: 'Approve Order',
        key: 'approve',
        icon: 'fa-solid fa-check text-green-500',
        action: (row: any) => this.onApprove(row),
      });
    }

    if (selected === 'approved') {
      actions.push({
        label: 'Complete Order',
        key: 'complete',
        icon: 'fa-solid fa-flag-checkered text-blue-500',
        action: (row: any) => this.onComplete(row),
      });
    }

    actions.push({
      label: 'Edit Order',
      key: 'edit',
      icon: 'fa-solid fa-pen text-gray-500',
      action: (row: any) => this.onEdit(row),
    });

    return actions;
  });

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'purchaseOrderReferenceNumber', label: 'Reference #' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'itemCount', label: 'Items', type: 'number' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
      { key: 'orderDateDisplay', label: 'Order Date' },
      { key: 'approvedDateDisplay', label: 'Approved Date' },
      { key: 'completionDateDisplay', label: 'Completed Date' },
    ],
    actions: {
      more: true,
    },
  };

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.purchaseOrderService.getAll(),
      this.vendorServicePrivate.getAll(),
      this.expenseCategoryServicePrivate.getAll(),
    ]);
  }

  onAdd() {
    this.selectedPurchaseOrder.set(undefined);
    this.viewType.set('add');
    this.splitSize.set('full');
    this.formTitle.set('Create Purchase Order');
    this.formDescription.set('Create a new purchase order with items and vendor details.');
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    const order = this.purchaseOrderService.getById(row.id);
    if (!order) {
      return;
    }

    this.selectedPurchaseOrder.set(order);
    this.viewType.set('edit');
    this.splitSize.set('full');
    this.formTitle.set('Edit Purchase Order');
    this.formDescription.set('Update purchase order details and items.');
    this.viewDetails.set(true);
  }

  onApprove(row: any) {
    const order = this.purchaseOrderService.getById(row.id);
    if (!order) {
      return;
    }

    this.selectedPurchaseOrder.set(order);
    this.reviewMode.set('approve');
    this.viewType.set('approve');
    this.splitSize.set('full');
    this.formTitle.set('Approve Purchase Order');
    this.formDescription.set('Review items and approve the purchase order.');
    this.viewDetails.set(true);
  }

  onComplete(row: any) {
    const order = this.purchaseOrderService.getById(row.id);
    if (!order) {
      return;
    }

    this.selectedPurchaseOrder.set(order);
    this.reviewMode.set('complete');
    this.viewType.set('complete');
    this.splitSize.set('full');
    this.formTitle.set('Complete Purchase Order');
    this.formDescription.set('Review items and complete the purchase order.');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedPurchaseOrder.set(undefined);
    this.splitSize.set('full');

    await this.purchaseOrderService.getAll();
  }

  totalOrders = computed(() => this.purchaseOrderService.allPurchaseOrders().length);

  totalOrderAmount = computed(() =>
    this.orderRows().reduce((sum, row) => sum + row.totalAmount, 0)
  );

  private countByStatus(status: PurchaseOrderStatus): number {
    const normalizedStatus = status.toLowerCase();
    return this.purchaseOrderService
      .allPurchaseOrders()
      .filter((order) => order.orderStatus.toLowerCase() === normalizedStatus).length;
  }

  toDateValue(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateString(value: Date | null): string {
    if (!value) {
      return '';
    }
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onFromDateChanged(value: Date | null) {
    this.filterFromDate.set(this.toDateString(value));
  }

  onToDateChanged(value: Date | null) {
    this.filterToDate.set(this.toDateString(value));
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleDateString();
  }
}
