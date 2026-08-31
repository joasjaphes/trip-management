import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Trip } from '../../../models/trip.model';
import { AdditionalTripService } from '../../../services/additional-trip.service';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FileUploadService } from '../../../services/file-upload.service';


type AdditionalTripDraft = {
  tripReferenceNumber: string;
  startDate: string;
  endDate: string;
  revenue: number;
  fromLocation: string;
  toLocation: string;
  description: string;
  currency: string;
  docNumber: string;
  customer: string;
  exchangeRate: number;
  equivalentAmount: number;
};

@Component({
  selector: 'app-additional-trip-form',
  imports: [CommonModule, FormsModule, SaveArea, MatDatepickerModule],
  templateUrl: './additional-trip-form.html',
})
export class AdditionalTripForm {
  private additionalTripService = inject(AdditionalTripService);
  private fileUploadService = inject(FileUploadService);


  trip = input<Trip | undefined>();
  close = output<void>();
  minDate = computed(() => this.trip()?.tripDate || '');
  maxDate = signal(new Date());

  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  draft = signal<AdditionalTripDraft>({
    tripReferenceNumber: '',
    startDate: '',
    endDate: '',
    revenue: 0,
    fromLocation: '',
    toLocation: '',
    description: '',
    docNumber: '',
    customer: '',
    currency: 'TZS',
    exchangeRate: 1,
    equivalentAmount: 0,
  });

  currencies = ['TZS', 'USD'];
  tripDocumentPath = signal<string | undefined>(undefined);
  tripDocumentName = signal<string | undefined>(undefined);
  tripDocumentUrl = signal<string | undefined>(undefined);
  tripDocumentUploading = signal(false);
  tripDocumentError = signal<string | null>(null);
  tripDocumentSuccess = signal<string | null>(null);
  busy = computed(() =>  this.tripDocumentUploading());


  canSave = computed(() => {
    const row = this.draft();
    return !!row.startDate && !!row.fromLocation.trim() && !!row.toLocation.trim() && Number(row.revenue) > 0;
  });

  referenceTripLabel = computed(() => {
    const currentTrip = this.trip();
    if (!currentTrip) {
      return 'No trip selected';
    }

    return currentTrip.tripReferenceNumber || currentTrip.route?.name || currentTrip.id;
  });

  updateField(field: keyof AdditionalTripDraft, value: string): void {
    this.draft.update((draft) => ({
      ...draft,
      [field]: field === 'revenue' ? Number(value || 0) : value,
    }));
  }

  toDateValue(rawDate: Date | string | undefined): Date | null {
    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }


  goBack(): void {
    this.close.emit();
  }

  async onSubmit(): Promise<void> {
    const currentTrip = this.trip();
    if (!currentTrip?.id) {
      this.errorMessage.set('Select a valid reference trip before saving.');
      return;
    }

    if (!this.canSave()) {
      this.errorMessage.set('Start date, from location, to location, and revenue are required.');
      return;
    }

    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.actionMessage.set('Saving additional trip...');

    try {
      const row = this.draft();
      await this.additionalTripService.create({
        startDate: row.startDate,
        endDate: row.endDate || undefined,
        revenue: Number(row.revenue),
        referenceTripId: currentTrip.id,
        fromLocation: row.fromLocation.trim(),
        toLocation: row.toLocation.trim(),
        description: row.description.trim() || undefined,
        docNumber: row.docNumber.trim() || undefined,
        attachment: this.tripDocumentPath() || '',
        currency: row.currency,
        customer: row.customer.trim() || undefined,
        exchangeRate: Number(row.exchangeRate),
        equivalentAmount: Number(row.equivalentAmount),
      });

      this.successMessage.set('Additional trip saved successfully.');
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save additional trip. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.saving.set(false);
    }
  }

  async onTripDocumentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : undefined;
    if (!file) {
      return;
    }

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext));
    if (!allowedMimeTypes.includes(file.type) && !hasAllowedExtension) {
      this.tripDocumentError.set('Only PDF or image files are allowed.');
      input.value = '';
      return;
    }

    this.tripDocumentError.set(null);
    this.tripDocumentSuccess.set(null);
    this.tripDocumentUploading.set(true);
    this.tripDocumentName.set(file.name);

    try {
      const uploaded = await this.fileUploadService.uploadFile(file);
      this.tripDocumentPath.set(uploaded.filePath);
      this.tripDocumentName.set(uploaded.fileName);
      this.tripDocumentUrl.set(uploaded.fileUrl);
      this.tripDocumentSuccess.set('Trip document uploaded successfully.');
    } catch (error) {
      this.tripDocumentError.set(String(error || 'Could not upload trip document. Please try again.'));
    } finally {
      this.tripDocumentUploading.set(false);
      input.value = '';
    }
  }

  removeTripDocument() {
    this.tripDocumentPath.set(undefined);
    this.tripDocumentName.set(undefined);
    this.tripDocumentUrl.set(undefined);
    this.tripDocumentError.set(null);
    this.tripDocumentSuccess.set(null);
  }

  previewTripDocument() {
    const url = this.tripDocumentUrl();
    if (!url) {
      this.tripDocumentError.set('Document preview is not available.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
