import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Trip } from '../../../models/trip.model';
import { TripService } from '../../../services/trip.service';
import { SaveArea } from '../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-trip-actual-position-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './trip-actual-position-manage.html',
})
export class TripActualPositionManage {
  private tripService = inject(TripService);

  trip = input<Trip | undefined>();
  close = output();
  saved = output();

  loading = computed(() => this.tripService.loading());
  actualPosition = '';
  initialPosition = '';
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  hasChanges(): boolean {
    return this.actualPosition.trim() !== this.initialPosition;
  }

  constructor() {
    effect(() => {
      const position = (this.trip()?.tripActualPosition || '').trim();
      this.actualPosition = position;
      this.initialPosition = position;
      this.error.set(null);
      this.successMessage.set(null);
      this.actionMessage.set(null);
    });
  }

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    const currentTrip = this.trip();
    const position = this.actualPosition.trim();

    if (!currentTrip?.id) {
      this.error.set('Trip not found.');
      return;
    }

    if (!position) {
      this.error.set('Please enter the current position.');
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Updating trip position...');

    try {
      await this.tripService.updateActualPosition(currentTrip.id, position);
      this.initialPosition = position;
      this.successMessage.set('Trip actual position updated successfully.');
      this.saved.emit();
      this.close.emit();
    } catch (err) {
      this.error.set(String(err || 'Could not update trip actual position. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
