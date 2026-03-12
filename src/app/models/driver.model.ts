export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  licenseDetails?: DrivingLicense;
  licenseFrontPagePhoto?: string;
  licenseNumber?: string;
  licenseClass?: string;
  licenseExpiryDate?: Date;

  photo?: string;
  driverPhoto?: string;
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
