import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Trip, TripExpense } from '../../../models/trip.model';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { TripExpenseService } from '../../../services/trip-expense.service';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { CommonService } from '../../../services/common.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { NumberFormatDirective } from '../../../shared/directives/number-format';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import moment from 'moment';

export type ExpenseDraft = {
    id: string;
    expenseRecordId?: string;
    expenseId: string;
    parentId?: string;
    description: string;
    amount: string;
    date: string;
    attachment?: string;
    attachmentName?: string;
    attachmentUrl?: string;
    isUploading?: boolean;
};

@Component({
    selector: 'app-trip-expenses-manage',
    standalone: true,
    imports: [CommonModule, FormsModule, SaveArea, NumberFormatDirective, MatTooltipModule, MatDatepickerModule, MatNativeDateModule],
    templateUrl: './trip-expenses-manage.html',
})
export class TripExpensesManage {
    private tripExpenseService = inject(TripExpenseService);
    private expenseCategoryService = inject(ExpenseCategoryService);
    private commonService = inject(CommonService);
    private fileUploadService = inject(FileUploadService);

    trip = input<Trip | undefined>();
    close = output();
    saved = output();

    expenseCategories = computed(() =>
        this.expenseCategoryService
            .allCategories()
            .filter((category) => (category.isActive || category.status === 'Active') && category.type === 'TRIP' && !category.parentId)
    );

    expandedCategoryRows = signal<Record<string, boolean>>({});

    loading = computed(() => this.tripExpenseService.loading());
    pendingUploads = signal(0);
    busy = computed(() => this.loading() || this.pendingUploads() > 0);
    error = signal<string | null>(null);
    deletingRowId = signal<string | null>(null);
    successMessage = signal<string | null>(null);
    actionMessage = signal<string | null>(null);

    expenseRows = signal<ExpenseDraft[]>([]);
    today = moment(new Date()).format('YYYY-MM-DD');
    tripDate = computed(() => this.trip()?.tripDate ? moment(new Date(this.trip().tripDate)).format('YYYY-MM-DD') : '');

    private initialExpensesSnapshot = signal<string>('[]');

    hasExpenseChanges = computed(
        () => this.serializeExpenses(this.expenseRows()) !== this.initialExpensesSnapshot()
    );

    constructor() {
        effect(() => {
            this.syncRowsFromTrip(this.trip());
        });
    }

    private serializeExpenses(rows: ExpenseDraft[]): string {
        return JSON.stringify(
            rows.map((row) => ({
                expenseRecordId: row.expenseRecordId ?? '',
                expenseId: row.expenseId ?? '',
                description: (row.description ?? '').trim(),
                amount: this.normalizeAmount(row.amount ?? ''),
                date: row.date ?? '',
                attachment: row.attachment ?? '',
                parentId: row.parentId ?? '',
            }))
        );
    }

    private normalizeAmount(value: string): string {
        return (value || '').replace(/,/g, '').trim();
    }

    async ngOnInit() {
        await this.expenseCategoryService.getAll();
    }

    private createExpenseRow(expenseId?: string, parentId?: string): ExpenseDraft {
        return {
            id: this.commonService.makeid(),
            expenseId: expenseId || '',
            description: '',
            amount: '',
            date: '',
            attachment: undefined,
            attachmentName: undefined,
            attachmentUrl: undefined,
            parentId: parentId,
            isUploading: false,
        };
    }

    private syncRowsFromTrip(trip: Trip | undefined) {
        console.log('trip expenses', trip?.expenses);
        const existing = (trip?.expenses || []).map((expense) => this.mapExpenseToDraft(expense));
        const rows = existing.length > 0 ? existing : [this.createExpenseRow()];
        this.expenseRows.set(rows);
        this.initialExpensesSnapshot.set(this.serializeExpenses(rows));
        void this.hydrateAttachmentUrls(rows);
        this.error.set(null);
    }

    private async hydrateAttachmentUrls(rows: ExpenseDraft[]) {
        const hydratedRows = await Promise.all(
            rows.map(async (row) => ({
                ...row,
                attachmentName: row.attachmentName || this.fileUploadService.getFileName(row.attachment),
                attachmentUrl: row.attachmentUrl || await this.fileUploadService.resolveFileUrl(row.attachment),
            }))
        );

        this.expenseRows.set(hydratedRows);
    }

    private mapExpenseToDraft(expense: TripExpense): ExpenseDraft {
        return {
            id: expense.id,
            expenseRecordId: expense.id,
            expenseId: expense.expenseId || '',
            description: expense.expenseDescription || '',
            amount: String(expense.amount || ''),
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
            attachment: expense.receiptAttachment,
            attachmentName: this.fileUploadService.getFileName(expense.receiptAttachment),
            attachmentUrl: undefined,
            parentId: expense.parentId,
            isUploading: false,
        };
    }

    hasChildCategories(categoryId?: string): boolean {
        if (!categoryId) {
            return false;
        }

        return this.expenseCategoryService
            .allCategories()
            .some((category) => category.type === 'TRIP' && category.parentId === categoryId && (category.isActive || category.status === 'Active'));
    }

