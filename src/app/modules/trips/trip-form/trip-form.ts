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
import { OffloadingPlaceService } from '../../../services/offloading-place.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { CommonService } from '../../../services/common.service';
import { NumberFormatDirective } from '../../../shared/directives/number-format';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import moment from 'moment';

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
  imports: [CommonModule, FormsModule, SaveArea, DecimalPipe, NumberFormatDirective, MatTooltipModule, MatDatepickerModule, MatNativeDateModule],
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
  private offloadingPlaceService = inject(OffloadingPlaceService);
  private fileUploadService = inject(FileUploadService);
  private commonService = inject(CommonService);

  trip = input<Trip | undefined>();
  trips = this.tripService.allTrips;
  close = output();

  tripDate: Date | string = '';
  endDate: Date | string = null;
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
  offloadingPlaceName = '';
  offloadingPlaceId = '';
  trailerId = '';
  cargoQuantity = null;
  docNumber = null;

  vehicles = this.vehicleService.allVehicles;
  trucks = computed(() => this.vehicles().filter((v) => v.type === 'TRUCK' && this.trips().filter((t) => t.status === TripStatus.IN_PROGRESS && t.vehicleId === v.id).length === 0 || this.trip()?.vehicleId === v.id));
  trailers = computed(() => this.vehicles().filter((v) => v.type === 'TRAILER' && this.trips().filter((t) => (t.status === TripStatus.IN_PROGRESS && t.trailerId === v.id)).length === 0 || this.trip()?.trailerId === v.id));
  drivers = this.driverService.allDrivers;
  filteredDrivers = computed(() => {
    const assignedDriverIds = this.trips()
      .filter((t) => t.status === TripStatus.IN_PROGRESS && t.driverId)
      .map((t) => t.driverId);
    return this.drivers().filter((d) => !assignedDriverIds.includes(d.id) || this.trip()?.driverId === d.id);
  });
  routes = this.routeService.allRoutes;
  customers = this.customerService.allCustomers;
  offloadingPlaces = this.offloadingPlaceService.all;
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
  busy = computed(() => this.loading() || this.pendingUploads() > 0 || this.tripDocumentUploading());
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  metadataLoading = signal(true);
  metadataError = signal<string | null>(null);
  isEditMode = computed(() => !!this.trip()?.id);
  deletedExpenseIds = signal<string[]>([]);
  initialTripState = signal<Trip | undefined>(undefined);
  tripDocumentPath = signal<string | undefined>(undefined);
  tripDocumentName = signal<string | undefined>(undefined);
  tripDocumentUrl = signal<string | undefined>(undefined);
  tripDocumentUploading = signal(false);
  tripDocumentError = signal<string | null>(null);
  tripDocumentSuccess = signal<string | null>(null);

  today = moment(new Date()).format('YYYY-MM-DD');

  expenseRows: ExpenseDraft[] = [this.createExpenseRow()];

  constructor() {
    effect(() => {
      this.populateFormFromTrip(this.trip());
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadFormMetadata();
  }

  async loadFormMetadata(): Promise<void> {
    this.metadataLoading.set(true);
    this.metadataError.set(null);

    try {
      await Promise.all([
        this.vehicleService.getAll(),
        this.driverService.getAll(),
        this.routeService.getAll(),
        this.cargoTypeService.getAll(),
        this.expenseCategoryService.getAll(),
        this.customerService.getAll(),
        this.offloadingPlaceService.getAll(),
      ]);
    } catch (error) {
      this.metadataError.set(String(error || 'Could not load trip metadata. Please try again.'));
    } finally {
      this.metadataLoading.set(false);
    }
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

  onOffloadingPlaceInput(name: string) {
    const matched = this.offloadingPlaceService.findByName(name);
    if (!matched) {
      return;
    }

    this.offloadingPlaceName = matched.name;
    this.offloadingPlaceId = matched.id;
  }

  private populateFormFromTrip(trip: Trip | undefined) {
    this.deletedExpenseIds.set([]);

    if (!trip) {
      this.tripDate = '';
      this.endDate = null;
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
      this.offloadingPlaceName = '';
      this.offloadingPlaceId = '';
      this.expenseRows = [this.createExpenseRow()];
      this.initialTripState.set(undefined);
      return;
    }
    this.tripDate = moment(new Date(trip.tripDate)).format('YYYY-MM-DD');
    this.endDate = trip.endDate ? moment(new Date(trip.endDate)).format('YYYY-MM-DD') : null;
    this.vehicleId = trip.vehicleId || '';
    this.trailerId = trip.trailerId || '';
    this.docNumber = trip.docNumber || '';
    this.cargoQuantity = trip.cargoQuantity || null;
    this.driverId = trip.driverId || '';
    this.routeId = trip.routeId || '';
    this.cargoTypeId = trip.cargoTypeId || '';
    this.revenue = String(trip.revenue ?? '');
    this.status = (trip.status || TripStatus.IN_PROGRESS) as TripStatus;
    this.notes = trip.notes || '';
    this.customerName = trip.customerName || trip.customer?.name || '';
    this.customerTIN = trip.customerTIN || trip.customer?.tin || '';
    this.customerPhone = trip.customerPhone || trip.customer?.phone || '';
    this.offloadingPlaceName = trip.offloadingPlaceName || '';
    this.offloadingPlaceId = trip.offloadingPlaceId || '';
    void this.hydrateTripDocument(trip.tripDocument);
    this.expenseRows = (trip.expenses || []).map((expense) => this.mapExpenseToDraft(expense));
    this.initialTripState.set(trip);
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

  toDateValue(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

  onTripDateChanged(value: Date | null) {
    this.tripDate = this.toDateString(value);
  }

  onExpenseDateChanged(rowId: string, value: Date | null) {
    this.updateExpenseRow(rowId, (row) => ({
      ...row,
      date: this.toDateString(value),
    }));
  }

  private async hydrateTripDocument(path: string | undefined) {
    this.tripDocumentPath.set(path || undefined);
    this.tripDocumentName.set(this.fileUploadService.getFileName(path));
    this.tripDocumentError.set(null);
    this.tripDocumentSuccess.set(null);

    if (!path) {
      this.tripDocumentUrl.set(undefined);
      return;
    }

    const url = await this.fileUploadService.resolveFileUrl(path);
    this.tripDocumentUrl.set(url);
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
    if (this.metadataLoading()) {
      this.errorMessage.set('Please wait, trip metadata is still loading.');
      return;
    }

    if (this.metadataError()) {
      this.errorMessage.set('Trip metadata failed to load. Retry loading metadata before saving.');
      return;
    }

    if (this.pendingUploads() > 0) {
      this.errorMessage.set('Wait for expense attachments to finish uploading before saving the trip.');
      return;
    }

    if (this.tripDocumentUploading()) {
      this.errorMessage.set('Wait for the trip document upload to finish before saving the trip.');
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
        offloadingPlaceName: this.offloadingPlaceName || undefined,
        offloadingPlaceId: this.offloadingPlaceId || undefined,
        trailerId: this.trailerId || undefined,
        cargoQuantity: this.cargoQuantity || undefined,
        docNumber: this.docNumber || undefined,
        tripDocument: this.tripDocumentPath() || undefined,
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
  get unitOfMeasurement() {
    const cargoType = this.cargoTypes().find((type) => type.id === this.cargoTypeId);
    return cargoType?.unitOfMeasure || '';
  }
  get hasChanges() {
    const initial = this.trip();
    if (
      !moment(new Date(this.tripDate)).isSame(moment(new Date(initial?.tripDate)))
      || this.vehicleId !== (initial?.vehicleId || '')
      || this.trailerId !== (initial?.trailerId || '')
      || this.driverId !== (initial?.driverId || '')
      || this.routeId !== (initial?.routeId || '')
      || this.cargoTypeId !== (initial?.cargoTypeId || '')
      || this.revenue !== String(initial?.revenue ?? '')
      || this.status !== (initial?.status || TripStatus.IN_PROGRESS)
      || this.notes !== (initial?.notes || '')
      || this.customerName !== (initial?.customerName || initial?.customer?.name || '')
      || this.customerTIN !== (initial?.customerTIN || initial?.customer?.tin || '')
      || this.customerPhone !== (initial?.customerPhone || initial?.customer?.phone || '')
      || this.offloadingPlaceName !== (initial?.offloadingPlaceName || initial?.offloadingPlace?.name || '')
      || this.trailerId !== (initial?.trailerId || '')
      || this.cargoQuantity !== (initial?.cargoQuantity || null)
      || this.docNumber !== (initial?.docNumber || null)
      || this.tripDocumentPath() !== (initial?.tripDocument || undefined)
      || JSON.stringify(this.expenseRows) !== JSON.stringify((initial?.expenses || []).map((expense) => this.mapExpenseToDraft(expense)))
    ) {
      return true;
    }
    return false;
  }

  get canSave() {
    return !this.loading() && !this.metadataLoading() && this.hasChanges && this.compulsoryFieldsFilled;
  }

  get compulsoryFieldsFilled() {
    return !!this.tripDate && !!this.vehicleId && !!this.trailerId && !!this.driverId && !!this.routeId && !!this.cargoTypeId && !!this.revenue && !!this.customerName && !!this.docNumber;
  }
}
