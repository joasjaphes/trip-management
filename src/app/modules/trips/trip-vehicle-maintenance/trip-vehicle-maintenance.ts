import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClientService } from '../../../services/http-client.service';
import { Trip } from '../../../models';
import { TripVehicleMaintenanceItem } from '../../../models/trip-vehicle-maintenance';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NumberFormatDirective } from '../../../shared/directives/number-format';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonService } from '../../../services/common.service';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { DatePipe } from '@angular/common';
import { TripExpenseService } from '../../../services/trip-expense.service';

@Component({
  selector: 'app-trip-vehicle-maintenance',
  imports: [FormsModule, MatDatepickerModule, NumberFormatDirective, MatTooltipModule, SaveArea, DatePipe],
  templateUrl: './trip-vehicle-maintenance.html',
  styleUrl: './trip-vehicle-maintenance.css',
})
export class TripVehicleMaintenance implements OnInit {
  @Input() trip: Trip | null = null;
  date: Date = new Date();
  today = new Date();
  items: TripVehicleMaintenanceItem[] = [];
  newItemDescription: string = '';
  newItemCost: number | null = null;
  saving = false;
  @Output() close = new EventEmitter();

  constructor(private httpService: HttpClientService, private commonService: CommonService, private tripExpenseService: TripExpenseService) { }

  ngOnInit() {
    if (this.trip && this.trip.maintenance) {
      this.items = [...this.trip.maintenance];
    }
  }

  toDateValue(rawDate: Date | string | undefined): Date | null {
    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  removeItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
  }

  addItem() {
    const newItem: TripVehicleMaintenanceItem = {
      tripId: this.trip?.id || '',
      id: this.commonService.makeid(),
      date: this.date.toISOString(),
      description: this.newItemDescription,
      cost: this.newItemCost || 0,
    };
    this.items.push(newItem);
    this.newItemDescription = '';
    this.newItemCost = null;
  }

  async onSave() {
    this.saving = true;
    try {
      await this.tripExpenseService.addMaintenance(this.items);
      this.onClose();
    } catch (e) {
      console.error('Error saving maintenance items:', e);
    } finally {
      this.saving = false;
    }
  }

  onClose() {
    this.close.emit();
  }

}
