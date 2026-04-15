import { CommonModule } from '@angular/common';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { Layout } from '../../../shared/components/layout/layout';
import { CompanyProfileForm } from './company-profile-form/company-profile-form';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { CompanyProfile } from '../../../models/company-profile.model';
import { HttpClientService } from '../../../services/http-client.service';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, Layout, CompanyProfileForm,Placeholder],
  templateUrl: './company-profile.html',
})
export class CompanyProfilePage implements OnInit {
  private companyProfileService = inject(CompanyProfileService);
  public http = inject(HttpClientService);

  title = signal('Company profile');
  description = signal('Manage your company identity and contact details.');

  loading = this.companyProfileService.loading;
  saving = signal(false);
  profile = this.companyProfileService.profile;
  showAddButton = signal(false);
  viewType = signal<'details' | 'edit'>('details');
  viewDetails = signal(false);

  async ngOnInit(): Promise<void> {
    console.log('Loading company profile...',this.profile());
    this.companyProfileService.get().then();
  }

  onEdit() {
    this.viewType.set('edit');
    this.viewDetails.set(true);
  }

  // toggleEdit() {
  //   console.log('Toggling edit mode. Current profile:', this.profile());
  //   this.isEditing.set(!this.isEditing());
  // }

  async onSave(payload: CompanyProfile): Promise<void> {
    this.saving.set(true);
    try{
        await this.companyProfileService.save(payload);
    }catch(e){
        console.error('Failed to save company profile', e);
    }
    this.saving.set(false);
    this.onCloseDetails();
  }

  onCloseDetails() {
    this.viewDetails.set(false);
    this.viewType.set('details');
  }

  async getLogoUrl(): Promise<string> {
    return await this.http.getImageUrl(this.profile()?.logo || '');
  }
}