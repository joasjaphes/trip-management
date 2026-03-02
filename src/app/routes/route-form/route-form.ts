import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-route-form',
  imports: [],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">Add Route</h1>
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <p class="text-center text-base-content/60">Route form will be displayed here</p>
          <div class="card-actions justify-end mt-4">
            <button class="btn btn-ghost" (click)="goBack()">Cancel</button>
            <button class="btn btn-primary">Save Route</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RouteForm {
  constructor(private router: Router) {}
  
  goBack() {
    this.router.navigate(['/routes']);
  }
}
