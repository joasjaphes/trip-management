export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  status?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  surname: string;
  phoneNumber?: string;
  phone?: string;
  roles: string[] | UserRole[];
  isActive?: boolean;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  roleName?: string;
  initials?: string;
  permissions?: string[];
}
