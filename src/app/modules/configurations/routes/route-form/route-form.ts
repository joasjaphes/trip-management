import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-form.html'
})
export class RouteForm {
  routeName = '';
  startLocation = '';
  endLocation = '';
  mileage = '0.00';
  estimatedDuration = '';
  isActive = true;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/routes']);
  }

  onSubmit() {
    console.log('Route submitted');
    this.router.navigate(['/routes']);
  }
}
