import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Invoice } from '../../../models/invoice.model';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-view.html',
})
export class InvoiceView {
  invoice = input<Invoice | undefined>(undefined);
  companyProfile = input<any>(null);
  loadingCompanyProfile = input(false);
  trip = input<any>(null);
  
  isLitresInvoice = computed(() =>
    this.invoice()?.trips?.[0]?.cargoType?.unitOfMeasure === 'Litres'
  );

  formatPostalAddress(value: string | null | undefined): string {
    if (!value) return '';
    return String(value).replace(/^\s*P\.?\s*O?\.?\s*BOX\.?\s*/i, '').trim();
  }

  numberToWords(amount: number): string {
    if (!amount) return 'zero';
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const numToWords = (num: number): string => {
      if ((num = num | 0) === 0) return '';
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? '-' + a[num % 10] : '');
      if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' and ' + numToWords(num % 100) : '');
      if (num < 1000000) return numToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numToWords(num % 1000) : '');
      if (num < 1000000000) return numToWords(Math.floor(num / 1000000)) + ' million' + (num % 1000000 ? ' ' + numToWords(num % 1000000) : '');
      return numToWords(Math.floor(num / 1000000000)) + ' billion' + (num % 1000000000 ? ' ' + numToWords(num % 1000000000) : '');
    };

    return numToWords(amount);
  }

  calculateLoss(trip: any): number | null {
    if (!trip?.offloadedQuantity || !trip?.loadedQuantity) {
      return null;
    }
    return trip.offloadedQuantity - trip.loadedQuantity;
  }

  calculateAllowableLoss(trip: any): number {
    return trip?.cargoType?.allowableLoss ?? 0;
  }

  calculateNetLoss(trip: any): number | null {
    const loss = this.calculateLoss(trip);
    if (loss === null) return null;
    if (Math.abs(loss) <= Math.abs(this.calculateAllowableLoss(trip))) {
      return 0;
    }
    return loss + Math.abs(this.calculateAllowableLoss(trip));
  }

  calculateChargeableLoss(trip: any): number | null {
    const netLoss = this.calculateNetLoss(trip);
    if (netLoss === null || !trip?.ratePerUnit) {
      return null;
    }
    return (trip.ratePerUnit * netLoss) / 1000;
  }

  calculateTripTotal(trip: any): number {
    if (!trip) return 0;
    const chargeableLoss = this.calculateChargeableLoss(trip) ?? 0;
    return (trip.income ?? trip.revenue ?? 0) + chargeableLoss;
  }

  calculateInvoiceTotalForLitres(invoice: Invoice | undefined): number {
    if (!invoice?.trips) return 0;
    return invoice.trips.reduce((sum, trip) => sum + this.calculateTripTotal(trip), 0);
  }

  calculateTotalChargeableLoss(invoice: Invoice | undefined): number {
    if (!invoice?.trips) return 0;
    return invoice.trips.reduce((sum, trip) => sum + (this.calculateChargeableLoss(trip) ?? 0), 0);
  }
}