    getChildCategories(categoryId?: string) {
        if (!categoryId) {
            return [];
        }

        return this.expenseCategoryService
            .allCategories()
            .filter((category) => category.type === 'TRIP' && category.parentId === categoryId && (category.isActive || category.status === 'Active'));
    }

    getSelectedCategoryId(row: ExpenseDraft): string {
        return row.expenseId;
        // if (row.parentId) {
        //     return row.parentId;
        // }

        // if (!row.expenseId) {
        //     return '';
        // }

        // const category = this.expenseCategoryService.allCategories().find((item) => item.id === row.expenseId);
        // return category?.parentId ?? row.expenseId;
    }

    getSelectedChildCategoryId(row: ExpenseDraft): string {
        return row.expenseId;
    }

    private ensureExpandedChildSelection(rowId: string, parentCategoryId: string) {
        const row = this.expenseRows().find((item) => item.id === rowId);
        if (!row) {
            return;
        }

        const childCategories = this.getChildCategories(parentCategoryId);
        // if (!childCategories.length) {
        //     row.parentId = undefined;
        //     row.expenseId = parentCategoryId;
        //     return;
        // }

        // row.parentId = parentCategoryId;
        // const selectedChildId = row.expenseId;
        // const hasValidChildSelection = !!selectedChildId && childCategories.some((category) => category.id === selectedChildId);

        // if (!hasValidChildSelection) {
        //     row.expenseId = childCategories[0].id;
        // }
    }

    toggleCategoryChildren(rowId: string) {
        const row = this.expenseRows().find((item) => item.id === rowId);
        if (!row) {
            return;
        }

        const parentCategoryId = this.getSelectedCategoryId(row);
        const shouldExpand = !(this.expandedCategoryRows()[rowId] ?? false);

        if (shouldExpand && parentCategoryId) {
            this.ensureExpandedChildSelection(rowId, parentCategoryId);
        }

        this.expandedCategoryRows.update((state) => ({
            ...state,
            [rowId]: shouldExpand,
        }));
    }

    getParentRows() {
        return this.expenseRows().filter((row) => !row.parentId);
    }

    getChildRows(parentRowId: string) {
        return this.expenseRows().filter((row) => row.parentId === parentRowId);
    }

    onParentCategoryChanged(rowId: string, categoryId: string) {
        const row = this.expenseRows().find((item) => item.id === rowId);
        if (!row) {
            return;
        }
        row.expenseId = categoryId;

        const childCategories = this.getChildCategories(categoryId);
        console.log('Child categories for parent', rowId, childCategories);
        for(const child of childCategories) {
            const payload = this.createExpenseRow(child.id, rowId);
            console.log('Adding child expense row for parent category change:', payload);
            this.expenseRows.update((rows) => [...rows, payload]);

        }

        console.log('Updated expense rows after parent category change:', this.getChildRows(rowId));
        // if (childCategories.length > 0) {
        //     row.parentId = categoryId;
        //     row.expenseId = row.expenseId && childCategories.some((category) => category.id === row.expenseId)
        //         ? row.expenseId
        //         : childCategories[0].id;
        // } else {
        //     row.parentId = undefined;
        //     row.expenseId = categoryId;
        // }

        // this.expandedCategoryRows.update((state) => ({
        //     ...state,
        //     [rowId]: childCategories.length > 0,
        // }));
    }

    onChildCategoryChanged(rowId: string, categoryId: string) {
        const row = this.expenseRows().find((item) => item.id === rowId);
        if (!row) {
            return;
        }

        const parentCategoryId = row.parentId ?? this.getSelectedCategoryId(row);
        row.parentId = parentCategoryId || undefined;
        row.expenseId = categoryId;
    }

    addExpenseRow() {
        if (this.busy()) {
            return;
        }
        this.expenseRows.update((rows) => [...rows, this.createExpenseRow()]);
    }

    async removeExpenseRow(rowId: string) {
        const row = this.expenseRows().find((item) => item.id === rowId);
        if (!row) {
            return;
        }

        if (!row.expenseRecordId) {
            this.expenseRows.update((rows) => {
                const updated = rows.filter((item) => item.id !== rowId);
                return updated.length > 0 ? updated : [this.createExpenseRow()];
            });
            return;
        }

        const confirmed = window.confirm('Remove this expense?');
        if (!confirmed) {
            return;
        }

        this.deletingRowId.set(rowId);
        this.error.set(null);
        this.successMessage.set(null);
        this.actionMessage.set('Deleting expense...');

        try {
            await this.tripExpenseService.delete(row.expenseRecordId);
            this.expenseRows.update((rows) => {
                const updated = rows.filter((item) => item.id !== rowId);
                return updated.length > 0 ? updated : [this.createExpenseRow()];
            });
            this.successMessage.set('Expense removed successfully.');
            this.saved.emit();
        } catch (err) {
            this.error.set(String(err || 'Could not remove the expense. Please try again.'));
        } finally {
            this.actionMessage.set(null);
            this.deletingRowId.set(null);
        }
    }

