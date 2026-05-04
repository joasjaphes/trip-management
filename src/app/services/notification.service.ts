import { computed, inject, Injectable } from '@angular/core';
import { VehicleService } from './vehicle.service';
import { DriverService } from './driver.service';
import { InvoiceService } from './invoice.service';
import { TripService } from './trip.service';
import { Vehicle, VehiclePermit } from '../models/vehicle.model';

const WARNING_THRESHOLD_DAYS = 60;
const URGENT_THRESHOLD_DAYS = 30;
const INVOICE_OVERDUE_AFTER_DAYS = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type NotificationSeverity = 'urgent' | 'warning';

export interface VehiclePermitNotification {
  id: string;
  vehicleId: string;
  vehicleType: 'truck' | 'trailer';
  registrationNo: string;
  permitDescription: string;
  expiryDate: Date;
  daysRemaining: number;
  severity: NotificationSeverity;
}

export interface DriverPermitNotification {
  id: string;
  driverId: string;
  driverName: string;
  documentType: 'License' | 'Passport';
  documentNumber: string;
  expiryDate: Date;
  daysRemaining: number;
  severity: NotificationSeverity;
}

export interface OverdueInvoiceNotification {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  tripReferenceNumber: string;
  routeName: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  debtAgeDays: number;
  issuedAt: Date;
  severity: NotificationSeverity;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);

  private startOfToday(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private daysBetween(target: Date): number {
    const today = this.startOfToday();
    const value = new Date(target);
    value.setHours(0, 0, 0, 0);
    return Math.round((value.getTime() - today.getTime()) / MS_PER_DAY);
  }

  private permitSeverity(daysRemaining: number): NotificationSeverity {
    return daysRemaining <= URGENT_THRESHOLD_DAYS ? 'urgent' : 'warning';
  }

  private vehicleType(vehicle: Vehicle): 'truck' | 'trailer' {
    return vehicle.type === 'TRAILER' ? 'trailer' : 'truck';
  }

  vehiclePermitNotifications = computed<VehiclePermitNotification[]>(() => {
    const out: VehiclePermitNotification[] = [];
    for (const vehicle of this.vehicleService.allVehicles()) {
      for (const permit of vehicle.permits ?? []) {
        if (!permit.endDate) continue;
        const daysRemaining = this.daysBetween(new Date(permit.endDate));
        if (daysRemaining > WARNING_THRESHOLD_DAYS) continue;

        out.push({
          id: `${vehicle.id}::${permit.id}`,
          vehicleId: vehicle.id,
          vehicleType: this.vehicleType(vehicle),
          registrationNo: vehicle.registrationNo,
          permitDescription: permit.description || 'Permit',
          expiryDate: new Date(permit.endDate),
          daysRemaining,
          severity: this.permitSeverity(daysRemaining),
        });
      }
    }
    return out.sort((a, b) => a.daysRemaining - b.daysRemaining);
  });

  driverPermitNotifications = computed<DriverPermitNotification[]>(() => {
    const out: DriverPermitNotification[] = [];
    for (const driver of this.driverService.allDrivers()) {
      const fullName = `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() || 'Driver';

      const licenseExpiry = driver.licenseDetails?.expiryDate ?? driver.licenseExpiryDate;
      if (licenseExpiry) {
        const daysRemaining = this.daysBetween(new Date(licenseExpiry));
        if (daysRemaining <= WARNING_THRESHOLD_DAYS) {
          out.push({
            id: `${driver.id}::license`,
            driverId: driver.id,
            driverName: fullName,
            documentType: 'License',
            documentNumber:
              driver.licenseDetails?.licenseNumber || driver.licenseNumber || '-',
            expiryDate: new Date(licenseExpiry),
            daysRemaining,
            severity: this.permitSeverity(daysRemaining),
          });
        }
      }

      if (driver.passportExpiryDate) {
        const daysRemaining = this.daysBetween(new Date(driver.passportExpiryDate));
        if (daysRemaining <= WARNING_THRESHOLD_DAYS) {
          out.push({
            id: `${driver.id}::passport`,
            driverId: driver.id,
            driverName: fullName,
            documentType: 'Passport',
            documentNumber: driver.passportNumber || '-',
            expiryDate: new Date(driver.passportExpiryDate),
            daysRemaining,
            severity: this.permitSeverity(daysRemaining),
          });
        }
      }
    }
    return out.sort((a, b) => a.daysRemaining - b.daysRemaining);
  });

  overdueInvoiceNotifications = computed<OverdueInvoiceNotification[]>(() => {
    const tripsById = new Map(this.tripService.allTrips().map((t) => [t.id, t]));
    const out: OverdueInvoiceNotification[] = [];

    for (const invoice of this.invoiceService.allInvoices()) {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') continue;

      const issuedAt = invoice.issuedAt ? new Date(invoice.issuedAt) : null;
      if (!issuedAt || Number.isNaN(issuedAt.getTime())) continue;

      const debtAgeDays = -this.daysBetween(issuedAt);
      if (debtAgeDays <= INVOICE_OVERDUE_AFTER_DAYS) continue;

      const invoicedAmount = Number(invoice.amount || 0);
      const paidAmount = Number(invoice.paidAmount || 0);
      const outstandingAmount =
        invoice.remainingAmount !== undefined && invoice.remainingAmount !== null
          ? Number(invoice.remainingAmount)
          : Math.max(invoicedAmount - paidAmount, 0);

      if (outstandingAmount <= 0) continue;

      const trip = tripsById.get(invoice.tripId);
      const customerName =
        invoice.customer?.name ||
        trip?.customer?.name ||
        trip?.customerName ||
        '-';

      out.push({
        id: invoice.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber || '-',
        customerName,
        tripReferenceNumber: trip?.tripReferenceNumber || '-',
        routeName: trip?.route?.name || '-',
        invoicedAmount,
        paidAmount,
        outstandingAmount,
        debtAgeDays,
        issuedAt,
        severity: 'urgent',
      });
    }
    return out.sort((a, b) => b.debtAgeDays - a.debtAgeDays);
  });

  totalCount = computed(
    () =>
      this.vehiclePermitNotifications().length +
      this.driverPermitNotifications().length +
      this.overdueInvoiceNotifications().length
  );

  urgentCount = computed(
    () =>
      this.vehiclePermitNotifications().filter((n) => n.severity === 'urgent').length +
      this.driverPermitNotifications().filter((n) => n.severity === 'urgent').length +
      this.overdueInvoiceNotifications().length
  );

  async loadAll(): Promise<void> {
    await Promise.all([
      this.vehicleService.getAll(),
      this.driverService.getAll(),
      this.invoiceService.getAll(),
      this.tripService.getAll(),
    ]);
  }
}
