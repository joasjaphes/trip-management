import { Injectable, signal, computed } from '@angular/core';
import { ExpenseCategory } from '../models/expense-category.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseCategoryService {
  // State
  private categories = signal<ExpenseCategory[]>([]);

  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Public readonly signals
  readonly allCategories = this.categories.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed values
  readonly activeCategoriesCount = computed(
    () => this.categories().filter((c) => c.isActive).length
  );

  constructor() {}

  /**
   * Get all categories
   */
  getAll(): ExpenseCategory[] {
    return this.categories();
  }

  /**
   * Get category by ID
   */
  getById(id: string): ExpenseCategory | undefined {
    return this.categories().find((c) => c.id === id);
  }

  /**
   * Create a new category
   */
  create(name: string, description?: string, category?: string, isActive?: boolean): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Simulate API delay
      setTimeout(() => {
        const newCategory: ExpenseCategory = {
          id: `cat-${Date.now()}`,
          name,
          category: category || 'GENERAL', // Default category value
          description: description || '',
          status: isActive ? 'Active' : 'Inactive',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.categories.update((cats) => [...cats, newCategory]);
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to create category');
      this.isLoading.set(false);
    }
  }

  /**
   * Update an existing category
   */
  update(id: string, name: string, description?: string, isActive?: boolean): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.categories.update((cats) =>
          cats.map((cat) =>
            cat.id === id
              ? {
                  ...cat,
                  name,
                  description: description ?? cat.description,
                  isActive: isActive !== undefined ? isActive : cat.isActive,
                  updatedAt: new Date(),
                }
              : cat
          )
        );
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to update category');
      this.isLoading.set(false);
    }
  }

  /**
   * Delete a category
   */
  delete(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.categories.update((cats) => cats.filter((c) => c.id !== id));
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to delete category');
      this.isLoading.set(false);
    }
  }

  /**
   * Toggle active status
   */
  toggleActive(id: string): void {
    const category = this.getById(id);
    if (category) {
      this.update(id, category.name, category.description, !category.isActive);
    }
  }
}
