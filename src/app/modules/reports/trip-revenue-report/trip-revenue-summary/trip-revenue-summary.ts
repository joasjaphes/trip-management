import { Component, EventEmitter, Input, OnInit, Output, resource } from '@angular/core';
import { Trip } from '../../../../models/trip.model';
import { HttpClientService } from '../../../../services/http-client.service';
import { Placeholder } from '../../../../shared/components/placeholder/placeholder';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-trip-revenue-summary',
  imports: [Placeholder, DecimalPipe, DatePipe],
  templateUrl: './trip-revenue-summary.html',
  styleUrl: './trip-revenue-summary.css',
})
export class TripRevenueSummary implements OnInit {
  @Input() tripId: string | null = null;
  @Input() tripSummary:any | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private httpService:HttpClientService) {}

  trip = resource<Trip, string>( 
    {
      params: () => this.tripId,
      loader: async ({ params }) => {
        if (!params) {
          throw new Error('Trip ID is required to load trip details.');
        }
        const response = await this.httpService.get(`trips/${params}`);
        console.log('TripRevenueSummary loaded trip:', response);
        return response as Trip;
      },
    }
  );

  ngOnInit() {
    console.log('TripRevenueSummary initialized with tripId:', this.tripId);
  }

  onClose() {
    this.close.emit();
  }
}
