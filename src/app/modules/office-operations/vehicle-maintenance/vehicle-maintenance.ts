import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { VehicleMaintenance } from '../../../models/vehicle-maintenance.model';
import { VehicleService } from '../../../services/vehicle.service';
import { VehicleMaintenanceService } from '../../../services/vehicle-maintenance.service';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { VehicleMaintenanceForm } from './vehicle-maintenance-form/vehicle-maintenance-form';

@Component({
    selector: 'app-vehicle-maintenance',
    imports: [CommonModule, Layout, DataTable, VehicleMaintenanceForm],
    templateUrl: './vehicle-maintenance.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleMaintenancePage implements OnInit {
    private vehicleMaintenanceService = inject(VehicleMaintenanceService);
    private vehicleService = inject(VehicleService);

    title = signal('Vehicle Maintenance');
    description = signal('Track repairs, servicing, and maintenance costs for company vehicles.');
    addText = signal('Register maintenance');
    viewDetails = signal(false);
    viewType = signal<'add' | 'edit' | ''>('');
    formTitle = signal('');
    formDescription = signal('');
    splitSize = signal<'full'>('full');
    showAddButton = signal(true);
    selectedMaintenance = signal<VehicleMaintenance | undefined>(undefined);

    //   permissions = signal({
    //     edit: ['EDIT_VEHICLE_MAINTENANCE'],
    //     view: ['VIEW_VEHICLE_MAINTENANCE'],
    //     add: ['CREATE_VEHICLE_MAINTENANCE'],
    //     more: {},
    //   });

    permissions = signal({
        edit: ['EDIT_PURCHASE_ORDER'],
        view: ['VIEW_PURCHASE_ORDER'],
        add: ['CREATE_PURCHASE_ORDER'],
        delete: ['DELETE_PURCHASE_ORDER'],
        more: { approve: ['APPROVE_PURCHASE_ORDER'], complete: ['RECEIVE_PURCHASE_ORDER'] }
    });

    addPermission = signal('CREATE_VEHICLE_MAINTENANCE');

    loading = computed(() => this.vehicleMaintenanceService.loading() || this.vehicleService.loading());

    maintenanceRows = computed(() => {
        const vehiclesById = new Map(
            this.vehicleService.allVehicles().map((vehicle) => [vehicle.id, vehicle])
        );

        return this.vehicleMaintenanceService.allVehicleMaintenances().map((maintenance) => {
            const vehicle = vehiclesById.get(maintenance.vehicleId) ?? maintenance.vehicle;
            const vehicleRegistrationNo = maintenance.vehicleRegistrationNo || vehicle?.registrationNo || maintenance.vehicleId || '-';
            const vehicleType = maintenance.vehicleType || vehicle?.type || '-';

            return {
                id: maintenance.id,
                vehicleDisplay: vehicleRegistrationNo,
                vehicleTypeDisplay: vehicleType,
                maintenanceDateDisplay: this.formatDate(maintenance.date),
                descriptionDisplay: maintenance.description || '-',
                totalMaintenanceCost: Number(maintenance.totalMaintenanceCost || 0),
                _maintenance: maintenance,
            };
        });
    });

    tableConfigurations: TableConfig = {
        columns: [
            { key: 'maintenanceDateDisplay', label: 'Maintenance Date' },
            { key: 'vehicleDisplay', label: 'Vehicle' },
            { key: 'vehicleTypeDisplay', label: 'Vehicle Type' },
            { key: 'descriptionDisplay', label: 'Description' },
            { key: 'totalMaintenanceCost', label: 'Total Cost', type: 'number' },
        ],
        actions: {
            edit: true,
        },
    };

    async ngOnInit(): Promise<void> {
        await Promise.all([
            this.vehicleMaintenanceService.getAll(),
            this.vehicleService.getAll(),
        ]);
    }

    onAdd(): void {
        this.selectedMaintenance.set(undefined);
        this.viewType.set('add');
        this.formTitle.set('Register Vehicle Maintenance');
        this.formDescription.set('Record a new maintenance entry for a vehicle.');
        this.viewDetails.set(true);
    }

    onEdit(row: { id: string }): void {
        const maintenance = this.vehicleMaintenanceService.getById(row.id);
        if (!maintenance) {
            return;
        }

        this.selectedMaintenance.set(maintenance);
        this.viewType.set('edit');
        this.formTitle.set('Edit Vehicle Maintenance');
        this.formDescription.set('Update maintenance date, vehicle, description, or cost.');
        this.viewDetails.set(true);
    }

    async onCloseForm(): Promise<void> {
        this.viewDetails.set(false);
        this.viewType.set('');
        this.formTitle.set('');
        this.formDescription.set('');
        this.selectedMaintenance.set(undefined);

        await Promise.all([
            this.vehicleMaintenanceService.getAll(),
            this.vehicleService.getAll(),
        ]);
    }

    private formatDate(value?: string): string {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
    }
}