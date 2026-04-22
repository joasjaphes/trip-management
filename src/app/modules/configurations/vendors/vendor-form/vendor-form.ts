import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Vendor } from '../../../../models/vendor.model';
import { VendorService } from '../../../../services/vendor.service';

export interface VendorFormDialogData {
  title: string;
  description: string;
  vendor?: Vendor;
}

@Component({
  selector: 'app-vendor-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendor-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorFormDialog implements OnInit {
  private vendorService = inject(VendorService);

  vendorName = '';
  vendorTIN = '';
  vendorContact = '';
  vendorAddress = '';

  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(
    private dialogRef: MatDialogRef<VendorFormDialog, Vendor | null>,
    @Inject(MAT_DIALOG_DATA) public data: VendorFormDialogData,
  ) {}

  ngOnInit(): void {
    if (this.data.vendor) {
      this.vendorName = this.data.vendor.vendorName;
      this.vendorTIN = this.data.vendor.vendorTIN;
      this.vendorContact = this.data.vendor.vendorContact || '';
      this.vendorAddress = this.data.vendor.vendorAddress || '';
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }

  async onSubmit(): Promise<void> {
    if (!this.vendorName.trim() || !this.vendorTIN.trim()) {
      this.errorMessage.set('Vendor name and TIN are required.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      if (this.data.vendor?.id) {
        await this.vendorService.update(this.data.vendor.id, {
          vendorName: this.vendorName.trim(),
          vendorTIN: this.vendorTIN.trim(),
          vendorContact: this.vendorContact.trim() || undefined,
          vendorAddress: this.vendorAddress.trim() || undefined,
        });
        const vendor = this.vendorService.getById(this.data.vendor.id);
        this.successMessage.set('Vendor updated successfully.');
        this.dialogRef.close(vendor ?? null);
      } else {
        const id = await this.vendorService.create({
          vendorName: this.vendorName.trim(),
          vendorTIN: this.vendorTIN.trim(),
          vendorContact: this.vendorContact.trim() || undefined,
          vendorAddress: this.vendorAddress.trim() || undefined,
        });
        const vendor = this.vendorService.getById(id);
        this.successMessage.set('Vendor saved successfully.');
        this.dialogRef.close(vendor ?? null);
      }
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save vendor. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }
}