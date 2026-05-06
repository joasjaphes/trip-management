import { Component, input, output, computed, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trip, TripExpense, TripStatus } from '../../../models/trip.model';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './trip-detail.html'
})
export class TripDetail {
  private expenseCategoryService = inject(ExpenseCategoryService);
  private fileUploadService = inject(FileUploadService);

  trip = input<Trip | undefined>();
  completing = input(false);
  close = output();
  complete = output<Trip>();
  tripEndDate: string | undefined = this.trip()?.endDate ? this.toDateInputValue(this.trip()?.endDate) : undefined;

  confirmingComplete = signal(false);
  attachmentPreviewUrls = signal<Record<string, string>>({});
  cantCompleteMessage = signal('Please ensure the trip has an end date and all the amount has been received before completing.'); 
  completionDocumentPath = signal<string | undefined>(undefined);
  completionDocumentName = signal<string | undefined>(undefined);
  completionDocumentUrl = signal<string | undefined>(undefined);
  completionDocumentUploading = signal(false);
  completionDocumentError = signal<string | null>(null);
  completionDocumentSuccess = signal<string | null>(null);
  tripDocumentUrl = signal<string | undefined>(undefined);
  today = new Date();

  canConfirmCompletion = computed(() => {
    return !!this.tripEndDate && !this.completing() && !this.completionDocumentUploading();
  });

  totalExpenses = computed(() => {
    return (this.trip()?.expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
  });

  constructor() {
    effect(() => {
      void this.loadAttachmentPreviewUrls(this.trip()?.expenses || []);
    });

    effect(() => {
      const selectedTrip = this.trip();
      this.tripEndDate = selectedTrip?.endDate ? this.toDateInputValue(selectedTrip.endDate) : undefined;
      void this.hydrateCompletionDocument(selectedTrip?.completionDocument);
      void this.hydrateTripDocument(selectedTrip?.tripDocument);
    });
  }

  async ngOnInit() {
    await this.expenseCategoryService.getAll();
  }

  private async loadAttachmentPreviewUrls(expenses: TripExpense[]) {
    const urls = await Promise.all(
      expenses.map(async (expense) => {
        const url = await this.fileUploadService.resolveFileUrl(expense.receiptAttachment);
        return url ? [expense.id, url] : undefined;
      })
    );

    this.attachmentPreviewUrls.set(
      Object.fromEntries(urls.filter((entry): entry is [string, string] => !!entry))
    );
  }

  goBack() {
    this.confirmingComplete.set(false);
    this.close.emit();
  }

  canComplete = computed(() => {
    const status = this.trip()?.status;
    return (status === 'Pending payment' || status === 'Inprogress');
  });

  requestComplete() {
    this.confirmingComplete.set(true);
  }

  cancelComplete() {
    this.confirmingComplete.set(false);
  }

  confirmComplete() {
    const trip = this.trip();
    if (!trip) {
      return;
    }

    if (this.completionDocumentUploading()) {
      this.completionDocumentError.set('Wait for the document upload to finish before completing the trip.');
      return;
    }

    this.confirmingComplete.set(false);
    this.complete.emit({
      ...trip,
      completionDocument: this.completionDocumentPath() || undefined,
      endDate: this.tripEndDate
    });
  }

  private toDateInputValue(rawDate: Date | string | undefined): string | undefined {
    if (!rawDate) {
      return undefined;
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toDateValue(rawDate: Date | string | undefined): Date | null {
    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  onTripEndDateSelected(value: Date | null) {
    this.tripEndDate = value ? this.toDateInputValue(value) : undefined;
  }

  private async hydrateCompletionDocument(path: string | undefined) {
    this.completionDocumentPath.set(path || undefined);
    this.completionDocumentName.set(this.fileUploadService.getFileName(path));
    this.completionDocumentError.set(null);
    this.completionDocumentSuccess.set(null);

    if (!path) {
      this.completionDocumentUrl.set(undefined);
      return;
    }

    const url = await this.fileUploadService.resolveFileUrl(path);
    this.completionDocumentUrl.set(url);
  }

  private async hydrateTripDocument(path: string | undefined) {
    if (!path) {
      this.tripDocumentUrl.set(undefined);
      return;
    }

    const url = await this.fileUploadService.resolveFileUrl(path);
    this.tripDocumentUrl.set(url || undefined);
  }

  async onCompletionDocumentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : undefined;
    if (!file) {
      return;
    }

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext));
    if (!allowedMimeTypes.includes(file.type) && !hasAllowedExtension) {
      this.completionDocumentError.set('Only PDF or image files are allowed.');
      input.value = '';
      return;
    }

    this.completionDocumentError.set(null);
    this.completionDocumentSuccess.set(null);
    this.completionDocumentUploading.set(true);
    this.completionDocumentName.set(file.name);

    try {
      const uploaded = await this.fileUploadService.uploadFile(file);
      this.completionDocumentPath.set(uploaded.filePath);
      this.completionDocumentName.set(uploaded.fileName);
      this.completionDocumentUrl.set(uploaded.fileUrl);
      this.completionDocumentSuccess.set('Completion document uploaded successfully.');
    } catch (error) {
      this.completionDocumentError.set(String(error || 'Could not upload completion document.'));
    } finally {
      this.completionDocumentUploading.set(false);
      input.value = '';
    }
  }

  removeCompletionDocument() {
    this.completionDocumentPath.set(undefined);
    this.completionDocumentName.set(undefined);
    this.completionDocumentUrl.set(undefined);
    this.completionDocumentError.set(null);
    this.completionDocumentSuccess.set(null);
  }

  previewCompletionDocument() {
    const url = this.completionDocumentUrl();
    if (!url) {
      this.completionDocumentError.set('Document preview is not available.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  previewTripDocument() {
    const url = this.tripDocumentUrl();
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      [TripStatus.PENDING]: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      [TripStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 border-blue-200',
      [TripStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      [TripStatus.CANCELLED]: 'bg-red-50 text-red-600 border-red-200'
    };
    return colors[status] || colors[TripStatus.PENDING];
  }

  getExpenseCategoryName(expense: TripExpense): string {
    if (expense.category?.name) {
      return expense.category.name;
    }

    const category = this.expenseCategoryService.getById(expense.expenseId);
    return category?.name || 'Other';
  }

  getCategoryColor(categoryName: string | undefined): string {
    const colors: Record<string, string> = {
      'fuel': 'bg-red-50 text-[#f25f2f] border-red-100',
      'toll': 'bg-orange-50 text-orange-600 border-orange-100',
      'food': 'bg-amber-50 text-amber-600 border-amber-100',
      'accommodation': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'maintenance': 'bg-purple-50 text-purple-600 border-purple-100',
      'other': 'bg-gray-50 text-gray-600 border-gray-100'
    };
    const name = (categoryName || 'other').toLowerCase();
    return colors[name] || colors['other'];
  }

  getExpenseCategoryColor(expense: TripExpense): string {
    return this.getCategoryColor(this.getExpenseCategoryName(expense));
  }

  getExpenseAttachmentName(expense: TripExpense): string {
    return this.fileUploadService.getFileName(expense.receiptAttachment) || 'View receipt';
  }

  previewAttachment(expense: TripExpense) {
    const url = this.attachmentPreviewUrls()[expense.id];
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
