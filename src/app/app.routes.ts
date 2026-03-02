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
                loadComponent: () => import('./trips/trip-list/trip-list').then(m => m.TripList),
            },
            {
                path: 'trips/new',
                loadComponent: () => import('./trips/trip-form/trip-form').then(m => m.TripForm),
            },
            {
                path: 'trips/:id',
                loadComponent: () => import('./trips/trip-detail/trip-detail').then(m => m.TripDetail),
            },
            {
                path: 'drivers',
                loadComponent: () => import('./drivers/driver-list/driver-list').then(m => m.DriverList),
            },
            {
                path: 'drivers/new',
                loadComponent: () => import('./drivers/driver-form/driver-form').then(m => m.DriverForm),
            },
            {
                path: 'drivers/:id',
                loadComponent: () => import('./drivers/driver-detail/driver-detail').then(m => m.DriverDetail),
            },
            {
                path: 'vehicles',
                loadComponent: () => import('./vehicles/vehicle-list/vehicle-list').then(m => m.VehicleList),
            },
            {
                path: 'vehicles/new',
                loadComponent: () => import('./vehicles/vehicle-form/vehicle-form').then(m => m.VehicleForm),
            },
            {
                path: 'vehicles/:id',
                loadComponent: () => import('./vehicles/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail),
            },
            {
                path: 'routes',
                loadComponent: () => import('./routes/route-list/route-list').then(m => m.RouteList),
            },
            {
                path: 'routes/new',
                loadComponent: () => import('./routes/route-form/route-form').then(m => m.RouteForm),
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
