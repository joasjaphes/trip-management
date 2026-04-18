import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, model, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyProfile } from '../../../../models/company-profile.model';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { FileUploadService } from '../../../../services/file-upload.service';
import { HttpClientService } from '../../../../services/http-client.service';
import { CommonService } from '../../../../services/common.service';
import { Placeholder } from '../../../../shared/components/placeholder/placeholder';

@Component({
    selector: 'app-company-profile-form',
    standalone: true,
    imports: [CommonModule,FormsModule, SaveArea,Placeholder],
    templateUrl: './company-profile-form.html',
})
export class CompanyProfileForm implements OnChanges {
    private fileUploadService = inject(FileUploadService);
    public http = inject(HttpClientService);
    private commonService = inject(CommonService);

    @Input() data: CompanyProfile | null = null;
    @Input() loading = false;

    saving = model(false);
    showCancel = signal(true); // Enable cancel button

    @Output() save = new EventEmitter<CompanyProfile>();
    @Output() close = new EventEmitter<void>();

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
    logoUrl?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    bankBranch?: string;
    bankSwiftCode?: string;

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
            this.bankName = this.data.bankName;
            this.bankAccountNumber = this.data.bankAccountNumber;
            this.bankAccountName = this.data.bankAccountName;
            this.bankBranch = this.data.bankBranch;
            this.bankSwiftCode = this.data.bankSwiftCode;
            this.logoUrl = this.data.logoUrl;
        }
    }

    async uploadLogo(event: any): Promise<void> {
        console.log('File selected for upload:', event.target.files);
        const file = event.target.files[0];
        if (!file) return;
        this.uploadingLogo.set(true);
        try {
            const res = await this.fileUploadService.uploadFile(file);
            console.log('File uploaded successfully:', res);
            this.logoUrl = res.fileUrl;
            this.logo = res.filePath;
        } catch (error) {
            console.error('Failed to upload logo', error);
        } finally {
            this.uploadingLogo.set(false);
        }
    }

    onSubmit(): void {
        this.save.emit({
            ...this.data,
            id: this.data?.id ?? this.commonService.makeid(),
            companyName: this.companyName,
            tin: this.tin || '',
            vrn: this.vrn || '',
            country: this.country || '',
            region: this.region || '',
            district: this.district || '',
            street: this.street || '',
            plot: this.plot || '',
            postalAddress: this.postalAddress || '',
            description: this.description || '',
            logo: this.logo || '',
            bankName: this.bankName || '',
            bankAccountNumber: this.bankAccountNumber || '',
            bankAccountName: this.bankAccountName || '',
            bankSwiftCode: this.bankSwiftCode || '',
            bankBranch: this.bankBranch || '',
        });
    }

    onCancel(): void {
        console.log('Canceling company profile edit');
        this.close.emit();
    }
}