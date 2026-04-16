export interface Route {
  id: string;
  name: string;
  mileage: number;
  startLocation?: string;
  endLocation?: string;
  estimatedDuration?: number;
  isActive: boolean;
  isVATZeroRated?: boolean;
  vatPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}
