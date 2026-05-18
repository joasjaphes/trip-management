import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompanyProfile } from '../models/company-profile.model';
import { HttpClientService } from './http-client.service';

@Injectable({ providedIn: 'root' })
export class CompanyProfileService {
  private http = inject(HttpClientService);

  loading = signal(false);
  profile = signal<CompanyProfile | null>(null);

  // Adjust endpoint to match your backend
  private readonly endpoint = 'company-profile';

  async get(): Promise<void> {
    this.loading.set(true);
    try {
      const data: CompanyProfile = await this.http.get(this.endpoint);
      if (data.logo) {
        data.logoUrl = await this.http.getImageUrl(data.logo);
      }
      if (data.stamp) {
        data.stampUrl = await this.http.getImageUrl(data.stamp);
      }
      if (data.signature) {
        data.signatureUrl = await this.http.getImageUrl(data.signature);
      }
      this.profile.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async save(payload: CompanyProfile): Promise<void> {
    this.loading.set(true);
    try {
      const current = this.profile();
      const data = current?.id
        ? await this.http.put(`${this.endpoint}`, payload)
        : await this.http.post(this.endpoint, payload);

      this.profile.set(data);
    } finally {
      this.loading.set(false);
    }
  }
}