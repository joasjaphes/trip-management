import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  pageSize?: number;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
}

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, FormsModule],
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
  });
  data = input<any[]>([]);
  title = input<string>('');

  // Outputs
  rowClick = output<any>();
  rowSelect = output<any[]>();
  sortChange = output<{ column: string; direction: 'asc' | 'desc' }>();

  // State
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  selectedRows = signal<Set<number>>(new Set());
  pageSize = signal<number>(10);

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
}
