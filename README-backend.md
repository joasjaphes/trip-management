# Trip Management API - Frontend Integration Guide

A comprehensive backend API for managing trips, customers, invoices, receipts, vehicles, drivers, routes, expenses, and related operations.

## Table of Contents
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Base Configuration

### API Base URL
```
http://localhost:3000/api
```

### Global Prefix
All endpoints are prefixed with `/api`

### CORS
CORS is enabled for all origins

### API Documentation
Interactive Swagger documentation is available at:
```
http://localhost:3000/docs
```

## Authentication

The API uses **HTTP Basic Authentication** with username and password.

### Authentication Header Format
```
Authorization: Basic <base64-encoded-credentials>
```

Where `<base64-encoded-credentials>` is the base64 encoding of `username:password`

### Example (JavaScript/TypeScript)
```javascript
const username = "user123";
const password = "StrongPassword123!";
const credentials = btoa(`${username}:${password}`);

fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': `Basic ${credentials}`
  }
});
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Protected Endpoints
Most endpoints require authentication. The following endpoints are public:
- `POST /api/users` - Create new user

## API Endpoints

### Users (`/api/users`)

#### Get All Users
```http
GET /api/users
Authorization: Basic <credentials>
```

#### Get Current User
```http
GET /api/users/me
Authorization: Basic <credentials>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Basic <credentials>
```

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "firstName": "John",
  "surname": "Doe",
  "phoneNumber": "255712345678",
  "password": "StrongPassword123!",
  "email": "user@example.com"
}
```

#### Update User
```http
PUT /api/users
Authorization: Basic <credentials>
Content-Type: application/json

{
  "id": "user-id",
  "firstName": "John",
  "surname": "Doe",
  "phoneNumber": "255712345678",
  "password": "StrongPassword123!",
  "email": "user@example.com"
}
```

#### Change Password
```http
POST /api/users/changePassword
Authorization: Basic <credentials>
Content-Type: application/json

{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

---

### Trips (`/api/trips`)

#### Get All Trips
```http
GET /api/trips
```

#### Get Trip by ID
```http
GET /api/trips/:id
```

#### Create Trip
```http
POST /api/trips
Content-Type: application/json

{
  "id": "trip-uid-123",
  "tripDate": "2026-03-07T10:00:00.000Z",
  "endDate": "2026-03-08T10:00:00.000Z",
  "vehicleId": "vehicle-uid-123",
  "driverId": "driver-uid-123",
  "routeId": "route-uid-123",
  "cargoTypeId": "cargo-type-uid-123",
  "customerName": "Acme Corporation",
  "customerTIN": "123456789",
  "customerPhone": "+255700000000",
  "revenue": 1500000,
  "paidAmount": 0,
  "income": 1200000,
  "status": "pending"
}
```

**Status Options:** `pending`, `inprogress`, `completed`, `cancelled`

When creating a trip, the API checks for an existing customer using `customerTIN`. If no customer exists, it creates one. The trip, customer creation, and invoice creation are saved in a single database transaction.

An invoice is automatically generated for every new trip with:
- `amount` equal to the trip `revenue`
- `customer` linked to the trip customer
- `paidAmount` initialized from trip `paidAmount` (defaults to `0`)
- `paymentStatus` derived from paid amount (`unpaid`, `partially_paid`, `full_paid`)
- `description` set to the selected route name
- `status` defaulting to `draft`

#### Update Trip
```http
PUT /api/trips
Content-Type: application/json

{
  "id": "trip-id",
  "tripDate": "2026-03-07T10:00:00.000Z",
  "endDate": "2026-03-08T10:00:00.000Z",
  "vehicleId": "vehicle-uid-123",
  "driverId": "driver-uid-123",
  "routeId": "route-uid-123",
  "cargoTypeId": "cargo-type-uid-123",
  "customerName": "Acme Corporation",
  "customerTIN": "123456789",
  "customerPhone": "+255700000000",
  "revenue": 1500000,
  "paidAmount": 200000,
  "income": 1200000,
  "status": "inprogress"
}
```

---

### Customers (`/api/customers`)

#### Get All Customers
```http
GET /api/customers
```

#### Get Customer by ID
```http
GET /api/customers/:id
```

#### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "id": "customer-uid-123",
  "name": "Acme Corporation",
  "tin": "123456789",
  "phone": "+255700000000"
}
```

