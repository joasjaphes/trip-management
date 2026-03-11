import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../services/customer.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './customer-form.html',
})
export class CustomerForm {
  private customerService = inject(CustomerService);

  loading = this.customerService.loading;
  close = output();

  name = '';
  tin = '';
  phone = '';

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    if (!this.name.trim() || !this.tin.trim()) {
      return;
    }

    await this.customerService.create({
      name: this.name.trim(),
      tin: this.tin.trim(),
      phone: this.phone.trim() || undefined,
    });

    this.close.emit();
  }
}
