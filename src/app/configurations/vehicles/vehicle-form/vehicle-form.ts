import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehicle-form',
  imports: [],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">Add Vehicle</h1>
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <p class="text-center text-base-content/60">Vehicle form will be displayed here</p>
          <div class="card-actions justify-end mt-4">
            <button class="btn btn-ghost" (click)="goBack()">Cancel</button>
            <button class="btn btn-primary">Save Vehicle</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VehicleForm {
  constructor(private router: Router) {}
  
  goBack() {
    this.router.navigate(['/vehicles']);
  }
}
