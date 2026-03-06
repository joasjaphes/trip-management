import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login').then(m => m.Login),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./home/home').then(m => m.Home),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'trips',
                loadComponent: () => import('./trips/trips').then(m => m.Trips),
            },
            {
                path: 'drivers',
                loadComponent: () => import('./configurations/drivers/driver-list/driver-list').then(m => m.DriverList),
            },
            {
                path: 'vehicles',
                loadComponent: () => import('./configurations/vehicles/vehicle-list/vehicle-list').then(m => m.VehicleList),
            },
            {
                path: 'routes',
                loadComponent: () => import('./configurations/routes/route-list/route-list').then(m => m.RouteList),
            },
            {
                path: 'expense-categories',
                loadComponent: () => import('./configurations/expense-categories/expense-categories').then(m => m.ExpenseCategories),
            },
            {
                path: 'users',
                loadComponent: () => import('./users/user-list/user-list').then(m => m.UserList),
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
