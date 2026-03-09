import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-permit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './permit-detail.html'
})
export class PermitDetail {
  constructor(private router: Router) {}

  permit = {
    name: 'Oversize Load Permit',
    fullName: 'Oversize Load Authorization',
    authorizingBody: 'Tanzania National Roads Agency (TANROADS)',
    status: 'Active',
    createdDate: 'October 12, 2023',
  };

  goBack() {
    this.router.navigate(['/vehicle-permits']);
  }
}
