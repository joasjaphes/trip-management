import { NgClass } from '@angular/common';
import { Component, EventEmitter, model, Output } from '@angular/core';

@Component({
  selector: 'app-layout',
  imports: [NgClass],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  title = model();
  subtitle = model();
  viewDetails = model(false);
  showAddButton = model(true);
  addText = model('Add New');
  formTitle = model('Add New Item');

  @Output() add = new EventEmitter<void>();

  onAdd() {
    this.add.emit();
  }

  closeDetails() {
    this.viewDetails.set(false);
  }

}
