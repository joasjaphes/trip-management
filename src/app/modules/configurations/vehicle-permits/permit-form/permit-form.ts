import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { PermitRegistrationService } from '../../../../services/permit-registration.service';

@Component({
  selector: 'app-permit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './permit-form.html'
})
export class PermitForm {
  private permitRegistrationService = inject(PermitRegistrationService);
  loading = this.permitRegistrationService.loading;

  permitName = '';
  authorizingBody = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    await this.permitRegistrationService.create({
      name: this.permitName,
      authorizingBody: this.authorizingBody || undefined,
      isActive: this.isActive,
    });

    this.close.emit();
  }
}
