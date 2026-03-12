import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../services/customer.service';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { Customer } from '../../../../models/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './customer-form.html',
})
export class CustomerForm implements OnInit {
  private customerService = inject(CustomerService);

  loading = this.customerService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  currentCustomer = input<Customer | null>(null);
  editMode = signal(false);
  close = output();
  saving = signal(false);


  name = '';
  tin = '';
  phone = '';

  ngOnInit(): void {
    if (this.currentCustomer()) {
      this.editMode.set(true);
      this.name = this.currentCustomer().name;
      this.tin = this.currentCustomer().tin;
      this.phone = this.currentCustomer().phone || '';
    }
  }

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
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving customer...');

    try {
      if (this.editMode()) {
        await this.customerService.update(this.currentCustomer()!.id, {
          name: this.name.trim(),
          tin: this.tin.trim(),
          phone: this.phone.trim() || undefined,
        });
      } else {
        await this.customerService.create({
          name: this.name.trim(),
          tin: this.tin.trim(),
          phone: this.phone.trim() || undefined,
        });
      }

      this.successMessage.set( this.editMode() ? 'Customer updated successfully' : 'Customer saved successfully.');
      await this.waitForLoadingToFinish();
      this.saving.set(false);
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save customer. Please try again.'));
    } finally {
      this.saving.set(false);
      this.actionMessage.set(null);
    }
  }
}
