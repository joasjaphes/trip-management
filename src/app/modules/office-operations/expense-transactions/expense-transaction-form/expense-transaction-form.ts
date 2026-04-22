import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseCategory } from '../../../../models/expense-category.model';
import { ExpenseTransaction } from '../../../../models/expense-transaction.model';
import { Vendor } from '../../../../models/vendor.model';
import { CommonService } from '../../../../services/common.service';
import { ExpenseTransactionService } from '../../../../services/expense-transaction.service';
import { FileUploadService } from '../../../../services/file-upload.service';
import { VendorService } from '../../../../services/vendor.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { NumberFormatDirective } from '../../../../shared/directives/number-format';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { VendorFormDialog, VendorFormDialogData } from '../../../configurations/vendors/vendor-form/vendor-form';

type ExpenseTransactionDraft = {
  id: string;
  transactionDate: string;
  expenseId: string;
  vendorId: string;
  vendorSearchTerm: string;
  description: string;
  transactionAmount: number;
  attachment?: string;
  attachmentName?: string;
  isUploadingAttachment?: boolean;
};

const MAX_BATCH_TRANSACTIONS = 10;

@Component({
  selector: 'app-expense-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea, NumberFormatDirective, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './expense-transaction-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTransactionForm implements OnInit {
  private expenseTransactionService = inject(ExpenseTransactionService);
  private commonService = inject(CommonService);
  private fileUploadService = inject(FileUploadService);
  private vendorService = inject(VendorService);
  private dialog = inject(MatDialog);
  today = new Date();

  loading = this.expenseTransactionService.loading;
  transaction = input<ExpenseTransaction | undefined>();
  officeExpenses = input<ExpenseCategory[]>([]);
  vendors = input<Vendor[]>([]);

  close = output();

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  saving = signal(false);
  rows = signal<ExpenseTransactionDraft[]>([]);

  isEditMode = computed(() => !!this.transaction()?.id);

  hasValidRows = computed(() => this.rows().some((row) => this.isValidRow(row)));
  canAddRow = computed(() => !this.isEditMode() && !this.saving() && this.rows().length < MAX_BATCH_TRANSACTIONS);

  canSave = computed(() => this.hasValidRows() && !this.saving());

  ngOnInit(): void {
    if (this.vendorService.allVendors().length === 0) {
      void this.vendorService.getAll();
    }
  }

  constructor() {
    effect(() => {
      const record = this.transaction();
      if (record) {
        this.rows.set([
          this.createRowFromTransaction(record),
        ]);
      } else {
        this.rows.set([this.createEmptyRow()]);
      }
    });
  }

  private createEmptyRow(): ExpenseTransactionDraft {
    return {
      id: this.commonService.makeid(),
      transactionDate: this.getTodayDateValue(),
      expenseId: '',
      vendorId: '',
      vendorSearchTerm: '',
      description: '',
      transactionAmount: 0,
      attachment: undefined,
      attachmentName: undefined,
      isUploadingAttachment: false,
    };
  }

  private createRowFromTransaction(record: ExpenseTransaction): ExpenseTransactionDraft {
    const vendor = this.resolveVendor(record.vendorId ?? '', record.vendorName ?? '');

    return {
      id: record.id,
      transactionDate: this.toDateInputValue(record.transactionDate),
      expenseId: record.expenseId,
      vendorId: vendor?.id ?? record.vendorId ?? '',
      vendorSearchTerm: vendor?.vendorName ?? record.vendorName ?? '',
      description: record.description ?? '',
      transactionAmount: Number(record.transactionAmount ?? 0),
      attachment: record.attachment,
      attachmentName: this.fileUploadService.getFileName(record.attachment),
      isUploadingAttachment: false,
    };
  }

  private isValidRow(row: ExpenseTransactionDraft): boolean {
    return (
      !!row.expenseId &&
      !!row.vendorId &&
      !!row.transactionDate &&
      Number(row.transactionAmount) > 0
    );
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

  toDateObject(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toIsoDateValue(dateValue: string): string {
    const [year, month, day] = dateValue.split('-').map((value) => Number(value));
    if (!year || !month || !day) {
      return dateValue;
    }

    return new Date(year, month - 1, day).toISOString();
  }

  addRow() {
    if (this.isEditMode() || this.saving()) {
      return;
    }

    if (this.rows().length >= MAX_BATCH_TRANSACTIONS) {
      this.errorMessage.set(`You can only post up to ${MAX_BATCH_TRANSACTIONS} transactions at once.`);
      return;
    }

    this.errorMessage.set(null);

    this.rows.update((rows) => [...rows, this.createEmptyRow()]);
  }

  removeRow(rowId: string) {
    if (this.isEditMode() || this.saving()) {
      return;
    }

    this.rows.update((rows) => {
      const nextRows = rows.filter((row) => row.id !== rowId);
      return nextRows.length > 0 ? nextRows : [this.createEmptyRow()];
    });
  }

  updateRowField(rowId: string, field: keyof ExpenseTransactionDraft, value: string) {
    this.rows.update((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === 'transactionAmount') {
          const parsedValue = Number(value);
          const numericValue = Number.isFinite(parsedValue) ? parsedValue : 0;
          return { ...row, transactionAmount: numericValue };
        }

        return { ...row, [field]: value };
      })
    );
  }

  updateVendorField(rowId: string, value: string) {
    const vendor = this.resolveVendor('', value);

    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              vendorSearchTerm: value,
              vendorId: vendor?.id ?? '',
            }
          : row
      )
    );
  }

  openVendorDialog(rowId: string) {
    const data: VendorFormDialogData = {
      title: 'Add vendor',
      description: 'Create a vendor to use in expense transactions.',
    };

    this.dialog.open(VendorFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
      restoreFocus: true,
      data,
    }).afterClosed().subscribe((vendor: Vendor | null | undefined) => {
      if (!vendor) {
        return;
      }

      this.rows.update((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                vendorId: vendor.id,
                vendorSearchTerm: vendor.vendorName,
              }
            : row
        )
      );
    });
  }

  private resolveVendor(vendorId: string, vendorName: string): Vendor | undefined {
    if (vendorId) {
      const byId = this.vendorService.getById(vendorId);
      if (byId) {
        return byId;
      }
    }

    if (vendorName.trim()) {
      return this.vendorService.findByName(vendorName);
    }

    return undefined;
  }

  onTransactionDateChanged(rowId: string, value: Date | null) {
    if (!value) {
      return;
    }

    this.updateRowField(rowId, 'transactionDate', this.toDateInputValue(value));
  }

  async onAttachmentSelected(event: Event, rowId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!/^image\//i.test(file.type) && file.type !== 'application/pdf') {
      this.errorMessage.set('Attachment must be an image or a PDF file.');
      input.value = '';
      return;
    }

    this.errorMessage.set(null);

    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? { ...row, isUploadingAttachment: true }
          : row
      )
    );

    try {
      const uploadedFile = await this.fileUploadService.uploadFile(file);

      this.rows.update((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                attachment: uploadedFile.filePath,
                attachmentName: uploadedFile.fileName,
                isUploadingAttachment: false,
              }
            : row
        )
      );
    } catch (error) {
      this.rows.update((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? { ...row, isUploadingAttachment: false }
            : row
        )
      );
      this.errorMessage.set(String(error || 'Could not upload the attachment. Please try again.'));
    } finally {
      input.value = '';
    }
  }

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    if (!this.isEditMode() && this.rows().length > MAX_BATCH_TRANSACTIONS) {
      this.errorMessage.set(`You can only post up to ${MAX_BATCH_TRANSACTIONS} transactions at once.`);
      return;
    }

    const validRows = this.rows().filter((row) => this.isValidRow(row));

    if (validRows.length === 0) {
      this.errorMessage.set('Add at least one row with expense and amount greater than zero.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode() ? 'Updating transaction...' : 'Posting transactions...');

    try {
      if (this.isEditMode()) {
        const row = validRows[0];
        await this.expenseTransactionService.update(this.transaction()!.id, {
          id: this.transaction()!.id,
          expenseId: row.expenseId,
          vendorId: row.vendorId,
          description: row.description.trim() || undefined,
          transactionAmount: Number(row.transactionAmount),
          transactionDate: this.toIsoDateValue(row.transactionDate),
          quantity: 1,
          unitPrice: Number(row.transactionAmount),
          attachment: row.attachment,
        });
      } else {
        await Promise.all(
          validRows.map((row) =>
            this.expenseTransactionService.create({
              id: row.id,
              expenseId: row.expenseId,
              vendorId: row.vendorId,
              description: row.description.trim() || undefined,
              transactionAmount: Number(row.transactionAmount),
              transactionDate: this.toIsoDateValue(row.transactionDate),
              quantity: 1,
              unitPrice: Number(row.transactionAmount),
              attachment: row.attachment,
            })
          )
        );
      }

      this.successMessage.set(
        this.isEditMode()
          ? 'Expense transaction updated successfully.'
          : `${validRows.length} expense transaction(s) posted successfully.`
      );
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save transaction. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.saving.set(false);
    }
  }
}
