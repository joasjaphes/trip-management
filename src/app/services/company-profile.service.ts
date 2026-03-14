import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CompanyProfile } from '../models/company-profile.model';

@Injectable({ providedIn: 'root' })
export class CompanyProfileService {
  private http = inject(HttpClient);

  loading = signal(false);
  profile = signal<CompanyProfile | null>(null);

  // Adjust endpoint to match your backend
  private readonly endpoint = '/api/company-profile';

  async get(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<CompanyProfile>(this.endpoint));
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
        ? await firstValueFrom(this.http.put<CompanyProfile>(`${this.endpoint}/${current.id}`, payload))
        : await firstValueFrom(this.http.post<CompanyProfile>(this.endpoint, payload));

      this.profile.set(data);
    } finally {
      this.loading.set(false);
    }
  }
}