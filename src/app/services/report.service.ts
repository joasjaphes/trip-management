import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClientService) {}

  async getDriversPermitStatus(): Promise<any[]> {
    return await this.http.get<any[]>('reports/driversPermitStatus');
  }

  async getVehiclesPermitStatus(): Promise<any[]> {
    return await this.http.get<any[]>('reports/vehiclesPermitStatus');
  }

  async getExpenditure(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const query = [] as string[];
    if (params.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const q = query.length ? `?${query.join('&')}` : '';
    return await this.http.get<any>(`reports/expenditure${q}`);
  }

  async getDebtors(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const query = [] as string[];
    if (params.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const q = query.length ? `?${query.join('&')}` : '';
    return await this.http.get<any>(`reports/debtors${q}`);
  }

  async getTripRevenue(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const query = [] as string[];
    if (params.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const q = query.length ? `?${query.join('&')}` : '';
    return await this.http.get<any>(`reports/tripRevenue${q}`);
  }

  async getCash(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const query = [] as string[];
    if (params.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const q = query.length ? `?${query.join('&')}` : '';
    return await this.http.get<any>(`reports/cash${q}`);
  }

  async getVehicleMaintenanceCost(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const query = [] as string[];
    if (params.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const q = query.length ? `?${query.join('&')}` : '';
    return await this.http.get<any>(`reports/vehicleMaintenance${q}`);
  }

  async getVehicleIncomeVsMaintenance(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const query = [] as string[];
    if (params.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
    const q = query.length ? `?${query.join('&')}` : '';
    return await this.http.get<any>(`reports/vehicleIncomeVsMaintenance${q}`);
  }
}
