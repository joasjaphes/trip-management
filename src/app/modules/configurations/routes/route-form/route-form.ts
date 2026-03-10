import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { RouteService } from '../../../../services/route.service';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './route-form.html'
})
export class RouteForm {
  private routeService = inject(RouteService);
  private commonService = inject(CommonService);
  loading = this.routeService.loading;

  routeName = '';
  startLocation = '';
  endLocation = '';
  mileage = '0.00';
  estimatedDuration = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    await this.routeService.create({
      id: this.commonService.makeid(),
      name: this.routeName,
      mileage: Number(this.mileage),
      startLocation: this.startLocation || undefined,
      endLocation: this.endLocation || undefined,
      estimatedDuration: this.estimatedDuration ? Number(this.estimatedDuration) : undefined,
      isActive: this.isActive,
    });
    this.close.emit();
  }
}