#### Update Customer
```http
PUT /api/customers
Content-Type: application/json

{
  "id": "customer-uid-123",
  "name": "Acme Corporation",
  "tin": "123456789",
  "phone": "+255700000000"
}
```

---

### Invoices (`/api/invoices`)

#### Get All Invoices
```http
GET /api/invoices
```

#### Get Invoice by ID
```http
GET /api/invoices/:id
```

#### Get Invoice by Trip ID
```http
GET /api/invoices/trip/:tripId
```

#### Generate Invoice for Trip
```http
POST /api/invoices
Content-Type: application/json

{
  "id": "invoice-uid-123",
  "tripId": "trip-uid-123",
  "status": "draft",
  "paidAmount": 0
}
```

#### Update Invoice Status
```http
PATCH /api/invoices/:id/status
Content-Type: application/json

{
  "status": "issued"
}
```

**Invoice Status Options:** `draft`, `issued`, `paid`, `cancelled`

**Invoice Payment Status Options:** `unpaid`, `partially_paid`, `full_paid`

---

### Receipts (`/api/receipts`)

#### Get All Receipts
```http
GET /api/receipts
```

#### Get Receipt by ID
```http
GET /api/receipts/:id
```

#### Create Receipt
```http
POST /api/receipts
Content-Type: application/json

{
  "id": "receipt-uid-123",
  "invoiceId": "invoice-uid-123",
  "amount": 100000,
  "paidAt": "2026-03-10T12:00:00.000Z",
  "reference": "M-PESA-TX-123",
  "notes": "First installment",
  "attachment": "/uploads/receipt-123.jpg"
}
```

Creating a receipt updates both invoice and trip payment totals in the same transaction:
- `invoice.paidAmount` increases by receipt amount
- `invoice.paymentStatus` is recalculated
- `invoice.status` becomes `paid` when fully paid
- `trip.paidAmount` is updated to match the invoice paid amount

---

### Vehicles (`/api/vehicles`)

#### Get All Vehicles
```http
GET /api/vehicles
```

#### Get Vehicle by ID
```http
GET /api/vehicles/:id
```

#### Create Vehicle
```http
POST /api/vehicles
Content-Type: application/json

{
  "registrationNo": "T123 ABC",
  "registrationYear": 2022,
  "tankCapacity": 400,
  "mileagePerFullTank": 1200,
  "isActive": true
}
```

#### Update Vehicle
```http
PUT /api/vehicles
Content-Type: application/json

{
  "id": "vehicle-id",
  "registrationNo": "T123 ABC",
  "registrationYear": 2022,
  "tankCapacity": 400,
  "mileagePerFullTank": 1200,
  "isActive": true
}
```

---

### Drivers (`/api/drivers`)

#### Get All Drivers
```http
GET /api/drivers
```

#### Get Driver by ID
```http
GET /api/drivers/:id
```

#### Create Driver
```http
POST /api/drivers
Content-Type: application/json

{
  "firstName": "Amina",
  "lastName": "Mollel",
  "email": "amina@example.com",
  "phone": "+255700000001",
  "address": "Dar es Salaam",
  "dateOfBirth": "1990-02-01",
  "licenseNumber": "DLN-12345",
  "licenseIssueDate": "2021-01-01",
  "licenseExpiryDate": "2029-01-01",
  "licenseClass": "Class C",
  "licenseFrontPagePhoto": "/uploads/license-front.jpg",
  "driverPhoto": "/uploads/driver-photo.jpg",
  "isActive": true
}
```

