import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { Vendor } from '../../../models/vendor.model';
import { VendorService } from '../../../services/vendor.service';
import { VendorFormDialog, VendorFormDialogData } from './vendor-form/vendor-form';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, DataTable, Layout],
  templateUrl: './vendors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vendors implements OnInit {
  private vendorService = inject(VendorService);
  private dialog = inject(MatDialog);

  title = signal('Vendors');
  description = signal('Manage supplier records used when posting expense transactions.');
  addText = signal('Add vendor');
  viewDetails = signal(false);

  loading = this.vendorService.loading;

  vendors = computed(() =>
    this.vendorService.allVendors().map((vendor) => ({
      ...vendor,
      vendorContact: vendor.vendorContact || '-',
      vendorAddress: vendor.vendorAddress || '-',
      createdDate: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : '-',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'vendorName', label: 'Vendor name' },
      { key: 'vendorTIN', label: 'TIN' },
      { key: 'vendorContact', label: 'Contact' },
      { key: 'vendorAddress', label: 'Address' },
      { key: 'createdDate', label: 'Created date' },
    ],
    actions: { edit: true },
  };

  async ngOnInit(): Promise<void> {
    await this.vendorService.getAll();
  }

  onAdd() {
    this.openVendorDialog({
      title: 'Add vendor',
      description: 'Create a vendor record for expense transaction selection.',
    });
  }

  onEdit(row: { id: string }) {
    const vendor = this.vendorService.getById(row.id);
    if (!vendor) {
      return;
    }

    this.openVendorDialog({
      title: 'Edit vendor',
      description: `Editing: ${vendor.vendorName}`,
      vendor,
    });
  }

  private openVendorDialog(data: VendorFormDialogData) {
    this.dialog.open(VendorFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
      restoreFocus: true,
      data,
    }).afterClosed().subscribe((result: Vendor | null | undefined) => {
      if (result) {
        void this.vendorService.getAll();
      }
    });
  }
}