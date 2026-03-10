import { Component, computed, inject, OnInit, output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { TripStatus } from '../../../models/trip.model';
import { CargoTypeService } from '../../../services/cargo-type.service';
import { DriverService } from '../../../services/driver.service';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { RouteService } from '../../../services/route.service';
import { TripExpenseService } from '../../../services/trip-expense.service';
import { TripService } from '../../../services/trip.service';
import { VehicleService } from '../../../services/vehicle.service';

type ExpenseDraft = {
  id: string;
  expenseId: string;
  amount: string;
  date: string;
  attachment?: string;
};

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea,DecimalPipe],
  templateUrl: './trip-form.html',
})
export class TripForm implements OnInit {
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private routeService = inject(RouteService);
  private cargoTypeService = inject(CargoTypeService);
  private expenseCategoryService = inject(ExpenseCategoryService);
  private tripExpenseService = inject(TripExpenseService);

  close = output();

  tripDate = '';
  endDate = '';
  vehicleId = '';
  driverId = '';
  routeId = '';
  cargoTypeId = '';
  revenue = '';
  status: TripStatus = TripStatus.PENDING;
  notes = '';

  vehicles = this.vehicleService.allVehicles;
  drivers = this.driverService.allDrivers;
  routes = this.routeService.allRoutes;
  cargoTypes = computed(() =>
    this.cargoTypeService.allCargoTypes().filter((cargoType) => cargoType.isActive)
  );
  expenseCategories = computed(() =>
    this.expenseCategoryService
      .allCategories()
      .filter((category) => category.isActive || category.status === 'Active')
  );
  loading = computed(() => this.tripService.loading() || this.tripExpenseService.loading());

  expenseRows: ExpenseDraft[] = [this.createExpenseRow()];

  ngOnInit() {
    Promise.all([
      this.vehicleService.getAll(),
      this.driverService.getAll(),
      this.routeService.getAll(),
      this.cargoTypeService.getAll(),
      this.expenseCategoryService.getAll(),
    ]).then();
  }

  private createExpenseRow(): ExpenseDraft {
    return {
      id: crypto.randomUUID(),
      expenseId: '',
      amount: '',
      date: '',
      attachment: undefined,
    };
  }

  addExpenseRow() {
    this.expenseRows = [...this.expenseRows, this.createExpenseRow()];
  }

  removeExpenseRow(id: string) {
    this.expenseRows = this.expenseRows.filter((row) => row.id !== id);
    if (this.expenseRows.length === 0) {
      this.expenseRows = [this.createExpenseRow()];
    }
  }

  onExpenseAttachmentSelected(event: Event, rowId: string) {
    const input = event.target as HTMLInputElement;
    const fileName = input.files && input.files[0] ? input.files[0].name : undefined;

    this.expenseRows = this.expenseRows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            attachment: fileName,
          }
        : row
    );
  }

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    const tripId = await this.tripService.create({
      tripDate: this.tripDate ? new Date(this.tripDate) : new Date(),
      endDate: this.endDate ? new Date(this.endDate) : undefined,
      vehicleId: this.vehicleId,
      driverId: this.driverId,
      routeId: this.routeId,
      cargoTypeId: this.cargoTypeId || undefined,
      revenue: Number(this.revenue || 0),
      income: Number(this.revenue || 0),
      status: this.status,
      notes: this.notes || undefined,
    });

    const expensesToSave = this.expenseRows.filter((row) => row.expenseId);

    await Promise.all(
      expensesToSave.map((row) => {
        const parsedAmount = row.amount ? Number(row.amount) : undefined;

        return this.tripExpenseService.create({
          tripId,
          expenseId: row.expenseId,
          amount:
            parsedAmount !== undefined && !Number.isNaN(parsedAmount)
              ? parsedAmount
              : undefined,
          date: row.date || undefined,
          receiptAttachment: row.attachment || undefined,
        });
      })
    );

    this.close.emit();
  }
}