#### Update Driver
```http
PUT /api/drivers
Content-Type: application/json

{
  "id": "driver-id",
  "firstName": "Amina",
  "lastName": "Mollel",
  ...
}
```

---

### Routes (`/api/routes`)

#### Get All Routes
```http
GET /api/routes
```

#### Get Route by ID
```http
GET /api/routes/:id
```

#### Create Route
```http
POST /api/routes
Content-Type: application/json

{
  "name": "DSM - Arusha",
  "mileage": 640,
  "startLocation": "Dar es Salaam",
  "endLocation": "Arusha",
  "estimatedDuration": 10,
  "isActive": true
}
```

#### Update Route
```http
PUT /api/routes
Content-Type: application/json

{
  "id": "route-id",
  "name": "DSM - Arusha",
  "mileage": 640,
  ...
}
```

---

### Expenses (`/api/expenses`)

#### Get All Expenses
```http
GET /api/expenses
```

#### Get Expense by ID
```http
GET /api/expenses/:id
```

#### Create Expense
```http
POST /api/expenses
Content-Type: application/json

{
  "name": "Fuel",
  "category": "GENERAL",
  "description": "Fuel purchase at station",
  "isActive": true
}
```

**Category Options:** `GENERAL`, `OTHER`

#### Update Expense
```http
PUT /api/expenses
Content-Type: application/json

{
  "id": "expense-id",
  "name": "Fuel",
  "category": "GENERAL",
  ...
}
```

---

### Cargo Types (`/api/cargo-types`)

#### Get All Cargo Types
```http
GET /api/cargo-types
```

#### Get Cargo Type by ID
```http
GET /api/cargo-types/:id
```

#### Create Cargo Type
```http
POST /api/cargo-types
Content-Type: application/json

{
  "name": "Perishable",
  "isActive": true
}
```

#### Update Cargo Type
```http
PUT /api/cargo-types
Content-Type: application/json

{
  "id": "cargo-type-id",
  "name": "Perishable",
  "isActive": true
}
```

---

### Permit Registrations (`/api/permit-registrations`)

#### Get All Permit Registrations
```http
GET /api/permit-registrations
```

#### Get Permit Registration by ID
```http
GET /api/permit-registrations/:id
```

#### Create Permit Registration
```http
POST /api/permit-registrations
Content-Type: application/json

{
  "id": "permit-reg-id",
  "name": "Road License",
  "authorizingBody": "Tanzania Revenue Authority",
  "isActive": true
}
```

#### Update Permit Registration
```http
PUT /api/permit-registrations
Content-Type: application/json

{
  "id": "permit-reg-id",
  "name": "Road License",
  "authorizingBody": "Tanzania Revenue Authority",
  "isActive": true
}
```

---

### Vehicle Permits (`/api/vehicle-permits`)

#### Get All Vehicle Permits
```http
GET /api/vehicle-permits
```

#### Get Vehicle Permit by ID
```http
GET /api/vehicle-permits/:id
```

#### Create Vehicle Permit
```http
POST /api/vehicle-permits
Content-Type: application/json

{
  "description": "Road license",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "attachment": "/uploads/permit.pdf",
  "vehicleId": "vehicle-uid-123"
}
```

#### Update Vehicle Permit
```http
PUT /api/vehicle-permits
Content-Type: application/json

{
  "id": "permit-id",
  "description": "Road license",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "attachment": "/uploads/permit.pdf",
  "vehicleId": "vehicle-uid-123"
}
```

---

### Trip Expenses (`/api/trip-expenses`)

#### Get All Trip Expenses
```http
GET /api/trip-expenses
```

#### Get Trip Expense by ID
```http
GET /api/trip-expenses/:id
```

#### Create Trip Expense
```http
POST /api/trip-expenses
Content-Type: application/json

{
  "tripId": "trip-uid-123",
  "expenseId": "expense-uid-123",
  "amount": 150000,
  "receiptAttachment": "/uploads/receipt.jpg",
  "date": "2026-03-07T11:00:00.000Z"
}
```

