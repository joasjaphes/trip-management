import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="p-6 bg-white rounded-lg">
      <h2 class="text-lg font-bold text-gray-900 mb-3">{{ data.title }}</h2>
      <p class="text-sm text-gray-600 mb-6">{{ data.message }}</p>
      
      <div class="flex justify-end gap-3">
        <button
          type="button"
          (click)="onCancel()"
          class="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button
          type="button"
          (click)="onConfirm()"
          class="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors">
          {{ data.confirmText || 'Delete' }}
        </button>
      </div>
    </div>
  `
})
export class DeleteConfirmDialog {
  data = inject(MAT_DIALOG_DATA) as DeleteConfirmDialogData;
  private dialogRef = inject(MatDialogRef<DeleteConfirmDialog>);

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
