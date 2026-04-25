import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ExpenseCategory } from '../../../../models/expense-category.model';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import { CommonService } from '../../../../services/common.service';
import { PurchaseOrderService } from '../../../../services/purchase-order.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

export type PurchaseOrderReviewMode = 'approve' | 'complete';

type ReviewItem = {
  id: string;
  itemId: string;
  description: string;
  amount: number;
};

@Component({
  selector: 'app-purchase-order-review',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './purchase-order-review.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderReview {
  private purchaseOrderService = inject(PurchaseOrderService);
  private commonService = inject(CommonService);

  purchaseOrder = input.required<PurchaseOrder>();
  expenses = input<ExpenseCategory[]>([]);
  mode = input.required<PurchaseOrderReviewMode>();

  close = output();

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  reviewDate = signal<string>('');
  items = signal<ReviewItem[]>([]);
  today = new Date();

  modeLabel = computed(() => (this.mode() === 'approve' ? 'Approve' : 'Complete'));
  dateLabel = computed(() => (this.mode() === 'approve' ? 'Approval Date' : 'Completion Date'));
  saveLabel = computed(() => (this.mode() === 'approve' ? 'Approve Order' : 'Complete Order'));

  totalAmount = computed(() =>
    this.items().reduce((sum, item) => sum + Number(item.amount || 0), 0)
  );

  officeExpenses = computed(() =>
    this.expenses()
      .filter((category) => category.type === 'OFFICE' && !this.hasChildren(category))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  canSave = computed(() => {
    return (
      !this.saving() &&
      !!this.reviewDate() &&
      this.items().length > 0 &&
      this.items().every((item) => item.itemId && Number(item.amount) > 0)
    );
  });

  constructor() {
    effect(() => {
      const order = this.purchaseOrder();
      if (!order) return;

      this.items.set(
        order.orderItems.map((item) => ({
          id: item.id || this.commonService.makeid(),
          itemId: item.itemId,
          description: item.description ?? '',
          amount: Number(item.amount || 0),
        }))
      );

      this.reviewDate.set(this.toDateString(new Date()));
    });
  }

  toDateValue(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  toDateString(value: Date | null): string {
    if (!value) return '';
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onReviewDateChanged(value: Date | null) {
    this.reviewDate.set(this.toDateString(value));
  }

  onAddItem() {
    this.items.update((items) => [
      ...items,
      {
        id: this.commonService.makeid(),
        itemId: '',
        description: '',
        amount: 0,
      },
    ]);
  }

  onRemoveItem(id: string) {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  onItemFieldChange(id: string, field: 'itemId' | 'description' | 'amount', value: string | number) {
    this.items.update((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (field === 'amount') {
          return { ...item, amount: Number(value || 0) };
        }
        return { ...item, [field]: value as string };
      })
    );
  }

  expenseName(itemId: string): string {
    return this.expenses().find((e) => e.id === itemId)?.name ?? '';
  }

  async onSave() {
    if (!this.canSave()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      const orderItems = this.items().map((item) => ({
        itemId: item.itemId,
        description: item.description || undefined,
        amount: Number(item.amount),
      }));

      const isoDate = new Date(this.reviewDate()).toISOString();

      if (this.mode() === 'approve') {
        await this.purchaseOrderService.approve(this.purchaseOrder().id, {
          approvedDate: isoDate,
          orderItems,
        });
        this.successMessage.set('Purchase order approved successfully.');
      } else {
        await this.purchaseOrderService.complete(this.purchaseOrder().id, {
          completionDate: isoDate,
          orderItems,
        });
        this.successMessage.set('Purchase order completed successfully.');
      }

      setTimeout(() => this.close.emit(), 800);
    } catch (err) {
      this.errorMessage.set(err?.toString() ?? `Failed to ${this.mode()} purchase order`);
    } finally {
      this.saving.set(false);
    }
  }

  private hasChildren(category: ExpenseCategory): boolean {
    return (category.children?.length ?? 0) > 0 || (category as any).childrens?.length > 0;
  }
}
