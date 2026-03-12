import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Driver } from '../../../../models/driver.model';
import { FileUploadService } from '../../../../services/file-upload.service';

@Component({
  selector: 'app-driver-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-detail.html'
})
export class DriverDetail {
  driver = input<Driver | undefined>();
  close = output();

  driverPhotoUrl = signal<string | undefined>(undefined);
  licensePhotoUrl = signal<string | undefined>(undefined);

  fullName = computed(() => {
    const currentDriver = this.driver();
    const firstName = currentDriver?.firstName?.trim() ?? '';
    const lastName = currentDriver?.lastName?.trim() ?? '';
    const name = `${firstName} ${lastName}`.trim();
    return name || 'Unknown driver';
  });

  initials = computed(() => {
    const currentDriver = this.driver();
    const first = currentDriver?.firstName?.charAt(0) ?? '';
    const last = currentDriver?.lastName?.charAt(0) ?? '';
    const value = `${first}${last}`.trim().toUpperCase();
    return value || 'NA';
  });

  constructor(
    private router: Router,
    private fileUploadService: FileUploadService
  ) {
    effect(() => {
      const currentDriver = this.driver();

      if (!currentDriver) {
        this.driverPhotoUrl.set(undefined);
        this.licensePhotoUrl.set(undefined);
        return;
      }

      console.log('Current driver in effect:', currentDriver);

      void this.setImageUrl(currentDriver.driverPhoto ?? currentDriver.photo, this.driverPhotoUrl);
      void this.setImageUrl(
        currentDriver.licenseFrontPagePhoto ?? currentDriver.licenseDetails?.frontPagePhoto,
        this.licensePhotoUrl
      );
    });
  }

  private async setImageUrl(
    sourcePath: string | undefined,
    destination: ReturnType<typeof signal<string | undefined>>
  ): Promise<void> {
    if (!sourcePath) {
      destination.set(undefined);
      return;
    }

    try {
      const resolvedUrl = await this.fileUploadService.resolveFileUrl(sourcePath);
      destination.set(resolvedUrl);
    } catch {
      destination.set(undefined);
    }
  }

  getLicenseNumber(): string {
    return this.driver()?.licenseNumber ?? this.driver()?.licenseDetails?.licenseNumber ?? 'Not provided';
  }

  getLicenseClass(): string {
    return this.driver()?.licenseClass ?? this.driver()?.licenseDetails?.licenseClass ?? 'Not set';
  }

  getLicenseExpiryDate(): Date | undefined {
    const expiry = this.driver()?.licenseExpiryDate ?? this.driver()?.licenseDetails?.expiryDate;
    if (!expiry) {
      return undefined;
    }

    const parsed = new Date(expiry);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  getLicenseStatus(): string {
    const expiry = this.getLicenseExpiryDate();
    if (!expiry) {
      return 'Unknown';
    }

    const days = this.getDaysUntil(expiry);
    if (days < 0) {
      return 'Expired';
    }

    if (days <= 30) {
      return 'Expiring Soon';
    }

    return 'Valid';
  }

  getLicenseStatusClass(): string {
    const status = this.getLicenseStatus();
    switch (status) {
      case 'Valid':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Expiring Soon':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Expired':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  getStatusClass(): string {
    return this.driver()?.isActive
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-gray-100 text-gray-600 border border-gray-200';
  }

  getDaysUntilLicenseExpiry(): string {
    const expiry = this.getLicenseExpiryDate();
    if (!expiry) {
      return 'N/A';
    }

    const days = this.getDaysUntil(expiry);
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    }

    if (days === 0) {
      return 'Expires today';
    }

    return `${days} days left`;
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) {
      return 'Not provided';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Not provided';
    }

    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private getDaysUntil(expiry: Date): number {
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  goBack() {
    if (this.driver()) {
      this.close.emit();
      return;
    }

    this.router.navigate(['/drivers']);
  }
}
