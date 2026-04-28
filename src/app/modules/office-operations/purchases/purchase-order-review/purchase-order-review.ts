import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ExpenseCategory } from '../../../../models/expense-category.model';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import { CommonService } from '../../../../services/common.service';
import { FileUploadService } from '../../../../services/file-upload.service';
import { PurchaseOrderService } from '../../../../services/purchase-order.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { NumberFormatDirective } from '../../../../shared/directives/number-format';
import { MatTooltipModule } from '@angular/material/tooltip';

export type PurchaseOrderReviewMode = 'approve' | 'complete';

type ReviewItem = {
  id: string;
  itemId: string;
  description: string;
  amount: number;
  quantity: number;
};

type CompletionAttachment = {
  path?: string;
  name?: string;
  url?: string;
};

@Component({
  selector: 'app-purchase-order-review',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea, MatDatepickerModule, MatNativeDateModule,NumberFormatDirective,MatTooltipModule],
  templateUrl: './purchase-order-review.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderReview {
  private purchaseOrderService = inject(PurchaseOrderService);
  private commonService = inject(CommonService);
  private fileUploadService = inject(FileUploadService);

  purchaseOrder = input.required<PurchaseOrder>();
  expenses = input<ExpenseCategory[]>([]);
  mode = input.required<PurchaseOrderReviewMode>();

  close = output();

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  reviewDate = signal<string>('');
  items = signal<ReviewItem[]>([]);
  completionAttachment = signal<CompletionAttachment>({});
  completionAttachmentUploading = signal(false);
  today = new Date();

  modeLabel = computed(() => (this.mode() === 'approve' ? 'Approve' : 'Receive'));
  dateLabel = computed(() => (this.mode() === 'approve' ? 'Approval Date' : 'Receiving Date'));
  saveLabel = computed(() => (this.mode() === 'approve' ? 'Approve Order' : 'Receive Order'));

  totalAmount = computed(() =>
    this.items().reduce((sum, item) => sum + Number(item.amount || 0), 0)
  );

  officeExpenses = computed(() =>
    this.expenses()
      .filter((category) => category.type === 'OFFICE' && !this.hasChildren(category) && category.isPurchase)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  canSave = computed(() => {
    return (
      !this.saving() &&
      !this.completionAttachmentUploading() &&
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
          quantity: Number(item.quantity || 1),
        }))
      );

      this.reviewDate.set(this.toDateString(new Date()));
      this.completionAttachment.set({
        path: order.completionAttachment,
        name: this.fileUploadService.getFileName(order.completionAttachment),
        url: undefined,
      });

      if (this.mode() === 'complete' && order.completionAttachment) {
        void this.hydrateCompletionAttachment(order.completionAttachment);
      }
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

  private async hydrateCompletionAttachment(path: string | undefined) {
    if (!path) {
      this.completionAttachment.update((attachment) => ({ ...attachment, url: undefined }));
      return;
    }

    const url = await this.fileUploadService.resolveFileUrl(path);
    this.completionAttachment.update((attachment) => ({
      ...attachment,
      path,
      name: this.fileUploadService.getFileName(path),
      url,
    }));
  }

  async onCompletionAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : undefined;
    if (!file) {
      return;
    }

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext));
    if (!allowedMimeTypes.includes(file.type) && !hasAllowedExtension) {
      this.errorMessage.set('Only PDF or image files are allowed.');
      input.value = '';
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.completionAttachmentUploading.set(true);
    this.completionAttachment.update((attachment) => ({
      ...attachment,
      name: file.name,
      url: undefined,
    }));

    try {
      const uploadedFile = await this.fileUploadService.uploadFile(file);
      this.completionAttachment.set({
        path: uploadedFile.filePath,
        name: uploadedFile.fileName,
        url: uploadedFile.fileUrl,
      });
      this.successMessage.set('Completion attachment uploaded successfully.');
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not upload the completion attachment.'));
    } finally {
      this.completionAttachmentUploading.set(false);
      input.value = '';
    }
  }

  removeCompletionAttachment() {
    this.completionAttachment.set({});
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  previewCompletionAttachment() {
    const url = this.completionAttachment().url;
    if (!url) {
      this.errorMessage.set('Attachment preview is not available.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onAddItem() {
    this.items.update((items) => [
      ...items,
      {
        id: this.commonService.makeid(),
        itemId: '',
        description: '',
        amount: 0,
        quantity: 1,
      },
    ]);
  }

  onRemoveItem(id: string) {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  onItemFieldChange(id: string, field: 'itemId' | 'description' | 'amount' | 'quantity', value: string | number) {
    this.items.update((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (field === 'amount') {
          return { ...item, amount: Number(value || 0) };
        }
        if (field === 'quantity') {
          return { ...item, quantity: Number(value || 0) };
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
          completionAttachment: this.completionAttachment().path || undefined,
          orderItems,
        });
        this.successMessage.set('Purchase order received successfully.');
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
