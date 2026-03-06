import { Injectable, signal, computed } from '@angular/core';
import { ExpenseCategory } from '../models/expense-category.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseCategoryService {
  // State
  private categories = signal<ExpenseCategory[]>([
    {
      id: 'cat-001',
      name: 'Accommodation',
      description: 'Hotel, hostel, and lodging expenses',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'cat-002',
      name: 'Transportation',
      description: 'Flights, trains, buses, and car rentals',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'cat-003',
      name: 'Food & Dining',
      description: 'Restaurant meals and groceries',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 'cat-004',
      name: 'Activities & Entertainment',
      description: 'Tours, attractions, and entertainment',
      isActive: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-15'),
    },
    {
      id: 'cat-005',
      name: 'Shopping',
      description: 'Souvenirs, clothes, and retail purchases',
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-28'),
    },
    {
      id: 'cat-006',
      name: 'Utilities & Services',
      description: 'Internet, laundry, and other services',
      isActive: true,
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-03-02'),
    },
    {
      id: 'cat-007',
      name: 'Insurance',
      description: 'Travel and health insurance',
      isActive: false,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
    },
    {
      id: 'cat-008',
      name: 'Tips & Gratuities',
      description: 'Tips for service providers',
      isActive: true,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-25'),
    },
  ]);

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
  create(name: string, description?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Simulate API delay
      setTimeout(() => {
        const newCategory: ExpenseCategory = {
          id: `cat-${Date.now()}`,
          name,
          description: description || '',
          isActive: true,
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
