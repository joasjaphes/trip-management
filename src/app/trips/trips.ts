import { Component, signal } from '@angular/core';
import { Layout } from '../shared/components/layout/layout';
import { sign } from 'crypto';

@Component({
  selector: 'app-trips',
  imports: [Layout],
  templateUrl: './trips.html',
  styleUrl: './trips.css',
})
export class Trips {
  title = signal('Trips');
  viewDetails = signal(false);
  formTitle = signal('Add New Trip');

  onAdd() {
    this.formTitle.set('Add New Trip');
    this.viewDetails.set(true);
  }

}
