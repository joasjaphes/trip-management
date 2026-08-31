import type { Driver } from './driver.model';
import type { ExpenseCategory } from './expense-category.model';
import type { Route } from './route.model';
import type { Vehicle } from './vehicle.model';
import type { Customer } from './customer.model';
import type { OffloadingPlace } from './offloading-place.model';
import { CargoType } from './cargo-type.model';
import { AdditionalTrip } from './additional-trip.model';
import {  TripVehicleMaintenanceItem } from './trip-vehicle-maintenance';

export interface Trip {
	id: string;
	tripReferenceNumber?: string;
	tripDate: Date | string;
	endDate?: Date | string;
	vehicleId: string;
	vehicle?: Vehicle;
	trailerId?: string;
	trailer?: Vehicle;
	cargoQuantity?: number;
	loadedQuantity?: number;
	offloadedQuantity?: number;
	ratePerUnit?: number;
	driverId: string;
	docNumber?: string;
	tripDocument?: string;
	tripActualPosition?: string;
	isOverstayed?: boolean;
	completionDocument?: string;
	driver?: Driver;
	routeId: string;
	route?: Route;
	cargoTypeId?: string;
	cargoType?: CargoType;
	customerId?: string;
	customer?: Customer;
	customerName?: string;
	customerTIN?: string;
	customerPhone?: string;
	offloadingPlaceId?: string;
	offloadingPlaceName?: string;
	offloadingPlace?: OffloadingPlace;
	revenue: number;
	exchangeRate?: number;
	equivalentAmount?: number;
	paidAmount?: number;
	income?: number;
	expenses: TripExpense[];
	status: TripStatus;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
	additionalTrips?: AdditionalTrip[];
	maintenance?: TripVehicleMaintenanceItem[];
}

export enum TripStatus {
	PENDING = 'Pending payment',
	IN_PROGRESS = 'Inprogress',
	COMPLETED = 'Completed',
	CANCELLED = 'Cancelled'
}

export interface TripExpense {
	id: string;
	tripId: string;
	expenseId: string;
	expenseDescription?: string;
	category?: ExpenseCategory;
	amount: number;
	receiptAttachment?: string;
	date: string;
	createdAt?: Date;
	updatedAt?: Date;
}
