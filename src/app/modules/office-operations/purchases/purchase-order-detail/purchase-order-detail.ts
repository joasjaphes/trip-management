import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { PurchaseOrder, PurchaseOrderItem } from '../../../../models/purchase-order.model';
import { CompanyProfileService } from '../../../../services/company-profile.service';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';
import { FileUploadService } from '../../../../services/file-upload.service';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetail {
  private expenseCategoryService = inject(ExpenseCategoryService);
  private fileUploadService = inject(FileUploadService);
  private companyService = inject(CompanyProfileService);

  purchaseOrder = input.required<PurchaseOrder>();
  close = output();

  companyProfile = this.companyService.profile;
  completionAttachmentName = signal<string | undefined>(undefined);
  completionAttachmentUrl = signal<string | undefined>(undefined);

  totalAmount = computed(() =>
    (this.purchaseOrder().orderItems ?? []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    )
  );

  canPrint = computed(() => {
    const status = this.purchaseOrder().orderStatus;
    return status === 'Approved' || status === 'Completed';
  });

  constructor() {
    effect(() => {
      void this.hydrateCompletionAttachment(this.purchaseOrder().completionAttachment);
    });
  }

  private async hydrateCompletionAttachment(path: string | undefined) {
    this.completionAttachmentName.set(this.fileUploadService.getFileName(path));

    if (!path) {
      this.completionAttachmentUrl.set(undefined);
      return;
    }

    const url = await this.fileUploadService.resolveFileUrl(path);
    this.completionAttachmentUrl.set(url);
  }

  previewCompletionAttachment() {
    const url = this.completionAttachmentUrl();
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  expenseName(itemId: string): string {
    return this.expenseCategoryService.getById(itemId)?.name ?? '-';
  }

  statusClasses(status: string): string {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      Approved: 'bg-blue-50 text-blue-700 border-blue-200',
      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return colors[status] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  }

  displayStatus(status: string): string {
    return status === 'Completed' ? 'Received' : status;
  }

  onPrint() {
    if (!this.canPrint()) {
      return;
    }

    const order = this.purchaseOrder();
    const ref = order.purchaseOrderReferenceNumber || order.id;
    this.openPrintWindow(`Purchase Order ${ref}`, this.renderPurchaseOrderBody());
  }

  private renderPurchaseOrderBody(): string {
    const order = this.purchaseOrder();
    const profile = this.companyProfile();
    const datePipe = new DatePipe('en-US');
    const numberPipe = new DecimalPipe('en-US');

    const formatDate = (value?: string) =>
      value ? datePipe.transform(value, 'dd/MM/yyyy') ?? '-' : '-';
    const formatAmount = (value: number) => numberPipe.transform(value, '1.0-2') ?? '0';

    const companyName = profile?.companyName || 'EASY TRUCKING LIMITED';
    const companyAddress1 = profile?.street || 'PLOT NO. 128 BLOCK B';
    const companyAddress2 = profile?.region ? `${profile.region}` : 'GEREZANI/UHURU STREETS';
    const companyAddress3 = `P. O. BOX ${profile?.postalAddress || '6437'} ${profile?.country || 'DAR ES SALAAM'}`;
    const companyTIN = profile?.tin ? `TIN ${profile.tin}` : '';
    const companyVRN = profile?.vrn ? `VRN ${profile.vrn}` : '';

    const fallbackLogoUrl = `${window.location.origin}/assets/images/easytruckinglogo.png`;
    const logoUrl = profile?.logoUrl || fallbackLogoUrl;
    const logoBlock = `<img src="${this.escape(logoUrl)}" alt="Logo" style="height: 88px; object-fit: contain;">`;

    const items = order.orderItems ?? [];
    const itemRows = items
      .map(
        (item, idx) => `
      <tr>
        <td class="cell center">${idx + 1}</td>
        <td class="cell">${this.escape(this.expenseName(item.itemId))}</td>
        <td class="cell center">${formatAmount(Number((item as PurchaseOrderItem & { quantity?: number }).quantity ?? 1))}</td>
        <td class="cell right">${formatAmount(Number(item.amount || 0))}</td>
      </tr>`
      )
      .join('');

    const total = formatAmount(this.totalAmount());
    const statusLabel = this.displayStatus(order.orderStatus);

    return `
    <div class="po-document">
      <div class="po-header">
        <div class="po-header-left">${logoBlock}</div>
        <div class="po-header-right">
          <h1 class="company-name">${this.escape(companyName)}</h1>
          <p class="company-line">${this.escape(companyAddress1)}</p>
          <p class="company-line">${this.escape(companyAddress2)}</p>
          <p class="company-line">${this.escape(companyAddress3)}</p>
          ${companyTIN ? `<p class="company-line">${this.escape(companyTIN)}${companyVRN ? ' &nbsp; • &nbsp; ' + this.escape(companyVRN) : ''}</p>` : ''}
        </div>
      </div>

      <h2 class="po-title">Purchase Order</h2>

      <table class="meta-table">
        <tr>
          <td class="cell" style="width: 36%;">
            <div class="cell-label">Purchase Order No.</div>
            <div class="cell-value bold">${this.escape(order.purchaseOrderReferenceNumber || '-')}</div>
          </td>
          <td class="cell" style="width: 32%;">
            <div class="cell-label">Order Date</div>
            <div class="cell-value bold">${formatDate(order.orderDate)}</div>
          </td>
          <td class="cell" style="width: 32%;">
            <div class="cell-label">Status</div>
            <div class="cell-value bold uppercase">${this.escape(statusLabel)}</div>
          </td>
        </tr>
        <tr>
          <td class="cell">
            <div class="cell-label">Approved Date</div>
            <div class="cell-value bold">${formatDate(order.approvedDate)}</div>
          </td>
          <td class="cell" colspan="2">
            <div class="cell-label">Received Date</div>
            <div class="cell-value bold">${formatDate(order.completionDate)}</div>
          </td>
        </tr>
      </table>

      <table class="vendor-table">
        <tr>
          <td class="cell" style="width: 60%;">
            <div class="cell-label">Vendor</div>
            <div class="cell-value bold uppercase">${this.escape(order.vendor?.vendorName || '-')}</div>
            ${order.vendor?.vendorAddress ? `<div class="cell-sub">${this.escape(order.vendor.vendorAddress)}</div>` : ''}
            ${order.vendor?.vendorContact ? `<div class="cell-sub">Tel: ${this.escape(order.vendor.vendorContact)}</div>` : ''}
          </td>
          <td class="cell" style="width: 40%;">
            <div class="cell-label">Vendor TIN</div>
            <div class="cell-value bold">${this.escape(order.vendor?.vendorTIN || '-')}</div>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th class="cell head" style="width: 8%;">S/N</th>
            <th class="cell head" style="width: 52%;">Expense / Item</th>
            <th class="cell head" style="width: 14%;">Quantity</th>
            <th class="cell head" style="width: 26%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            itemRows ||
            `<tr><td class="cell center" colspan="4" style="padding: 24px;">No items on this order.</td></tr>`
          }
          <tr class="total-row">
            <td class="cell bold" colspan="3">Total Amount</td>
            <td class="cell right bold">${total}</td>
          </tr>
        </tbody>
      </table>

      <div class="po-footer">
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Prepared By</div>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Authorized By</div>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Received By</div>
        </div>
      </div>

      <p class="po-note">This document was generated by the Trip Management System on ${formatDate(new Date().toISOString())}.</p>
    </div>`;
  }

  private renderPrintShell(title: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.escape(title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; background: #fff; font-size: 13px; }
    .po-document { width: 100%; max-width: 210mm; margin: 0 auto; }

    .po-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 4px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
    .po-header-left { width: 30%; }
    .po-header-right { width: 70%; text-align: left; padding-left: 12px; }
    .company-name { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; margin: 0; }
    .company-line { font-size: 13px; margin: 2px 0; }

    .po-title { text-align: center; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 12px; }

    table { width: 100%; border-collapse: collapse; }
    .meta-table, .vendor-table, .items-table { border: 1px solid #000; }
    .vendor-table, .items-table { border-top: 0; }

    .cell { border: 1px solid #000; padding: 8px; vertical-align: top; }
    .cell.head { background: #f0f0f0; font-weight: 800; text-transform: uppercase; font-size: 12px; text-align: center; }
    .cell-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444; }
    .cell-value { font-size: 14px; margin-top: 4px; }
    .cell-sub { font-size: 12px; margin-top: 2px; }
    .bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }
    .center { text-align: center; }
    .right { text-align: right; }

    .items-table thead tr { page-break-inside: avoid; }
    .items-table tbody tr { page-break-inside: avoid; }
    .total-row td { background: #f0f0f0; font-size: 14px; }

    .po-footer { display: flex; justify-content: space-between; gap: 40px; margin-top: 56px; }
    .signature { flex: 1; text-align: center; }
    .signature-line { border-top: 1px solid #000; height: 1px; margin-bottom: 6px; }
    .signature-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

    .po-note { font-size: 10px; color: #666; text-align: center; margin-top: 36px; font-style: italic; }

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
  }

  private openPrintWindow(title: string, html: string) {
    const win = window.open('', '_blank', 'width=980,height=760');
    if (!win) {
      return;
    }

    win.document.open();
    win.document.write(this.renderPrintShell(title, html));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  private escape(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
