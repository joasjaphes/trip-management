export interface CargoType {
  id: string;
  name: string;
  unitOfMeasure?: string;
  allowableLoss?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
