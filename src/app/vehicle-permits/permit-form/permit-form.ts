import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-permit-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permit-form.html'
})
export class PermitForm {
  permitName = '';
  authorizingBody = '';
  isActive = true;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/vehicle-permits']);
  }

  onSubmit() {
    console.log('Permit submitted', {
      name: this.permitName,
      authorizingBody: this.authorizingBody,
      isActive: this.isActive
    });
    this.router.navigate(['/vehicle-permits']);
  }
}
