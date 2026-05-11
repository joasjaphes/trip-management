import { Injectable, computed, signal } from '@angular/core';
import { CommonService } from './common.service';
import { PurchaseOrder } from '../models/purchase-order.model';
import { HttpClientService } from './http-client.service';

export type PurchaseOrderItemPayload = {
  itemId: string;
  description?: string;
  amount: number;
};

export type CreatePurchaseOrderPayload = {
  purchaseOrderReferenceNumber?: string;
  vendorId?: string;
  vendorName?: string;
  vendorTIN?: string;
  orderDate: string;
  approvedDate?: string;
  completionDate?: string;
  orderStatus: 'Pending' | 'Approved' | 'Completed';
  orderItems: PurchaseOrderItemPayload[];
};

export type UpdatePurchaseOrderPayload = CreatePurchaseOrderPayload;

export type ApprovePurchaseOrderPayload = {
  approvedDate: string;
  orderItems: PurchaseOrderItemPayload[];
};

export type CompletePurchaseOrderPayload = {
  completionDate: string;
  completionAttachment?: string;
  orderItems: PurchaseOrderItemPayload[];
};

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

  async approve(id: string, payload: ApprovePurchaseOrderPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put(`purchaseOrders/${id}/approve`, payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to approve purchase order');
      console.error('Failed to approve purchase order', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async complete(id: string, payload: CompletePurchaseOrderPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put(`purchaseOrders/${id}/complete`, payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to complete purchase order');
      console.error('Failed to complete purchase order', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`purchaseOrders/${id}`);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete purchase order');
      console.error('Failed to delete purchase order', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
