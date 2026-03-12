import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-progress-bar',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (loading) {
    <div  class="w-full overflow-hidden rounded-full h-1.5 bg-blue-100">
      <div class="h-full bg-blue-500 rounded-full animate-indeterminate origin-left"></div>
    </div>
    }
  `,
    styles: `
    @keyframes indeterminate {
      0%   { transform: translateX(-100%) scaleX(0.1); }
      30%   { transform: translateX(-100%) scaleX(0.3); }
      50%  { transform: translateX(50%)   scaleX(0.6); }
      100% { transform: translateX(200%)  scaleX(0.3); }
    }
    .animate-indeterminate {
      animation: indeterminate 1.4s ease-in-out infinite;
    }
  `
})
export class ProgressBar {
    @Input() loading = true;
}