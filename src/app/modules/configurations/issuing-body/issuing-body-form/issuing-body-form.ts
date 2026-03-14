import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { IssuingBodyService } from '../../../../services/issuing-body.service';
import { IssuingBody } from '../../../../models/issuing-body.model';
@Component({
  selector: 'app-issuing-body-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './issuing-body-form.html',
})
export class IssuingBodyForm {
  private issuingBodyService = inject(IssuingBodyService);
  loading = this.issuingBodyService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  description = '';

  saving = signal(false);
  issuingBody = input<IssuingBody | undefined>();
  isEditMode = computed(() => !!this.issuingBody()?.id);

  name = '';
  isActive = true;
  close = output();

  constructor() {
    effect(() => {
      const ib = this.issuingBody();
      if (ib) {
        this.name = ib.name;
        this.description = ib.description ?? '';
        this.isActive = ib.isActive;
      } else {
        this.name = '';
        this.description = '';
        this.isActive = true;
      }
    });
  }

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode() ? 'Updating issuing body...' : 'Saving issuing body...');

    try {
      if (this.isEditMode()) {
        await this.issuingBodyService.update(this.issuingBody()!.id, {
          name: this.name,
          description: this.description,
          isActive: this.isActive,
        });
        // this.successMessage.set('Issuing body updated successfully.');
      } else {
        await this.issuingBodyService.create({
          name: this.name,
          description: this.description,
          isActive: this.isActive,
        });
      }

      this.successMessage.set(this.isEditMode() ? 'Issuing body updated successfully.' : 'Issuing body saved successfully.');
      this.saving.set(false);
      this.close.emit();
      // await this.waitForLoadingToFinish();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save issuing body. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.saving.set(false);

    }
  }
}
