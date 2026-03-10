import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-save-area',
  imports: [],
  templateUrl: './save-area.html',
  styleUrl: './save-area.css',
})
export class SaveArea {
  save = output();
  cancel = output();
  saveText = input('Save');
  cancelText = input('Cancel');
  showCancel = input(true);
  confirmFirst = input(true);
  confirmText = input('Are you sure you want to perform this action?');
  loading = input(false);
  confirming = signal(false);

  onSave() {
    if (!this.confirmFirst()) {
      this.save.emit();
      return;
    }

    this.confirming.set(true);
  }

  onConfirmSave() {
    this.confirming.set(false);
    this.save.emit();
  }

  onCancelConfirm() {
    this.confirming.set(false);
  }

  onCancel() {
    this.confirming.set(false);
    this.cancel.emit();
  }
}
