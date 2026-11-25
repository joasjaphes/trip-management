import { CommonModule } from '@angular/common';
import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { Invoice } from '../../../models/invoice.model';
import { companyAddressLines } from '../../utils/company-address';
import { tripAllowableLoss, tripChargeableLoss, tripLoss, tripNetLoss, tripTotal } from '../../utils/trip-loss';
import { INVOICE_STYLES } from './invoice-styles';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-view.html',
  // Unencapsulated so the screen gets exactly the same CSS the print windows receive.
  styles: [INVOICE_STYLES],
  encapsulation: ViewEncapsulation.None,
})
export class InvoiceView {
  invoice = input<Invoice | undefined>(undefined);
  companyProfile = input<any>(null);
  loadingCompanyProfile = input(false);
  trip = input<any>(null);
  
  isLitresInvoice = computed(() =>
    this.invoice()?.trips?.[0]?.cargoType?.unitOfMeasure === 'Litres'
  );

  companyAddressLines = computed(() => companyAddressLines(this.companyProfile()));

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
    return tripLoss(trip);
  }

  calculateAllowableLoss(trip: any): number {
    return tripAllowableLoss(trip);
  }

  calculateNetLoss(trip: any): number | null {
    return tripNetLoss(trip);
  }

  calculateChargeableLoss(trip: any): number | null {
    return tripChargeableLoss(trip);
  }

  calculateTripTotal(trip: any): number {
    return tripTotal(trip);
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
