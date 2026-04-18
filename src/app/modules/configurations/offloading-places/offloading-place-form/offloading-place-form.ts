import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OffloadingPlaceService } from '../../../../services/offloading-place.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { OffloadingPlace } from '../../../../models/offloading-place.model';

@Component({
  selector: 'app-offloading-place-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './offloading-place-form.html',
})
export class OffloadingPlaceForm implements OnInit {
  private offloadingPlaceService = inject(OffloadingPlaceService);

  loading = this.offloadingPlaceService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  currentOffloadingPlace = input<OffloadingPlace | null>(null);
  editMode = signal(false);
  close = output();
  saving = signal(false);

  name = '';
  latitude = '';
  longitude = '';

  ngOnInit(): void {
    const current = this.currentOffloadingPlace();
    if (current) {
      this.editMode.set(true);
      this.name = current.name;
      this.latitude = current.latitude != null ? String(current.latitude) : '';
      this.longitude = current.longitude != null ? String(current.longitude) : '';
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

  private parseCoordinate(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : NaN;
  }

  async onSubmit() {
    if (!this.name.trim()) {
      this.errorMessage.set('Offloading place name is required.');
      return;
    }

    const latitude = this.parseCoordinate(this.latitude);
    const longitude = this.parseCoordinate(this.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      this.errorMessage.set('Latitude and longitude must be valid numbers.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving offloading place...');

    try {
      if (this.editMode()) {
        await this.offloadingPlaceService.update(this.currentOffloadingPlace()!.id, {
          name: this.name.trim(),
          latitude,
          longitude,
        });
      } else {
        await this.offloadingPlaceService.create({
          name: this.name.trim(),
          latitude,
          longitude,
        });
      }

      this.successMessage.set(this.editMode() ? 'Offloading place updated successfully.' : 'Offloading place saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save offloading place. Please try again.'));
    } finally {
      this.saving.set(false);
      this.actionMessage.set(null);
    }
  }
}
