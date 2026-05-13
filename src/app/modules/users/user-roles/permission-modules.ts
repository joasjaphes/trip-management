export interface PermissionItem {
    key: string;
    label: string;
}

export interface PermissionModule {
    key: string;
    label: string;
    permissions: PermissionItem[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        permissions: [{ key: 'VIEW_DASHBOARD', label: 'View Dashboard' }],
    },
    {
        key: 'trips',
        label: 'Trip Management',
        permissions: [
            { key: 'VIEW_TRIPS', label: 'View Trips' },
            { key: 'CREATE_TRIP', label: 'Create Trip' },
            { key: 'ADD_TRIP_EXPENSES', label: 'Add Trip Expenses' },
            { key: 'EDIT_TRIP', label: 'Edit Trip' },
            { key: 'DELETE_TRIP', label: 'Delete Trip' },
            { key: 'COMPLETE_TRIP', label: 'Complete Trip' },
            { key: 'RECEIVE_PAYMENTS', label: 'Receive invoice payments' },
            { key: 'VIEW_INVOICE_PAYMENTS', label: 'View Invoice Payments' },

        ],
    },
    {
        key: 'office-operations',
        label: 'Office Operations',
        permissions: [
            { key: 'VIEW_PURCHASE_ORDER', label: 'View Purchase Order' },
            { key: 'CREATE_PURCHASE_ORDER', label: 'Create Purchase Order' },
            { key: 'EDIT_PURCHASE_ORDER', label: 'Edit Purchase Order' },
            { key: 'DELETE_PURCHASE_ORDER', label: 'Delete Purchase Order' },
            { key: 'APPROVE_PURCHASE_ORDER', label: 'Approve Purchase Order' },
            { key: 'RECEIVE_PURCHASE_ORDER', label: 'Receive Purchase Order' },
            { key: 'VIEW_EXPENSE_TRANSACTION', label: 'View Expense Transaction' },
            { key: 'CREATE_EXPENSE_TRANSACTION', label: 'Create Expense Transaction' },
            { key: 'EDIT_EXPENSE_TRANSACTION', label: 'Edit Expense Transaction' },
            { key: 'DELETE_EXPENSE_TRANSACTION', label: 'Delete Expense Transaction' },
        ],
    },
    {
        key: 'reports',
        label: 'Reports',
        permissions: [
            { key: 'VIEW_DRIVER_PERMITS_STATUS', label: 'View Driver Permits Status' },
            { key: 'VIEW_VEHICLE_PERMITS_STATUS', label: 'View Vehicle Permits Status' },
            { key: 'VIEW_EXPENDITURE_REPORT', label: 'View Expenditure Report' },
            { key: 'VIEW_DEBTORS_STATEMENT_REPORT', label: 'View Debtors Report' },
            { key: 'VIEW_TRIP_REVENUE_REPORT', label: 'View Trip Revenue Report' },
            { key: 'VIEW_CASH_REPORT', label: 'View Cash Report' },
        ],
    },
    {
        key: 'configuration',
        label: 'Configuration',
        permissions: [
            { key: 'VIEW_DRIVERS', label: 'View Drivers' },
            { key: 'CREATE_DRIVER', label: 'Create Driver' },
            { key: 'EDIT_DRIVER', label: 'Edit Driver' },
            { key: 'DELETE_DRIVER', label: 'Delete Driver' },
            { key: 'VIEW_VEHICLES', label: 'View Vehicles' },
            { key: 'CREATE_VEHICLE', label: 'Create Vehicle' },
            { key: 'EDIT_VEHICLE', label: 'Edit Vehicle' },
            { key: 'DELETE_VEHICLE', label: 'Delete Vehicle' },
            { key: 'VIEW_VEHICLE_PERMITS', label: 'View Vehicle Permits' },
            { key: 'MANAGE_VEHICLE_PERMITS', label: 'Manage Vehicle Permits' },
            { key: 'VIEW_ISSUING_AUTHORITIES', label: 'View Issuing Authorities' },
            { key: 'MANAGE_ISSUING_AUTHORITIES', label: 'Manage Issuing Authorities' },
            { key: 'VIEW_ROUTES', label: 'View Routes' },
            { key: 'CREATE_ROUTE', label: 'Create Route' },
            { key: 'EDIT_ROUTE', label: 'Edit Route' },
            { key: 'DELETE_ROUTE', label: 'Delete Route' },
            { key: 'VIEW_CARGO_TYPES', label: 'View Cargo Types' },
            { key: 'CREATE_CARGO_TYPE', label: 'Create Cargo Type' },
            { key: 'EDIT_CARGO_TYPE', label: 'Edit Cargo Type' },
            { key: 'DELETE_CARGO_TYPE', label: 'Delete Cargo Type' },
            { key: 'VIEW_CUSTOMERS', label: 'View Customers' },
            { key: 'CREATE_CUSTOMER', label: 'Create Customer' },
            { key: 'EDIT_CUSTOMER', label: 'Edit Customer' },
            { key: 'DELETE_CUSTOMER', label: 'Delete Customer' },
            { key: 'VIEW_VENDORS', label: 'View Vendors' },
            { key: 'CREATE_VENDOR', label: 'Create Vendor' },
            { key: 'EDIT_VENDOR', label: 'Edit Vendor' },
            { key: 'DELETE_VENDOR', label: 'Delete Vendor' },
            { key: 'VIEW_OFFLOADING_PLACES', label: 'View Offloading Places' },
            { key: 'CREATE_OFFLOADING_PLACE', label: 'Create Offloading Place' },
            { key: 'EDIT_OFFLOADING_PLACE', label: 'Edit Offloading Place' },
            { key: 'DELETE_OFFLOADING_PLACE', label: 'Delete Offloading Place' },
            { key: 'VIEW_EXPENSE_CATEGORIES', label: 'View Expense Categories' },
            { key: 'CREATE_EXPENSE_CATEGORY', label: 'Create Expense Category' },
            { key: 'EDIT_EXPENSE_CATEGORY', label: 'Edit Expense Category' },
            { key: 'DELETE_EXPENSE_CATEGORY', label: 'Delete Expense Category' },
            { key: 'VIEW_COMPANY_PROFILE', label: 'View Company Profile' },
            { key: 'EDIT_COMPANY_PROFILE', label: 'Edit Company Profile' },
        ],
    },
    {
        key: 'users',
        label: 'User Management',
        permissions: [
            { key: 'VIEW_USERS', label: 'View Users' },
            { key: 'CREATE_USER', label: 'Create User' },
            { key: 'EDIT_USER', label: 'Edit User' },
            { key: 'DELETE_USER', label: 'Delete User' },
            { key: 'VIEW_ROLES', label: 'View Roles' },
            { key: 'CREATE_ROLE', label: 'Create Role' },
            { key: 'EDIT_ROLE', label: 'Edit Role' },
            { key: 'DELETE_ROLE', label: 'Delete Role' },
        ],
    },
];

export const DEFAULT_ROLE_PERMISSIONS = new Set<string>([
    'VIEW_DASHBOARD',
    'VIEW_TRIPS',
    'VIEW_PURCHASE_ORDER',
    'VIEW_EXPENSE_TRANSACTION',
    'VIEW_DEBTORS_STATEMENT_REPORT',
]);
