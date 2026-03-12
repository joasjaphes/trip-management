import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { VehicleService } from '../../../../services/vehicle.service';
import { PermitRegistrationService } from '../../../../services/permit-registration.service';
import { VehiclePermitService } from '../../../../services/vehicle-permit.service';
import { FileUploadService } from '../../../../services/file-upload.service';
import { Vehicle } from '../../../../models/vehicle.model';
import { CommonService } from '../../../../services/common.service';

interface PermitRow {
  id: string;
  /** id of the persisted VehiclePermit record (undefined = new/unsaved) */
  permitRecordId?: string;
  description: string;
  startDate: string;
  endDate: string;
  /** stored path returned from upload endpoint */
  attachmentPath?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isUploading?: boolean;
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './vehicle-form.html'
})
export class VehicleForm implements OnInit {
  private vehicleService = inject(VehicleService);
  private permitRegistrationService = inject(PermitRegistrationService);
  private vehiclePermitService = inject(VehiclePermitService);
  private fileUploadService = inject(FileUploadService);
  private commonService = inject(CommonService);

  /** Pass a vehicle to switch to edit mode */
  vehicle = input<Vehicle | undefined>(undefined);

  private isSubmitting = signal(false);
  pendingUploads = signal(0);

  loading = computed(() =>
    this.isSubmitting() ||
    this.pendingUploads() > 0 ||
    this.vehicleService.loading() ||
    this.vehiclePermitService.loading()
  );

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  deletingPermitId = signal<string | null>(null);

  registeredPermits = computed(() =>
    this.permitRegistrationService.allPermits().filter((permit) => permit.isActive)
  );

  get isEditMode(): boolean {
    return !!this.vehicle()?.id;
  }

  registrationNo = '';
  year = '';
  tankCapacity = '';
  mileagePerFullTank = '';
  isActive = true;

  permits: PermitRow[] = [];
  /** track which existing permit record ids were removed, so we can delete them on save */
  private removedPermitRecordIds: string[] = [];

  close = output();

  async ngOnInit(): Promise<void> {
    await this.permitRegistrationService.getAll();
    const v = this.vehicle();
    if (v) {
      this.populateFromVehicle(v);
    }
  }

  private populateFromVehicle(vehicle: Vehicle) {
    this.registrationNo = vehicle.registrationNo;
    this.year = vehicle.registrationYear ? String(vehicle.registrationYear) : '';
    this.tankCapacity = String(vehicle.tankCapacity ?? '');
    this.mileagePerFullTank = String(vehicle.mileagePerFullTank ?? '');
    this.isActive = vehicle.isActive;

    this.permits = (vehicle.permits || []).map((p) => ({
      id: this.commonService.makeid(),
      permitRecordId: p.id,
      description: p.description,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      attachmentPath: p.attachment,
      attachmentName: this.fileUploadService.getFileName(p.attachment),
      attachmentUrl: undefined,
      isUploading: false,
    }));

    // Resolve attachment URLs in the background
    void this.hydratePermitUrls();
  }

  private async hydratePermitUrls() {
    const hydrated = await Promise.all(
      this.permits.map(async (p) => ({
        ...p,
        attachmentUrl: p.attachmentUrl || await this.fileUploadService.resolveFileUrl(p.attachmentPath),
      }))
    );
    this.permits = hydrated;
  }

  goBack() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  addPermit() {
    this.permits = [
      ...this.permits,
      {
        id: this.commonService.makeid(),
        description: '',
        startDate: '',
        endDate: '',
        isUploading: false,
      },
    ];
  }

  removePermit(id: string) {
    const permit = this.permits.find((p) => p.id === id);
    if (permit?.permitRecordId) {
      this.removedPermitRecordIds.push(permit.permitRecordId);
    }
    this.permits = this.permits.filter((p) => p.id !== id);
  }

