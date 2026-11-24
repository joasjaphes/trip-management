import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceView } from './invoice-view';

describe('InvoiceView company address', () => {
  let fixture: ComponentFixture<InvoiceView>;

  const headerLines = (): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="company-address-line"]')
    ).map((el) => (el.textContent ?? '').trim());

  const render = async (companyProfile: any) => {
    fixture.componentRef.setInput('invoice', { invoiceNumber: 'INV-1', trips: [] });
    fixture.componentRef.setInput('companyProfile', companyProfile);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InvoiceView] }).compileComponents();
    fixture = TestBed.createComponent(InvoiceView);
  });

  it('builds the header address from the company profile', async () => {
    await render({
      companyName: 'Acme Haulage',
      plot: '45 Block C',
      street: 'Nyerere Road',
      district: 'Ilala',
      region: 'Arusha',
      country: 'Tanzania',
      postalAddress: 'P.O. Box 1234',
    });

    expect(headerLines()).toEqual([
      'PLOT NO. 45 BLOCK C',
      'NYERERE ROAD',
      'P. O. BOX 1234 ARUSHA',
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('GEREZANI');
    expect(fixture.nativeElement.textContent).not.toContain('DAR ES SALAAM');
  });

  it('does not double the "PLOT NO." prefix when the profile already has it', async () => {
    await render({ companyName: 'Acme', plot: 'Plot No. 9', street: '', region: '', postalAddress: '' });

    expect(headerLines()).toEqual(['PLOT NO. 9']);
  });

  it('does not repeat the region when the postal address already includes it', async () => {
    await render({ companyName: 'Acme', region: 'Dar es Salaam', postalAddress: '35729 Dar es Salaam' });

    expect(headerLines()).toEqual(['P. O. BOX 35729 DAR ES SALAAM']);
  });

  it('omits address lines that are empty in the profile instead of using hardcoded values', async () => {
    await render({ companyName: 'Acme', plot: '', street: '', region: '', country: '', postalAddress: '' });

    expect(headerLines()).toEqual([]);
    expect(fixture.nativeElement.textContent).not.toContain('6437');
  });

  it('falls back to the country when no region is set', async () => {
    await render({ companyName: 'Acme', region: '', country: 'Kenya', postalAddress: '500' });

    expect(headerLines()).toEqual(['P. O. BOX 500 KENYA']);
  });
});

describe('InvoiceView bank details', () => {
  let fixture: ComponentFixture<InvoiceView>;

  /** The paragraphs under the "Bank Details" heading, whitespace-normalised. */
  const bankLines = (): string[] => {
    const heading = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('p')).find(
      (p) => p.textContent?.trim() === 'Bank Details'
    );
    return Array.from(heading?.parentElement?.querySelectorAll('p') ?? [])
      .slice(1)
      .map((p) => (p.textContent ?? '').replace(/\s+/g, ' ').trim());
  };

  const render = async (companyProfile: any) => {
    fixture.componentRef.setInput('invoice', { invoiceNumber: 'INV-1', trips: [] });
    fixture.componentRef.setInput('companyProfile', companyProfile);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InvoiceView] }).compileComponents();
    fixture = TestBed.createComponent(InvoiceView);
  });

  it('shows the bank details exactly as saved in the company profile', async () => {
    await render({
      companyName: 'Acme',
      bankAccountName: 'Acme Haulage Ltd',
      bankAccountNumber: '0150123456',
      bankBranch: 'Kariakoo',
      bankName: 'NMB Bank',
      bankSwiftCode: 'NMIBTZTZ',
    });

    expect(bankLines()).toEqual([
      'Acc Name: Acme Haulage Ltd',
      'Acc No: 0150123456 USD',
      'Bank Branch: Kariakoo',
      'Bank Name: NMB Bank',
      'Swift Code: NMIBTZTZ',
    ]);
  });

  it('shows "-" for missing bank fields instead of hardcoded bank details', async () => {
    await render({ companyName: 'Acme' });

    expect(bankLines()).toEqual([
      'Acc Name: Acme',
      'Acc No: -',
      'Bank Branch: -',
      'Bank Name: -',
      'Swift Code: -',
    ]);
  });
});