    updateRowField(rowId: string, field: keyof ExpenseDraft, value: string | undefined) {
        this.expenseRows.update((rows) =>
            rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
        );
    }

    toDateValue(value: string | undefined): Date | null {
        if (!value) {
            return null;
        }

        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    toDateString(value: Date | null): string {
        if (!value) {
            return '';
        }

        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, '0');
        const day = `${value.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    onExpenseDateChanged(rowId: string, value: Date | null) {
        this.updateRowField(rowId, 'date', this.toDateString(value));
    }

    private async ensureAttachmentUrl(rowId: string): Promise<string | undefined> {
        const row = this.expenseRows().find((item) => item.id === rowId);
        if (!row?.attachment) {
            return undefined;
        }

        if (row.attachmentUrl) {
            return row.attachmentUrl;
        }

        const resolvedUrl = await this.fileUploadService.resolveFileUrl(row.attachment);
        if (!resolvedUrl) {
            return undefined;
        }

        this.expenseRows.update((rows) =>
            rows.map((item) =>
                item.id === rowId
                    ? {
                        ...item,
                        attachmentUrl: resolvedUrl,
                    }
                    : item
            )
        );

        return resolvedUrl;
    }

    async onExpenseAttachmentSelected(event: Event, rowId: string) {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files[0] ? input.files[0] : undefined;
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.error.set('Only image attachments are allowed.');
            input.value = '';
            return;
        }

        this.error.set(null);
        this.successMessage.set(null);
        this.actionMessage.set(`Uploading ${file.name}...`);
        this.pendingUploads.update((count) => count + 1);
        this.expenseRows.update((rows) =>
            rows.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        attachmentName: file.name,
                        isUploading: true,
                    }
                    : row
            )
        );
        try {
            const uploadedFile = await this.fileUploadService.uploadFile(file);
            this.expenseRows.update((rows) =>
                rows.map((row) =>
                    row.id === rowId
                        ? {
                            ...row,
                            attachment: uploadedFile.filePath,
                            attachmentName: uploadedFile.fileName,
                            attachmentUrl: uploadedFile.fileUrl,
                            isUploading: false,
                        }
                        : row
                )
            );
            this.successMessage.set('Expense attachment uploaded successfully.');
        } catch (err) {
            this.expenseRows.update((rows) =>
                rows.map((row) =>
                    row.id === rowId
                        ? {
                            ...row,
                            isUploading: false,
                        }
                        : row
                )
            );
            this.error.set(String(err || 'Could not upload the attachment. Please try again.'));
        } finally {
            this.pendingUploads.update((count) => Math.max(0, count - 1));
            this.actionMessage.set(null);
            input.value = '';
        }
    }

    async previewAttachment(rowId: string) {
        const url = await this.ensureAttachmentUrl(rowId);
        if (!url) {
            this.error.set('Attachment preview is not available for this expense.');
            return;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
    }

    goBack() {
        this.close.emit();
    }

    private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
        const start = Date.now();
        while (this.loading() && Date.now() - start < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    async onSubmit() {
        const trip = this.trip();
        if (!trip?.id) {
            this.error.set('Trip not found.');
            return;
        }

        if (this.pendingUploads() > 0) {
            this.error.set('Wait for expense attachments to finish uploading before saving expenses.');
            return;
        }

        this.error.set(null);
        this.successMessage.set(null);
        this.actionMessage.set('Saving expenses...');
        const rowsToSave = this.expenseRows().filter((row) => row.expenseId);

        try {
            await Promise.all(
                rowsToSave.map((row) => {
                    const parsedAmount = row.amount ? Number(row.amount) : undefined;
                    const amount = parsedAmount !== undefined && !Number.isNaN(parsedAmount) ? parsedAmount : undefined;
                    

                    if (row.expenseRecordId) {
                        return this.tripExpenseService.update(row.expenseRecordId, {
                            tripId: trip.id,
                            expenseId: row.expenseId,
                            parentId: row.parentId,
                            expenseDescription: row.description || undefined,
                            amount,
                            date: row.date || undefined,
                            receiptAttachment: row.attachment || undefined,
                        });
                    }

                    return this.tripExpenseService.create({
                        id: row.id,
                        tripId: trip.id,
                        expenseId: row.expenseId,
                        parentId: row.parentId,
                        expenseDescription: row.description || undefined,
                        amount,
                        date: row.date || undefined,
                        receiptAttachment: row.attachment || undefined,
                    });
                })
            );
            this.initialExpensesSnapshot.set(this.serializeExpenses(this.expenseRows()));
            this.successMessage.set('Trip expenses saved successfully.');
            this.saved.emit();
            await this.waitForLoadingToFinish();
            this.close.emit();
        } catch (err) {
            this.error.set(String(err || 'Could not save expenses. Please review the entries and try again.'));
        } finally {
            this.actionMessage.set(null);
        }
    }
}
