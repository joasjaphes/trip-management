import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';

interface StatementInvoiceRow {
  issuedAt: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

interface StatementTotals {
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
}

interface StatementDateRange {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-debtors-statement',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './debtors-statement.html',
  styleUrl: './debtors-statement.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebtorsStatement {
  customerName = input('');
  invoices = input<StatementInvoiceRow[]>([]);
  totals = input<StatementTotals>({
    totalInvoicedAmount: 0,
    totalPaidAmount: 0,
    totalOutstandingAmount: 0,
  });
  dateRange = input<StatementDateRange>({
    startDate: '',
    endDate: '',
  });
  close = output<void>();

  invoiceCount = computed(() => this.invoices().length);

  ngOnInit(): void {
    console.log('Debtors statement', this.invoices());
  }

  closePanel() {
    this.close.emit();
  }

  printStatement() {
    const html = this.renderPrintHtml();
    const win = window.open('', '_blank', 'width=980,height=760');
    if (!win) {
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  private renderPrintHtml() {
    const money = new DecimalPipe('en-US');
    const startDate = this.dateRange().startDate ? new Date(this.dateRange().startDate).toLocaleDateString() : 'All dates';
    const endDate = this.dateRange().endDate ? new Date(this.dateRange().endDate).toLocaleDateString() : 'All dates';
    const rows = this.invoices()
      .map((invoice) => `
        <tr>
          <td>${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : '-'}</td>
          <td>${invoice.invoiceNumber}</td>
          <td class="right">${money.transform(invoice.invoiceAmount || 0, '1.2-2')}</td>
          <td class="right">${money.transform(invoice.paidAmount || 0, '1.2-2')}</td>
          <td class="right">${money.transform(invoice.outstandingAmount || 0, '1.2-2')}</td>
        </tr>
      `)
      .join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Statement</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
    .sheet { width: 100%; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    .muted { color: #6b7280; font-size: 13px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
    .card { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
    .value { margin-top: 6px; font-size: 18px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d1d5db; padding: 10px; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; }
    td.right, th.right { text-align: right; }
    tfoot td { font-weight: 700; }
    .footer { margin-top: 18px; font-size: 12px; color: #6b7280; }
    .print-hide { display: none; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1>Customer Statement</h1>
        <div class="muted">${this.customerName()}</div>
        <div class="muted">Period: ${startDate} - ${endDate}</div>
      </div>
      <div class="muted">Printed on ${new Date().toLocaleDateString()}</div>
    </div>

    <div class="summary">
      <div class="card">
        <div class="label">Invoiced</div>
        <div class="value">${money.transform(this.totals().totalInvoicedAmount || 0, '1.2-2')}</div>
      </div>
      <div class="card">
        <div class="label">Paid</div>
        <div class="value">${money.transform(this.totals().totalPaidAmount || 0, '1.2-2')}</div>
      </div>
      <div class="card">
        <div class="label">Outstanding</div>
        <div class="value">${money.transform(this.totals().totalOutstandingAmount || 0, '1.2-2')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Invoice Date</th>
          <th>Invoice Number</th>
          <th class="right">Invoice Amount</th>
          <th class="right">Paid Amount</th>
          <th class="right">Outstanding Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5">No invoices found</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">Total</td>
          <td class="right">${money.transform(this.totals().totalInvoicedAmount || 0, '1.2-2')}</td>
          <td class="right">${money.transform(this.totals().totalPaidAmount || 0, '1.2-2')}</td>
          <td class="right">${money.transform(this.totals().totalOutstandingAmount || 0, '1.2-2')}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">Generated by the Trip Management System.</div>
  </div>
</body>
</html>`;
  }
}