#### Update Trip Expense
```http
PUT /api/trip-expenses
Content-Type: application/json

{
  "id": "trip-expense-id",
  "tripId": "trip-uid-123",
  "expenseId": "expense-uid-123",
  "amount": 150000,
  "receiptAttachment": "/uploads/receipt.jpg",
  "date": "2026-03-07T11:00:00.000Z"
}
```

---

### File Upload (`/api/upload`)

#### Upload File
```http
POST /api/upload
Content-Type: multipart/form-data

file: <binary-file-data>
```

**Response:**
```json
{
  "filePath": "/uploads/1234567890-123456789.jpg"
}
```

Use this file path in fields like `driverPhoto`, `licenseFrontPagePhoto`, `receiptAttachment`, etc.

## Data Models

### Common Fields (All Models)
```typescript
{
  "id": "string (UUID)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "createdBy": "string (user ID)",
  "updatedBy": "string (user ID)"
}
```

### User Model
```typescript
{
  "id": "string",
  "firstName": "string",
  "surname": "string",
  "email": "string | null",
  "phoneNumber": "string",
  "username": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Trip Model
```typescript
{
  "id": "string",
  "tripDate": "string",
  "endDate": "string",
  "vehicleId": "string",
  "driverId": "string",
  "routeId": "string",
  "cargoTypeId": "string",
  "customerId": "string",
  "customer": "CustomerModel",
  "revenue": "number",
  "paidAmount": "number",
  "income": "number",
  "status": "pending | inprogress | completed | cancelled",
  "expenses": "TripExpenseModel[]",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Customer Model
```typescript
{
  "id": "string",
  "name": "string",
  "tin": "string",
  "phone": "string | undefined",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Invoice Model
```typescript
{
  "id": "string",
  "invoiceNumber": "string",
  "tripId": "string",
  "customerId": "string",
  "customer": "CustomerModel",
  "trip": "TripModel",
  "amount": "number",
  "paidAmount": "number",
  "paymentStatus": "unpaid | partially_paid | full_paid",
  "description": "string | undefined",
  "status": "draft | issued | paid | cancelled",
  "issuedAt": "string | undefined",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Receipt Model
```typescript
{
  "id": "string",
  "invoiceId": "string",
  "invoice": "InvoiceModel",
  "amount": "number",
  "paidAt": "string",
  "reference": "string | undefined",
  "notes": "string | undefined",
  "attachment": "string | undefined",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Vehicle Model
```typescript
{
  "id": "string",
  "registrationNo": "string",
  "registrationYear": "number",
  "tankCapacity": "number",
  "mileagePerFullTank": "number",
  "permits": "VehiclePermitModel[]",
  "isActive": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Driver Model
```typescript
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "dateOfBirth": "string",
  "licenseNumber": "string",
  "licenseIssueDate": "string",
  "licenseExpiryDate": "string",
  "licenseClass": "string",
  "licenseFrontPagePhoto": "string",
  "driverPhoto": "string",
  "isActive": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Permit Registration Model
```typescript
{
  "id": "string",
  "name": "string",
  "authorizingBody": "string",
  "isActive": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## Error Handling

### Standard Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Examples

### Complete Frontend Integration Example (React + TypeScript)

```typescript
// api.ts
const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  private credentials: string;

  constructor(username: string, password: string) {
    this.credentials = btoa(`${username}:${password}`);
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Basic ${this.credentials}`,
      'Content-Type': 'application/json'
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async uploadFile(file: File): Promise<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}

// Usage
const api = new ApiClient('myusername', 'MyPassword123!');

// Get all trips
const trips = await api.get('/trips');

// Create a new vehicle
const newVehicle = await api.post('/vehicles', {
  registrationNo: 'T456 XYZ',
  tankCapacity: 500,
  mileagePerFullTank: 1500,
  isActive: true
});

// Upload a file
const file = document.querySelector('input[type="file"]').files[0];
const { filePath } = await api.uploadFile(file);
```

## Project Setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
