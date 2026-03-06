# Modern Data Table Component - Usage Guide

A fully-featured, accessible, and modern Angular data table component with sorting, pagination, filtering, and row selection.

## Features

✨ **Modern Features:**
- **Sorting** - Click column headers to sort (for sortable columns)
- **Pagination** - Navigate through pages with configurable page sizes
- **Search/Filter** - Real-time search across all columns
- **Row Selection** - Checkbox selection for individual or all rows
- **Responsive Design** - Mobile-friendly with responsive layouts
- **Dark Mode** - Automatic dark mode support
- **Accessibility** - Full WCAG AA compliance with ARIA attributes
- **Type-Safe** - Full TypeScript support with proper interfaces

## Basic Import

```typescript
import { DataTable, TableConfig } from '@shared/components/data-table/data-table';
```

## Basic Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { DataTable, TableConfig } from '@shared/components/data-table/data-table';

@Component({
  selector: 'app-user-management',
  imports: [DataTable],
  template: `
    <app-data-table
      [config]="tableConfig()"
      [data]="users()"
      [title]="'Users'"
      (rowClick)="onRowClick($event)"
      (rowSelect)="onRowSelect($event)"
      (sortChange)="onSortChange($event)"
    ></app-data-table>
  `
})
export class UserManagementComponent {
  users = signal([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  ]);

  tableConfig = signal<TableConfig>({
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: false },
    ],
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
  });

  onRowClick(row: any) {
    console.log('Row clicked:', row);
    // Handle row click - navigate to detail view, open modal, etc.
  }

  onRowSelect(selectedRows: any[]) {
    console.log('Selected rows:', selectedRows);
    // Handle multi-selection - bulk actions, etc.
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }) {
    console.log('Sort changed:', event);
    // Handle sort change - fetch sorted data from API, etc.
  }
}
```

## Advanced Configuration Example

```typescript
const advancedConfig: TableConfig = {
  columns: [
    { 
      key: 'id', 
      label: 'ID', 
      sortable: true,
      width: '80px'
    },
    { 
      key: 'name', 
      label: 'Full Name', 
      sortable: true,
      width: '200px'
    },
    { 
      key: 'email', 
      label: 'Email Address', 
      sortable: true,
      width: 'auto'
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: false,
      width: '120px'
    },
  ],
  pageSize: 25,
  striped: true,
  hover: true,
  bordered: true, // Add borders around cells
};
```

## Component Inputs

### config: TableConfig
```typescript
interface TableConfig {
  columns: TableColumn[];      // Column definitions
  pageSize?: number;           // Items per page (default: 10)
  striped?: boolean;          // Alternate row colors (default: true)
  hover?: boolean;            // Highlight on hover (default: true)
  bordered?: boolean;         // Cell borders (default: false)
}

