import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseCategory } from '../../../../models/expense-category.model';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../../../../models/purchase-order.model';
import { Vendor } from '../../../../models/vendor.model';
import { CommonService } from '../../../../services/common.service';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';
import { PurchaseOrderService } from '../../../../services/purchase-order.service';
import { VendorService } from '../../../../services/vendor.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

type PurchaseOrderDraft = {
  id: string;
  vendorId: string;
  vendorSearchTerm: string;
  orderDate: string;
  approvedDate: string;
  completionDate: string;
  orderStatus: PurchaseOrderStatus;
  orderItems: Array<{
    id: string;
    itemId: string;
    expenseName: string;
    description: string;
    amount: number;
  }>;
};

const MAX_ORDER_ITEMS = 20;

@Component({
  selector: 'app-purchase-order-form',
  imports: [CommonModule, FormsModule, SaveArea, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './purchase-order-form.html',
  styleUrl: './purchase-order-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderForm implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private vendorService = inject(VendorService);
  private expenseCategoryService = inject(ExpenseCategoryService);
  private commonService = inject(CommonService);

  purchaseOrder = input<PurchaseOrder | undefined>();
  vendors = input<Vendor[]>([]);
  expenses = input<ExpenseCategory[]>([]);

  close = output();

  draft = signal<PurchaseOrderDraft | null>(null);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  isEditMode = computed(() => !!this.purchaseOrder()?.id);
  statusOptions: PurchaseOrderStatus[] = ['Pending', 'Approved', 'Completed'];
  today = new Date();

  canAddItem = computed(() => !this.saving() && (this.draft()?.orderItems.length ?? 0) < MAX_ORDER_ITEMS);
  canSave = computed(() => {
    const d = this.draft();
    return (
      !this.saving() &&
      !!d?.vendorId &&
      !!d?.orderDate &&
      !!d?.orderStatus &&
      d?.orderItems.length > 0 &&
      d?.orderItems.every((item) => item.itemId && item.amount > 0)
    );
  });

  officeExpenses = computed(() =>
    this.expenses()
      .filter((category) => category.type === 'OFFICE' && !this.hasChildren(category))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  vendorDisplayName = computed(() => this.draft()?.vendorSearchTerm ?? '');

  totalAmount = computed(() =>
    this.draft()?.orderItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) ?? 0
  );

  ngOnInit(): void {
    if (this.expenseCategoryService.allCategories().length === 0) {
      void this.expenseCategoryService.getAll();
    }
  }

  constructor() {
    effect(() => {
      const order = this.purchaseOrder();
      if (order) {
        const vendor = this.vendors().find((v) => v.id === order.vendorId);
        this.draft.set({
          id: order.id,
          vendorId: order.vendorId,
          vendorSearchTerm: vendor?.vendorName ?? '',
          orderDate: this.toDateInputValue(order.orderDate),
          approvedDate: this.toDateInputValue(order.approvedDate),
          completionDate: this.toDateInputValue(order.completionDate),
          orderStatus: order.orderStatus,
          orderItems: order.orderItems.map((item) => ({
            id: item.id || this.commonService.makeid(),
            itemId: item.itemId,
            expenseName:
              this.expenses().find((e) => e.id === item.itemId)?.name ?? item.description ?? '-',
            description: item.description ?? '',
            amount: Number(item.amount || 0),
          })),
        });
      } else {
        this.draft.set(this.createEmptyDraft());
      }
    });
  }

  onVendorChange(vendorId: string) {
    const d = this.draft();
    if (d) {
      const vendor = this.vendors().find((v) => v.id === vendorId);
      this.draft.update((draft) => ({
        ...draft!,
        vendorId,
        vendorSearchTerm: vendor?.vendorName ?? '',
      }));
    }
  }

  onAddItem() {
    this.draft.update((draft) => ({
      ...draft!,
      orderItems: [
        ...draft!.orderItems,
        {
          id: this.commonService.makeid(),
          itemId: '',
          expenseName: '',
          description: '',
          amount: 0,
        },
      ],
    }));
  }

  onRemoveItem(index: number) {
    this.draft.update((draft) => ({
      ...draft!,
      orderItems: draft!.orderItems.filter((_, i) => i !== index),
    }));
  }

  onExpenseChange(index: number, expenseId: string) {
    const expense = this.expenses().find((e) => e.id === expenseId);
    this.draft.update((draft) => {
      const items = [...draft!.orderItems];
      items[index] = {
        ...items[index],
        itemId: expenseId,
        expenseName: expense?.name ?? '-',
      };
      return { ...draft!, orderItems: items };
    });
  }

  onItemAmountChange(index: number, amount: number) {
    this.draft.update((draft) => {
      const items = [...draft!.orderItems];
      items[index].amount = Number(amount || 0);
      return { ...draft!, orderItems: items };
    });
  }

  toDateValue(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  toDateString(value: Date | null): string {
    if (!value) {
      return '';
    }
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onOrderDateChanged(value: Date | null) {
    this.draft.update((draft) => ({ ...draft!, orderDate: this.toDateString(value) }));
  }

  onApprovedDateChanged(value: Date | null) {
    this.draft.update((draft) => ({ ...draft!, approvedDate: this.toDateString(value) }));
  }

  onCompletionDateChanged(value: Date | null) {
    this.draft.update((draft) => ({ ...draft!, completionDate: this.toDateString(value) }));
  }

  async onSave() {
    const d = this.draft();
    if (!d || !this.canSave()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      const payload = {
        vendorId: d.vendorId,
        orderDate: d.orderDate,
        approvedDate: d.approvedDate || undefined,
        completionDate: d.completionDate || undefined,
        orderStatus: d.orderStatus,
        orderItems: d.orderItems.map((item) => ({
          itemId: item.itemId,
          description: item.description || undefined,
          amount: Number(item.amount),
        })),
      };

      if (this.isEditMode()) {
        await this.purchaseOrderService.update(d.id, payload);
        this.successMessage.set('Purchase order updated successfully');
      } else {
        await this.purchaseOrderService.create(payload);
        this.successMessage.set('Purchase order created successfully');
      }

      setTimeout(() => this.close.emit(), 1000);
    } catch (err) {
      this.errorMessage.set(err?.toString() ?? 'Failed to save purchase order');
    } finally {
      this.saving.set(false);
    }
  }

  private createEmptyDraft(): PurchaseOrderDraft {
    return {
      id: this.commonService.makeid(),
      vendorId: '',
      vendorSearchTerm: '',
      orderDate: this.getTodayDateValue(),
      approvedDate: '',
      completionDate: '',
      orderStatus: 'Pending',
      orderItems: [
        {
          id: this.commonService.makeid(),
          itemId: '',
          expenseName: '',
          description: '',
          amount: 0,
        },
      ],
    };
  }

  private getTodayDateValue(): string {
    return this.toDateInputValue(new Date());
  }

  private toDateInputValue(value?: string | Date): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private hasChildren(category: ExpenseCategory): boolean {
    return (category.children?.length ?? 0) > 0 || (category as any).childrens?.length > 0;
  }
}
