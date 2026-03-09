import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-detail.html'
})
export class TripDetail {
  constructor(private router: Router) {}
  
  goBack() {
    this.router.navigate(['/trips']);
  }
}
