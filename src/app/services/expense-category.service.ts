import { Injectable, signal, computed } from '@angular/core';
import { ExpenseCategory } from '../models/expense-category.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

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

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  /**
   * Get all categories
   */
  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const categories = await this.http.get<ExpenseCategory[]>('expenses');
      this.categories.set(
        categories.map((category) => ({
          ...category,
          isActive: category.isActive ?? category.status === 'Active',
          status: category.isActive || category.status === 'Active' ? 'Active' : 'Inactive',
        }))
      );
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch expense categories');
      console.error('Failed to fetch expense categories', err);
    } finally {
      this.isLoading.set(false);
    }
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
  async create(name: string, description?: string, category?: string, isActive?: boolean): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const payload = {
        id: this.commonService.makeid(),
        name,
        category: category || 'GENERAL',
        description: description || '',
        isActive: isActive ?? true
      };
      
      await this.http.post('expenses', payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create category');
      console.error('Failed to create category', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update an existing category
   */
  async update(id: string, name: string, description?: string, category?: string, isActive?: boolean): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existingCategory = this.getById(id);
      const payload = {
        id,
        name,
        category: category || existingCategory?.category || 'GENERAL',
        description: description ?? existingCategory?.description ?? '',
        isActive: isActive !== undefined ? isActive : (existingCategory?.isActive ?? true)
      };
      
      await this.http.put('expenses', payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update category');
      console.error('Failed to update category', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`expenses/${id}`);
      this.categories.update((cats) => cats.filter((c) => c.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete category');
      console.error('Failed to delete category', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string): Promise<void> {
    const category = this.getById(id);
    if (category) {
      await this.update(id, category.name, category.description, category.category, !category.isActive);
    }
  }
}
