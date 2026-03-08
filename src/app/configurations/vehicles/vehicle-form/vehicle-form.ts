import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Permit {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  fileName: string;
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-form.html'
})
export class VehicleForm {
  registrationNo = '';
  year = '';
  tankCapacity = '';
  mileagePerFullTank = '';

  permitDescription = '';
  permitStartDate = '';
  permitEndDate = '';
  permitFileName = '';

  permits: Permit[] = [];

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/vehicles']);
  }

  addPermit() {
    if (!this.permitDescription.trim() || !this.permitStartDate || !this.permitEndDate) return;

    this.permits.push({
      id: crypto.randomUUID(),
      description: this.permitDescription.trim(),
      startDate: this.permitStartDate,
      endDate: this.permitEndDate,
      fileName: this.permitFileName,
    });

    this.permitDescription = '';
    this.permitStartDate = '';
    this.permitEndDate = '';
    this.permitFileName = '';
  }

  removePermit(id: string) {
    this.permits = this.permits.filter(p => p.id !== id);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.permitFileName = input.files[0].name;
    }
  }

  reset() {
    this.registrationNo = '';
    this.year = '';
    this.tankCapacity = '';
    this.mileagePerFullTank = '';
    this.permitDescription = '';
    this.permitStartDate = '';
    this.permitEndDate = '';
    this.permitFileName = '';
    this.permits = [];
  }

  onSubmit() {
    console.log('Vehicle submitted', { permits: this.permits });
    this.router.navigate(['/vehicles']);
  }
}
