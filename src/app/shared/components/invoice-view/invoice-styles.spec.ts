import { INVOICE_STYLES, withInvoiceStyles } from './invoice-styles';

describe('invoice stylesheet', () => {
  it('defines the invoice palette, font and print rules', () => {
    expect(INVOICE_STYLES).toContain('#F25F2F');
    expect(INVOICE_STYLES).toContain('#FFFF00');
    expect(INVOICE_STYLES).toContain('#F2F2F2');
    expect(INVOICE_STYLES).toContain('Calibri, Carlito, Arial');
    expect(INVOICE_STYLES).toContain('print-color-adjust: exact');
    expect(INVOICE_STYLES).toContain('-webkit-print-color-adjust: exact');
    expect(INVOICE_STYLES).toContain('table-header-group');
  });

  it('prepends the stylesheet to printed HTML', () => {
    expect(withInvoiceStyles('<p>x</p>')).toBe(`<style>${INVOICE_STYLES}</style><p>x</p>`);
  });
});
