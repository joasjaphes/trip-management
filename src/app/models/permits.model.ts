export interface Permit {
  id: string;
  name: string;
  authorizingBody?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}