interface TableColumn {
  key: string;                // Data property key
  label: string;              // Display label
  sortable?: boolean;         // Is column sortable
  width?: string;             // CSS width (e.g., '200px', '20%)
}
```

### data: any[]
Array of row objects matching the configured column keys.

### title?: string
Optional title displayed above the table.

## Component Outputs

### rowClick
Emitted when a row is clicked.
```typescript
(rowClick)="onRowClick($event)" // $event is the row object
```

### rowSelect
Emitted when row selection changes.
```typescript
(rowSelect)="onRowSelect($event)" // $event is array of selected rows
```

### sortChange
Emitted when sort changes.
```typescript
(sortChange)="onSortChange($event)"
// $event: { column: string; direction: 'asc' | 'desc' }
```

## Real-World Example: Trip Management

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { DataTable, TableConfig } from '@shared/components/data-table/data-table';
import { Trip } from '@models/trip.model';
import { TripService } from '@services/trip.service';

@Component({
  selector: 'app-trips',
  imports: [DataTable],
  template: `
    <app-data-table
      [config]="tripTableConfig()"
      [data]="trips()"
      [title]="'Trip Management'"
      (rowClick)="viewTripDetails($event)"
      (rowSelect)="onTripsSelected($event)"
      (sortChange)="onSortChange($event)"
    ></app-data-table>
  `
})
export class TripsComponent {
  private tripService = inject(TripService);

  trips = signal<Trip[]>([]);
  selectedTrips = signal<Trip[]>([]);

  tripTableConfig = signal<TableConfig>({
    columns: [
      { key: 'id', label: 'Trip ID', sortable: true, width: '100px' },
      { key: 'destination', label: 'Destination', sortable: true },
      { key: 'startDate', label: 'Start Date', sortable: true, width: '140px' },
      { key: 'endDate', label: 'End Date', sortable: true, width: '140px' },
      { key: 'status', label: 'Status', sortable: true, width: '120px' },
      { key: 'budget', label: 'Budget', sortable: true, width: '120px' },
    ],
    pageSize: 15,
    striped: true,
    hover: true,
    bordered: false,
  });

  constructor() {
    this.loadTrips();
  }

  loadTrips() {
    this.tripService.getAllTrips().subscribe(trips => {
      this.trips.set(trips);
    });
  }

  viewTripDetails(trip: Trip) {
    // Navigate to trip details/edit page
    console.log('Viewing trip:', trip);
  }

  onTripsSelected(selectedTrips: Trip[]) {
    this.selectedTrips.set(selectedTrips);
    // Enable bulk actions toolbar, etc.
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }) {
    // Optionally fetch sorted data from server
    console.log('Sort by:', event.column, event.direction);
  }
}
```

## Styling & Customization

### CSS Variables (Coming in v2)
Currently, all styling is internal. The component follows:
- Default theme with blue accents (#3b82f6)
- Automatic dark mode detection (prefers-color-scheme)
- Responsive breakpoints at 640px and 768px
- Accessible color contrast (WCAG AA)

### Built-in Styling Options

```typescript
// Control visual style with config options
config: TableConfig = {
  columns: [...],
  striped: true,  // Zebra striping
  hover: true,    // Row highlight on hover
  bordered: true, // Cell borders
  pageSize: 10,   // Pagination size
}
```

## Accessibility Features

✅ **WCAG AA Compliant:**
- Full keyboard navigation (Tab, Enter, Space)
- ARIA labels on all interactive elements
- Semantic HTML (table, thead, tbody, th, td)
- Focus indicators on buttons and clickable rows
- Screen reader support for sort direction
- Proper table role and aria-sort attributes
- Accessible color contrast (4.5:1 minimum)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- **Signal-based** - Reactive updates with minimal re-renders
- **OnPush Change Detection** - Optimized performance
- **Computed Values** - Derived state updated only when dependencies change
- **Large Datasets** - Efficiently handles pagination for thousands of rows

## Tips & Best Practices

1. **Use Computed Signals** - Filter/transform data outside the component:
   ```typescript
   filteredTrips = computed(() => {
     return this.trips().filter(trip => trip.status === 'active');
   });
   ```

2. **Track by Index** - The template uses `track $index` for optimal performance

3. **Mobile-First** - The table is fully responsive; test on mobile devices

4. **Keyboard Navigation** - Test with keyboard only to ensure accessibility

5. **Server-Side Operations** - Connect to server for large datasets:
   - Listen to `sortChange` to fetch sorted data
   - Implement your own pagination logic separately

## Troubleshooting

**Table not displaying?**
- Ensure `data` input provides an array
- Check `config.columns` matches your data structure
- Verify columns have `key` properties matching data properties

**Styling issues?**
- Check for CSS conflicts in your styles
- Ensure table container has sufficient width
- Test in different browsers

**Performance issues?**
- Consider virtual scrolling for very large datasets (1000+ rows)
- Use `pageSize` to limit visible rows
- Implement server-side filtering/sorting

For more information, see the component source at:
`src/app/shared/components/data-table/`
