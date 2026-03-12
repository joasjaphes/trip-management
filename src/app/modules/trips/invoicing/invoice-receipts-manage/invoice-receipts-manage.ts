import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceReceipt } from '../../../../models/invoice.model';
import { InvoiceReceiptService } from '../../../../services/invoice-receipt.service';
import { FileUploadService } from '../../../../services/file-upload.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

type ReceiptDraft = {
  id: string;
  receiptRecordId?: string;
  method: string;
  referenceNo: string;
  amount: string;
  receivedAt: string;
  attachment?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isUploading?: boolean;
  notes: string;
};

@Component({
  selector: 'app-invoice-receipts-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './invoice-receipts-manage.html',
})
export class InvoiceReceiptsManage {
  private invoiceReceiptService = inject(InvoiceReceiptService);
  private fileUploadService = inject(FileUploadService);

  invoice = input<Invoice | undefined>();
  close = output();
  saved = output();

  receipts = this.invoiceReceiptService.allReceipts;
  loading = computed(() => this.invoiceReceiptService.loading());
  pendingUploads = signal(0);
  busy = computed(() => this.loading() || this.pendingUploads() > 0);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  deletingRowId = signal<string | null>(null);

  receiptRows = signal<ReceiptDraft[]>([]);

  invoiceReceipts = computed(() => {
    const invoiceId = this.invoice()?.id;
    if (!invoiceId) {
      return [];
    }
    return this.receipts().filter((receipt) => receipt.invoiceId === invoiceId);
  });

