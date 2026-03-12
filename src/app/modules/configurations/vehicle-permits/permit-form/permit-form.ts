import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { PermitRegistrationService } from '../../../../services/permit-registration.service';

@Component({
  selector: 'app-permit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './permit-form.html'
})
export class PermitForm {
  private permitRegistrationService = inject(PermitRegistrationService);
  loading = this.permitRegistrationService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  permitName = '';
  authorizingBody = '';
  isActive = true;
  close = output();

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
    this.actionMessage.set('Saving permit...');

    try {
      await this.permitRegistrationService.create({
        name: this.permitName,
        authorizingBody: this.authorizingBody || undefined,
        isActive: this.isActive,
      });

      this.successMessage.set('Permit saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save permit. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
