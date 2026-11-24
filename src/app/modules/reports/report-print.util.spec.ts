import { renderBrandedHeader } from './report-print.util';

describe('renderBrandedHeader', () => {
  const lines = (profile: any): string[] => {
    const el = document.createElement('div');
    el.innerHTML = renderBrandedHeader(profile);
    return Array.from(el.querySelectorAll('.company-line')).map((p) =>
      (p.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
  };

  it('uses the same address lines as the invoice and purchase order', () => {
    expect(
      lines({
        companyName: 'Acme Haulage',
        plot: '45 Block C',
        street: 'Nyerere Road',
        region: 'Arusha',
        country: 'Tanzania',
        postalAddress: 'P.O. Box 1234',
        tin: '111-222-333',
        vrn: '40-012345-A',
      })
    ).toEqual([
      'PLOT NO. 45 BLOCK C',
      'NYERERE ROAD',
      'P. O. BOX 1234 ARUSHA',
      'TIN 111-222-333 • VRN 40-012345-A',
    ]);
  });

  it('escapes profile values', () => {
    const el = document.createElement('div');
    el.innerHTML = renderBrandedHeader({ companyName: 'Acme', street: '<b>Main</b> Rd' } as any);

    expect(el.querySelector('b')).toBeNull();
    expect(el.textContent).toContain('<B>MAIN</B> RD');
  });

  it('omits empty address fields', () => {
    expect(lines({ companyName: 'Acme' })).toEqual([]);
  });
});
