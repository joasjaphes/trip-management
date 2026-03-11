import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Layout } from '../../../shared/components/layout/layout';

@Component({
  selector: 'app-invoicing',
  imports: [Layout],
  template: `
    <app-layout
      [title]="title()"
      [description]="description()"
      [showAddButton]="false"
      [viewDetails]="false"
    >
      <main>
        <div class="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div class="max-w-2xl">
            <span class="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#f25f2f]">
              Trip Management
            </span>
            <h2 class="mt-4 text-2xl font-extrabold text-gray-900">Invoicing workspace</h2>
            <p class="mt-3 text-sm leading-6 text-gray-500">
              This section is ready for invoice generation, billing status tracking, and receivables workflows.
            </p>
          </div>
        </div>
      </main>
    </app-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invoicing {
  title = signal('Invoicing');
  description = signal('Manage trip invoices and billing workflows');
}