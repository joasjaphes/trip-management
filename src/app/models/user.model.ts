export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  surname: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  initials?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer'
}
