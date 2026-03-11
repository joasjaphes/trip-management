import type { Driver } from './driver.model';
import type { ExpenseCategory } from './expense-category.model';
import type { Route } from './route.model';
import type { Vehicle } from './vehicle.model';
import type { Customer } from './customer.model';

export interface Trip {
	id: string;
	tripDate: Date;
	endDate?: Date;
	vehicleId: string;
	vehicle?: Vehicle;
	driverId: string;
	driver?: Driver;
	routeId: string;
	route?: Route;
	cargoTypeId?: string;
	customerId?: string;
	customer?: Customer;
	customerName?: string;
	customerTIN?: string;
	customerPhone?: string;
	revenue: number;
	income?: number;
	expenses: TripExpense[];
	status: TripStatus;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export enum TripStatus {
	PENDING = 'pending',
	IN_PROGRESS = 'inprogress',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled'
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
