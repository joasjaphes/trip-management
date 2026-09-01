import { Component, EventEmitter, Input, OnInit, Output, resource } from '@angular/core';
import { Trip } from '../../../../models/trip.model';
import { HttpClientService } from '../../../../services/http-client.service';
import { Placeholder } from '../../../../shared/components/placeholder/placeholder';
import { DatePipe, DecimalPipe } from '@angular/common';
import { escapeCsv } from '../../drivers-permit-status/exports-helper';
import {
  escapeHtml,
  openReportPrintWindow,
  renderBrandedHeader,
  renderReportNote,
} from '../../report-print.util';

@Component({
  selector: 'app-trip-revenue-summary',
  imports: [Placeholder, DecimalPipe, DatePipe],
  templateUrl: './trip-revenue-summary.html',
  styleUrl: './trip-revenue-summary.css',
})
export class TripRevenueSummary implements OnInit {
  @Input() tripId: string | null = null;
  @Input() tripSummary:any | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private httpService:HttpClientService) {}

  trip = resource<Trip, string>( 
    {
      params: () => this.tripId,
      loader: async ({ params }) => {
        if (!params) {
          throw new Error('Trip ID is required to load trip details.');
        }
        const response = await this.httpService.get(`trips/${params}`);
        console.log('TripRevenueSummary loaded trip:', response);
        return response as Trip;
      },
    }
  );

  ngOnInit() {
    console.log('TripRevenueSummary initialized with tripId:', this.tripId);
  }

  exportExcel() {
    const tripData = this.trip.value();
    if (!tripData) return;

    const tableHtml = this.buildSummaryTableHtml(tripData, true);
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-revenue-summary-${this.tripId || 'report'}-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const tripData = this.trip.value();
    if (!tripData) return;

    const tableHtml = this.buildSummaryTableHtml(tripData, false);
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Trip Revenue Summary</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #ffffff;
            color: #111827;
          }
          .summary-export {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 8px;
            box-sizing: border-box;
          }
          .summary-export h2 {
            margin: 0 0 16px;
            font-size: 18px;
            font-weight: 800;
            text-align: left;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #d1d5db;
            background: #ffffff;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px 12px;
            text-align: left;
            vertical-align: middle;
            font-size: 12px;
            color: #111827;
          }
          th {
            background: #f9fafb;
            font-weight: 700;
            color: #000000;
          }
          .text-right {
            text-align: right;
          }
          .font-bold {
            font-weight: 700;
          }
          .font-black {
            font-weight: 800;
          }
          .border-b-2 {
            border-bottom-width: 2px;
          }
          .border-b-gray-600 {
            border-bottom-color: #4b5563;
          }
          .border-t-2 {
            border-top-width: 2px;
          }
          .border-t-gray-600 {
            border-top-color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="summary-export">
          ${tableHtml}
        </div>
      </body>
    </html>`;

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  private buildSummaryTableHtml(tripData: Trip, isExcel: boolean): string {
    const datePipe = new DatePipe('en-US');
    const numberPipe = new DecimalPipe('en-US');
    const fmt = (value: unknown) => numberPipe.transform(Number(value) || 0, '1.2-2') ?? '0.00';
    const fmtDate = (value: unknown) => {
      if (!value) return '-';
      const d = new Date(value as string);
      return Number.isNaN(d.getTime()) ? '-' : (datePipe.transform(d, 'dd/MM/yyyy') ?? '-');
    };

    const summary = this.tripSummary || {};
    const additionalTrips = tripData.additionalTrips || [];
    const expenses = tripData.expenses || [];
    const maintenance = tripData.vehicleMaintenance || [];

    const cellStyle = 'border:1px solid #d1d5db; padding:12px; vertical-align:middle; font-size:12px; color:#111827;';
    const leftStyle = `${cellStyle} text-align:left;`;
    const rightStyle = `${cellStyle} text-align:right;`;
    const centerStyle = `${cellStyle} text-align:center; font-weight:700;`;
    const headerStyle = `${cellStyle} font-weight:800; background:#f9fafb;`;
    const totalStyle = `${cellStyle} text-align:right; font-weight:800; border-top:2px solid #4b5563; border-bottom:2px solid #4b5563;`;

    const usdValue = (currency: string | undefined, value: unknown) =>
      currency === 'USD' ? escapeHtml(fmt(value)) : '-';

    const incomeRows = [
      `<tr>
        <td style="${rightStyle}">${escapeHtml(fmtDate(tripData.tripDate))}</td>
        <td style="${leftStyle}">${escapeHtml(tripData.route?.name || '-')}</td>
        <td style="${rightStyle}">${usdValue(tripData.route?.routeCurrency, tripData.revenue)}</td>
        <td style="${rightStyle}">${escapeHtml(fmt(tripData.equivalentAmount))}</td>
      </tr>`,
      ...additionalTrips.map((additionalTrip: any) => `
        <tr>
          <td style="${rightStyle}">${escapeHtml(fmtDate(additionalTrip.startDate))}</td>
          <td style="${leftStyle}">${escapeHtml(`${additionalTrip.fromLocation || '-'} - ${additionalTrip.toLocation || '-'}`)}</td>
          <td style="${rightStyle}">${usdValue(additionalTrip.currency, additionalTrip.revenue)}</td>
          <td style="${rightStyle}">${escapeHtml(fmt(additionalTrip.equivalentAmount))}</td>
        </tr>
      `),
      `<tr>
        <td colspan="3" style="${cellStyle}">&nbsp;</td>
        <td style="${totalStyle}">${escapeHtml(fmt(summary.tripRevenue))}</td>
      </tr>`,
    ].join('');

    const expenseRows = expenses.map((expense: any) => `
      <tr>
        <td colspan="2" style="${leftStyle}">${escapeHtml(expense.expenseDescription || '-')}</td>
        <td style="${rightStyle}"> - </td>
        <td style="${rightStyle}">${escapeHtml(fmt(expense.amount))}</td>
      </tr>
    `).join('');

    const maintenanceRows = maintenance.map((expense: any) => `
      <tr>
        <td colspan="2" style="${leftStyle}">${escapeHtml(expense.description || '-')}</td>
        <td style="${rightStyle}"> - </td>
        <td style="${rightStyle}">${escapeHtml(fmt(expense.cost))}</td>
      </tr>
    `).join('');

    const table = `
      <table style="width:100%; border-collapse:collapse; border:1px solid #d1d5db; background:#ffffff; font-family:Arial, Helvetica, sans-serif; color:#111827;">
        <tbody>
          <tr>
            <td colspan="2" style="${headerStyle}">Income</td>
            <td style="${centerStyle}">USD</td>
            <td style="${centerStyle}">TZS</td>
          </tr>
          ${incomeRows}
          <tr>
            <td colspan="4" style="${headerStyle}">Expenses</td>
          </tr>
          ${expenseRows || `<tr><td colspan="4" style="${cellStyle} text-align:center;">-</td></tr>`}
          <tr>
            <td colspan="3" style="${cellStyle} font-weight:700;">&nbsp;</td>
            <td style="${totalStyle}">${escapeHtml(fmt(summary.totalTripExpenses))}</td>
          </tr>
          <tr>
            <td colspan="4" style="${headerStyle}">Maintenance Cost</td>
          </tr>
          ${maintenanceRows || `<tr><td colspan="4" style="${cellStyle} text-align:center;">-</td></tr>`}
          <tr>
            <td colspan="3" style="${cellStyle} font-weight:700;">&nbsp;</td>
            <td style="${totalStyle}">${escapeHtml(fmt(summary.vehicleMaintenanceCost))}</td>
          </tr>
          <tr>
            <td colspan="3" style="${cellStyle} font-weight:700;">Grand Total</td>
            <td style="${totalStyle}">${escapeHtml(fmt(summary.netIncome))}</td>
          </tr>
        </tbody>
      </table>
    `;

    return isExcel ? table : `
      <div style="width:100%; background:#ffffff; padding:12px; box-sizing:border-box; font-family:Arial, Helvetica, sans-serif; color:#111827;">
        ${table}
      </div>
    `;
  }

  onClose() {
    this.close.emit();
  }
}
