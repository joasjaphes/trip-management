import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { Trip, TripExpense, TripStatus } from '../../../models/trip.model';
import { CargoTypeService } from '../../../services/cargo-type.service';
import { DriverService } from '../../../services/driver.service';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { RouteService } from '../../../services/route.service';
import { TripExpenseService } from '../../../services/trip-expense.service';
import { TripService } from '../../../services/trip.service';
import { VehicleService } from '../../../services/vehicle.service';
import { CustomerService } from '../../../services/customer.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { CommonService } from '../../../services/common.service';

type ExpenseDraft = {
  id: string;
  expenseRecordId?: string;
  expenseId: string;
  amount: string;
  date: string;
  attachment?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isUploading?: boolean;
};

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea, DecimalPipe],
  templateUrl: './trip-form.html',
})
export class TripForm implements OnInit {
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private routeService = inject(RouteService);
  private cargoTypeService = inject(CargoTypeService);
  private expenseCategoryService = inject(ExpenseCategoryService);
  private tripExpenseService = inject(TripExpenseService);
  private customerService = inject(CustomerService);
  private fileUploadService = inject(FileUploadService);
  private commonService = inject(CommonService);

  trip = input<Trip | undefined>();
  close = output();

  tripDate = '';
  endDate = '';
  vehicleId = '';
  driverId = '';
  routeId = '';
  cargoTypeId = '';
  revenue = '';
  status: TripStatus = TripStatus.IN_PROGRESS;
  notes = '';
  customerName = '';
  customerTIN = '';
  customerPhone = '';

  vehicles = this.vehicleService.allVehicles;
  drivers = this.driverService.allDrivers;
  routes = this.routeService.allRoutes;
  customers = this.customerService.allCustomers;
  cargoTypes = computed(() =>
    this.cargoTypeService.allCargoTypes().filter((cargoType) => cargoType.isActive)
  );
  expenseCategories = computed(() =>
    this.expenseCategoryService
      .allCategories()
      .filter((category) => category.isActive || category.status === 'Active')
  );
  loading = computed(() => this.tripService.loading() || this.tripExpenseService.loading());
  pendingUploads = signal(0);
  busy = computed(() => this.loading() || this.pendingUploads() > 0);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  isEditMode = computed(() => !!this.trip()?.id);
  deletedExpenseIds = signal<string[]>([]);

  expenseRows: ExpenseDraft[] = [this.createExpenseRow()];

  constructor() {
    effect(() => {
      this.populateFormFromTrip(this.trip());
    });
  }

  ngOnInit() {
    Promise.all([
      this.vehicleService.getAll(),
      this.driverService.getAll(),
      this.routeService.getAll(),
      this.cargoTypeService.getAll(),
      this.expenseCategoryService.getAll(),
      this.customerService.getAll(),
    ]).then();
  }

  onCustomerNameInput(name: string) {
    const matched = this.customerService.findByName(name);
    if (!matched) {
      return;
    }

    this.customerName = matched.name;
    this.customerTIN = matched.tin;
    this.customerPhone = matched.phone || '';
  }

  private populateFormFromTrip(trip: Trip | undefined) {
    this.deletedExpenseIds.set([]);

    if (!trip) {
      this.tripDate = '';
      this.endDate = '';
      this.vehicleId = '';
      this.driverId = '';
      this.routeId = '';
      this.cargoTypeId = '';
      this.revenue = '';
      this.status = TripStatus.IN_PROGRESS;
      this.notes = '';
      this.customerName = '';
      this.customerTIN = '';
      this.customerPhone = '';
      this.expenseRows = [this.createExpenseRow()];
      return;
    }
    console.log('Populating form with trip data', trip);
    this.tripDate = trip.tripDate ? new Date(trip.tripDate).toISOString().split('T')[0] : '';
    this.endDate = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '';
    this.vehicleId = trip.vehicleId || '';
    this.driverId = trip.driverId || '';
    this.routeId = trip.routeId || '';
    this.cargoTypeId = trip.cargoTypeId || '';
    this.revenue = String(trip.revenue ?? '');
    this.status = (trip.status || TripStatus.IN_PROGRESS) as TripStatus;
    this.notes = trip.notes || '';
    this.customerName = trip.customerName || trip.customer?.name || '';
    this.customerTIN = trip.customerTIN || trip.customer?.tin || '';
    this.customerPhone = trip.customerPhone || trip.customer?.phone || '';
    this.expenseRows = (trip.expenses || []).map((expense) => this.mapExpenseToDraft(expense));
  }

  private mapExpenseToDraft(expense: TripExpense): ExpenseDraft {
    return {
      id: expense.id,
      expenseRecordId: expense.id,
      expenseId: expense.expenseId || '',
      amount: String(expense.amount || ''),
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      attachment: expense.receiptAttachment,
      attachmentName: this.fileUploadService.getFileName(expense.receiptAttachment),
      attachmentUrl: undefined,
      isUploading: false,
    };
  }

