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

describe('InvoiceView layout', () => {
  let fixture: ComponentFixture<InvoiceView>;

  const profile = {
    companyName: 'Acme',
    tin: '111',
    bankAccountName: 'Acme Haulage Ltd',
    bankAccountNumber: '0150123456',
    bankBranch: 'Kariakoo',
    bankName: 'NMB Bank',
    bankSwiftCode: 'NMIBTZTZ',
  };

  const trip = (unitOfMeasure: string) => ({
    id: 't1',
    vehicle: { registrationNo: 'T 389 ERZ' },
    cargoType: { name: 'AGO', unitOfMeasure, allowableLoss: 117 },
    docNumber: '26SFS000168-0217',
    route: { endLocation: 'Kigoma' },
    ratePerUnit: 90,
    cargoQuantity: 39000,
    loadedQuantity: 38711.4,
    offloadedQuantity: 38620.79,
    revenue: 3484.03,
  });

  const invoiceFor = (unitOfMeasure: string) => ({
    id: 'i1',
    invoiceNumber: 'INV-1',
    amount: 3484.03,
    vatAmount: 0,
    customer: { name: 'Mima Trans', tin: '190-885-992' },
    trips: [trip(unitOfMeasure)],
    createdAt: new Date('2026-11-12'),
  });

  const litresInvoice = invoiceFor('Litres');
  const otherInvoice = invoiceFor('Tonnes');

  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => (root().textContent ?? '').replace(/\s+/g, ' ');

  const render = async (invoice: any, companyProfile: any = profile) => {
    fixture.componentRef.setInput('invoice', invoice);
    fixture.componentRef.setInput('companyProfile', companyProfile);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InvoiceView] }).compileComponents();
    fixture = TestBed.createComponent(InvoiceView);
  });

  it('keeps every label and value of the current invoice (litres)', async () => {
    await render(litresInvoice);

    for (const expected of [
      'Tax Invoice', 'Invoice No.', 'INV-1', 'Delivery Note', 'Dated', 'Mode/Term of payment B/D',
      'Customer/Buyer', 'Mima Trans', 'TIN 190-885-992', 'S/N', 'Description',
      'Destination', 'Rate(USD)', 'Amount Loaded', 'Loaded@20C', 'Offloaded@20C', 'Loss(@20C)', 'Allowable Loss(L)',
      'Net Loss(L)', 'Chargeable Loss (USD)', 'Total (USD)', 'T 389 ERZ', 'Transport Charges (AGO)',
      'Kigoma', 'Amount (In words)', 'USD Only', 'INVOICE TOTAL (USD)', 'VAT 18%', 'TOTAL AMOUNT (USD)',
      'Bank Details', 'For Acme', 'Authorized Signatory',
    ]) {
      expect(text(), `missing "${expected}"`).toContain(expected);
    }
  });

  it('keeps every label of the current invoice (non-litres)', async () => {
    await render(otherInvoice);

    for (const expected of ['S/N', 'Description', 'Quantity', 'Rate(USD)', 'Amount (USD)', 'Total', 'INVOICE TOTAL (USD)', 'TOTAL AMOUNT (USD)']) {
      expect(text(), `missing "${expected}"`).toContain(expected);
    }
  });

  it('puts the title in the header in the invoice style', async () => {
    await render(litresInvoice);

    expect(root().querySelector('.inv .inv-header .inv-title')?.textContent?.trim()).toBe('Tax Invoice');
    const strayTitles = Array.from(root().querySelectorAll('h1, h2')).filter(
      (h) => h.textContent?.includes('Tax Invoice') && !h.closest('.inv-header')
    );
    expect(strayTitles).toEqual([]);
  });

  it('styles the items table', async () => {
    await render(litresInvoice);
    expect(root().querySelectorAll('.inv-items thead th').length).toBe(12);
    expect(root().querySelector('.inv-total-bar')?.textContent?.trim()).toBe('Total');

    await render(otherInvoice);
    expect(root().querySelectorAll('.inv-items thead th').length).toBe(5);
    expect(root().querySelector('.inv-total-bar')?.textContent?.trim()).toBe('Total');
  });

  it('highlights the grand total', async () => {
    await render(litresInvoice);

    expect(root().querySelector('.inv-grand-total')?.textContent).toContain('TOTAL AMOUNT (USD)');
  });

  it('shows the invoice number in the accent style', async () => {
    await render(litresInvoice);

    expect(root().querySelector('.inv-invoice-no')?.textContent?.trim()).toBe('INV-1');
  });

  it('keeps the signature box without images', async () => {
    await render(litresInvoice);

    expect(root().querySelector('.inv-sign-head')?.textContent).toContain('For Acme');
    expect(root().querySelector('.inv-sign-foot')?.textContent).toContain('Authorized Signatory');
  });

  it('removes the red/black bar', async () => {
    await render(litresInvoice);

    expect(root().querySelector('.bg-red-600')).toBeNull();
  });

  it('leaves the document number out of the trip description', async () => {
    for (const invoice of [litresInvoice, otherInvoice]) {
      await render(invoice);

      const description = root().querySelector('.inv-desc')?.textContent?.replace(/\s+/g, ' ').trim();
      expect(description).toBe('T 389 ERZ Transport Charges (AGO)');
      expect(text()).not.toContain('26SFS000168-0217');
    }
  });

  it('applies the loss formulas with the recorded price per unit', async () => {
    const lossTrip = {
      ...trip('Litres'),
      cargoType: { name: 'AGO', unitOfMeasure: 'Litres', allowableLoss: 0.3 },
      offloadedQuantity: 38500,
      pricePerUnit: 800,
    };
    await render({ ...litresInvoice, trips: [lossTrip] });

    const cells = Array.from(root().querySelectorAll('.inv-items tbody tr:first-child td')).map((td) =>
      (td.textContent ?? '').trim()
    );
    expect(cells.slice(7)).toEqual(['211.40', '117.00', '94.40', '75.52', '3,408.51']);
    expect(root().querySelector('.inv-grand-total')?.textContent).toContain('3,408.51');
  });

  it('renders without a company profile or customer', async () => {
    await render({ ...otherInvoice, customer: undefined }, null);

    expect(root().querySelector('.inv-title')).not.toBeNull();
    expect(text()).toContain('TIN -');
  });
});
