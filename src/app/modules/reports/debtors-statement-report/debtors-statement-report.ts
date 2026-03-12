import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InvoiceService } from '../../../services/invoice.service';

@Component({
  selector: 'app-debtors-statement-report',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './debtors-statement-report.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebtorsStatementReport implements OnInit {
  private invoiceService = inject(InvoiceService);

  loading = this.invoiceService.loading;
  errorMessage = this.invoiceService.errorMessage;

  debtorRows = computed(() =>
    this.invoiceService
      .allInvoices()
      .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
      .map((invoice) => {
        const paidAmount = Number(invoice.paidAmount || 0);
        const amount = Number(invoice.amount || 0);
        const balance = amount - paidAmount;

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber || invoice.id,
          customer: invoice.customer?.name || invoice.customerId || 'Unknown customer',
          tripReference: invoice.trip?.tripReferenceNumber || invoice.tripId,
          issuedAt: invoice.issuedAt || invoice.createdAt,
          amount,
          paidAmount,
          balance,
          paymentStatus: invoice.paymentStatus || (balance <= 0 ? 'full_paid' : paidAmount > 0 ? 'partially_paid' : 'unpaid'),
        };
      })
      .sort((left, right) => Number(new Date(right.issuedAt || 0)) - Number(new Date(left.issuedAt || 0)))
  );

  totalOutstanding = computed(() => this.debtorRows().reduce((sum, row) => sum + row.balance, 0));
  totalInvoiced = computed(() => this.debtorRows().reduce((sum, row) => sum + row.amount, 0));
  totalCollected = computed(() => this.debtorRows().reduce((sum, row) => sum + row.paidAmount, 0));

  async ngOnInit(): Promise<void> {
    await this.invoiceService.getAll();
  }
}