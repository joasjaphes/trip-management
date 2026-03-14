import { CommonModule } from '@angular/common';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { Layout } from '../../../shared/components/layout/layout';
import { CompanyProfileForm } from './company-profile-form/company-profile-form';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { CompanyProfile } from '../../../models/company-profile.model';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, Layout, CompanyProfileForm],
  templateUrl: './company-profile.html',
})
export class CompanyProfilePage implements OnInit {
  private companyProfileService = inject(CompanyProfileService);

  title = signal('Company profile');
  description = signal('Manage your company identity and contact details.');

  loading = this.companyProfileService.loading;
  saving = signal(false);
  profile = this.companyProfileService.profile;
    showAddButton = signal(false);

  async ngOnInit(): Promise<void> {
    await this.companyProfileService.get();
  }

  async onSave(payload: CompanyProfile): Promise<void> {
    this.saving.set(true);
    try{
        await this.companyProfileService.save(payload);
    }catch(e){
        console.error('Failed to save company profile', e);
    }
    this.saving.set(false);
  }
}