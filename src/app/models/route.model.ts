export interface Route {
  id: string;
  name: string;
  mileage: number;
  startLocation?: string;
  endLocation?: string;
  estimatedDuration?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
