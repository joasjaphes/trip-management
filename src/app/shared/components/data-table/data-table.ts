import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'custom' | 'tripStatus' | 'invoiceStatus';
}

export interface TableConfig {
  columns: TableColumn[];
  pageSize?: number;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  actions?: {
    edit?: boolean;
    delete?: boolean;
    view?: boolean;
    more?: boolean;
  }
}

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, FormsModule, FontAwesomeModule, DecimalPipe],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable {
  // Inputs
  config = input<TableConfig>({
    columns: [],
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
    actions: {
      edit: false,
      delete: false,
      view: false,
      more: false,
    },
  });
  moreActions = input<{ label: string; key: string; action: (row: any) => void; icon?: string; }[]>([]);
  data = input<any[]>([]);
  title = input<string>('');

  // Outputs
  rowClick = output<any>();
  edit = output<any>();
  delete = output<any>();
  view = output<any>();
  more = output<any>();
  rowSelect = output<any[]>();
  sortChange = output<{ column: string; direction: 'asc' | 'desc' }>();

  // State
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  selectedRows = signal<Set<number>>(new Set());
  pageSize = signal<number>(10);
  openMoreMenuRow = signal<number | null>(null);

  hasActions = computed(() => {
    return this.config().actions && Object.values(this.config().actions).some((v) => !!v);
  });

  // Computed values
  filteredData = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const cols = this.config().columns;

    return this.data().filter((row) =>
      cols.some((col) => {
        const value = row[col.key];
        return value ? value.toString().toLowerCase().includes(search) : false;
      })
    );
  });

  sortedData = computed(() => {
    const data = [...this.filteredData()];
    const column = this.sortColumn();

    if (!column) return data;

    data.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison =
        typeof aVal === 'string'
          ? aVal.localeCompare(bVal)
          : aVal > bVal
            ? 1
            : aVal < bVal
              ? -1
              : 0;

      return this.sortDirection() === 'asc' ? comparison : -comparison;
    });

    return data;
  });

  paginatedData = computed(() => {
    const data = this.sortedData();
    const size = this.pageSize();
    const page = this.currentPage();
    const start = page * size;
    return data.slice(start, start + size);
  });

  totalPages = computed(() => {
    return Math.ceil(this.sortedData().length / this.pageSize());
  });

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i);
  });

  isAllSelected = computed(() => {
    const items = this.paginatedData();
    if (items.length === 0) return false;
    return items.every((_, idx) => this.selectedRows().has(idx));
  });

  // Methods
  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(0);
  }

  onSort(column: string) {
    const cols = this.config().columns;
    const isNotSortable = !cols.find((c) => c.key === column)?.sortable;
    if (isNotSortable) return;

    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.sortChange.emit({
      column: this.sortColumn(),
      direction: this.sortDirection(),
    });
  }

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  onSelectRow(index: number, event: Event) {
    event.stopPropagation();
    const selected = new Set(this.selectedRows());

    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }

    this.selectedRows.set(selected);
    this.emitSelectedRows();
  }

  onSelectAll(event: Event) {
    event.stopPropagation();
    const selected = new Set<number>();

    if (!this.isAllSelected()) {
      this.paginatedData().forEach((_, idx) => selected.add(idx));
    }

    this.selectedRows.set(selected);
    this.emitSelectedRows();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  private emitSelectedRows() {
    const selectedData = this.paginatedData().filter((_, idx) =>
      this.selectedRows().has(idx)
    );
    this.rowSelect.emit(selectedData);
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(0);
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    this.delete.emit(row);
  }

  onView(row: any) {
    this.view.emit(row);
  }

  onMore(row: any) {
    this.more.emit(row);
  }

  toggleMoreMenu(index: number, event: Event) {
    event.stopPropagation();
    if (this.openMoreMenuRow() === index) {
      this.openMoreMenuRow.set(null);
      return;
    }

    this.openMoreMenuRow.set(index);
  }

  onMoreMenuAction(
    action: { label: string; key: string; action: (row: any) => void },
    row: any,
    event: Event
  ) {
    event.stopPropagation();
    action.action(row);
    this.more.emit({ key: action.key, row });
    this.openMoreMenuRow.set(null);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.openMoreMenuRow.set(null);
  }

  getTripStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-50 text-yellow-600 border-yellow-200 px-2 py-2 rounded-md',
      'inprogress': 'bg-blue-50 text-blue-600 border-blue-200 px-2 py-2 rounded-md',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-200 px-2 py-2 rounded-md',
      'cancelled': 'bg-red-50 text-red-600 border-red-200 px-2 py-2 rounded-md'
    };
    return colors[status] || colors['pending'];
  }

  getInvoiceStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'full_paid': 'bg-green-50 text-green-600 border-green-200 px-2 py-2 rounded-md',
      'unpaid': 'bg-red-50 text-red-600 border-red-200 px-2 py-2 rounded-md',
      'overdue': 'bg-yellow-50 text-yellow-600 border-yellow-200 px-2 py-2 rounded-md',
      'partially_paid': 'bg-orange-50 text-orange-600 border-orange-200 px-2 py-2 rounded-md'
    };
    return colors[status] || colors['unpaid'];

  }

  getInvoiceStatusName(status: string): string {
    const names: Record<string, string> = {
      'paid': 'Paid',
      'unpaid': 'Unpaid',
      'partially_paid': 'Partially Paid',
      'full_paid': 'Full Paid'
    };
    return names[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-green-50 text-green-600 border-green-200',
      'inactive': 'bg-gray-50 text-gray-600 border-gray-200',
      'pending': 'bg-yellow-50 text-yellow-600 border-yellow-200',
      'error': 'bg-red-50 text-red-600 border-red-200'
    };
    return colors[status] || colors['inactive'];
  }
}
