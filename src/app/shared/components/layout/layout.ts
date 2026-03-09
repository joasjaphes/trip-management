import { Component, EventEmitter, model, Output, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type SplitSize = 'zero' | 'half' | 'third' | 'quarter' | 'two-thirds' | 'three-quarters';

interface SplitConfig {
  main: number; // percentage for main content
  form: number; // percentage for form panel
}

const SPLIT_SIZES: Record<SplitSize, SplitConfig> = {
  zero: { main: 100, form: 0 },
  half: { main: 50, form: 50 },
  third: { main: 66.66, form: 33.33 },
  quarter: { main: 75, form: 25 },
  'two-thirds': { main: 66.66, form: 33.33 },
  'three-quarters': { main: 75, form: 25 },
};

@Component({
  selector: 'app-layout',
  imports: [],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  // Two-way bound properties
  title = input();
  description = input('');
  viewDetails = model(false);
  showAddButton = model(true);
  addText = input('Add New');
  formTitle = input('Add New Item');
  formDescription = input('');

  // Split size input
  splitSize = input<SplitSize>('half'); // default to 50/50 split

  // Computed split widths
  splitConfig = computed(() => {
    const size = this.splitSize();
    return SPLIT_SIZES[size] || SPLIT_SIZES['half'];
  });

  mainContentWidth = computed(() => `${this.splitConfig().main}%`);
  formPanelWidth = computed(() => `${this.splitConfig().form}%`);

  @Output() add = new EventEmitter<void>();

  onAdd() {
    this.add.emit();
  }

  closeDetails() {
    this.viewDetails.set(false);
  }
}
