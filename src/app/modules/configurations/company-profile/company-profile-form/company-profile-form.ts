import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, model, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyProfile } from '../../../../models/company-profile.model';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { FileUploadService } from '../../../../services/file-upload.service';
import { HttpClientService } from '../../../../services/http-client.service';

@Component({
    selector: 'app-company-profile-form',
    standalone: true,
    imports: [CommonModule,FormsModule, SaveArea],
    templateUrl: './company-profile-form.html',
})
export class CompanyProfileForm implements OnChanges {
    private fileUploadService = inject(FileUploadService);
    public http = inject(HttpClientService);

    @Input() data: CompanyProfile | null = null;
    @Input() loading = false;

    saving = model(false);
    showCancel = signal(true); // Enable cancel button

    @Output() save = new EventEmitter<CompanyProfile>();
    @Output() cancel = new EventEmitter<void>();

    companyName: string;
    tin: string;
    vrn: string;
    country: string;
    region: string;
    district: string;
    street: string;
    plot: string;
    postalAddress: string;
    description?: string;
    logo?: string;

    saveText = signal('Update company profile');
    uploadingLogo = signal(false);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] && this.data) {
            this.companyName = this.data.companyName;
            this.tin = this.data.tin;
            this.vrn = this.data.vrn;
            this.country = this.data.country;
            this.region = this.data.region;
            this.district = this.data.district;
            this.street = this.data.street;
            this.plot = this.data.plot;
            this.postalAddress = this.data.postalAddress;
            this.description = this.data.description;
            this.logo = this.data.logo;
        }
    }

    async uploadLogo(event: any): Promise<void> {
        const file = event.target.files[0];
        if (!file) return;

        this.uploadingLogo.set(true);
        try {
            const res = await this.fileUploadService.uploadFile(file);
            this.logo = res.filePath;
        } catch (error) {
            console.error('Failed to upload logo', error);
        } finally {
            this.uploadingLogo.set(false);
        }
    }

    onSubmit(): void {
        this.save.emit({
            ...(this.data?.id ? { id: this.data.id } : {}),
            companyName: this.companyName,
            tin: this.tin,
            vrn: this.vrn,
            country: this.country,
            region: this.region,
            district: this.district,
            street: this.street,
            plot: this.plot,
            postalAddress: this.postalAddress,
            description: this.description,
            logo: this.logo,
        });
    }

    onCancel(): void {
        this.cancel.emit();
    }
}