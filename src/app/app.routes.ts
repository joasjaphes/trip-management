import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { CompanyProfilePage } from './modules/configurations/company-profile/company-profile';
import { Login } from './login/login';
import { Home } from './home/home';
import { Dashboard } from './modules/dashboard/dashboard';
import { Notifications } from './modules/notifications/notifications';
import { Trips } from './modules/trips/trips';
import { Invoicing } from './modules/trips/invoicing/invoicing';
import { DriversPermitStatusReport } from './modules/reports/drivers-permit-status/drivers-permit-status-report';
import { VehiclesPermitStatusReport } from './modules/reports/vehicles-permit-status/vehicles-permit-status-report';
import { ExpenditureReport } from './modules/reports/expenditure-report/expenditure-report';
import { TripForm } from './modules/trips/trip-form/trip-form';
import { TripDetail } from './modules/trips/trip-detail/trip-detail';
import { DriverList } from './modules/configurations/drivers/driver-list/driver-list';
import { DriverForm } from './modules/configurations/drivers/driver-form/driver-form';
import { DriverDetail } from './modules/configurations/drivers/driver-detail/driver-detail';
import { VehicleList } from './modules/configurations/vehicles/vehicle-list/vehicle-list';
import { VehicleForm } from './modules/configurations/vehicles/vehicle-form/vehicle-form';
import { VehicleDetail } from './modules/configurations/vehicles/vehicle-detail/vehicle-detail';
import { VehiclePermits } from './modules/configurations/vehicle-permits/vehicle-permits';
import { IssuingBodyComponent } from './modules/configurations/issuing-body/issuing-body';
import { PermitForm } from './modules/configurations/vehicle-permits/permit-form/permit-form';
import { PermitDetail } from './modules/configurations/vehicle-permits/permit-detail/permit-detail';
import { RouteList } from './modules/configurations/routes/route-list/route-list';
import { RouteForm } from './modules/configurations/routes/route-form/route-form';
import { RouteDetail } from './modules/configurations/routes/route-detail/route-detail';
import { ExpenseCategories } from './modules/configurations/expense-categories/expense-categories';
import { ExpenseTransactions } from './modules/office-operations/expense-transactions/expense-transactions';
import { Purchases } from './modules/office-operations/purchases/purchases';
import { CargoTypes } from './modules/configurations/cargo-types/cargo-types';
import { CargoTypeForm } from './modules/configurations/cargo-types/cargo-type-form/cargo-type-form';
import { Customers } from './modules/configurations/customers/customers';
import { Vendors } from './modules/configurations/vendors/vendors';
import { OffloadingPlaces } from './modules/configurations/offloading-places/offloading-places';
import { ExpenseCategoryForm } from './modules/configurations/expense-categories/expense-category-form/expense-category-form';
import { ExpenseCategoryDetail } from './modules/configurations/expense-categories/expense-category-detail/expense-category-detail';
import { UserList } from './modules/users/user-list/user-list';
import { UserRoles } from './modules/users/user-roles/user-roles';
import { UserForm } from './modules/users/user-form/user-form';
import { UserDetail } from './modules/users/user-detail/user-detail';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        canActivate: [authGuard],
        component: Home,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: Dashboard,
            },
            {
                path: 'notifications',
                component: Notifications,
            },
            {
                path: 'trips',
                component: Trips,
            },
            {
                path: 'invoicing',
                component: Invoicing,
            },
            {
                path: 'reports/drivers-permit-status',
                component: DriversPermitStatusReport,
            },
            {
                path: 'reports/vehicles-permit-status',
                component: VehiclesPermitStatusReport,
            },
            {
                path: 'reports/expenditure',
                component: ExpenditureReport,
            },
            {
                path: 'trips/new',
                component: TripForm,
            },
            {
                path: 'trips/:id',
                component: TripDetail,
            },
            {
                path: 'drivers',
                component: DriverList,
            },
            {
                path: 'drivers/new',
                component: DriverForm,
            },
            {
                path: 'drivers/:id',
                component: DriverDetail,
            },
            {
                path: 'vehicles',
                component: VehicleList,
            },
            {
                path: 'vehicles/new',
                component: VehicleForm,
            },
            {
                path: 'vehicles/:id',
                component: VehicleDetail,
            },
            {
                path: 'vehicle-permits',
                component: VehiclePermits,
            },
            {
                path: 'issuing-bodies',
                component: IssuingBodyComponent,
            },
            {
                path: 'company-profile',
                component: CompanyProfilePage,
            },
            {
                path: 'vehicle-permits/new',
                component: PermitForm,
            },
            {
                path: 'vehicle-permits/:id',
                component: PermitDetail,
            },
            {
                path: 'routes',
                component: RouteList,
            },
            {
                path: 'routes/new',
                component: RouteForm,
            },
            {
                path: 'routes/:id',
                component: RouteDetail,
            },
            {
                path: 'expense-categories',
                component: ExpenseCategories,
            },
            {
                path: 'expense-transactions',
                component: ExpenseTransactions,
            },
            {
                path: 'purchases',
                component: Purchases,
            },
            {
                path: 'cargo-types',
                component: CargoTypes,
            },
            {
                path: 'cargo-types/new',
                component: CargoTypeForm,
            },
            {
                path: 'customers',
                component: Customers,
            },
            {
                path: 'vendors',
                component: Vendors,
            },
            {
                path: 'offloading-places',
                component: OffloadingPlaces,
            },
            {
                path: 'expense-categories/new',
                component: ExpenseCategoryForm,
            },
            {
                path: 'expense-categories/:id',
                component: ExpenseCategoryDetail,
            },
            {
                path: 'users',
                component: UserList,
            },
            {
                path: 'user-roles',
                component: UserRoles,
            },
            {
                path: 'users/new',
                component: UserForm,
            },
            {
                path: 'users/:id',
                component: UserDetail,
            },
            {
                path: 'users/:id/edit',
                component: UserForm,
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
