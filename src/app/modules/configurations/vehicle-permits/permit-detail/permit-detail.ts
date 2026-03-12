import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permit } from '../../../../models/permits.model';
import { PermitRegistrationService } from '../../../../services/permit-registration.service';

@Component({
  selector: 'app-permit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './permit-detail.html'
})
export class PermitDetail {
  private permitRegistrationService = inject(PermitRegistrationService);

  permit = input<Permit | undefined>(undefined);
  close = output();

  private isDeleting = signal(false);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  loading = this.permitRegistrationService.loading;

  getCreatedDate(): string {
    const p = this.permit();
    if (!p?.createdAt) return '-';
    return new Date(p.createdAt).toLocaleDateString();
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';
  }

  async deletePermit() {
    const p = this.permit();
    if (!p?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete permit "${p.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set('Deleting permit...');

    try {
      await this.permitRegistrationService.delete(p.id);
      this.actionMessage.set('Permit deleted successfully.');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.close.emit();
    } catch (err) {
      this.errorMessage.set(String(err || 'Could not delete permit. Please try again.'));
    } finally {
      this.isDeleting.set(false);
      this.actionMessage.set(null);
    }
  }

  goBack() {
    this.close.emit();
  }
}
