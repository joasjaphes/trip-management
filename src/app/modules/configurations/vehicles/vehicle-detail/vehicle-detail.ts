import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../../../models/vehicle.model';
import { VehicleService } from '../../../../services/vehicle.service';
import { VehiclePermitService } from '../../../../services/vehicle-permit.service';
import { FileUploadService } from '../../../../services/file-upload.service';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-detail.html'
})
export class VehicleDetail {
  private vehicleService = inject(VehicleService);
  private vehiclePermitService = inject(VehiclePermitService);
  private fileUploadService = inject(FileUploadService);

  vehicle = input<Vehicle | undefined>(undefined);
  close = output();

  private isDeleting = signal(false);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  loading = computed(() => this.isDeleting() || this.vehicleService.loading() || this.vehiclePermitService.loading());

  permitDetails = computed(() => {
    const v = this.vehicle();
    if (!v?.permits) return [];

    return v.permits.map((p) => ({
      id: p.id,
      description: p.description,
      startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : '-',
      endDate: p.endDate ? new Date(p.endDate).toLocaleDateString() : '-',
      attachment: p.attachment,
      attachmentName: this.fileUploadService.getFileName(p.attachment),
      status: p.endDate ? (new Date(p.endDate) > new Date() ? 'Valid' : 'Expired') : 'Unknown',
    }));
  });

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'valid':
        return 'text-emerald-600 bg-emerald-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  }

  async previewAttachment(attachmentPath: string | undefined) {
    if (!attachmentPath) return;

    const url = await this.fileUploadService.resolveFileUrl(attachmentPath);
    if (url) {
      window.open(url, '_blank');
    }
  }

  async deleteVehicle() {
    const v = this.vehicle();
    if (!v?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete vehicle ${v.registrationNo}? This action cannot be undone.`
    );
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set('Deleting vehicle...');

    try {
      await this.vehicleService.delete(v.id);
      this.actionMessage.set('Vehicle deleted successfully.');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.close.emit();
    } catch (err) {
      this.errorMessage.set(String(err || 'Could not delete vehicle. Please try again.'));
    } finally {
      this.isDeleting.set(false);
      this.actionMessage.set(null);
    }
  }

  goBack() {
    this.close.emit();
  }
}