  async onPermitFileSelected(event: Event, permitId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMessage.set(null);
    this.actionMessage.set(`Uploading ${file.name}...`);
    this.pendingUploads.update((c) => c + 1);

    this.permits = this.permits.map((p) =>
      p.id === permitId ? { ...p, attachmentName: file.name, isUploading: true } : p
    );

    try {
      const uploaded = await this.fileUploadService.uploadFile(file);
      this.permits = this.permits.map((p) =>
        p.id === permitId
          ? {
              ...p,
              attachmentPath: uploaded.filePath,
              attachmentName: uploaded.fileName,
              attachmentUrl: uploaded.fileUrl,
              isUploading: false,
            }
          : p
      );
      this.successMessage.set('Permit attachment uploaded.');
    } catch (err) {
      this.permits = this.permits.map((p) =>
        p.id === permitId ? { ...p, isUploading: false } : p
      );
      this.errorMessage.set(String(err || 'Upload failed. Please try again.'));
    } finally {
      this.pendingUploads.update((c) => c - 1);
      this.actionMessage.set(null);
      input.value = '';
    }
  }

  async previewPermitAttachment(permitId: string) {
    const permit = this.permits.find((p) => p.id === permitId);
    if (!permit) return;

    let url = permit.attachmentUrl;
    if (!url && permit.attachmentPath) {
      url = await this.fileUploadService.resolveFileUrl(permit.attachmentPath);
      this.permits = this.permits.map((p) => (p.id === permitId ? { ...p, attachmentUrl: url } : p));
    }

    if (url) {
      window.open(url, '_blank');
    }
  }

  reset() {
    this.registrationNo = '';
    this.year = '';
    this.tankCapacity = '';
    this.mileagePerFullTank = '';
    this.isActive = true;
    this.permits = [];
    this.removedPermitRecordIds = [];
  }

  async onSubmit() {
    if (this.loading()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const vehiclePayload = {
      registrationNo: this.registrationNo,
      registrationYear: this.year ? Number(this.year) : undefined,
      tankCapacity: Number(this.tankCapacity),
      mileagePerFullTank: Number(this.mileagePerFullTank),
      currentMileage: undefined,
      permits: [],
      isActive: this.isActive,
    };

    try {
      if (this.isEditMode) {
        // ── Edit mode ──
        const vehicleId = this.vehicle()!.id;
        this.actionMessage.set('Updating vehicle...');
        await this.vehicleService.update(vehicleId, vehiclePayload);

        // Delete removed permits
        if (this.removedPermitRecordIds.length > 0) {
          this.actionMessage.set('Removing old permits...');
          await Promise.all(this.removedPermitRecordIds.map((id) => this.vehiclePermitService.delete(id)));
          this.removedPermitRecordIds = [];
        }

        // Save new permits (those without a permitRecordId)
        const newPermits = this.permits.filter((p) => !p.permitRecordId);
        if (newPermits.length > 0) {
          this.actionMessage.set('Saving new permits...');
          await Promise.all(
            newPermits.map((p) =>
              this.vehiclePermitService.create({
                id: this.commonService.makeid(),
                description: p.description,
                startDate: new Date(p.startDate),
                endDate: new Date(p.endDate),
                attachment: p.attachmentPath,
                vehicleId,
              })
            )
          );
        }

        // Update existing permits that already have a record id
        const existingPermits = this.permits.filter((p) => !!p.permitRecordId);
        if (existingPermits.length > 0) {
          this.actionMessage.set('Updating permits...');
          await Promise.all(
            existingPermits.map((p) =>
              this.vehiclePermitService.update(p.permitRecordId!, {
                description: p.description,
                startDate: new Date(p.startDate),
                endDate: new Date(p.endDate),
                attachment: p.attachmentPath,
                vehicleId,
              })
            )
          );
        }

        this.successMessage.set('Vehicle updated successfully.');
      } else {
        // ── Add mode ──
        this.actionMessage.set('Saving vehicle...');
        const vehicleId = await this.vehicleService.create(vehiclePayload);

        if (this.permits.length > 0) {
          this.actionMessage.set('Saving permits...');
          await Promise.all(
            this.permits.map((p) =>
              this.vehiclePermitService.create({
                id: this.commonService.makeid(),
                description: p.description,
                startDate: new Date(p.startDate),
                endDate: new Date(p.endDate),
                attachment: p.attachmentPath,
                vehicleId,
              })
            )
          );
        }

        this.successMessage.set('Vehicle saved successfully.');
      }

      await this.waitForLoadingToFinish();
      this.reset();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save vehicle. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.isSubmitting.set(false);
    }
  }
}

