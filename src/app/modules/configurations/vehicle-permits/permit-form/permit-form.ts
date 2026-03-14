import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { PermitRegistrationService } from '../../../../services/permit-registration.service';
import { Permit } from '../../../../models/permits.model';
import { IssuingBodyService } from '../../../../services/issuing-body.service';

@Component({
  selector: 'app-permit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './permit-form.html'
})
export class PermitForm implements OnInit {
  private permitRegistrationService = inject(PermitRegistrationService);
  private issuingBodyService = inject(IssuingBodyService);
  
  permit = input<Permit | undefined>(undefined);
  loading = this.permitRegistrationService.loading;
  loadingIssuingBodies = this.issuingBodyService.loading;
  issuingBodies = this.issuingBodyService.allIssuingBodies;
  issuingBodyId = '';
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  permitName = '';
  authorizingBody = '';
  isActive = true;
  close = output();

  get isEditMode(): boolean {
    return !!this.permit()?.id;
  }

  ngOnInit(): void {
    this.issuingBodyService.getAll().then();
    const p = this.permit();
    if (p) {
      this.permitName = p.name;
      this.issuingBodyId = p.issuingBodyId || '';
      this.isActive = p.isActive;
    }
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
    this.actionMessage.set(this.isEditMode ? 'Updating permit...' : 'Saving permit...');

    try {
      if (this.isEditMode) {
        await this.permitRegistrationService.update(this.permit()!.id, {
          name: this.permitName,
          issuingBodyId: this.issuingBodyId || undefined,
          isActive: this.isActive,
        });
        this.successMessage.set('Permit updated successfully.');
      } else {
        await this.permitRegistrationService.create({
          name: this.permitName,
          issuingBodyId: this.issuingBodyId || undefined,
          isActive: this.isActive,
        });
        this.successMessage.set('Permit saved successfully.');
      }

      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save permit. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
