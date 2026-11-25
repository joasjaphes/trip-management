import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { CompanyProfileService } from '../../../../services/company-profile.service';
import { InvoiceService } from '../../../../services/invoice.service';
import { INVOICE_STYLES } from '../../../../shared/components/invoice-view/invoice-styles';
import { InvoicePrintoutPage } from './invoice-printout-page';

describe('InvoicePrintoutPage printing', () => {
  let fixture: ComponentFixture<InvoicePrintoutPage>;
  let component: InvoicePrintoutPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePrintoutPage],
      providers: [
        { provide: InvoiceService, useValue: { getById: () => undefined } },
        {
          provide: CompanyProfileService,
          useValue: { profile: signal({ companyName: 'Acme' }), loading: signal(false) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}) } },
        },
        { provide: Router, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePrintoutPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('invoiceIn', { id: 'i1', invoiceNumber: 'INV-1', trips: [], amount: 0 });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('sends the invoice stylesheet to the print window', () => {
    const open = vi.spyOn(component as any, 'openPrintWindow').mockImplementation(() => {});

    component.printInvoice();

    const html = open.mock.calls[0][1] as string;
    expect(html.startsWith(`<style>${INVOICE_STYLES}</style>`)).toBe(true);
    expect(html).toContain('Tax Invoice');
  });
});