  private createExpenseRow(): ExpenseDraft {
    return {
      id: this.commonService.makeid(),
      expenseRecordId: undefined,
      expenseId: '',
      amount: '',
      date: '',
      attachment: undefined,
      attachmentName: undefined,
      attachmentUrl: undefined,
      isUploading: false,
    };
  }

  private updateExpenseRow(rowId: string, updater: (row: ExpenseDraft) => ExpenseDraft) {
    this.expenseRows = this.expenseRows.map((row) =>
      row.id === rowId ? updater(row) : row
    );
  }

  private async ensureAttachmentUrl(rowId: string): Promise<string | undefined> {
    const row = this.expenseRows.find((item) => item.id === rowId);
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

    this.updateExpenseRow(rowId, (item) => ({
      ...item,
      attachmentUrl: resolvedUrl,
    }));

    return resolvedUrl;
  }

  addExpenseRow() {
    this.expenseRows = [...this.expenseRows, this.createExpenseRow()];
  }

  removeExpenseRow(id: string) {
    const rowToRemove = this.expenseRows.find((row) => row.id === id);
    if (rowToRemove?.expenseRecordId) {
      this.deletedExpenseIds.update((ids) =>
        ids.includes(rowToRemove.expenseRecordId!) ? ids : [...ids, rowToRemove.expenseRecordId!]
      );
    }

    this.expenseRows = this.expenseRows.filter((row) => row.id !== id);
    if (this.expenseRows.length === 0) {
      this.expenseRows = [this.createExpenseRow()];
    }
  }

  async onExpenseAttachmentSelected(event: Event, rowId: string) {
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
    this.updateExpenseRow(rowId, (row) => ({
      ...row,
      attachmentName: file.name,
      isUploading: true,
    }));

    try {
      const uploadedFile = await this.fileUploadService.uploadFile(file);
      this.updateExpenseRow(rowId, (row) => ({
        ...row,
        attachment: uploadedFile.filePath,
        attachmentName: uploadedFile.fileName,
        attachmentUrl: uploadedFile.fileUrl,
        isUploading: false,
      }));
      this.successMessage.set('Expense attachment uploaded successfully.');
    } catch (error) {
      this.updateExpenseRow(rowId, (row) => ({
        ...row,
        isUploading: false,
      }));
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
      this.errorMessage.set('Attachment preview is not available for this expense.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  goBack() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 8000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit() {
    if (this.pendingUploads() > 0) {
      this.errorMessage.set('Wait for expense attachments to finish uploading before saving the trip.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode() ? 'Updating trip...' : 'Saving trip and expenses...');

    try {
      const payload = {
        tripDate: this.tripDate ? new Date(this.tripDate) : new Date(),
        endDate: this.endDate ? new Date(this.endDate) : undefined,
        vehicleId: this.vehicleId,
        driverId: this.driverId,
        routeId: this.routeId,
        cargoTypeId: this.cargoTypeId || undefined,
        customerName: this.customerName || undefined,
        customerTIN: this.customerTIN || undefined,
        customerPhone: this.customerPhone || undefined,
        revenue: Number(this.revenue || 0),
        income: Number(this.revenue || 0),
        status: this.status,
        notes: this.notes || undefined,
      };

      const editingTrip = this.trip();
      let tripId = editingTrip?.id;

      if (tripId) {
        let status = this.status;
        if (this.endDate && this.trip().paidAmount < this.trip().revenue) {
          status = TripStatus.PENDING;
        } else {
          status = this.status;
        }
        await this.tripService.update(tripId, {
          ...payload,
          status
        });
      } else {
        tripId = await this.tripService.create(payload);
      }

      if (!tripId) {
        throw 'Trip could not be saved.';
      }

      if (this.isEditMode() && this.deletedExpenseIds().length > 0) {
        for (const expenseId of this.deletedExpenseIds()) {
          await this.tripExpenseService.delete(expenseId);
        }
      }

      const expensesToSave = this.expenseRows.filter((row) => row.expenseId);

      await Promise.all(
        expensesToSave.map((row) => {
          const parsedAmount = row.amount ? Number(row.amount) : undefined;
          const expensePayload = {
            tripId,
            expenseId: row.expenseId,
            amount:
              parsedAmount !== undefined && !Number.isNaN(parsedAmount)
                ? parsedAmount
                : undefined,
            date: row.date || undefined,
            receiptAttachment: row.attachment || undefined,
          };

          if (row.expenseRecordId) {
            return this.tripExpenseService.update(row.expenseRecordId, expensePayload);
          }

          return this.tripExpenseService.create(expensePayload);
        })
      );

      this.deletedExpenseIds.set([]);

      this.successMessage.set(this.isEditMode() ? 'Trip updated successfully.' : 'Trip saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save trip. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
