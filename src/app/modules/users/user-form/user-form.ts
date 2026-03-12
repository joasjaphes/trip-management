import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './user-form.html'
})
export class UserForm {
  firstName = '';
  lastName = '';
  username = '';
  email = '';
  phone = '';
  role = 'ADMIN';
  isActive = true;

  saveText = signal('Save changes');
  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  close = output()

  constructor(private router: Router) {}

  cancel() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 3000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving user...');
    this.loading.set(true);

    try {
      console.log('User submitted');
      this.successMessage.set('User saved successfully.');
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save user. Please try again.'));
    } finally {
      this.loading.set(false);
      this.actionMessage.set(null);
    }

    await this.waitForLoadingToFinish();
    if (!this.errorMessage()) {
      this.close.emit();
    }
  }
}
