import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Vehicle } from '../../../../models/vehicle.model';
import { VehicleMaintenance } from '../../../../models/vehicle-maintenance.model';
import { CommonService } from '../../../../services/common.service';
import { VehicleService } from '../../../../services/vehicle.service';
import { VehicleMaintenanceService } from '../../../../services/vehicle-maintenance.service';
import { NumberFormatDirective } from '../../../../shared/directives/number-format';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

type VehicleMaintenanceDraft = {
  id: string;
  vehicleId: string;
  vehicleSearchTerm: string;
  maintenanceDate: string;
  description: string;
  totalMaintenanceCost: number;
};

@Component({
  selector: 'app-vehicle-maintenance-form',
  imports: [CommonModule, FormsModule, SaveArea, MatDatepickerModule, MatNativeDateModule, NumberFormatDirective],
  templateUrl: './vehicle-maintenance-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleMaintenanceForm implements OnInit {
  private maintenanceService = inject(VehicleMaintenanceService);
  private vehicleService = inject(VehicleService);
  private commonService = inject(CommonService);
  today = new Date();

  maintenance = input<VehicleMaintenance | undefined>();
  close = output<void>();

  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  draft = signal<VehicleMaintenanceDraft>(this.createEmptyDraft());

  isEditMode = computed(() => !!this.maintenance()?.id);
  isFormValid = computed(() => {
    const row = this.draft();
    return !!row.vehicleId && !!row.maintenanceDate && !!row.description.trim() && Number(row.totalMaintenanceCost) > 0;
  });

  vehicleOptions = computed(() =>
    [...this.vehicleService.allVehicles()].sort((a, b) => a.registrationNo.localeCompare(b.registrationNo))
  );

  selectedVehicleLabel = computed(() => {
    const vehicle = this.resolveVehicle(this.draft().vehicleId, this.draft().vehicleSearchTerm);
    if (!vehicle) {
      return '';
    }

    return [vehicle.registrationNo, vehicle.model, vehicle.type].filter(Boolean).join(' · ');
  });

  canSave = computed(() => this.isFormValid() && !this.saving());

  ngOnInit(): void {
    if (this.vehicleService.allVehicles().length === 0) {
      void this.vehicleService.getAll();
    }
  }

  constructor() {
    effect(() => {
      const record = this.maintenance();
      if (record) {
        this.draft.set(this.createDraftFromMaintenance(record));
        return;
      }

      this.draft.set(this.createEmptyDraft());
    });
  }

  private createEmptyDraft(): VehicleMaintenanceDraft {
    return {
      id: this.commonService.makeid(),
      vehicleId: '',
      vehicleSearchTerm: '',
      maintenanceDate: this.getTodayDateValue(),
      description: '',
      totalMaintenanceCost: 0,
    };
  }

  private createDraftFromMaintenance(record: VehicleMaintenance): VehicleMaintenanceDraft {
    const vehicle = this.resolveVehicle(record.vehicleId, record.vehicleRegistrationNo ?? '');

    return {
      id: record.id,
      vehicleId: vehicle?.id ?? record.vehicleId ?? '',
      vehicleSearchTerm: vehicle?.registrationNo ?? record.vehicleRegistrationNo ?? '',
      maintenanceDate: this.toDateInputValue(record.date),
      description: record.description ?? '',
      totalMaintenanceCost: Number(record.totalMaintenanceCost ?? 0),
    };
  }

  private resolveVehicle(vehicleId: string, vehicleSearchTerm: string): Vehicle | undefined {
    if (vehicleId) {
      const byId = this.vehicleService.getById(vehicleId);
      if (byId) {
        return byId;
      }
    }

    const search = vehicleSearchTerm.trim().toLowerCase();
    if (!search) {
      return undefined;
    }

    return this.vehicleService.allVehicles().find((vehicle) => {
      const registrationNo = vehicle.registrationNo?.toLowerCase() ?? '';
      const model = vehicle.model?.toLowerCase() ?? '';
      return registrationNo === search || model === search;
    });
  }

  private getTodayDateValue(): string {
    return this.toDateInputValue(new Date());
  }

  toDateInputValue(value?: string | Date): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private updateDraftField(field: keyof VehicleMaintenanceDraft, value: string | number): void {
    this.draft.update((draft) => ({
      ...draft,
      [field]: field === 'totalMaintenanceCost' ? Number(value) : value,
    }));
  }

  onVehicleInput(value: string): void {
    const vehicle = this.resolveVehicle('', value);

    this.draft.update((draft) => ({
      ...draft,
      vehicleSearchTerm: value,
      vehicleId: vehicle?.id ?? '',
    }));
  }

  onMaintenanceDateChanged(value: Date | null): void {
    if (!value) {
      return;
    }

    this.updateDraftField('maintenanceDate', this.toDateInputValue(value));
  }

  goBack(): void {
    this.close.emit();
  }

  async onSubmit(): Promise<void> {
    const draft = this.draft();
    const resolvedVehicle = this.resolveVehicle(draft.vehicleId, draft.vehicleSearchTerm);

    if (!resolvedVehicle) {
      this.errorMessage.set('Select a valid vehicle from the list.');
      return;
    }

    if (!this.isFormValid()) {
      this.errorMessage.set('Complete vehicle, date, description, and cost before saving.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode() ? 'Updating maintenance record...' : 'Saving maintenance record...');

    try {
      const payload = {
        id: draft.id,
        vehicleId: resolvedVehicle.id,
        date: draft.maintenanceDate,
        description: draft.description.trim(),
        totalMaintenanceCost: Number(draft.totalMaintenanceCost),
      };

      if (this.isEditMode()) {
        await this.maintenanceService.update(this.maintenance()!.id, payload);
      } else {
        await this.maintenanceService.create(payload);
      }

      this.successMessage.set(
        this.isEditMode()
          ? 'Vehicle maintenance updated successfully.'
          : 'Vehicle maintenance registered successfully.'
      );
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save vehicle maintenance. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.saving.set(false);
    }
  }

  updateField(field: keyof VehicleMaintenanceDraft, value: string): void {
    if (field === 'totalMaintenanceCost') {
      this.updateDraftField(field, Number(value));
      return;
    }

    this.updateDraftField(field, value);
  }
}