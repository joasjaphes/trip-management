import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyProfileService } from '../../../../services/company-profile.service';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';
import { FileUploadService } from '../../../../services/file-upload.service';
import { PurchaseOrderDetail } from './purchase-order-detail';

describe('PurchaseOrderDetail print header', () => {
  let fixture: ComponentFixture<PurchaseOrderDetail>;
  const profile = signal<any>(null);

  const headerLines = (): string[] => {
    const html: string = (fixture.componentInstance as any).renderPurchaseOrderBody();
    const header = document.createElement('div');
    header.innerHTML = html;
    return Array.from(header.querySelectorAll('.po-header-right .company-line')).map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
  };

  beforeEach(async () => {
    profile.set(null);
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderDetail],
      providers: [
        { provide: CompanyProfileService, useValue: { profile } },
        { provide: ExpenseCategoryService, useValue: { getById: () => undefined } },
        {
          provide: FileUploadService,
          useValue: { getFileName: () => undefined, resolveFileUrl: async () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.componentRef.setInput('purchaseOrder', {
      id: 'po-1',
      purchaseOrderReferenceNumber: 'PO-001',
      orderStatus: 'Approved',
      orderItems: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('builds the company address from the company profile', () => {
    profile.set({
      companyName: 'Acme Haulage',
      plot: '45 Block C',
      street: 'Nyerere Road',
      region: 'Arusha',
      country: 'Tanzania',
      postalAddress: 'P.O. Box 1234',
      tin: '111-222-333',
      vrn: '40-012345-A',
    });

    expect(headerLines()).toEqual([
      'PLOT NO. 45 BLOCK C',
      'NYERERE ROAD',
      'P. O. BOX 1234 ARUSHA',
      'TIN 111-222-333 • VRN 40-012345-A',
    ]);
  });

  it('omits empty address fields instead of printing hardcoded ones', () => {
    profile.set({ companyName: 'Acme', plot: '', street: '', region: '', country: '', postalAddress: '' });

    const lines = headerLines().join(' | ');
    expect(lines).toBe('');
    expect(lines).not.toContain('GEREZANI');
    expect(lines).not.toContain('128 BLOCK B');
    expect(lines).not.toContain('6437');
    expect(lines).not.toContain('DAR ES SALAAM');
  });
});
