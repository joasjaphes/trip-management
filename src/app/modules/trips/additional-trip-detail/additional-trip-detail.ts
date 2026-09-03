import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AdditionalTrip } from '../../../models';
import { Trip } from '../../../models/trip.model';

@Component({
  selector: 'app-additional-trip-detail',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './additional-trip-detail.html'
})
export class AdditionalTripDetail {
  additionalTrip = input<AdditionalTrip | undefined>();
  trip = input<Trip | undefined>();
  close = output();

  goBack() {
    this.close.emit();
  }

  getReferenceLabel(): string {
    const trip = this.trip();
    return trip?.tripReferenceNumber || trip?.route?.name || 'Reference trip';
  }

  openAttachment() {
    const attachment = this.additionalTrip()?.attachment;
    if (!attachment) return;
    window.open(attachment, '_blank');
  }
}
