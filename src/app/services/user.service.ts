import { Injectable, signal, Signal } from '@angular/core';
import { User } from '../models/user.model';
import { HttpClientService } from './http-client.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  users = signal<User[]>([]);
  loadingUsers = signal<boolean>(false);

  constructor(
    private http: HttpClientService,
    private httpClient: HttpClient,
  ) {}

  isAuthenticated(): boolean {
    const token = localStorage.getItem('trip-management-token');
    return !!token;
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const token = btoa(`${username}:${password}`);
      const user = await this.http.authenticate('users/me', {
        username,
        password,
      });
      console.log('user', user);
      localStorage.setItem('trip-management-token', token);
      localStorage.setItem('trip-management-user', JSON.stringify(user));
      return true;
    } catch (e) {
      console.error('Failed to login', e);
      throw e;
    }
  }

  async logout(): Promise<boolean> {
    try {
      localStorage.removeItem('trip-management-token');
      localStorage.removeItem('trip-management-user');
      return true;
    } catch (e) {
      console.error('Failed to logout', e);
      throw e;
    }
  }

  async saveUser(user: User) {
    try {
      await this.http.post('users', user);
      this.users.update((users) => {
        const index = users.findIndex((u) => u.id === user.id);
        if (index > -1) {
          users[index] = user;
        } else {
          users.push(user);
        }
        return users;
      });
    } catch (e) {
      console.error('Failed to save user', e);
      throw e;
    }
  }

  async getUsers() {
    this.loadingUsers.set(true);
    try {
      const users = await this.http.get<User[]>('users');
      console.log('users', users);
      this.users.set(users.map((user) => ({
        ...user,
        initials: `${user.firstName.toUpperCase().charAt(0)}${user.surname.toUpperCase().charAt(0)}`,
        status: user.isActive ? 'Active' : 'Inactive',
      })));
      // return users;
    } catch (e) {
      console.error('Failed to get users', e);
      throw e;
    }
    this.loadingUsers.set(false);
  }

  // getCurrentUserAuthorities(): string[] {
  //   let authorities = [];
  //   const currentUser: User = JSON.parse(localStorage.getItem('trip-management-user'));
  //   const currentCustomer: Customer = JSON.parse(
  //     localStorage.getItem('current-customer')
  //   );
  //   if (currentCustomer) {
  //     return this.customerService.currentUserCustomerAuthorities();
  //   }
  //   if (currentUser && currentUser?.roles?.length) {
  //     currentUser.roles.forEach((userRole) => {
  //       userRole.authorities.forEach((auth) => {
  //         if (authorities.indexOf(auth) === -1) {
  //           authorities.push(auth);
  //         }
  //       });
  //     });
  //     return authorities;
  //   } else {
  //     return [];
  //   }
  // }
}
