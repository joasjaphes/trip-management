import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Trip, TripExpense } from '../../../models/trip.model';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { TripExpenseService } from '../../../services/trip-expense.service';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { CommonService } from '../../../services/common.service';

type ExpenseDraft = {
    id: string;
    expenseRecordId?: string;
    expenseId: string;
    description: string;
    amount: string;
    date: string;
    attachment?: string;
};

@Component({
    selector: 'app-trip-expenses-manage',
    standalone: true,
    imports: [CommonModule, FormsModule, SaveArea],
    templateUrl: './trip-expenses-manage.html',
})
export class TripExpensesManage {
    private tripExpenseService = inject(TripExpenseService);
    private expenseCategoryService = inject(ExpenseCategoryService);
    private commonService = inject(CommonService)

    trip = input<Trip | undefined>();
    close = output();
    saved = output();

    expenseCategories = computed(() =>
        this.expenseCategoryService
            .allCategories()
            .filter((category) => category.isActive || category.status === 'Active')
    );

    loading = computed(() => this.tripExpenseService.loading());
    error = signal<string | null>(null);
    deletingRowId = signal<string | null>(null);
    successMessage = signal<string | null>(null);
    actionMessage = signal<string | null>(null);

    expenseRows = signal<ExpenseDraft[]>([]);

    constructor() {
        effect(() => {
            this.syncRowsFromTrip(this.trip());
        });
    }

    async ngOnInit() {
        await this.expenseCategoryService.getAll();
    }

    private createExpenseRow(): ExpenseDraft {
        return {
            id: this.commonService.makeid(),
            expenseId: '',
            description: '',
            amount: '',
            date: '',
            attachment: undefined,
        };
    }

    private syncRowsFromTrip(trip: Trip | undefined) {
        const existing = (trip?.expenses || []).map((expense) => this.mapExpenseToDraft(expense));
        this.expenseRows.set(existing.length > 0 ? existing : [this.createExpenseRow()]);
        this.error.set(null);
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
        };
    }

    addExpenseRow() {
        if (this.loading()) {
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

    onExpenseAttachmentSelected(event: Event, rowId: string) {
        const input = event.target as HTMLInputElement;
        const fileName = input.files && input.files[0] ? input.files[0].name : undefined;
        this.updateRowField(rowId, 'attachment', fileName);
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
                            expenseDescription: row.description || undefined,
                            amount,
                            date: row.date || undefined,
                            receiptAttachment: row.attachment || undefined,
                        });
                    }

                    return this.tripExpenseService.create({
                        tripId: trip.id,
                        expenseId: row.expenseId,
                        expenseDescription: row.description || undefined,
                        amount,
                        date: row.date || undefined,
                        receiptAttachment: row.attachment || undefined,
                    });
                })
            );

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
