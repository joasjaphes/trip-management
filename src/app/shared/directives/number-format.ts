import { Directive, ElementRef, HostListener, OnInit, inject, model } from '@angular/core';

@Directive({
    selector: 'input[appNumberFormat]',
    standalone: true,
})
export class NumberFormatDirective implements OnInit {
    private readonly el = inject(ElementRef<HTMLInputElement>);
    ngOnInit(): void {
        const input = this.el.nativeElement;
        input.setAttribute('inputmode', 'decimal');
        input.setAttribute('autocomplete', 'off');

        // Format initial value if present
        if (input.value) {
            input.value = this.formatValue(input.value);
        }
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        const allowedKeys = [
            'Backspace',
            'Delete',
            'Tab',
            'Escape',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
            'Home',
            'End',
        ];

        if (
            allowedKeys.includes(event.key) ||
            event.ctrlKey ||
            event.metaKey
        ) {
            return;
        }

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

    @HostListener('input')
    onInput(): void {
        const input = this.el.nativeElement;
        const formatted = this.formatValue(input.value);
        input.value = formatted;
    }

    @HostListener('blur')
    onBlur(): void {
        const input = this.el.nativeElement;
        input.value = this.formatValue(input.value);
    }

    private formatValue(value: string): string {
        // Remove any non-digit/non-dot chars
        let raw = this.getRawValue(value);

        // Keep only first dot
        const firstDotIndex = raw.indexOf('.');
        if (firstDotIndex !== -1) {
            const intPart = raw.slice(0, firstDotIndex);
            const decimalPart = raw.slice(firstDotIndex + 1).replace(/\./g, '').slice(0, 2);
            raw = `${intPart}.${decimalPart}`;
        }

        // Handle leading dot: ".5" => "0.5"
        if (raw.startsWith('.')) {
            raw = `0${raw}`;
        }

        const hasDot = raw.includes('.');
        const [integerPartRaw, decimalPart = ''] = raw.split('.');

        const integerPart = (integerPartRaw || '0')
            .replace(/^0+(?=\d)/, '');

        return hasDot ? `${integerPart}.${decimalPart}` : integerPart;
    }

    private getRawValue(value: string): string {
        return value.replace(/[^\d.]/g, '');
    }
}