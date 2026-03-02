import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-vehicle-detail',
  imports: [],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">Vehicle Details</h1>
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <p class="text-center text-base-content/60">Vehicle details will be displayed here</p>
          <div class="card-actions justify-end mt-4">
            <button class="btn btn-ghost" (click)="goBack()">Back</button>
            <button class="btn btn-primary">Edit</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VehicleDetail {
  constructor(private route: ActivatedRoute, private router: Router) {}
  
  goBack() {
    this.router.navigate(['/vehicles']);
  }
}
