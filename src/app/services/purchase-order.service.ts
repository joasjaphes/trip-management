import { Injectable, computed, signal } from '@angular/core';
import { CommonService } from './common.service';
import { PurchaseOrder } from '../models/purchase-order.model';
import { HttpClientService } from './http-client.service';

export type CreatePurchaseOrderPayload = {
  purchaseOrderReferenceNumber: string;
  vendorId: string;
  orderDate: string;
  approvedDate?: string;
  completionDate?: string;
  orderStatus: 'Pending' | 'Approved' | 'Completed';
  orderItems: Array<{
    itemId: string;
    description?: string;
    amount: number;
  }>;
};

export type UpdatePurchaseOrderPayload = CreatePurchaseOrderPayload;

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService {
  private purchaseOrders = signal<PurchaseOrder[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allPurchaseOrders = this.purchaseOrders.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();
  readonly totalAmount = computed(() =>
    this.purchaseOrders().reduce(
      (sum, order) =>
        sum +
        order.orderItems.reduce((itemSum, item) => itemSum + Number(item.amount || 0), 0),
      0
    )
  );

  constructor(
    private http: HttpClientService,
    private commonService: CommonService
  ) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const purchaseOrders = await this.http.get<PurchaseOrder[]>('purchaseOrders');
      this.purchaseOrders.set(purchaseOrders);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch purchase orders');
      console.error('Failed to fetch purchase orders', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders().find((order) => order.id === id);
  }

  async create(payload: CreatePurchaseOrderPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const id = this.commonService.makeid();
      await this.http.post('purchaseOrders', {
        id,
        ...payload,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create purchase order');
      console.error('Failed to create purchase order', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, payload: UpdatePurchaseOrderPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('purchaseOrders', {
        id,
        ...payload,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update purchase order');
      console.error('Failed to update purchase order', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateStatus(
    id: string,
    status: 'Approved' | 'Completed',
    dates?: { approvedDate?: string; completionDate?: string }
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const order = this.getById(id);
      if (!order) throw new Error('Purchase order not found');

      const payload: UpdatePurchaseOrderPayload = {
        purchaseOrderReferenceNumber: order.purchaseOrderReferenceNumber,
        vendorId: order.vendorId,
        orderDate: order.orderDate,
        approvedDate: status === 'Approved' ? dates?.approvedDate ?? new Date().toISOString() : order.approvedDate,
        completionDate: status === 'Completed' ? dates?.completionDate ?? new Date().toISOString() : order.completionDate,
        orderStatus: status,
        orderItems: order.orderItems.map((item) => ({
          itemId: item.itemId,
          description: item.description,
          amount: item.amount,
        })),
      };

      await this.http.put('purchaseOrders', { id, ...payload });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update purchase order status');
      console.error('Failed to update purchase order status', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
