export interface Permit {
  id: string;
  name: string;
  authorizingBody?: string;
  isActive: boolean;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}