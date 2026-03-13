import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { DriverService } from '../../../../services/driver.service';
import { FileUploadService } from '../../../../services/file-upload.service';
import { Driver } from '../../../../models/driver.model';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './driver-form.html'
})
export class DriverForm {
  private driverService = inject(DriverService);
  private fileUploadService = inject(FileUploadService);
  loading = this.driverService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  driver = input<Driver | undefined>();
  isEditMode = computed(() => !!this.driver()?.id);
  today = new Date()
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  dateOfBirth = '';
  driverId = '';
  address = '';
  licenseNumber = '';
  licenseClass = '';
  issuingAuthority = '';
  licenseExpiry = '';
  isActive = true;
  
  photoUrl = signal<string | undefined>(undefined);
  licenseAttachmentUrl = signal<string | undefined>(undefined);
  photoFileName = signal<string | undefined>(undefined);
  licenseFileName = signal<string | undefined>(undefined);
  photoIsUploading = signal(false);
  licenseIsUploading = signal(false);
  
  close = output();

  constructor() {
    effect(() => {
      const selectedDriver = this.driver();
      console.log('Selected driver changed:', selectedDriver);
      if (!selectedDriver) {
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.phone = '';
        this.dateOfBirth = '';
        this.driverId = '';
        this.address = '';
        this.licenseNumber = '';
        this.licenseClass = '';
        this.issuingAuthority = '';
        this.licenseExpiry = '';
        this.isActive = true;
        this.photoUrl.set(undefined);
        this.licenseAttachmentUrl.set(undefined);
        this.photoFileName.set(undefined);
        this.licenseFileName.set(undefined);
        return;
      }

      this.firstName = selectedDriver.firstName ?? '';
      this.lastName = selectedDriver.lastName ?? '';
      this.email = selectedDriver.email ?? '';
      this.phone = selectedDriver.phone ?? '';
      this.dateOfBirth = selectedDriver.dateOfBirth
        ? new Date(selectedDriver.dateOfBirth).toISOString().slice(0, 10)
        : '';
      // this.driverId = selectedDriver.driverId ?? '';
      this.address = selectedDriver.address ?? '';
      this.licenseNumber = selectedDriver.licenseNumber ?? '';
      this.licenseClass = selectedDriver.licenseClass ?? '';
      this.licenseExpiry = selectedDriver.licenseExpiryDate
        ? new Date(selectedDriver.licenseExpiryDate).toISOString().slice(0, 10)
        : '';
      this.isActive = selectedDriver.isActive;
      // Populate photo URL from existing driver
      if (selectedDriver.driverPhoto) {
        console.log('photo', selectedDriver.driverPhoto);
        if (/^https?:\/\//i.test(selectedDriver.driverPhoto)) {
          // Already a full URL — set synchronously so it shows on first render
          this.photoUrl.set(selectedDriver.driverPhoto);
          this.photoFileName.set(this.fileUploadService.getFileName(selectedDriver.driverPhoto));
        } else {
          // Relative path — resolve asynchronously
          this.populatePhotoUrl(selectedDriver.driverPhoto);
        }
      }

      // Populate license attachment URL from existing driver
      const frontPagePhoto = selectedDriver.licenseFrontPagePhoto;
      if (frontPagePhoto) {
        if (/^https?:\/\//i.test(frontPagePhoto)) {
          this.licenseAttachmentUrl.set(frontPagePhoto);
          this.licenseFileName.set(this.fileUploadService.getFileName(frontPagePhoto));
        } else {
          this.populateLicenseUrl(frontPagePhoto);
        }
      }
    });
  }

  private async populatePhotoUrl(photoPath: string): Promise<void> {
    try {
      const url = await this.fileUploadService.resolveFileUrl(photoPath);
      this.photoUrl.set(url);
      this.photoFileName.set(this.fileUploadService.getFileName(photoPath));
    } catch (err) {
      console.error('Failed to resolve photo URL:', err);
    }
  }

  private async populateLicenseUrl(licensePath: string): Promise<void> {
    try {
      const url = await this.fileUploadService.resolveFileUrl(licensePath);
      this.licenseAttachmentUrl.set(url);
      this.licenseFileName.set(this.fileUploadService.getFileName(licensePath));
    } catch (err) {
      console.error('Failed to resolve license URL:', err);
    }
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select an image file for the photo.');
      return;
    }

    this.photoIsUploading.set(true);
    this.errorMessage.set(null);

    try {
      const uploaded = await this.fileUploadService.uploadFile(file);
      this.photoUrl.set(uploaded.fileUrl);
      this.photoFileName.set(uploaded.fileName);
    } catch (err) {
      this.errorMessage.set(String(err || 'Failed to upload photo'));
    } finally {
      this.photoIsUploading.set(false);
      input.value = '';
    }
  }

  async onLicenseAttachmentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select an image file for the license attachment.');
      return;
    }

    this.licenseIsUploading.set(true);
    this.errorMessage.set(null);

    try {
      const uploaded = await this.fileUploadService.uploadFile(file);
      this.licenseAttachmentUrl.set(uploaded.fileUrl);
      this.licenseFileName.set(uploaded.fileName);
    } catch (err) {
      this.errorMessage.set(String(err || 'Failed to upload license attachment'));
    } finally {
      this.licenseIsUploading.set(false);
      input.value = '';
    }
  }

  removePhoto(): void {
    this.photoUrl.set(undefined);
    this.photoFileName.set(undefined);
  }

  removeLicenseAttachment(): void {
    this.licenseAttachmentUrl.set(undefined);
    this.licenseFileName.set(undefined);
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

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode() ? 'Updating driver...' : 'Saving driver...');

    try {
      const payload = {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email || undefined,
        phone: this.phone,
        address: this.address || undefined,
        dateOfBirth: this.dateOfBirth ? new Date(this.dateOfBirth) : undefined,
        licenseDetails: {
          licenseNumber: this.licenseNumber,
          issueDate: this.driver()?.licenseDetails?.issueDate
            ? new Date(this.driver()!.licenseDetails.issueDate)
            : new Date(),
          expiryDate: this.licenseExpiry ? new Date(this.licenseExpiry) : new Date(),
          licenseClass: this.licenseClass || 'Professional',
          frontPagePhoto: this.licenseAttachmentUrl() ?? this.driver()?.licenseDetails?.frontPagePhoto,
        },
        photo: this.photoUrl() ?? this.driver()?.photo,
        isActive: this.isActive,
      };

      if (this.isEditMode()) {
        await this.driverService.update(this.driver()!.id, payload);
      } else {
        await this.driverService.create(payload);
      }

      this.successMessage.set(this.isEditMode() ? 'Driver updated successfully.' : 'Driver saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save driver. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
