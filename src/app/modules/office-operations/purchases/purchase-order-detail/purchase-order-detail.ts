import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';
import { FileUploadService } from '../../../../services/file-upload.service';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetail {
  private expenseCategoryService = inject(ExpenseCategoryService);
  private fileUploadService = inject(FileUploadService);

  purchaseOrder = input.required<PurchaseOrder>();
  close = output();

  completionAttachmentName = signal<string | undefined>(undefined);
  completionAttachmentUrl = signal<string | undefined>(undefined);

  totalAmount = computed(() =>
    (this.purchaseOrder().orderItems ?? []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    )
  );

  constructor() {
    effect(() => {
      void this.hydrateCompletionAttachment(this.purchaseOrder().completionAttachment);
    });
  }

  private async hydrateCompletionAttachment(path: string | undefined) {
    this.completionAttachmentName.set(this.fileUploadService.getFileName(path));

    if (!path) {
      this.completionAttachmentUrl.set(undefined);
      return;
    }

    const url = await this.fileUploadService.resolveFileUrl(path);
    this.completionAttachmentUrl.set(url);
  }

  previewCompletionAttachment() {
    const url = this.completionAttachmentUrl();
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  expenseName(itemId: string): string {
    return this.expenseCategoryService.getById(itemId)?.name ?? '-';
  }

  statusClasses(status: string): string {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      Approved: 'bg-blue-50 text-blue-700 border-blue-200',
      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return colors[status] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
