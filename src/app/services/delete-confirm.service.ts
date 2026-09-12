import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  DeleteConfirmDialog,
  DeleteConfirmDialogData,
} from '../shared/components/delete-confirm-dialog/delete-confirm-dialog';

@Injectable({ providedIn: 'root' })
export class DeleteConfirmService {
  private dialog = inject(MatDialog);

  async confirm(data: DeleteConfirmDialogData): Promise<boolean> {
    return (await firstValueFrom(
      this.dialog.open(DeleteConfirmDialog, {
        width: '400px',
        maxWidth: '95vw',
        data,
      }).afterClosed()
    )) === true;
  }
}
