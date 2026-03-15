import { Directive, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
    selector: 'input[appNumberFormat]',
    standalone: true,
})
export class NumberFormatDirective implements OnInit {
    private readonly el = inject(ElementRef<HTMLInputElement>);
    private readonly tooltip = inject(MatTooltip, { optional: true, self: true });

    ngOnInit(): void {
        const input = this.el.nativeElement;
        input.setAttribute('inputmode', 'decimal');
        input.setAttribute('autocomplete', 'off');

        if (input.value) {
            input.value = this.formatValue(input.value);
        }

        this.updateTooltip(input.value);
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        const allowedKeys = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'Home', 'End',
        ];

        if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;

        const isDigit = /^\d$/.test(event.key);
        const isDot = event.key === '.';

        if (!isDigit && !isDot) {
            event.preventDefault();
            return;
        }

        if (isDot && this.getRawValue(this.el.nativeElement.value).includes('.')) {
            event.preventDefault();
        }
    }

    @HostListener('focus')
    onFocus(): void {
        this.updateTooltip(this.el.nativeElement.value, true);
    }

    @HostListener('input')
    onInput(): void {
        const input = this.el.nativeElement;
        const formatted = this.formatValue(input.value);
        input.value = formatted;
        this.updateTooltip(formatted, true); // show while typing
    }

    @HostListener('blur')
    onBlur(): void {
        const input = this.el.nativeElement;
        input.value = this.formatValue(input.value);
        this.updateTooltip(input.value);
        this.tooltip?.hide(0);
    }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.updateTooltip(this.el.nativeElement.value, true);
    }

    private formatValue(value: string): string {
        let raw = this.getRawValue(value);

        const firstDotIndex = raw.indexOf('.');
        if (firstDotIndex !== -1) {
            const intPart = raw.slice(0, firstDotIndex);
            const decimalPart = raw.slice(firstDotIndex + 1).replace(/\./g, '').slice(0, 2);
            raw = `${intPart}.${decimalPart}`;
        }

        if (raw.startsWith('.')) {
            raw = `0${raw}`;
        }

        const hasDot = raw.includes('.');
        const [integerPartRaw, decimalPart = ''] = raw.split('.');
        const integerPart = (integerPartRaw || '0').replace(/^0+(?=\d)/, '');

        return hasDot ? `${integerPart}.${decimalPart}` : integerPart;
    }

    private getRawValue(value: string): string {
        return value.replace(/[^\d.]/g, '');
    }

    private updateTooltip(value: string, show = false): void {
        const message = this.toCommaSeparated(value);

        if (this.tooltip) {
            this.tooltip.message = message;
            if (!message) {
                this.tooltip.hide(0);
                return;
            }
            if (show) {
                this.tooltip.show(0);
            }
            return;
        }

        // fallback if matTooltip is not present on the input
        this.el.nativeElement.setAttribute('title', message);
    }

    private toCommaSeparated(value: string): string {
        const normalized = this.formatValue(value);
        if (!normalized) return '';

        const hasTrailingDot = normalized.endsWith('.');
        const [integerPart = '0', decimalPart] = normalized.split('.');
        const integerWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        if (hasTrailingDot) return `${integerWithCommas}.`;
        return decimalPart !== undefined ? `${integerWithCommas}.${decimalPart}` : integerWithCommas;
    }
}