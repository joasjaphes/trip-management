import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-form.html',
})
export class TripForm {
  constructor(private router: Router) {}
  
  goBack() {
    this.router.navigate(['/trips']);
  }
}
