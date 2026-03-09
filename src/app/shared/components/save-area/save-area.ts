import { Component, Output, EventEmitter, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-save-area',
  imports: [],
  templateUrl: './save-area.html',
  styleUrl: './save-area.css',
})
export class SaveArea {
  save = output()
  cancel = output();
  saveText = input('Save');
  cancelText = input('Cancel');
  showCancel = input(true);
  confirmFirst = input(true);
  confirmText = input('Are you sure you want to perform this action?');
  confirming = signal(false);

  onSave() {
    this.save.emit()
  }

  onCancel() {
    this.cancel.emit();
  }
}
