import { CommonModule } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
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
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  close = output();

  name = '';
  tin = '';
  phone = '';

  goBack() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit() {
    if (!this.name.trim() || !this.tin.trim()) {
      this.errorMessage.set('Customer name and TIN are required.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving customer...');

    try {
      await this.customerService.create({
        name: this.name.trim(),
        tin: this.tin.trim(),
        phone: this.phone.trim() || undefined,
      });

      this.successMessage.set('Customer saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save customer. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
