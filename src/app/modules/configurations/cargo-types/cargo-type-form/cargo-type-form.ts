import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { CargoTypeService } from '../../../../services/cargo-type.service';

@Component({
  selector: 'app-cargo-type-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './cargo-type-form.html',
})
export class CargoTypeForm {
  private cargoTypeService = inject(CargoTypeService);
  loading = this.cargoTypeService.loading;

  name = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    await this.cargoTypeService.create({
      name: this.name,
      isActive: this.isActive,
    });

    this.close.emit();
  }
}
