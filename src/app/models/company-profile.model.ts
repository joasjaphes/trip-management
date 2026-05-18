export interface CompanyProfile {
    id?: string;
    companyName: string;
    tin: string;
    vrn: string;
    country: string;
    region: string;
    district: string;
    street: string;
    plot: string;
    postalAddress: string;
    logo?: string;
    logoUrl?: string;
    stamp?: string;
    stampUrl?: string;
    signature?: string;
    signatureUrl?: string;
    description?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    bankBranch?: string;
    bankSwiftCode?: string;
}