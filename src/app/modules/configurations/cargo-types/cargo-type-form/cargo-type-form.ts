import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { CargoTypeService } from '../../../../services/cargo-type.service';

@Component({
  selector: 'app-cargo-type-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './cargo-type-form.html',
})
export class CargoTypeForm {
  private cargoTypeService = inject(CargoTypeService);
  loading = this.cargoTypeService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  name = '';
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
    this.actionMessage.set('Saving cargo type...');

    try {
      await this.cargoTypeService.create({
        name: this.name,
        isActive: this.isActive,
      });

      this.successMessage.set('Cargo type saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save cargo type. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
