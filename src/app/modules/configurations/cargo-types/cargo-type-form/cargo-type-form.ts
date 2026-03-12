import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { CargoTypeService } from '../../../../services/cargo-type.service';
import { CargoType } from '../../../../models/cargo-type.model';

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

  saving = signal(false);
  cargoType = input<CargoType | undefined>();
  isEditMode = computed(() => !!this.cargoType()?.id);

  name = '';
  isActive = true;
  close = output();

  constructor() {
    effect(() => {
      const ct = this.cargoType();
      if (ct) {
        this.name = ct.name;
        this.isActive = ct.isActive;
      } else {
        this.name = '';
        this.isActive = true;
      }
    });
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
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode() ? 'Updating cargo type...' : 'Saving cargo type...');

    try {
      if (this.isEditMode()) {
        await this.cargoTypeService.update(this.cargoType()!.id, {
          name: this.name,
          isActive: this.isActive,
        });
        // this.successMessage.set('Cargo type updated successfully.');
      } else {
        await this.cargoTypeService.create({
          name: this.name,
          isActive: this.isActive,
        });
      }

      this.successMessage.set(this.isEditMode() ? 'Cargo type updated successfully.' : 'Cargo type saved successfully.');
      this.saving.set(false);
      this.close.emit();
      // await this.waitForLoadingToFinish();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save cargo type. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.saving.set(false);

    }
  }
}