  totalReceived = computed(() =>
    this.invoiceReceipts().reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0)
  );

  constructor() {
    effect(() => {
      this.syncRowsFromReceipts(this.invoiceReceipts());
    });
  }

  async ngOnInit() {
    await this.invoiceReceiptService.getAll();
  }

  private createReceiptRow(): ReceiptDraft {
    return {
      id: crypto.randomUUID(),
      method: '',
      referenceNo: '',
      amount: '',
      receivedAt: '',
      attachment: undefined,
      attachmentName: undefined,
      attachmentUrl: undefined,
      isUploading: false,
      notes: '',
    };
  }

  private mapReceiptToDraft(receipt: InvoiceReceipt): ReceiptDraft {
    return {
      id: crypto.randomUUID(),
      receiptRecordId: receipt.id,
      method: '',
      referenceNo: receipt.reference || '',
      amount: String(receipt.amount || ''),
      receivedAt: receipt.paidAt ? new Date(receipt.paidAt).toISOString().split('T')[0] : '',
      attachment: receipt.attachment,
      attachmentName: this.fileUploadService.getFileName(receipt.attachment),
      attachmentUrl: undefined,
      isUploading: false,
      notes: receipt.notes || '',
    };
  }

  private syncRowsFromReceipts(receipts: InvoiceReceipt[]) {
    const rows = receipts.map((receipt) => this.mapReceiptToDraft(receipt));
    const hydratedRows = rows.length > 0 ? rows : [this.createReceiptRow()];
    this.receiptRows.set(hydratedRows);
    void this.hydrateAttachmentUrls(hydratedRows);
  }

  private async hydrateAttachmentUrls(rows: ReceiptDraft[]) {
    const hydratedRows = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        attachmentName: row.attachmentName || this.fileUploadService.getFileName(row.attachment),
        attachmentUrl: row.attachmentUrl || await this.fileUploadService.resolveFileUrl(row.attachment),
      }))
    );

    this.receiptRows.set(hydratedRows);
  }

  private async ensureAttachmentUrl(rowId: string): Promise<string | undefined> {
    const row = this.receiptRows().find((item) => item.id === rowId);
    if (!row?.attachment) {
      return undefined;
    }

    if (row.attachmentUrl) {
      return row.attachmentUrl;
    }

    const resolvedUrl = await this.fileUploadService.resolveFileUrl(row.attachment);
    if (!resolvedUrl) {
      return undefined;
    }

    this.receiptRows.update((rows) =>
      rows.map((item) =>
        item.id === rowId
          ? {
              ...item,
              attachmentUrl: resolvedUrl,
            }
          : item
      )
    );

    return resolvedUrl;
  }

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  addReceiptRow() {
    if (this.busy()) {
      return;
    }
    this.receiptRows.update((rows) => [...rows, this.createReceiptRow()]);
  }

  updateRowField(rowId: string, field: keyof ReceiptDraft, value: string | undefined) {
    this.receiptRows.update((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  }

  async onReceiptAttachmentSelected(event: Event, rowId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : undefined;
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Only image attachments are allowed.');
      input.value = '';
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(`Uploading ${file.name}...`);
    this.pendingUploads.update((count) => count + 1);

    this.receiptRows.update((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              attachmentName: file.name,
              isUploading: true,
            }
          : row
      )
    );

    try {
      const uploadedFile = await this.fileUploadService.uploadFile(file);
      this.receiptRows.update((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                attachment: uploadedFile.filePath,
                attachmentName: uploadedFile.fileName,
                attachmentUrl: uploadedFile.fileUrl,
                isUploading: false,
              }
            : row
        )
      );
      this.successMessage.set('Receipt attachment uploaded successfully.');
    } catch (error) {
      this.receiptRows.update((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                isUploading: false,
              }
            : row
        )
      );
      this.errorMessage.set(String(error || 'Could not upload the attachment. Please try again.'));
    } finally {
      this.pendingUploads.update((count) => Math.max(0, count - 1));
      this.actionMessage.set(null);
      input.value = '';
    }
  }

  async previewAttachment(rowId: string) {
    const url = await this.ensureAttachmentUrl(rowId);
    if (!url) {
      this.errorMessage.set('Attachment preview is not available for this receipt.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async removeReceiptRow(rowId: string) {
    const row = this.receiptRows().find((r) => r.id === rowId);
    if (!row) {
      return;
    }

    if (!row.receiptRecordId) {
      this.receiptRows.update((rows) => {
        const updated = rows.filter((item) => item.id !== rowId);
        return updated.length > 0 ? updated : [this.createReceiptRow()];
      });
      return;
    }

    const confirmed = window.confirm('Remove this receipt?');
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Removing receipt...');
    this.deletingRowId.set(rowId);

    try {
      await this.invoiceReceiptService.delete(row.receiptRecordId);
      this.successMessage.set('Receipt removed successfully.');
      this.saved.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not remove receipt. Please try again.'));
    } finally {
      this.deletingRowId.set(null);
      this.actionMessage.set(null);
    }
  }

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    const invoice = this.invoice();
    if (!invoice?.id) {
      this.errorMessage.set('Invoice not found.');
      return;
    }

    if (this.pendingUploads() > 0) {
      this.errorMessage.set('Wait for receipt attachments to finish uploading before saving receipts.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving receipts...');

    const rowsToSave = this.receiptRows().filter((row) => row.amount && !Number.isNaN(Number(row.amount)));

    try {
      await Promise.all(
        rowsToSave.map((row) => {
          const parsedAmount = Number(row.amount);
          if (row.receiptRecordId) {
            return this.invoiceReceiptService.update(row.receiptRecordId, {
              invoiceId: invoice.id,
              amount: parsedAmount,
              paidAt: row.receivedAt || undefined,
              reference: row.referenceNo || undefined,
              attachment: row.attachment || undefined,
              notes: row.notes || undefined,
            });
          }

          return this.invoiceReceiptService.create({
            invoiceId: invoice.id,
            amount: parsedAmount,
            paidAt: row.receivedAt || undefined,
            reference: row.referenceNo || undefined,
            attachment: row.attachment || undefined,
            notes: row.notes || undefined,
          });
        })
      );

      this.successMessage.set('Invoice receipts saved successfully.');
      this.saved.emit();
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save invoice receipts. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
