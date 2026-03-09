import type { Driver } from './driver.model';
import type { ExpenseCategory } from './expense-category.model';
import type { Route } from './route.model';
import type { Vehicle } from './vehicle.model';

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
	revenue: number;
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
	categoryId: string;
	category?: ExpenseCategory;
	description: string;
	amount: number;
	receiptAttachment?: string;
	date: Date;
	createdAt: Date;
}
