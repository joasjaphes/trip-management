// User Models
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer'
}

// Driver Models
export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  licenseDetails: DrivingLicense;
  photo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrivingLicense {
  licenseNumber: string;
  issueDate: Date;
  expiryDate: Date;
  licenseClass: string;
  frontPagePhoto?: string;
}

// Vehicle Models
export interface Vehicle {
  id: string;
  registrationNo: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  tankCapacity: number; // in litres
  mileagePerFullTank: number; // in km
  currentMileage?: number;
  permits: VehiclePermit[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehiclePermit {
  id: string;
  description: string;
  startDate: Date;
  endDate: Date;
  attachment?: string;
}

// Route Models
export interface Route {
  id: string;
  name: string;
  mileage: number; // in km
  startLocation?: string;
  endLocation?: string;
  estimatedDuration?: number; // in hours
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Trip Models
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
  revenue: number; // income
  expenses: TripExpense[];
  status: TripStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TripStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
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

// Configuration Models
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form Models (for creating/updating)
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateTripDto {
  tripDate: Date;
  vehicleId: string;
  driverId: string;
  routeId: string;
  revenue?: number;
  notes?: string;
}

export interface UpdateTripDto extends Partial<CreateTripDto> {
  endDate?: Date;
  status?: TripStatus;
}

export interface CreateDriverDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  licenseDetails: DrivingLicense;
}

export interface CreateVehicleDto {
  registrationNo: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  tankCapacity: number;
  mileagePerFullTank: number;
}

export interface CreateRouteDto {
  name: string;
  mileage: number;
  startLocation?: string;
  endLocation?: string;
  estimatedDuration?: number;
}

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
}
