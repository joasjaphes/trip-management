/**
 * Self-contained stylesheet for the invoice document. It is used both as the
 * InvoiceView component's styles (screen) and inside the print windows, so the
 * printout matches what is shown on screen. Every class is prefixed `inv-` so
 * it can't clash with the print windows' own styles.
 */
export const INVOICE_STYLES = `
.inv {
  --inv-orange: #F25F2F;
  --inv-yellow: #FFFF00;
  --inv-grey: #F2F2F2;
  font-family: Calibri, Carlito, Arial, Helvetica, sans-serif;
  color: #000;
  background: #fff;
  font-size: 13px;
  line-height: 1.3;
}
.inv, .inv * {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  box-sizing: border-box;
}
.inv table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
.inv thead { display: table-header-group; }
.inv tr { page-break-inside: avoid; }
.inv p { margin: 0; }

/* Shared helpers */
.inv .inv-strong { font-weight: 700; }
.inv .inv-small { font-size: 12px; margin-top: 2px; }
.inv .inv-accent { color: var(--inv-orange); }
.inv .inv-label { background: var(--inv-grey); font-weight: 700; }
.inv td.inv-num { text-align: right; white-space: nowrap; }

/* Header: logo · company · title, orange rule underneath */
.inv-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 3px solid var(--inv-orange);
}
.inv-header-logo { flex: 0 0 26%; }
.inv .inv-logo { display: block; height: 110px; width: auto; max-width: 100%; object-fit: contain; }
.inv-company { flex: 1 1 auto; padding-bottom: 2px; }
.inv .inv-company-name { font-size: 15px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
.inv-company-line { font-size: 12px; line-height: 1.6; }
.inv-header-title { flex: 0 0 auto; align-self: flex-start; text-align: right; }
.inv .inv-title {
  margin: 0;
  color: var(--inv-orange);
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Details grid */
.inv-grid > tbody > tr > td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
.inv-grid > tbody > tr > td.inv-grid-nest { padding: 0; }
.inv-grid-company { width: 36%; }
.inv-grid-nest { width: 32%; }
.inv-pairs { height: 100%; }
.inv-pairs td { border: 0; border-bottom: 1px solid #000; padding: 5px 8px; font-size: 12px; vertical-align: middle; }
.inv-pairs tr:last-child td { border-bottom: 0; }
.inv-pairs td + td { border-left: 1px solid #000; }
.inv-pairs td.inv-label { width: 42%; }
.inv .inv-invoice-no { color: var(--inv-orange); font-weight: 700; font-size: 13px; }
.inv-grid-buyer { height: 72px; }
.inv-buyer-label { font-size: 12px; font-weight: 700; }
.inv .inv-buyer-name { font-weight: 700; text-transform: uppercase; margin-top: 4px; }

/* Items table: orange header, black grid, orange total bar */
.inv-items { margin-top: 12px; }
.inv-items th, .inv-items td { border: 1px solid #000; padding: 4px 5px; font-size: 12px; text-align: center; vertical-align: middle; }
.inv-items thead th { background: var(--inv-orange); color: #fff; font-weight: 700; font-size: 11.5px; line-height: 1.25; }
.inv-items td.inv-desc { text-align: left; }
.inv-items .inv-col-sn { width: 5%; }
.inv-items .inv-col-desc { width: 28%; }
.inv-items .inv-col-desc-wide { width: 45%; }
.inv-items-litres th, .inv-items-litres td { font-size: 11px; padding: 4px 3px; }
.inv-items td.inv-total-bar {
  background: var(--inv-orange);
  color: #fff;
  font-weight: 700;
  text-align: right;
  text-transform: uppercase;
  padding-right: 8px;
}

/* Amount in words + totals */
.inv-summary { margin-top: 12px; }
.inv-summary td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; }
.inv-summary td.inv-words-cell { width: 52%; vertical-align: top; }
.inv-summary td.inv-label { width: 26%; font-size: 12px; text-transform: uppercase; }
.inv-words-label { font-weight: 700; font-style: italic; }
.inv .inv-words { font-style: italic; margin-top: 6px; text-transform: capitalize; }
.inv-summary tr.inv-grand-total td { background: var(--inv-yellow); font-weight: 700; font-size: 14px; }

/* Bank details + signature box */
.inv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-top: 18px;
  page-break-inside: avoid;
}
.inv-bank { flex: 1 1 auto; }
.inv .inv-section-title {
  color: var(--inv-orange);
  font-weight: 700;
  font-size: 13px;
  text-decoration: underline;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.inv .inv-bank-row { display: flex; font-size: 12px; line-height: 1.5; padding: 2px 0; }
.inv-bank-label { flex: 0 0 110px; }
.inv-bank-value { flex: 1 1 auto; min-width: 0; font-weight: 700; }
.inv-sign-box { flex: 0 0 44%; border: 1px solid #000; }
.inv-sign-head { background: var(--inv-grey); border-bottom: 1px solid #000; padding: 4px 8px; font-weight: 700; min-height: 26px; }
.inv-sign-body { position: relative; height: 110px; display: flex; align-items: flex-end; justify-content: center; padding: 4px 8px; }
.inv .inv-signature { max-height: 100px; max-width: 65%; width: auto; height: auto; object-fit: contain; }
.inv .inv-stamp {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  max-height: 95px;
  max-width: 95px;
  width: auto;
  height: auto;
  object-fit: contain;
}
.inv-sign-foot { border-top: 1px solid #000; background: var(--inv-grey); padding: 4px 8px; text-align: center; font-weight: 700; }
`;

/** Prepends the invoice stylesheet to invoice HTML destined for a print window. */
export function withInvoiceStyles(bodyHtml: string): string {
  return `<style>${INVOICE_STYLES}</style>${bodyHtml}`;
}
